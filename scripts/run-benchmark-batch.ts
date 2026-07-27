import { neon } from "@neondatabase/serverless";
import { BENCHMARK_QUESTIONS, BENCHMARK_VERSION } from "../src/lib/benchmark-suite";

const DB_URL = "postgresql://neondb_owner:npg_GaOT6IrjsSL8@ep-wispy-voice-atfntc2g-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MAX_DURATION = 30;
const MAX_TOKENS = 200;
const DELAY_MS = 500;

// Read OPENROUTER_API_KEY from env
import * as fs from "fs";
let apiKey = process.env.OPENROUTER_API_KEY || "";
if (!apiKey) {
  const envPath = "/home/pshimshock/.hermes/.env";
  const envContent = fs.readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    if (line.startsWith("OPENROUTER_API_KEY=")) {
      apiKey = line.slice("OPENROUTER_API_KEY=".length).trim();
      break;
    }
  }
}

if (!apiKey) {
  console.error("OPENROUTER_API_KEY not found");
  process.exit(1);
}

interface ModelInfo {
  id: string;
  slug: string;
  name: string;
  openrouter_model_id: string;
  provider_name: string;
}

async function askModel(openrouterModelId: string, question: string): Promise<string> {
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

    if (!res.ok) return "";
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
  } catch {
    return "";
  }
}

async function benchmarkModel(model: ModelInfo): Promise<{
  intelligenceScore: number;
  reasoningScore: number;
  codingScore: number;
  mathScore: number;
  knowledgeScore: number;
}> {
  const results = { reasoning: 0, coding: 0, math: 0, knowledge: 0 };
  const counts = { reasoning: 0, coding: 0, math: 0, knowledge: 0 };

  for (const q of BENCHMARK_QUESTIONS) {
    const response = await askModel(model.openrouter_model_id, q.question);
    const correct = q.check(response);
    counts[q.category]++;
    if (correct) results[q.category]++;
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }

  return {
    intelligenceScore: Math.round(
      ((results.reasoning + results.coding + results.math + results.knowledge) /
        (counts.reasoning + counts.coding + counts.math + counts.knowledge)) * 100
    ),
    reasoningScore: Math.round((results.reasoning / counts.reasoning) * 100),
    codingScore: Math.round((results.coding / counts.coding) * 100),
    mathScore: Math.round((results.math / counts.math) * 100),
    knowledgeScore: Math.round((results.knowledge / counts.knowledge) * 100),
  };
}

async function main() {
  const sql = neon(DB_URL);

  // Get unbenchmarked models
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
  const toBenchmark = (unbenchmarked as any[]).slice(0, 50);

  console.log(`Total: ${allModels.length}, Already benchmarked: ${benchmarkedSlugs.size}, Will benchmark: ${toBenchmark.length}`);
  console.log("");

  let completed = 0;
  let failed = 0;

  for (const model of toBenchmark) {
    const mi: ModelInfo = {
      id: model.id,
      slug: model.slug,
      name: model.name,
      openrouter_model_id: model.openrouter_model_id,
      provider_name: model.provider_name,
    };

    try {
      const scores = await benchmarkModel(mi);

      // Store in DB
      await sql`
        INSERT INTO model_benchmarks (model_id, model_slug, model_name, provider_name, intelligence_score, reasoning_score, coding_score, math_score, knowledge_score, test_version, openrouter_model_id)
        VALUES (${mi.id}, ${mi.slug}, ${mi.name}, ${mi.provider_name}, ${scores.intelligenceScore}, ${scores.reasoningScore}, ${scores.codingScore}, ${scores.mathScore}, ${scores.knowledgeScore}, ${BENCHMARK_VERSION}, ${mi.openrouter_model_id})
      `;

      completed++;
      console.log(`[${completed}/${toBenchmark.length}] ${mi.name} (${mi.provider_name}): Intelligence=${scores.intelligenceScore} R:${scores.reasoningScore} C:${scores.codingScore} M:${scores.mathScore} K:${scores.knowledgeScore}`);
    } catch (err: any) {
      failed++;
      console.error(`[FAIL] ${mi.name}: ${err.message}`);
    }
  }

  console.log(`\nDone! Completed: ${completed}, Failed: ${failed}`);
}

main().catch((e) => console.error(e));
