import { Card, CardContent } from "@/components/ui/card";
import { getAllModels, getScenarios } from "@/db/queries";
import { calculateCost } from "@/lib/calculator";
import { formatPrice } from "@/lib/utils";
import type { ModelWithPricing, UsageScenario } from "@/lib/types";
import { benchmarkModels, intelligenceColor, speedColor } from "@/lib/benchmarks";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Top 10 most popular models by user base — uses latest 2026 model names. */
const TOP_10_SLUGS = [
  "gpt-5-6-sol",
  "claude-opus-4-8",
  "gemini-3-1-pro",
  "gpt-5-4-mini",
  "claude-4-5-haiku",
  "gemini-3-5-flash",
  "deepseek-v4-pro",
  "glm-5-2",
  "kimi-k2-6",
  "qwen3-7-max",
];

/** Medium usage scenario: Code Generation (2000 in, 1500 out, 500 req/day). */
const MEDIUM_USAGE = {
  inputTokens: 2000,
  outputTokens: 1500,
  requestsPerDay: 500,
} as const;

// ---------------------------------------------------------------------------
// Color helper — green-to-red cost visualization
// ---------------------------------------------------------------------------

/**
 * Returns Tailwind bg/text classes for a monthly cost, scaled from green (cheap)
 * to red (expensive).
 *
 *   < $100/month   → bg-green-50 text-green-700
 *   $100–$500      → bg-yellow-50 text-yellow-700
 *   $500–$2000     → bg-orange-50 text-orange-700
 *   > $2000        → bg-red-50 text-red-700
 */
function costColorClass(monthlyCost: number): string {
  if (monthlyCost < 100) return "bg-green-50 text-green-700";
  if (monthlyCost < 500) return "bg-yellow-50 text-yellow-700";
  if (monthlyCost < 2000) return "bg-orange-50 text-orange-700";
  return "bg-red-50 text-red-700";
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toNum(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

/** Combined input + output price per 1M tokens (for sorting cheapest). */
function combinedPrice(m: ModelWithPricing): number {
  if (!m.currentPricing) return Infinity;
  return (
    toNum(m.currentPricing.inputPricePerMillion) +
    toNum(m.currentPricing.outputPricePerMillion)
  );
}

function monthlyCostFor(
  m: ModelWithPricing,
  inputTokens: number,
  outputTokens: number,
  requestsPerDay: number,
): number {
  if (!m.currentPricing) return 0;
  return calculateCost(
    {
      inputPricePerMillion: m.currentPricing.inputPricePerMillion,
      outputPricePerMillion: m.currentPricing.outputPricePerMillion,
    },
    inputTokens,
    outputTokens,
    requestsPerDay,
  ).monthly;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function DashboardPage() {
  // Fetch all data with graceful fallbacks for empty DB
  const [allModels, scenarios] = await Promise.all([
    getAllModels().catch(() => [] as ModelWithPricing[]),
    getScenarios().catch(() => [] as UsageScenario[]),
  ]);

  // --- Section 1: Top 10 models by popularity ---
  const top10 = TOP_10_SLUGS.map((slug) =>
    allModels.find((m) => m.model.slug === slug),
  ).filter((m): m is ModelWithPricing => m !== undefined);

  // --- Section 2: Bottom 5 cheapest models ---
  const cheapest5 = [...allModels]
    .filter((m) => m.currentPricing !== null)
    .sort((a, b) => combinedPrice(a) - combinedPrice(b))
    .slice(0, 5);

  // --- Section 3: Top 5 use case comparison ---
  // Use the first 5 scenarios (seeded scenarios, sorted by sortOrder)
  const top5Scenarios = scenarios.slice(0, 5);
  // Use the 3 cheapest models for the comparison columns
  const top3Cheapest = cheapest5.slice(0, 3);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-spotlight-300 bg-spotlight-100 px-3 py-1 text-xs font-semibold text-spotlight-700">
          DASHBOARD
        </div>
        <h1 className="mt-3 text-3xl font-bold text-ink-900">
          AI Cost Dashboard
        </h1>
        <p className="mt-2 max-w-2xl text-gray-500">
          Monthly cost projections across the most popular models and cheapest
          alternatives. Green = affordable, red = expensive. All costs are
          based on 30-day months.
        </p>
      </div>

      {/* ================================================================ */}
      {/* Section 1 — Top 10 Models by Popularity                          */}
      {/* ================================================================ */}
      <section className="mb-12">
        <SectionHeader
          badge="TOP 10 MODELS"
          title="Most Popular Models — Monthly Cost"
          subtitle={`Cost at medium usage: ${MEDIUM_USAGE.inputTokens.toLocaleString()} in / ${MEDIUM_USAGE.outputTokens.toLocaleString()} out tokens, ${MEDIUM_USAGE.requestsPerDay.toLocaleString()} req/day`}
        />

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50/80">
                <tr className="text-left">
                  <th className="px-4 py-3.5 font-semibold text-gray-700">
                    Model
                  </th>
                  <th className="hidden px-4 py-3.5 font-semibold text-gray-700 md:table-cell">
                    Provider
                  </th>
                  <th className="hidden px-4 py-3.5 text-right font-semibold text-gray-700 lg:table-cell">
                    Intelligence
                  </th>
                  <th className="hidden px-4 py-3.5 text-right font-semibold text-gray-700 lg:table-cell">
                    Speed (t/s)
                  </th>
                  <th className="px-4 py-3.5 text-right font-semibold text-gray-700">
                    Input $/1M
                  </th>
                  <th className="px-4 py-3.5 text-right font-semibold text-gray-700">
                    Output $/1M
                  </th>
                  <th className="px-4 py-3.5 text-right font-semibold text-gray-700">
                    Monthly Cost
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {top10.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-16 text-center text-gray-500"
                    >
                      No model data available. Run ingestion to populate the
                      database.
                    </td>
                  </tr>
                ) : (
                  top10.map((entry, idx) => {
                    const monthly = monthlyCostFor(
                      entry,
                      MEDIUM_USAGE.inputTokens,
                      MEDIUM_USAGE.outputTokens,
                      MEDIUM_USAGE.requestsPerDay,
                    );
                    const bench = benchmarkModels.find((b) => b.slug === entry.model.slug);
                    return (
                      <tr
                        key={entry.model.id}
                        className="transition-colors hover:bg-gray-50/50"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink-900 text-xs font-bold text-white">
                              {idx + 1}
                            </span>
                            <span className="font-medium text-ink-900">
                              {entry.model.name}
                            </span>
                          </div>
                        </td>
                        <td className="hidden px-4 py-3 text-gray-600 md:table-cell">
                          {entry.provider?.name ?? "—"}
                        </td>
                        <td className="hidden px-4 py-3 text-right font-mono lg:table-cell">
                          <span className={`font-semibold ${intelligenceColor(bench?.intelligenceIndex ?? null)}`}>
                            {bench?.intelligenceIndex ?? "—"}
                          </span>
                        </td>
                        <td className="hidden px-4 py-3 text-right font-mono lg:table-cell">
                          <span className={speedColor(bench?.outputSpeed ?? null)}>
                            {bench?.outputSpeed ?? "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-gray-600">
                          {entry.currentPricing
                            ? formatPrice(entry.currentPricing.inputPricePerMillion)
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-gray-600">
                          {entry.currentPricing
                            ? formatPrice(entry.currentPricing.outputPricePerMillion)
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={`inline-block rounded-md px-2.5 py-1 font-mono text-sm font-semibold tabular-nums ${costColorClass(monthly)}`}
                          >
                            {entry.currentPricing
                              ? formatPrice(monthly)
                              : "—"}
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

      {/* ================================================================ */}
      {/* Section 2 — Bottom 5 Cheapest Models                              */}
      {/* ================================================================ */}
      <section className="mb-12">
        <SectionHeader
          badge="CHEAPEST 5"
          title="Bottom 5 Cheapest Models"
          subtitle="Lowest combined input + output price per 1M tokens"
        />

        {cheapest5.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {cheapest5.map((entry, idx) => (
              <Card
                key={entry.model.id}
                className="card-hover-lift relative overflow-hidden"
              >
                <CardContent className="p-5">
                  {/* Cheapest badge */}
                  {idx === 0 && (
                    <span className="absolute right-3 top-3 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-green-700">
                      Cheapest
                    </span>
                  )}
                  <h3 className="pr-16 text-sm font-bold text-ink-900">
                    {entry.model.name}
                  </h3>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {entry.provider?.name ?? "—"}
                  </p>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Input</span>
                      <span className="font-mono text-sm font-medium text-gray-700">
                        {formatPrice(entry.currentPricing!.inputPricePerMillion)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Output</span>
                      <span className="font-mono text-sm font-medium text-gray-700">
                        {formatPrice(entry.currentPricing!.outputPricePerMillion)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-100 pt-2">
                      <span className="text-xs font-semibold text-gray-500">
                        Combined
                      </span>
                      <span className="font-mono text-sm font-bold text-ink-900">
                        {formatPrice(combinedPrice(entry))}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ================================================================ */}
      {/* Section 3 — Top 5 Use Cases: Cost Comparison                      */}
      {/* ================================================================ */}
      <section className="mb-12">
        <SectionHeader
          badge="USE CASE COMPARISON"
          title="Top 5 Use Cases — Cost by Cheapest Models"
          subtitle="Monthly cost for each scenario across the 3 cheapest models"
        />

        {top5Scenarios.length === 0 || top3Cheapest.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 bg-gray-50/80">
                  <tr className="text-left">
                    <th className="px-4 py-3.5 font-semibold text-gray-700">
                      Use Case
                    </th>
                    <th className="hidden px-4 py-3.5 font-semibold text-gray-700 sm:table-cell">
                      Volume
                    </th>
                    {top3Cheapest.map((m) => (
                      <th
                        key={m.model.id}
                        className="px-4 py-3.5 text-right font-semibold text-gray-700"
                      >
                        {m.model.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {top5Scenarios.map((scenario) => (
                    <tr
                      key={scenario.id}
                      className="transition-colors hover:bg-gray-50/50"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-ink-900">
                          {scenario.name}
                        </div>
                        <span className="text-xs capitalize text-gray-400">
                          {scenario.category}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 text-xs text-gray-500 sm:table-cell">
                        {scenario.defaultInputTokens.toLocaleString()} in ·{" "}
                        {scenario.defaultOutputTokens.toLocaleString()} out ·{" "}
                        {scenario.defaultDailyRequests.toLocaleString()} req/day
                      </td>
                      {top3Cheapest.map((m) => {
                        const monthly = monthlyCostFor(
                          m,
                          scenario.defaultInputTokens,
                          scenario.defaultOutputTokens,
                          scenario.defaultDailyRequests,
                        );
                        return (
                          <td
                            key={m.model.id}
                            className="px-4 py-3 text-right"
                          >
                            <span
                              className={`inline-block rounded-md px-2.5 py-1 font-mono text-sm font-semibold tabular-nums ${costColorClass(monthly)}`}
                            >
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

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500">
          <span className="font-semibold text-gray-600">Cost scale:</span>
          <LegendItem className="bg-green-50 text-green-700" label="< $100/mo" />
          <LegendItem className="bg-yellow-50 text-yellow-700" label="$100–$500/mo" />
          <LegendItem className="bg-orange-50 text-orange-700" label="$500–$2000/mo" />
          <LegendItem className="bg-red-50 text-red-700" label="> $2000/mo" />
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionHeader({
  badge,
  title,
  subtitle,
}: {
  badge: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3">
        <div className="rounded-md bg-ink-900 px-2.5 py-1 text-xs font-bold tracking-wide text-white">
          {badge}
        </div>
        <span className="text-xs font-medium text-spotlight-600">
          ●
        </span>
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

function EmptyState() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500 shadow-sm">
      No model data available. Run ingestion to populate the database.
    </div>
  );
}
