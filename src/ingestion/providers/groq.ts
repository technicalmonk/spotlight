import { fetchWithRetry, type ScrapedPricing } from "./base";

/**
 * Groq pricing scraper.
 * Source: https://groq.com/pricing/
 * Groq has some models not on OpenRouter and different throughput tiers.
 */
export async function scrapeGroq(): Promise<ScrapedPricing[]> {
  try {
    await fetchWithRetry("https://groq.com/pricing/", {
      timeout: 15000,
      retries: 2,
    });
    // Groq pricing page structure needs to be verified.
    // Return empty for now.
    
    return [];
  } catch (error) {
    console.error("[groq-scraper] Failed:", error);
    return [];
  }
}
