import { NextRequest, NextResponse } from "next/server";
import { runBenchmarkJob, getUnpostedBenchmarks } from "@/lib/benchmark-runner";

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

    // 2. Return unposted results for external posting
    // (X posting is handled by a Hermes cron job that calls xurl locally)
    const unposted = await getUnpostedBenchmarks();

    return NextResponse.json({
      success: true,
      benchmarked: benchmarkResult.benchmarked,
      results: benchmarkResult.results,
      totalUnbenchmarked: benchmarkResult.totalUnbenchmarked,
      totalInDb: benchmarkResult.totalInDb,
      unpostedCount: unposted.length,
      unposted: unposted.slice(0, 10),
    });
  } catch (error) {
    console.error("[cron/benchmark] Error:", error);
    return NextResponse.json({ error: "Benchmark failed" }, { status: 500 });
  }
}
