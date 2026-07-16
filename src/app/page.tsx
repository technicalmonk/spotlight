import { Hero } from "@/components/home/hero";
import { FeaturedScenarios } from "@/components/home/featured-scenarios";
import { getFeaturedScenarios, getTotalModelCount, getIngestionStatus } from "@/db/queries";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import { Activity, Database, TrendingDown, Zap, Gauge, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [totalModels, featuredScenarios, status] = await Promise.all([
    getTotalModelCount().catch(() => 0),
    getFeaturedScenarios().catch(() => []),
    getIngestionStatus().catch(() => ({
      lastRun: null,
      totalModels: 0,
      totalProviders: 0,
      activeModels: 0,
      recentPriceChanges: 0,
    })),
  ]);

  return (
    <>
      <Hero totalModels={totalModels} />

      {/* Status bar */}
      <section className="border-b border-gray-200 bg-ink-900">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-spotlight-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-spotlight-400" />
            </span>
            <span>
              {status.recentPriceChanges} models updated recently
              {status.lastRun && (
                <> · Last sync: {formatDateTime(status.lastRun)}</>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400 sm:ml-auto">
            <Database className="h-4 w-4 text-spotlight-400" />
            <span>{status.totalModels} models · {status.totalProviders} providers</span>
          </div>
        </div>
      </section>

      {/* Your Current Scenario CTA */}
      <section className="border-b border-gray-200 bg-gradient-to-r from-brand-50 to-spotlight-50">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ink-900">
              <Gauge className="h-6 w-6 text-spotlight-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink-900">Already using an AI model?</h2>
              <p className="text-sm text-gray-600">See how much you could save by switching to a cheaper alternative via Xilos WorkBench.</p>
            </div>
          </div>
          <Link href="/optimizer" className="sm:ml-auto">
            <Button size="lg" variant="accent">
              Your Current Scenario <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <FeaturedScenarios scenarios={featuredScenarios} />

      {/* Popular comparisons */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold text-ink-900">
              Popular Comparisons
            </h2>
            <p className="mt-2 text-gray-500">
              Side-by-side analysis of leading models.
            </p>
          </div>
          <Link
            href="/compare"
            className="hidden text-sm font-semibold text-brand-600 hover:text-brand-700 sm:block"
          >
            Compare any models →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/compare?models=gpt-4o,claude-3-5-sonnet,gemini-1-5-pro" className="group">
            <Card className="card-hover-lift h-full overflow-hidden">
              <CardContent className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50">
                  <TrendingDown className="h-6 w-6 text-brand-600" />
                </div>
                <h3 className="text-lg font-semibold text-ink-900">
                  GPT-4o vs Claude 3.5 vs Gemini 1.5
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Flagship model showdown
                </p>
                <p className="mt-4 text-sm font-semibold text-brand-600 opacity-0 transition-opacity group-hover:opacity-100">
                  Compare now →
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/compare?models=gpt-4o-mini,claude-3-5-haiku,gemini-1-5-flash" className="group">
            <Card className="card-hover-lift h-full overflow-hidden">
              <CardContent className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-spotlight-50">
                  <Zap className="h-6 w-6 text-spotlight-600" />
                </div>
                <h3 className="text-lg font-semibold text-ink-900">
                  Fast & Cheap Models
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Best value for high-volume workloads
                </p>
                <p className="mt-4 text-sm font-semibold text-brand-600 opacity-0 transition-opacity group-hover:opacity-100">
                  Compare now →
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/compare?models=gpt-4o,claude-3-opus,deepseek-chat" className="group">
            <Card className="card-hover-lift h-full overflow-hidden">
              <CardContent className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50">
                  <Activity className="h-6 w-6 text-brand-600" />
                </div>
                <h3 className="text-lg font-semibold text-ink-900">
                  Premium vs Budget
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Is the premium tier worth it?
                </p>
                <p className="mt-4 text-sm font-semibold text-brand-600 opacity-0 transition-opacity group-hover:opacity-100">
                  Compare now →
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>
    </>
  );
}
