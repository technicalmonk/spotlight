import { NextRequest, NextResponse } from "next/server";
import { getAllModels } from "@/db/queries";
import { calculateCost, compareCosts, type ModelCalculationEntry } from "@/lib/calculator";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      modelIds?: string[];
      inputTokens?: number;
      outputTokens?: number;
      requestsPerDay?: number;
      useBatch?: boolean;
    };

    const modelIds = body.modelIds ?? [];
    const inputTokens = body.inputTokens ?? 1000;
    const outputTokens = body.outputTokens ?? 500;
    const requestsPerDay = body.requestsPerDay ?? 1000;
    const useBatch = body.useBatch ?? false;

    if (modelIds.length === 0) {
      return NextResponse.json({ error: "At least one model must be selected" }, { status: 400 });
    }

    // Fetch all models and filter by IDs
    const allModels = await getAllModels();
    const selected = allModels.filter((m) => modelIds.includes(m.model.id));

    const entries: ModelCalculationEntry[] = selected
      .filter((m) => m.currentPricing !== null)
      .map((m) => ({
        modelId: m.model.id,
        modelName: m.model.name,
        providerName: m.provider.name,
        result: calculateCost(
          {
            inputPricePerMillion: m.currentPricing!.inputPricePerMillion,
            outputPricePerMillion: m.currentPricing!.outputPricePerMillion,
            batchInputPricePerMillion: m.currentPricing!.batchInputPricePerMillion,
            batchOutputPricePerMillion: m.currentPricing!.batchOutputPricePerMillion,
            webSearchPrice: m.currentPricing!.webSearchPrice,
          },
          inputTokens,
          outputTokens,
          requestsPerDay,
          { useBatch },
        ),
      }));

    const sorted = compareCosts(entries);

    return NextResponse.json({ calculations: sorted });
  } catch (error) {
    console.error("API /calculate error:", error);
    return NextResponse.json({ error: "Failed to calculate costs" }, { status: 500 });
  }
}
