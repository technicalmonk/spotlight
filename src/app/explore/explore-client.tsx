'use client';

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { calculateCost } from "@/lib/calculator";
import { formatPrice } from "@/lib/utils";
import { benchmarkModels as friendlyModels, intelligenceColor } from "@/lib/benchmarks";
import { ArrowRight, Calculator, ClipboardPaste, Upload, TrendingDown, DollarSign, Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface Props {
  providers: string[];
}

interface UsageEntry {
  label: string;
  inputTokens: number;
  outputTokens: number;
  requests: number;
}

export function ExploreClient({ providers: _providers }: Props) {
  const [mode, setMode] = useState<"manual" | "paste">("manual");

  // Manual entry
  const [entries, setEntries] = useState<UsageEntry[]>([
    { label: "Month 1", inputTokens: 0, outputTokens: 0, requests: 0 },
  ]);

  // Paste mode
  const [pasteText, setPasteText] = useState("");

  function addEntry() {
    setEntries([...entries, { label: `Month ${entries.length + 1}`, inputTokens: 0, outputTokens: 0, requests: 0 }]);
  }

  function updateEntry(i: number, field: keyof UsageEntry, value: string | number) {
    const updated = [...entries];
    (updated[i] as any)[field] = typeof value === "string" ? value : value;
    setEntries(updated);
  }

  function removeEntry(i: number) {
    setEntries(entries.filter((_, idx) => idx !== i));
  }

  // Parse pasted data — expects CSV-like format: input_tokens, output_tokens, requests
  const parsedEntries = useMemo(() => {
    if (mode !== "paste" || !pasteText.trim()) return [];
    const lines = pasteText.trim().split("\n");
    const parsed: UsageEntry[] = [];
    for (let i = 0; i < lines.length; i++) {
      const parts = lines[i].split(/[,\t\s]+/).filter(Boolean);
      if (parts.length >= 3) {
        const input = parseInt(parts[0]) || 0;
        const output = parseInt(parts[1]) || 0;
        const requests = parseInt(parts[2]) || 0;
        if (input > 0 || output > 0 || requests > 0) {
          parsed.push({ label: `Row ${i + 1}`, inputTokens: input, outputTokens: output, requests });
        }
      }
    }
    return parsed;
  }, [mode, pasteText]);

  const activeEntries = mode === "paste" ? parsedEntries : entries;

  // Aggregate totals
  const totals = useMemo(() => {
    return activeEntries.reduce((acc, e) => ({
      inputTokens: acc.inputTokens + e.inputTokens,
      outputTokens: acc.outputTokens + e.outputTokens,
      requests: acc.requests + e.requests,
    }), { inputTokens: 0, outputTokens: 0, requests: 0 });
  }, [activeEntries]);

  // Calculate costs across all models for the aggregated usage
  const modelCosts = useMemo(() => {
    if (totals.requests === 0) return [];

    // Use average tokens per request
    const avgInput = totals.inputTokens / (totals.requests || 1);
    const avgOutput = totals.outputTokens / (totals.requests || 1);

    return friendlyModels
      .map((m) => {
        const calc = calculateCost(
          { inputPricePerMillion: m.inputPricePerMillion, outputPricePerMillion: m.outputPricePerMillion },
          Math.round(avgInput), Math.round(avgOutput), totals.requests,
        );
        return { ...m, monthly: calc.monthly, avgInput: Math.round(avgInput), avgOutput: Math.round(avgOutput) };
      })
      .sort((a, b) => a.monthly - b.monthly);
  }, [totals]);

  const cheapest = modelCosts[0];
  const expensiveModel = modelCosts.find(m => m.slug === "claude-fable-5") ?? modelCosts[modelCosts.length - 1];
  const potentialSavings = expensiveModel && cheapest ? expensiveModel.monthly - cheapest.monthly : 0;

  // Chart data — top 15 cheapest
  const chartData = useMemo(() => {
    return modelCosts.slice(0, 15).map((m) => ({
      name: m.label.length > 15 ? m.label.substring(0, 15) + "..." : m.label,
      cost: Math.round(m.monthly),
      inWorkBench: m.inWorkBench,
    }));
  }, [modelCosts]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
          <Calculator className="h-3 w-3" /> EXPLORE
        </div>
        <h1 className="mt-3 text-3xl font-bold text-ink-900">Explore Your Usage</h1>
        <p className="mt-2 text-gray-500">
          Enter your actual AI token usage from past months and see what it would cost across every model. Paste your billing data or enter it manually.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setMode("manual")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
            mode === "manual" ? "bg-brand-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          <Upload className="h-4 w-4" /> Manual Entry
        </button>
        <button
          onClick={() => setMode("paste")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
            mode === "paste" ? "bg-brand-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          <ClipboardPaste className="h-4 w-4" /> Paste Data
        </button>
      </div>

      {/* Input area */}
      <Card className="mb-6">
        <CardContent className="p-6">
          {mode === "manual" ? (
            <>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-ink-900">Enter your monthly usage</h3>
                <Button variant="outline" size="sm" onClick={addEntry}>+ Add Month</Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left">
                      <th className="py-2 px-3 font-semibold text-gray-700">Label</th>
                      <th className="py-2 px-3 font-semibold text-gray-700">Input Tokens</th>
                      <th className="py-2 px-3 font-semibold text-gray-700">Output Tokens</th>
                      <th className="py-2 px-3 font-semibold text-gray-700">Requests</th>
                      <th className="py-2 px-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {entries.map((entry, i) => (
                      <tr key={i}>
                        <td className="py-2 px-3">
                          <Input value={entry.label} onChange={(e) => updateEntry(i, "label", e.target.value)} className="w-28" />
                        </td>
                        <td className="py-2 px-3">
                          <Input type="number" value={entry.inputTokens || ""} onChange={(e) => updateEntry(i, "inputTokens", parseInt(e.target.value) || 0)} className="w-32 font-mono" placeholder="0" />
                        </td>
                        <td className="py-2 px-3">
                          <Input type="number" value={entry.outputTokens || ""} onChange={(e) => updateEntry(i, "outputTokens", parseInt(e.target.value) || 0)} className="w-32 font-mono" placeholder="0" />
                        </td>
                        <td className="py-2 px-3">
                          <Input type="number" value={entry.requests || ""} onChange={(e) => updateEntry(i, "requests", parseInt(e.target.value) || 0)} className="w-28 font-mono" placeholder="0" />
                        </td>
                        <td className="py-2 px-3">
                          {entries.length > 1 && (
                            <button onClick={() => removeEntry(i)} className="text-gray-400 hover:text-red-500">✕</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-gray-400">
                Tip: Find your token usage in your provider billing dashboard (OpenAI: Usage tab, Anthropic: Console, Google AI Studio: Quotas).
              </p>
            </>
          ) : (
            <>
              <h3 className="mb-2 font-semibold text-ink-900">Paste your usage data</h3>
              <p className="mb-4 text-sm text-gray-500">
                Paste CSV or tab-separated data: <code className="rounded bg-gray-100 px-1 text-xs">input_tokens, output_tokens, requests</code> (one row per month)
              </p>
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={`Example:
2500000, 1800000, 5000
3200000, 2100000, 6200
2800000, 1900000, 5800`}
                className="h-40 w-full rounded-lg border border-gray-300 p-4 font-mono text-sm focus:border-brand-500 focus:outline-none"
              />
              {parsedEntries.length > 0 && (
                <p className="mt-2 text-sm text-green-600">{parsedEntries.length} rows parsed</p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {totals.requests > 0 && (
        <>
          {/* Summary */}
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <Card><CardContent className="p-4 text-center">
              <p className="text-xs text-gray-500">Total Input Tokens</p>
              <p className="mt-1 font-mono text-lg font-bold text-ink-900">{totals.inputTokens.toLocaleString()}</p>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <p className="text-xs text-gray-500">Total Output Tokens</p>
              <p className="mt-1 font-mono text-lg font-bold text-ink-900">{totals.outputTokens.toLocaleString()}</p>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <p className="text-xs text-gray-500">Total Requests</p>
              <p className="mt-1 font-mono text-lg font-bold text-ink-900">{totals.requests.toLocaleString()}</p>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <p className="text-xs text-gray-500">Avg Tokens / Request</p>
              <p className="mt-1 font-mono text-lg font-bold text-ink-900">
                {((totals.inputTokens + totals.outputTokens) / (totals.requests || 1)).toFixed(0)}
              </p>
            </CardContent></Card>
          </div>

          {/* Savings callout */}
          {potentialSavings > 0 && cheapest && (
            <Card className="mb-6 border-amber-300 bg-amber-50">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400">
                  <TrendingDown className="h-6 w-6 text-ink-900" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-ink-900">Potential savings: {formatPrice(potentialSavings)}/month</p>
                  <p className="text-sm text-gray-600">
                    Cheapest: {cheapest.label} ({cheapest.provider}) at {formatPrice(cheapest.monthly)}/mo vs most expensive at {formatPrice(expensiveModel?.monthly ?? 0)}/mo
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cost chart */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="mb-4 font-semibold text-ink-900">Monthly cost across models (15 cheapest)</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={(v) => `$${v}`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#9ca3af" width={120} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "6px", fontSize: "12px" }}
                    formatter={(value) => [`$${value}/month`, "Cost"]}
                  />
                  <Bar dataKey="cost" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.inWorkBench ? "#fbbf24" : "#d1d5db"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-3 flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-amber-400" /> Available in Xilos WorkBench</span>
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-gray-300" /> Not in WorkBench</span>
              </div>
            </CardContent>
          </Card>

          {/* Full table */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="mb-4 font-semibold text-ink-900">All models — cost for your usage</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left">
                      <th className="py-3 px-4 font-semibold text-gray-700">Model</th>
                      <th className="py-3 px-4 font-semibold text-gray-700">Provider</th>
                      <th className="py-3 px-4 font-semibold text-gray-700">All-in $/1M</th>
                      <th className="py-3 px-4 font-semibold text-gray-700">Monthly Cost</th>
                      <th className="py-3 px-4 font-semibold text-gray-700">Intelligence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {modelCosts.map((m) => {
                      const allIn = m.inputPricePerMillion + m.outputPricePerMillion;
                      return (
                        <tr key={m.slug} className="hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-ink-900">{m.label}</td>
                          <td className="py-3 px-4 text-gray-600">{m.provider}</td>
                          <td className="py-3 px-4 font-mono">{formatPrice(allIn)}</td>
                          <td className="py-3 px-4">
                            <span className={`rounded-md px-2 py-0.5 font-mono font-medium ${
                              m.monthly < 100 ? "bg-green-50 text-green-700" :
                              m.monthly < 500 ? "bg-yellow-50 text-yellow-700" :
                              m.monthly < 2000 ? "bg-orange-50 text-orange-700" :
                              "bg-red-50 text-red-700"
                            }`}>
                              {formatPrice(m.monthly)}/mo
                            </span>
                          </td>
                          <td className={`py-3 px-4 text-sm font-medium ${intelligenceColor(m.intelligenceIndex)}`}>
                            {m.intelligenceIndex ?? "N/A"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {totals.requests === 0 && (
        <Card className="p-12 text-center text-gray-500">
          <DollarSign className="mx-auto mb-3 h-12 w-12 text-gray-300" />
          <p>Enter your usage data above to see cost comparisons across all models.</p>
        </Card>
      )}
    </div>
  );
}
