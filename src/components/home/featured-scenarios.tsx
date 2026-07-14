import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import type { UsageScenario } from "@/lib/types";

interface FeaturedScenariosProps {
  scenarios: UsageScenario[];
}

export function FeaturedScenarios({ scenarios }: FeaturedScenariosProps) {
  if (scenarios.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Featured Scenarios</h2>
        <p className="mt-2 text-gray-500">
          Pre-built usage patterns to quickly estimate costs for common
          applications.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {scenarios.map((scenario) => (
          <Link
            key={scenario.id}
            href={`/calculator?scenario=${scenario.slug}`}
            className="group"
          >
            <Card className="h-full transition-shadow group-hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-sm">{scenario.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">{scenario.description}</p>
                <div className="mt-4 flex items-center gap-1 text-sm font-medium text-brand-600">
                  Try in Calculator
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
