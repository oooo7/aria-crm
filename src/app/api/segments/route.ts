import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function buildWhere(rules: Record<string, unknown>) {
  const where: Record<string, unknown> = {};
  const now = new Date();

  for (const [key, value] of Object.entries(rules)) {
    if (key === "lastOrderDaysAgo") {
      const rule = value as Record<string, number>;
      const dateCondition: Record<string, Date> = {};

      if (rule.gte !== undefined) {
        const date = new Date(now);
        date.setDate(date.getDate() - rule.gte);
        dateCondition.lte = date;
      }

      if (rule.lte !== undefined) {
        const date = new Date(now);
        date.setDate(date.getDate() - rule.lte);
        dateCondition.gte = date;
      }

      where.lastOrderAt = dateCondition;
    } else if (key === "tags") {
      const tags = Array.isArray(value) ? value : (value as { hasSome?: string[] }).hasSome;
      where.tags = { hasSome: tags || [] };
    } else {
      where[key] = value;
    }
  }

  return where;
}

export async function GET() {
  const segments = await prisma.segment.findMany({
    include: { _count: { select: { campaigns: true } } },
    orderBy: { createdAt: "desc" },
  });

  const enrichedSegments = await Promise.all(
    segments.map(async (segment) => {
      const filterRules = segment.filterRules as Record<string, unknown>;
      const where = buildWhere(filterRules);
      const [audienceCount, sampleCustomers] = await Promise.all([
        prisma.customer.count({ where }),
        prisma.customer.findMany({
          where,
          take: 3,
          orderBy: { totalSpent: "desc" },
          select: { id: true, name: true, city: true, totalSpent: true },
        }),
      ]);

      return { ...segment, audienceCount, sampleCustomers };
    })
  );

  return NextResponse.json(enrichedSegments);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, description, filterRules, aiGenerated, prompt } = body;
  const count = await prisma.customer.count({
    where: buildWhere(filterRules as Record<string, unknown>),
  });
  const segment = await prisma.segment.create({
    data: { name, description, filterRules, aiGenerated: !!aiGenerated, prompt, count },
  });
  return NextResponse.json(segment, { status: 201 });
}
