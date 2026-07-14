import { fetchWithRetry, type ScrapedPricing } from "./base";

/**
 * Anthropic-specific pricing scraper.
 * OpenRouter doesn't provide: batch pricing (50% discount), committed tier.
 * Source: https://www.anthropic.com/pricing
 */
export async function scrapeAnthropic(): Promise<ScrapedPricing[]> {
  try {
    const response = await fetchWithRetry("https://www.anthropic.com/pricing", {
      timeout: 15000,
      retries: 2,
    });
    const html = await response.text();
    
    // Anthropic's pricing page is JS-rendered.
    // OpenRouter covers base pricing. Batch and committed tier need browser scraping.
    // Return empty for now — will be enhanced with headless browser.
    
    return [];
  } catch (error) {
    console.error("[anthropic-scraper] Failed:", error);
    return [];
  }
}
