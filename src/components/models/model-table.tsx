"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowUp, ArrowDown, ArrowUpDown, Info } from "lucide-react";
import type { ModelWithPricing } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

interface ModelTableProps {
  models: ModelWithPricing[];
}

type SortField = "name" | "provider" | "allIn" | "rank" | "context";
type SortDir = "asc" | "desc";

export function ModelTable({ models }: ModelTableProps) {
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Calculate "all-in" cost and rank
  const withCost = useMemo(() => {
    const items = models.map((entry) => {
      const input = Number(entry.currentPricing?.inputPricePerMillion ?? 0);
      const output = Number(entry.currentPricing?.outputPricePerMillion ?? 0);
      const allIn = input + output;
      return { entry, allIn, input, output };
    });
    const sorted = [...items].sort((a, b) => a.allIn - b.allIn);
    const rankMap = new Map<string, number>();
    sorted.forEach((item, i) => rankMap.set(item.entry.model.id, i + 1));
    return items.map((item) => ({ ...item, rank: rankMap.get(item.entry.model.id) ?? 0 }));
  }, [models]);

  // Apply sorting
  const sorted = useMemo(() => {
    const sortedCopy = [...withCost];
    const dir = sortDir === "asc" ? 1 : -1;
    sortedCopy.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = a.entry.model.name.localeCompare(b.entry.model.name);
          break;
        case "provider":
          cmp = (a.entry.provider?.name ?? "").localeCompare(b.entry.provider?.name ?? "");
          break;
        case "allIn":
          cmp = a.allIn - b.allIn;
          break;
        case "rank":
          cmp = a.rank - b.rank;
          break;
        case "context":
          cmp = a.entry.model.contextWindow - b.entry.model.contextWindow;
          break;
      }
      return cmp * dir;
    });
    return sortedCopy;
  }, [withCost, sortField, sortDir]);

  function handleSort(field: SortField) {
    if (field === sortField) {
      // Toggle: asc -> desc -> asc
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      // Default to ascending for all fields except name (which defaults to descending)
      setSortDir(field === "name" ? "desc" : "asc");
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 text-gray-300" />;
    return sortDir === "asc" ? <ArrowUp className="h-3 w-3 text-brand-600" /> : <ArrowDown className="h-3 w-3 text-brand-600" />;
  }

  const sortableHeaders: { field: SortField; label: string; className: string }[] = [
    { field: "name", label: "Name", className: "px-4 py-3.5 text-left" },
    { field: "provider", label: "Provider", className: "hidden px-4 py-3.5 text-left md:table-cell" },
    { field: "rank", label: "Cost Rank", className: "px-4 py-3.5 text-center" },
    { field: "allIn", label: "All-in Cost", className: "px-4 py-3.5 text-right" },
    { field: "context", label: "Context", className: "hidden px-4 py-3.5 text-center sm:table-cell" },
  ];

  return (
    <div>
      {/* Note about WorkBench */}
      <div className="mb-3 flex items-center gap-2 rounded-lg bg-brand-50 px-4 py-2.5 text-sm text-brand-700">
        <Info className="h-4 w-4 flex-shrink-0" />
        <span>Every model in this list can be added to Xilos WorkBench or the Xilos platform. <a href="https://www.xilos.ai" className="font-semibold underline">Learn more →</a></span>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50/80">
              <tr>
                {sortableHeaders.map((h) => (
                  <th key={h.field} className={`${h.className} font-semibold text-gray-700`}>
                    <button
                      onClick={() => handleSort(h.field)}
                      className="inline-flex items-center gap-1.5 hover:text-brand-600"
                    >
                      {h.field === "allIn" && (
                        <span>
                          <span className="hidden sm:inline">All-in Cost</span>
                          <span className="sm:hidden">$</span>
                          <span className="block text-[10px] font-normal text-gray-400">$/1M tokens</span>
                        </span>
                      )}
                      {h.field === "rank" && (
                        <span>
                          <span className="hidden sm:inline">Cost Rank</span>
                          <span className="sm:hidden">#</span>
                        </span>
                      )}
                      {h.field === "context" && (
                        <span>
                          <span className="hidden sm:inline">Context</span>
                          <span className="sm:hidden">Ctx</span>
                        </span>
                      )}
                      {h.field === "name" && "Name"}
                      {h.field === "provider" && "Provider"}
                      <SortIcon field={h.field} />
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center text-gray-500">
                    No models found. Try adjusting your filters.
                  </td>
                </tr>
              ) : (
                sorted.map(({ entry, allIn, rank }) => (
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
                    <td className="hidden px-4 py-3 font-mono text-center text-gray-600 sm:table-cell">
                      {entry.model.contextWindow >= 1000000
                        ? `${(entry.model.contextWindow / 1000000).toFixed(0)}M`
                        : `${Math.round(entry.model.contextWindow / 1000)}K`}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
