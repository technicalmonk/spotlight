import { formatPrice } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface CostBreakdownProps {
  results: Array<{
    modelName: string;
    providerName: string;
    calculation: {
      perRequest: { input: number; output: number; total: number };
      daily: number;
      monthly: number;
      annual: number;
    };
  }>;
}

export function CostBreakdown({ results }: CostBreakdownProps) {
  if (results.length === 0) {
    return (
      <Card className="p-6 text-center text-gray-500">
        Select models and enter usage to see cost estimates.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {results.map((result) => (
        <Card key={result.modelName} className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">{result.modelName}</h3>
              <p className="text-sm text-gray-500">{result.providerName}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Per request</p>
              <p className="text-lg font-mono font-semibold text-gray-900">
                {formatPrice(result.calculation.perRequest.total)}
              </p>
              <p className="text-xs text-gray-400 font-mono">
                in: {formatPrice(result.calculation.perRequest.input)} / out: {formatPrice(result.calculation.perRequest.output)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Per day</p>
              <p className="text-lg font-mono font-semibold text-gray-900">
                {formatPrice(result.calculation.daily)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Per month</p>
              <p className="text-lg font-mono font-semibold text-brand-600">
                {formatPrice(result.calculation.monthly)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Per year</p>
              <p className="text-lg font-mono font-semibold text-gray-900">
                {formatPrice(result.calculation.annual)}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
