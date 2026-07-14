import { slugify } from "@/lib/utils";
import type {
  NormalizedData,
  NormalizedModel,
  NormalizedPricing,
  NormalizedProvider,
} from "@/lib/types";
import type { OpenRouterModel } from "./openrouter";

// ---------------------------------------------------------------------------
// Provider extraction
// ---------------------------------------------------------------------------

/**
 * Extract the provider prefix from an OpenRouter model ID.
 *
 * @example "openai/gpt-4o" → "openai"
 * @example "anthropic/claude-3.5-sonnet" → "anthropic"
 */
export function extractProviderPrefix(modelId: string): string {
  const slashIdx = modelId.indexOf("/");
  if (slashIdx === -1) return modelId;
  return modelId.slice(0, slashIdx);
}

/**
 * Derive a human-readable provider name from the OpenRouter prefix.
 *
 * @example "openai" → "OpenAI"
 * @example "deepseek" → "DeepSeek"
 * @example "meta-llama" → "Meta Llama"
 */
export function deriveProviderName(prefix: string): string {
  // Known special cases for better display names
  const knownNames: Record<string, string> = {
    openai: "OpenAI",
    anthropic: "Anthropic",
    google: "Google",
    "meta-llama": "Meta Llama",
    mistralai: "Mistral AI",
    deepseek: "DeepSeek",
    groq: "Groq",
    cohere: "Cohere",
    microsoft: "Microsoft",
    amazon: "Amazon",
    nvidia: "NVIDIA",
    together: "Together AI",
    fireworks: "Fireworks AI",
    ai21: "AI21 Labs",
    perplexity: "Perplexity",
    "x-ai": "xAI",
    qwen: "Qwen",
    nousresearch: "Nous Research",
    databricks: "Databricks",
  };

  if (knownNames[prefix]) return knownNames[prefix];

  // Generic fallback: split on hyphens, capitalize each part
  return prefix
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

// ---------------------------------------------------------------------------
// Model name normalization
// ---------------------------------------------------------------------------

/**
 * Strip the "Provider: " prefix from a model name as returned by OpenRouter.
 *
 * @example "OpenAI: GPT-4o" → "GPT-4o"
 * @example "Anthropic: Claude 3.5 Sonnet" → "Claude 3.5 Sonnet"
 * @example "GPT-4o" → "GPT-4o" (no prefix to strip)
 */
export function stripProviderPrefix(name: string): string {
  // OpenRouter formats names as "ProviderName: ModelName"
  const colonIdx = name.indexOf(":");
  if (colonIdx === -1) return name.trim();
  return name.slice(colonIdx + 1).trim();
}

// ---------------------------------------------------------------------------
// Modality parsing
// ---------------------------------------------------------------------------

/**
 * Parse modalities from the OpenRouter architecture object.
 *
 * Prefers `architecture.input_modalities` (array of strings). Falls back to
 * parsing the legacy `architecture.modality` string (e.g. "text+image->text").
 *
 * @returns Array of modality strings, normalized to lowercase.
 */
export function parseModalities(
  model: OpenRouterModel,
): string[] {
  const modalities = new Set<string>();

  // Preferred: input_modalities array
  const inputModalities = model.architecture?.input_modalities;
  if (inputModalities && Array.isArray(inputModalities)) {
    for (const m of inputModalities) {
      if (typeof m === "string" && m.length > 0) {
        modalities.add(m.toLowerCase());
      }
    }
  }

  // Fallback: parse the modality string format "text+image->text"
  const modalityStr = model.architecture?.modality;
  if (modalities.size === 0 && modalityStr) {
    // Split off the output part (after "->")
    const inputPart = modalityStr.split("->")[0] ?? modalityStr;
    for (const part of inputPart.split("+")) {
      const trimmed = part.trim().toLowerCase();
      if (trimmed.length > 0) {
        modalities.add(trimmed);
      }
    }
  }

  // If we still have nothing, default to text
  if (modalities.size === 0) {
    modalities.add("text");
  }

  return Array.from(modalities);
}

// ---------------------------------------------------------------------------
// Pricing conversion
// ---------------------------------------------------------------------------

/**
 * Convert a per-token price string from OpenRouter to per-million.
 *
 * OpenRouter returns prices as strings like "0.000001" (per single token).
 * Multiply by 1,000,000 to get the per-million price.
 *
 * @returns The per-million price, or null if the input is null/invalid/zero.
 */
export function perTokenToPerMillion(
  value: string | null | undefined,
): number | null {
  if (value === null || value === undefined) return null;

  const parsed = parseFloat(value);
  if (isNaN(parsed) || parsed === 0) return null;

  return round(parsed * 1_000_000);
}

function round(value: number): number {
  return Math.round(value * 10000) / 10000;
}

/**
 * Normalize the pricing object from an OpenRouter model.
 */
export function normalizePricing(
  model: OpenRouterModel,
): NormalizedPricing {
  const pricing = model.pricing;

  return {
    inputPricePerMillion: perTokenToPerMillion(pricing?.prompt) ?? 0,
    outputPricePerMillion: perTokenToPerMillion(pricing?.completion) ?? 0,
    // OpenRouter doesn't expose separate batch pricing — leave null for now.
    // Provider-specific ingestion will fill these in.
    batchInputPricePerMillion: null,
    batchOutputPricePerMillion: null,
    cacheReadPricePerMillion: perTokenToPerMillion(pricing?.input_cache_read),
    cacheWritePricePerMillion: perTokenToPerMillion(pricing?.input_cache_write),
    // web_search is already per-call (not per-token), so no conversion needed
    webSearchPrice: pricing?.web_search ? parseFloat(pricing.web_search) || null : null,
  };
}

// ---------------------------------------------------------------------------
// Capability parsing
// ---------------------------------------------------------------------------

/**
 * Determine if a model supports function calling (tool use).
 *
 * OpenRouter exposes this via the `supported_parameters` array — if "tools"
 * is present, the model supports function calling.
 */
export function supportsFunctionCalling(model: OpenRouterModel): boolean {
  const params = model.supported_parameters;
  if (!params) return false;
  return params.includes("tools");
}

/**
 * Determine if a model supports structured output (JSON schema response format).
 *
 * OpenRouter exposes this via `supported_parameters` — if "response_format"
 * is present, the model supports structured output.
 */
export function supportsStructuredOutput(model: OpenRouterModel): boolean {
  const params = model.supported_parameters;
  if (!params) return false;
  return params.includes("response_format");
}

// ---------------------------------------------------------------------------
// Full normalization
// ---------------------------------------------------------------------------

/**
 * Normalize a single OpenRouter model into the Spotlight data model format.
 */
export function normalizeModel(model: OpenRouterModel): NormalizedModel {
  const providerSlug = extractProviderPrefix(model.id);
  const displayName = stripProviderPrefix(model.name);

  return {
    providerSlug,
    name: displayName,
    slug: slugify(displayName),
    openrouterModelId: model.id,
    modality: parseModalities(model),
    contextWindow: model.context_length ?? 0,
    maxOutputTokens: model.top_provider?.max_completion_tokens ?? null,
    supportsFunctionCalling: supportsFunctionCalling(model),
    supportsStreaming: true, // OpenRouter supports streaming for all models by default
    supportsStructuredOutput: supportsStructuredOutput(model),
    releaseDate: model.created
      ? new Date(model.created * 1000).toISOString().split("T")[0]!
      : null,
    pricing: normalizePricing(model),
  };
}

/**
 * Normalize the full OpenRouter response into providers + models.
 *
 * Extracts unique provider prefixes, derives display names, and normalizes
 * each model. Returns structured data ready for database insertion.
 */
export function normalizeOpenRouterData(
  models: OpenRouterModel[],
): NormalizedData {
  const providerMap = new Map<string, NormalizedProvider>();
  const normalizedModels: NormalizedModel[] = [];

  for (const model of models) {
    const normalized = normalizeModel(model);
    normalizedModels.push(normalized);

    // Collect unique providers
    if (!providerMap.has(normalized.providerSlug)) {
      providerMap.set(normalized.providerSlug, {
        name: deriveProviderName(normalized.providerSlug),
        slug: normalized.providerSlug,
        openrouterPrefix: normalized.providerSlug,
      });
    }
  }

  return {
    providers: Array.from(providerMap.values()),
    models: normalizedModels,
  };
}
