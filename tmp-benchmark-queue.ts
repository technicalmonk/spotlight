import { neon } from "@neondatabase/serverless";

const DB_URL = "postgresql://neondb_owner:npg_GaOT6IrjsSL8@ep-wispy-voice-atfntc2g-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function main() {
  const sql = neon(DB_URL);

  const allModels = await sql`
    SELECT m.id, m.slug, m.name, m.openrouter_model_id, p.name as provider_name
    FROM models m
    INNER JOIN providers p ON m.provider_id = p.id
    WHERE m.is_active = true
      AND m.openrouter_model_id IS NOT NULL
      AND m.openrouter_model_id != ''
    ORDER BY m.name
  `;

  const benchmarked = await sql`SELECT model_slug FROM model_benchmarks`;
  const benchmarkedSlugs = new Set(benchmarked.map((r: any) => r.model_slug));

  const unbenchmarked = allModels.filter((m: any) => !benchmarkedSlugs.has(m.slug));

  const result = {
    total: allModels.length,
    benchmarked: benchmarkedSlugs.size,
    unbenchmarked: unbenchmarked.length,
    next50: unbenchmarked.slice(0, 50).map((m: any) => ({
      id: m.id,
      slug: m.slug,
      name: m.name,
      openrouter_model_id: m.openrouter_model_id,
      provider_name: m.provider_name,
    })),
  };

  console.log(JSON.stringify(result, null, 2));
}

main().catch((e) => console.error(e));
