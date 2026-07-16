'use client';

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { calculateCost } from "@/lib/calculator";
import { formatPrice } from "@/lib/utils";
import { ArrowRight, ArrowLeft, Check, ChevronDown, TrendingDown, TrendingUp, Sparkles, Mail, PiggyBank, AlertTriangle, X } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { benchmarkModels as friendlyModels, topFrontierSlugs, intelligenceColor } from "@/lib/benchmarks";

const volumeLevels = [
  { value: "low", label: "Low", detail: "1-10 employees · ~100 req/day", reqPerDay: 100 },
  { value: "medium", label: "Medium", detail: "11-50 employees · ~1,000 req/day", reqPerDay: 1000 },
  { value: "high", label: "High", detail: "51-200 employees · ~10,000 req/day", reqPerDay: 10000 },
];

export default function OptimizerClient() {
  const [hasScenario, setHasScenario] = useState<boolean | null>(null);
  const [selectedModelSlug, setSelectedModelSlug] = useState("");
  const [seats, setSeats] = useState(10);
  const [volume, setVolume] = useState("medium");
  const [inputTokens, setInputTokens] = useState(2000);
  const [outputTokens, setOutputTokens] = useState(1500);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [leadSubmitted, setLeadSubmitted] = useState(false);

  const selectedVolume = volumeLevels.find((v) => v.value === volume)!;
  const reqPerDay = Math.round(selectedVolume.reqPerDay * (seats / 10));

  const selectedModel = friendlyModels.find((m) => m.slug === selectedModelSlug);

  // All models sorted by cost
  const allCosts = useMemo(() => {
    return friendlyModels
      .map((m) => {
        const calc = calculateCost(
          { inputPricePerMillion: m.inputPricePerMillion, outputPricePerMillion: m.outputPricePerMillion },
          inputTokens, outputTokens, reqPerDay,
        );
        return { ...m, monthly: calc.monthly };
      })
      .sort((a, b) => a.monthly - b.monthly);
  }, [inputTokens, outputTokens, reqPerDay]);

  // If no scenario, use top 5 frontier models
  const displayModels = hasScenario === false
    ? allCosts.filter((m) => topFrontierSlugs.includes(m.slug))
    : allCosts;

  const currentMonthly = selectedModel ? allCosts.find((m) => m.slug === selectedModelSlug)?.monthly ?? 0 : 0;
  const currentModelIndex = allCosts.findIndex((m) => m.slug === selectedModelSlug);

  // Cheaper models available in WorkBench
  const cheaperWorkBench = hasScenario === true && currentModelIndex > 0
    ? allCosts.slice(0, currentModelIndex).filter((m) => m.inWorkBench).slice(0, 3)
    : [];

  // More expensive models (premium upgrade)
  const moreExpensive = hasScenario === true && currentModelIndex >= 0 && currentModelIndex < allCosts.length - 1
    ? allCosts.slice(currentModelIndex + 1).slice(-3).reverse()
    : [];

  // Savings
  const cheapestWorkBench = cheaperWorkBench[0];
  const savings = cheapestWorkBench ? currentMonthly - cheapestWorkBench.monthly : 0;

  // Chart data — current + cheaper alternatives
  const chartData = useMemo(() => {
    if (hasScenario === false) {
      return displayModels.map((m) => ({
        name: m.label.length > 15 ? m.label.substring(0, 15) + "..." : m.label,
        cost: Math.round(m.monthly),
        isCurrent: false,
        inWorkBench: m.inWorkBench,
      }));
    }
    const models = [selectedModel, ...cheaperWorkBench, ...moreExpensive].filter(Boolean) as typeof allCosts;
    return models.map((m) => ({
      name: m.label.length > 15 ? m.label.substring(0, 15) + "..." : m.label,
      cost: Math.round(m.monthly),
      isCurrent: m.slug === selectedModelSlug,
      inWorkBench: m.inWorkBench,
    }));
  }, [hasScenario, selectedModel, cheaperWorkBench, moreExpensive, selectedModelSlug, displayModels]);

  const submitLead = async () => {
    if (!email) return;
    try {
      await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          industry: "unknown",
          companySize: `${seats}`,
          useCase: "optimizer",
          complexity: volume,
          estimatedInputTokens: inputTokens,
          estimatedOutputTokens: outputTokens,
          estimatedDailyRequests: reqPerDay,
          estimatedMonthlyCost: currentMonthly,
          selectedModels: selectedModelSlug || topFrontierSlugs.join(","),
          metadata: JSON.stringify({ source: "optimizer", hasScenario }),
        }),
      });
      setLeadSubmitted(true);
    } catch (err) {
      console.error("Lead submit failed:", err);
    }
  };

  const costColor = (monthly: number) => {
    if (monthly < 100) return "bg-green-50 text-green-700";
    if (monthly < 500) return "bg-yellow-50 text-yellow-700";
    if (monthly < 2000) return "bg-orange-50 text-orange-700";
    return "bg-red-50 text-red-700";
  };

  // Step 0: Do you have a current scenario?
  if (hasScenario === null) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
              OPTIMIZER
            </div>
            <h1 className="mt-3 text-3xl font-bold text-ink-900">Cost Optimizer</h1>
            <p className="mt-2 text-gray-500">Find cheaper alternatives to your current AI stack — or see what the top models would cost you.</p>
          </div>

          <Card>
            <CardContent className="p-8">
              <h2 className="mb-2 text-xl font-semibold text-ink-900">Do you currently use an AI model?</h2>
              <p className="mb-6 text-sm text-gray-500">If yes, we will show you cheaper alternatives. If no, we will show you what the top models cost.</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <button
                  onClick={() => setHasScenario(true)}
                  className="rounded-xl border-2 border-gray-200 p-6 text-left transition-all hover:border-brand-400 hover:shadow-md"
                >
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
                    <TrendingDown className="h-5 w-5 text-brand-600" />
                  </div>
                  <h3 className="font-semibold text-ink-900">Yes, I use a model</h3>
                  <p className="mt-1 text-sm text-gray-500">Show me cheaper alternatives and savings</p>
                </button>
                <button
                  onClick={() => setHasScenario(false)}
                  className="rounded-xl border-2 border-gray-200 p-6 text-left transition-all hover:border-spotlight-400 hover:shadow-md"
                >
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-spotlight-50">
                    <AlertTriangle className="h-5 w-5 text-spotlight-600" />
                  </div>
                  <h3 className="font-semibold text-ink-900">No, not yet</h3>
                  <p className="mt-1 text-sm text-gray-500">Show me what the top frontier models cost</p>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Scenario setup (if yes)
  if (hasScenario === true && !selectedModel) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
              OPTIMIZER
            </div>
            <h1 className="mt-3 text-3xl font-bold text-ink-900">Your Current Scenario</h1>
            <p className="mt-2 text-gray-500">Tell us what you use today and we will find cheaper alternatives.</p>
          </div>

          <Card>
            <CardContent className="p-8">
              {/* Model dropdown */}
              <div className="relative mb-6">
                <label className="mb-2 block text-sm font-medium text-gray-700">Your current model</label>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-3 text-left text-sm font-medium text-ink-900 hover:border-gray-400"
                >
                  <span className="text-gray-400">Select your model...</span>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {dropdownOpen && (
                  <div className="absolute z-10 mt-1 max-h-80 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                    {friendlyModels.map((m) => (
                      <button
                        key={m.slug}
                        onClick={() => { setSelectedModelSlug(m.slug); setDropdownOpen(false); }}
                        className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0"
                      >
                        <span>
                          <span className="font-medium">{m.label}</span>
                          <span className="ml-2 text-xs text-gray-500">{m.provider}</span>
                        </span>
                        <span className="font-mono text-xs text-gray-400">${m.inputPricePerMillion}/${m.outputPricePerMillion}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Seats + Volume */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Seats</label>
                  <Input type="number" value={seats} onChange={(e) => setSeats(Math.max(1, parseInt(e.target.value) || 1))} className="font-mono" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Volume</label>
                  <select
                    value={volume}
                    onChange={(e) => setVolume(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-ink-900"
                  >
                    {volumeLevels.map((v) => (
                      <option key={v.value} value={v.value}>{v.label} — {v.detail}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Token estimates */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Input tokens / request (est.)</label>
                  <Input type="number" value={inputTokens} onChange={(e) => setInputTokens(parseInt(e.target.value) || 0)} className="font-mono" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Output tokens / request (est.)</label>
                  <Input type="number" value={outputTokens} onChange={(e) => setOutputTokens(parseInt(e.target.value) || 0)} className="font-mono" />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button onClick={() => { /* proceed to results */ }}>
                  Optimize <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Results
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            OPTIMIZER
          </div>
          <h1 className="mt-3 text-3xl font-bold text-ink-900">
            {hasScenario ? "Cost Optimization Report" : "Frontier Model Cost Analysis"}
          </h1>
          <p className="mt-2 text-gray-500">
            {hasScenario
              ? "Your current model vs cheaper alternatives available in Xilos WorkBench."
              : "Here is what the top frontier models would cost you. The numbers may surprise you."}
          </p>
        </div>

        {/* Current scenario summary (if yes) */}
        {hasScenario && selectedModel && (
          <Card className="glow-brand mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="default">CURRENT</Badge>
                  <div>
                    <p className="font-semibold text-ink-900">{selectedModel.label}</p>
                    <p className="text-sm text-gray-500">{selectedModel.provider} · {seats} seats · {selectedVolume.label} volume</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Your monthly cost</p>
                  <p className="font-mono text-2xl font-bold text-ink-900">{formatPrice(currentMonthly)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Savings callout */}
        {savings > 0 && cheapestWorkBench && (
          <Card className="mb-6 border-spotlight-300 bg-spotlight-50">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-spotlight-400">
                <PiggyBank className="h-6 w-6 text-ink-900" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-ink-900">You could save {formatPrice(savings)}/month</p>
                <p className="text-sm text-gray-600">
                  Switching to {cheapestWorkBench.label} ({cheapestWorkBench.provider}) via Xilos WorkBench
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* "Frighten with costs" callout (if no scenario) */}
        {hasScenario === false && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="font-bold text-ink-900">AI costs add up fast</p>
                <p className="text-sm text-gray-600">Here is what each top model would cost at your usage volume. Xilos WorkBench can reduce these costs significantly.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cost chart */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="mb-4 font-semibold text-ink-900">Monthly cost comparison</h3>
            <ResponsiveContainer width="100%" height={350}>
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
                    <Cell
                      key={i}
                      fill={entry.isCurrent ? "#0066ff" : entry.inWorkBench ? "#fbbf24" : "#d1d5db"}
                    />
                  ))}
                </Bar>
                {hasScenario && currentMonthly > 0 && (
                  <ReferenceLine x={Math.round(currentMonthly)} stroke="#0066ff" strokeDasharray="5 5" label={{ value: "Your cost", position: "top", fill: "#0066ff", fontSize: 11 }} />
                )}
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-brand-600" /> Your current model</span>
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-spotlight-400" /> Available in Xilos WorkBench</span>
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-gray-300" /> Not in WorkBench</span>
            </div>
          </CardContent>
        </Card>

        {/* Cheaper alternatives table */}
        {hasScenario && cheaperWorkBench.length > 0 && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-ink-900">Cheaper alternatives via Xilos WorkBench</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left">
                      <th className="py-3 px-4 font-semibold text-gray-700">Model</th>
                      <th className="py-3 px-4 font-semibold text-gray-700">Provider</th>
                      <th className="py-3 px-4 font-semibold text-gray-700">Monthly Cost</th>
                      <th className="py-3 px-4 font-semibold text-gray-700">Savings</th>
                      <th className="py-3 px-4 font-semibold text-gray-700">Intelligence</th>
                      <th className="py-3 px-4 font-semibold text-gray-700">In WorkBench?</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {cheaperWorkBench.map((m) => (
                      <tr key={m.slug} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-ink-900">{m.label}</td>
                        <td className="py-3 px-4 text-gray-600">{m.provider}</td>
                        <td className="py-3 px-4">
                          <span className={`rounded-md px-2 py-0.5 font-mono font-medium ${costColor(m.monthly)}`}>
                            {formatPrice(m.monthly)}/mo
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-green-600">
                          {formatPrice(currentMonthly - m.monthly)}/mo
                        </td>
                        <td className={`py-3 px-4 text-sm font-medium ${intelligenceColor(m.intelligenceIndex)}`}>
                          {m.intelligenceIndex ?? "N/A"}
                        </td>
                        <td className="py-3 px-4">
                          {m.inWorkBench ? (
                            <span className="inline-flex items-center gap-1 text-green-600">
                              <Check className="h-4 w-4" /> Yes
                            </span>
                          ) : (
                            <X className="h-4 w-4 text-gray-300" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* All models table (for no-scenario mode) */}
        {hasScenario === false && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-gray-500" />
                <h3 className="font-semibold text-ink-900">Top 5 frontier models by user base</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left">
                      <th className="py-3 px-4 font-semibold text-gray-700">Model</th>
                      <th className="py-3 px-4 font-semibold text-gray-700">Provider</th>
                      <th className="py-3 px-4 font-semibold text-gray-700">Input $/1M</th>
                      <th className="py-3 px-4 font-semibold text-gray-700">Output $/1M</th>
                      <th className="py-3 px-4 font-semibold text-gray-700">Monthly Cost</th>
                      <th className="py-3 px-4 font-semibold text-gray-700">Intelligence</th>
                      <th className="py-3 px-4 font-semibold text-gray-700">In WorkBench?</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {displayModels.map((m) => (
                      <tr key={m.slug} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-ink-900">{m.label}</td>
                        <td className="py-3 px-4 text-gray-600">{m.provider}</td>
                        <td className="py-3 px-4 font-mono">{formatPrice(m.inputPricePerMillion)}</td>
                        <td className="py-3 px-4 font-mono">{formatPrice(m.outputPricePerMillion)}</td>
                        <td className="py-3 px-4">
                          <span className={`rounded-md px-2 py-0.5 font-mono font-medium ${costColor(m.monthly)}`}>
                            {formatPrice(m.monthly)}/mo
                          </span>
                        </td>
                        <td className={`py-3 px-4 text-sm font-medium ${intelligenceColor(m.intelligenceIndex)}`}>
                          {m.intelligenceIndex ?? "N/A"}
                        </td>
                        <td className="py-3 px-4">
                          {m.inWorkBench ? (
                            <span className="inline-flex items-center gap-1 text-green-600">
                              <Check className="h-4 w-4" /> Yes
                            </span>
                          ) : (
                            <X className="h-4 w-4 text-gray-300" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lead-gen — report behind email gate */}
        {!leadSubmitted && (
          <Card className="border-spotlight-300">
            <CardContent className="p-6">
              {!email && !leadSubmitted ? (
                <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-spotlight-100">
                      <Sparkles className="h-5 w-5 text-spotlight-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-ink-900">Generate full optimization report</p>
                      <p className="text-sm text-gray-500">Detailed savings analysis with Xilos WorkBench recommendations.</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className="sm:w-64" />
                    <Button variant="accent" onClick={submitLead} disabled={!email}>
                      <Mail className="h-4 w-4" /> Generate report
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-spotlight-600" />
                    <h3 className="font-semibold text-ink-900">Generate your optimization report</h3>
                  </div>
                  <p className="text-sm text-gray-500">Enter your corporate email to generate and download your full report.</p>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className="flex-1" />
                    <Button variant="accent" onClick={submitLead} disabled={!email}>
                      Generate report <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {leadSubmitted && (
          <Card className="border-brand-200 bg-brand-50">
            <CardContent className="flex items-center gap-3 p-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600">
                <Check className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-ink-900">Report generated!</p>
                <p className="text-sm text-gray-600">We will send your full optimization report to {email} shortly. An Xilos team member will follow up to help you save.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Back / restart */}
        <div className="mt-6 flex justify-start">
          <Button variant="ghost" onClick={() => { setHasScenario(null); setSelectedModelSlug(""); setEmail(""); setLeadSubmitted(false); }}>
            <ArrowLeft className="h-4 w-4" /> Start over
          </Button>
        </div>
      </div>
    </div>
  );
}
