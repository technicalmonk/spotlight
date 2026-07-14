import { fetchWithRetry, type ScrapedPricing } from "./base";

/**
 * Google AI pricing scraper.
 * Source: https://ai.google.dev/pricing
 * OpenRouter covers base pricing for Gemini models.
 */
export async function scrapeGoogle(): Promise<ScrapedPricing[]> {
  try {
    await fetchWithRetry("https://ai.google.dev/pricing", {
      timeout: 15000,
      retries: 2,
    });
    // Google AI Studio pricing page may have static content.
    // Will be enhanced with proper parsing when page structure is verified.
    
    return [];
  } catch (error) {
    console.error("[google-scraper] Failed:", error);
    return [];
  }
}
