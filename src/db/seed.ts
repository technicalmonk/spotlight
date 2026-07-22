import { db } from "@/db/client";
import { usageScenarios } from "@/db/schema";
import { eq } from "drizzle-orm";

const scenarios = [
  { name: "24/7 Customer Support Chatbot", slug: "customer-support-chatbot", description: "An always-on chatbot handling customer queries with conversation history, replacing tier-1 support staff.", category: "Customer Support", defaultInputTokens: 500, defaultOutputTokens: 200, defaultDailyRequests: 10000, isFeatured: true, sortOrder: 1 },
  { name: "Technical Support Agent", slug: "technical-support-agent", description: "AI agent that troubleshoots technical issues, reads logs, and suggests fixes. Replaces tier-2 support.", category: "Customer Support", defaultInputTokens: 3000, defaultOutputTokens: 1000, defaultDailyRequests: 5000, isFeatured: false, sortOrder: 2 },
  { name: "Multi-language Support Bot", slug: "multi-language-support", description: "Customer support bot handling queries in 30+ languages with automatic translation and routing.", category: "Customer Support", defaultInputTokens: 800, defaultOutputTokens: 300, defaultDailyRequests: 8000, isFeatured: false, sortOrder: 3 },
  { name: "Code Generation Assistant", slug: "code-generation-assistant", description: "An AI coding assistant generating code from natural language prompts for a team of developers.", category: "Development", defaultInputTokens: 2000, defaultOutputTokens: 1500, defaultDailyRequests: 500, isFeatured: true, sortOrder: 4 },
  { name: "Automated Code Review", slug: "automated-code-review", description: "AI reviews pull requests, suggests improvements, and catches bugs before human review.", category: "Development", defaultInputTokens: 5000, defaultOutputTokens: 800, defaultDailyRequests: 200, isFeatured: false, sortOrder: 5 },
  { name: "API Documentation Generator", slug: "api-doc-generator", description: "Automatically generates and updates API documentation from code changes.", category: "Development", defaultInputTokens: 4000, defaultOutputTokens: 2000, defaultDailyRequests: 100, isFeatured: false, sortOrder: 6 },
  { name: "Bug Triage & Classification", slug: "bug-triage-classification", description: "AI reads incoming bug reports, classifies severity, and routes to the right team.", category: "Development", defaultInputTokens: 1500, defaultOutputTokens: 200, defaultDailyRequests: 1000, isFeatured: false, sortOrder: 7 },
  { name: "Blog Content Generator", slug: "blog-content-generator", description: "Generates SEO-optimized blog posts, social media content, and email newsletters.", category: "Content & Marketing", defaultInputTokens: 1000, defaultOutputTokens: 2000, defaultDailyRequests: 100, isFeatured: false, sortOrder: 8 },
  { name: "Social Media Manager", slug: "social-media-manager", description: "AI creates, schedules, and optimizes social media posts across platforms.", category: "Content & Marketing", defaultInputTokens: 500, defaultOutputTokens: 500, defaultDailyRequests: 300, isFeatured: false, sortOrder: 9 },
  { name: "Product Description Writer", slug: "product-description-writer", description: "Generates product descriptions for e-commerce catalogs at scale.", category: "Content & Marketing", defaultInputTokens: 300, defaultOutputTokens: 400, defaultDailyRequests: 5000, isFeatured: false, sortOrder: 10 },
  { name: "Sales Call Summarization", slug: "sales-call-summarization", description: "Transcribes and summarizes sales calls, extracting action items and sentiment.", category: "Business Intelligence", defaultInputTokens: 8000, defaultOutputTokens: 500, defaultDailyRequests: 200, isFeatured: false, sortOrder: 11 },
  { name: "Market Research Analyst", slug: "market-research-analyst", description: "AI analyzes market data, competitor filings, and news to produce research briefs.", category: "Business Intelligence", defaultInputTokens: 10000, defaultOutputTokens: 3000, defaultDailyRequests: 50, isFeatured: false, sortOrder: 12 },
  { name: "Financial Report Summarizer", slug: "financial-report-summarizer", description: "Summarizes earnings reports, 10-Ks, and financial documents into executive briefs.", category: "Business Intelligence", defaultInputTokens: 15000, defaultOutputTokens: 1000, defaultDailyRequests: 100, isFeatured: false, sortOrder: 13 },
  { name: "Email Triage & Auto-Reply", slug: "email-triage-auto-reply", description: "Classifies incoming emails, drafts responses, and routes to the right department.", category: "Automation", defaultInputTokens: 800, defaultOutputTokens: 300, defaultDailyRequests: 5000, isFeatured: false, sortOrder: 14 },
  { name: "Invoice & Receipt Processing", slug: "invoice-receipt-processing", description: "Extracts data from invoices and receipts using vision + text models for AP automation.", category: "Automation", defaultInputTokens: 2000, defaultOutputTokens: 200, defaultDailyRequests: 2000, isFeatured: false, sortOrder: 15 },
  { name: "HR Resume Screening", slug: "hr-resume-screening", description: "AI screens resumes, scores candidates, and generates interview prep notes.", category: "Automation", defaultInputTokens: 3000, defaultOutputTokens: 500, defaultDailyRequests: 500, isFeatured: false, sortOrder: 16 },
  { name: "Document Summarization Pipeline", slug: "document-summarization", description: "Summarize long documents into concise summaries at scale.", category: "Data & Analysis", defaultInputTokens: 8000, defaultOutputTokens: 500, defaultDailyRequests: 1000, isFeatured: true, sortOrder: 17 },
  { name: "Image Analysis Service", slug: "image-analysis-service", description: "Analyze and describe images using vision-capable LLMs for content moderation and tagging.", category: "Data & Analysis", defaultInputTokens: 1000, defaultOutputTokens: 300, defaultDailyRequests: 2000, isFeatured: false, sortOrder: 18 },
  { name: "Custom AI Solution Development", slug: "custom-ai-solution-dev", description: "Building a custom AI-powered application for a client: agentic workflows, RAG, and multi-step reasoning.", category: "Custom AI Solutions", defaultInputTokens: 5000, defaultOutputTokens: 3000, defaultDailyRequests: 300, isFeatured: true, sortOrder: 19 },
  { name: "SaaS Replacement: Internal Tools", slug: "saas-replacement-internal-tools", description: "Replacing SaaS subscriptions (Zendesk, Grammarly, etc.) with custom AI agents on Xilos.", category: "Custom AI Solutions", defaultInputTokens: 2000, defaultOutputTokens: 1000, defaultDailyRequests: 1000, isFeatured: false, sortOrder: 20 },
];

async function seed() {
  console.log("Seeding usage scenarios...");
  for (const scenario of scenarios) {
    const existing = await db.select().from(usageScenarios).where(eq(usageScenarios.slug, scenario.slug)).limit(1);
    if (existing.length > 0) {
      await db.update(usageScenarios).set(scenario).where(eq(usageScenarios.id, existing[0].id));
      console.log(`  Updated: ${scenario.name}`);
    } else {
      await db.insert(usageScenarios).values(scenario);
      console.log(`  Inserted: ${scenario.name}`);
    }
  }
  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch((err) => { console.error("Seed failed:", err); process.exit(1); });
