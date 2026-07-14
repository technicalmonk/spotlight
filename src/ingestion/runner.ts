import { eq, and } from "drizzle-orm";
import { db } from "@/db/client";
import {
  models,
  pricingTiers,
  priceChangeLogs,
  providers,
} from "@/db/schema";
import {
  fetchOpenRouterModels,
} from "./openrouter";
import { normalizeOpenRouterData } from "./normalizer";
import { detectPriceChanges } from "./diff-detector";
import type { IngestionSummary, PriceChange } from "@/lib/types";

// ---------------------------------------------------------------------------
// Main ingestion orchestrator
// ---------------------------------------------------------------------------

/**
 * Run a full ingestion cycle:
 *   1. Fetch models from OpenRouter
 *   2. Normalize into providers + models + pricing
 *   3. For each model:
 *      a. Upsert provider (auto-discover new providers)
 *      b. Upsert model
 *      c. Detect price changes vs. current pricing tier
 *      d. Insert new pricing tier if prices changed (or model is new)
 *      e. Log detected price changes
 *   4. Return summary
 *
 * @returns Ingestion summary with counts and any errors.
 */
export async function runIngestion(): Promise<IngestionSummary> {
  const summary: IngestionSummary = {
    providersAdded: 0,
    modelsAdded: 0,
    modelsUpdated: 0,
    priceChangesDetected: 0,
    errors: [],
    totalProcessed: 0,
  };

  try {
    // Step 1: Fetch from OpenRouter
    const rawModels = await fetchOpenRouterModels();
    summary.totalProcessed = rawModels.length;

    // Step 2: Normalize
    const normalized = normalizeOpenRouterData(rawModels);

    // Step 3: Upsert providers
    const providerIdMap = await upsertProviders(
      normalized.providers,
      summary,
    );

    // Step 4: Upsert models + pricing
    for (const normModel of normalized.models) {
      try {
        await upsertModel(normModel, providerIdMap, summary);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        summary.errors.push(`Model ${normModel.openrouterModelId}: ${msg}`);
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    summary.errors.push(`Fatal ingestion error: ${msg}`);
  }

  return summary;
}

// ---------------------------------------------------------------------------
// Provider upsert
// ---------------------------------------------------------------------------

/**
 * Upsert all providers, returning a map of openrouterPrefix → provider UUID.
 *
 * New providers are inserted; existing providers are updated (name only, to
 * catch display name improvements).
 */
async function upsertProviders(
  normProviders: { name: string; slug: string; openrouterPrefix: string }[],
  summary: IngestionSummary,
): Promise<Map<string, string>> {
  const idMap = new Map<string, string>();

  for (const np of normProviders) {
    // Check if provider exists by openrouter_prefix
    const existing = await db
      .select({ id: providers.id, name: providers.name })
      .from(providers)
      .where(eq(providers.openrouterPrefix, np.openrouterPrefix))
      .limit(1);

    if (existing.length > 0) {
      // Update name if it changed (display name improvements)
      if (existing[0]!.name !== np.name) {
        await db
          .update(providers)
          .set({ name: np.name, updatedAt: new Date() })
          .where(eq(providers.id, existing[0]!.id));
      }
      idMap.set(np.openrouterPrefix, existing[0]!.id);
    } else {
      // Insert new provider
      const [inserted] = await db
        .insert(providers)
        .values({
          name: np.name,
          slug: np.slug,
          openrouterPrefix: np.openrouterPrefix,
        })
        .returning({ id: providers.id });
      idMap.set(np.openrouterPrefix, inserted!.id);
      summary.providersAdded++;
    }
  }

  return idMap;
}

// ---------------------------------------------------------------------------
// Model + pricing upsert
// ---------------------------------------------------------------------------

interface NormalizedModelForUpsert {
  providerSlug: string;
  name: string;
  slug: string;
  openrouterModelId: string;
  modality: string[];
  contextWindow: number;
  maxOutputTokens: number | null;
  supportsFunctionCalling: boolean;
  supportsStreaming: boolean;
  supportsStructuredOutput: boolean;
  releaseDate: string | null;
  pricing: {
    inputPricePerMillion: number;
    outputPricePerMillion: number;
    batchInputPricePerMillion: number | null;
    batchOutputPricePerMillion: number | null;
    cacheReadPricePerMillion: number | null;
    cacheWritePricePerMillion: number | null;
    webSearchPrice: number | null;
  };
}

async function upsertModel(
  normModel: NormalizedModelForUpsert,
  providerIdMap: Map<string, string>,
  summary: IngestionSummary,
): Promise<void> {
  const providerId = providerIdMap.get(normModel.providerSlug);
  if (!providerId) {
    summary.errors.push(
      `No provider ID found for slug "${normModel.providerSlug}" (model: ${normModel.openrouterModelId})`,
    );
    return;
  }

  // Check if model exists by openrouter_model_id
  const existing = await db
    .select()
    .from(models)
    .where(eq(models.openrouterModelId, normModel.openrouterModelId))
    .limit(1);

  let modelId: string;
  let isNewModel = false;

  if (existing.length > 0) {
    modelId = existing[0]!.id;

    // Update model fields
    await db
      .update(models)
      .set({
        name: normModel.name,
        slug: normModel.slug,
        providerId,
        modality: normModel.modality,
        contextWindow: normModel.contextWindow,
        maxOutputTokens: normModel.maxOutputTokens,
        supportsFunctionCalling: normModel.supportsFunctionCalling,
        supportsStreaming: normModel.supportsStreaming,
        supportsStructuredOutput: normModel.supportsStructuredOutput,
        releaseDate: normModel.releaseDate,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(models.id, modelId));

    summary.modelsUpdated++;
  } else {
    // Insert new model (skip if slug already exists from another provider)
    const inserted = await db
      .insert(models)
      .values({
        providerId,
        name: normModel.name,
        slug: normModel.slug,
        openrouterModelId: normModel.openrouterModelId,
        modality: normModel.modality,
        contextWindow: normModel.contextWindow,
        maxOutputTokens: normModel.maxOutputTokens,
        supportsFunctionCalling: normModel.supportsFunctionCalling,
        supportsStreaming: normModel.supportsStreaming,
        supportsStructuredOutput: normModel.supportsStructuredOutput,
        releaseDate: normModel.releaseDate,
        isActive: true,
      })
      .returning({ id: models.id })
      .onConflictDoNothing({ target: models.slug });

    if (inserted.length === 0) {
      // Slug conflict — skip this model
      summary.errors.push(
        `Model ${normModel.openrouterModelId}: slug "${normModel.slug}" already exists (likely a duplicate name from another provider)`,
      );
      return;
    }
    modelId = inserted[0]!.id;
    summary.modelsAdded++;
    isNewModel = true;
  }

  // Fetch current pricing tier
  const currentTiers = await db
    .select()
    .from(pricingTiers)
    .where(
      and(
        eq(pricingTiers.modelId, modelId),
        eq(pricingTiers.isCurrent, true),
      ),
    )
    .limit(1);

  const currentTier = currentTiers[0] ?? null;

  // Detect price changes (only for existing models with previous pricing)
  let priceChanges: PriceChange[] = [];
  if (!isNewModel && currentTier) {
    priceChanges = detectPriceChanges(modelId, currentTier, normModel.pricing);
  }

  // Determine if we need to create a new pricing tier
  const hasPriceChanges = priceChanges.length > 0;
  const hasNoCurrentPricing = !currentTier;

  if (hasPriceChanges || hasNoCurrentPricing) {
    // Mark old tier as not current
    if (currentTier) {
      await db
        .update(pricingTiers)
        .set({ isCurrent: false })
        .where(eq(pricingTiers.id, currentTier.id));
    }

    // Insert new current tier
    await db.insert(pricingTiers).values({
      modelId,
      effectiveDate: new Date().toISOString().split("T")[0]!,
      inputPricePerMillion: normModel.pricing.inputPricePerMillion.toString(),
      outputPricePerMillion: normModel.pricing.outputPricePerMillion.toString(),
      batchInputPricePerMillion: normModel.pricing.batchInputPricePerMillion?.toString() ?? null,
      batchOutputPricePerMillion: normModel.pricing.batchOutputPricePerMillion?.toString() ?? null,
      cacheReadPricePerMillion: normModel.pricing.cacheReadPricePerMillion?.toString() ?? null,
      cacheWritePricePerMillion: normModel.pricing.cacheWritePricePerMillion?.toString() ?? null,
      webSearchPrice: normModel.pricing.webSearchPrice?.toString() ?? null,
      isCurrent: true,
      source: "openrouter_api",
    });
  }

  // Log price changes
  if (priceChanges.length > 0) {
    await db.insert(priceChangeLogs).values(
      priceChanges.map((change) => ({
        modelId,
        fieldChanged: change.fieldChanged,
        oldValue: change.oldValue.toString(),
        newValue: change.newValue.toString(),
        source: "openrouter_api",
      })),
    );
    summary.priceChangesDetected += priceChanges.length;
  }
}

// ---------------------------------------------------------------------------
// Mark missing models as inactive
// ---------------------------------------------------------------------------

/**
 * After ingestion, mark models that are no longer in the OpenRouter response
 * as inactive. This handles deprecation/removal.
 *
 * @param activeModelIds - Set of openrouter_model_id values from the latest fetch.
 */
export async function markInactiveModels(
  activeModelIds: Set<string>,
): Promise<number> {
  const allModels = await db
    .select({ id: models.id, openrouterModelId: models.openrouterModelId })
    .from(models)
    .where(eq(models.isActive, true));

  let deactivatedCount = 0;

  for (const model of allModels) {
    if (model.openrouterModelId && !activeModelIds.has(model.openrouterModelId)) {
      await db
        .update(models)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(models.id, model.id));
      deactivatedCount++;
    }
  }

  return deactivatedCount;
}
