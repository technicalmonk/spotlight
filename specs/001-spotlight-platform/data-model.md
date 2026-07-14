# Data Model: Spotlight

## Entities

### Provider
Represents an LLM API provider (OpenAI, Anthropic, Google, etc.).

| Field | Type | Notes |
|-------|------|-------|
| id | uuid (PK) | Default gen_random_uuid() |
| name | text | "OpenAI", "Anthropic" |
| slug | text (unique) | "openai", "anthropic" — derived from OpenRouter model ID prefix |
| website_url | text | Provider's main website |
| api_base_url | text (nullable) | API base URL if known |
| logo_url | text (nullable) | Provider logo |
| openrouter_prefix | text (unique, nullable) | The OpenRouter model ID prefix (e.g., "openai", "anthropic") for auto-discovery |
| created_at | timestamp | Default now() |
| updated_at | timestamp | Default now() |

**Relationships**: One-to-many with Model.

### Model
A specific LLM model (GPT-4o, Claude 3.5 Sonnet, etc.).

| Field | Type | Notes |
|-------|------|-------|
| id | uuid (PK) | |
| provider_id | uuid (FK → Provider) | |
| name | text | Display name: "GPT-4o", "Claude 3.5 Sonnet" |
| slug | text (unique) | "gpt-4o", "claude-3-5-sonnet" |
| openrouter_model_id | text (nullable) | Full OpenRouter ID: "openai/gpt-4o" — for cross-reference |
| modality | text[] | ["text", "image", "audio", "video"] — from OpenRouter architecture |
| context_window | integer | Max input context (tokens) |
| max_output_tokens | integer (nullable) | Max output tokens |
| supports_function_calling | boolean | Default false |
| supports_streaming | boolean | Default true |
| supports_batch | boolean | Default false |
| supports_structured_output | boolean | Default false |
| model_family | text (nullable) | "GPT-4", "Claude 3", "Llama 3" |
| release_date | date (nullable) | From OpenRouter `created` field |
| deprecation_date | date (nullable) | If known |
| is_active | boolean | Default true — false if removed from OpenRouter |
| created_at | timestamp | |
| updated_at | timestamp | |

**Relationships**: Many-to-one with Provider. One-to-many with PricingTier, PriceChangeLog.

**Indexes**: slug (unique), provider_id, modality (GIN index for array contains queries), context_window, is_active.

### PricingTier
A pricing record for a model at a point in time. A model can have multiple tiers (current + historical).

| Field | Type | Notes |
|-------|------|-------|
| id | uuid (PK) | |
| model_id | uuid (FK → Model) | |
| effective_date | date | When this pricing took effect |
| input_price_per_million | numeric(10,4) | $ per 1M input tokens |
| output_price_per_million | numeric(10,4) | $ per 1M output tokens |
| batch_input_price_per_million | numeric(10,4) (nullable) | Batch/async input pricing |
| batch_output_price_per_million | numeric(10,4) (nullable) | Batch/async output pricing |
| cache_read_price_per_million | numeric(10,4) (nullable) | Cached input pricing |
| cache_write_price_per_million | numeric(10,4) (nullable) | Cache write pricing |
| image_input_price_per_million | numeric(10,4) (nullable) | Per 1M images (if applicable) |
| audio_input_price_per_million | numeric(10,4) (nullable) | Per 1M audio tokens |
| web_search_price | numeric(10,4) (nullable) | Per web search call |
| fine_tuning_training_price | numeric(10,4) (nullable) | Per 1M training tokens |
| fine_tuning_input_price | numeric(10,4) (nullable) | Fine-tuned inference input |
| fine_tuning_output_price | numeric(10,4) (nullable) | Fine-tuned inference output |
| is_current | boolean | Default true — only one current tier per model |
| source | text | "openrouter_api", "openai_website", "anthropic_website", etc. |
| created_at | timestamp | |

**Relationships**: Many-to-one with Model.

**Indexes**: model_id + is_current (composite), model_id + effective_date (composite).

### PriceChangeLog
A record of a detected price change.

| Field | Type | Notes |
|-------|------|-------|
| id | uuid (PK) | |
| model_id | uuid (FK → Model) | |
| field_changed | text | "input_price_per_million", "output_price_per_million", etc. |
| old_value | numeric(10,4) | |
| new_value | numeric(10,4) | |
| detected_at | timestamp | Default now() |
| source | text | Which ingestion source detected the change |

**Indexes**: model_id + detected_at (composite, desc).

### UsageScenario
Pre-built usage scenarios for the calculator.

| Field | Type | Notes |
|-------|------|-------|
| id | uuid (PK) | |
| name | text | "Customer Support Chatbot", "Code Generation Assistant" |
| slug | text (unique) | |
| description | text | What this scenario represents |
| category | text | "chatbot", "code-gen", "summarization", "image-analysis", "content-moderation" |
| default_input_tokens | integer | Per-request input tokens |
| default_output_tokens | integer | Per-request output tokens |
| default_daily_requests | integer | Requests per day |
| default_images_per_request | numeric(4,1) (nullable) | Images per request (if image modality) |
| default_audio_minutes_per_request | numeric(4,1) (nullable) | Audio minutes per request |
| is_featured | boolean | Show on homepage |
| sort_order | integer | Display order |
| created_at | timestamp | |
| updated_at | timestamp | |

## Relationships Summary

```
Provider 1───* Model 1───* PricingTier
                   │
                   └───* PriceChangeLog

UsageScenario (standalone, seeded)
```

## Ingestion Source Mapping

| OpenRouter Field | Spotlight Entity | Spotlight Field |
|-----------------|------------------|-----------------|
| `id` (e.g., "openai/gpt-4o") | Model.openrouter_model_id | direct |
| `id` prefix (before "/") | Provider.openrouter_prefix | for auto-discovery |
| `name` | Model.name | strip "OpenAI: " prefix |
| `context_length` | Model.context_window | direct |
| `top_provider.max_completion_tokens` | Model.max_output_tokens | direct |
| `architecture.modality` | Model.modality | parse "text+image->text" → ["text","image"] |
| `architecture.input_modalities` | Model.modality | preferred over `modality` string |
| `pricing.prompt` | PricingTier.input_price_per_million | multiply by 1,000,000 |
| `pricing.completion` | PricingTier.output_price_per_million | multiply by 1,000,000 |
| `pricing.input_cache_read` | PricingTier.cache_read_price_per_million | multiply by 1,000,000 |
| `pricing.input_cache_write` | PricingTier.cache_write_price_per_million | multiply by 1,000,000 |
| `pricing.web_search` | PricingTier.web_search_price | direct (already per-call) |
| `supported_parameters` includes "tools" | Model.supports_function_calling | true |
| `supported_parameters` includes "response_format" | Model.supports_structured_output | true |
| `created` (unix timestamp) | Model.release_date | convert to date |
| `pricing.overrides[]` | (future) | Tiered pricing based on token volume |

## Pre-Built Usage Scenarios (Seed Data)

1. **Customer Support Chatbot** — 500 input, 200 output, 10000 requests/day
2. **Code Generation Assistant** — 2000 input, 1500 output, 500 requests/day
3. **Document Summarization Pipeline** — 8000 input, 500 output, 1000 requests/day
4. **Image Analysis Service** — 1000 input, 300 output, 1 image/request, 2000 requests/day
5. **Content Moderation System** — 500 input, 50 output, 50000 requests/day
