import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const campaigns = await prisma.campaign.findMany({
    include: {
      segment: true,
      _count: { select: { recipients: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(campaigns);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, segmentId, channel, messageBody, subject, aiGenerated, prompt, description } = body;
  if (!name || !channel || !messageBody) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const campaign = await prisma.campaign.create({
    data: { name, segmentId, channel, messageBody, subject, aiGenerated, prompt, description },
  });
  return NextResponse.json(campaign, { status: 201 });
}