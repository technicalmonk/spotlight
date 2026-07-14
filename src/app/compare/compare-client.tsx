'use client';

import { useState, useEffect } from "react";
import { useQueryState } from "nuqs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ComparisonTable } from "@/components/compare/comparison-table";
import { PriceChart } from "@/components/compare/price-chart";
import { calculateCost } from "@/lib/calculator";
import { formatPrice } from "@/lib/utils";

interface ComparisonModel {
  model: {
    id: string;
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

export default function CompareClient() {
  const [modelSlugs, setModelSlugs] = useQueryState("models", { defaultValue: "" });
  const [inputTokens, setInputTokens] = useQueryState("input", { defaultValue: "1000" });
  const [outputTokens, setOutputTokens] = useQueryState("output", { defaultValue: "500" });
  const [requestsPerDay, setRequestsPerDay] = useQueryState("rpd", { defaultValue: "1000" });
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<{ slug: string; name: string }[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonModel[]>([]);

  const slugs = modelSlugs ? modelSlugs.split(",").filter(Boolean) : [];

  useEffect(() => {
    if (search.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/models?search=${encodeURIComponent(search)}&limit=10`)
        .then((r) => r.json())
        .then((data) => {
          setSearchResults(data.models.map((m: { model: { slug: string; name: string } }) => ({ slug: m.model.slug, name: m.model.name })));
        })
        .catch(console.error);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (slugs.length < 2) {
      setComparisonData([]);
      return;
    }
    fetch(`/api/compare?models=${slugs.join(",")}`)
      .then((r) => r.json())
      .then((data) => setComparisonData(data.models))
      .catch(console.error);
  }, [modelSlugs]);

  const addModel = (slug: string) => {
    if (slugs.length >= 5) return;
    if (!slugs.includes(slug)) {
      setModelSlugs([...slugs, slug].join(","));
    }
    setSearch("");
    setSearchResults([]);
  };

  const removeModel = (slug: string) => {
    setModelSlugs(slugs.filter((s) => s !== slug).join(","));
  };

  const validModels = comparisonData.filter((m) => m.model && m.pricing);

  const costCalculations = validModels.map((m) => {
    const calc = calculateCost(
      {
        inputPricePerMillion: parseFloat(m.pricing!.inputPricePerMillion),
        outputPricePerMillion: parseFloat(m.pricing!.outputPricePerMillion),
      },
      parseInt(inputTokens, 10) || 0,
      parseInt(outputTokens, 10) || 0,
      parseInt(requestsPerDay, 10) || 0,
    );
    return { name: m.model.name, monthly: calc.monthly };
  });

  const bestValue = costCalculations.length > 0
    ? costCalculations.reduce((min, curr) => (curr.monthly < min.monthly ? curr : min))
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Compare Models</h1>

        <Card className="p-6 mb-6">
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Add models to compare ({slugs.length}/5)
          </label>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search models to add..."
            disabled={slugs.length >= 5}
          />
          {searchResults.length > 0 && (
            <div className="mt-2 border border-gray-200 rounded-md shadow-sm max-h-48 overflow-auto">
              {searchResults.map((m) => (
                <button
                  key={m.slug}
                  onClick={() => addModel(m.slug)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm border-b border-gray-100 last:border-0"
                >
                  {m.name}
                </button>
              ))}
            </div>
          )}
          {slugs.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {slugs.map((slug) => (
                <span key={slug} className="inline-flex items-center gap-1.5 bg-gray-100 rounded-md px-2.5 py-1 text-sm">
                  {slug}
                  <button onClick={() => removeModel(slug)} className="text-gray-400 hover:text-gray-600">x</button>
                </span>
              ))}
            </div>
          )}
        </Card>

        {slugs.length >= 2 && validModels.length > 0 && (
          <>
            <Card className="p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Feature and Price Comparison</h3>
              <ComparisonTable models={validModels} />
            </Card>

            <Card className="p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Price Chart</h3>
              <PriceChart
                models={validModels.map((m) => ({
                  name: m.model.name,
                  inputPrice: parseFloat(m.pricing!.inputPricePerMillion),
                  outputPrice: parseFloat(m.pricing!.outputPricePerMillion),
                }))}
              />
            </Card>

            <Card className="p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Usage Pattern and Best Value</h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="text-xs text-gray-500">Input tokens</label>
                  <Input type="number" value={inputTokens} onChange={(e) => setInputTokens(e.target.value)} className="font-mono" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Output tokens</label>
                  <Input type="number" value={outputTokens} onChange={(e) => setOutputTokens(e.target.value)} className="font-mono" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Requests/day</label>
                  <Input type="number" value={requestsPerDay} onChange={(e) => setRequestsPerDay(e.target.value)} className="font-mono" />
                </div>
              </div>

              {bestValue && (
                <div className="bg-brand-50 border border-brand-200 rounded-lg p-4">
                  <p className="text-sm text-brand-800">
                    <span className="font-semibold">Best value: {bestValue.name}</span> at {formatPrice(bestValue.monthly)}/month
                  </p>
                </div>
              )}

              <div className="mt-4 space-y-2">
                {costCalculations.map((c) => (
                  <div key={c.name} className="flex justify-between text-sm">
                    <span className="text-gray-700">{c.name}</span>
                    <span className="font-mono">{formatPrice(c.monthly)}/month</span>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        {slugs.length < 2 && (
          <Card className="p-12 text-center text-gray-500">
            Select at least 2 models to compare (up to 5).
          </Card>
        )}
      </div>
    </div>
  );
}
