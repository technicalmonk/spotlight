# Spotlight Constitution

## Core Principles

### I. Data Freshness is Sacred
Pricing data must be current. The ingestion pipeline runs autonomously and frequently. Stale data is worse than no data — it erodes trust. Every model page shows a "last updated" timestamp. Price changes are detected, logged, and visible to users within hours, not days.

### II. Autonomous Operation
The site must operate without human intervention. New models and providers are auto-discovered from OpenRouter. Price changes are auto-detected and logged. Scrapers are resilient to page structure changes. The system self-heals: failed ingestion jobs retry with backoff. A human should only need to intervene for broken scrapers or schema migrations.

### III. Developer-First UX
The audience is technical — engineers, MLops teams, CTOs. No marketing fluff. Clean, fast, data-dense interfaces. Linear-style aesthetic: flat, subtle shadows, monospace for numbers, tables that load instantly. Every page is deep-linkable. Filters and comparisons work via URL params.

### IV. Performance as a Feature
Core Web Vitals must pass. LCP < 2.5s, FID < 100ms, CLS < 0.1. Model tables use server components for initial render, client-side filtering for snappy interaction. ISR for model pages (revalidate hourly). No unnecessary client-side JavaScript. Charts lazy-loaded.

### V. Type Safety End-to-End
TypeScript strict mode throughout. Drizzle ORM for type-safe database access. Zod schemas for all external data ingestion (API responses, scraped HTML). Runtime validation on every ingestion source — never trust external data blindly.

### VI. Simplicity (YAGNI)
Start with OpenRouter as the primary data source — it covers 300+ models across 50+ providers. Layer in provider-specific scrapers only for data OpenRouter doesn't have (batch pricing, fine-tuning, modality-specific rates). Don't build auth, alerts, or user accounts for v1 — those are v2 features. Ship the core: explore models, compare prices, estimate costs.

### VII. Open Source, Transparent
The codebase is open source. Pricing data sources are documented and visible. Ingestion logs are auditable. No black boxes. If a price is wrong, users can see where it came from (the `source` field on every PricingTier).

## Development Workflow

- TypeScript strict mode, no `any` types
- Conventional commits (`feat:`, `fix:`, `chore:`, `refactor:`)
- ESLint + Prettier enforced
- Vitest for unit tests (calculation logic must be tested)
- Drizzle migrations are versioned and reviewed
- All external data validated with Zod before writing to DB

## Governance

- Constitution supersedes all other practices
- Complexity must be justified — prefer simple solutions
- New providers: auto-discovered from OpenRouter, no manual setup needed
- Schema changes require a migration + seed update
- Use `import.meta.env.VITE_API_URL || "/"` pattern for API base URLs (Vercel-safe)

**Version**: 1.0.0 | **Ratified**: 2026-07-14 | **Last Amended**: 2026-07-14
