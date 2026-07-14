#  plans.md — Spotlight Project Plan

```markdown
[metadata]
title: Spotlight — Project Plan
version: 0.1.0
status: draft
owner: Mill Pond Research LLC
last_updated: 2025-02
classification: internal
audience: [human_developers, system_architects]
dependencies: [tasks.md, expand.md]
```

## 1. Executive Summary

Spotlight is a web application focused on LLM token cost tracking, calculation, and estimation. It addresses a critical market gap: the absence of a unified, up-to-date platform for comparing AI model pricing across providers. As the LLM landscape proliferates—with frequent price changes, new model releases, and varied pricing structures—users need a reliable tool to research, compare, and estimate costs before committing to a provider.

## 2. Business Context

- **Target Users:** AI engineers, MLops teams, product managers, CTOs evaluating AI integrations, independent developers
- **Core Value Proposition:** "Know what your AI will cost before you build it"
- **Revenue Potential:** Affiliate referrals to providers, premium features (alerts, historical trends), API access
- **Market Differentiation:** Real-time pricing aggregation, scenario-based estimation, multi-provider comparison

## 3. Technology Stack

### 3.1 Frontend
| Layer              | Technology               | Rationale                                                 |
| ------------------ | ------------------------ | --------------------------------------------------------- |
| Framework          | Next.js 14+ (App Router) | SSR for SEO, static generation for speed, React ecosystem |
| UI Library         | Tailwind CSS + shadcn/ui | Rapid development, accessible, consistent design          |
| State Management   | Zustand                  | Lightweight, no boilerplate                               |
| Data Visualization | Recharts or Visx         | Pricing comparison charts, cost breakdowns                |
| Forms/Calculators  | React Hook Form + Zod    | Type-safe input validation for estimation tools           |

### 3.2 Backend
| Layer          | Technology                | Rationale                                            |
| -------------- | ------------------------- | ---------------------------------------------------- |
| API Layer      | Next.js API Routes / tRPC | Type-safe end-to-end, collocated with frontend       |
| Database       | PostgreSQL (Neon)         | Relational data suits structured model comparisons   |
| ORM            | Drizzle ORM               | Type-safe, lightweight, excellent Postgres support   |
| Caching        | Redis (Upstash)           | Rate limit management, provider API response caching |
| Jobs/Ingestion | Inngest or Trigger.dev    | Reliable scheduled data ingestion pipelines          |

### 3.3 Data Sources
| Source     | Method                      | Data Available                                               |
| ---------- | --------------------------- | ------------------------------------------------------------ |
| OpenRouter | REST API (`/api/v1/models`) | Models, pricing (input/output per token), context windows, capabilities |
| OpenAI     | Web scraping + API          | Model catalog, pricing page, token counts                    |
| Anthropic  | Web scraping + API          | Model catalog, pricing tiers, batch pricing                  |
| Fireworks  | Web scraping + API          | Model catalog, pricing, throughput info                      |
| Lambda     | Web scraping                | Model catalog, pricing, GPU-based pricing                    |

### 3.4 Infrastructure
| Component        | Technology                   | Rationale                                      |
| ---------------- | ---------------------------- | ---------------------------------------------- |
| Hosting          | Vercel                       | Zero-config Next.js deployment, edge functions |
| Database Hosting | Neon                         | Serverless Postgres, generous free tier        |
| CI/CD            | GitHub Actions               | Automated testing, linting, deployment         |
| Monitoring       | Sentry + Vercel Analytics    | Error tracking, performance monitoring         |
| Domain           | spotlight.dev / spotlight.ai | TBD — brand-appropriate domain                 |

## 4. Architectural Approach

### 4.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ Model    │  │ Cost     │  │ Comparison       │  │
│  │ Explorer │  │ Calc     │  │ Dashboard        │  │
│  └──────────┘  └──────────┘  └───────────────────┘  │
└──────────────────────┬──────────────────────────────┘
                       │ tRPC / API Routes
┌──────────────────────┼──────────────────────────────┐
│              BACKEND (Next.js Server)                │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ Model    │  │ Estimatn │  │ Comparison       │  │
│  │ Service  │  │ Service  │  │ Service          │  │
│  └──────────┘  └──────────┘  └───────────────────┘  │
└──────────────────────┬──────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼──────┐ ┌─────▼─────┐ ┌─────▼──────┐
│  PostgreSQL  │ │   Redis   │ │  Ingestion │
│  (Models,   │ │  (Cache,  │ │  Pipeline  │
│   Pricing)  │ │   Rates)  │ │  (Inngest) │
└──────────────┘ └───────────┘ └─────┬──────┘
                                     │
                  ┌──────────────────┼──────────────────┐
                  │                  │                  │
           ┌──────▼──────┐  ┌───────▼──────┐  ┌───────▼──────┐
           │  OpenRouter  │  │   Provider   │  │   Provider   │
           │  API         │  │   Websites   │  │   APIs       │
           └─────────────┘  └──────────────┘  └──────────────┘
```

### 4.2 Key Architectural Decisions

1. **Monorepo with Next.js Fullstack** — Application is read-heavy with modest backend needs. Collocating frontend and API reduces deployment complexity and enables type sharing.

2. **PostgreSQL over NoSQL** — Model data is highly structured (provider → model → pricing tiers → capabilities). Relational queries (joins across providers, filtering by capability) are core to the product.

3. **Ingestion Pipeline as Separate Concern** — Data freshness is critical. A scheduled job system (Inngest) handles provider API calls, web scraping, diff detection, and price change logging independently from the user-facing application.

4. **Cache-Heavy Read Path** — Model listings and pricing are queried frequently but change infrequently (hours, not seconds). Redis caching with TTL-based invalidation dramatically reduces database load.

## 5. Data Model (Core Entities)

```
Provider
├── id (uuid, PK)
├── name (text) — "OpenAI", "Anthropic", etc.
├── slug (text, unique) — "openai", "anthropic"
├── website_url (text)
├── api_base_url (text, nullable)
├── logo_url (text)
└── created_at / updated_at

Model
├── id (uuid, PK)
├── provider_id (uuid, FK → Provider)
├── name (text) — "GPT-4o", "Claude 3.5 Sonnet"
├── slug (text, unique) — "gpt-4o", "claude-3-5-sonnet"
├── modality (enum[]) — [text, image, audio, video]
├── context_window (integer) — max tokens
├── max_output_tokens (integer)
├── supports_function_calling (boolean)
├── supports_streaming (boolean)
├── supports_batch (boolean)
├── model_family (text) — "GPT-4", "Claude 3", "Llama 3"
├── release_date (date)
├── deprecation_date (date, nullable)
├── openrouter_model_id (text, nullable) — for API cross-reference
└── created_at / updated_at

PricingTier
├── id (uuid, PK)
├── model_id (uuid, FK → Model)
├── effective_date (date)
├── input_price_per_million (decimal) — $/1M input tokens
├── output_price_per_million (decimal) — $/1M output tokens
├── batch_input_price_per_million (decimal, nullable)
├── batch_output_price_per_million (decimal, nullable)
├── image_input_price_per_image (decimal, nullable)
├── audio_input_price_per_minute (decimal, nullable)
├── video_input_price_per_minute (decimal, nullable)
├── fine_tuning_training_price (decimal, nullable)
├── fine_tuning_inference_input_price (decimal, nullable)
├── fine_tuning_inference_output_price (decimal, nullable)
├── pricing_unit (text) — "per_million_tokens", "per_1k_tokens"
├── source (text) — "openrouter_api", "openai_website", etc.
└── created_at

PriceChangeLog
├── id (uuid, PK)
├── model_id (uuid, FK → Model)
├── field_changed (text)
├── old_value (decimal)
├── new_value (decimal)
├── detected_at (timestamp)
└── source (text)

UsageScenario
├── id (uuid, PK)
├── name (text) — "Chatbot (10k daily users)"
├── slug (text, unique)
├── description (text)
├── category (text) — "chatbot", "summarization", "code-gen", etc.
├── default_input_tokens (integer)
├── default_output_tokens (integer)
├── default_daily_requests (integer)
├── default_images_per_request (integer, nullable)
├── default_audio_minutes_per_request (decimal, nullable)
├── is_featured (boolean)
└── created_at / updated_at
```

## 6. Environment Specifications

| Environment | Purpose                | Infrastructure                                        |
| ----------- | ---------------------- | ----------------------------------------------------- |
| Local       | Development            | Docker Compose (Postgres, Redis) + Next.js dev server |
| Preview     | PR review              | Vercel preview deployments                            |
| Staging     | Pre-release validation | Vercel + staging database                             |
| Production  | Live                   | Vercel + production database + Inngest cloud          |

## 7. Development Standards

- **TypeScript strict mode** throughout
- **Conventional commits** for changelog generation
- **ESLint + Prettier** enforced via CI
- **Component-driven development** with Storybook (optional, phase 2)
- **Test pyramid:** Unit tests (Vitest) → Integration tests → E2E (Playwright)

---

# 📄 tasks.md — Spotlight Task Breakdown

```markdown
[metadata]
title: Spotlight — Implementation Tasks
version: 0.1.0
status: draft
owner: Mill Pond Research LLC
last_updated: 2025-02
```

## Ordered Product Requirements

### PRD-001: Data Ingestion Pipeline — OpenRouter
**Priority:** P0 — Everything depends on having model data
**Files:** `src/ingestion/openrouter/*`, `src/db/schema/*`
**Dependencies:** Database schema must be defined first
**Acceptance Criteria:**
- [ ] OpenRouter `/api/v1/models` endpoint is called on a scheduled basis (every 6 hours)
- [ ] Response is normalized into Provider, Model, and PricingTier records
- [ ] Duplicate detection: existing models are updated, not duplicated
- [ ] Price changes are logged to PriceChangeLog table
- [ ] Ingestion failures are logged and retried with exponential backoff
- [ ] Rate limiting is respected (OpenRouter: 20 req/min free tier)

**Implementation Notes:**
OpenRouter's model endpoint returns pricing in `pricing.prompt` and `pricing.completion` per token (not per million). Normalize to per-million for consistency. Context length is in `context_length`. Top-level `id` field is the model slug (e.g., `openai/gpt-4o`).

---

### PRD-002: Data Ingestion Pipeline — Provider Websites
**Priority:** P0 — OpenRouter alone is insufficient (doesn't cover all pricing tiers)
**Files:** `src/ingestion/providers/openai.ts`, `src/ingestion/providers/anthropic.ts`, `src/ingestion/providers/fireworks.ts`, `src/ingestion/providers/lambda.ts`
**Dependencies:** PRD-001 schema
**Acceptance Criteria:**
- [ ] Each provider's pricing page is scraped on a scheduled basis (every 12 hours)
- [ ] Scraped data is normalized to the same schema as OpenRouter data
- [ ] Provider API endpoints are used where available (OpenAI models API, Anthropic API)
- [ ] Manual fallback: scraping extracts structured pricing tables
- [ ] Data conflicts between OpenRouter and provider source use provider source as canonical
- [ ] Scraping is resilient to minor page structure changes

**Implementation Notes:**
Prefer official APIs over scraping. OpenAI has `/v1/models` (no pricing — pricing is on website). Anthropic has no public model listing API. Fireworks has API docs. Lambda is website-only. Consider using a headless browser (Playwright) for JS-rendered pricing pages, or Cheerio for static HTML.

---

### PRD-003: Database Schema & Migrations
**Priority:** P0 — Foundation for all data
**Files:** `src/db/schema.ts`, `src/db/migrations/*`, `drizzle.config.ts`
**Dependencies:** None
**Acceptance Criteria:**
- [ ] Schema implements all entities from plans.md data model
- [ ] Migrations are versioned and reversible
- [ ] Seed script populates initial provider data
- [ ] Indexes exist on: `Model.slug`, `Model.provider_id`, `PricingTier.model_id + effective_date`
- [ ] Enum types defined for `modality` field

**Implementation Notes:**
Use Drizzle's `pgEnum` for modality. Consider using `decimal` type (`numeric` in Postgres) for pricing to avoid floating-point errors in financial calculations.

---

### PRD-004: Model Explorer Page
**Priority:** P1 — Primary landing experience
**Files:** `src/app/(marketing)/models/page.tsx`, `src/components/models/model-table.tsx`, `src/components/models/model-filters.tsx`
**Dependencies:** PRD-003, PRD-001
**Acceptance Criteria:**
- [ ] Table displays all models with: name, provider, modality, context window, input price, output price
- [ ] Filterable by: provider, modality, price range, context window range, function calling support
- [ ] Sortable by: price (asc/desc), context window, name, provider
- [ ] Search bar with fuzzy matching on model name
- [ ] Pagination or virtual scrolling for performance (100+ models)
- [ ] Deep-linkable filter state (URL params)
- [ ] Responsive: mobile card view, desktop table view

**Implementation Notes:**
Consider server components for the initial table render with client-side filtering for snappy interaction. Use URL search params for shareable filter states.

---

### PRD-005: Cost Calculator
**Priority:** P1 — Core value proposition
**Files:** `src/app/calculator/page.tsx`, `src/components/calculator/token-input.tsx`, `src/components/calculator/cost-breakdown.tsx`
**Dependencies:** PRD-003, PRD-001
**Acceptance Criteria:**
- [ ] User selects one or more models to compare
- [ ] Input fields: estimated input tokens, output tokens, requests per day/month
- [ ] Optional: images per request, audio minutes per request
- [ ] Real-time cost calculation displayed per model
- [ ] Cost breakdown: input cost, output cost, per-modality costs
- [ ] Monthly and annual projections
- [ ] "Quick scenarios" dropdown to auto-populate (links to UsageScenario data)
- [ ] Results can be shared via URL

**Implementation Notes:**
Calculation logic should be pure functions with thorough unit tests. Handle edge cases: models with different pricing units, batch pricing vs. real-time, models that don't support certain modalities.

---

### PRD-006: Example Usage Scenarios
**Priority:** P1 — Reduces friction for cost estimation
**Files:** `src/app/scenarios/page.tsx`, `src/components/scenarios/scenario-card.tsx`, `src/db/seed-scenarios.ts`
**Dependencies:** PRD-005
**Acceptance Criteria:**
- [ ] Pre-built scenarios: "Customer Support Chatbot", "Code Generation Assistant", "Document Summarization Pipeline", "Image Analysis Service", "Content Moderation System"
- [ ] Each scenario auto-fills calculator with realistic token estimates
- [ ] Scenarios are categorized and searchable
- [ ] User can customize scenario defaults and save (local storage for v1)
- [ ] Featured scenarios shown on homepage

**Implementation Notes:**
Token estimates should be grounded in real-world data. E.g., a customer support chatbot might average 500 input tokens (conversation history) + 200 output tokens per request. Source from published benchmarks where possible.

---

### PRD-007: Comparison Dashboard
**Priority:** P1 — Differentiated feature
**Files:** `src/app/compare/page.tsx`, `src/components/compare/comparison-table.tsx`, `src/components/compare/radar-chart.tsx`
**Dependencies:** PRD-004, PRD-005
**Acceptance Criteria:**
- [ ] Side-by-side comparison of 2-5 models
- [ ] Feature comparison: context window, modalities, function calling, streaming, batch
- [ ] Price comparison: input, output, batch, per-modality
- [ ] Visual charts: price-per-quality-tier, cost projection over time
- [ ] "Best value" indicator for given usage pattern
- [ ] Shareable comparison via URL

---

### PRD-008: Homepage & Navigation
**Priority:** P1 — Entry point and brand
**Files:** `src/app/page.tsx`, `src/components/layout/header.tsx`, `src/components/layout/footer.tsx`, `src/components/home/hero.tsx`, `src/components/home/featured-scenarios.tsx`
**Dependencies:** PRD-004, PRD-006
**Acceptance Criteria:**
- [ ] Hero section with value proposition and CTA
- [ ] "Popular comparisons" quick links
- [ ] Featured usage scenarios
- [ ] Recently updated pricing indicator
- [ ] Global navigation: Models, Calculator, Compare, Scenarios
- [ ] Mobile-responsive hamburger menu

---

### PRD-009: SEO & Performance
**Priority:** P2 — Growth enabler
**Files:** `src/app/sitemap.ts`, `src/app/robots.ts`, `src/components/seo/*`, `next.config.js`
**Dependencies:** PRD-004
**Acceptance Criteria:**
- [ ] Each model has a dedicated page with structured data (JSON-LD)
- [ ] Dynamic sitemap generated from model database
- [ ] Meta descriptions and Open Graph tags per page
- [ ] Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1
- [ ] ISR (Incremental Static Regeneration) for model pages (revalidate: 3600)

---

### PRD-010: Price Change Alerts
**Priority:** P2 — Retention feature
**Dependencies:** PRD-001, PRD-002
**Acceptance Criteria:**
- [ ] Email notification when a tracked model's price changes
- [ ] Users can "watch" specific models
- [ ] Price change history displayed on model detail pages
- [ ] RSS feed of price changes

---

## Task Dependency Graph

```
PRD-003 (Schema) ──┬──→ PRD-001 (OpenRouter Ingestion) ──┬──→ PRD-004 (Model Explorer)
                    ├──→ PRD-002 (Provider Ingestion)  ───┤        │
                    │                                     │        ├──→ PRD-007 (Comparison)
                    │                                     │        │
                    │                                     ├──→ PRD-005 (Calculator) ──→ PRD-006 (Scenarios)
                    │                                     │
                    │                                     └──→ PRD-010 (Price Alerts)
                    │
                    └──→ PRD-008 (Homepage) ──→ PRD-009 (SEO)
```

---

# 📄 expand.md — Items Requiring Further Exploration

```markdown
[metadata]
title: Spotlight — Expansion Items
version: 0.1.0
status: draft
```

## Needs Stakeholder Clarification

1. **Brand & Domain** — Is `spotlight.dev` or `spotlight.ai` available? Brand color palette and design language preferences?
2. **Authentication Model** — Is user auth needed for v1? Price alerts (PRD-010) require it. Consider: no auth for v1, Clerk/Auth.js for v2.
3. **OpenRouter API Key** — Free tier has rate limits. Do we need a paid plan? API key management strategy?
4. **Legal/Compliance** — Web scraping provider websites — review ToS for each provider. OpenAI and Anthropic may have API terms that cover pricing data usage.

## Technical Research Required

5. **OpenRouter Data Completeness** — Audit what percentage of models/pricing OpenRouter covers vs. direct provider sources. This determines scraping complexity.
6. **Pricing Structure Edge Cases** — Some models have: tiered pricing (volume discounts), regional pricing, commitment-based pricing (Anthropic committed tier), training vs. inference pricing, image pricing per resolution tier. How do we model these?
7. **Token Counting Accuracy** — Should we integrate tiktoken or equivalent so users can estimate tokens from text input directly? This would be a powerful differentiator.
8. **Real-time Provider APIs** — OpenAI's `/v1/models` doesn't include pricing. Anthropic's API doesn't list models publicly. What's the actual API coverage vs. scraping need?
9. **Batch Pricing** — Several providers now offer 50% discounts for batch requests. Is this a separate PricingTier or a flag on existing tiers?

## Future Enhancements (Post-V1)

10. **Historical Price Charts** — Time-series visualization of price changes per model/provider
11. **Cost Simulation** — Monte Carlo simulation for variable-usage scenarios (stochastic token counts)
12. **API Access** — Public API so developers can query pricing programmatically
13. **Browser Extension** — Overlay pricing info on provider websites while browsing
14. **Fine-tuning Cost Estimator** — Calculate fine-tuning costs including training data preparation
15. **Multimodal Token Calculator** — Convert images/audio/video to estimated token counts per provider's encoding rules
16. **Community Contributions** — Allow users to submit pricing updates or corrections (with verification)

---

# 📄 memory.md — Initialization

```markdown
[metadata]
title: Spotlight — Knowledge & Decision Log
version: 0.1.0
status: draft
```

## Project Kickoff — 2025-02

### Initial Decisions
| Decision   | Choice                   | Rationale                                        |
| ---------- | ------------------------ | ------------------------------------------------ |
| Framework  | Next.js 14+ (App Router) | SSR/SSG for SEO, fullstack capability, ecosystem |
| Database   | PostgreSQL               | Structured relational data, complex queries      |
| ORM        | Drizzle                  | Type-safe, lightweight, good DX                  |
| Deployment | Vercel                   | Zero-friction Next.js hosting                    |
| Job System | Inngest                  | Durable execution, cron schedules, good DX       |

### Key Insights
- OpenRouter provides the most consolidated model/pricing data, but is not a complete source — direct provider scraping is necessary
- Pricing is more complex than "cost per token" — modality-specific pricing, batch pricing, fine-tuning pricing all need modeling
- The `per_million_tokens` convention is becoming standard across providers — normalize everything to this unit
- Provider pricing pages change structure frequently — scraping needs to be resilient

### Open Questions
- Domain name availability
- Auth requirement for v1
- Provider ToS regarding automated pricing data collection
- Whether to support regional pricing variants

---
```

---

## Summary & Next Steps

Pete, here's what I've laid out and what I'd recommend as the **immediate action sequence**:

| Step | Action | Timeline |
|------|--------|----------|
| 1 | **Finalize domain and branding** — Needed before any deployment | Day 1-2 |
| 2 | **Scaffold the repo** — Next.js + Drizzle + Tailwind + shadcn | Day 2-3 |
| 3 | **Implement PRD-003** (Database schema) — Everything flows from here | Day 3-4 |
| 4 | **Implement PRD-001** (OpenRouter ingestion) — Fastest path to populated data | Day 4-6 |
| 5 | **Implement PRD-004** (Model Explorer) — First visible feature | Day 6-9 |
| 6 | **Implement PRD-005 + PRD-006** (Calculator + Scenarios) — Core value prop | Day 9-14 |

The **biggest risk** I see is the data ingestion layer (PRD-001/002). OpenRouter gives us a head start, but provider-specific pricing nuances (batch pricing, modality pricing, committed tiers) will require ongoing refinement. I'd strongly recommend getting OpenRouter working first, then layering in provider-specific sources incrementally.

Also worth calling out: **item #7 in expand.md** — integrating a token counter (tiktoken for OpenAI, approximate for others) so users can paste in text and see "this is roughly 2,400 tokens" would be a *significant* differentiator. Very few tools do this. Worth considering bumping to v1 if the implementation isn't too heavy.

Want me to dive deeper into any of these — the ingestion pipeline architecture, the data model nuances, or a specific PRD?