import { NextRequest, NextResponse } from "next/server";
import { getComparisonData } from "@/db/queries";

export async function GET(request: NextRequest) {
  try {
    const modelsParam = request.nextUrl.searchParams.get("models");

    if (!modelsParam) {
      return NextResponse.json({ error: "Missing 'models' query parameter" }, { status: 400 });
    }

    const slugs = modelsParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (slugs.length === 0) {
      return NextResponse.json({ models: [] });
    }

    if (slugs.length > 5) {
      return NextResponse.json({ error: "Maximum 5 models can be compared" }, { status: 400 });
    }

    const data = await getComparisonData(slugs);

    return NextResponse.json(data);
  } catch (error) {
    console.error("API /compare error:", error);
    return NextResponse.json({ error: "Failed to fetch comparison data" }, { status: 500 });
  }
}
