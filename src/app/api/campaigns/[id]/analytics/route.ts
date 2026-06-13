import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [recipients, recentEvents] = await Promise.all([
    prisma.campaignRecipient.findMany({
      where: { campaignId: id },
      select: { status: true, deliveredAt: true, openedAt: true, clickedAt: true, failedAt: true, convertedAt: true },
    }),
    prisma.deliveryEvent.findMany({
      where: { recipient: { campaignId: id } },
      orderBy: { timestamp: "desc" },
      take: 12,
      select: {
        id: true,
        event: true,
        timestamp: true,
        metadata: true,
        recipient: {
          select: {
            customer: { select: { name: true, city: true } },
          },
        },
      },
    }),
  ]);

  const total = recipients.length;
  const delivered = recipients.filter(r => r.deliveredAt).length;
  const opened = recipients.filter(r => r.openedAt).length;
  const clicked = recipients.filter(r => r.clickedAt).length;
  const converted = recipients.filter(r => r.convertedAt).length;
  const failed = recipients.filter(r => r.failedAt).length;
  const queued = total - delivered - failed;
  const deliveryRate = total > 0 ? Number(((delivered / total) * 100).toFixed(1)) : 0;
  const openRate = delivered > 0 ? Number(((opened / delivered) * 100).toFixed(1)) : 0;
  const clickRate = opened > 0 ? Number(((clicked / opened) * 100).toFixed(1)) : 0;
  const conversionRate = total > 0 ? Number(((converted / total) * 100).toFixed(1)) : 0;

  let insight = "Campaign is still collecting engagement data.";
  let bottleneck = "Waiting for delivery events";
  let nextBestAction = "Refresh after callbacks finish, then compare opens and clicks.";

  if (failed > total * 0.1) {
    insight = "Failure rate is higher than expected. The channel service is rejecting a meaningful share of messages.";
    bottleneck = "Delivery reliability";
    nextBestAction = "Try a cleaner audience or a different channel for this segment.";
  } else if (deliveryRate >= 90 && openRate < 25 && delivered > 0) {
    insight = "Delivery is healthy, but opens are weak. The message reached shoppers but did not earn enough attention.";
    bottleneck = "Subject or opening line";
    nextBestAction = "Create a sharper hook and test a more urgent offer.";
  } else if (openRate >= 50 && clickRate < 10 && opened > 0) {
    insight = "Open rate is strong, but clicks are low. The audience is interested, but the offer or CTA may not be compelling enough.";
    bottleneck = "Offer and CTA";
    nextBestAction = "Improve the call-to-action and make the incentive more specific.";
  } else if (clickRate >= 15 && conversionRate < 3 && clicked > 0) {
    insight = "Clicks are coming through, but conversions are low. The campaign may need stronger landing-page alignment or a better purchase incentive.";
    bottleneck = "Post-click conversion";
    nextBestAction = "Follow up with a narrower offer for customers who clicked but did not buy.";
  } else if (converted > 0) {
    insight = "Campaign is producing conversions. This audience and channel combination is worth reusing or expanding.";
    bottleneck = "Scale carefully";
    nextBestAction = "Create a follow-up campaign for clicked and converted shoppers.";
  }

  return NextResponse.json({
    total, delivered, opened, clicked, converted, failed,
    queued,
    insight,
    bottleneck,
    nextBestAction,
    recentEvents: recentEvents.map((event) => ({
      id: event.id,
      event: event.event,
      timestamp: event.timestamp,
      metadata: event.metadata,
      customerName: event.recipient.customer.name,
      customerCity: event.recipient.customer.city,
    })),
    rates: {
      deliveryRate: deliveryRate.toFixed(1),
      openRate: openRate.toFixed(1),
      clickRate: clickRate.toFixed(1),
      conversionRate: conversionRate.toFixed(1),
    },
  });
}
