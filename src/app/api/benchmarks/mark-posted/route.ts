import { NextRequest, NextResponse } from "next/server";
import { markBenchmarkPosted } from "@/lib/benchmark-runner";

export const dynamic = "force-dynamic";

/**
 * POST /api/benchmarks/mark-posted
 * Body: { id: string, xPostId: string }
 * Marks a benchmark as posted to X so it won't be posted again.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, xPostId } = body;

    if (!id || !xPostId) {
      return NextResponse.json({ error: "id and xPostId required" }, { status: 400 });
    }

    await markBenchmarkPosted(id, xPostId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/benchmarks/mark-posted] Error:", error);
    return NextResponse.json({ error: "Failed to mark as posted" }, { status: 500 });
  }
}
