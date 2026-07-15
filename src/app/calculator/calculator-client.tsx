'use client';

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModelPicker } from "@/components/calculator/model-picker";
import { CostBreakdown } from "@/components/calculator/cost-breakdown";
import { calculateCost } from "@/lib/calculator";
import { ArrowRight, ArrowLeft, Check, Building2, Users, Brain, Gauge, Mail, Sparkles } from "lucide-react";

interface ModelOption {
  id: string;
  name: string;
  provider: string;
  inputPricePerMillion?: number;
  outputPricePerMillion?: number;
}

// Wizard configuration — token estimates derived from industry benchmarks
const industries = [
  { value: "saas", label: "SaaS / Software", icon: "M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16 0h-6m-10 0h6" },
  { value: "healthcare", label: "Healthcare", icon: "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 002 8.5c0 2.29 1.51 4.04 3 5.5l7 7 7-7z" },
  { value: "fintech", label: "Fintech / Finance", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" },
  { value: "ecommerce", label: "E-commerce / Retail", icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" },
  { value: "media", label: "Media / Content", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
  { value: "education", label: "Education / EdTech", icon: "M12 14l9-5-9-5-9 5 9 5zm0 0v7m-9-5l9 5 9-5" },
  { value: "legal", label: "Legal / Compliance", icon: "M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9m6-9l3-1m-3 1l3 9a5.002 5.002 0 00-6.001 0M18 7l-3 9m0 0l-3-9" },
  { value: "other", label: "Other", icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
];

const useCases = [
  { value: "chatbot", label: "Customer Support Chatbot", inputTokens: 500, outputTokens: 200, description: "Conversational AI handling user queries" },
  { value: "code-gen", label: "Code Generation", inputTokens: 2000, outputTokens: 1500, description: "Generate code from natural language" },
  { value: "summarization", label: "Document Summarization", inputTokens: 8000, outputTokens: 500, description: "Summarize long documents at scale" },
  { value: "data-extraction", label: "Data Extraction / Parsing", inputTokens: 3000, outputTokens: 300, description: "Extract structured data from unstructured text" },
  { value: "content-generation", label: "Content Generation", inputTokens: 1000, outputTokens: 1000, description: "Generate articles, marketing copy, reports" },
  { value: "rag", label: "RAG / Knowledge Base Q&A", inputTokens: 4000, outputTokens: 400, description: "Retrieval-augmented generation over your docs" },
  { value: "classification", label: "Classification / Moderation", inputTokens: 500, outputTokens: 50, description: "Classify or moderate content at volume" },
  { value: "translation", label: "Translation", inputTokens: 2000, outputTokens: 2000, description: "Translate text between languages" },
];

const companySizes = [
  { value: "1-10", label: "1-10 employees", multiplier: 0.3 },
  { value: "11-50", label: "11-50 employees", multiplier: 1 },
  { value: "51-200", label: "51-200 employees", multiplier: 3 },
  { value: "201-1000", label: "201-1,000 employees", multiplier: 10 },
  { value: "1000+", label: "1,000+ employees", multiplier: 30 },
];

const complexityLevels = [
  { value: "simple", label: "Simple", description: "Short prompts, basic responses", tokenMultiplier: 1 },
  { value: "moderate", label: "Moderate", description: "System prompts, some context", tokenMultiplier: 1.5 },
  { value: "complex", label: "Complex", description: "Multi-turn, tools, long context", tokenMultiplier: 2.5 },
];

const volumeLevels = [
  { value: "low", label: "Low (100 req/day)", reqPerDay: 100, description: "Internal tools, prototypes" },
  { value: "medium", label: "Medium (1,000 req/day)", reqPerDay: 1000, description: "Small production app" },
  { value: "high", label: "High (10,000 req/day)", reqPerDay: 10000, description: "Customer-facing at scale" },
  { value: "very-high", label: "Very High (50,000 req/day)", reqPerDay: 50000, description: "Enterprise volume" },
];

export default function CalculatorPage() {
  const [step, setStep] = useState(0); // 0=industry, 1=useCase, 2=size, 3=complexity, 4=volume, 5=results
  const [industry, setIndustry] = useState("");
  const [useCase, setUseCase] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [complexity, setComplexity] = useState("");
  const [volume, setVolume] = useState("");

  // Derived token estimates
  const selectedUseCase = useCases.find((u) => u.value === useCase);
  const selectedComplexity = complexityLevels.find((c) => c.value === complexity);
  const selectedVolume = volumeLevels.find((v) => v.value === volume);
  const selectedSize = companySizes.find((s) => s.value === companySize);

  const estimatedInputTokens = selectedUseCase && selectedComplexity
    ? Math.round(selectedUseCase.inputTokens * selectedComplexity.tokenMultiplier)
    : 0;
  const estimatedOutputTokens = selectedUseCase && selectedComplexity
    ? Math.round(selectedUseCase.outputTokens * selectedComplexity.tokenMultiplier)
    : 0;
  const estimatedRequestsPerDay = selectedVolume
    ? Math.round(selectedVolume.reqPerDay * (selectedSize?.multiplier ?? 1))
    : 0;

  // Results state
  const [selectedModels, setSelectedModels] = useState<ModelOption[]>([]);
  const [allModels, setAllModels] = useState<ModelOption[]>([]);
  const [email, setEmail] = useState("");
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);

  // Override inputs (user can tweak after wizard)
  const [inputTokens, setInputTokens] = useState(estimatedInputTokens);
  const [outputTokens, setOutputTokens] = useState(estimatedOutputTokens);
  const [requestsPerDay, setRequestsPerDay] = useState(estimatedRequestsPerDay);

  // Sync derived estimates to input state when wizard changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing derived values to editable inputs
    setInputTokens((prev) => prev !== estimatedInputTokens ? estimatedInputTokens : prev);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing derived values to editable inputs
    setOutputTokens((prev) => prev !== estimatedOutputTokens ? estimatedOutputTokens : prev);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing derived values to editable inputs
    setRequestsPerDay((prev) => prev !== estimatedRequestsPerDay ? estimatedRequestsPerDay : prev);
  }, [estimatedInputTokens, estimatedOutputTokens, estimatedRequestsPerDay]);

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
      ),
    }));
  }, [selectedModels, inputTokens, outputTokens, requestsPerDay]);

  const cheapestMonthly = results.length > 0
    ? Math.min(...results.map((r) => r.calculation.monthly))
    : 0;

  const submitLead = async () => {
    if (!email || !industry || !useCase || !companySize || !complexity) return;

    try {
      await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          industry,
          companySize,
          useCase,
          complexity,
          estimatedInputTokens: inputTokens,
          estimatedOutputTokens: outputTokens,
          estimatedDailyRequests: requestsPerDay,
          estimatedMonthlyCost: cheapestMonthly,
          selectedModels: selectedModels.map((m) => m.name).join(","),
          metadata: JSON.stringify({ volume }),
        }),
      });
      setLeadSubmitted(true);
    } catch (err) {
      console.error("Lead submit failed:", err);
    }
  };

  const steps = [
    { label: "Industry", value: industry },
    { label: "Use Case", value: useCase },
    { label: "Company Size", value: companySize },
    { label: "Complexity", value: complexity },
    { label: "Volume", value: volume },
  ];

  const canProceed = [industry, useCase, companySize, complexity, volume][step] !== "";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-spotlight-300 bg-spotlight-50 px-3 py-1 text-xs font-semibold text-spotlight-700">
            CALCULATE
          </div>
          <h1 className="mt-3 text-3xl font-bold text-ink-900">Cost Calculator</h1>
          <p className="mt-2 text-gray-500">Tell us about your use case — we will estimate your token usage and costs.</p>
        </div>

        {/* Step indicator */}
        {step < 5 && (
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

        {/* Step 0: Industry */}
        {step === 0 && (
          <Card>
            <CardContent className="p-8">
              <div className="mb-6 flex items-center gap-3">
                <Building2 className="h-6 w-6 text-brand-600" />
                <h2 className="text-xl font-semibold text-ink-900">What industry are you in?</h2>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {industries.map((ind) => (
                  <button
                    key={ind.value}
                    onClick={() => setIndustry(ind.value)}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all hover:border-brand-300 hover:shadow-sm ${
                      industry === ind.value ? "border-brand-400 bg-brand-50 ring-2 ring-brand-100" : "border-gray-200 bg-white"
                    }`}
                  >
                    <svg viewBox="0 0 24 24" className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={ind.icon} />
                    </svg>
                    <span className="text-xs font-medium text-ink-900">{ind.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Use Case */}
        {step === 1 && (
          <Card>
            <CardContent className="p-8">
              <div className="mb-6 flex items-center gap-3">
                <Brain className="h-6 w-6 text-brand-600" />
                <h2 className="text-xl font-semibold text-ink-900">What are you building?</h2>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {useCases.map((uc) => (
                  <button
                    key={uc.value}
                    onClick={() => setUseCase(uc.value)}
                    className={`flex flex-col gap-1 rounded-xl border p-4 text-left transition-all hover:border-brand-300 hover:shadow-sm ${
                      useCase === uc.value ? "border-brand-400 bg-brand-50 ring-2 ring-brand-100" : "border-gray-200 bg-white"
                    }`}
                  >
                    <span className="font-semibold text-ink-900">{uc.label}</span>
                    <span className="text-xs text-gray-500">{uc.description}</span>
                    <div className="mt-1 flex gap-3 font-mono text-xs text-gray-400">
                      <span>~{uc.inputTokens} in</span>
                      <span>~{uc.outputTokens} out</span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Company Size */}
        {step === 2 && (
          <Card>
            <CardContent className="p-8">
              <div className="mb-6 flex items-center gap-3">
                <Users className="h-6 w-6 text-brand-600" />
                <h2 className="text-xl font-semibold text-ink-900">How large is your company?</h2>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
                {companySizes.map((size) => (
                  <button
                    key={size.value}
                    onClick={() => setCompanySize(size.value)}
                    className={`rounded-xl border p-4 text-center transition-all hover:border-brand-300 hover:shadow-sm ${
                      companySize === size.value ? "border-brand-400 bg-brand-50 ring-2 ring-brand-100" : "border-gray-200 bg-white"
                    }`}
                  >
                    <span className="block font-semibold text-ink-900">{size.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Complexity */}
        {step === 3 && (
          <Card>
            <CardContent className="p-8">
              <div className="mb-6 flex items-center gap-3">
                <Gauge className="h-6 w-6 text-brand-600" />
                <h2 className="text-xl font-semibold text-ink-900">How complex are your requests?</h2>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {complexityLevels.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setComplexity(c.value)}
                    className={`rounded-xl border p-4 text-left transition-all hover:border-brand-300 hover:shadow-sm ${
                      complexity === c.value ? "border-brand-400 bg-brand-50 ring-2 ring-brand-100" : "border-gray-200 bg-white"
                    }`}
                  >
                    <span className="block font-semibold text-ink-900">{c.label}</span>
                    <span className="mt-1 block text-xs text-gray-500">{c.description}</span>
                    <span className="mt-1 block font-mono text-xs text-gray-400">{c.tokenMultiplier}x token estimate</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Volume */}
        {step === 4 && (
          <Card>
            <CardContent className="p-8">
              <div className="mb-6 flex items-center gap-3">
                <Gauge className="h-6 w-6 text-brand-600" />
                <h2 className="text-xl font-semibold text-ink-900">What is your expected volume?</h2>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {volumeLevels.map((v) => (
                  <button
                    key={v.value}
                    onClick={() => setVolume(v.value)}
                    className={`rounded-xl border p-4 text-left transition-all hover:border-brand-300 hover:shadow-sm ${
                      volume === v.value ? "border-brand-400 bg-brand-50 ring-2 ring-brand-100" : "border-gray-200 bg-white"
                    }`}
                  >
                    <span className="block font-semibold text-ink-900">{v.label}</span>
                    <span className="mt-1 block text-xs text-gray-500">{v.description}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation buttons */}
        {step < 5 && (
          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed}
            >
              {step === 4 ? "See Estimates" : "Next"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step 5: Results */}
        {step === 5 && (
          <div className="space-y-6">
            {/* Summary card */}
            <Card className="glow-brand">
              <CardContent className="p-8">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-ink-900">Your estimated usage</h2>
                    <p className="mt-1 text-sm text-gray-500">Based on your selections — adjust if needed.</p>
                  </div>
                  <button onClick={() => setStep(0)} className="text-sm text-gray-500 hover:text-brand-600">
                    Edit selections
                  </button>
                </div>

                <div className="mb-4 flex flex-wrap gap-2">
                  <Badge variant="default">{industries.find((i) => i.value === industry)?.label}</Badge>
                  <Badge variant="accent">{useCases.find((u) => u.value === useCase)?.label}</Badge>
                  <Badge variant="secondary">{companySizes.find((s) => s.value === companySize)?.label}</Badge>
                  <Badge variant="outline">{complexityLevels.find((c) => c.value === complexity)?.label}</Badge>
                  <Badge variant="outline">{volumeLevels.find((v) => v.value === volume)?.label}</Badge>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-xl bg-spotlight-50 p-4">
                    <p className="text-xs font-medium text-gray-500">Input tokens / request</p>
                    <Input
                      type="number"
                      value={inputTokens}
                      onChange={(e) => setInputTokens(parseInt(e.target.value) || 0)}
                      className="mt-1 border-0 bg-transparent p-0 font-mono text-lg font-bold text-ink-900 focus:ring-0"
                    />
                  </div>
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-xs font-medium text-gray-500">Output tokens / request</p>
                    <Input
                      type="number"
                      value={outputTokens}
                      onChange={(e) => setOutputTokens(parseInt(e.target.value) || 0)}
                      className="mt-1 border-0 bg-transparent p-0 font-mono text-lg font-bold text-ink-900 focus:ring-0"
                    />
                  </div>
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-xs font-medium text-gray-500">Requests / day</p>
                    <Input
                      type="number"
                      value={requestsPerDay}
                      onChange={(e) => setRequestsPerDay(parseInt(e.target.value) || 0)}
                      className="mt-1 border-0 bg-transparent p-0 font-mono text-lg font-bold text-ink-900 focus:ring-0"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Model picker */}
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-4 font-semibold text-ink-900">Select models to compare costs</h3>
                <ModelPicker
                  selected={selectedModels}
                  onChange={setSelectedModels}
                  allModels={allModels}
                />
              </CardContent>
            </Card>

            {/* Cost breakdown */}
            {results.length > 0 && (
              <div>
                <CostBreakdown results={results} />

                {/* Lead-gen CTA */}
                {!leadSubmitted && (
                  <Card className="mt-6 overflow-hidden border-spotlight-300">
                    <CardContent className="p-6">
                      {!showLeadForm ? (
                        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-spotlight-100">
                              <Sparkles className="h-5 w-5 text-spotlight-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-ink-900">Get a detailed cost report</p>
                              <p className="text-sm text-gray-500">We will email you a breakdown with recommendations for your use case.</p>
                            </div>
                          </div>
                          <Button variant="accent" onClick={() => setShowLeadForm(true)}>
                            <Mail className="h-4 w-4" />
                            Get my report
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <Mail className="h-5 w-5 text-spotlight-600" />
                            <h3 className="font-semibold text-ink-900">Get your detailed cost report</h3>
                          </div>
                          <div className="flex flex-col gap-3 sm:flex-row">
                            <Input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="you@company.com"
                              className="flex-1"
                            />
                            <Button
                              variant="accent"
                              onClick={submitLead}
                              disabled={!email}
                            >
                              Send report
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-gray-400">
                            We use this to send your report and occasionally share relevant AI cost insights. No spam.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {leadSubmitted && (
                  <Card className="mt-6 border-brand-200 bg-brand-50">
                    <CardContent className="flex items-center gap-3 p-6">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-ink-900">Report on its way!</p>
                        <p className="text-sm text-gray-600">Check your email at {email} for your detailed cost breakdown.</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            <div className="flex justify-start">
              <Button variant="ghost" onClick={() => setStep(0)}>
                <ArrowLeft className="h-4 w-4" />
                Start over
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
