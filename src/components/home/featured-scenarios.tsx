import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import type { UsageScenario } from "@/lib/types";

interface FeaturedScenariosProps {
  scenarios: UsageScenario[];
}

const categoryIcons: Record<string, string> = {
  chatbot: "M8 12h8M8 8h8M8 16h5",
  "code-gen": "M16 18l6-6-6-6M8 6l-6 6 6 6",
  summarization: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  "image-analysis": "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 6h.01M4 6h16a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z",
  "content-moderation": "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
};

export function FeaturedScenarios({ scenarios }: FeaturedScenariosProps) {
  if (scenarios.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
          QUICK START
        </div>
        <h2 className="mt-3 text-3xl font-bold text-ink-900">
          Featured Scenarios
        </h2>
        <p className="mt-2 text-gray-500">
          Pre-built usage patterns to quickly estimate costs for common
          applications.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {scenarios.map((scenario) => (
          <Link
            key={scenario.id}
            href={`/calculator?scenario=${scenario.slug}`}
            className="group"
          >
            <Card className="card-hover-lift h-full">
              <CardContent className="flex h-full flex-col p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-ink-900">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5 text-spotlight-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={categoryIcons[scenario.category] ?? "M13 10V3L4 14h7v7l9-11h-7z"} />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-ink-900">
                  {scenario.name}
                </h3>
                <p className="mt-1 flex-1 text-sm text-gray-500 line-clamp-2">
                  {scenario.description}
                </p>
                <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-brand-600">
                  Try in Calculator
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
