import { Card, CardContent } from "@/components/ui/card";
import { getAllModels, getScenarios } from "@/db/queries";
import { calculateCost } from "@/lib/calculator";
import { formatPrice } from "@/lib/utils";
import type { ModelWithPricing, UsageScenario } from "@/lib/types";
import { benchmarkModels, intelligenceColor, speedColor } from "@/lib/benchmarks";

export const dynamic = "force-dynamic";

const TOP_10_SLUGS = [
  "kimi-k3", "gpt-5-6-sol", "claude-opus-4-8", "gemini-3-1-pro",
  "gpt-5-4-mini", "gemini-3-5-flash", "deepseek-v4-pro", "glm-5-2",
  "kimi-k2-6", "qwen3-7-max",
];

const MEDIUM_USAGE = { inputTokens: 2000, outputTokens: 1500, requestsPerDay: 500 } as const;

// Tier comparison slugs — expensive vs mid vs cheap
const TIER_SLUGS = {
  premium: ["claude-fable-5", "claude-opus-4-8", "gpt-5-6-sol"],
  mid: ["kimi-k3", "glm-5-2", "qwen3-7-max"],
  budget: ["deepseek-v4-pro", "gemini-3-1-flash-lite", "deepseek-v4-flash"],
};

function costColorClass(monthlyCost: number): string {
  if (monthlyCost < 100) return "bg-green-50 text-green-700";
  if (monthlyCost < 500) return "bg-yellow-50 text-yellow-700";
  if (monthlyCost < 2000) return "bg-orange-50 text-orange-700";
  return "bg-red-50 text-red-700";
}

function toNum(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

function monthlyCostFor(m: ModelWithPricing, inputTokens: number, outputTokens: number, requestsPerDay: number): number {
  if (!m.currentPricing) return 0;
  return calculateCost(
    { inputPricePerMillion: m.currentPricing.inputPricePerMillion, outputPricePerMillion: m.currentPricing.outputPricePerMillion },
    inputTokens, outputTokens, requestsPerDay,
  ).monthly;
}

export default async function CostAnalysisPage() {
  const [allModels, scenarios] = await Promise.all([
    getAllModels().catch(() => [] as ModelWithPricing[]),
    getScenarios().catch(() => [] as UsageScenario[]),
  ]);

  const top10 = TOP_10_SLUGS.map((slug) => allModels.find((m) => m.model.slug === slug)).filter((m): m is ModelWithPricing => m !== undefined);

  const tierModels = {
    premium: TIER_SLUGS.premium.map(s => allModels.find(m => m.model.slug === s)).filter((m): m is ModelWithPricing => m !== undefined),
    mid: TIER_SLUGS.mid.map(s => allModels.find(m => m.model.slug === s)).filter((m): m is ModelWithPricing => m !== undefined),
    budget: TIER_SLUGS.budget.map(s => allModels.find(m => m.model.slug === s)).filter((m): m is ModelWithPricing => m !== undefined),
  };

  const top5Scenarios = scenarios.slice(0, 5);
  const allTierModels = [...tierModels.premium, ...tierModels.mid, ...tierModels.budget];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
          COST ANALYSIS
        </div>
        <h1 className="mt-3 text-3xl font-bold text-ink-900">AI Cost Analysis</h1>
        <p className="mt-2 max-w-2xl text-gray-500">
          Monthly cost projections across popular models and pricing tiers. Compare premium, mid-range, and budget models side by side.
        </p>
      </div>

      {/* Section 1: Top 10 Models */}
      <section className="mb-12">
        <SectionHeader badge="TOP 10 MODELS" title="Most Popular Models — Monthly Cost" subtitle={`Cost at medium usage: ${MEDIUM_USAGE.inputTokens.toLocaleString()} in / ${MEDIUM_USAGE.outputTokens.toLocaleString()} out tokens, ${MEDIUM_USAGE.requestsPerDay.toLocaleString()} req/day`} />
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50/80">
                <tr className="text-left">
                  <th className="px-4 py-3.5 font-semibold text-gray-700">Model</th>
                  <th className="hidden px-4 py-3.5 font-semibold text-gray-700 md:table-cell">Provider</th>
                  <th className="hidden px-4 py-3.5 text-right font-semibold text-gray-700 lg:table-cell">Intelligence</th>
                  <th className="hidden px-4 py-3.5 text-right font-semibold text-gray-700 lg:table-cell">Speed (t/s)</th>
                  <th className="px-4 py-3.5 text-right font-semibold text-gray-700">All-in $/1M</th>
                  <th className="px-4 py-3.5 text-right font-semibold text-gray-700">Monthly Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {top10.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-16 text-center text-gray-500">No model data available.</td></tr>
                ) : (
                  top10.map((entry, idx) => {
                    const monthly = monthlyCostFor(entry, MEDIUM_USAGE.inputTokens, MEDIUM_USAGE.outputTokens, MEDIUM_USAGE.requestsPerDay);
                    const bench = benchmarkModels.find((b) => b.slug === entry.model.slug);
                    const allIn = toNum(entry.currentPricing?.inputPricePerMillion) + toNum(entry.currentPricing?.outputPricePerMillion);
                    return (
                      <tr key={entry.model.id} className="transition-colors hover:bg-gray-50/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink-900 text-xs font-bold text-white">{idx + 1}</span>
                            <span className="font-medium text-ink-900">{entry.model.name}</span>
                          </div>
                        </td>
                        <td className="hidden px-4 py-3 text-gray-600 md:table-cell">{entry.provider?.name ?? "—"}</td>
                        <td className="hidden px-4 py-3 text-right font-mono lg:table-cell">
                          <span className={`font-semibold ${intelligenceColor(bench?.intelligenceIndex ?? null)}`}>{bench?.intelligenceIndex ?? "—"}</span>
                        </td>
                        <td className="hidden px-4 py-3 text-right font-mono lg:table-cell">
                          <span className={speedColor(bench?.outputSpeed ?? null)}>{bench?.outputSpeed ?? "—"}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-gray-600">{entry.currentPricing ? formatPrice(allIn) : "—"}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`inline-block rounded-md px-2.5 py-1 font-mono text-sm font-semibold tabular-nums ${costColorClass(monthly)}`}>
                            {entry.currentPricing ? formatPrice(monthly) : "—"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Section 2: Tier Comparison */}
      <section id="tier-comparison" className="mb-12">
        <SectionHeader badge="TIER COMPARISON" title="Premium vs Mid-Range vs Budget" subtitle="Same usage, different tiers. See the cost gap between Claude Fable, Kimi K3, and DeepSeek V4 Flash at medium volume." />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Premium tier */}
          <Card className="border-red-200 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wide text-red-600">Premium</h3>
                <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">$30+ /1M</span>
              </div>
              {tierModels.premium.map((entry) => {
                const monthly = monthlyCostFor(entry, MEDIUM_USAGE.inputTokens, MEDIUM_USAGE.outputTokens, MEDIUM_USAGE.requestsPerDay);
                return (
                  <div key={entry.model.id} className="mb-3 border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <p className="font-medium text-ink-900">{entry.model.name}</p>
                    <p className="text-xs text-gray-500">{entry.provider?.name}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="font-mono text-xs text-gray-400">${toNum(entry.currentPricing?.inputPricePerMillion)}/${toNum(entry.currentPricing?.outputPricePerMillion)}</span>
                      <span className={`rounded-md px-2 py-0.5 font-mono text-sm font-semibold ${costColorClass(monthly)}`}>{formatPrice(monthly)}/mo</span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Mid tier */}
          <Card className="border-yellow-200 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wide text-yellow-600">Mid-Range</h3>
                <span className="rounded-full bg-yellow-50 px-2 py-0.5 text-[10px] font-bold text-yellow-700">$2–$6 /1M</span>
              </div>
              {tierModels.mid.map((entry) => {
                const monthly = monthlyCostFor(entry, MEDIUM_USAGE.inputTokens, MEDIUM_USAGE.outputTokens, MEDIUM_USAGE.requestsPerDay);
                return (
                  <div key={entry.model.id} className="mb-3 border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <p className="font-medium text-ink-900">{entry.model.name}</p>
                    <p className="text-xs text-gray-500">{entry.provider?.name}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="font-mono text-xs text-gray-400">${toNum(entry.currentPricing?.inputPricePerMillion)}/${toNum(entry.currentPricing?.outputPricePerMillion)}</span>
                      <span className={`rounded-md px-2 py-0.5 font-mono text-sm font-semibold ${costColorClass(monthly)}`}>{formatPrice(monthly)}/mo</span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Budget tier */}
          <Card className="border-green-200 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wide text-green-600">Budget</h3>
                <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700">Under $0.50 /1M</span>
              </div>
              {tierModels.budget.map((entry) => {
                const monthly = monthlyCostFor(entry, MEDIUM_USAGE.inputTokens, MEDIUM_USAGE.outputTokens, MEDIUM_USAGE.requestsPerDay);
                return (
                  <div key={entry.model.id} className="mb-3 border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <p className="font-medium text-ink-900">{entry.model.name}</p>
                    <p className="text-xs text-gray-500">{entry.provider?.name}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="font-mono text-xs text-gray-400">${toNum(entry.currentPricing?.inputPricePerMillion)}/${toNum(entry.currentPricing?.outputPricePerMillion)}</span>
                      <span className={`rounded-md px-2 py-0.5 font-mono text-sm font-semibold ${costColorClass(monthly)}`}>{formatPrice(monthly)}/mo</span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Savings callout */}
        {tierModels.premium.length > 0 && tierModels.budget.length > 0 && (
          <div className="mt-4 rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-700">
            <strong>Key insight:</strong> Switching from a premium model (e.g. Claude Fable at $30/M) to a budget model (e.g. DeepSeek V4 Flash at $0.18/M) can reduce costs by <strong>99%+</strong> for simple tasks — with minimal quality loss for many use cases.
          </div>
        )}
      </section>

      {/* Section 3: Scenario comparison across tiers */}
      <section id="scenario-comparison" className="mb-12">
        <SectionHeader badge="USE CASE COMPARISON" title="Cost by Scenario — Across Tiers" subtitle="Monthly cost for each scenario across premium, mid-range, and budget models" />

        {top5Scenarios.length === 0 || allTierModels.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500 shadow-sm">No data available.</div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 bg-gray-50/80">
                  <tr className="text-left">
                    <th className="px-4 py-3.5 font-semibold text-gray-700">Use Case</th>
                    <th className="hidden px-4 py-3.5 font-semibold text-gray-700 sm:table-cell">Volume</th>
                    {allTierModels.map((m) => {
                      const isPremium = tierModels.premium.includes(m);
                      const isBudget = tierModels.budget.includes(m);
                      const tierColor = isPremium ? "text-red-600" : isBudget ? "text-green-600" : "text-yellow-600";
                      return (
                        <th key={m.model.id} className="px-4 py-3.5 text-right font-semibold text-gray-700">
                          <span className={tierColor}>{m.model.name}</span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {top5Scenarios.map((scenario) => (
                    <tr key={scenario.id} className="transition-colors hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-ink-900">{scenario.name}</div>
                        <span className="text-xs capitalize text-gray-400">{scenario.category}</span>
                      </td>
                      <td className="hidden px-4 py-3 text-xs text-gray-500 sm:table-cell">
                        {scenario.defaultInputTokens.toLocaleString()} in · {scenario.defaultOutputTokens.toLocaleString()} out · {scenario.defaultDailyRequests.toLocaleString()} req/day
                      </td>
                      {allTierModels.map((m) => {
                        const monthly = monthlyCostFor(m, scenario.defaultInputTokens, scenario.defaultOutputTokens, scenario.defaultDailyRequests);
                        return (
                          <td key={m.model.id} className="px-4 py-3 text-right">
                            <span className={`inline-block rounded-md px-2.5 py-1 font-mono text-sm font-semibold tabular-nums ${costColorClass(monthly)}`}>
                              {formatPrice(monthly)}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500">
        <span className="font-semibold text-gray-600">Cost scale:</span>
        <LegendItem className="bg-green-50 text-green-700" label="< $100/mo" />
        <LegendItem className="bg-yellow-50 text-yellow-700" label="$100–$500/mo" />
        <LegendItem className="bg-orange-50 text-orange-700" label="$500–$2000/mo" />
        <LegendItem className="bg-red-50 text-red-700" label="> $2000/mo" />
      </div>
    </div>
  );
}

function SectionHeader({ badge, title, subtitle }: { badge: string; title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3">
        <div className="rounded-md bg-ink-900 px-2.5 py-1 text-xs font-bold tracking-wide text-white">{badge}</div>
        <span className="text-xs font-medium text-spotlight-600">●</span>
      </div>
      <h2 className="mt-2 text-2xl font-bold text-ink-900">{title}</h2>
      <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
    </div>
  );
}

function LegendItem({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block h-3 w-3 rounded ${className}`} />
      {label}
    </span>
  );
}
