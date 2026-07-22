import { Hero } from "@/components/home/hero";
import { ModelScroll } from "@/components/home/model-scroll";
import { FeaturedScenarios } from "@/components/home/featured-scenarios";
import { getFeaturedScenarios, getTotalModelCount, getIngestionStatus } from "@/db/queries";
import { formatDateTime } from "@/lib/utils";
import { Activity, TrendingDown, Zap, ArrowRight, Gauge, Database } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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

      {/* Model logo scroll */}
      <ModelScroll />

      {/* Unified CTA section: "What will it cost?" + "Already using?" */}
      <section className="border-b border-gray-200 bg-gradient-to-br from-brand-50/50 via-white to-spotlight-50/50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* What will it cost? */}
            <Card className="border-gray-200 shadow-sm">
              <CardContent className="flex flex-col gap-4 p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink-900">
                    <Database className="h-5 w-5 text-spotlight-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-ink-900">What will it cost?</h2>
                    <p className="text-xs text-gray-500">
                      {status.totalModels} models · {status.totalProviders} providers
                      {status.recentPriceChanges > 0 && ` · ${status.recentPriceChanges} updated recently`}
                      {status.lastRun && ` · Synced ${formatDateTime(status.lastRun)}`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href="/models" className="flex-1">
                    <Button variant="outline" className="w-full">
                      Explore Models
                    </Button>
                  </Link>
                  <Link href="/calculator" className="flex-1">
                    <Button variant="accent" className="w-full">
                      Calculate Cost <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Already using a model? */}
            <Card className="border-gray-200 shadow-sm">
              <CardContent className="flex flex-col gap-4 p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
                    <Gauge className="h-5 w-5 text-brand-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-ink-900">Already using a model?</h2>
                    <p className="text-xs text-gray-500">
                      See how much you could save by switching to a cheaper alternative via Xilos WorkBench.
                    </p>
                  </div>
                </div>
                <Link href="/optimizer">
                  <Button variant="accent" className="w-full">
                    Your Current Scenario <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <FeaturedScenarios scenarios={featuredScenarios} />

      {/* Popular comparisons */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-ink-900">Popular Comparisons</h2>
            <p className="mt-1 text-sm text-gray-500">Side-by-side analysis of leading models.</p>
          </div>
          <Link
            href="/compare"
            className="hidden text-sm font-semibold text-brand-600 hover:text-brand-700 sm:block"
          >
            Compare any models →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/compare?models=gpt-5-6-sol,claude-opus-4-8,gemini-3-1-pro" className="group">
            <Card className="card-hover-lift h-full overflow-hidden">
              <CardContent className="p-5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
                  <TrendingDown className="h-5 w-5 text-brand-600" />
                </div>
                <h3 className="text-base font-semibold text-ink-900">GPT-5.6 vs Claude 4.8 vs Gemini 3.1</h3>
                <p className="mt-1 text-sm text-gray-500">Frontier model showdown</p>
                <p className="mt-3 text-sm font-semibold text-brand-600 opacity-0 transition-opacity group-hover:opacity-100">Compare now →</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/compare?models=gpt-5-4-mini,claude-4-5-haiku,gemini-3-1-flash-lite" className="group">
            <Card className="card-hover-lift h-full overflow-hidden">
              <CardContent className="p-5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-spotlight-50">
                  <Zap className="h-5 w-5 text-spotlight-600" />
                </div>
                <h3 className="text-base font-semibold text-ink-900">Fast & Cheap Models</h3>
                <p className="mt-1 text-sm text-gray-500">Best value for high-volume workloads</p>
                <p className="mt-3 text-sm font-semibold text-brand-600 opacity-0 transition-opacity group-hover:opacity-100">Compare now →</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/compare?models=gpt-5-6-sol,deepseek-v4-pro,glm-5-2" className="group">
            <Card className="card-hover-lift h-full overflow-hidden">
              <CardContent className="p-5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
                  <Activity className="h-5 w-5 text-brand-600" />
                </div>
                <h3 className="text-base font-semibold text-ink-900">Premium vs Open Source</h3>
                <p className="mt-1 text-sm text-gray-500">Is the premium tier worth it?</p>
                <p className="mt-3 text-sm font-semibold text-brand-600 opacity-0 transition-opacity group-hover:opacity-100">Compare now →</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>
    </>
  );
}
