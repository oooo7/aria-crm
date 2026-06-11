import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export async function GET() {
  const [lapsedCount, vipCount, atRiskCount, sentCampaigns, totalCustomers] = await Promise.all([
    prisma.customer.count({
      where: {
        lastOrderAt: { lte: daysAgo(90) },
        orderCount: { gte: 1 },
      },
    }),
    prisma.customer.count({
      where: { totalSpent: { gte: 20000 } },
    }),
    prisma.customer.count({
      where: {
        lastOrderAt: {
          lte: daysAgo(45),
          gte: daysAgo(89),
        },
      },
    }),
    prisma.campaign.count({ where: { status: "SENT" } }),
    prisma.customer.count(),
  ]);

  const insights = [];

  if (lapsedCount > 0) {
    insights.push({
      type: "warning",
      icon: "clock",
      tag: "Lapsing",
      title: `${lapsedCount} customers are lapsing`,
      body: `${lapsedCount} shoppers have not ordered in 90+ days. A timely win-back offer can recover revenue before they fully churn.`,
      action: "Create win-back campaign",
      prompt: "Send a win-back offer to customers who haven't ordered in 90 days",
    });
  }

  if (atRiskCount > 0) {
    insights.push({
      type: "alert",
      icon: "alert",
      tag: "At Risk",
      title: `${atRiskCount} customers are at risk`,
      body: `${atRiskCount} shoppers last ordered 45-89 days ago. Reaching them now is usually cheaper than winning them back later.`,
      action: "Create retention campaign",
      prompt: "Re-engage at-risk customers who haven't ordered in 45-89 days before they lapse",
    });
  }

  if (vipCount > 0) {
    insights.push({
      type: "opportunity",
      icon: "star",
      tag: "Opportunity",
      title: `${vipCount} VIP customers to reward`,
      body: `${vipCount} high-spend shoppers can be targeted with early access, loyalty perks, or private sale messaging.`,
      action: "Create VIP campaign",
      prompt: "Create an exclusive VIP early access campaign for our top spending customers",
    });
  }

  if (sentCampaigns === 0 && totalCustomers > 0) {
    insights.push({
      type: "opportunity",
      icon: "rocket",
      tag: "Get Started",
      title: "Launch your first campaign",
      body: `You have ${totalCustomers} shoppers ready to hear from Lumora. Start with a simple welcome or win-back campaign.`,
      action: "Launch first campaign",
      prompt: "Create a welcome campaign for all Lumora customers",
    });
  }

  return NextResponse.json({ insights });
}
