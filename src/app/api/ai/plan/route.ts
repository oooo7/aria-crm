import { NextRequest, NextResponse } from "next/server";
import { getMarketingIntelligence, planFromGoal } from "@/lib/marketing/intelligence";

export async function POST(req: NextRequest) {
  const { goal } = await req.json();

  if (!goal?.trim()) {
    return NextResponse.json({ error: "Goal required" }, { status: 400 });
  }

  const intelligence = await getMarketingIntelligence();
  const plan = planFromGoal(goal, intelligence);

  return NextResponse.json({ ok: true, plan });
}
