import { db } from "@/db/client";
import { modelBenchmarks, models, providers } from "@/db/schema";
import { BENCHMARK_QUESTIONS, BENCHMARK_VERSION } from "@/lib/benchmark-suite";
import { eq, isNull, ne, and, notInArray } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MAX_DURATION = 30; // seconds per question
const MAX_TOKENS = 200;

interface ModelInfo {
  id: string;
  slug: string;
  name: string;
  openrouterModelId: string;
  providerName: string;
}

/**
 * Get all models that need benchmarking (haven't been benchmarked yet).
 * Uses the raw SQL driver since drizzle's notInArray can be tricky with subqueries.
 */
export async function getUnbenchmarkedModels(): Promise<ModelInfo[]> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return [];

  const sql = neon(databaseUrl);

  // Get all active models with their OpenRouter ID and provider name
  const allModels = await sql`
    SELECT m.id, m.slug, m.name, m.openrouter_model_id, p.name as provider_name
    FROM models m
    INNER JOIN providers p ON m.provider_id = p.id
    WHERE m.is_active = true
      AND m.openrouter_model_id IS NOT NULL
      AND m.openrouter_model_id != ''
  `;

  // Get already-benchmarked slugs
  const benchmarked = await sql`
    SELECT model_slug FROM model_benchmarks
  `;

  const benchmarkedSlugs = new Set(benchmarked.map((r: any) => r.model_slug));

  return allModels
    .filter((m: any) => !benchmarkedSlugs.has(m.slug))
    .map((m: any) => ({
      id: m.id,
      slug: m.slug,
      name: m.name,
      openrouterModelId: m.openrouter_model_id,
      providerName: m.provider_name,
    }));
}

/**
 * Send a single benchmark question to a model via OpenRouter.
 */
async function askModel(
  openrouterModelId: string,
  question: string,
  apiKey: string
): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), MAX_DURATION * 1000);

    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://spotlight.xilos.ai",
        "X-Title": "Xilos Spotlight Benchmark",
      },
      body: JSON.stringify({
        model: openrouterModelId,
        messages: [{ role: "user", content: question }],
        max_tokens: MAX_TOKENS,
        temperature: 0,
        stream: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return "";
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
  } catch {
    return "";
  }
}

/**
 * Benchmark a single model across all questions.
 */
async function benchmarkModel(
  model: ModelInfo,
  apiKey: string
): Promise<{
  intelligenceScore: number;
  reasoningScore: number;
  codingScore: number;
  mathScore: number;
  knowledgeScore: number;
}> {
  const results = { reasoning: 0, coding: 0, math: 0, knowledge: 0 };
  const counts = { reasoning: 0, coding: 0, math: 0, knowledge: 0 };

  for (const q of BENCHMARK_QUESTIONS) {
    const response = await askModel(model.openrouterModelId, q.question, apiKey);
    const correct = q.check(response);

    counts[q.category]++;
    if (correct) results[q.category]++;

    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 500));
  }

  const intelligenceScore = Math.round(
    ((results.reasoning + results.coding + results.math + results.knowledge) /
      (counts.reasoning + counts.coding + counts.math + counts.knowledge)) *
      100
  );

  return {
    intelligenceScore,
    reasoningScore: Math.round((results.reasoning / counts.reasoning) * 100),
    codingScore: Math.round((results.coding / counts.coding) * 100),
    mathScore: Math.round((results.math / counts.math) * 100),
    knowledgeScore: Math.round((results.knowledge / counts.knowledge) * 100),
  };
}

/**
 * Run the benchmark job. Benchmarks models that haven't been tested yet.
 * Returns a summary of results.
 */
export async function runBenchmarkJob(apiKey: string): Promise<{
  benchmarked: number;
  results: Array<{
    modelName: string;
    providerName: string;
    intelligenceScore: number;
    reasoningScore: number;
    codingScore: number;
    mathScore: number;
    knowledgeScore: number;
    isNew: boolean;
  }>;
  totalUnbenchmarked: number;
  totalInDb: number;
}> {
  // Get models that need benchmarking
  const unbenchmarked = await getUnbenchmarkedModels();

  // Limit to 10 models per run to stay within Vercel's 60s function limit
  // (each model takes ~20 questions * 0.5s delay + response time)
  const toBenchmark = unbenchmarked.slice(0, 10);

  const results: Array<{
    modelName: string;
    providerName: string;
    intelligenceScore: number;
    reasoningScore: number;
    codingScore: number;
    mathScore: number;
    knowledgeScore: number;
    isNew: boolean;
  }> = [];

  for (const model of toBenchmark) {
    try {
      const scores = await benchmarkModel(model, apiKey);

      // Store in DB
      await db.insert(modelBenchmarks).values({
        modelId: model.id,
        modelSlug: model.slug,
        modelName: model.name,
        providerName: model.providerName,
        intelligenceScore: scores.intelligenceScore,
        reasoningScore: scores.reasoningScore,
        codingScore: scores.codingScore,
        mathScore: scores.mathScore,
        knowledgeScore: scores.knowledgeScore,
        testVersion: BENCHMARK_VERSION,
        openrouterModelId: model.openrouterModelId,
      });

      results.push({
        modelName: model.name,
        providerName: model.providerName,
        intelligenceScore: scores.intelligenceScore,
        reasoningScore: scores.reasoningScore,
        codingScore: scores.codingScore,
        mathScore: scores.mathScore,
        knowledgeScore: scores.knowledgeScore,
        isNew: true,
      });
    } catch (err) {
      console.error(`[benchmark] Failed for ${model.name}:`, err);
    }
  }

  return {
    benchmarked: toBenchmark.length,
    results,
    totalUnbenchmarked: unbenchmarked.length,
    totalInDb: unbenchmarked.length + (await getBenchmarkedCount()),
  };
}

async function getBenchmarkedCount(): Promise<number> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return 0;
  const sql = neon(databaseUrl);
  const result = await sql`SELECT COUNT(*) as count FROM model_benchmarks`;
  return Number(result[0]?.count ?? 0);
}

/**
 * Get all benchmark results, for display in the model table.
 */
export async function getBenchmarkMap(): Promise<Map<string, {
  intelligenceScore: number;
  reasoningScore: number | null;
  codingScore: number | null;
  mathScore: number | null;
  knowledgeScore: number | null;
}>> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return new Map();
  const sql = neon(databaseUrl);

  const rows = await sql`
    SELECT model_slug, intelligence_score, reasoning_score, coding_score, math_score, knowledge_score
    FROM model_benchmarks
  `;

  const map = new Map<string, {
    intelligenceScore: number;
    reasoningScore: number | null;
    codingScore: number | null;
    mathScore: number | null;
    knowledgeScore: number | null;
  }>();

  for (const row of rows) {
    map.set(row.model_slug, {
      intelligenceScore: row.intelligence_score,
      reasoningScore: row.reasoning_score,
      codingScore: row.coding_score,
      mathScore: row.math_score,
      knowledgeScore: row.knowledge_score,
    });
  }

  return map;
}

/**
 * Get unposted benchmark results (for X posting).
 */
export async function getUnpostedBenchmarks() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return [];
  const sql = neon(databaseUrl);

  return await sql`
    SELECT id, model_slug, model_name, provider_name, intelligence_score,
           reasoning_score, coding_score, math_score, knowledge_score
    FROM model_benchmarks
    WHERE posted_to_x = false
    ORDER BY benchmarked_at ASC
  `;
}

/**
 * Mark a benchmark as posted to X.
 */
export async function markBenchmarkPosted(id: string, xPostId: string) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return;
  const sql = neon(databaseUrl);
  await sql`
    UPDATE model_benchmarks
    SET posted_to_x = true, x_post_id = ${xPostId}
    WHERE id = ${id}
  `;
}
