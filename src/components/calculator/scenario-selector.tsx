'use client';

import { Select } from "@/components/ui/select";

interface Scenario {
  slug: string;
  name: string;
  defaultInputTokens: number;
  defaultOutputTokens: number;
  defaultDailyRequests: number;
}

interface ScenarioSelectorProps {
  scenarios: Scenario[];
  onSelect: (scenario: Scenario) => void;
}

export function ScenarioSelector({ scenarios, onSelect }: ScenarioSelectorProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-700">Quick scenario</label>
      <Select
        onChange={(e) => {
          const scenario = scenarios.find((s) => s.slug === e.target.value);
          if (scenario) onSelect(scenario);
        }}
        defaultValue=""
      >
        <option value="">Choose a scenario...</option>
        {scenarios.map((s) => (
          <option key={s.slug} value={s.slug}>
            {s.name}
          </option>
        ))}
      </Select>
    </div>
  );
}
