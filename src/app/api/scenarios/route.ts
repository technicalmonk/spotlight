import { NextResponse } from "next/server";
import { getScenarios } from "@/db/queries";

export async function GET() {
  try {
    const scenarios = await getScenarios();
    return NextResponse.json({ scenarios });
  } catch (error) {
    console.error("API /scenarios error:", error);
    return NextResponse.json({ error: "Failed to fetch scenarios" }, { status: 500 });
  }
}
