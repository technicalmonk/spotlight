import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { ModelWithPricing } from "@/lib/types";
import { formatContext, formatPrice } from "@/lib/utils";

interface ModelTableProps {
  models: ModelWithPricing[];
}

export function ModelTable({ models }: ModelTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50/80">
            <tr className="text-left">
              <th className="px-4 py-3.5 font-semibold text-gray-700">Name</th>
              <th className="hidden px-4 py-3.5 font-semibold text-gray-700 md:table-cell">
                Provider
              </th>
              <th className="hidden px-4 py-3.5 font-semibold text-gray-700 lg:table-cell">
                Modality
              </th>
              <th className="hidden px-4 py-3.5 font-semibold text-gray-700 sm:table-cell">
                Context
              </th>
              <th className="px-4 py-3.5 text-right font-semibold text-gray-700">
                <span className="hidden sm:inline">Input $/1M</span>
                <span className="sm:hidden">In</span>
              </th>
              <th className="px-4 py-3.5 text-right font-semibold text-gray-700">
                <span className="hidden sm:inline">Output $/1M</span>
                <span className="sm:hidden">Out</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {models.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-16 text-center text-gray-500"
                >
                  No models found. Try adjusting your filters.
                </td>
              </tr>
            ) : (
              models.map((entry) => (
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
                  <td className="hidden px-4 py-3 lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {entry.model.modality.slice(0, 3).map((m: string) => (
                        <Badge key={m} variant="outline" className="text-[10px]">
                          {m}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 font-mono text-gray-600 sm:table-cell">
                    {formatContext(entry.model.contextWindow)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="rounded-md bg-spotlight-50 px-2 py-0.5 font-mono text-sm font-medium tabular-nums text-ink-900">
                      {entry.currentPricing
                        ? formatPrice(entry.currentPricing.inputPricePerMillion)
                        : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="rounded-md bg-gray-100 px-2 py-0.5 font-mono text-sm font-medium tabular-nums text-gray-700">
                      {entry.currentPricing
                        ? formatPrice(entry.currentPricing.outputPricePerMillion)
                        : "—"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
