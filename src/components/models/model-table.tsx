import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, Check, X } from "lucide-react";
import type { ModelWithPricing } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { benchmarkModels } from "@/lib/benchmarks";
import { useMemo } from "react";

interface ModelTableProps {
  models: ModelWithPricing[];
}

// Set of slugs available in WorkBench (from benchmarks data)
const workbenchSlugs = new Set(benchmarkModels.filter(m => m.inWorkBench).map(m => m.slug));

export function ModelTable({ models }: ModelTableProps) {
  // Calculate "all-in" cost (input + output per 1M tokens) and rank
  const ranked = useMemo(() => {
    const withCost = models.map((entry) => {
      const input = Number(entry.currentPricing?.inputPricePerMillion ?? 0);
      const output = Number(entry.currentPricing?.outputPricePerMillion ?? 0);
      const allIn = input + output;
      return { entry, allIn, input, output };
    });
    // Sort by all-in cost for ranking
    const sorted = [...withCost].sort((a, b) => a.allIn - b.allIn);
    const rankMap = new Map<string, number>();
    sorted.forEach((item, i) => {
      rankMap.set(item.entry.model.id, i + 1);
    });
    return withCost.map((item) => ({
      ...item,
      rank: rankMap.get(item.entry.model.id) ?? 0,
    }));
  }, [models]);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50/80">
            <tr className="text-left">
              <th className="px-4 py-3.5 font-semibold text-gray-700">Name</th>
              <th className="hidden px-4 py-3.5 font-semibold text-gray-700 md:table-cell">Provider</th>
              <th className="px-4 py-3.5 text-center font-semibold text-gray-700">
                <span className="hidden sm:inline">Cost Rank</span>
                <span className="sm:hidden">#</span>
              </th>
              <th className="px-4 py-3.5 text-right font-semibold text-gray-700">
                <span className="hidden sm:inline">All-in Cost</span>
                <span className="sm:hidden">$</span>
                <span className="block text-[10px] font-normal text-gray-400">$/1M tokens</span>
              </th>
              <th className="hidden px-4 py-3.5 text-center font-semibold text-gray-700 lg:table-cell">
                Recent Change
              </th>
              <th className="hidden px-4 py-3.5 font-semibold text-gray-700 sm:table-cell">
                <span className="hidden sm:inline">Context</span>
                <span className="sm:hidden">Ctx</span>
              </th>
              <th className="px-4 py-3.5 text-center font-semibold text-gray-700">
                <span className="hidden md:inline">In WorkBench?</span>
                <span className="md:hidden">WB</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {ranked.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center text-gray-500">
                  No models found. Try adjusting your filters.
                </td>
              </tr>
            ) : (
              ranked.map(({ entry, allIn, rank }) => {
                const inWorkBench = workbenchSlugs.has(entry.model.slug);
                return (
                  <tr
                    key={entry.model.id}
                    className="group cursor-pointer transition-colors hover:bg-brand-50/30"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/models/${entry.model.slug}`}
                        className="block font-medium text-ink-900 transition-colors group-hover:text-brand-600"
                      >
                        {entry.model.name}
                      </Link>
                      <span className="text-xs text-gray-400 md:hidden">
                        {entry.provider?.name}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-gray-600 md:table-cell">
                      {entry.provider?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        rank <= 3 ? "bg-green-100 text-green-700" :
                        rank <= 10 ? "bg-yellow-100 text-yellow-700" :
                        rank <= 20 ? "bg-orange-100 text-orange-700" :
                        "bg-gray-100 text-gray-500"
                      }`}>
                        {rank}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="rounded-md bg-spotlight-50 px-2 py-0.5 font-mono text-sm font-medium tabular-nums text-ink-900">
                        {entry.currentPricing ? formatPrice(allIn) : "—"}
                      </span>
                      <span className="block text-[10px] text-gray-400">
                        {entry.currentPricing ? `In ${formatPrice(entry.currentPricing.inputPricePerMillion)} · Out ${formatPrice(entry.currentPricing.outputPricePerMillion)}` : ""}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-center lg:table-cell">
                      {/* Price change indicator — placeholder for now, will connect to priceChangeLogs */}
                      <span className="text-gray-300">—</span>
                    </td>
                    <td className="hidden px-4 py-3 font-mono text-gray-600 sm:table-cell">
                      {entry.model.contextWindow >= 1000000
                        ? `${(entry.model.contextWindow / 1000000).toFixed(0)}M`
                        : `${Math.round(entry.model.contextWindow / 1000)}K`}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {inWorkBench ? (
                        <Link
                          href="https://workbench.xilos.ai"
                          target="_blank"
                          className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-100"
                        >
                          <Check className="h-3 w-3" /> Yes
                        </Link>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-300">
                          <X className="h-3 w-3" /> No
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
