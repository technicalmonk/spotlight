import { db } from "@/db/client";
import { usageScenarios } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Seed the UsageScenario table with pre-built scenarios.
 * Run with: npm run db:seed
 */
const scenarios = [
  {
    name: "Customer Support Chatbot",
    slug: "customer-support-chatbot",
    description: "A customer support chatbot handling user queries with conversation history.",
    category: "chatbot",
    defaultInputTokens: 500,
    defaultOutputTokens: 200,
    defaultDailyRequests: 10000,
    isFeatured: true,
    sortOrder: 1,
  },
  {
    name: "Code Generation Assistant",
    slug: "code-generation-assistant",
    description: "An AI coding assistant generating code from natural language prompts.",
    category: "code-gen",
    defaultInputTokens: 2000,
    defaultOutputTokens: 1500,
    defaultDailyRequests: 500,
    isFeatured: true,
    sortOrder: 2,
  },
  {
    name: "Document Summarization Pipeline",
    slug: "document-summarization",
    description: "Summarize long documents into concise summaries at scale.",
    category: "summarization",
    defaultInputTokens: 8000,
    defaultOutputTokens: 500,
    defaultDailyRequests: 1000,
    isFeatured: true,
    sortOrder: 3,
  },
  {
    name: "Image Analysis Service",
    slug: "image-analysis-service",
    description: "Analyze and describe images using vision-capable LLMs.",
    category: "image-analysis",
    defaultInputTokens: 1000,
    defaultOutputTokens: 300,
    defaultDailyRequests: 2000,
    defaultImagesPerRequest: "1.0",
    isFeatured: true,
    sortOrder: 4,
  },
  {
    name: "Content Moderation System",
    slug: "content-moderation",
    description: "Classify and moderate user-generated content at high volume.",
    category: "content-moderation",
    defaultInputTokens: 500,
    defaultOutputTokens: 50,
    defaultDailyRequests: 50000,
    isFeatured: false,
    sortOrder: 5,
  },
];

async function seed() {
  console.log("Seeding usage scenarios...");

  for (const scenario of scenarios) {
    const existing = await db
      .select()
      .from(usageScenarios)
      .where(eq(usageScenarios.slug, scenario.slug))
      .limit(1);

    if (existing.length > 0) {
      // Update
      await db
        .update(usageScenarios)
        .set(scenario)
        .where(eq(usageScenarios.id, existing[0].id));
      console.log(`  Updated: ${scenario.name}`);
    } else {
      // Insert
      await db.insert(usageScenarios).values(scenario);
      console.log(`  Inserted: ${scenario.name}`);
    }
  }

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
