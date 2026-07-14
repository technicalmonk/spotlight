import type { PricingTier } from "@/db/schema";
import type { PriceChange } from "@/lib/types";
import type { NormalizedPricing } from "@/lib/types";

// ---------------------------------------------------------------------------
// Fields to compare between current pricing and new pricing
// ---------------------------------------------------------------------------

interface PricingFieldDef {
  dbField: keyof PricingTier;
  label: string;
  getNewValue: (pricing: NormalizedPricing) => number | null;
}

const PRICING_FIELDS: PricingFieldDef[] = [
  {
    dbField: "inputPricePerMillion",
    label: "input_price_per_million",
    getNewValue: (p) => p.inputPricePerMillion,
  },
  {
    dbField: "outputPricePerMillion",
    label: "output_price_per_million",
    getNewValue: (p) => p.outputPricePerMillion,
  },
  {
    dbField: "batchInputPricePerMillion",
    label: "batch_input_price_per_million",
    getNewValue: (p) => p.batchInputPricePerMillion,
  },
  {
    dbField: "batchOutputPricePerMillion",
    label: "batch_output_price_per_million",
    getNewValue: (p) => p.batchOutputPricePerMillion,
  },
  {
    dbField: "cacheReadPricePerMillion",
    label: "cache_read_price_per_million",
    getNewValue: (p) => p.cacheReadPricePerMillion,
  },
  {
    dbField: "cacheWritePricePerMillion",
    label: "cache_write_price_per_million",
    getNewValue: (p) => p.cacheWritePricePerMillion,
  },
  {
    dbField: "webSearchPrice",
    label: "web_search_price",
    getNewValue: (p) => p.webSearchPrice,
  },
];

// ---------------------------------------------------------------------------
// Diff detection
// ---------------------------------------------------------------------------

/**
 * Compare the current pricing tier in the database against new normalized
 * pricing data from the ingestion pipeline.
 *
 * @param modelId       - The UUID of the model (for logging).
 * @param currentTier   - The current pricing tier from the DB (or null if new).
 * @param newPricing    - The freshly normalized pricing from OpenRouter.
 * @returns Array of detected price changes, empty if no changes.
 */
export function detectPriceChanges(
  modelId: string,
  currentTier: PricingTier | null | undefined,
  newPricing: NormalizedPricing,
): PriceChange[] {
  const changes: PriceChange[] = [];

  // If there's no current tier, this is a new model — no "changes" to log.
  if (!currentTier) {
    return changes;
  }

  for (const field of PRICING_FIELDS) {
    const oldValue = toNumber(currentTier[field.dbField]);
    const newValue = field.getNewValue(newPricing);

    // Skip if both are null/zero (no pricing data on either side)
    if (oldValue === 0 && (newValue === null || newValue === 0)) {
      continue;
    }

    // If old was 0/null and new is non-null non-zero, that's a change
    if (oldValue === 0 && newValue !== null && newValue !== 0) {
      changes.push({
        modelId,
        fieldChanged: field.label,
        oldValue: 0,
        newValue: round(newValue),
      });
      continue;
    }

    // If old was non-zero and new is null/0, that's a change (price removed)
    if (oldValue !== 0 && (newValue === null || newValue === 0)) {
      changes.push({
        modelId,
        fieldChanged: field.label,
        oldValue: round(oldValue),
        newValue: 0,
      });
      continue;
    }

    // Both non-null — compare with a small tolerance for floating point
    if (newValue !== null && Math.abs(oldValue - newValue) > 0.0001) {
      changes.push({
        modelId,
        fieldChanged: field.label,
        oldValue: round(oldValue),
        newValue: round(newValue),
      });
    }
  }

  return changes;
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function round(value: number): number {
  return Math.round(value * 10000) / 10000;
}
