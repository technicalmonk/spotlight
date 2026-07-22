import { NextRequest, NextResponse } from "next/server";
import { runBenchmarkJob, getUnpostedBenchmarks, markBenchmarkPosted } from "@/lib/benchmark-runner";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes for Vercel

/**
 * Cron endpoint for model benchmarking.
 * Runs daily via Vercel Cron.
 *
 * Flow:
 *   1. Verify CRON_SECRET header
 *   2. Benchmark up to 10 new models (never re-benchmark existing)
 *   3. Post results to X via @MillPondAI
 *   4. Return JSON summary
 *
 * Env vars needed:
 *   - CRON_SECRET: for auth
 *   - OPENROUTER_API_KEY: for calling models
 *   - X_API_BEARER_TOKEN or X webhook URL for posting
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

  if (authHeader !== expectedAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENROUTER_API_KEY not set" }, { status: 500 });
  }

  try {
    // 1. Run benchmarks on new models
    const benchmarkResult = await runBenchmarkJob(apiKey);

    // 2. Post results to X
    const unposted = await getUnpostedBenchmarks();
    const postedPosts: string[] = [];

    for (const result of unposted.slice(0, 5)) {
      try {
        const tweet = formatTweet(result);
        const xPostId = await postToX(tweet);
        if (xPostId) {
          await markBenchmarkPosted(result.id, xPostId);
          postedPosts.push(xPostId);
        }
      } catch (err) {
        console.error("[cron/benchmark] Failed to post to X:", err);
      }
    }

    return NextResponse.json({
      success: true,
      benchmarked: benchmarkResult.benchmarked,
      results: benchmarkResult.results,
      totalUnbenchmarked: benchmarkResult.totalUnbenchmarked,
      totalInDb: benchmarkResult.totalInDb,
      postedToX: postedPosts.length,
      xPostIds: postedPosts,
    });
  } catch (error) {
    console.error("[cron/benchmark] Error:", error);
    return NextResponse.json({ error: "Benchmark failed" }, { status: 500 });
  }
}

function formatTweet(result: any): string {
  const score = result.intelligence_score;
  const emoji = score >= 80 ? "🏆" : score >= 60 ? "🧠" : score >= 40 ? "📈" : "⚠️";

  return [
    `${emoji} New AI Model Benchmark`,
    ``,
    `${result.model_name} (${result.provider_name})`,
    `Intelligence Score: ${score}/100`,
    `Reasoning: ${result.reasoning_score ?? "—"} | Coding: ${result.coding_score ?? "—"} | Math: ${result.math_score ?? "—"} | Knowledge: ${result.knowledge_score ?? "—"}`,
    ``,
    `See all model costs at spotlight.xilos.ai`,
    `#AI #LLM #Benchmark`,
  ].join("\n");
}

async function postToX(text: string): Promise<string | null> {
  // Post via X API using xurl CLI or direct API call
  // The X_API_BEARER_TOKEN env var should be set in Vercel
  const xApiToken = process.env.X_API_BEARER_TOKEN;

  if (!xApiToken) {
    console.log("[cron/benchmark] X_API_BEARER_TOKEN not set, skipping X post");
    return null;
  }

  try {
    const res = await fetch("https://api.x.com/2/tweets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${xApiToken}`,
      },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) {
      console.error("[cron/benchmark] X API error:", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    return data.data?.id ?? null;
  } catch (err) {
    console.error("[cron/benchmark] X post failed:", err);
    return null;
  }
}
