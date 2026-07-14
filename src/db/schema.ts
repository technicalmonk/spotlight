import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  date,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const modalityEnum = pgEnum("modality", [
  "text",
  "image",
  "audio",
  "video",
  "file",
  "embedding",
]);

export const pricingSourceEnum = pgEnum("pricing_source", [
  "openrouter_api",
  "openai_website",
  "anthropic_website",
  "google_website",
  "groq_website",
  "deepseek_website",
  "manual",
]);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export const providers = pgTable(
  "providers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    websiteUrl: text("website_url"),
    apiBaseUrl: text("api_base_url"),
    logoUrl: text("logo_url"),
    openrouterPrefix: text("openrouter_prefix"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("providers_slug_idx").on(table.slug),
    uniqueIndex("providers_openrouter_prefix_idx").on(table.openrouterPrefix),
  ],
);

// ---------------------------------------------------------------------------
// Model
// ---------------------------------------------------------------------------

export const models = pgTable(
  "models",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => providers.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    openrouterModelId: text("openrouter_model_id"),
    // text[] for flexibility — values from modality enum but stored as plain text array
    modality: text("modality").array().notNull().default(sql`'{}'::text[]`),
    contextWindow: integer("context_window").notNull(),
    maxOutputTokens: integer("max_output_tokens"),
    supportsFunctionCalling: boolean("supports_function_calling").default(false).notNull(),
    supportsStreaming: boolean("supports_streaming").default(true).notNull(),
    supportsBatch: boolean("supports_batch").default(false).notNull(),
    supportsStructuredOutput: boolean("supports_structured_output").default(false).notNull(),
    modelFamily: text("model_family"),
    releaseDate: date("release_date"),
    deprecationDate: date("deprecation_date"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("models_slug_idx").on(table.slug),
    uniqueIndex("models_openrouter_model_id_idx").on(table.openrouterModelId),
    index("models_provider_id_idx").on(table.providerId),
    index("models_context_window_idx").on(table.contextWindow),
    index("models_is_active_idx").on(table.isActive),
    // GIN index for array-contains queries on modality
    sql`CREATE INDEX IF NOT EXISTS models_modality_gin_idx ON "models" USING GIN ("modality")`,
  ],
);

// ---------------------------------------------------------------------------
// PricingTier
// ---------------------------------------------------------------------------

export const pricingTiers = pgTable(
  "pricing_tiers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    modelId: uuid("model_id")
      .notNull()
      .references(() => models.id, { onDelete: "cascade" }),
    effectiveDate: date("effective_date").notNull(),
    inputPricePerMillion: numeric("input_price_per_million", {
      precision: 10,
      scale: 4,
    }).notNull(),
    outputPricePerMillion: numeric("output_price_per_million", {
      precision: 10,
      scale: 4,
    }).notNull(),
    batchInputPricePerMillion: numeric("batch_input_price_per_million", {
      precision: 10,
      scale: 4,
    }),
    batchOutputPricePerMillion: numeric("batch_output_price_per_million", {
      precision: 10,
      scale: 4,
    }),
    cacheReadPricePerMillion: numeric("cache_read_price_per_million", {
      precision: 10,
      scale: 4,
    }),
    cacheWritePricePerMillion: numeric("cache_write_price_per_million", {
      precision: 10,
      scale: 4,
    }),
    imageInputPricePerMillion: numeric("image_input_price_per_million", {
      precision: 10,
      scale: 4,
    }),
    audioInputPricePerMillion: numeric("audio_input_price_per_million", {
      precision: 10,
      scale: 4,
    }),
    webSearchPrice: numeric("web_search_price", {
      precision: 10,
      scale: 4,
    }),
    fineTuningTrainingPrice: numeric("fine_tuning_training_price", {
      precision: 10,
      scale: 4,
    }),
    fineTuningInputPrice: numeric("fine_tuning_input_price", {
      precision: 10,
      scale: 4,
    }),
    fineTuningOutputPrice: numeric("fine_tuning_output_price", {
      precision: 10,
      scale: 4,
    }),
    isCurrent: boolean("is_current").default(true).notNull(),
    source: text("source").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("pricing_tiers_model_id_is_current_idx").on(table.modelId, table.isCurrent),
    index("pricing_tiers_model_id_effective_date_idx").on(table.modelId, table.effectiveDate),
  ],
);

// ---------------------------------------------------------------------------
// PriceChangeLog
// ---------------------------------------------------------------------------

export const priceChangeLogs = pgTable(
  "price_change_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    modelId: uuid("model_id")
      .notNull()
      .references(() => models.id, { onDelete: "cascade" }),
    fieldChanged: text("field_changed").notNull(),
    oldValue: numeric("old_value", { precision: 10, scale: 4 }).notNull(),
    newValue: numeric("new_value", { precision: 10, scale: 4 }).notNull(),
    detectedAt: timestamp("detected_at", { withTimezone: true }).defaultNow().notNull(),
    source: text("source").notNull(),
  },
  (table) => [
    index("price_change_logs_model_id_detected_at_idx").on(
      table.modelId,
      table.detectedAt,
    ),
  ],
);

// ---------------------------------------------------------------------------
// UsageScenario
// ---------------------------------------------------------------------------

export const usageScenarios = pgTable(
  "usage_scenarios",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description").notNull(),
    category: text("category").notNull(),
    defaultInputTokens: integer("default_input_tokens").notNull(),
    defaultOutputTokens: integer("default_output_tokens").notNull(),
    defaultDailyRequests: integer("default_daily_requests").notNull(),
    defaultImagesPerRequest: numeric("default_images_per_request", {
      precision: 4,
      scale: 1,
    }),
    defaultAudioMinutesPerRequest: numeric("default_audio_minutes_per_request", {
      precision: 4,
      scale: 1,
    }),
    isFeatured: boolean("is_featured").default(false).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("usage_scenarios_slug_idx").on(table.slug)],
);

// ---------------------------------------------------------------------------
// Inferred Types (for use throughout the app)
// ---------------------------------------------------------------------------

export type Provider = typeof providers.$inferSelect;
export type Model = typeof models.$inferSelect;
export type PricingTier = typeof pricingTiers.$inferSelect;
export type PriceChangeLog = typeof priceChangeLogs.$inferSelect;
export type UsageScenario = typeof usageScenarios.$inferSelect;

export type NewProvider = typeof providers.$inferInsert;
export type NewModel = typeof models.$inferInsert;
export type NewPricingTier = typeof pricingTiers.$inferInsert;
export type NewPriceChangeLog = typeof priceChangeLogs.$inferInsert;
export type NewUsageScenario = typeof usageScenarios.$inferInsert;
