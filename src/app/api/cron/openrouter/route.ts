import { NextRequest, NextResponse } from "next/server";
import { runIngestion } from "@/ingestion/runner";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Cron endpoint for OpenRouter ingestion.
 * Runs every 6 hours via Vercel Cron (see vercel.json).
 *
 * Flow:
 *   1. Verify CRON_SECRET header
 *   2. Run ingestion: fetch → normalize → diff → upsert
 *   3. Return JSON summary
 *
 * Auto-discovers new models and providers from OpenRouter.
 * Detects and logs price changes.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

  if (authHeader !== expectedAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await runIngestion();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary,
    });
  } catch (error) {
    console.error("[cron/openrouter] Fatal error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
