"use client";

import { benchmarkModels } from "@/lib/benchmarks";

// Provider colors for text-based logos (no external logo files needed)
const providerColors: Record<string, string> = {
  OpenAI: "text-emerald-600",
  Anthropic: "text-orange-600",
  Google: "text-blue-600",
  xAI: "text-gray-800",
  "Z AI": "text-indigo-600",
  DeepSeek: "text-purple-600",
  MiniMax: "text-pink-600",
  Moonshot: "text-cyan-600",
  Alibaba: "text-red-600",
  Meta: "text-blue-700",
};

export function ModelScroll() {
  // Get unique model labels for the scroll
  const models = benchmarkModels.map((m) => ({
    label: m.label,
    provider: m.provider,
    color: providerColors[m.provider] || "text-gray-600",
  }));

  // Duplicate for seamless loop
  const loop = [...models, ...models];

  return (
    <div className="border-b border-gray-200 bg-ink-900 py-4 overflow-hidden">
      <div className="flex animate-scroll-x items-center gap-8 whitespace-nowrap">
        {loop.map((m, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className={`text-sm font-semibold ${m.color}`}>{m.provider}</span>
            <span className="text-sm font-medium text-gray-400">{m.label}</span>
            <span className="text-gray-700">·</span>
          </div>
        ))}
      </div>
    </div>
  );
}
