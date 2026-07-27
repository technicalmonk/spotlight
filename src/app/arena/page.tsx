import { ArenaClient } from "./arena-client";
import { db } from "@/db/client";
import { models, providers } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const metadata: Metadata = {
  title: "Model Arena — LLM Battles | Xilos Spotlight",
  description: "Watch two LLMs battle head-to-head on creative and intelligence challenges. Stream responses live, vote for the winner, and see the leaderboard.",
};

async function getArenaModels() {
  try {
    const result = await db
      .select({
        slug: models.slug,
        name: models.name,
        providerName: providers.name,
        openrouterModelId: models.openrouterModelId,
      })
      .from(models)
      .innerJoin(providers, eq(models.providerId, providers.id))
      .where(eq(models.isActive, true))
      .limit(100);

    return result
      .filter((m) => m.openrouterModelId && m.openrouterModelId.trim() !== "")
      .map((m) => ({
        slug: m.slug,
        label: m.name,
        provider: m.providerName,
        openrouterId: m.openrouterModelId!,
      }));
  } catch {
    return [];
  }
}

export default async function ArenaPage() {
  const modelsList = await getArenaModels();

  return <ArenaClient models={modelsList} />;
}
