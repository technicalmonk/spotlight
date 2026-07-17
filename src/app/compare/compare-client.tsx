'use client';

import { useState, useEffect } from "react";
import { useQueryState } from "nuqs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ComparisonTable } from "@/components/compare/comparison-table";
import { PriceChart } from "@/components/compare/price-chart";
import { calculateCost } from "@/lib/calculator";
import { formatPrice } from "@/lib/utils";
import { Check, X, Zap, Crown, TrendingDown } from "lucide-react";
import { providerGroups } from "@/lib/benchmarks";

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
  currentPricing: {
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
  const [comparisonData, setComparisonData] = useState<ComparisonModel[]>([]);
  const [loading, setLoading] = useState(false);

  const slugs = modelSlugs ? modelSlugs.split(",").filter(Boolean) : [];

  useEffect(() => {
    if (slugs.length < 2) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading state before async fetch
    setLoading(true);
    fetch(`/api/compare?models=${slugs.join(",")}`)
      .then((r) => {
        if (!r.ok) throw new Error(`API returned ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (!cancelled) setComparisonData(data.models ?? []);
      })
      .catch((err) => {
        console.error("Compare fetch failed:", err);
        if (!cancelled) setComparisonData([]);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- slugs derives from modelSlugs
    return () => { cancelled = true; };
  }, [modelSlugs]);

  const toggleModel = (slug: string) => {
    if (slugs.includes(slug)) {
      setModelSlugs(slugs.filter((s) => s !== slug).join(","));
    } else if (slugs.length < 8) {
      setModelSlugs([...slugs, slug].join(","));
    }
  };

  const selectPreset = (group: { models: string[] }) => {
    setModelSlugs(group.models.join(","));
  };

  const validModels = comparisonData.filter((m) => m.model && m.currentPricing);

  const costCalculations = validModels.map((m) => {
    const calc = calculateCost(
      {
        inputPricePerMillion: parseFloat(m.currentPricing!.inputPricePerMillion),
        outputPricePerMillion: parseFloat(m.currentPricing!.outputPricePerMillion),
      },
      parseInt(inputTokens, 10) || 0,
      parseInt(outputTokens, 10) || 0,
      parseInt(requestsPerDay, 10) || 0,
    );
    return { name: m.model.name, slug: m.model.slug, monthly: calc.monthly, inputPrice: parseFloat(m.currentPricing!.inputPricePerMillion), outputPrice: parseFloat(m.currentPricing!.outputPricePerMillion) };
  });

  const bestValue = costCalculations.length > 0
    ? costCalculations.reduce((min, curr) => (curr.monthly < min.monthly ? curr : min))
    : null;

  const cheapestInput = costCalculations.length > 0
    ? costCalculations.reduce((min, curr) => (curr.inputPrice < min.inputPrice ? curr : min))
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            COMPARE
          </div>
          <h1 className="mt-3 text-3xl font-bold text-ink-900">Compare Models</h1>
          <p className="mt-2 text-gray-500">Select models from major providers, or start with a preset. Compare up to 8 models.</p>
        </div>

        {/* Provider group cards */}
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">Quick start — compare by provider</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {providerGroups.map((group) => (
              <button
                key={group.slug}
                onClick={() => selectPreset(group)}
                className={`group rounded-xl border bg-white p-4 text-left shadow-sm transition-all hover:border-brand-300 hover:shadow-md ${slugs.length > 0 && group.models.every((m) => slugs.includes(m)) ? "border-brand-400 ring-2 ring-brand-100" : "border-gray-200"}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-bold ${group.accent}`}>
                    {group.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-ink-900">{group.name}</h3>
                    <p className="text-xs text-gray-500">{group.models.length} models</p>
                  </div>
                  {slugs.length > 0 && group.models.every((m) => slugs.includes(m)) && (
                    <Check className="h-4 w-4 text-brand-600" />
                  )}
                </div>
                <p className="mt-2 text-xs text-gray-500 line-clamp-2">{group.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Selected models */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-ink-900">Selected models ({slugs.length}/8)</h3>
              {slugs.length > 0 && (
                <button onClick={() => setModelSlugs("")} className="text-sm text-gray-500 hover:text-gray-700">
                  Clear all
                </button>
              )}
            </div>
            {slugs.length === 0 ? (
              <p className="text-sm text-gray-400">Select a provider preset above or search below to add individual models.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {slugs.map((slug) => (
                  <span key={slug} className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-gray-50 px-3 py-1 text-sm">
                    {slug}
                    <button onClick={() => toggleModel(slug)} className="text-gray-400 hover:text-gray-600">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Individual model search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <ModelSearch selected={slugs} onToggle={toggleModel} />
          </CardContent>
        </Card>

        {/* Usage pattern */}
        {slugs.length >= 2 && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="mb-4 font-semibold text-ink-900">Your usage pattern</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-xs text-gray-500">Input tokens / request</label>
                  <Input type="number" value={inputTokens} onChange={(e) => setInputTokens(e.target.value)} className="mt-1 font-mono" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Output tokens / request</label>
                  <Input type="number" value={outputTokens} onChange={(e) => setOutputTokens(e.target.value)} className="mt-1 font-mono" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Requests / day</label>
                  <Input type="number" value={requestsPerDay} onChange={(e) => setRequestsPerDay(e.target.value)} className="mt-1 font-mono" />
                </div>
              </div>
              <p className="mt-3 text-xs text-gray-400">
                Not sure about token counts? Use the <a href="/calculator" className="font-medium text-brand-600 hover:underline">Cost Calculator wizard</a> to estimate based on your industry and use case.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Loading */}
        {loading && (
          <Card className="mb-6 p-12 text-center text-gray-500">
            Loading comparison data...
          </Card>
        )}

        {/* Results */}
        {slugs.length >= 2 && validModels.length > 0 && !loading && (
          <>
            {/* Highlight cards */}
            {bestValue && cheapestInput && (
              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-spotlight-300 bg-spotlight-50 p-5">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-spotlight-600" />
                    <span className="text-sm font-semibold text-spotlight-700">BEST VALUE</span>
                  </div>
                  <p className="mt-2 text-lg font-bold text-ink-900">{bestValue.name}</p>
                  <p className="text-sm text-gray-600">{formatPrice(bestValue.monthly)}/month at your usage</p>
                </div>
                <div className="rounded-xl border border-brand-200 bg-brand-50 p-5">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-brand-600" />
                    <span className="text-sm font-semibold text-brand-700">CHEAPEST INPUT</span>
                  </div>
                  <p className="mt-2 text-lg font-bold text-ink-900">{cheapestInput.name}</p>
                  <p className="text-sm text-gray-600">{formatPrice(cheapestInput.inputPrice)}/1M input tokens</p>
                </div>
              </div>
            )}

            <Card className="mb-6">
              <CardContent className="p-6">
                <h3 className="mb-4 font-semibold text-ink-900">Feature and Price Comparison</h3>
                <ComparisonTable models={validModels} />
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardContent className="p-6">
                <h3 className="mb-4 font-semibold text-ink-900">Price Chart</h3>
                <PriceChart
                  models={validModels.map((m) => ({
                    name: m.model.name,
                    inputPrice: parseFloat(m.currentPricing!.inputPricePerMillion),
                    outputPrice: parseFloat(m.currentPricing!.outputPricePerMillion),
                  }))}
                />
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardContent className="p-6">
                <h3 className="mb-4 font-semibold text-ink-900">Monthly cost at your usage</h3>
                <div className="space-y-2">
                  {costCalculations
                    .sort((a, b) => a.monthly - b.monthly)
                    .map((c, i) => (
                      <div key={c.slug} className={`flex items-center justify-between rounded-lg px-4 py-3 ${i === 0 ? "bg-spotlight-50 border border-spotlight-200" : "bg-gray-50"}`}>
                        <div className="flex items-center gap-2">
                          {i === 0 && <Crown className="h-4 w-4 text-spotlight-600" />}
                          <span className="text-sm font-medium text-ink-900">{c.name}</span>
                          {i === 0 && <Badge variant="accent" className="text-xs">cheapest</Badge>}
                        </div>
                        <span className="font-mono text-sm font-semibold text-ink-900">{formatPrice(c.monthly)}/mo</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {slugs.length >= 2 && validModels.length === 0 && !loading && (
          <Card className="p-12 text-center text-gray-500">
            No matching models found in the database. Try selecting different models.
          </Card>
        )}

        {slugs.length < 2 && (
          <Card className="p-12 text-center text-gray-500">
            Select at least 2 models to compare (up to 8). Use a provider preset above to get started quickly.
          </Card>
        )}
      </div>
    </div>
  );
}

// Inline model search component
function ModelSearch({ selected, onToggle }: { selected: string[]; onToggle: (slug: string) => void }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<{ slug: string; name: string; provider: string }[]>([]);

  useEffect(() => {
    let cancelled = false;
    if (search.length < 2) return;
    const timer = setTimeout(() => {
      fetch(`/api/models?search=${encodeURIComponent(search)}&limit=15`)
        .then((r) => r.json())
        .then((data) => {
          if (cancelled) return;
          setResults(data.models.map((m: { model: { slug: string; name: string }; provider: { name: string } | null }) => ({
            slug: m.model.slug,
            name: m.model.name,
            provider: m.provider?.name ?? "Unknown",
          })));
        })
        .catch(console.error);
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [search]);

  return (
    <div>
      <label className="text-sm font-medium text-gray-700">Search individual models</label>
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Type a model name (e.g. GPT-4o, Claude, Gemini)..."
        className="mt-2"
      />
      {results.length > 0 && (
        <div className="mt-3 space-y-1">
          {results.map((m) => (
            <button
              key={m.slug}
              onClick={() => onToggle(m.slug)}
              className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                selected.includes(m.slug)
                  ? "border-brand-300 bg-brand-50 text-brand-700"
                  : "border-gray-200 bg-white hover:bg-gray-50"
              }`}
            >
              <span>
                <span className="font-medium">{m.name}</span>
                <span className="ml-2 text-gray-500">{m.provider}</span>
              </span>
              {selected.includes(m.slug) && <Check className="h-4 w-4 text-brand-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
