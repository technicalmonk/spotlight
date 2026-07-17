import { NextRequest, NextResponse } from "next/server";
import { getFilteredModels } from "@/db/queries";
import type { ModelFilters, SortField } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const provider = searchParams.get("provider") ?? undefined;
  const modality = searchParams.get("modality") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const sortParam = searchParams.get("sort") ?? "name-asc";
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);
  const minContext = searchParams.get("minContext") ? parseInt(searchParams.get("minContext")!, 10) : undefined;
  const maxContext = searchParams.get("maxContext") ? parseInt(searchParams.get("maxContext")!, 10) : undefined;
  const supportsFnCall = searchParams.get("functionCalling") === "true" ? true : undefined;

  // Parse combined sort string (e.g. "input-asc" -> field="inputPrice", direction="asc")
  // This matches the format used by the model-filters dropdown
  const parts = sortParam.split("-");
  const fieldMap: Record<string, SortField> = {
    name: "name",
    input: "inputPrice",
    output: "outputPrice",
    context: "contextWindow",
    provider: "provider",
  };
  const sort: SortField = fieldMap[parts[0]] ?? "name";
  const direction: "asc" | "desc" = parts[1] === "desc" ? "desc" : "asc";

  const filters: ModelFilters = {
    provider,
    modality,
    search,
    minContextWindow: minContext,
    maxContextWindow: maxContext,
    supportsFunctionCalling: supportsFnCall,
  };

  try {
    const modelsData = await getFilteredModels(filters, sort, direction);
    const total = modelsData.length;
    const start = (page - 1) * limit;
    const paginated = modelsData.slice(start, start + limit);

    return NextResponse.json({
      models: paginated,
      total,
      page,
      pageSize: limit,
    });
  } catch (error) {
    console.error("[api/models] Error:", error);
    return NextResponse.json({ error: "Failed to fetch models" }, { status: 500 });
  }
}

