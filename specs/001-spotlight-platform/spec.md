# Feature Specification: Spotlight — LLM Pricing Platform

**Feature Branch**: `001-spotlight-platform`

**Created**: 2026-07-14

**Status**: Draft

**Input**: User description: "A web application for LLM token cost tracking, calculation, and estimation. A unified, up-to-date platform for comparing AI model pricing across providers. Must operate autonomously with automatic model discovery and price updates."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Explore and Compare Model Pricing (Priority: P1)

An AI engineer or developer visits the site to research LLM pricing across providers. They want to see all available models in a searchable, filterable table with pricing, context windows, and capabilities. They filter by provider, modality, and price range. They sort by cost or context window. They click into a model for details. They can share their filtered view via URL.

**Why this priority**: This is the core landing experience — without a browsable model directory, nothing else matters. It's the entry point for all users and the foundation for calculator and comparison features.

**Independent Test**: Can be fully tested by loading the model explorer page, filtering by provider, searching by name, and verifying that prices and capabilities are displayed. Delivers immediate value: "I can see what models exist and what they cost."

**Acceptance Scenarios**:

1. **Given** a visitor arrives at the models page, **When** the page loads, **Then** they see a table of all models with name, provider, modality, context window, input price (per 1M tokens), and output price (per 1M tokens)
2. **Given** the models table is displayed, **When** the user filters by provider "OpenAI", **Then** only OpenAI models are shown and the URL updates to reflect the filter
3. **Given** the models table is displayed, **When** the user sorts by input price ascending, **Then** models are ordered from cheapest to most expensive input token cost
4. **Given** a user has applied filters, **When** they copy the URL and open it in a new browser, **Then** the same filters are applied
5. **Given** the models table has 300+ models, **When** the user types "claude" in the search bar, **Then** only models matching "claude" are shown with fuzzy matching
6. **Given** the user is on a mobile device, **When** they view the models page, **Then** models are displayed as cards with key pricing info, not a truncated table

---

### User Story 2 - Estimate Costs with a Calculator (Priority: P1)

A product manager or CTO wants to estimate what a specific LLM will cost for their use case. They enter their expected input tokens, output tokens, and requests per day. They select one or more models. They see real-time cost calculations per model — input cost, output cost, total per request, daily, monthly, and annual projections. They can use pre-built scenarios (e.g., "Customer Support Chatbot") to auto-fill realistic numbers.

**Why this priority**: This is the core value proposition — "know what your AI will cost before you build it." The calculator is what differentiates Spotlight from a simple pricing page.

**Independent Test**: Can be tested by selecting a model, entering token counts and request volume, and verifying that cost calculations are correct and update in real-time. Delivers value: "I can estimate my monthly AI spend."

**Acceptance Scenarios**:

1. **Given** a user is on the calculator page, **When** they select a model and enter 5000 input tokens, 1000 output tokens, and 1000 requests/day, **Then** they see the per-request cost, daily cost, monthly cost, and annual cost
2. **Given** multiple models are selected in the calculator, **When** the user enters usage parameters, **Then** costs are displayed side-by-side for all selected models
3. **Given** the calculator is displayed, **When** the user selects a pre-built scenario from the dropdown, **Then** token counts and request volume auto-fill with realistic values for that scenario
4. **Given** a calculation is displayed, **When** the user changes any input, **Then** all cost figures update in real-time without a page reload
5. **Given** the user has configured a calculation, **When** they copy the URL, **Then** the same model selection and parameters can be restored by opening the URL
6. **Given** a model with batch pricing is selected, **When** the user toggles "batch mode", **Then** the batch pricing tiers are used for the calculation

---

### User Story 3 - Compare Models Side-by-Side (Priority: P1)

A developer wants to compare 2-5 models head-to-head. They see a side-by-side comparison of features (context window, modalities, function calling, streaming, batch) and pricing (input, output, batch, per-modality). They see visual charts showing price-per-quality comparisons and cost projections over time. They get a "best value" indicator for their usage pattern.

**Why this priority**: Side-by-side comparison is a key differentiator from simple pricing pages. It helps users make decisions, not just browse data.

**Independent Test**: Can be tested by selecting 3 models, viewing the comparison table with features and pricing, and verifying that a "best value" recommendation appears based on a usage pattern.

**Acceptance Scenarios**:

1. **Given** a user is on the compare page, **When** they select 3 models, **Then** a side-by-side comparison table shows features (context window, modalities, function calling, streaming, batch) and pricing (input, output, batch)
2. **Given** a comparison is displayed, **When** the user enters a usage pattern (tokens/day), **Then** a "best value" model is highlighted based on lowest cost for that pattern
3. **Given** a comparison is displayed, **When** the user views the charts section, **Then** they see a price comparison bar chart and a cost projection chart
4. **Given** the user has configured a comparison, **When** they copy the URL, **Then** the same models and usage pattern can be restored

---

### User Story 4 - Trust Data Freshness (Priority: P1)

A user needs to trust that the pricing data is current. Every model page shows when pricing was last updated. Price change history is visible. The homepage shows a "recently updated" indicator. The system autonomously discovers new models and updates prices without human intervention.

**Why this priority**: Stale or inaccurate pricing data destroys the product's value. Transparency about data freshness builds trust.

**Independent Test**: Can be tested by checking that a model detail page shows a "last updated" timestamp, and that the homepage shows a recently-updated indicator.

**Acceptance Scenarios**:

1. **Given** a model detail page is displayed, **When** the user looks at the pricing section, **Then** they see a "last updated" timestamp showing when the price was last verified
2. **Given** a model detail page is displayed, **When** the user scrolls to the price history section, **Then** they see a log of price changes with dates, old values, and new values
3. **Given** the homepage is displayed, **When** the user looks at the status section, **Then** they see how many models were recently updated and when the last ingestion ran
4. **Given** a new model is released by a provider, **When** the ingestion pipeline next runs, **Then** the model appears on the site within 6 hours without manual intervention

---

### User Story 5 - Navigate and Discover via Homepage (Priority: P2)

A first-time visitor arrives at the homepage. They immediately understand what Spotlight does. They see popular comparisons, featured usage scenarios, and a clear call-to-action. They can navigate to Models, Calculator, Compare, and Scenarios from a global header.

**Why this priority**: The homepage is the brand entry point, but the core value (models + calculator) doesn't depend on it. It can be built after the core features work.

**Independent Test**: Can be tested by loading the homepage, verifying the hero, navigation, featured scenarios, and popular comparisons are displayed.

**Acceptance Scenarios**:

1. **Given** a first-time visitor arrives at the homepage, **When** the page loads, **Then** they see a hero section with the value proposition and a CTA to explore models
2. **Given** the homepage is displayed, **When** the user looks at the featured section, **Then** they see 3-4 popular usage scenarios with quick-link to the calculator
3. **Given** the homepage is displayed, **When** the user clicks any nav link, **Then** they are taken to the corresponding page (Models, Calculator, Compare, Scenarios)

### Edge Cases

- What happens when a provider's API is down during ingestion? → Skip that provider, log the error, retry on next cycle. Show stale data with timestamp rather than no data.
- What happens when OpenRouter returns a model with no pricing? → Display it with "Pricing unavailable" and exclude from cost calculations.
- What happens when a model is deprecated by the provider? → Mark as deprecated in the database, show a deprecation notice on the model page, but keep it in the table with a filter to hide deprecated models.
- What happens when prices change mid-session? → Show a subtle "prices updated" notification; don't break the user's current calculation.
- What happens when a user opens a comparison URL with a model that no longer exists? → Show the remaining models with a notice that one model was removed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST aggregate LLM model data and pricing from multiple providers, with OpenRouter as the primary source covering 300+ models across 50+ providers
- **FR-002**: The system MUST autonomously discover new models and providers without manual configuration, using OpenRouter's model API as the canonical source for provider/model enumeration
- **FR-003**: The system MUST run ingestion on a scheduled basis (at minimum every 6 hours for OpenRouter, every 12 hours for provider-specific sources)
- **FR-004**: The system MUST detect price changes between ingestion runs and log them to a price change history table with old value, new value, timestamp, and source
- **FR-005**: The system MUST normalize all pricing to a consistent unit (per 1 million tokens) regardless of source format
- **FR-006**: The system MUST display a "last updated" timestamp on every model's pricing data
- **FR-007**: The Model Explorer MUST display all models in a table with name, provider, modality, context window, input price, and output price
- **FR-008**: The Model Explorer MUST support filtering by provider, modality, price range, context window range, and function calling support
- **FR-009**: The Model Explorer MUST support sorting by price (asc/desc), context window, name, and provider
- **FR-010**: The Model Explorer MUST support search with fuzzy matching on model name
- **FR-011**: The Model Explorer MUST be paginated or use virtual scrolling for 300+ models
- **FR-012**: All filter and sort states MUST be deep-linkable via URL search parameters
- **FR-013**: The Cost Calculator MUST allow selecting one or more models for comparison
- **FR-014**: The Cost Calculator MUST accept input tokens, output tokens, and requests per day/month as inputs
- **FR-015**: The Cost Calculator MUST display per-request cost, daily cost, monthly cost, and annual cost in real-time as inputs change
- **FR-016**: The Cost Calculator MUST support pre-built usage scenarios that auto-fill realistic token estimates
- **FR-017**: The Cost Calculator MUST handle models with different pricing units and batch pricing
- **FR-018**: The Comparison Dashboard MUST support side-by-side comparison of 2-5 models
- **FR-019**: The Comparison Dashboard MUST show feature comparison (context, modalities, function calling, streaming, batch) and price comparison
- **FR-020**: The Comparison Dashboard MUST provide a "best value" indicator based on a user-specified usage pattern
- **FR-021**: The system MUST be responsive — mobile card view and desktop table view for the model explorer
- **FR-022**: The system MUST generate a dynamic sitemap from the model database for SEO
- **FR-023**: Each model MUST have a dedicated page with structured data (JSON-LD) for search engine indexing
- **FR-024**: The system MUST use ISR (Incremental Static Regeneration) for model pages, revalidating at least hourly
- **FR-025**: The ingestion system MUST validate all external data with runtime schema validation before writing to the database
- **FR-026**: Ingestion failures MUST be logged and retried with exponential backoff
- **FR-027**: The system MUST support at minimum the following providers via OpenRouter auto-discovery: OpenAI, Anthropic, Google, Meta (Llama), Mistral, DeepSeek, Groq, Cohere, Microsoft, Amazon (Nova), NVIDIA, Together, Fireworks, AI21, Perplexity, and any new providers that appear in OpenRouter
- **FR-028**: The system MUST layer in provider-specific scraping for data not available from OpenRouter (batch pricing, fine-tuning pricing, modality-specific rates, committed tier pricing) for major providers (OpenAI, Anthropic, Google, Groq, DeepSeek)

### Key Entities *(include if feature involves data)*

- **Provider**: An LLM API provider (OpenAI, Anthropic, Google, etc.). Has a name, slug, website URL, and logo. Auto-discovered from OpenRouter.
- **Model**: A specific LLM (GPT-4o, Claude 3.5 Sonnet, etc.). Belongs to a Provider. Has modalities, context window, capabilities (function calling, streaming, batch), model family, release date, and deprecation date.
- **PricingTier**: A pricing record for a model at a point in time. Has effective date, input price per million, output price per million, batch pricing, modality-specific pricing, fine-tuning pricing, pricing unit, and source (where the data came from).
- **PriceChangeLog**: A record of a price change for a model. Has the field that changed, old value, new value, detection timestamp, and source.
- **UsageScenario**: A pre-built usage scenario for the calculator (e.g., "Customer Support Chatbot"). Has default token counts, request volume, and category.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can find and compare pricing for 300+ LLM models from 50+ providers within 3 clicks of the homepage
- **SC-002**: Pricing data is refreshed at least every 6 hours, with 95% of active models having data updated within the last 12 hours
- **SC-003**: New models released by providers appear on Spotlight within 6 hours of appearing on OpenRouter, without manual intervention
- **SC-004**: The cost calculator produces accurate cost estimates matching provider billing within 1% margin (excluding tax/overage)
- **SC-005**: Model pages load with LCP under 2.5 seconds and CLS under 0.1
- **SC-006**: The site operates autonomously for 30+ days without requiring manual data updates

## Assumptions

- Users have stable internet connectivity (this is a web application, not an offline tool)
- OpenRouter's free-tier API rate limits (20 req/min) are sufficient for 4x daily ingestion of 343 models
- Provider pricing pages are legal to scrape for factual pricing data under fair use
- No user authentication is needed for v1 — the site is fully public and read-only
- The `per_million_tokens` convention is the standard display unit across all providers
- OpenRouter's API structure (model ID format `provider/model-name`, pricing fields) remains relatively stable
- Redis caching is optional for v1 — Postgres can handle the read load with proper indexing
