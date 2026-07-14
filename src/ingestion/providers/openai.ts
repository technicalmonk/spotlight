import { fetchWithRetry, type ScrapedPricing } from "./base";

/**
 * OpenAI-specific pricing scraper.
 * OpenRouter doesn't provide: batch pricing, fine-tuning pricing.
 * Source: https://openai.com/api/pricing/
 */
export async function scrapeOpenAI(): Promise<ScrapedPricing[]> {
  try {
    await fetchWithRetry("https://openai.com/api/pricing/", {
      timeout: 15000,
      retries: 2,
    });
    // OpenAI's pricing page is JS-rendered, so static HTML may not have tables.
    // In production, this would use a headless browser (Playwright via Vercel/Puppeteer).
    // For now, return empty — OpenRouter covers OpenAI's base pricing well.
    // This scraper will be enhanced when we add browser-based scraping.
    
    return [];
  } catch (error) {
    console.error("[openai-scraper] Failed:", error);
    return [];
  }
}
