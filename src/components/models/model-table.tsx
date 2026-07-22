"use client";

import Link from "next/link";
import { ArrowUp, ArrowDown, ArrowUpDown, Info } from "lucide-react";
import type { ModelWithPricing } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { benchmarkModels, intelligenceColor } from "@/lib/benchmarks";

interface ModelTableProps {
  models: ModelWithPricing[];
  globalRankMap?: Map<string, number>;
  currentSort?: string;
  basePath?: string;
}

export function ModelTable({ models, globalRankMap, currentSort = "name-desc", basePath = "/models" }: ModelTableProps) {
  const [activeField, activeDir] = currentSort.split("-");

  // Build a lookup map: slug -> intelligenceIndex
  const intelMap = new Map<string, number | null>();
  for (const b of benchmarkModels) {
    intelMap.set(b.slug, b.intelligenceIndex);
  }

  function sortUrl(field: string): string {
    let dir: string;
    if (activeField === field) {
      dir = activeDir === "asc" ? "desc" : "asc";
    } else {
      dir = field === "name" ? "desc" : "asc";
    }
    return `${basePath}?sort=${field}-${dir}`;
  }

  function SortIcon({ field }: { field: string }) {
    if (activeField !== field) return <ArrowUpDown className="h-3 w-3 text-gray-300" />;
    return activeDir === "asc" ? <ArrowUp className="h-3 w-3 text-brand-600" /> : <ArrowDown className="h-3 w-3 text-brand-600" />;
  }

  const headers: { field: string; className: string; render: () => React.ReactNode }[] = [
    { field: "name", className: "px-4 py-3.5 text-left font-semibold text-gray-700", render: () => "Name" },
    { field: "provider", className: "hidden px-4 py-3.5 text-left font-semibold text-gray-700 md:table-cell", render: () => "Provider" },
    { field: "intelligence", className: "px-4 py-3.5 text-center font-semibold text-gray-700", render: () => <><span className="hidden sm:inline">Intelligence</span><span className="sm:hidden">Int</span></> },
    { field: "allIn", className: "px-4 py-3.5 text-right font-semibold text-gray-700", render: () => <><span className="hidden sm:inline">All-in Cost</span><span className="sm:hidden">$</span><span className="block text-[10px] font-normal text-gray-400">$/1M tokens</span></> },
    { field: "context", className: "hidden px-4 py-3.5 text-center font-semibold text-gray-700 sm:table-cell", render: () => <><span className="hidden sm:inline">Context</span><span className="sm:hidden">Ctx</span></> },
  ];

  return (
    <div>
      {/* Note about WorkBench */}
      <div className="mb-3 flex items-center gap-2 rounded-lg bg-brand-50 px-4 py-2.5 text-sm text-brand-700">
        <Info className="h-4 w-4 flex-shrink-0" />
        <span>Every model in this list can be added to Xilos WorkBench or the Xilos platform. <a href="https://www.xilos.ai" className="font-semibold underline">Learn more</a></span>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50/80">
              <tr>
                {headers.map((h) => (
                  <th key={h.field} className={h.className}>
                    <Link href={sortUrl(h.field)} className="inline-flex items-center gap-1.5 hover:text-brand-600">
                      {h.render()}
                      <SortIcon field={h.field} />
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {models.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center text-gray-500">
                    No models found. Try adjusting your filters.
                  </td>
                </tr>
              ) : (
                models.map((entry) => {
                  const input = Number(entry.currentPricing?.inputPricePerMillion ?? 0);
                  const output = Number(entry.currentPricing?.outputPricePerMillion ?? 0);
                  const allIn = input + output;
                  const rank = globalRankMap?.get(entry.model.id) ?? 0;
                  const intel = intelMap.get(entry.model.slug) ?? null;
                  return (
                    <tr key={entry.model.id} className="group cursor-pointer transition-colors hover:bg-brand-50/30">
                      <td className="px-4 py-3">
                        <Link href={`/models/${entry.model.slug}`} className="block font-medium text-ink-900 transition-colors group-hover:text-brand-600">
                          {entry.model.name}
                        </Link>
                        <span className="text-xs text-gray-400 md:hidden">{entry.provider?.name}</span>
                      </td>
                      <td className="hidden px-4 py-3 text-gray-600 md:table-cell">{entry.provider?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-center">
                        {intel !== null ? (
                          <span className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-bold ${intelligenceColor(intel)}`}>
                            {intel}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">N/A</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="rounded-md bg-spotlight-50 px-2 py-0.5 font-mono text-sm font-medium tabular-nums text-ink-900">
                          {entry.currentPricing ? formatPrice(allIn) : "—"}
                        </span>
                        <span className="block text-[10px] text-gray-400">
                          {entry.currentPricing ? `In ${formatPrice(entry.currentPricing.inputPricePerMillion)} · Out ${formatPrice(entry.currentPricing.outputPricePerMillion)}` : ""}
                        </span>
                        {rank > 0 && rank <= 50 && (
                          <span className="block text-[10px] text-gray-400">Rank #{rank}</span>
                        )}
                      </td>
                      <td className="hidden px-4 py-3 font-mono text-center text-gray-600 sm:table-cell">
                        {entry.model.contextWindow >= 1000000
                          ? `${(entry.model.contextWindow / 1000000).toFixed(0)}M`
                          : `${Math.round(entry.model.contextWindow / 1000)}K`}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
