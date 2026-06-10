import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recipients = await prisma.campaignRecipient.findMany({
    where: { campaignId: id },
    select: { status: true, deliveredAt: true, openedAt: true, clickedAt: true, failedAt: true, convertedAt: true },
  });

  const total = recipients.length;
  const delivered = recipients.filter(r => r.deliveredAt).length;
  const opened = recipients.filter(r => r.openedAt).length;
  const clicked = recipients.filter(r => r.clickedAt).length;
  const converted = recipients.filter(r => r.convertedAt).length;
  const failed = recipients.filter(r => r.failedAt).length;

  return NextResponse.json({
    total, delivered, opened, clicked, converted, failed,
    queued: total - delivered - failed,
    rates: {
      deliveryRate: total > 0 ? ((delivered / total) * 100).toFixed(1) : "0",
      openRate: delivered > 0 ? ((opened / delivered) * 100).toFixed(1) : "0",
      clickRate: opened > 0 ? ((clicked / opened) * 100).toFixed(1) : "0",
      conversionRate: total > 0 ? ((converted / total) * 100).toFixed(1) : "0",
    },
  });
}