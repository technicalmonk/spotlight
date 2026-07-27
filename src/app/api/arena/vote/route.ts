import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { arenaBattles } from "@/db/schema";

export const dynamic = "force-dynamic";

interface VoteRequest {
  challengeId: string;
  challengeCategory: string;
  challengeTitle: string;
  modelASlug: string;
  modelAName: string;
  modelAProvider: string;
  modelAResponse: string;
  modelBSlug: string;
  modelBName: string;
  modelBProvider: string;
  modelBResponse: string;
  winner: "a" | "b" | "tie";
}

/**
 * POST /api/arena/vote
 * Records a battle result. No auth required — anonymous voting.
 */
export async function POST(req: NextRequest) {
  let body: VoteRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.winner || !body.modelASlug || !body.modelBSlug) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    await db.insert(arenaBattles).values({
      challengeId: body.challengeId,
      challengeCategory: body.challengeCategory,
      challengeTitle: body.challengeTitle,
      modelASlug: body.modelASlug,
      modelAName: body.modelAName,
      modelAProvider: body.modelAProvider,
      modelAResponse: body.modelAResponse,
      modelBSlug: body.modelBSlug,
      modelBName: body.modelBName,
      modelBProvider: body.modelBProvider,
      modelBResponse: body.modelBResponse,
      winner: body.winner,
      voterIp: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[arena/vote] Error:", err);
    return NextResponse.json({ error: "Failed to record vote" }, { status: 500 });
  }
}

/**
 * GET /api/arena/vote
 * Returns the leaderboard — win counts per model.
 */
export async function GET() {
  try {
    const battles = await db.select().from(arenaBattles);

    // Calculate win rates
    const stats = new Map<string, { name: string; provider: string; wins: number; losses: number; ties: number; battles: number }>();

    for (const b of battles) {
      // Model A stats
      if (!stats.has(b.modelASlug)) stats.set(b.modelASlug, { name: b.modelAName, provider: b.modelAProvider, wins: 0, losses: 0, ties: 0, battles: 0 });
      const a = stats.get(b.modelASlug)!;

      // Model B stats
      if (!stats.has(b.modelBSlug)) stats.set(b.modelBSlug, { name: b.modelBName, provider: b.modelBProvider, wins: 0, losses: 0, ties: 0, battles: 0 });
      const bb = stats.get(b.modelBSlug)!;

      a.battles++;
      bb.battles++;

      if (b.winner === "a") {
        a.wins++;
        bb.losses++;
      } else if (b.winner === "b") {
        bb.wins++;
        a.losses++;
      } else {
        a.ties++;
        bb.ties++;
      }
    }

    const leaderboard = Array.from(stats.values())
      .map((s) => ({
        ...s,
        winRate: s.battles > 0 ? Math.round((s.wins / s.battles) * 100) : 0,
      }))
      .sort((a, b) => b.wins - a.wins || b.winRate - a.winRate);

    return NextResponse.json({
      totalBattles: battles.length,
      leaderboard,
    });
  } catch (err: any) {
    console.error("[arena/vote GET] Error:", err);
    return NextResponse.json({ totalBattles: 0, leaderboard: [] });
  }
}
