import { z } from "zod";

// ---------------------------------------------------------------------------
// OpenRouter API response schema (Zod validation)
// ---------------------------------------------------------------------------

export const openRouterPricingSchema = z.object({
  prompt: z.string().nullable().optional(),
  completion: z.string().nullable().optional(),
  input_cache_read: z.string().nullable().optional(),
  input_cache_write: z.string().nullable().optional(),
  web_search: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  request: z.string().nullable().optional(),
});

export const openRouterArchitectureSchema = z.object({
  input_modalities: z.array(z.string()).nullable().optional(),
  output_modalities: z.array(z.string()).nullable().optional(),
  modality: z.string().nullable().optional(),
  tokenizer: z.string().nullable().optional(),
});

export const openRouterTopProviderSchema = z.object({
  max_completion_tokens: z.number().nullable().optional(),
  context_length: z.number().nullable().optional(),
});

export const openRouterModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  context_length: z.number().nullable().optional(),
  created: z.number().nullable().optional(),
  architecture: openRouterArchitectureSchema.optional(),
  top_provider: openRouterTopProviderSchema.optional(),
  pricing: openRouterPricingSchema.optional(),
  supported_parameters: z.array(z.string()).nullable().optional(),
});

export const openRouterResponseSchema = z.object({
  data: z.array(openRouterModelSchema),
});

// ---------------------------------------------------------------------------
// Inferred types from Zod schemas
// ---------------------------------------------------------------------------

export type OpenRouterPricing = z.infer<typeof openRouterPricingSchema>;
export type OpenRouterArchitecture = z.infer<typeof openRouterArchitectureSchema>;
export type OpenRouterModel = z.infer<typeof openRouterModelSchema>;
export type OpenRouterResponse = z.infer<typeof openRouterResponseSchema>;

// ---------------------------------------------------------------------------
// Fetch + validate
// ---------------------------------------------------------------------------

const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";

/**
 * Fetch models from the OpenRouter API and validate the response with Zod.
 *
 * No authentication is required for this endpoint.
 *
 * @returns Validated array of OpenRouter model objects.
 * @throws If the fetch fails or the response doesn't match the schema.
 */
export async function fetchOpenRouterModels(): Promise<OpenRouterModel[]> {
  const response = await fetch(OPENROUTER_MODELS_URL, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Spotlight/1.0 (LLM pricing platform)",
    },
    // Next.js fetch extension — revalidate cache every hour
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(
      `OpenRouter API returned ${response.status} ${response.statusText}`,
    );
  }

  const json: unknown = await response.json();
  const parsed = openRouterResponseSchema.safeParse(json);

  if (!parsed.success) {
    throw new Error(
      `OpenRouter API response failed validation: ${parsed.error.message}`,
    );
  }

  return parsed.data.data;
}
