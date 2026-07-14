import type { PriceHistoryEntry } from "@/lib/types";
import { formatDate, formatPrice } from "@/lib/utils";
import { calculatePercentChange } from "@/lib/calculator";

interface PriceHistoryProps {
  history: PriceHistoryEntry[];
}

const fieldLabels: Record<string, string> = {
  input_price_per_million: "Input $/1M",
  output_price_per_million: "Output $/1M",
  batch_input_price_per_million: "Batch Input $/1M",
  batch_output_price_per_million: "Batch Output $/1M",
  cache_read_price_per_million: "Cache Read $/1M",
  cache_write_price_per_million: "Cache Write $/1M",
};

export function PriceHistory({ history }: PriceHistoryProps) {
  if (history.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-semibold text-gray-900">Price History</h3>
        <p className="text-sm text-gray-500">
          No price changes detected yet for this model.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-6 py-4">
        <h3 className="font-semibold text-gray-900">Price History</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr className="text-left">
              <th className="px-4 py-3 font-semibold text-gray-700">Date</th>
              <th className="px-4 py-3 font-semibold text-gray-700">Field</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">
                Old
              </th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">
                New
              </th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">
                Change
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {history.map((change, idx) => {
              const oldVal = Number(change.oldValue);
              const newVal = Number(change.newValue);
              const pctChange = calculatePercentChange(oldVal, newVal);
              const isDecrease = newVal < oldVal;
              const isIncrease = newVal > oldVal;

              return (
                <tr key={`${change.fieldChanged}-${change.detectedAt.toISOString()}-${idx}`} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                    {formatDate(change.detectedAt)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {fieldLabels[change.fieldChanged] ?? change.fieldChanged}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-gray-500">
                    {formatPrice(oldVal)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-gray-900">
                    {formatPrice(newVal)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-mono tabular-nums font-medium ${
                      isDecrease
                        ? "text-green-600"
                        : isIncrease
                          ? "text-red-600"
                          : "text-gray-500"
                    }`}
                  >
                    {pctChange > 0 ? "+" : ""}
                    {pctChange.toFixed(1)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
