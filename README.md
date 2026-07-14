# Spotlight

LLM pricing comparison platform. Know what your AI will cost before you build it.

## Setup

```bash
npm install
cp .env.local.example .env.local  # fill in DATABASE_URL
npm run db:generate                # generate migrations
npm run db:push                    # apply schema to Neon
npm run db:seed                    # seed usage scenarios
npm run dev
```

## Architecture

- **Next.js 15** (App Router, Server Components, ISR)
- **Drizzle ORM** + **Neon** (serverless Postgres)
- **OpenRouter API** for model/pricing data (343+ models, 50+ providers)
- **Vercel Cron** for autonomous ingestion (every 6 hours)

## Data Flow

```
OpenRouter API → Ingestion (Vercel Cron) → Normalize → Diff → Upsert → Neon
                                                                         ↓
Model Explorer ← Server Components ← Drizzle ← Neon
```

## Ingestion

- OpenRouter: every 6 hours via Vercel Cron (`/api/cron/openrouter`)
- Provider-specific: every 12 hours via Vercel Cron (`/api/cron/providers`)
- Auto-discovers new models and providers from OpenRouter
- Detects and logs price changes to `PriceChangeLog` table

## License

MIT
