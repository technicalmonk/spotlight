import { getScenarios } from "@/db/queries";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ScenariosPage() {
  const scenarios = await getScenarios().catch(() => []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Usage Scenarios</h1>
        <p className="text-gray-500 mb-6">Pre-built scenarios to quickly estimate costs for common AI use cases.</p>

        {scenarios.length === 0 ? (
          <Card className="p-12 text-center text-gray-500">
            No scenarios available yet. Run the seed script to populate.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scenarios.map((scenario) => (
              <Card key={scenario.slug} className="p-6 hover:shadow-md transition-shadow">
                <div className="mb-3">
                  <Badge variant="secondary" className="mb-2">{scenario.category}</Badge>
                  <h3 className="font-semibold text-gray-900">{scenario.name}</h3>
                </div>
                <p className="text-sm text-gray-500 mb-4">{scenario.description}</p>
                <div className="space-y-1 text-xs text-gray-600 font-mono mb-4">
                  <div>Input: {scenario.defaultInputTokens.toLocaleString()} tokens/req</div>
                  <div>Output: {scenario.defaultOutputTokens.toLocaleString()} tokens/req</div>
                  <div>Volume: {scenario.defaultDailyRequests.toLocaleString()} req/day</div>
                </div>
                <Link
                  href={`/calculator?scenario=${scenario.slug}`}
                  className="text-sm font-semibold text-brand-600 hover:text-brand-700"
                >
                  Try in Calculator
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
