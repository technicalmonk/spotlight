import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60; // Allow up to 60s for both models to stream

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const DB_URL = process.env.DATABASE_URL;

/**
 * GET /api/arena/responses?challengeId=X&modelAId=Y&modelBId=Z
 * Returns cached responses if both exist. Used to skip regeneration.
 */
async function getCachedResponse(challengeId: string, modelId: string): Promise<string | null> {
  if (!DB_URL) return null;
  try {
    const sql = neon(DB_URL);
    const rows = await sql`
      SELECT response FROM arena_responses
      WHERE challenge_id = ${challengeId} AND model_identifier = ${modelId}
      LIMIT 1
    `;
    return rows.length > 0 ? rows[0].response : null;
  } catch {
    return null;
  }
}

async function storeResponse(challengeId: string, modelId: string, response: string): Promise<void> {
  if (!DB_URL) return;
  try {
    const sql = neon(DB_URL);
    // Upsert: if a row exists for this challenge+model, update it; otherwise insert
    await sql`
      INSERT INTO arena_responses (challenge_id, model_identifier, response)
      VALUES (${challengeId}, ${modelId}, ${response})
      ON CONFLICT (challenge_id, model_identifier)
      DO UPDATE SET response = EXCLUDED.response, updated_at = now()
    `;
  } catch {
    // best-effort
  }
}

/**
 * POST /api/arena/battle
 * Streams responses from two models simultaneously via OpenRouter.
 * If both models have cached responses for this challenge, returns them immediately (no streaming).
 * Returns SSE with interleaved chunks: { side: "a"|"b", content: "..." }
 * Or for cache hits: { type: "cached", a: "...", b: "..." }
 */
export async function POST(req: NextRequest) {
  let body: {
    modelAId: string;
    modelBId: string;
    prompt: string;
    challengeId: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.modelAId || !body.modelBId || !body.prompt || !body.challengeId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Check cache first
  const [cachedA, cachedB] = await Promise.all([
    getCachedResponse(body.challengeId, body.modelAId),
    getCachedResponse(body.challengeId, body.modelBId),
  ]);

  // Both cached — return immediately
  if (cachedA !== null && cachedB !== null) {
    return NextResponse.json({ type: "cached", a: cachedA, b: cachedB });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENROUTER_API_KEY not configured" }, { status: 500 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let responseA = cachedA || "";
      let responseB = cachedB || "";

      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      async function streamModel(
        modelId: string,
        side: "a" | "b",
        skip: boolean,
      ): Promise<string> {
        if (skip) {
          // Already cached — send it in chunks for the UI to render
          send({ side, cached: true, content: side === "a" ? cachedA : cachedB });
          return side === "a" ? cachedA! : cachedB!;
        }

        try {
          const res = await fetch(OPENROUTER_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
              "HTTP-Referer": "https://spotlight.xilos.ai",
              "X-Title": "Xilos Spotlight Arena",
            },
            body: JSON.stringify({
              model: modelId,
              messages: [{ role: "user", content: body.prompt }],
              max_tokens: 500,
              temperature: 0.7,
              stream: true,
            }),
            signal: AbortSignal.timeout(45000),
          });

          if (!res.ok) {
            const errorText = await res.text().catch(() => "");
            send({ side, error: `HTTP ${res.status}: ${errorText.slice(0, 100)}` });
            return "";
          }

          const reader = res.body!.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          let fullText = "";

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
              if (data === "[DONE]") break;

              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta?.content || "";
                if (delta) {
                  fullText += delta;
                  send({ side, content: delta });
                }
              } catch {
                // skip
              }
            }
          }

          return fullText;
        } catch (err: any) {
          const msg = err.name === "TimeoutError" ? "Model timed out (45s)" : (err.message || "Stream failed");
          send({ side, error: msg });
          return "";
        }
      }

      // Run both streams concurrently (skip ones that are already cached)
      const [resultA, resultB] = await Promise.all([
        streamModel(body.modelAId, "a", cachedA !== null),
        streamModel(body.modelBId, "b", cachedB !== null),
      ]);

      if (resultA) responseA = resultA;
      if (resultB) responseB = resultB;

      // Cache the new responses
      if (cachedA === null && responseA) {
        await storeResponse(body.challengeId, body.modelAId, responseA);
      }
      if (cachedB === null && responseB) {
        await storeResponse(body.challengeId, body.modelBId, responseB);
      }

      send({ type: "done", a: responseA, b: responseB });

      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
