import type { MetadataRoute } from "next";
import { getAllModelSlugs } from "@/db/queries";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://spotlight.ai";

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/models`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${baseUrl}/calculator`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/compare`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/scenarios`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
  ];

  // Dynamic model pages — fetched at runtime, not build time
  try {
    const modelSlugs = await getAllModelSlugs();
    const modelPages: MetadataRoute.Sitemap = modelSlugs.map(({ slug }) => ({
      url: `${baseUrl}/models/${slug}`,
      lastModified: new Date(),
      changeFrequency: "hourly" as const,
      priority: 0.7,
    }));

    return [...staticPages, ...modelPages];
  } catch {
    // If DB is not available, return just static pages
    return staticPages;
  }
}
