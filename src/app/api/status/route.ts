import { NextResponse } from "next/server";
import { getIngestionStatus } from "@/db/queries";

export async function GET() {
  try {
    const status = await getIngestionStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error("API /status error:", error);
    return NextResponse.json({ error: "Failed to fetch ingestion status" }, { status: 500 });
  }
}
