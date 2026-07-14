import type { CalculationResult, CalculatorOptions } from "@/lib/types";

// ---------------------------------------------------------------------------
// Types (local, for the calculator's input contract)
// ---------------------------------------------------------------------------

export interface ModelPricing {
  inputPricePerMillion: number | string;
  outputPricePerMillion: number | string;
  batchInputPricePerMillion?: number | string | null;
  batchOutputPricePerMillion?: number | string | null;
  webSearchPrice?: number | string | null;
}

// ---------------------------------------------------------------------------
// Core calculation
// ---------------------------------------------------------------------------

/**
 * Calculate the cost of using a model for a given usage pattern.
 *
 * All prices are per 1 million tokens. The function:
 *   - Computes per-request input and output costs
 *   - Sums them into a per-request total
 *   - Projects daily, monthly (30 days), and annual (365 days) costs
 *
 * @param model          - The model's pricing tier (current pricing)
 * @param inputTokens    - Input tokens per request
 * @param outputTokens   - Output tokens per request
 * @param requestsPerDay - Number of requests per day
 * @param options        - Optional: batch mode, images, web searches
 * @returns Detailed cost breakdown
 */
export function calculateCost(
  model: ModelPricing,
  inputTokens: number,
  outputTokens: number,
  requestsPerDay: number,
  options?: CalculatorOptions,
): CalculationResult {
  const useBatch = options?.useBatch ?? false;

  // Parse numeric values (schema stores them as strings via numeric columns)
  const inputPrice = toNumber(model.inputPricePerMillion);
  const outputPrice = toNumber(model.outputPricePerMillion);

  // Determine effective prices (batch vs. standard)
  const effectiveInputPrice =
    useBatch && model.batchInputPricePerMillion != null
      ? toNumber(model.batchInputPricePerMillion)
      : inputPrice;

  const effectiveOutputPrice =
    useBatch && model.batchOutputPricePerMillion != null
      ? toNumber(model.batchOutputPricePerMillion)
      : outputPrice;

  // Per-request costs
  const inputCost = (inputTokens / 1_000_000) * effectiveInputPrice;
  const outputCost = (outputTokens / 1_000_000) * effectiveOutputPrice;

  let perRequestTotal = inputCost + outputCost;

  // Add web search cost if applicable
  if (options?.webSearchesPerRequest && model.webSearchPrice != null) {
    const webSearchCost = toNumber(model.webSearchPrice) * options.webSearchesPerRequest;
    perRequestTotal += webSearchCost;
  }

  // Projections
  const daily = perRequestTotal * requestsPerDay;
  const monthly = daily * 30;
  const annual = daily * 365;

  return {
    perRequest: {
      input: round(inputCost),
      output: round(outputCost),
      total: round(perRequestTotal),
    },
    daily: round(daily),
    monthly: round(monthly),
    annual: round(annual),
    breakdown: {
      inputTokens,
      outputTokens,
      requestsPerDay,
      useBatch,
    },
  };
}

// ---------------------------------------------------------------------------
// Batch discount helpers
// ---------------------------------------------------------------------------

/**
 * Calculate the batch discount percentage (if batch pricing exists).
 *
 * @returns A number between 0 and 100, or null if no batch pricing.
 */
export function calculateBatchDiscount(model: ModelPricing): number | null {
  const inputPrice = toNumber(model.inputPricePerMillion);
  const batchInput = model.batchInputPricePerMillion;

  if (batchInput == null) return null;

  const batchInputNum = toNumber(batchInput);
  if (inputPrice === 0) return null;

  const discount = ((inputPrice - batchInputNum) / inputPrice) * 100;
  return round(discount);
}

// ---------------------------------------------------------------------------
// Comparison helpers
// ---------------------------------------------------------------------------

/**
 * Compare multiple models for a given usage pattern and return sorted results
 * with the cheapest (best value) first.
 */
export interface ModelCalculationEntry {
  modelId: string;
  modelName: string;
  providerName: string;
  result: CalculationResult;
}

export function compareCosts(
  entries: ModelCalculationEntry[],
): ModelCalculationEntry[] {
  return [...entries].sort((a, b) => a.result.monthly - b.result.monthly);
}

// ---------------------------------------------------------------------------
// Formatting helpers (calculator-specific)
// ---------------------------------------------------------------------------

export function formatCost(value: number): string {
  if (value === 0) return "$0.00";
  if (value < 0.01) return `$${value.toFixed(6)}`;
  if (value < 1) return `$${value.toFixed(4)}`;
  if (value < 1000) return `$${value.toFixed(2)}`;
  return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

/**
 * Calculate the percentage change between an old and new value.
 *
 * @returns The percentage change (e.g., 50 for a 50% increase, -25 for a 25% decrease).
 *          Returns 0 if the old value is 0.
 */
export function calculatePercentChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

// ---------------------------------------------------------------------------
// Internal utilities
// ---------------------------------------------------------------------------

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

function round(value: number): number {
  // Round to 6 decimal places for precision in per-request costs
  return Math.round(value * 1_000_000) / 1_000_000;
}
