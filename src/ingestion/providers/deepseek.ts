import { fetchWithRetry, type ScrapedPricing } from "./base";

/**
 * DeepSeek pricing scraper.
 * Source: https://api-docs.deepseek.com/quick_start/pricing
 * DeepSeek has simple pricing that OpenRouter covers well.
 */
export async function scrapeDeepSeek(): Promise<ScrapedPricing[]> {
  try {
    const response = await fetchWithRetry("https://api-docs.deepseek.com/quick_start/pricing", {
      timeout: 15000,
      retries: 2,
    });
    const html = await response.text();
    
    // DeepSeek API docs have pricing in a table.
    // Will be enhanced with proper parsing.
    
    return [];
  } catch (error) {
    console.error("[deepseek-scraper] Failed:", error);
    return [];
  }
}
