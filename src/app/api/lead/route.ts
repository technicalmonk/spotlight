import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { leadCaptures } from "@/db/schema";
import { z } from "zod";

export const dynamic = "force-dynamic";

const leadSchema = z.object({
  email: z.string().email(),
  industry: z.string(),
  companySize: z.string(),
  useCase: z.string(),
  complexity: z.string(),
  estimatedInputTokens: z.number().optional(),
  estimatedOutputTokens: z.number().optional(),
  estimatedDailyRequests: z.number().optional(),
  estimatedMonthlyCost: z.number().optional(),
  selectedModels: z.string().optional(),
  metadata: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = leadSchema.parse(body);

    const [lead] = await db
      .insert(leadCaptures)
      .values({
        email: validated.email,
        industry: validated.industry,
        companySize: validated.companySize,
        useCase: validated.useCase,
        complexity: validated.complexity,
        estimatedInputTokens: validated.estimatedInputTokens,
        estimatedOutputTokens: validated.estimatedOutputTokens,
        estimatedDailyRequests: validated.estimatedDailyRequests,
        estimatedMonthlyCost: validated.estimatedMonthlyCost?.toString(),
        selectedModels: validated.selectedModels,
        metadata: validated.metadata,
      })
      .returning({ id: leadCaptures.id });

    return NextResponse.json({ success: true, id: lead?.id });
  } catch (error) {
    console.error("[api/lead] Error:", error);
    return NextResponse.json({ error: "Failed to save lead" }, { status: 500 });
  }
}
