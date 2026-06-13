import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const search = searchParams.get("search") ?? "";
  const lifecycle = searchParams.get("lifecycle") ?? "all";
  const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const filters = [];

  if (search) {
    filters.push({
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
        { city: { contains: search, mode: "insensitive" as const } },
      ],
    });
  }

  if (lifecycle === "vip") {
    filters.push({ totalSpent: { gte: 20000 } });
  } else if (lifecycle === "lapsed") {
    filters.push({ lastOrderAt: { lte: daysAgo(90) }, orderCount: { gte: 1 } });
  } else if (lifecycle === "at-risk") {
    filters.push({ lastOrderAt: { lte: daysAgo(45), gte: daysAgo(89) }, orderCount: { gte: 1 } });
  } else if (lifecycle === "new") {
    filters.push({ lastOrderAt: { gte: daysAgo(30) }, orderCount: { lte: 1 } });
  }

  const where = filters.length > 0 ? { AND: filters } : {};

  const [customers, total, summary] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { totalSpent: "desc" },
    }),
    prisma.customer.count({ where }),
    Promise.all([
      prisma.customer.count(),
      prisma.customer.count({ where: { totalSpent: { gte: 20000 } } }),
      prisma.customer.count({ where: { lastOrderAt: { lte: daysAgo(90) }, orderCount: { gte: 1 } } }),
      prisma.customer.count({ where: { lastOrderAt: { lte: daysAgo(45), gte: daysAgo(89) }, orderCount: { gte: 1 } } }),
      prisma.customer.count({ where: { lastOrderAt: { gte: daysAgo(30) }, orderCount: { lte: 1 } } }),
    ]),
  ]);

  return NextResponse.json({
    customers,
    total,
    page,
    pages: Math.ceil(total / limit),
    summary: {
      all: summary[0],
      vip: summary[1],
      lapsed: summary[2],
      atRisk: summary[3],
      new: summary[4],
    },
  });
}
