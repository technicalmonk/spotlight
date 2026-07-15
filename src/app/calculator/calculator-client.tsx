'use client';

import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { ModelPicker } from "@/components/calculator/model-picker";
import { TokenInput } from "@/components/calculator/token-input";
import { CostBreakdown } from "@/components/calculator/cost-breakdown";
import { ScenarioSelector } from "@/components/calculator/scenario-selector";
import { calculateCost } from "@/lib/calculator";

interface ModelOption {
  id: string;
  name: string;
  provider: string;
  inputPricePerMillion?: number;
  outputPricePerMillion?: number;
}

interface Scenario {
  slug: string;
  name: string;
  defaultInputTokens: number;
  defaultOutputTokens: number;
  defaultDailyRequests: number;
}

export default function CalculatorPage() {
  const [selectedModels, setSelectedModels] = useState<ModelOption[]>([]);
  const [inputTokens, setInputTokens] = useState(500);
  const [outputTokens, setOutputTokens] = useState(200);
  const [requestsPerDay, setRequestsPerDay] = useState(1000);
  const [useBatch, setUseBatch] = useState(false);
  const [allModels, setAllModels] = useState<ModelOption[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);

  useEffect(() => {
    fetch("/api/models?limit=500")
      .then((r) => r.json())
      .then((data) => {
        setAllModels(
          data.models.map((m: { model: { id: string; name: string }; provider: { name: string } | null; currentPricing: { inputPricePerMillion: string; outputPricePerMillion: string } | null }) => ({
            id: m.model.id,
            name: m.model.name,
            provider: m.provider?.name ?? "Unknown",
            inputPricePerMillion: parseFloat(m.currentPricing?.inputPricePerMillion ?? "0"),
            outputPricePerMillion: parseFloat(m.currentPricing?.outputPricePerMillion ?? "0"),
          })),
        );
      })
      .catch(console.error);

    fetch("/api/scenarios")
      .then((r) => r.json())
      .then((data) => setScenarios(data.scenarios))
      .catch(console.error);
  }, []);

  const results = useMemo(() => {
    return selectedModels.map((model) => ({
      modelName: model.name,
      providerName: model.provider,
      calculation: calculateCost(
        {
          inputPricePerMillion: model.inputPricePerMillion ?? 0,
          outputPricePerMillion: model.outputPricePerMillion ?? 0,
        },
        inputTokens,
        outputTokens,
        requestsPerDay,
        { useBatch },
      ),
    }));
  }, [selectedModels, inputTokens, outputTokens, requestsPerDay, useBatch]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-spotlight-300 bg-spotlight-50 px-3 py-1 text-xs font-semibold text-spotlight-700">
            CALCULATE
          </div>
          <h1 className="mt-3 text-3xl font-bold text-ink-900">Cost Calculator</h1>
          <p className="mt-2 text-gray-500">Estimate your AI spend across models.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-6 space-y-4">
              <ModelPicker
                selected={selectedModels}
                onChange={setSelectedModels}
                allModels={allModels}
              />
            </Card>

            <Card className="p-6 space-y-4">
              <h3 className="font-semibold text-gray-900">Usage parameters</h3>
              <TokenInput
                label="Input tokens per request"
                value={inputTokens}
                onChange={setInputTokens}
                placeholder="500"
              />
              <TokenInput
                label="Output tokens per request"
                value={outputTokens}
                onChange={setOutputTokens}
                placeholder="200"
              />
              <TokenInput
                label="Requests per day"
                value={requestsPerDay}
                onChange={setRequestsPerDay}
                placeholder="1000"
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={useBatch}
                  onChange={(e) => setUseBatch(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-gray-700">Use batch pricing (50% discount)</span>
              </label>
            </Card>

            <Card className="p-6">
              <ScenarioSelector
                scenarios={scenarios}
                onSelect={(s) => {
                  setInputTokens(s.defaultInputTokens);
                  setOutputTokens(s.defaultOutputTokens);
                  setRequestsPerDay(s.defaultDailyRequests);
                }}
              />
            </Card>
          </div>

          <div className="lg:col-span-2">
            <CostBreakdown results={results} />
          </div>
        </div>
      </div>
    </div>
  );
}
