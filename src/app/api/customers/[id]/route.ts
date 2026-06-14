import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(n).replace(/\s+/g, "");

function daysBetween(date: Date | null) {
  if (!date) return null;
  return Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000));
}

function lifecycle(customer: { totalSpent: number; orderCount: number; lastOrderAt: Date | null }) {
  const days = daysBetween(customer.lastOrderAt);

  if (customer.totalSpent >= 20000) return "VIP";
  if (days !== null && days >= 90) return "Lapsed";
  if (days !== null && days >= 45) return "At Risk";
  if (customer.orderCount <= 1) return "New";
  return "Active";
}

function preferredChannel(stage: string, totalSpent: number) {
  if (stage === "VIP" || totalSpent >= 20000) return "WHATSAPP";
  if (stage === "At Risk") return "WHATSAPP";
  if (stage === "Lapsed") return "EMAIL";
  return "EMAIL";
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      orders: { orderBy: { createdAt: "desc" }, take: 8 },
      campaignRecipients: {
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { campaign: { select: { name: true, channel: true } } },
      },
    },
  });

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const stage = lifecycle(customer);
  const days = daysBetween(customer.lastOrderAt);
  const avgOrderValue = customer.orderCount > 0 ? customer.totalSpent / customer.orderCount : 0;
  const churnRisk = stage === "Lapsed" ? 88 : stage === "At Risk" ? 68 : stage === "New" ? 34 : stage === "VIP" ? 24 : 28;
  const nextPurchaseDays = stage === "VIP" ? 12 : stage === "Active" ? 21 : stage === "New" ? 18 : stage === "At Risk" ? 42 : 75;
  const channel = preferredChannel(stage, customer.totalSpent);

  const recommendedAction = stage === "VIP"
    ? "Send VIP early access with limited inventory and concierge tone."
    : stage === "Lapsed"
      ? "Send a win-back offer with a clear incentive and expiry."
      : stage === "At Risk"
        ? "Send a retention nudge before the shopper fully lapses."
        : stage === "New"
          ? "Drive second purchase with a personalized welcome offer."
          : "Keep warm with new arrivals and light personalization.";

  const aiSummary = `${customer.name} is a ${stage.toLowerCase()} shopper from ${customer.city || "an unknown city"} with ${formatINR(Math.round(customer.totalSpent))} lifetime value across ${customer.orderCount} orders. ${days === null ? "ARIA has no recent order timestamp." : `Last order was ${days} days ago.`} Preferred channel is ${channel}.`;

  return NextResponse.json({
    customer,
    intelligence: {
      lifecycleStage: stage,
      churnRisk,
      predictedNextPurchaseDays: nextPurchaseDays,
      preferredChannel: channel,
      avgOrderValue: Math.round(avgOrderValue),
      aiSummary,
      recommendedAction,
      confidence: stage === "VIP" ? 91 : stage === "Lapsed" ? 84 : stage === "At Risk" ? 82 : 76,
    },
  });
}
