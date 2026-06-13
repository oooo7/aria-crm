import { NextResponse } from "next/server";
import { getMarketingIntelligence } from "@/lib/marketing/intelligence";

export async function GET() {
  const intelligence = await getMarketingIntelligence();
  return NextResponse.json(intelligence);
}
