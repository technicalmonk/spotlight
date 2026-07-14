# Implementation Plan: Spotlight — LLM Pricing Platform

**Branch**: `001-spotlight-platform` | **Date**: 2026-07-14 | **Spec**: [spec.md](./spec.md)

## Summary

Spotlight is an autonomous LLM pricing comparison platform. It aggregates model data and pricing from OpenRouter (primary source, 343+ models across 50+ providers) and layers in provider-specific scraping for data OpenRouter doesn't cover (batch, fine-tuning, modality-specific rates). Users can explore models, estimate costs, and compare providers side-by-side. The ingestion pipeline runs autonomously on Vercel Cron, detects price changes, and auto-discovers new models without manual intervention.

## Technical Context

**Language/Version**: TypeScript 5.x, Next.js 15 (App Router)

**Primary Dependencies**: Next.js 15, React 19, Tailwind CSS 4, shadcn/ui, Drizzle ORM, Zod, Recharts, React Hook Form, Nuqs (URL state), Hono (lightweight API routes)

**Storage**: PostgreSQL via Neon (serverless, connection pooling built-in)

**Testing**: Vitest (unit tests for calculation logic and ingestion parsers)

**Target Platform**: Vercel (frontend + API routes + cron), Neon (database), optional Railway (heavy ingestion worker if needed)

**Project Type**: web-app (fullstack Next.js monorepo)

**Performance Goals**: LCP < 2.5s, CLS < 0.1, model table loads < 1s, ISR revalidate hourly

**Constraints**: No user auth for v1, no Redis required (Postgres handles read load with proper indexing), OpenRouter free-tier rate limits (20 req/min), ingestion must complete within Vercel Cron's 5-minute timeout (or split across multiple cron invocations)

**Scale/Scope**: 343+ models, 50+ providers, 10-20 provider-specific scrapers, 5 pre-built usage scenarios, 4 main pages (Models, Calculator, Compare, Home)

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| Data Freshness is Sacred | ✅ | Vercel Cron runs every 6 hours (OpenRouter) and 12 hours (providers). PriceChangeLog tracks all changes. |
| Autonomous Operation | ✅ | OpenRouter auto-discovers new providers/models. Scrapers auto-retry. No manual model entry. |
| Developer-First UX | ✅ | Linear-style design, flat shadows, monospace numbers, data-dense tables. |
| Performance as a Feature | ✅ | Server components for initial render, ISR for model pages, lazy-loaded charts. |
| Type Safety End-to-End | ✅ | TypeScript strict, Drizzle ORM, Zod validation on all ingestion. |
| Simplicity (YAGNI) ✅ | | No auth, no Redis, no alerts for v1. OpenRouter as primary source. |
| Open Source, Transparent | ✅ | Source field on every PricingTier. Ingestion logs auditable. |

No constitution violations. No complexity tracking entries needed.

## Project Structure

```text
spotlight/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout, metadata, nav
│   │   ├── page.tsx                # Homepage
│   │   ├── models/
│   │   │   ├── page.tsx            # Model explorer (server component)
│   │   │   └── [slug]/
│   │   │       └── page.tsx        # Model detail (ISR)
│   │   ├── calculator/
│   │   │   └── page.tsx            # Cost calculator
│   │   ├── compare/
│   │   │   └── page.tsx            # Comparison dashboard
│   │   ├── scenarios/
│   │   │   └── page.tsx            # Usage scenarios
│   │   ├── api/
│   │   │   ├── models/
│   │   │   │   └── route.ts        # GET /api/models (filtered)
│   │   │   ├── calculate/
│   │   │   │   └── route.ts        # POST /api/calculate
│   │   │   ├── compare/
│   │   │   │   └── route.ts        # GET /api/compare
│   │   │   └── cron/
│   │   │       ├── openrouter/
│   │   │       │   └── route.ts    # Cron: OpenRouter ingestion
│   │   │       └── providers/
│   │   │           └── route.ts    # Cron: Provider scraping
│   │   ├── sitemap.ts              # Dynamic sitemap
│   │   └── robots.ts               # Robots.txt
│   ├── components/
│   │   ├── layout/
│   │   │   ├── header.tsx
│   │   │   └── footer.tsx
│   │   ├── models/
│   │   │   ├── model-table.tsx
│   │   │   ├── model-filters.tsx
│   │   │   └── model-card.tsx      # Mobile variant
│   │   ├── calculator/
│   │   │   ├── token-input.tsx
│   │   │   ├── model-picker.tsx
│   │   │   ├── cost-breakdown.tsx
│   │   │   └── scenario-selector.tsx
│   │   ├── compare/
│   │   │   ├── comparison-table.tsx
│   │   │   └── price-chart.tsx
│   │   ├── home/
│   │   │   ├── hero.tsx
│   │   │   └── featured-scenarios.tsx
│   │   └── ui/                     # shadcn/ui components
│   ├── db/
│   │   ├── schema.ts               # Drizzle schema (all tables)
│   │   ├── client.ts               # Drizzle client
│   │   ├── queries.ts              # Reusable query functions
│   │   └── seed.ts                 # Seed scenarios + initial providers
│   ├── ingestion/
│   │   ├── openrouter.ts           # OpenRouter API client + normalizer
│   │   ├── providers/
│   │   │   ├── openai.ts           # OpenAI-specific scraper
│   │   │   ├── anthropic.ts        # Anthropic-specific scraper
│   │   │   ├── google.ts           # Google AI pricing scraper
│   │   │   ├── groq.ts             # Groq pricing scraper
│   │   │   ├── deepseek.ts         # DeepSeek pricing scraper
│   │   │   └── base.ts             # Shared scraper utilities
│   │   ├── normalizer.ts           # Normalize all sources to canonical schema
│   │   ├── diff-detector.ts        # Detect price changes between runs
│   │   └── runner.ts               # Orchestrate ingestion, handle retries
│   ├── lib/
│   │   ├── calculator.ts           # Pure calculation functions
│   │   ├── utils.ts                # cn(), formatters, slug helpers
│   │   └── types.ts                # Shared types
│   └── styles/
│       └── globals.css             # Tailwind
├── drizzle/                        # Migration files
├── drizzle.config.ts
├── next.config.ts
├── tailwind.config.ts
├── package.json
├── tsconfig.json
├── vercel.json                     # Cron schedule
└── .env.local                      # DATABASE_URL, OPENROUTER_API_KEY
```

## Constitution Check

All principles satisfied. No violations to justify.
