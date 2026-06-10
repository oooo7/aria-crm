import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [totalCustomers, totalCampaigns, revenueData, allRecipients, topCities] = await Promise.all([
    prisma.customer.count(),
    prisma.campaign.count(),
    prisma.customer.aggregate({ _sum: { totalSpent: true } }),
    prisma.campaignRecipient.findMany({
      select: { deliveredAt: true, openedAt: true, clickedAt: true, convertedAt: true },
    }),
    prisma.customer.groupBy({
      by: ["city"], _count: { city: true },
      orderBy: { _count: { city: "desc" } }, take: 6,
    }),
  ]);

  const totalSent = allRecipients.length;
  const totalDelivered = allRecipients.filter(r => r.deliveredAt).length;
  const totalOpened = allRecipients.filter(r => r.openedAt).length;
  const totalConverted = allRecipients.filter(r => r.convertedAt).length;

  const recentCampaigns = await prisma.campaign.findMany({
    take: 5, orderBy: { createdAt: "desc" },
    include: { _count: { select: { recipients: true } } },
  });

  return NextResponse.json({
    totalCustomers, totalCampaigns,
    totalRevenue: revenueData._sum.totalSpent ?? 0,
    totalSent, totalDelivered, totalOpened, totalConverted,
    avgOpenRate: totalDelivered > 0 ? ((totalOpened / totalDelivered) * 100).toFixed(1) : "0",
    recentCampaigns,
    topCities: topCities.map(c => ({ city: c.city, count: c._count.city })),
  });
}