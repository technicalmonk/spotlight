import { NextRequest, NextResponse } from "next/server";
import { scrapeOpenAI } from "@/ingestion/providers/openai";
import { scrapeAnthropic } from "@/ingestion/providers/anthropic";
import { scrapeGoogle } from "@/ingestion/providers/google";
import { scrapeGroq } from "@/ingestion/providers/groq";
import { scrapeDeepSeek } from "@/ingestion/providers/deepseek";

export const dynamic = "force-dynamic";

/**
 * Cron endpoint for provider-specific scraping.
 * Runs every 12 hours via Vercel Cron.
 * Supplements OpenRouter data with batch/fine-tuning/modality-specific pricing.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, { scraped: number; error?: string }> = {};

  // Run scrapers in parallel — each returns ScrapedPricing[]
  const scrapers: Array<{ name: string; fn: () => Promise<unknown[]> }> = [
    { name: "openai", fn: scrapeOpenAI },
    { name: "anthropic", fn: scrapeAnthropic },
    { name: "google", fn: scrapeGoogle },
    { name: "groq", fn: scrapeGroq },
    { name: "deepseek", fn: scrapeDeepSeek },
  ];

  await Promise.allSettled(
    scrapers.map(async (scraper) => {
      try {
        const data = await scraper.fn();
        results[scraper.name] = { scraped: data.length };
        // TODO: merge scraped data into database (upsert PricingTier with source = provider-specific)
      } catch (error) {
        results[scraper.name] = {
          scraped: 0,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    })
  );

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    results,
  });
}
