# Research: Spotlight Technical Decisions

## 1. OpenRouter API Structure (verified 2026-07-14)

### Endpoint
`GET https://openrouter.ai/api/v1/models` — no auth required, returns all models.

### Response Shape
```json
{
  "data": [
    {
      "id": "openai/gpt-5.6-luna",
      "canonical_slug": "openai/gpt-5.6-luna-20260709",
      "name": "OpenAI: GPT-5.6 Luna",
      "created": 1783590864,
      "description": "...",
      "context_length": 1050000,
      "architecture": {
        "modality": "text+image+file->text",
        "input_modalities": ["file", "image", "text"],
        "output_modalities": ["text"],
        "tokenizer": "GPT"
      },
      "pricing": {
        "prompt": "0.000001",
        "completion": "0.000006",
        "web_search": "0.01",
        "input_cache_read": "0.0000001",
        "input_cache_write": "0.00000125",
        "overrides": [
          {
            "min_prompt_tokens": 272000,
            "prompt": "0.000002",
            "completion": "0.000009"
          }
        ]
      },
      "top_provider": {
        "context_length": 1050000,
        "max_completion_tokens": 128000,
        "is_moderated": true
      },
      "supported_parameters": ["tools", "response_format", "structured_outputs", ...],
      "reasoning": {
        "mandatory": false,
        "default_enabled": true,
        "supported_efforts": ["max", "xhigh", "high", "medium", "low", "none"]
      }
    }
  ],
  "total_count": 343
}
```

### Key Observations
1. **Pricing is per-token, not per-million** — `pricing.prompt: "0.000001"` means $0.000001 per token = $1.00 per 1M tokens. Must multiply by 1,000,000 for display.
2. **Model ID format**: `provider/model-name` — the prefix before `/` is the provider slug (auto-discovery key).
3. **Name includes provider prefix**: "OpenAI: GPT-5.6 Luna" — strip "OpenAI: " to get the model display name.
4. **Modality**: `architecture.input_modalities` is an array of strings (["text", "image", "file"]) — cleaner than parsing the `modality` string.
5. **Context length**: `context_length` at top level, but `top_provider.context_length` may differ — use top-level.
6. **Tiered pricing**: `pricing.overrides[]` defines price changes based on `min_prompt_tokens` threshold — e.g., price doubles above 272K tokens. Model this as a separate consideration for v2; for v1 use the base pricing.
7. **Supported parameters**: `"tools"` in `supported_parameters` → supports function calling. `"response_format"` → supports structured output. `"structured_outputs"` → supports JSON schema output.
8. **Total count**: 343 models across all providers. Response includes all in one request (no pagination needed, but should handle `links.next` if present).
9. **No auth required**: The endpoint works without an API key, but rate limits apply (20 req/min). A single request gets all 343 models, so 4x daily is well within limits.
10. **Reasoning field**: Some models have `reasoning.mandatory` and `reasoning.default_effort` — useful metadata for the model detail page.

### Provider Auto-Discovery
Extract all unique prefixes from model IDs (`openai`, `anthropic`, `google`, `meta-llama`, etc.) to auto-populate the Provider table. 343 models likely span 50+ provider prefixes.

## 2. Normalization Decisions

- **Price unit**: Store as `numeric(10,4)` per 1M tokens (4 decimal places sufficient for $0.0001/1M to $99999.9999/1M range)
- **OpenRouter per-token → per-million**: multiply by 1,000,000
- **Modality**: use `architecture.input_modalities` array (cleaner than parsing modality string)
- **Provider slug**: derived from OpenRouter model ID prefix
- **Model slug**: derived from model name (strip provider prefix, slugify) — must be unique
- **Model name**: strip "Provider: " prefix from `name` field

## 3. Vercel Cron Constraints

- **Free tier**: Cron jobs run with a 5-minute timeout on free plan
- **Pro plan**: Up to 15-minute timeout
- **OpenRouter ingestion**: Single API call returns all 343 models → normalize → upsert. Should complete in <30 seconds. Well within limits.
- **Provider scraping**: Each scraper is independent — can be separate cron jobs or a single job that iterates. Keep total under 5 minutes for free tier.
- **Cron secret**: Vercel sends `Authorization: Bearer <CRON_SECRET>` header — verify in route handler.

## 4. Tech Stack Verification (2026-07-14)

- **Next.js 15**: App Router, Server Components, ISR with `revalidate` param. Stable.
- **Drizzle ORM**: Latest version supports Neon serverless driver (`drizzle-orm/neon-http` or `neon-serverless`).
- **Neon**: Serverless Postgres with connection pooling. Free tier: 0.5 GB storage, sufficient for this schema.
- **shadcn/ui**: CLI-based component installation, Tailwind CSS 4 compatible.
- **Nuqs**: URL state management for Next.js App Router — perfect for shareable filter/sort states.
- **Recharts**: React charting library, works with server components for initial render.

## 5. Provider Coverage (via OpenRouter auto-discovery)

OpenRouter covers these providers (confirmed from API response):
- OpenAI (gpt-5.6-luna, gpt-5.6-terra-pro, gpt-4o, etc.)
- Anthropic (claude opus, sonnet, haiku)
- Google (gemini flash, pro)
- Meta (llama 3.1, 3.3)
- Mistral (mistral large, codestral, pixtral)
- DeepSeek (deepseek chat, coder, r1)
- Groq (groq-hosted llama, mixtral)
- Cohere (command-r, command-r-plus)
- Microsoft (phi-3, phi-4)
- Amazon (nova, titan)
- NVIDIA (nvidia-hosted models)
- Together (together-hosted models)
- Fireworks (fireworks-hosted models)
- AI21 (jamba)
- Perplexity (sonar, llama)
- And many more smaller providers (343 total models, 50+ providers)

**For v1**: Rely entirely on OpenRouter for model/pricing data. No manual provider setup needed.
**For v2 (Phase 9)**: Layer in scrapers for batch/fine-tuning/modality-specific pricing that OpenRouter doesn't cover.

## 6. Pricing Edge Cases

- **Tiered pricing** (GPT-5.6 Luna): Price doubles above 272K tokens. OpenRouter exposes this via `pricing.overrides[]`. For v1, use base pricing. Note in model detail page that tiered pricing may apply.
- **Batch pricing**: Not in OpenRouter's API. Requires provider-specific scraping (OpenAI, Anthropic have 50% batch discounts). Phase 9.
- **Fine-tuning pricing**: Not in OpenRouter. Phase 9.
- **Image/audio pricing**: Some models charge per image or per audio minute. OpenRouter's `pricing` object doesn't break this out. Phase 9.
- **Cache pricing**: OpenRouter exposes `pricing.input_cache_read` and `pricing.input_cache_write`. Store these for v1 — useful for users using prompt caching.
- **Web search pricing**: OpenRouter exposes `pricing.web_search` as a per-call cost. Store this.
