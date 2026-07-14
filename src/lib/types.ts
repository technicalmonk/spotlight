/**
 * Shared TypeScript types used across API responses, calculation results,
 * ingestion pipeline, and UI components.
 */

import type { Model, PricingTier, Provider, UsageScenario, PriceChangeLog } from "@/db/schema";

// Re-export schema types that consuming files import from here
export type { Provider, UsageScenario, PriceChangeLog };

// ---------------------------------------------------------------------------
// API error type
// ---------------------------------------------------------------------------

export interface ApiError {
  error: string;
}

// ---------------------------------------------------------------------------
// Calculation result types
// ---------------------------------------------------------------------------

export interface PerRequestCost {
  input: number;
  output: number;
  total: number;
}

export interface CostBreakdown {
  inputTokens: number;
  outputTokens: number;
  requestsPerDay: number;
  useBatch: boolean;
}

export interface CalculationResult {
  perRequest: PerRequestCost;
  daily: number;
  monthly: number;
  annual: number;
  breakdown: CostBreakdown;
}

export interface CalculatorOptions {
  /** When true, use batch pricing tiers if available. */
  useBatch?: boolean;
  /** Number of images per request (for image modality models). */
  imagesPerRequest?: number;
  /** Number of web search calls per request. */
  webSearchesPerRequest?: number;
}

// ---------------------------------------------------------------------------
// API response types
// ---------------------------------------------------------------------------

export interface ModelWithPricing {
  model: Model;
  provider: Provider;
  currentPricing: PricingTier | null;
}

export interface ModelListResponse {
  models: ModelWithPricing[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ComparisonData {
  models: ModelWithPricing[];
}

export interface PriceHistoryEntry {
  fieldChanged: string;
  oldValue: string;
  newValue: string;
  detectedAt: Date;
  source: string;
}

export interface PriceHistoryResponse {
  modelId: string;
  history: PriceHistoryEntry[];
}

export interface IngestionStatus {
  lastRun: Date | null;
  totalModels: number;
  totalProviders: number;
  activeModels: number;
  recentPriceChanges: number;
}

export interface ScenariosResponse {
  scenarios: UsageScenario[];
}

// ---------------------------------------------------------------------------
// Ingestion types
// ---------------------------------------------------------------------------

export interface IngestionSummary {
  providersAdded: number;
  modelsAdded: number;
  modelsUpdated: number;
  priceChangesDetected: number;
  errors: string[];
  totalProcessed: number;
}

export interface PriceChange {
  modelId: string;
  fieldChanged: string;
  oldValue: number;
  newValue: number;
}

// ---------------------------------------------------------------------------
// Filter / query types
// ---------------------------------------------------------------------------

export interface ModelFilters {
  provider?: string;
  modality?: string;
  minContextWindow?: number;
  maxContextWindow?: number;
  supportsFunctionCalling?: boolean;
  minInputPrice?: number;
  maxInputPrice?: number;
  search?: string;
}

export type SortField =
  | "name"
  | "provider"
  | "inputPrice"
  | "outputPrice"
  | "contextWindow";

export type SortDirection = "asc" | "desc";

export interface ModelQuery {
  filters?: ModelFilters;
  sort?: SortField;
  direction?: SortDirection;
  page?: number;
  pageSize?: number;
}

// ---------------------------------------------------------------------------
// Normalizer types (shared between ingestion modules)
// ---------------------------------------------------------------------------

export interface NormalizedProvider {
  name: string;
  slug: string;
  openrouterPrefix: string;
}

export interface NormalizedPricing {
  inputPricePerMillion: number;
  outputPricePerMillion: number;
  batchInputPricePerMillion: number | null;
  batchOutputPricePerMillion: number | null;
  cacheReadPricePerMillion: number | null;
  cacheWritePricePerMillion: number | null;
  webSearchPrice: number | null;
}

export interface NormalizedModel {
  providerSlug: string;
  name: string;
  slug: string;
  openrouterModelId: string;
  modality: string[];
  contextWindow: number;
  maxOutputTokens: number | null;
  supportsFunctionCalling: boolean;
  supportsStreaming: boolean;
  supportsStructuredOutput: boolean;
  releaseDate: string | null;
  pricing: NormalizedPricing;
}

export interface NormalizedData {
  providers: NormalizedProvider[];
  models: NormalizedModel[];
}
