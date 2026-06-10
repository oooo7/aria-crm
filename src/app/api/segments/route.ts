import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const segments = await prisma.segment.findMany({
    include: { _count: { select: { campaigns: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(segments);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, description, filterRules, aiGenerated, prompt } = body;
  const segment = await prisma.segment.create({
    data: { name, description, filterRules, aiGenerated: !!aiGenerated, prompt },
  });
  return NextResponse.json(segment, { status: 201 });
}