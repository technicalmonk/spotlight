'use client';

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { calculateCost } from "@/lib/calculator";
import { formatPrice } from "@/lib/utils";
import { ArrowRight, ArrowLeft, Check, ChevronDown, TrendingDown, TrendingUp, Sparkles, Mail, PiggyBank } from "lucide-react";
import { benchmarkModels as friendlyModels, intelligenceColor } from "@/lib/benchmarks";

const industries = [
  { value: "saas", label: "SaaS / Software" },
  { value: "healthcare", label: "Healthcare" },
  { value: "fintech", label: "Fintech / Finance" },
  { value: "ecommerce", label: "E-commerce / Retail" },
  { value: "media", label: "Media / Content" },
  { value: "education", label: "Education" },
  { value: "legal", label: "Legal / Compliance" },
  { value: "other", label: "Other" },
];

const useCases = [
  { value: "chatbot", label: "Customer Support Chatbot", inputTokens: 500, outputTokens: 200 },
  { value: "code-gen", label: "Code Generation", inputTokens: 2000, outputTokens: 1500 },
  { value: "summarization", label: "Document Summarization", inputTokens: 8000, outputTokens: 500 },
  { value: "data-extraction", label: "Data Extraction / Parsing", inputTokens: 3000, outputTokens: 300 },
  { value: "content-generation", label: "Content Generation", inputTokens: 1000, outputTokens: 1000 },
  { value: "rag", label: "RAG / Knowledge Base Q&A", inputTokens: 4000, outputTokens: 400 },
  { value: "classification", label: "Classification / Moderation", inputTokens: 500, outputTokens: 50 },
  { value: "translation", label: "Translation", inputTokens: 2000, outputTokens: 2000 },
];

const volumeLevels = [
  { value: "low", label: "Low", detail: "1-10 employees · ~100 requests/day", reqPerDay: 100, multiplier: 1 },
  { value: "medium", label: "Medium", detail: "11-50 employees · ~1,000 requests/day", reqPerDay: 1000, multiplier: 1 },
  { value: "high", label: "High", detail: "51-200 employees · ~10,000 requests/day", reqPerDay: 10000, multiplier: 1 },
];

export default function CalculatorPage() {
  const [step, setStep] = useState(0); // 0=model+seats, 1=industry, 2=useCases, 3=volume, 4=results
  const [selectedModelSlug, setSelectedModelSlug] = useState("");
  const [seats, setSeats] = useState(10);
  const [industry, setIndustry] = useState("");
  const [selectedUseCases, setSelectedUseCases] = useState<string[]>([]);
  const [volume, setVolume] = useState("");
  const [email, setEmail] = useState("");
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const selectedModel = friendlyModels.find((m) => m.slug === selectedModelSlug);

  // Derive token estimates from selected use cases (average)
  const avgInputTokens = useMemo(() => {
    if (selectedUseCases.length === 0) return 1000;
    const total = selectedUseCases.reduce((sum, uc) => {
      const found = useCases.find((u) => u.value === uc);
      return sum + (found?.inputTokens ?? 0);
    }, 0);
    return Math.round(total / selectedUseCases.length);
  }, [selectedUseCases]);

  const avgOutputTokens = useMemo(() => {
    if (selectedUseCases.length === 0) return 500;
    const total = selectedUseCases.reduce((sum, uc) => {
      const found = useCases.find((u) => u.value === uc);
      return sum + (found?.outputTokens ?? 0);
    }, 0);
    return Math.round(total / selectedUseCases.length);
  }, [selectedUseCases]);

  const selectedVolume = volumeLevels.find((v) => v.value === volume);
  const reqPerDay = selectedVolume ? Math.round(selectedVolume.reqPerDay * (seats / 10)) : 1000;

  // All models sorted by cost at the user's usage
  const allCosts = useMemo(() => {
    if (!selectedVolume) return [];
    return friendlyModels
      .map((m) => {
        const calc = calculateCost(
          { inputPricePerMillion: m.inputPricePerMillion, outputPricePerMillion: m.outputPricePerMillion },
          avgInputTokens,
          avgOutputTokens,
          reqPerDay,
        );
        return { ...m, monthly: calc.monthly, calc };
      })
      .sort((a, b) => a.monthly - b.monthly);
  }, [selectedVolume, avgInputTokens, avgOutputTokens, reqPerDay]);

  const currentModelIndex = allCosts.findIndex((m) => m.slug === selectedModelSlug);
  const currentMonthly = selectedModel ? allCosts.find((m) => m.slug === selectedModelSlug)?.monthly ?? 0 : 0;

  // Top 3 (most expensive, premium tier)
  const top3 = allCosts.slice(-3).reverse();

  // Best 3 cheaper than current
  const cheaper3 = currentModelIndex > 0 ? allCosts.slice(0, Math.min(3, currentModelIndex)) : allCosts.slice(0, 3);

  // Savings
  const cheapestAlternative = cheaper3[0];
  const savings = currentModelIndex > 0 ? currentMonthly - (cheapestAlternative?.monthly ?? 0) : 0;

  const toggleUseCase = (value: string) => {
    setSelectedUseCases((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const submitLead = async () => {
    if (!email || !industry) return;
    try {
      await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          industry,
          companySize: `${seats}`,
          useCase: selectedUseCases.join(","),
          complexity: volume,
          estimatedInputTokens: avgInputTokens,
          estimatedOutputTokens: avgOutputTokens,
          estimatedDailyRequests: reqPerDay,
          estimatedMonthlyCost: currentMonthly,
          selectedModels: selectedModelSlug,
          metadata: JSON.stringify({ seats, volume, currentModel: selectedModel?.label }),
        }),
      });
      setLeadSubmitted(true);
    } catch (err) {
      console.error("Lead submit failed:", err);
    }
  };

  const steps = [
    { label: "Model", value: selectedModelSlug },
    { label: "Industry", value: industry },
    { label: "Use Cases", value: selectedUseCases.length > 0 ? "yes" : "" },
    { label: "Volume", value: volume },
  ];

  const canProceed = [selectedModelSlug, industry, selectedUseCases.length > 0 ? "yes" : "", volume][step] !== "";

  const costColor = (monthly: number) => {
    if (monthly < 100) return "bg-green-50 text-green-700";
    if (monthly < 500) return "bg-yellow-50 text-yellow-700";
    if (monthly < 2000) return "bg-orange-50 text-orange-700";
    return "bg-red-50 text-red-700";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-spotlight-300 bg-spotlight-50 px-3 py-1 text-xs font-semibold text-spotlight-700">
            CALCULATE
          </div>
          <h1 className="mt-3 text-3xl font-bold text-ink-900">Cost Calculator</h1>
          <p className="mt-2 text-gray-500">What are you using today? We will show you cheaper alternatives.</p>
        </div>

        {/* Step indicator */}
        {step < 4 && (
          <div className="mb-8 flex items-center gap-2">
            {steps.map((s, i) => (
              <div key={i} className="flex flex-1 items-center gap-2">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                  i < step ? "bg-brand-600 text-white" :
                  i === step ? "bg-spotlight-400 text-ink-900" :
                  "bg-gray-200 text-gray-400"
                }`}>
                  {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span className={`hidden text-xs sm:inline ${i === step ? "font-semibold text-ink-900" : "text-gray-400"}`}>
                  {s.label}
                </span>
                {i < steps.length - 1 && <div className={`h-px flex-1 ${i < step ? "bg-brand-300" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>
        )}

        {/* Step 0: Model + Seats */}
        {step === 0 && (
          <Card>
            <CardContent className="p-8">
              <h2 className="mb-2 text-xl font-semibold text-ink-900">What do you use?</h2>
              <p className="mb-6 text-sm text-gray-500">Pick the model your team currently uses and how many people use it.</p>

              {/* Model dropdown */}
              <div className="relative mb-6">
                <label className="mb-2 block text-sm font-medium text-gray-700">Your current model</label>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-3 text-left text-sm font-medium text-ink-900 hover:border-gray-400"
                >
                  {selectedModel ? (
                    <span>
                      <span className="text-gray-500">{selectedModel.provider}:</span> {selectedModel.label}
                    </span>
                  ) : (
                    <span className="text-gray-400">Select your model...</span>
                  )}
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {dropdownOpen && (
                  <div className="absolute z-10 mt-1 max-h-80 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                    {friendlyModels.map((m) => (
                      <button
                        key={m.slug}
                        onClick={() => { setSelectedModelSlug(m.slug); setDropdownOpen(false); }}
                        className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0 ${
                          m.slug === selectedModelSlug ? "bg-brand-50 text-brand-700" : ""
                        }`}
                      >
                        <span>
                          <span className="font-medium">{m.label}</span>
                          <span className="ml-2 text-xs text-gray-500">{m.provider}</span>
                        </span>
                        <span className="font-mono text-xs text-gray-400">
                          ${m.inputPricePerMillion}/${m.outputPricePerMillion}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Seats */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">How many people use it?</label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    value={seats}
                    onChange={(e) => setSeats(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-32 font-mono"
                  />
                  <span className="text-sm text-gray-500">seats / licenses</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Industry */}
        {step === 1 && (
          <Card>
            <CardContent className="p-8">
              <h2 className="mb-2 text-xl font-semibold text-ink-900">What industry are you in?</h2>
              <p className="mb-6 text-sm text-gray-500">We use this to tailor recommendations for your sector.</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {industries.map((ind) => (
                  <button
                    key={ind.value}
                    onClick={() => setIndustry(ind.value)}
                    className={`rounded-xl border p-4 text-center transition-all hover:border-brand-300 hover:shadow-sm ${
                      industry === ind.value ? "border-brand-400 bg-brand-50 ring-2 ring-brand-100" : "border-gray-200 bg-white"
                    }`}
                  >
                    <span className="text-sm font-medium text-ink-900">{ind.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Use Cases (multi-select) */}
        {step === 2 && (
          <Card>
            <CardContent className="p-8">
              <h2 className="mb-2 text-xl font-semibold text-ink-900">What do you use it for?</h2>
              <p className="mb-6 text-sm text-gray-500">Select all that apply. We use these to estimate your token usage.</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {useCases.map((uc) => (
                  <button
                    key={uc.value}
                    onClick={() => toggleUseCase(uc.value)}
                    className={`flex items-center justify-between rounded-xl border p-4 text-left transition-all hover:border-brand-300 hover:shadow-sm ${
                      selectedUseCases.includes(uc.value) ? "border-brand-400 bg-brand-50 ring-2 ring-brand-100" : "border-gray-200 bg-white"
                    }`}
                  >
                    <span className="font-medium text-ink-900">{uc.label}</span>
                    {selectedUseCases.includes(uc.value) && <Check className="h-4 w-4 text-brand-600" />}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Volume */}
        {step === 3 && (
          <Card>
            <CardContent className="p-8">
              <h2 className="mb-2 text-xl font-semibold text-ink-900">What is your usage volume?</h2>
              <p className="mb-6 text-sm text-gray-500">This scales your cost estimate by team size and request volume.</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {volumeLevels.map((v) => (
                  <button
                    key={v.value}
                    onClick={() => setVolume(v.value)}
                    className={`rounded-xl border p-4 text-left transition-all hover:border-brand-300 hover:shadow-sm ${
                      volume === v.value ? "border-brand-400 bg-brand-50 ring-2 ring-brand-100" : "border-gray-200 bg-white"
                    }`}
                  >
                    <span className="block font-semibold text-ink-900">{v.label}</span>
                    <span className="mt-1 block text-xs text-gray-500">{v.detail}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        {step < 4 && (
          <div className="mt-6 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed}>
              {step === 3 ? "See Results" : "Next"} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step 4: Results */}
        {step === 4 && selectedModel && allCosts.length > 0 && (
          <div className="space-y-6">
            {/* Summary */}
            <Card className="glow-brand">
              <CardContent className="p-8">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-ink-900">Your current scenario</h2>
                    <p className="mt-1 text-sm text-gray-500">Based on your selections — here is what you are spending.</p>
                  </div>
                  <button onClick={() => setStep(0)} className="text-sm text-gray-500 hover:text-brand-600">Edit</button>
                </div>
                <div className="mb-4 flex flex-wrap gap-2">
                  <Badge variant="default">{selectedModel.label}</Badge>
                  <Badge variant="secondary">{seats} seats</Badge>
                  <Badge variant="accent">{industries.find((i) => i.value === industry)?.label}</Badge>
                  <Badge variant="outline">{volumeLevels.find((v) => v.value === volume)?.label} volume</Badge>
                  <Badge variant="outline">{selectedUseCases.length} use case{selectedUseCases.length !== 1 ? "s" : ""}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-xl bg-spotlight-50 p-4">
                    <p className="text-xs text-gray-500">Your monthly cost</p>
                    <p className="mt-1 font-mono text-2xl font-bold text-ink-900">{formatPrice(currentMonthly)}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-xs text-gray-500">Requests/day</p>
                    <p className="mt-1 font-mono text-2xl font-bold text-ink-900">{reqPerDay.toLocaleString()}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-xs text-gray-500">Tokens/req (est.)</p>
                    <p className="mt-1 font-mono text-2xl font-bold text-ink-900">{(avgInputTokens + avgOutputTokens).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Savings callout */}
            {savings > 0 && cheapestAlternative && (
              <Card className="border-spotlight-300 bg-spotlight-50">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-spotlight-400">
                    <PiggyBank className="h-6 w-6 text-ink-900" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-ink-900">You could save {formatPrice(savings)}/month</p>
                    <p className="text-sm text-gray-600">Switching to {cheapestAlternative.label} ({cheapestAlternative.provider}) via Xilos WorkBench</p>
                  </div>
                  <Button variant="accent" onClick={() => window.location.href = "/optimizer"}>
                    See how <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Top 3 (premium) */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-gray-500" />
                <h3 className="font-semibold text-ink-900">Top 3 premium models</h3>
                <span className="text-xs text-gray-400">most expensive at your usage</span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {top3.map((m) => (
                  <Card key={m.slug} className={m.slug === selectedModelSlug ? "border-brand-400 ring-2 ring-brand-100" : ""}>
                    <CardContent className="p-5">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-semibold text-ink-900">{m.label}</span>
                        {m.slug === selectedModelSlug && <Badge variant="default" className="text-xs">YOURS</Badge>}
                      </div>
                      <p className="text-xs text-gray-500">{m.provider}</p>
                      <div className={`mt-3 inline-block rounded-lg px-3 py-1 font-mono text-sm font-bold ${costColor(m.monthly)}`}>
                        {formatPrice(m.monthly)}/mo
                      </div>
                      <div className="mt-2">
                        <span className={`text-xs font-medium ${intelligenceColor(m.intelligenceIndex)}`}>Intelligence: {m.intelligenceIndex ?? "N/A"}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Best 3 cheaper */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-ink-900">Best 3 cheaper alternatives</h3>
                <span className="text-xs text-gray-400">save money with these</span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {cheaper3.map((m) => (
                  <Card key={m.slug} className="card-hover-lift">
                    <CardContent className="p-5">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-semibold text-ink-900">{m.label}</span>
                        {m.slug === cheaper3[0]?.slug && savings > 0 && <Badge variant="accent" className="text-xs">CHEAPEST</Badge>}
                      </div>
                      <p className="text-xs text-gray-500">{m.provider} via Xilos WorkBench</p>
                      <div className={`mt-3 inline-block rounded-lg px-3 py-1 font-mono text-sm font-bold ${costColor(m.monthly)}`}>
                        {formatPrice(m.monthly)}/mo
                      </div>
                      <div className="mt-2">
                        <span className={`text-xs font-medium ${intelligenceColor(m.intelligenceIndex)}`}>Intelligence: {m.intelligenceIndex ?? "N/A"}</span>
                      </div>
                      {m.slug !== selectedModelSlug && savings > 0 && (
                        <p className="mt-2 text-xs font-semibold text-green-600">
                          Save {formatPrice(currentMonthly - m.monthly)}/mo
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Lead-gen CTA */}
            {!leadSubmitted && (
              <Card className="overflow-hidden border-spotlight-300">
                <CardContent className="p-6">
                  {!showLeadForm ? (
                    <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-spotlight-100">
                          <Sparkles className="h-5 w-5 text-spotlight-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-ink-900">Get your detailed cost report</p>
                          <p className="text-sm text-gray-500">Full breakdown with savings analysis and Xilos WorkBench recommendations.</p>
                        </div>
                      </div>
                      <Button variant="accent" onClick={() => setShowLeadForm(true)}>
                        <Mail className="h-4 w-4" /> Get my report
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-spotlight-600" />
                        <h3 className="font-semibold text-ink-900">Get your detailed cost report</h3>
                      </div>
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className="flex-1" />
                        <Button variant="accent" onClick={submitLead} disabled={!email}>
                          Send report <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-400">We use this to send your report and share relevant AI cost insights. No spam.</p>
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
                    <p className="font-semibold text-ink-900">Report on its way!</p>
                    <p className="text-sm text-gray-600">Check {email} for your detailed cost breakdown.</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-start">
              <Button variant="ghost" onClick={() => setStep(0)}>
                <ArrowLeft className="h-4 w-4" /> Start over
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
