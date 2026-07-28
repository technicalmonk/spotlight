"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ARENA_CHALLENGES, type ArenaChallenge } from "@/lib/arena-prompts";
import { benchmarkModels } from "@/lib/benchmarks";
import { Swords, Crown, Trophy, Shuffle, Sparkles, Check, X, Equal, Zap } from "lucide-react";

interface ModelChoice {
  slug: string;
  label: string;
  provider: string;
  openrouterId: string;
}

interface LeaderboardEntry {
  name: string;
  provider: string;
  wins: number;
  losses: number;
  ties: number;
  battles: number;
  winRate: number;
}

type Phase = "setup" | "battling" | "results";

export function ArenaClient({ models }: { models: ModelChoice[] }) {
  const [phase, setPhase] = useState<Phase>("setup");
  const [challenge, setChallenge] = useState<ArenaChallenge>(ARENA_CHALLENGES[0]);
  const [modelA, setModelA] = useState<ModelChoice | null>(null);
  const [modelB, setModelB] = useState<ModelChoice | null>(null);
  const [responseA, setResponseA] = useState("");
  const [responseB, setResponseB] = useState("");
  const [streamingA, setStreamingA] = useState(false);
  const [streamingB, setStreamingB] = useState(false);
  const [winner, setWinner] = useState<"a" | "b" | "tie" | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [totalBattles, setTotalBattles] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Fetch leaderboard on mount
  useEffect(() => {
    fetch("/api/arena/vote")
      .then((r) => r.json())
      .then((data) => {
        setLeaderboard(data.leaderboard || []);
        setTotalBattles(data.totalBattles || 0);
      })
      .catch(() => {});
  }, []);

  function randomizeModels() {
    const shuffled = [...models].sort(() => Math.random() - 0.5);
    setModelA(shuffled[0] || null);
    setModelB(shuffled[1] || null);
  }

  function randomChallenge() {
    const random = ARENA_CHALLENGES[Math.floor(Math.random() * ARENA_CHALLENGES.length)];
    setChallenge(random);
  }

  async function startBattle() {
    if (!modelA || !modelB || modelA.slug === modelB.slug) return;

    setPhase("battling");
    setResponseA("");
    setResponseB("");
    setStreamingA(true);
    setStreamingB(true);
    setWinner(null);
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/arena/battle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelAId: modelA.openrouterId,
          modelBId: modelB.openrouterId,
          modelAName: modelA.label,
          modelBName: modelB.label,
          modelAProvider: modelA.provider,
          modelBProvider: modelB.provider,
          modelASlug: modelA.slug,
          modelBSlug: modelB.slug,
          prompt: challenge.prompt,
          challengeId: challenge.id,
          challengeCategory: challenge.category,
          challengeTitle: challenge.title,
        }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`Battle failed: ${res.status}`);

      // Check if this is a cached response (JSON) or a live stream (SSE)
      const contentType = res.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        // Both responses were cached — display immediately
        const data = await res.json();
        if (data.type === "cached") {
          setResponseA(data.a || "");
          setResponseB(data.b || "");
          setStreamingA(false);
          setStreamingB(false);
          setPhase("results");
          return;
        }
      }

      // Live SSE stream
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;
          const data = trimmed.slice(6);
          if (data === "[DONE]") {
            setPhase("results");
            break;
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed.type === "done") {
              setResponseA(parsed.a || "");
              setResponseB(parsed.b || "");
              setStreamingA(false);
              setStreamingB(false);
              setPhase("results");
            } else if (parsed.side === "a" && parsed.cached) {
              // Cached response for side A — set the full text
              setResponseA(parsed.content || "");
              setStreamingA(false);
            } else if (parsed.side === "b" && parsed.cached) {
              // Cached response for side B — set the full text
              setResponseB(parsed.content || "");
              setStreamingB(false);
            } else if (parsed.side === "a" && parsed.content) {
              setResponseA((prev) => prev + parsed.content);
            } else if (parsed.side === "b" && parsed.content) {
              setResponseB((prev) => prev + parsed.content);
            } else if (parsed.side === "a" && parsed.error) {
              setStreamingA(false);
              setResponseA((prev) => prev || `[Error: ${parsed.error}]`);
            } else if (parsed.side === "b" && parsed.error) {
              setStreamingB(false);
              setResponseB((prev) => prev || `[Error: ${parsed.error}]`);
            }
          } catch {
            // skip
          }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError(err.message || "Battle failed");
        setPhase("setup");
      }
    } finally {
      setStreamingA(false);
      setStreamingB(false);
    }
  }

  async function vote(winner: "a" | "b" | "tie") {
    if (!modelA || !modelB) return;
    setWinner(winner);

    try {
      await fetch("/api/arena/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: challenge.id,
          challengeCategory: challenge.category,
          challengeTitle: challenge.title,
          modelASlug: modelA.slug,
          modelAName: modelA.label,
          modelAProvider: modelA.provider,
          modelAResponse: responseA,
          modelBSlug: modelB.slug,
          modelBName: modelB.label,
          modelBProvider: modelB.provider,
          modelBResponse: responseB,
          winner,
        }),
      });

      // Refresh leaderboard
      const data = await fetch("/api/arena/vote").then((r) => r.json());
      setLeaderboard(data.leaderboard || []);
      setTotalBattles(data.totalBattles || 0);
    } catch {
      // best-effort
    }
  }

  function reset() {
    setPhase("setup");
    setResponseA("");
    setResponseB("");
    setWinner(null);
    setError(null);
  }

  // ── SETUP PHASE ──────────────────────────────────────────────────────
  if (phase === "setup") {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Hero */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 mb-3">
            <Swords className="h-3 w-3" /> ARENA
          </div>
          <h1 className="text-4xl font-bold text-ink-900">Model Arena</h1>
          <p className="mt-2 text-gray-500">
            Pit two LLMs against each other on creative and intelligence challenges.
            Watch responses stream live. Vote for the winner. See who reigns supreme.
          </p>
          {totalBattles > 0 && (
            <p className="mt-2 text-sm text-gray-400">
              <Trophy className="mr-1 inline h-4 w-4" /> {totalBattles} battles fought so far
            </p>
          )}
        </div>

        {/* Challenge selection */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-ink-900">Challenge</h3>
              <Button variant="ghost" size="sm" onClick={randomChallenge}>
                <Shuffle className="h-4 w-4" /> Random
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {ARENA_CHALLENGES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setChallenge(c)}
                  className={`rounded-lg border-2 p-3 text-left transition ${
                    challenge.id === c.id
                      ? "border-brand-500 bg-brand-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="mb-1 text-lg">{c.icon}</div>
                  <p className={`text-xs font-semibold ${challenge.id === c.id ? "text-brand-700" : "text-ink-900"}`}>
                    {c.title}
                  </p>
                  <p className="text-xs text-gray-400">{c.category}</p>
                </button>
              ))}
            </div>
            <div className="mt-4 rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Prompt: </span>
                {challenge.prompt}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Model selection */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Model A */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">A</div>
              <span className="font-semibold text-ink-900">Model A</span>
            </div>
            <select
              value={modelA?.slug || ""}
              onChange={(e) => {
                const m = models.find((m) => m.slug === e.target.value);
                if (m) setModelA(m);
              }}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-ink-900"
            >
              <option value="">Select model...</option>
              {models.map((m) => (
                <option key={m.slug} value={m.slug} disabled={m.slug === modelB?.slug}>
                  {m.label} ({m.provider})
                </option>
              ))}
            </select>
          </div>

          {/* Model B */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-sm font-bold text-white">B</div>
              <span className="font-semibold text-ink-900">Model B</span>
            </div>
            <select
              value={modelB?.slug || ""}
              onChange={(e) => {
                const m = models.find((m) => m.slug === e.target.value);
                if (m) setModelB(m);
              }}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-ink-900"
            >
              <option value="">Select model...</option>
              {models.map((m) => (
                <option key={m.slug} value={m.slug} disabled={m.slug === modelA?.slug}>
                  {m.label} ({m.provider})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* VS */}
        <div className="my-6 flex items-center justify-center gap-4">
          <Button variant="ghost" size="sm" onClick={randomizeModels}>
            <Shuffle className="h-4 w-4" /> Random Matchup
          </Button>
          <span className="text-2xl font-bold text-gray-300">VS</span>
        </div>

        {/* Battle button */}
        <div className="flex justify-center">
          <Button
            variant="accent"
            size="lg"
            onClick={startBattle}
            disabled={!modelA || !modelB || modelA.slug === modelB.slug}
            className="px-8"
          >
            <Swords className="h-5 w-5" /> Start Battle
          </Button>
        </div>

        {error && (
          <p className="mt-4 text-center text-sm text-red-500">{error}</p>
        )}

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <Card className="mt-8">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                <h3 className="font-semibold text-ink-900">Arena Leaderboard</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left">
                      <th className="py-2 px-4 font-semibold text-gray-700">Rank</th>
                      <th className="py-2 px-4 font-semibold text-gray-700">Model</th>
                      <th className="py-2 px-4 font-semibold text-gray-700">Provider</th>
                      <th className="py-2 px-4 font-semibold text-gray-700">W</th>
                      <th className="py-2 px-4 font-semibold text-gray-700">L</th>
                      <th className="py-2 px-4 font-semibold text-gray-700">T</th>
                      <th className="py-2 px-4 font-semibold text-gray-700">Win Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {leaderboard.slice(0, 10).map((entry, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="py-2 px-4">
                          {i === 0 ? (
                            <Crown className="h-4 w-4 text-amber-500" />
                          ) : (
                            <span className="font-mono text-gray-400">{i + 1}</span>
                          )}
                        </td>
                        <td className="py-2 px-4 font-medium text-ink-900">{entry.name}</td>
                        <td className="py-2 px-4 text-gray-500">{entry.provider}</td>
                        <td className="py-2 px-4 font-mono text-green-600">{entry.wins}</td>
                        <td className="py-2 px-4 font-mono text-red-500">{entry.losses}</td>
                        <td className="py-2 px-4 font-mono text-gray-400">{entry.ties}</td>
                        <td className="py-2 px-4">
                          <span className={`rounded-md px-2 py-0.5 font-mono font-medium ${
                            entry.winRate >= 67 ? "bg-green-50 text-green-700" :
                            entry.winRate >= 40 ? "bg-yellow-50 text-yellow-700" :
                            "bg-red-50 text-red-700"
                          }`}>
                            {entry.winRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // ── BATTLING / RESULTS PHASE ──────────────────────────────────────────
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Challenge banner */}
      <div className="mb-6 rounded-xl border border-brand-200 bg-brand-50 p-4 text-center">
        <p className="text-xs font-semibold text-brand-700">{challenge.icon} {challenge.category}</p>
        <p className="mt-1 text-sm text-gray-600">{challenge.prompt}</p>
      </div>

      {/* Battle arena */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Model A */}
        <div className={`rounded-xl border-2 ${winner === "a" ? "border-green-500 shadow-lg" : winner === "b" ? "border-gray-200 opacity-60" : "border-brand-300"}`}>
          <div className="flex items-center justify-between border-b border-gray-100 p-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white">A</div>
              <div>
                <p className="text-sm font-semibold text-ink-900">{modelA?.label}</p>
                <p className="text-xs text-gray-400">{modelA?.provider}</p>
              </div>
            </div>
            {streamingA && (
              <div className="flex items-center gap-1 text-xs text-brand-500">
                <div className="h-2 w-2 animate-pulse rounded-full bg-brand-500" />
                streaming...
              </div>
            )}
            {winner === "a" && <Crown className="h-5 w-5 text-amber-500" />}
          </div>
          <div className="max-h-[500px] overflow-y-auto p-4">
            <p className="whitespace-pre-wrap text-sm text-gray-700">{responseA || (streamingA ? "..." : "")}</p>
          </div>
        </div>

        {/* Model B */}
        <div className={`rounded-xl border-2 ${winner === "b" ? "border-green-500 shadow-lg" : winner === "a" ? "border-gray-200 opacity-60" : "border-amber-300"}`}>
          <div className="flex items-center justify-between border-b border-gray-100 p-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-xs font-bold text-white">B</div>
              <div>
                <p className="text-sm font-semibold text-ink-900">{modelB?.label}</p>
                <p className="text-xs text-gray-400">{modelB?.provider}</p>
              </div>
            </div>
            {streamingB && (
              <div className="flex items-center gap-1 text-xs text-amber-500">
                <div className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                streaming...
              </div>
            )}
            {winner === "b" && <Crown className="h-5 w-5 text-amber-500" />}
          </div>
          <div className="max-h-[500px] overflow-y-auto p-4">
            <p className="whitespace-pre-wrap text-sm text-gray-700">{responseB || (streamingB ? "..." : "")}</p>
          </div>
        </div>
      </div>

      {/* Voting / Results */}
      {phase === "results" && !winner && (
        <div className="mt-6">
          <p className="mb-4 text-center text-sm font-semibold text-ink-900">
            <Sparkles className="mr-1 inline h-4 w-4 text-brand-500" />
            Which response is better?
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => vote("a")} className="border-brand-300 hover:bg-brand-50">
              <Check className="h-4 w-4 text-brand-600" /> A wins
            </Button>
            <Button variant="outline" onClick={() => vote("tie")} className="border-gray-300">
              <Equal className="h-4 w-4" /> Tie
            </Button>
            <Button variant="outline" onClick={() => vote("b")} className="border-amber-300 hover:bg-amber-50">
              <Check className="h-4 w-4 text-amber-600" /> B wins
            </Button>
          </div>
        </div>
      )}

      {winner && (
        <div className="mt-6 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
            <Trophy className="h-4 w-4" />
            {winner === "tie"
              ? "It's a tie!"
              : `${winner === "a" ? modelA?.label : modelB?.label} wins!`}
          </div>
          <div>
            <Button variant="ghost" onClick={reset} className="mr-2">
              <Swords className="h-4 w-4" /> New Battle
            </Button>
            <Button variant="ghost" onClick={() => { randomizeModels(); randomChallenge(); reset(); }}>
              <Shuffle className="h-4 w-4" /> Random Rematch
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-4 text-center text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
