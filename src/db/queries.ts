import { eq, and, desc, sql, ilike, gte, lte, asc, or, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import {
  models,
  pricingTiers,
  priceChangeLogs,
  providers,
  usageScenarios,
} from "@/db/schema";
import type {
  ModelFilters,
  ModelWithPricing,
  PriceHistoryResponse,
  IngestionStatus,
  ComparisonData,
  SortField,
  Provider,
  UsageScenario,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// All models (with current pricing + provider)
// ---------------------------------------------------------------------------

export async function getAllModels(): Promise<ModelWithPricing[]> {
  const rows = await db
    .select({
      model: models,
      provider: providers,
      currentPricing: pricingTiers,
    })
    .from(models)
    .innerJoin(providers, eq(models.providerId, providers.id))
    .leftJoin(
      pricingTiers,
      and(
        eq(pricingTiers.modelId, models.id),
        eq(pricingTiers.isCurrent, true),
      ),
    )
    .where(eq(models.isActive, true))
    .orderBy(asc(models.name));

  return rows.map((row) => ({
    model: row.model,
    provider: row.provider,
    currentPricing: row.currentPricing ?? null,
  }));
}

// ---------------------------------------------------------------------------
// Filtered + sorted models
// ---------------------------------------------------------------------------

export async function getFilteredModels(
  filters: ModelFilters = {},
  sort: SortField = "name",
  direction: "asc" | "desc" = "asc",
): Promise<ModelWithPricing[]> {
  // Build conditions array
  const conditions = [eq(models.isActive, true)];

  if (filters.provider) {
    conditions.push(eq(providers.slug, filters.provider));
  }

  if (filters.modality) {
    // Use array contains for text[] modality column
    conditions.push(sql`${models.modality} @> ARRAY[${filters.modality}]::text[]`);
  }

  if (filters.minContextWindow) {
    conditions.push(gte(models.contextWindow, filters.minContextWindow));
  }

  if (filters.maxContextWindow) {
    conditions.push(lte(models.contextWindow, filters.maxContextWindow));
  }

  if (filters.supportsFunctionCalling !== undefined) {
    conditions.push(eq(models.supportsFunctionCalling, filters.supportsFunctionCalling));
  }

  if (filters.minInputPrice) {
    conditions.push(
      gte(pricingTiers.inputPricePerMillion, filters.minInputPrice.toString()),
    );
  }

  if (filters.maxInputPrice) {
    conditions.push(
      lte(pricingTiers.inputPricePerMillion, filters.maxInputPrice.toString()),
    );
  }

  if (filters.search) {
    const searchPattern = `%${filters.search}%`;
    conditions.push(
      or(
        ilike(models.name, searchPattern),
        ilike(models.slug, searchPattern),
        ilike(providers.name, searchPattern),
        ilike(models.openrouterModelId, searchPattern),
      )!,
    );
  }

  // Determine sort column
  const sortColumn = getSortColumn(sort);
  const orderFn = direction === "asc" ? asc : desc;

  const rows = await db
    .select({
      model: models,
      provider: providers,
      currentPricing: pricingTiers,
    })
    .from(models)
    .innerJoin(providers, eq(models.providerId, providers.id))
    .leftJoin(
      pricingTiers,
      and(
        eq(pricingTiers.modelId, models.id),
        eq(pricingTiers.isCurrent, true),
      ),
    )
    .where(and(...conditions));

  let result = rows.map((row) => ({
    model: row.model,
    provider: row.provider,
    currentPricing: row.currentPricing ?? null,
  }));

  // Post-query sort for allInCost (computed: input + output price)
  if (sort === "allInCost") {
    result.sort((a, b) => {
      const aCost = Number(a.currentPricing?.inputPricePerMillion ?? 0) + Number(a.currentPricing?.outputPricePerMillion ?? 0);
      const bCost = Number(b.currentPricing?.inputPricePerMillion ?? 0) + Number(b.currentPricing?.outputPricePerMillion ?? 0);
      return direction === "asc" ? aCost - bCost : bCost - aCost;
    });
  }

  return result;
}

function getSortColumn(sort: SortField) {
  switch (sort) {
    case "inputPrice":
      return pricingTiers.inputPricePerMillion;
    case "outputPrice":
      return pricingTiers.outputPricePerMillion;
    case "contextWindow":
      return models.contextWindow;
    case "provider":
      return providers.name;
    case "allInCost":
      // allInCost is computed post-query (input + output), sort there
      return models.name; // placeholder, actual sort happens in getFilteredModels
    case "name":
    default:
      return models.name;
  }
}

// ---------------------------------------------------------------------------
// Single model by slug
// ---------------------------------------------------------------------------

export async function getModelBySlug(slug: string): Promise<ModelWithPricing | null> {
  const rows = await db
    .select({
      model: models,
      provider: providers,
      currentPricing: pricingTiers,
    })
    .from(models)
    .innerJoin(providers, eq(models.providerId, providers.id))
    .leftJoin(
      pricingTiers,
      and(
        eq(pricingTiers.modelId, models.id),
        eq(pricingTiers.isCurrent, true),
      ),
    )
    .where(eq(models.slug, slug))
    .limit(1);

  if (rows.length === 0) return null;

  const row = rows[0]!;
  return {
    model: row.model,
    provider: row.provider,
    currentPricing: row.currentPricing ?? null,
  };
}

// ---------------------------------------------------------------------------
// Comparison data (multiple models by slug)
// ---------------------------------------------------------------------------

export async function getComparisonData(slugs: string[]): Promise<ComparisonData> {
  if (slugs.length === 0) {
    return { models: [] };
  }

  const rows = await db
    .select({
      model: models,
      provider: providers,
      currentPricing: pricingTiers,
    })
    .from(models)
    .innerJoin(providers, eq(models.providerId, providers.id))
    .leftJoin(
      pricingTiers,
      and(
        eq(pricingTiers.modelId, models.id),
        eq(pricingTiers.isCurrent, true),
      ),
    )
    .where(inArray(models.slug, slugs));

  return {
    models: rows.map((row) => ({
      model: row.model,
      provider: row.provider,
      currentPricing: row.currentPricing ?? null,
    })),
  };
}

// ---------------------------------------------------------------------------
// Price history for a model
// ---------------------------------------------------------------------------

export async function getPriceHistory(
  modelId: string,
): Promise<PriceHistoryResponse> {
  const history = await db
    .select({
      fieldChanged: priceChangeLogs.fieldChanged,
      oldValue: priceChangeLogs.oldValue,
      newValue: priceChangeLogs.newValue,
      detectedAt: priceChangeLogs.detectedAt,
      source: priceChangeLogs.source,
    })
    .from(priceChangeLogs)
    .where(eq(priceChangeLogs.modelId, modelId))
    .orderBy(desc(priceChangeLogs.detectedAt))
    .limit(100);

  return {
    modelId,
    history: history.map((row) => ({
      fieldChanged: row.fieldChanged,
      oldValue: row.oldValue,
      newValue: row.newValue,
      detectedAt: row.detectedAt,
      source: row.source,
    })),
  };
}

// ---------------------------------------------------------------------------
// Ingestion status (for homepage / trust indicators)
// ---------------------------------------------------------------------------

export async function getIngestionStatus(): Promise<IngestionStatus> {
  const [totalModelsRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(models);

  const [activeModelsRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(models)
    .where(eq(models.isActive, true));

  const [totalProvidersRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(providers);

  // Recent price changes (last 24 hours)
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [recentChangesRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(priceChangeLogs)
    .where(gte(priceChangeLogs.detectedAt, twentyFourHoursAgo));

  // Most recent model update timestamp as "last run"
  const [lastUpdateRow] = await db
    .select({ updatedAt: models.updatedAt })
    .from(models)
    .orderBy(desc(models.updatedAt))
    .limit(1);

  return {
    lastRun: lastUpdateRow?.updatedAt ?? null,
    totalModels: totalModelsRow?.count ?? 0,
    totalProviders: totalProvidersRow?.count ?? 0,
    activeModels: activeModelsRow?.count ?? 0,
    recentPriceChanges: recentChangesRow?.count ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Usage scenarios
// ---------------------------------------------------------------------------

export async function getScenarios(): Promise<UsageScenario[]> {
  const scenarios = await db
    .select()
    .from(usageScenarios)
    .orderBy(asc(usageScenarios.sortOrder));

  return scenarios;
}

// ---------------------------------------------------------------------------
// All model slugs (for static generation / sitemap)
// ---------------------------------------------------------------------------

export async function getAllModelSlugs(): Promise<{ slug: string }[]> {
  const rows = await db
    .select({ slug: models.slug })
    .from(models)
    .where(eq(models.isActive, true));

  return rows.map((row) => ({ slug: row.slug }));
}

// ---------------------------------------------------------------------------
// All providers (for filter dropdown)
// ---------------------------------------------------------------------------

export async function getProviders(): Promise<Provider[]> {
  const rows = await db
    .select()
    .from(providers)
    .orderBy(asc(providers.name));

  return rows;
}

// ---------------------------------------------------------------------------
// Featured scenarios (for homepage)
// ---------------------------------------------------------------------------

export async function getFeaturedScenarios(): Promise<UsageScenario[]> {
  const rows = await db
    .select()
    .from(usageScenarios)
    .where(eq(usageScenarios.isFeatured, true))
    .orderBy(asc(usageScenarios.sortOrder));

  return rows;
}

// ---------------------------------------------------------------------------
// Total model count (for homepage hero)
// ---------------------------------------------------------------------------

export async function getTotalModelCount(): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(models)
    .where(eq(models.isActive, true));

  return row?.count ?? 0;
}

// ---------------------------------------------------------------------------
// Paginated, filtered models (for models page + API)
// ---------------------------------------------------------------------------

export interface ModelListResult {
  models: ModelWithPricing[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function getModels(
  filters: {
    provider?: string;
    modality?: string;
    sort?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {},
): Promise<ModelListResult> {
  const page = filters.page ?? 1;
  const pageSize = filters.limit ?? 50;

  // Map sort string to SortField + direction
  let sortField: SortField = "name";
  let direction: "asc" | "desc" = "asc";
  if (filters.sort) {
    const parts = filters.sort.split("-");
    const fieldMap: Record<string, SortField> = {
      name: "name",
      input: "inputPrice",
      output: "outputPrice",
      context: "contextWindow",
      provider: "provider",
      allIn: "allInCost",
      rank: "allInCost", // rank is just allInCost ascending
    };
    sortField = fieldMap[parts[0]] ?? "name";
    direction = parts[1] === "desc" ? "desc" : "asc";
  }

  const modelFilters: ModelFilters = {};
  if (filters.provider) modelFilters.provider = filters.provider;
  if (filters.modality) modelFilters.modality = filters.modality;
  if (filters.search) modelFilters.search = filters.search;

  // getFilteredModels already applies all filters + sort, returns the full
  // filtered set. We paginate from that — no need for a separate count query
  // (which would need to replicate all the same WHERE conditions).
  const allModels = await getFilteredModels(modelFilters, sortField, direction);

  const total = allModels.length;
  // Clamp page to valid range (e.g. if search returns fewer pages than current)
  const clampedPage = Math.min(page, Math.max(1, Math.ceil(total / pageSize)));
  const start = (clampedPage - 1) * pageSize;
  const paged = allModels.slice(start, start + pageSize);

  return {
    models: paged,
    total,
    page: clampedPage,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
