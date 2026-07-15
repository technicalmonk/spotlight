import { getScenarios } from "@/db/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ScenariosPage() {
  const scenarios = await getScenarios().catch(() => []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            SCENARIOS
          </div>
          <h1 className="mt-3 text-3xl font-bold text-ink-900">Usage Scenarios</h1>
          <p className="mt-2 text-gray-500">Pre-built scenarios to quickly estimate costs for common AI use cases.</p>
        </div>

        {scenarios.length === 0 ? (
          <Card className="p-12 text-center text-gray-500">
            No scenarios available yet. Run the seed script to populate.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {scenarios.map((scenario) => (
              <Card key={scenario.slug} className="card-hover-lift">
                <CardContent className="p-6">
                  <div className="mb-3">
                    <Badge variant="accent" className="mb-2">{scenario.category}</Badge>
                    <h3 className="text-lg font-semibold text-ink-900">{scenario.name}</h3>
                  </div>
                  <p className="mb-4 text-sm text-gray-500">{scenario.description}</p>
                  <div className="space-y-1 font-mono text-xs text-gray-600">
                    <div>Input: {scenario.defaultInputTokens.toLocaleString()} tokens/req</div>
                    <div>Output: {scenario.defaultOutputTokens.toLocaleString()} tokens/req</div>
                    <div>Volume: {scenario.defaultDailyRequests.toLocaleString()} req/day</div>
                  </div>
                  <Link
                    href={`/calculator?scenario=${scenario.slug}`}
                    className="mt-4 inline-block text-sm font-semibold text-brand-600 hover:text-brand-700"
                  >
                    Try in Calculator →
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
