import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { ModelWithPricing } from "@/lib/types";
import { formatContext, formatPrice } from "@/lib/utils";

interface ModelCardProps {
  model: ModelWithPricing;
}

export function ModelCard({ model }: ModelCardProps) {
  const { model: m, provider, currentPricing } = model;
  return (
    <Link href={`/models/${m.slug}`} className="block">
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-medium text-gray-900">{m.name}</h3>
            <p className="text-sm text-gray-500">{provider?.name}</p>
          </div>
          <div className="flex flex-wrap gap-1">
            {m.modality.slice(0, 2).map((mod: string) => (
              <Badge key={mod} variant="outline">
                {mod}
              </Badge>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
          <div>
            <p className="text-xs text-gray-400">Context</p>
            <p className="font-mono text-gray-900">
              {formatContext(m.contextWindow)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">In $/1M</p>
            <p className="font-mono text-gray-900">
              {currentPricing
                ? formatPrice(currentPricing.inputPricePerMillion)
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Out $/1M</p>
            <p className="font-mono text-gray-900">
              {currentPricing
                ? formatPrice(currentPricing.outputPricePerMillion)
                : "—"}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
