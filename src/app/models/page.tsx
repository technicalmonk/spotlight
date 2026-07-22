import { ModelTable } from "@/components/models/model-table";
import { ModelFilters } from "@/components/models/model-filters";
import { ModelCard } from "@/components/models/model-card";
import { getModels, getProviders, getAllModels } from "@/db/queries";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Models — Spotlight",
  description: "Browse and compare LLM models by provider, modality, and price.",
};

interface ModelsPageProps {
  searchParams: Promise<{
    provider?: string;
    modality?: string;
    sort?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function ModelsPage({ searchParams }: ModelsPageProps) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page) : 1;
  const sort = params.sort ?? "name-desc";

  const [result, providers, allModels] = await Promise.all([
    getModels({
      provider: params.provider,
      modality: params.modality,
      sort,
      search: params.search,
      page,
      limit: 50,
    }).catch(() => ({
      models: [],
      total: 0,
      page: 1,
      pageSize: 50,
      totalPages: 0,
    })),
    getProviders().catch(() => []),
    getAllModels().catch(() => []),
  ]);

  // Compute global cost rank across ALL models (not just current page)
  const globalRankMap = new Map<string, number>();
  const sortedByCost = [...allModels]
    .map((m) => {
      const input = Number(m.currentPricing?.inputPricePerMillion ?? 0);
      const output = Number(m.currentPricing?.outputPricePerMillion ?? 0);
      return { id: m.model.id, allIn: input + output };
    })
    .sort((a, b) => a.allIn - b.allIn);
  sortedByCost.forEach((item, i) => globalRankMap.set(item.id, i + 1));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
          EXPLORE
        </div>
        <h1 className="mt-3 text-3xl font-bold text-ink-900">Model Explorer</h1>
        <p className="mt-2 text-gray-500">
          {result.total} models from {providers.length} providers. Filter,
          sort, and explore.
        </p>
      </div>

      <ModelFilters providers={providers} />

      {/* Desktop: table */}
      <div className="hidden sm:block">
        <ModelTable models={result.models} globalRankMap={globalRankMap} currentSort={sort} />
      </div>

      {/* Mobile: cards */}
      <div className="grid grid-cols-1 gap-3 sm:hidden">
        {result.models.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-gray-500 shadow-sm">
            No models found. Try adjusting your filters.
          </div>
        ) : (
          result.models.map((model) => (
            <ModelCard key={model.model.id} model={model} />
          ))
        )}
      </div>

      {/* Pagination */}
      {result.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {Array.from({ length: result.totalPages }, (_, i) => i + 1).map(
            (p) => (
              <a
                key={p}
                href={`/models?page=${p}${params.provider ? `&provider=${params.provider}` : ""}${params.modality ? `&modality=${params.modality}` : ""}${params.sort ? `&sort=${params.sort}` : ""}${params.search ? `&search=${params.search}` : ""}`}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  p === page
                    ? "bg-brand-600 text-white"
                    : "border border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {p}
              </a>
            )
          )}
        </div>
      )}
    </div>
  );
}
