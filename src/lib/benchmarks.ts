/**
 * Latest AI model data (July 2026) from Artificial Analysis benchmarks.
 * Intelligence Index, Coding Index, Agentic Index, speed, latency, and pricing.
 *
 * Source: https://artificialanalysis.ai/leaderboards/models
 * Intelligence Index v4.1: 9 evaluations (GDPval-AA, τ³-Banking, Terminal-Bench,
 *   SciCode, Humanity's Last Exam, GPQA Diamond, CritPt, AA-Omniscience, AA-LCR)
 *
 * Prices are blended $/1M tokens (7:2:1 cache hit : input : output ratio).
 * For simplicity we show input and output separately in the UI.
 */

export interface BenchmarkModel {
  label: string;
  provider: string;
  slug: string;
  inputPricePerMillion: number;
  outputPricePerMillion: number;
  inWorkBench: boolean;
  intelligenceIndex: number | null;
  codingIndex: number | null;
  agenticIndex: number | null;
  outputSpeed: number | null;  // tokens/sec
  latency: number | null;  // TTFT seconds
  contextWindow: string;  // e.g. "1M", "256K"
  isReasoning: boolean;
  isOpenWeights: boolean;
  releaseDate: string;
}

export const benchmarkModels: BenchmarkModel[] = [
  // === OpenAI — GPT-5.6 series (latest) ===
  { label: "GPT-5.6 Sol", provider: "OpenAI", slug: "gpt-5-6-sol", inputPricePerMillion: 1.25, outputPricePerMillion: 10, inWorkBench: true, intelligenceIndex: 59, codingIndex: 80, agenticIndex: null, outputSpeed: 57, latency: 4.49, contextWindow: "1M", isReasoning: true, isOpenWeights: false, releaseDate: "2026-07-09" },
  { label: "GPT-5.6 Luna", provider: "OpenAI", slug: "gpt-5-6-luna", inputPricePerMillion: 1, outputPricePerMillion: 4, inWorkBench: true, intelligenceIndex: 51, codingIndex: 71, agenticIndex: 46, outputSpeed: 210, latency: 5.10, contextWindow: "1M", isReasoning: false, isOpenWeights: false, releaseDate: "2026-07-09" },
  { label: "GPT-5.6 Terra", provider: "OpenAI", slug: "gpt-5-6-terra", inputPricePerMillion: 2, outputPricePerMillion: 8, inWorkBench: true, intelligenceIndex: 55, codingIndex: null, agenticIndex: null, outputSpeed: 138, latency: 2.16, contextWindow: "1M", isReasoning: true, isOpenWeights: false, releaseDate: "2026-07-09" },
  { label: "GPT-5.5", provider: "OpenAI", slug: "gpt-5-5", inputPricePerMillion: 1.25, outputPricePerMillion: 10, inWorkBench: true, intelligenceIndex: 55, codingIndex: null, agenticIndex: null, outputSpeed: 67, latency: 5.33, contextWindow: "922K", isReasoning: true, isOpenWeights: false, releaseDate: "2026-05-01" },
  { label: "GPT-5.4 mini", provider: "OpenAI", slug: "gpt-5-4-mini", inputPricePerMillion: 0.16, outputPricePerMillion: 0.64, inWorkBench: true, intelligenceIndex: 40, codingIndex: null, agenticIndex: null, outputSpeed: 162, latency: 6.63, contextWindow: "400K", isReasoning: false, isOpenWeights: false, releaseDate: "2026-04-01" },

  // === Anthropic — Claude 5 series (latest) ===
  { label: "Claude Fable 5", provider: "Anthropic", slug: "claude-fable-5", inputPricePerMillion: 5, outputPricePerMillion: 25, inWorkBench: true, intelligenceIndex: 60, codingIndex: null, agenticIndex: null, outputSpeed: 66, latency: 4.49, contextWindow: "1M", isReasoning: true, isOpenWeights: false, releaseDate: "2026-06-01" },
  { label: "Claude Opus 4.8", provider: "Anthropic", slug: "claude-opus-4-8", inputPricePerMillion: 5, outputPricePerMillion: 25, inWorkBench: true, intelligenceIndex: 56, codingIndex: 88, agenticIndex: null, outputSpeed: 55, latency: 1.45, contextWindow: "1M", isReasoning: true, isOpenWeights: false, releaseDate: "2026-05-28" },
  { label: "Claude Sonnet 5", provider: "Anthropic", slug: "claude-sonnet-5", inputPricePerMillion: 3, outputPricePerMillion: 15, inWorkBench: true, intelligenceIndex: 53, codingIndex: null, agenticIndex: null, outputSpeed: 72, latency: 1.40, contextWindow: "1M", isReasoning: true, isOpenWeights: false, releaseDate: "2026-06-01" },
  { label: "Claude 4.5 Haiku", provider: "Anthropic", slug: "claude-4-5-haiku", inputPricePerMillion: 0.80, outputPricePerMillion: 4, inWorkBench: true, intelligenceIndex: 30, codingIndex: null, agenticIndex: null, outputSpeed: 91, latency: 1.01, contextWindow: "200K", isReasoning: false, isOpenWeights: false, releaseDate: "2026-03-01" },

  // === Google — Gemini 3.x series (latest) ===
  { label: "Gemini 3.5 Flash", provider: "Google", slug: "gemini-3-5-flash", inputPricePerMillion: 0.38, outputPricePerMillion: 1.15, inWorkBench: true, intelligenceIndex: 50, codingIndex: null, agenticIndex: null, outputSpeed: 161, latency: 4.49, contextWindow: "1M", isReasoning: true, isOpenWeights: false, releaseDate: "2026-06-01" },
  { label: "Gemini 3.1 Pro", provider: "Google", slug: "gemini-3-1-pro", inputPricePerMillion: 1.25, outputPricePerMillion: 5, inWorkBench: true, intelligenceIndex: 46, codingIndex: null, agenticIndex: null, outputSpeed: 117, latency: 2.45, contextWindow: "1M", isReasoning: true, isOpenWeights: false, releaseDate: "2026-05-01" },
  { label: "Gemini 3.1 Flash-Lite", provider: "Google", slug: "gemini-3-1-flash-lite", inputPricePerMillion: 0.075, outputPricePerMillion: 0.30, inWorkBench: true, intelligenceIndex: 25, codingIndex: null, agenticIndex: null, outputSpeed: 277, latency: 6.15, contextWindow: "1M", isReasoning: false, isOpenWeights: false, releaseDate: "2026-05-01" },

  // === xAI — Grok 4.x series (latest) ===
  { label: "Grok 4.5", provider: "xAI", slug: "grok-4-5", inputPricePerMillion: 2, outputPricePerMillion: 10, inWorkBench: false, intelligenceIndex: 54, codingIndex: null, agenticIndex: null, outputSpeed: 123, latency: 8.88, contextWindow: "500K", isReasoning: true, isOpenWeights: false, releaseDate: "2026-06-01" },
  { label: "Grok 4.3", provider: "xAI", slug: "grok-4-3", inputPricePerMillion: 0.64, outputPricePerMillion: 2.56, inWorkBench: false, intelligenceIndex: 38, codingIndex: null, agenticIndex: null, outputSpeed: 111, latency: 13.61, contextWindow: "1M", isReasoning: true, isOpenWeights: false, releaseDate: "2026-05-01" },

  // === Open Source / Open Weights ===
  { label: "GLM-5.2", provider: "Z AI", slug: "glm-5-2", inputPricePerMillion: 0.90, outputPricePerMillion: 0.90, inWorkBench: true, intelligenceIndex: 51, codingIndex: null, agenticIndex: null, outputSpeed: 145, latency: 1.45, contextWindow: "1M", isReasoning: true, isOpenWeights: true, releaseDate: "2026-06-01" },
  { label: "DeepSeek V4 Pro", provider: "DeepSeek", slug: "deepseek-v4-pro", inputPricePerMillion: 0.14, outputPricePerMillion: 0.28, inWorkBench: true, intelligenceIndex: 44, codingIndex: null, agenticIndex: null, outputSpeed: 62, latency: 1.64, contextWindow: "1M", isReasoning: true, isOpenWeights: true, releaseDate: "2026-06-01" },
  { label: "DeepSeek V4 Flash", provider: "DeepSeek", slug: "deepseek-v4-flash", inputPricePerMillion: 0.06, outputPricePerMillion: 0.12, inWorkBench: true, intelligenceIndex: 40, codingIndex: null, agenticIndex: null, outputSpeed: 109, latency: 1.17, contextWindow: "1M", isReasoning: true, isOpenWeights: true, releaseDate: "2026-06-01" },
  { label: "MiniMax-M3", provider: "MiniMax", slug: "minimax-m3", inputPricePerMillion: 0.22, outputPricePerMillion: 0.22, inWorkBench: true, intelligenceIndex: 44, codingIndex: null, agenticIndex: null, outputSpeed: 86, latency: 2.06, contextWindow: "1M", isReasoning: true, isOpenWeights: true, releaseDate: "2026-05-01" },
  { label: "Kimi K2.6", provider: "Moonshot", slug: "kimi-k2-6", inputPricePerMillion: 0.70, outputPricePerMillion: 2.80, inWorkBench: true, intelligenceIndex: 44, codingIndex: null, agenticIndex: null, outputSpeed: 44, latency: 2.56, contextWindow: "256K", isReasoning: true, isOpenWeights: true, releaseDate: "2026-06-01" },
  { label: "Kimi K3", provider: "Moonshot", slug: "kimi-k3", inputPricePerMillion: 3, outputPricePerMillion: 15, inWorkBench: true, intelligenceIndex: 57, codingIndex: null, agenticIndex: null, outputSpeed: 62, latency: null, contextWindow: "1M", isReasoning: true, isOpenWeights: false, releaseDate: "2026-07-16" },
  { label: "Qwen3.7 Max", provider: "Alibaba", slug: "qwen3-7-max", inputPricePerMillion: 1.43, outputPricePerMillion: 5.72, inWorkBench: true, intelligenceIndex: 46, codingIndex: null, agenticIndex: null, outputSpeed: 200, latency: 2.45, contextWindow: "1M", isReasoning: true, isOpenWeights: true, releaseDate: "2026-06-01" },
  { label: "Llama 4 Maverick", provider: "Meta", slug: "llama-4-maverick", inputPricePerMillion: 0.34, outputPricePerMillion: 0.34, inWorkBench: true, intelligenceIndex: 14, codingIndex: null, agenticIndex: null, outputSpeed: 107, latency: 1.00, contextWindow: "1M", isReasoning: false, isOpenWeights: true, releaseDate: "2026-04-01" },
];

// Top 5 frontier models by user base (for "no current scenario" mode)
// Kimi K3 is #4 on Artificial Analysis Intelligence Index — leading model
export const topFrontierSlugs = [
  "kimi-k3",
  "gpt-5-6-sol",
  "claude-opus-4-8",
  "gemini-3-1-pro",
  "gpt-5-4-mini",
];

// Provider group presets for compare page
export const providerGroups = [
  {
    name: "OpenAI",
    slug: "openai",
    description: "GPT-5.6 Sol, Luna, Terra — the latest frontier models",
    models: ["gpt-5-6-sol", "gpt-5-6-luna", "gpt-5-6-terra", "gpt-5-4-mini"],
    icon: "O",
    accent: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    name: "Anthropic",
    slug: "anthropic",
    description: "Claude Fable 5, Opus 4.8, Sonnet 5 — strongest reasoning",
    models: ["claude-fable-5", "claude-opus-4-8", "claude-sonnet-5", "claude-4-5-haiku"],
    icon: "A",
    accent: "bg-orange-50 text-orange-700 border-orange-200",
  },
  {
    name: "Google",
    slug: "google",
    description: "Gemini 3.5 Flash, 3.1 Pro — massive context, fast inference",
    models: ["gemini-3-5-flash", "gemini-3-1-pro", "gemini-3-1-flash-lite"],
    icon: "G",
    accent: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    name: "xAI (Grok)",
    slug: "xai",
    description: "Grok 4.5, 4.3 — real-time and uncensored",
    models: ["grok-4-5", "grok-4-3"],
    icon: "X",
    accent: "bg-gray-50 text-gray-700 border-gray-300",
  },
  {
    name: "Open Source",
    slug: "opensource",
    description: "GLM-5.2, DeepSeek V4, Qwen3.7, Kimi K3 — self-hostable, cheapest at scale",
    models: ["glm-5-2", "deepseek-v4-pro", "deepseek-v4-flash", "qwen3-7-max", "kimi-k2-6", "kimi-k3"],
    icon: "OS",
    accent: "bg-spotlight-50 text-spotlight-700 border-spotlight-300",
  },
];

// Intelligence Index color coding (higher = better/greener)
export function intelligenceColor(score: number | null): string {
  if (score === null) return "text-gray-300";
  if (score >= 55) return "text-green-600";
  if (score >= 45) return "text-brand-600";
  if (score >= 35) return "text-yellow-600";
  return "text-gray-500";
}

// Speed color (higher = better)
export function speedColor(tokensPerSec: number | null): string {
  if (tokensPerSec === null) return "text-gray-300";
  if (tokensPerSec >= 150) return "text-green-600";
  if (tokensPerSec >= 80) return "text-brand-600";
  if (tokensPerSec >= 40) return "text-yellow-600";
  return "text-orange-600";
}
