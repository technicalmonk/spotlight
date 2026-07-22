import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 500 });
    }

    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(databaseUrl);

    await sql`
      CREATE TABLE IF NOT EXISTS model_benchmarks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        model_id UUID NOT NULL,
        model_slug TEXT NOT NULL,
        model_name TEXT NOT NULL,
        provider_name TEXT NOT NULL,
        intelligence_score INTEGER NOT NULL,
        reasoning_score INTEGER,
        coding_score INTEGER,
        math_score INTEGER,
        knowledge_score INTEGER,
        test_version TEXT NOT NULL DEFAULT 'v1',
        openrouter_model_id TEXT,
        benchmarked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        posted_to_x BOOLEAN DEFAULT FALSE NOT NULL,
        x_post_id TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      )
    `;

    await sql`CREATE UNIQUE INDEX IF NOT EXISTS model_benchmarks_model_slug_idx ON model_benchmarks (model_slug)`;
    await sql`CREATE INDEX IF NOT EXISTS model_benchmarks_score_idx ON model_benchmarks (intelligence_score)`;
    await sql`CREATE INDEX IF NOT EXISTS model_benchmarks_posted_idx ON model_benchmarks (posted_to_x)`;

    return NextResponse.json({ success: true, message: "model_benchmarks table created" });
  } catch (error) {
    console.error("[api/seed-benchmarks] Error:", error);
    return NextResponse.json({ error: "Failed to create table" }, { status: 500 });
  }
}
