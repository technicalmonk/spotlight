import { Hero } from "@/components/home/hero";
import { FeaturedScenarios } from "@/components/home/featured-scenarios";
import { getFeaturedScenarios, getTotalModelCount, getIngestionStatus } from "@/db/queries";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import { Activity, Database, TrendingDown } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Fetch data with graceful fallback so the page renders even if DB is empty/unavailable
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

      {/* Status indicator */}
      <section className="border-b border-gray-200 bg-gray-50">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            <span>
              {status.recentPriceChanges} models updated recently
              {status.lastRun && (
                <> &middot; Last sync: {formatDateTime(status.lastRun)}</>
              )}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
            <Database className="h-4 w-4" />
            <span>{status.totalModels} active models tracked</span>
          </div>
        </div>
      </section>

      <FeaturedScenarios scenarios={featuredScenarios} />

      {/* Popular comparisons */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Popular Comparisons
          </h2>
          <p className="mt-2 text-gray-500">
            Side-by-side analysis of leading models.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/compare?models=gpt-4o,claude-3-5-sonnet,gemini-1-5-pro">
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
                  <TrendingDown className="h-5 w-5 text-brand-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    GPT-4o vs Claude 3.5 vs Gemini 1.5
                  </h3>
                  <p className="text-sm text-gray-500">
                    Flagship model showdown
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/compare?models=gpt-4o-mini,claude-3-5-haiku,gemini-1-5-flash">
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
                  <Activity className="h-5 w-5 text-brand-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Fast & Cheap Models
                  </h3>
                  <p className="text-sm text-gray-500">
                    Best value for high-volume workloads
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/compare?models=gpt-4o,claude-3-opus,deepseek-chat">
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
                  <TrendingDown className="h-5 w-5 text-brand-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Premium vs Budget
                  </h3>
                  <p className="text-sm text-gray-500">
                    Is the premium tier worth it?
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>
    </>
  );
}
