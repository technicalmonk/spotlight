import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

/**
 * POST /api/seed-arena
 * Creates the arena_battles table if it doesn't exist.
 */
export async function POST() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 500 });
  }

  const sql = neon(databaseUrl);

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS arena_battles (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        challenge_id text NOT NULL,
        challenge_category text NOT NULL,
        challenge_title text NOT NULL,
        model_a_slug text NOT NULL,
        model_a_name text NOT NULL,
        model_a_provider text NOT NULL,
        model_a_response text NOT NULL,
        model_b_slug text NOT NULL,
        model_b_name text NOT NULL,
        model_b_provider text NOT NULL,
        model_b_response text NOT NULL,
        winner text NOT NULL,
        voter_ip text,
        created_at timestamp with time zone DEFAULT now() NOT NULL
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS arena_battles_created_idx ON arena_battles (created_at)`;
    await sql`CREATE INDEX IF NOT EXISTS arena_battles_winner_idx ON arena_battles (winner)`;
    await sql`CREATE INDEX IF NOT EXISTS arena_battles_model_a_idx ON arena_battles (model_a_slug)`;
    await sql`CREATE INDEX IF NOT EXISTS arena_battles_model_b_idx ON arena_battles (model_b_slug)`;

    return NextResponse.json({ ok: true, message: "arena_battles table created" });
  } catch (err: any) {
    console.error("[seed-arena] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
