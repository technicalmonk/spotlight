# Tasks: Spotlight — LLM Pricing Platform

**Input**: Design documents from `specs/001-spotlight-platform/`

**Prerequisites**: plan.md (required), spec.md (required), data-model.md (required)

**Tests**: Unit tests included for calculation logic and ingestion normalizers (critical path).

**Organization**: Tasks grouped by user story in priority order, with Setup and Foundational phases first.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1=Explorer, US2=Calculator, US3=Compare, US4=DataFreshness, US5=Homepage)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Initialize Next.js 15 project with TypeScript, Tailwind, App Router in /home/pshimshock/Projects/spotlight
- [ ] T002 Install and configure shadcn/ui, Drizzle ORM, Zod, Recharts, React Hook Form, Nuqs in package.json
- [ ] T003 [P] Configure tsconfig.json with strict mode and path aliases (@/, @/components, @/lib)
- [ ] T004 [P] Configure next.config.ts with image domains, ISR settings
- [ ] T005 [P] Create .gitignore, .env.local.example, README.md
- [ ] T006 [P] Set up vercel.json with cron schedule definitions for ingestion

**Checkpoint**: Project scaffolded and dependencies installed

---

## Phase 2: Foundational (Database + Ingestion Core)

**Purpose**: Database schema and OpenRouter ingestion pipeline — everything else depends on this

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T007 Create Drizzle schema for all 5 tables in src/db/schema.ts (Provider, Model, PricingTier, PriceChangeLog, UsageScenario) per data-model.md
- [ ] T008 Create Drizzle client connection in src/db/client.ts with Neon connection pooling
- [ ] T009 [P] Create reusable query functions in src/db/queries.ts (getModels, getModelsFiltered, getModelBySlug, getPricingForModel, getComparisonData, getPriceHistory)
- [ ] T010 Generate and run initial Drizzle migration in drizzle/ directory
- [ ] T011 [P] Create seed script for UsageScenario table in src/db/seed.ts with 5 scenarios from data-model.md
- [ ] T012 [P] Create Zod schemas for OpenRouter API response validation in src/ingestion/openrouter.ts
- [ ] T013 Create OpenRouter API client in src/ingestion/openrouter.ts — fetch /api/v1/models, validate with Zod, normalize pricing (per-token → per-million)
- [ ] T014 Create normalizer in src/ingestion/normalizer.ts — map OpenRouter response to Provider, Model, PricingTier shapes per data-model.md ingestion mapping table
- [ ] T015 Create diff-detector in src/ingestion/diff-detector.ts — compare new pricing vs existing, return price changes for PriceChangeLog
- [ ] T016 Create ingestion runner in src/ingestion/runner.ts — orchestrate fetch→normalize→diff→upsert, handle retries with exponential backoff, upsert providers/models/pricing, auto-discover new providers from OpenRouter prefixes
- [ ] T017 Create Vercel Cron API route for OpenRouter ingestion in src/app/api/cron/openrouter/route.ts — call runner, verify CRON_SECRET header, return JSON summary
- [ ] T018 [P] Create pure calculation functions in src/lib/calculator.ts — calculateCost(model, inputTokens, outputTokens, requestsPerDay, options) → {perRequest, daily, monthly, annual, breakdown}
- [ ] T019 [P] Write unit tests for calculator in src/lib/__tests__/calculator.test.ts — verify per-million normalization, batch pricing, multi-model, edge cases
- [ ] T020 [P] Write unit tests for normalizer in src/ingestion/__tests__/normalizer.test.ts — verify OpenRouter field mapping, pricing conversion, modality parsing

**Checkpoint**: Database ready, OpenRouter ingestion working, calculation logic tested

---

## Phase 3: User Story 1 — Model Explorer (Priority: P1) 🎯 MVP

**Goal**: Users can browse, filter, search, and sort all LLM models with pricing

**Independent Test**: Load /models, filter by provider, search "claude", verify prices displayed and URL params sync

- [ ] T021 [P] [US1] Create API route GET /api/models in src/app/api/models/route.ts — accepts query params (provider, modality, minPrice, maxPrice, minContext, sort, search, page), returns filtered/paginated models with current pricing
- [ ] T022 [P] [US1] Create model table component in src/components/models/model-table.tsx — server component for initial render, columns: name, provider, modality, context window, input $/1M, output $/1M
- [ ] T023 [P] [US1] Create model filters component in src/components/models/model-filters.tsx — provider dropdown, modality checkboxes, price range sliders, context window range, function calling toggle, search bar
- [ ] T024 [US1] Create models page in src/app/models/page.tsx — server component fetches initial data, renders table + filters, uses Nuqs for URL state sync
- [ ] T025 [P] [US1] Create model card component for mobile in src/components/models/model-card.tsx — card layout for responsive view
- [ ] T026 [US1] Add responsive breakpoint handling to models page — desktop: table, mobile: cards
- [ ] T027 [P] [US1] Create model detail page in src/app/models/[slug]/page.tsx — ISR (revalidate: 3600), shows full model info, current pricing, price history, JSON-LD structured data
- [ ] T028 [P] [US1] Create price history display component in src/components/models/price-history.tsx — shows PriceChangeLog entries with dates, old/new values

**Checkpoint**: Model explorer fully functional — MVP is live

---

## Phase 4: User Story 2 — Cost Calculator (Priority: P1)

**Goal**: Users can estimate costs for any model(s) with realistic usage parameters

**Independent Test**: Select a model, enter 5000 input + 1000 output + 1000 req/day, verify monthly cost matches hand calculation

- [ ] T029 [P] [US2] Create model picker component in src/components/calculator/model-picker.tsx — searchable multi-select for models
- [ ] T030 [P] [US2] Create token input component in src/components/calculator/token-input.tsx — React Hook Form + Zod validated, fields: input tokens, output tokens, requests per day
- [ ] T031 [P] [US2] Create cost breakdown display in src/components/calculator/cost-breakdown.tsx — per-request, daily, monthly, annual, split by input/output
- [ ] T032 [P] [US2] Create scenario selector in src/components/calculator/scenario-selector.tsx — dropdown of UsageScenarios, auto-fills token inputs
- [ ] T033 [US2] Create calculator page in src/app/calculator/page.tsx — combines picker, inputs, breakdown, scenario selector; real-time calc using calculator.ts; URL-shareable via Nuqs
- [ ] T034 [US2] Add batch pricing toggle to calculator — when enabled, uses batch_input/output_price instead of standard

**Checkpoint**: Cost calculator fully functional

---

## Phase 5: User Story 3 — Comparison Dashboard (Priority: P1)

**Goal**: Users can compare 2-5 models side-by-side with features, pricing, and best-value recommendation

**Independent Test**: Select 3 models, enter usage pattern, verify comparison table + best-value indicator + price chart

- [ ] T035 [P] [US3] Create API route GET /api/compare in src/app/api/compare/route.ts — accepts model slugs + usage params, returns comparison data
- [ ] T036 [P] [US3] Create comparison table component in src/components/compare/comparison-table.tsx — side-by-side features (context, modalities, function calling, streaming, batch) and pricing
- [ ] T037 [P] [US3] Create price chart component in src/components/compare/price-chart.tsx — Recharts bar chart of input/output prices, cost projection line chart
- [ ] T038 [US3] Create compare page in src/app/compare/page.tsx — model selector (2-5), comparison table, charts, best-value indicator based on usage pattern, URL-shareable

**Checkpoint**: Comparison dashboard fully functional

---

## Phase 6: User Story 4 — Data Freshness Indicators (Priority: P1)

**Goal**: Users can see when data was last updated and trust its freshness

**Independent Test**: Check model detail page shows "last updated", homepage shows ingestion status

- [ ] T039 [P] [US4] Add "last updated" timestamp to model detail page — from PricingTier.created_at
- [ ] T040 [P] [US4] Create ingestion status API in src/app/api/status/route.ts — returns last ingestion time, model count, recently updated count
- [ ] T041 [US4] Add ingestion status indicator to homepage — "X models updated in the last 12 hours"

**Checkpoint**: Data freshness visible across the site

---

## Phase 7: User Story 5 — Homepage & Navigation (Priority: P2)

**Goal**: First-time visitors understand the product and can navigate to core features

**Independent Test**: Load homepage, verify hero, featured scenarios, popular comparisons, and nav links

- [ ] T042 [P] [US5] Create header component in src/components/layout/header.tsx — nav links: Models, Calculator, Compare, Scenarios; logo; mobile hamburger menu
- [ ] T043 [P] [US5] Create footer component in src/components/layout/footer.tsx — links, data source attribution, "powered by OpenRouter" note
- [ ] T044 [P] [US5] Create hero component in src/components/home/hero.tsx — value proposition, CTA to explore models, model count stat
- [ ] T045 [P] [US5] Create featured scenarios component in src/components/home/featured-scenarios.tsx — 3-4 scenario cards linking to calculator
- [ ] T046 [US5] Create homepage in src/app/page.tsx — combines hero, featured scenarios, ingestion status, popular comparisons
- [ ] T047 [US5] Create scenarios page in src/app/scenarios/page.tsx — all usage scenarios, category filter, links to calculator

**Checkpoint**: Homepage and navigation complete

---

## Phase 8: SEO & Polish (Cross-Cutting)

**Purpose**: Search engine optimization, sitemaps, structured data, final polish

- [ ] T048 [P] Create dynamic sitemap in src/app/sitemap.ts — generates URLs for all model pages from database
- [ ] T049 [P] Create robots.ts in src/app/robots.ts — allow all, reference sitemap
- [ ] T050 [P] Add JSON-LD structured data to model detail pages — Product schema with name, description, offers (pricing)
- [ ] T051 [P] Add metadata generation for each page — title, description, Open Graph tags
- [ ] T052 [P] Add loading skeletons and Suspense boundaries for server component data fetching
- [ ] T053 [P] Create utility functions in src/lib/utils.ts — cn(), formatPrice(), formatNumber(), formatContext(), slugify()
- [ ] T054 [P] Create scenarios API route GET /api/scenarios in src/app/api/scenarios/route.ts
- [ ] T055 Run `npx tsc -b` to verify no TypeScript errors, fix any issues
- [ ] T056 [P] Create README.md with setup instructions, env vars, deployment guide
- [ ] T057 Initialize git repo, create initial commit, create GitHub repo, push

---

## Phase 9: Provider-Specific Scrapers (Post-MVP Enhancement)

**Purpose**: Layer in data OpenRouter doesn't cover — batch, fine-tuning, modality-specific pricing

- [ ] T058 [P] Create base scraper utilities in src/ingestion/providers/base.ts — fetch with timeout, retry, HTML parsing helpers, rate limiting
- [ ] T059 [P] Create OpenAI scraper in src/ingestion/providers/openai.ts — scrape openai.com/api/pricing for batch pricing, fine-tuning pricing
- [ ] T060 [P] Create Anthropic scraper in src/ingestion/providers/anthropic.ts — scrape anthropic.com/pricing for batch pricing, committed tier
- [ ] T061 [P] Create Google scraper in src/ingestion/providers/google.ts — scrape AI Studio pricing for Gemini models
- [ ] T062 [P] Create Groq scraper in src/ingestion/providers/groq.ts — scrape groq.com/pricing for Groq-hosted model pricing
- [ ] T063 [P] Create DeepSeek scraper in src/ingestion/providers/deepseek.ts — scrape deepseek.com/pricing for DeepSeek pricing
- [ ] T064 Create provider cron API route in src/app/api/cron/providers/route.ts — runs all scrapers, merges with OpenRouter data (provider source as canonical for overlapping fields)
- [ ] T065 Add provider scraper schedule to vercel.json — every 12 hours

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories
- **Phase 3 (Model Explorer)**: Depends on Phase 2
- **Phase 4 (Calculator)**: Depends on Phase 2 (calculator.ts + database)
- **Phase 5 (Comparison)**: Depends on Phase 2 and Phase 3 (model data)
- **Phase 6 (Data Freshness)**: Depends on Phase 2 and Phase 3
- **Phase 7 (Homepage)**: Depends on Phase 3, 4 (featured scenarios need calculator)
- **Phase 8 (SEO & Polish)**: Depends on Phase 3 (model pages for sitemap/JSON-LD)
- **Phase 9 (Provider Scrapers)**: Depends on Phase 2 — can run in parallel with frontend phases

### Parallel Opportunities

- T003, T004, T005, T006 can run in parallel (config files)
- T009, T011, T012 can run in parallel (after schema + client)
- T018, T019, T020 can run in parallel (calculator + tests + normalizer tests)
- All Phase 3 component tasks (T022-T028) can be parallelized after T021
- All Phase 4 component tasks (T029-T032) can be parallelized
- All Phase 5 component tasks (T036-T037) can be parallelized
- All Phase 9 scrapers (T058-T063) can run in parallel

## Implementation Strategy

### MVP First (Phases 1-3)
1. Complete Setup + Foundational → Database ready, OpenRouter ingestion working
2. Complete Phase 3 → Model explorer live, 300+ models browsable
3. **STOP and VALIDATE**: Run ingestion, verify models appear, test filters

### Incremental Delivery
1. MVP (Phases 1-3) → Deploy, verify data
2. Add Calculator (Phase 4) → Core value prop live
3. Add Comparison (Phase 5) → Differentiation feature live
4. Add Data Freshness (Phase 6) → Trust indicators
5. Add Homepage (Phase 7) → Brand entry point
6. Add SEO (Phase 8) → Growth enabler
7. Add Provider Scrapers (Phase 9) → Enhanced data coverage
