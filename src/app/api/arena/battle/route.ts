import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
export const runtime = "nodejs";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

interface BattleRequest {
  modelAId: string;
  modelBId: string;
  modelAName: string;
  modelBName: string;
  modelAProvider: string;
  modelBProvider: string;
  modelASlug: string;
  modelBSlug: string;
  prompt: string;
  challengeId: string;
  challengeCategory: string;
  challengeTitle: string;
}

/**
 * POST /api/arena/battle
 * Streams responses from two models simultaneously via OpenRouter.
 * Returns SSE with interleaved chunks: { side: "a"|"b", content: "..." }
 * Terminates with: { type: "done", a: "full_response_a", b: "full_response_b" }
 */
export async function POST(req: NextRequest) {
  let body: BattleRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENROUTER_API_KEY not configured" }, { status: 500 });
  }

  if (!body.modelAId || !body.modelBId || !body.prompt) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let responseA = "";
      let responseB = "";
      let doneA = false;
      let doneB = false;

      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Stream model A
      async function streamModel(
        modelId: string,
        side: "a" | "b",
      ): Promise<string> {
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
            send({ side, error: `HTTP ${res.status}` });
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
                // skip malformed chunks
              }
            }
          }

          return fullText;
        } catch (err: any) {
          send({ side, error: err.message || "Stream failed" });
          return "";
        }
      }

      // Run both streams concurrently
      const [resultA, resultB] = await Promise.all([
        streamModel(body.modelAId, "a").then((r) => { responseA = r; doneA = true; return r; }),
        streamModel(body.modelBId, "b").then((r) => { responseB = r; doneB = true; return r; }),
      ]);

      // Send final done event with full responses
      send({
        type: "done",
        a: resultA,
        b: resultB,
      });

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
