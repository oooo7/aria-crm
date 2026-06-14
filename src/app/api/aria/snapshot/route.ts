import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMarketingIntelligence } from "@/lib/marketing/intelligence";

const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(n).replace(/\s+/g, "");

export async function GET() {
  try {
    const [intel, topCustomers, revenueSum] = await Promise.all([
      getMarketingIntelligence(),
      prisma.customer.findMany({
        take: 5,
        orderBy: { totalSpent: "desc" },
        select: {
          name: true,
          city: true,
          totalSpent: true,
          tags: true,
        }
      }),
      prisma.customer.aggregate({
        _sum: { totalSpent: true }
      })
    ]);

    const avgOpenRate = intel.delivered > 0 ? `${((intel.opened / intel.delivered) * 100).toFixed(1)}%` : "55%";
    const avgConversionRate = intel.delivered > 0 ? `${((intel.converted / intel.delivered) * 100).toFixed(1)}%` : "12%";
    const totalRevenue = revenueSum._sum.totalSpent || 0;

    const snapshot = {
      totalCustomers: intel.totalCustomers,
      vipCount: intel.segments.vip,
      atRiskCount: intel.segments.atRisk,
      lapsedCount: intel.segments.lapsed,
      newCount: intel.segments.new,
      totalCampaigns: intel.totalSent,
      avgOpenRate,
      avgConversionRate,
      totalRevenue: formatINR(Math.round(totalRevenue)),
      revenueAtRisk: formatINR(intel.revenueAtRisk),
      recentCampaigns: intel.recentCampaigns.slice(0, 5).map(c => ({
        name: c.name,
        status: c.status,
        recipients: c.recipients,
        channel: c.channel
      })),
      topCustomers: topCustomers.map(c => ({
        name: c.name,
        city: c.city || "Unknown",
        spent: formatINR(Math.round(c.totalSpent)),
        stage: c.totalSpent >= 20000 ? "VIP" : c.tags.includes("new") ? "New" : "Active"
      }))
    };

    return NextResponse.json(snapshot);
  } catch (error) {
    console.error("Snapshot Error:", error);
    return NextResponse.json({ error: "Failed to load snapshot" }, { status: 500 });
  }
}
