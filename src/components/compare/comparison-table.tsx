import { Badge } from "@/components/ui/badge";
import { formatPrice, formatContext } from "@/lib/utils";
import type { ReactNode } from "react";

interface ComparisonModel {
  model: {
    name: string;
    slug: string;
    contextWindow: number;
    modality: string[];
    supportsFunctionCalling: boolean;
    supportsStreaming: boolean;
    supportsBatch: boolean;
  };
  provider: { name: string } | null;
  pricing: {
    inputPricePerMillion: string;
    outputPricePerMillion: string;
    batchInputPricePerMillion: string | null;
    batchOutputPricePerMillion: string | null;
  } | null;
}

interface ComparisonTableProps {
  models: ComparisonModel[];
}

export function ComparisonTable({ models }: ComparisonTableProps) {
  const rows: Array<{ label: string; render: (m: ComparisonModel) => ReactNode }> = [
    {
      label: "Provider",
      render: (m) => <span className="text-sm">{m.provider?.name ?? "Unknown"}</span>,
    },
    {
      label: "Context Window",
      render: (m) => <span className="font-mono text-sm">{formatContext(m.model.contextWindow)}</span>,
    },
    {
      label: "Modalities",
      render: (m) => (
        <div className="flex flex-wrap gap-1">
          {m.model.modality.map((mod) => (
            <Badge key={mod} variant="secondary" className="text-xs">
              {mod}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      label: "Function Calling",
      render: (m) => <span className={m.model.supportsFunctionCalling ? "text-green-600" : "text-gray-400"}>{m.model.supportsFunctionCalling ? "Yes" : "No"}</span>,
    },
    {
      label: "Streaming",
      render: (m) => <span className={m.model.supportsStreaming ? "text-green-600" : "text-gray-400"}>{m.model.supportsStreaming ? "Yes" : "No"}</span>,
    },
    {
      label: "Batch",
      render: (m) => <span className={m.model.supportsBatch ? "text-green-600" : "text-gray-400"}>{m.model.supportsBatch ? "Yes" : "No"}</span>,
    },
    {
      label: "Input $/1M",
      render: (m) => <span className="font-mono text-sm">{m.pricing ? formatPrice(parseFloat(m.pricing.inputPricePerMillion)) : "N/A"}</span>,
    },
    {
      label: "Output $/1M",
      render: (m) => <span className="font-mono text-sm">{m.pricing ? formatPrice(parseFloat(m.pricing.outputPricePerMillion)) : "N/A"}</span>,
    },
    {
      label: "Batch Input $/1M",
      render: (m) => <span className="font-mono text-sm text-gray-500">{m.pricing?.batchInputPricePerMillion ? formatPrice(parseFloat(m.pricing.batchInputPricePerMillion)) : "N/A"}</span>,
    },
    {
      label: "Batch Output $/1M",
      render: (m) => <span className="font-mono text-sm text-gray-500">{m.pricing?.batchOutputPricePerMillion ? formatPrice(parseFloat(m.pricing.batchOutputPricePerMillion)) : "N/A"}</span>,
    },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
              Feature
            </th>
            {models.map((m) => (
              <th key={m.model.slug} className="text-left text-sm font-semibold text-gray-900 py-3 px-4 min-w-[160px]">
                {m.model.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-gray-100">
              <td className="text-sm font-medium text-gray-700 py-3 px-4">
                {row.label}
              </td>
              {models.map((m) => (
                <td key={m.model.slug} className="py-3 px-4">
                  {row.render(m)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
