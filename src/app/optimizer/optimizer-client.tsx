'use client';

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { calculateCost } from "@/lib/calculator";
import { formatPrice } from "@/lib/utils";
import { ArrowRight, ArrowLeft, Check, ChevronDown, TrendingDown, TrendingUp, Sparkles, Mail, PiggyBank, AlertTriangle, X, Building2, Users, Cpu, Lock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { benchmarkModels as friendlyModels, topFrontierSlugs, intelligenceColor } from "@/lib/benchmarks";

const volumeLevels = [
  { value: "low", label: "Low", detail: "1-10 employees · ~100 req/day", reqPerDay: 100 },
  { value: "medium", label: "Medium", detail: "11-50 employees · ~1,000 req/day", reqPerDay: 1000 },
  { value: "high", label: "High", detail: "51-200 employees · ~10,000 req/day", reqPerDay: 10000 },
  { value: "enterprise", label: "Enterprise", detail: "200+ employees · ~50,000 req/day", reqPerDay: 50000 },
];

const orgSizes = [
  { value: "1-10", label: "1-10 employees" },
  { value: "11-50", label: "11-50 employees" },
  { value: "51-200", label: "51-200 employees" },
  { value: "200-1000", label: "200-1,000 employees" },
  { value: "1000+", label: "1,000+ employees" },
];

const industries = [
  "Technology", "Healthcare", "Finance", "Legal", "Education", "Manufacturing",
  "Retail", "Media", "Government", "Consulting", "Other",
];

const providers = ["OpenAI", "Anthropic", "Google", "Groq", "Fireworks", "Mistral", "Meta", "Other"];

type Step = "intro" | "org" | "usage" | "results" | "unlocked";

export default function OptimizerClient() {
  const [step, setStep] = useState<Step>("intro");
  const [hasScenario, setHasScenario] = useState<boolean | null>(null);

  // Org info
  const [orgSize, setOrgSize] = useState("");
  const [industry, setIndustry] = useState("");
  const [employeeCount, setEmployeeCount] = useState(10);

  // AI usage
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [selectedModelSlug, setSelectedModelSlug] = useState("");
  const [tokensPerUserPerDay, setTokensPerUserPerDay] = useState(5000);
  const [volume, setVolume] = useState("medium");
  const [inputTokens, setInputTokens] = useState(2000);
  const [outputTokens, setOutputTokens] = useState(1500);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Lead
  const [email, setEmail] = useState("");
  const [leadSubmitted, setLeadSubmitted] = useState(false);

  const selectedVolume = volumeLevels.find((v) => v.value === volume)!;
  const reqPerDay = Math.round(selectedVolume.reqPerDay * (employeeCount / 10));
  const selectedModel = friendlyModels.find((m) => m.slug === selectedModelSlug);

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

  const displayModels = hasScenario === false
    ? allCosts.filter((m) => topFrontierSlugs.includes(m.slug))
    : allCosts;

  const currentMonthly = selectedModel ? allCosts.find((m) => m.slug === selectedModelSlug)?.monthly ?? 0 : 0;
  const currentModelIndex = allCosts.findIndex((m) => m.slug === selectedModelSlug);

  const cheaperWorkBench = hasScenario === true && currentModelIndex > 0
    ? allCosts.slice(0, currentModelIndex).filter((m) => m.inWorkBench).slice(0, 3)
    : [];

  const moreExpensive = hasScenario === true && currentModelIndex >= 0 && currentModelIndex < allCosts.length - 1
    ? allCosts.slice(currentModelIndex + 1).slice(-3).reverse()
    : [];

  const cheapestWorkBench = cheaperWorkBench[0];
  const savings = cheapestWorkBench ? currentMonthly - cheapestWorkBench.monthly : 0;

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

  function toggleProvider(p: string) {
    setSelectedProviders(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  }

  const submitLead = async () => {
    if (!email) return;
    try {
      await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          industry: industry || "unknown",
          companySize: orgSize || `${employeeCount}`,
          useCase: "optimizer",
          complexity: volume,
          estimatedInputTokens: inputTokens,
          estimatedOutputTokens: outputTokens,
          estimatedDailyRequests: reqPerDay,
          estimatedMonthlyCost: currentMonthly,
          selectedModels: selectedModelSlug || topFrontierSlugs.join(","),
          metadata: JSON.stringify({
            source: "optimizer-v2",
            hasScenario,
            employeeCount,
            tokensPerUserPerDay,
            currentProviders: selectedProviders,
            orgSize,
          }),
        }),
      });
      setLeadSubmitted(true);
      setStep("unlocked");
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

  // ── Step: Intro ──────────────────────────────────────────────────────
  if (step === "intro") {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
              OPTIMIZER
            </div>
            <h1 className="mt-3 text-3xl font-bold text-ink-900">AI Cost Optimizer</h1>
            <p className="mt-2 text-gray-500">
              Get a personalized cost analysis and optimization report for your organization's AI usage.
              See what you're spending, what you could save, and which models deliver the best value.
            </p>
          </div>

          <Card>
            <CardContent className="p-8">
              <h2 className="mb-2 text-xl font-semibold text-ink-900">Do you currently use AI models in your organization?</h2>
              <p className="mb-6 text-sm text-gray-500">
                If yes, we'll show you cheaper alternatives. If not, we'll show you what the top models cost at your scale.
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <button
                  onClick={() => { setHasScenario(true); setStep("org"); }}
                  className="rounded-xl border-2 border-gray-200 p-6 text-left transition-all hover:border-brand-400 hover:shadow-md"
                >
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
                    <TrendingDown className="h-5 w-5 text-brand-600" />
                  </div>
                  <h3 className="font-semibold text-ink-900">Yes, we use AI</h3>
                  <p className="mt-1 text-sm text-gray-500">Show me cheaper alternatives and savings</p>
                </button>
                <button
                  onClick={() => { setHasScenario(false); setStep("org"); }}
                  className="rounded-xl border-2 border-gray-200 p-6 text-left transition-all hover:border-amber-400 hover:shadow-md"
                >
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  </div>
                  <h3 className="font-semibold text-ink-900">Not yet</h3>
                  <p className="mt-1 text-sm text-gray-500">Show me what the top models cost</p>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Step: Organization Info ──────────────────────────────────────────
  if (step === "org") {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-3xl px-4 py-10">
          {/* Progress */}
          <div className="mb-8 flex items-center gap-2 text-sm">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">1</span>
            <span className="font-medium text-ink-900">Organization</span>
            <span className="text-gray-300">→</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-400">2</span>
            <span className="text-gray-400">AI Usage</span>
            <span className="text-gray-300">→</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-400">3</span>
            <span className="text-gray-400">Report</span>
          </div>

          <div className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
              <Building2 className="h-3 w-3" /> STEP 1
            </div>
            <h1 className="mt-3 text-3xl font-bold text-ink-900">Tell us about your organization</h1>
            <p className="mt-2 text-gray-500">We use this to calculate costs at your scale and recommend the right models.</p>
          </div>

          <Card>
            <CardContent className="p-8">
              {/* Org size */}
              <div className="mb-6">
                <label className="mb-3 block text-sm font-medium text-gray-700">Organization size</label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {orgSizes.map(s => (
                    <button
                      key={s.value}
                      onClick={() => { setOrgSize(s.value); setEmployeeCount(parseInt(s.value)); }}
                      className={`rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition ${
                        orgSize === s.value ? "border-brand-500 bg-brand-50 text-brand-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Employee count */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-gray-700">Number of AI users (employees who will use AI)</label>
                <Input
                  type="number"
                  value={employeeCount}
                  onChange={(e) => setEmployeeCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="font-mono"
                />
              </div>

              {/* Industry */}
              <div className="mb-8">
                <label className="mb-2 block text-sm font-medium text-gray-700">Industry</label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-ink-900"
                >
                  <option value="">Select industry...</option>
                  {industries.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>

              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep("intro")}>
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button onClick={() => setStep("usage")} disabled={!orgSize}>
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Step: AI Usage ───────────────────────────────────────────────────
  if (step === "usage") {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-3xl px-4 py-10">
          {/* Progress */}
          <div className="mb-8 flex items-center gap-2 text-sm">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-500 text-xs font-bold text-white">✓</span>
            <span className="text-gray-400">Organization</span>
            <span className="text-gray-300">→</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">2</span>
            <span className="font-medium text-ink-900">AI Usage</span>
            <span className="text-gray-300">→</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-400">3</span>
            <span className="text-gray-400">Report</span>
          </div>

          <div className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
              <Cpu className="h-3 w-3" /> STEP 2
            </div>
            <h1 className="mt-3 text-3xl font-bold text-ink-900">Your current AI usage</h1>
            <p className="mt-2 text-gray-500">
              {hasScenario ? "Tell us which models you use and your usage patterns." : "Tell us about your expected usage so we can estimate costs."}
            </p>
          </div>

          <Card>
            <CardContent className="p-8">
              {/* Providers */}
              <div className="mb-6">
                <label className="mb-3 block text-sm font-medium text-gray-700">Which AI providers do you currently use?</label>
                <div className="flex flex-wrap gap-2">
                  {providers.map(p => (
                    <button
                      key={p}
                      onClick={() => toggleProvider(p)}
                      className={`rounded-lg border-2 px-3 py-1.5 text-sm font-medium transition ${
                        selectedProviders.includes(p) ? "border-brand-500 bg-brand-50 text-brand-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {selectedProviders.includes(p) && <Check className="mr-1 inline h-3 w-3" />}
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Model dropdown (only if has scenario) */}
              {hasScenario && (
                <div className="mb-6">
                  <label className="mb-2 block text-sm font-medium text-gray-700">Your primary model</label>
                  <div className="relative">
                    <button
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-3 text-left text-sm font-medium text-ink-900 hover:border-gray-400"
                    >
                      <span className={selectedModel ? "" : "text-gray-400"}>
                        {selectedModel ? `${selectedModel.label} (${selectedModel.provider})` : "Select your model..."}
                      </span>
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
                </div>
              )}

              {/* Volume */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-gray-700">Usage volume</label>
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

              {/* Tokens per user per day */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Estimated tokens per user per day: <span className="font-mono text-brand-600">{tokensPerUserPerDay.toLocaleString()}</span>
                </label>
                <input
                  type="range"
                  min="1000"
                  max="100000"
                  step="1000"
                  value={tokensPerUserPerDay}
                  onChange={(e) => setTokensPerUserPerDay(parseInt(e.target.value))}
                  className="w-full accent-brand-600"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Light (1K)</span>
                  <span>Heavy (100K)</span>
                </div>
              </div>

              {/* Token estimates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Input tokens / request</label>
                  <Input type="number" value={inputTokens} onChange={(e) => setInputTokens(parseInt(e.target.value) || 0)} className="font-mono" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Output tokens / request</label>
                  <Input type="number" value={outputTokens} onChange={(e) => setOutputTokens(parseInt(e.target.value) || 0)} className="font-mono" />
                </div>
              </div>

              <div className="mt-8 flex justify-between">
                <Button variant="ghost" onClick={() => setStep("org")}>
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button
                  onClick={() => setStep("results")}
                  disabled={hasScenario === true && !selectedModelSlug}
                >
                  See Results <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Step: Results (gated) / Unlocked ────────────────────────────────
  const isUnlocked = step === "unlocked" || leadSubmitted;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-10">
        {/* Progress */}
        <div className="mb-8 flex items-center gap-2 text-sm">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-500 text-xs font-bold text-white">✓</span>
          <span className="text-gray-400">Organization</span>
          <span className="text-gray-300">→</span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-500 text-xs font-bold text-white">✓</span>
          <span className="text-gray-400">AI Usage</span>
          <span className="text-gray-300">→</span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">3</span>
          <span className="font-medium text-ink-900">Report</span>
        </div>

        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            {isUnlocked ? <Check className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />} {isUnlocked ? "FULL REPORT" : "PREVIEW"}
          </div>
          <h1 className="mt-3 text-3xl font-bold text-ink-900">
            {hasScenario ? "Cost Optimization Report" : "Frontier Model Cost Analysis"}
          </h1>
          <p className="mt-2 text-gray-500">
            {hasScenario
              ? `${employeeCount} users · ${selectedVolume.label} volume · ${selectedProviders.join(", ") || "No providers selected"}`
              : `Estimated costs for ${employeeCount} users at ${selectedVolume.label} volume.`}
          </p>
        </div>

        {/* Current scenario summary */}
        {hasScenario && selectedModel && (
          <Card className="glow-brand mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="default">CURRENT</Badge>
                  <div>
                    <p className="font-semibold text-ink-900">{selectedModel.label}</p>
                    <p className="text-sm text-gray-500">{selectedModel.provider} · {employeeCount} users · {selectedVolume.label} volume</p>
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
          <Card className="mb-6 border-amber-300 bg-amber-50">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400">
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

        {/* Cost chart — always visible */}
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
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-amber-400" /> Available in Xilos WorkBench</span>
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-gray-300" /> Not in WorkBench</span>
            </div>
          </CardContent>
        </Card>

        {/* ── Email gate (before unlock) ─────────────────────────────── */}
        {!isUnlocked && (
          <Card className="mb-6 border-brand-300 bg-gradient-to-br from-brand-50 to-white">
            <CardContent className="p-8">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-brand-600">
                  <Lock className="h-7 w-7 text-white" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-ink-900">Unlock your full optimization report</h3>
                <p className="mb-6 max-w-md text-sm text-gray-500">
                  Get detailed alternatives, savings breakdown, and personalized recommendations from the Xilos team.
                </p>
                <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="flex-1"
                  />
                  <Button variant="accent" onClick={submitLead} disabled={!email}>
                    <Mail className="h-4 w-4" /> Unlock Report
                  </Button>
                </div>
                <p className="mt-3 text-xs text-gray-400">
                  We'll send your report and follow up about Xilos. No spam.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Blurred alternatives (before unlock) ───────────────────── */}
        {!isUnlocked && hasScenario && cheaperWorkBench.length > 0 && (
          <Card className="mb-6 overflow-hidden">
            <div className="relative">
              <CardContent className="p-6 blur-sm pointer-events-none select-none">
                <div className="mb-4 flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-ink-900">Cheaper alternatives via Xilos WorkBench</h3>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left">
                      <th className="py-3 px-4 font-semibold text-gray-700">Model</th>
                      <th className="py-3 px-4 font-semibold text-gray-700">Provider</th>
                      <th className="py-3 px-4 font-semibold text-gray-700">Monthly Cost</th>
                      <th className="py-3 px-4 font-semibold text-gray-700">Savings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {cheaperWorkBench.map((m) => (
                      <tr key={m.slug}>
                        <td className="py-3 px-4 font-medium text-ink-900">{m.label}</td>
                        <td className="py-3 px-4 text-gray-600">{m.provider}</td>
                        <td className="py-3 px-4 font-mono">{formatPrice(m.monthly)}/mo</td>
                        <td className="py-3 px-4 font-mono text-green-600">{formatPrice(currentMonthly - m.monthly)}/mo</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-lg bg-ink-900/80 px-4 py-2 text-sm font-medium text-white">
                  <Lock className="mr-1.5 inline h-4 w-4" /> Enter email to unlock
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* ── Unlocked content ───────────────────────────────────────── */}
        {isUnlocked && (
          <>
            <Card className="mb-6 border-green-200 bg-green-50">
              <CardContent className="flex items-center gap-3 p-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600">
                  <Check className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-ink-900">Report unlocked!</p>
                  <p className="text-sm text-gray-600">We'll send the full report to {email}. An Xilos team member will follow up to help you save.</p>
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
                            <td className="py-3 px-4 font-mono text-green-600">{formatPrice(currentMonthly - m.monthly)}/mo</td>
                            <td className={`py-3 px-4 text-sm font-medium ${intelligenceColor(m.intelligenceIndex)}`}>
                              {m.intelligenceIndex ?? "N/A"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* All models table (no-scenario mode) */}
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
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* CTA */}
            <Card className="mb-6 border-brand-300 bg-brand-50">
              <CardContent className="p-8 text-center">
                <h3 className="mb-2 text-xl font-bold text-ink-900">Ready to start saving?</h3>
                <p className="mb-6 text-sm text-gray-500">
                  Xilos gives you governance, routing, and cost control across all your AI providers — with WorkBench as your team's AI workspace.
                </p>
                <div className="flex justify-center gap-3">
                  <a href="https://www.xilos.ai">
                    <Button variant="accent">
                      Book a demo <ArrowRight className="h-4 w-4" />
                    </Button>
                  </a>
                  <a href="https://workbench.xilos.ai">
                    <Button variant="outline">
                      Try WorkBench
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Back / restart */}
        <div className="mt-6 flex justify-start">
          <Button variant="ghost" onClick={() => { setStep("intro"); setHasScenario(null); setSelectedModelSlug(""); setEmail(""); setLeadSubmitted(false); }}>
            <ArrowLeft className="h-4 w-4" /> Start over
          </Button>
        </div>
      </div>
    </div>
  );
}
