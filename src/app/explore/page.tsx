import { ExploreClient } from "./explore-client";
import type { Metadata } from "next";
import { getProviders } from "@/db/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Explore Your Usage — Spotlight",
  description: "Enter your actual AI token usage and see what it would cost across every model. Paste your API billing data and get instant cost comparisons.",
};

export default async function ExplorePage() {
  const providers = await getProviders().catch(() => []);
  return <ExploreClient providers={providers.map(p => p.name)} />;
}
