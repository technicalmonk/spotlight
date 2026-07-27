CREATE TYPE "public"."modality" AS ENUM('text', 'image', 'audio', 'video', 'file', 'embedding');--> statement-breakpoint
CREATE TYPE "public"."pricing_source" AS ENUM('openrouter_api', 'openai_website', 'anthropic_website', 'google_website', 'groq_website', 'deepseek_website', 'manual');--> statement-breakpoint
CREATE TABLE "arena_battles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"challenge_id" text NOT NULL,
	"challenge_category" text NOT NULL,
	"challenge_title" text NOT NULL,
	"model_a_slug" text NOT NULL,
	"model_a_name" text NOT NULL,
	"model_a_provider" text NOT NULL,
	"model_a_response" text NOT NULL,
	"model_b_slug" text NOT NULL,
	"model_b_name" text NOT NULL,
	"model_b_provider" text NOT NULL,
	"model_b_response" text NOT NULL,
	"winner" text NOT NULL,
	"voter_ip" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_captures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"industry" text NOT NULL,
	"company_size" text NOT NULL,
	"use_case" text NOT NULL,
	"complexity" text NOT NULL,
	"estimated_input_tokens" integer,
	"estimated_output_tokens" integer,
	"estimated_daily_requests" integer,
	"estimated_monthly_cost" numeric(10, 4),
	"selected_models" text,
	"metadata" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "model_benchmarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_id" uuid NOT NULL,
	"model_slug" text NOT NULL,
	"model_name" text NOT NULL,
	"provider_name" text NOT NULL,
	"intelligence_score" numeric(5, 1) NOT NULL,
	"reasoning_score" integer,
	"coding_score" integer,
	"math_score" integer,
	"knowledge_score" integer,
	"tier2_score" integer,
	"test_version" text DEFAULT 'v1' NOT NULL,
	"openrouter_model_id" text,
	"benchmarked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"posted_to_x" boolean DEFAULT false NOT NULL,
	"x_post_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"openrouter_model_id" text,
	"modality" text[] DEFAULT '{}'::text[] NOT NULL,
	"context_window" integer NOT NULL,
	"max_output_tokens" integer,
	"supports_function_calling" boolean DEFAULT false NOT NULL,
	"supports_streaming" boolean DEFAULT true NOT NULL,
	"supports_batch" boolean DEFAULT false NOT NULL,
	"supports_structured_output" boolean DEFAULT false NOT NULL,
	"model_family" text,
	"release_date" date,
	"deprecation_date" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_change_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_id" uuid NOT NULL,
	"field_changed" text NOT NULL,
	"old_value" numeric(10, 4) NOT NULL,
	"new_value" numeric(10, 4) NOT NULL,
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pricing_tiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_id" uuid NOT NULL,
	"effective_date" date NOT NULL,
	"input_price_per_million" numeric(10, 4) NOT NULL,
	"output_price_per_million" numeric(10, 4) NOT NULL,
	"batch_input_price_per_million" numeric(10, 4),
	"batch_output_price_per_million" numeric(10, 4),
	"cache_read_price_per_million" numeric(10, 4),
	"cache_write_price_per_million" numeric(10, 4),
	"image_input_price_per_million" numeric(10, 4),
	"audio_input_price_per_million" numeric(10, 4),
	"web_search_price" numeric(10, 4),
	"fine_tuning_training_price" numeric(10, 4),
	"fine_tuning_input_price" numeric(10, 4),
	"fine_tuning_output_price" numeric(10, 4),
	"is_current" boolean DEFAULT true NOT NULL,
	"source" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"website_url" text,
	"api_base_url" text,
	"logo_url" text,
	"openrouter_prefix" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage_scenarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"default_input_tokens" integer NOT NULL,
	"default_output_tokens" integer NOT NULL,
	"default_daily_requests" integer NOT NULL,
	"default_images_per_request" numeric(4, 1),
	"default_audio_minutes_per_request" numeric(4, 1),
	"is_featured" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "model_benchmarks" ADD CONSTRAINT "model_benchmarks_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "models" ADD CONSTRAINT "models_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_change_logs" ADD CONSTRAINT "price_change_logs_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_tiers" ADD CONSTRAINT "pricing_tiers_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "arena_battles_created_idx" ON "arena_battles" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "arena_battles_winner_idx" ON "arena_battles" USING btree ("winner");--> statement-breakpoint
CREATE INDEX "arena_battles_model_a_idx" ON "arena_battles" USING btree ("model_a_slug");--> statement-breakpoint
CREATE INDEX "arena_battles_model_b_idx" ON "arena_battles" USING btree ("model_b_slug");--> statement-breakpoint
CREATE INDEX "lead_captures_email_idx" ON "lead_captures" USING btree ("email");--> statement-breakpoint
CREATE INDEX "lead_captures_industry_idx" ON "lead_captures" USING btree ("industry");--> statement-breakpoint
CREATE INDEX "lead_captures_created_at_idx" ON "lead_captures" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "model_benchmarks_model_slug_idx" ON "model_benchmarks" USING btree ("model_slug");--> statement-breakpoint
CREATE INDEX "model_benchmarks_score_idx" ON "model_benchmarks" USING btree ("intelligence_score");--> statement-breakpoint
CREATE INDEX "model_benchmarks_posted_idx" ON "model_benchmarks" USING btree ("posted_to_x");--> statement-breakpoint
CREATE UNIQUE INDEX "models_slug_idx" ON "models" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "models_openrouter_model_id_idx" ON "models" USING btree ("openrouter_model_id");--> statement-breakpoint
CREATE INDEX "models_provider_id_idx" ON "models" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "models_context_window_idx" ON "models" USING btree ("context_window");--> statement-breakpoint
CREATE INDEX "models_is_active_idx" ON "models" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "price_change_logs_model_id_detected_at_idx" ON "price_change_logs" USING btree ("model_id","detected_at");--> statement-breakpoint
CREATE INDEX "pricing_tiers_model_id_is_current_idx" ON "pricing_tiers" USING btree ("model_id","is_current");--> statement-breakpoint
CREATE INDEX "pricing_tiers_model_id_effective_date_idx" ON "pricing_tiers" USING btree ("model_id","effective_date");--> statement-breakpoint
CREATE UNIQUE INDEX "providers_slug_idx" ON "providers" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "providers_openrouter_prefix_idx" ON "providers" USING btree ("openrouter_prefix");--> statement-breakpoint
CREATE UNIQUE INDEX "usage_scenarios_slug_idx" ON "usage_scenarios" USING btree ("slug");