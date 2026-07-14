import { z } from "zod";

/**
 * Base utilities for provider-specific pricing scrapers.
 * These supplement OpenRouter data with pricing not available via API:
 * - Batch/async pricing (50% discounts)
 * - Fine-tuning pricing
 * - Modality-specific rates (per-image, per-audio-minute)
 * - Committed/enterprise tier pricing
 */

export interface FetchOptions {
  timeout?: number;
  retries?: number;
  backoffMs?: number;
}

export interface ScrapedPricing {
  modelSlug: string;
  batchInputPricePerMillion?: number;
  batchOutputPricePerMillion?: number;
  fineTuningTrainingPrice?: number;
  fineTuningInputPrice?: number;
  fineTuningOutputPrice?: number;
  imageInputPricePerMillion?: number;
  audioInputPricePerMillion?: number;
  source: string;
}

/**
 * Fetch with timeout and retry.
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit & FetchOptions = {}
): Promise<Response> {
  const { timeout = 15000, retries = 3, backoffMs = 1000, ...fetchInit } = options;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        ...fetchInit,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) return response;
      
      if (response.status === 429 || response.status >= 500) {
        // Rate limited or server error — retry with backoff
        const delay = backoffMs * Math.pow(2, attempt);
        await sleep(delay);
        continue;
      }
      
      // Client error — don't retry
      throw new Error(`HTTP ${response.status}: ${response.statusText} for ${url}`);
    } catch (err) {
      if (attempt === retries - 1) throw err;
      const delay = backoffMs * Math.pow(2, attempt);
      await sleep(delay);
    }
  }
  
  throw new Error(`Failed after ${retries} retries: ${url}`);
}

/**
 * Simple rate limiter — ensures we don't exceed maxRequests per windowMs.
 */
export class RateLimiter {
  private timestamps: number[] = [];
  
  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}
  
  async waitForSlot(): Promise<void> {
    const now = Date.now();
    this.timestamps = this.timestamps.filter(t => now - t < this.windowMs);
    
    if (this.timestamps.length >= this.maxRequests) {
      const oldest = this.timestamps[0];
      const waitTime = this.windowMs - (now - oldest) + 1;
      await sleep(waitTime);
      this.timestamps = [];
    }
    
    this.timestamps.push(Date.now());
  }
}

/**
 * Parse a price string like "$0.150" or "0.150" or "$0.150/1M" to a number.
 */
export function parsePrice(value: string): number | null {
  if (!value) return null;
  const cleaned = value.replace(/[$,\s/].*$/, "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Extract pricing table rows from HTML.
 * Returns array of objects with cell text, keyed by header.
 */
export function extractTableRows(html: string, tableSelector?: string): Record<string, string>[] {
  // Basic HTML table parser — no external deps
  const rows: Record<string, string>[] = [];
  
  // Find table in HTML
  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellRegex = /<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi;
  
  let tableMatch;
  while ((tableMatch = tableRegex.exec(html)) !== null) {
    const tableContent = tableMatch[1];
    let headers: string[] = [];
    let isFirstRow = true;
    
    let rowMatch;
    while ((rowMatch = rowRegex.exec(tableContent)) !== null) {
      const cells: string[] = [];
      let cellMatch;
      while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
        // Strip HTML tags and decode entities
        const text = cellMatch[1]
          .replace(/<[^>]+>/g, "")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&nbsp;/g, " ")
          .trim();
        cells.push(text);
      }
      
      if (cells.length === 0) continue;
      
      if (isFirstRow) {
        headers = cells;
        isFirstRow = false;
      } else {
        const row: Record<string, string> = {};
        cells.forEach((cell, i) => {
          if (headers[i]) row[headers[i]] = cell;
        });
        rows.push(row);
      }
    }
  }
  
  return rows;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
