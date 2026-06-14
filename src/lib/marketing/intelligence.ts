import { prisma } from "@/lib/prisma";

const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(n).replace(/\s+/g, "");

type SegmentKey = "lapsed" | "atRisk" | "vip" | "new";

const SEGMENT_META: Record<SegmentKey, {
  label: string;
  channel: "EMAIL" | "SMS" | "WHATSAPP" | "RCS";
  conversionRate: number;
  recoveryRate: number;
  confidence: number;
  goal: string;
}> = {
  lapsed: {
    label: "Lapsed win-back",
    channel: "EMAIL",
    conversionRate: 0.09,
    recoveryRate: 0.18,
    confidence: 82,
    goal: "Recover dormant revenue",
  },
  atRisk: {
    label: "Retention save",
    channel: "WHATSAPP",
    conversionRate: 0.12,
    recoveryRate: 0.24,
    confidence: 87,
    goal: "Prevent churn before it happens",
  },
  vip: {
    label: "VIP early access",
    channel: "WHATSAPP",
    conversionRate: 0.16,
    recoveryRate: 0.28,
    confidence: 91,
    goal: "Expand high-value revenue",
  },
  new: {
    label: "Second-purchase nudge",
    channel: "EMAIL",
    conversionRate: 0.11,
    recoveryRate: 0.2,
    confidence: 78,
    goal: "Improve repeat purchase rate",
  },
};

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function rupees(value: number) {
  return Math.round(value);
}

export async function getMarketingIntelligence() {
  const [
    totalCustomers,
    totalRevenue,
    totalOrders,
    lapsed,
    atRisk,
    vip,
    newlyActivated,
    campaigns,
    deliveryEvents,
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.customer.aggregate({ _sum: { totalSpent: true } }),
    prisma.order.count(),
    prisma.customer.findMany({
      where: { lastOrderAt: { lte: daysAgo(90) }, orderCount: { gte: 1 } },
      select: { totalSpent: true, orderCount: true },
    }),
    prisma.customer.findMany({
      where: { lastOrderAt: { lte: daysAgo(45), gte: daysAgo(89) }, orderCount: { gte: 1 } },
      select: { totalSpent: true, orderCount: true },
    }),
    prisma.customer.findMany({
      where: { totalSpent: { gte: 20000 } },
      select: { totalSpent: true, orderCount: true },
    }),
    prisma.customer.findMany({
      where: { lastOrderAt: { gte: daysAgo(30) }, orderCount: { lte: 1 } },
      select: { totalSpent: true, orderCount: true },
    }),
    prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { _count: { select: { recipients: true } }, segment: true },
    }),
    prisma.campaignRecipient.findMany({
      select: { deliveredAt: true, openedAt: true, clickedAt: true, convertedAt: true, failedAt: true },
    }),
  ]);

  const revenue = totalRevenue._sum.totalSpent || 0;
  const avgOrderValue = totalOrders > 0 ? revenue / totalOrders : 2500;
  const delivered = deliveryEvents.filter((event) => event.deliveredAt).length;
  const opened = deliveryEvents.filter((event) => event.openedAt).length;
  const clicked = deliveryEvents.filter((event) => event.clickedAt).length;
  const converted = deliveryEvents.filter((event) => event.convertedAt).length;
  const failed = deliveryEvents.filter((event) => event.failedAt).length;
  const totalSent = deliveryEvents.length;

  const segmentMap = { lapsed, atRisk, vip, new: newlyActivated };
  const revenueAtRisk = rupees(
    lapsed.reduce((sum, customer) => sum + customer.totalSpent * 0.16, 0) +
    atRisk.reduce((sum, customer) => sum + customer.totalSpent * 0.1, 0)
  );

  const revenueOpportunity = rupees(
    vip.length * avgOrderValue * SEGMENT_META.vip.conversionRate +
    newlyActivated.length * avgOrderValue * SEGMENT_META.new.conversionRate +
    lapsed.length * avgOrderValue * SEGMENT_META.lapsed.conversionRate
  );

  const predictedMonthlyRevenue = rupees(revenue / 6 + revenueOpportunity * 0.35);
  const deliveryHealth = totalSent > 0 ? delivered / totalSent : 0.9;
  const engagementHealth = delivered > 0 ? opened / delivered : 0.55;
  const churnPressure = totalCustomers > 0 ? (lapsed.length + atRisk.length) / totalCustomers : 0;
  const businessHealthScore = Math.max(
    42,
    Math.min(96, Math.round(55 + deliveryHealth * 18 + engagementHealth * 18 - churnPressure * 22))
  );

  const recommendedActions = (Object.keys(segmentMap) as SegmentKey[])
    .map((key) => {
      const customers = segmentMap[key];
      const meta = SEGMENT_META[key];
      const reach = customers.length;
      const predictedConversions = Math.round(reach * meta.conversionRate);
      const predictedRevenue = rupees(predictedConversions * avgOrderValue);
      const riskRecovered = key === "lapsed" || key === "atRisk"
        ? rupees(customers.reduce((sum, customer) => sum + customer.totalSpent * meta.recoveryRate, 0))
        : predictedRevenue;

      return {
        id: key,
        title: meta.label,
        goal: meta.goal,
        audience: reach,
        channel: meta.channel,
        confidence: meta.confidence,
        predictedReach: reach,
        predictedOpens: Math.round(reach * (meta.channel === "EMAIL" ? 0.38 : 0.76)),
        predictedClicks: Math.round(reach * (meta.channel === "EMAIL" ? 0.11 : 0.22)),
        predictedConversions,
        predictedRevenue,
        riskRecovered,
        why: key === "lapsed"
          ? `${reach} shoppers have been inactive for 90+ days and represent recoverable dormant revenue.`
          : key === "atRisk"
            ? `${reach} shoppers are approaching churn; intervention now is cheaper than win-back later.`
            : key === "vip"
              ? `${reach} high-value shoppers can monetize exclusive access and premium drops.`
              : `${reach} new shoppers need a second purchase to become retained customers.`,
        tradeoff: key === "vip"
          ? "High revenue upside, but avoid over-messaging your best customers."
          : key === "lapsed"
            ? "Discounting may reduce margin, but recovers customers who are otherwise decaying."
            : "Moderate short-term revenue, strong retention signal.",
        prompt: key === "lapsed"
          ? "Create a win-back campaign for lapsed customers who have not ordered in 90 days"
          : key === "atRisk"
            ? "Create a retention campaign for at-risk customers before they lapse"
            : key === "vip"
              ? "Create a VIP early access campaign for top spending customers"
              : "Create a second-purchase campaign for new customers",
      };
    })
    .filter((action) => action.audience > 0)
    .sort((a, b) => b.predictedRevenue + b.riskRecovered - (a.predictedRevenue + a.riskRecovered));

  return {
    businessHealthScore,
    revenueAtRisk,
    revenueOpportunity,
    predictedMonthlyRevenue,
    avgOrderValue: rupees(avgOrderValue),
    totalCustomers,
    totalSent,
    delivered,
    opened,
    clicked,
    converted,
    failed,
    segments: {
      lapsed: lapsed.length,
      atRisk: atRisk.length,
      vip: vip.length,
      new: newlyActivated.length,
    },
    executiveSummary: `ARIA found ${formatINR(revenueAtRisk)} at risk and ${formatINR(revenueOpportunity)} in near-term opportunity. The best next move is ${recommendedActions[0]?.title || "launching a focused retention play"} with ${recommendedActions[0]?.confidence || 80}% confidence.`,
    recommendedActions,
    recentCampaigns: campaigns.map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      channel: campaign.channel,
      recipients: campaign._count.recipients,
      segment: campaign.segment?.name || "All shoppers",
      aiGenerated: campaign.aiGenerated,
    })),
  };
}

export function planFromGoal(goal: string, intelligence: Awaited<ReturnType<typeof getMarketingIntelligence>>) {
  const normalized = goal.toLowerCase();
  const actions = intelligence.recommendedActions;
  const selected = normalized.includes("churn") || normalized.includes("retain")
    ? actions.filter((action) => action.id === "atRisk" || action.id === "lapsed")
    : normalized.includes("repeat")
      ? actions.filter((action) => action.id === "new" || action.id === "vip")
      : normalized.includes("collection") || normalized.includes("launch")
        ? actions.filter((action) => action.id === "vip" || action.id === "new")
        : actions.slice(0, 3);

  const playbook = selected.length > 0 ? selected : actions.slice(0, 2);
  const predictedRevenue = playbook.reduce((sum, action) => sum + action.predictedRevenue, 0);
  const predictedConversions = playbook.reduce((sum, action) => sum + action.predictedConversions, 0);
  const predictedReach = playbook.reduce((sum, action) => sum + action.predictedReach, 0);
  const confidence = playbook.length > 0
    ? Math.round(playbook.reduce((sum, action) => sum + action.confidence, 0) / playbook.length)
    : 75;

  return {
    goal,
    confidence,
    predictedReach,
    predictedConversions,
    predictedRevenue,
    predictedROI: predictedRevenue > 0 ? "4.8x" : "TBD",
    strategy: `ARIA recommends ${playbook.length} coordinated ${playbook.length === 1 ? "play" : "plays"} based on lifecycle urgency, channel fit, and revenue upside.`,
    reasoning: [
      "Prioritized segments with immediate revenue or churn impact.",
      "Chose channels using expected attention: WhatsApp for urgent/high-value plays, Email for richer win-back context.",
      "Kept human approval before dispatch so the marketer supervises the agent.",
    ],
    workflow: [
      "Analyzing customer lifecycle data",
      "Scoring revenue risk and opportunity",
      "Selecting priority audiences",
      "Choosing channel mix",
      "Generating campaign copy",
      "Estimating revenue impact",
      "Ready for approval",
    ],
    campaigns: playbook,
  };
}
