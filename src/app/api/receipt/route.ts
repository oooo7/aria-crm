import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { recipientId, event, metadata, timestamp } = await req.json();

  if (!recipientId || !event) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const eventTime = timestamp ? new Date(timestamp) : new Date();

  try {
    await prisma.deliveryEvent.create({
      data: { recipientId, event, metadata: metadata ?? {}, timestamp: eventTime },
    });

    const updateData: Record<string, unknown> = { status: event, updatedAt: new Date() };

    switch (event) {
      case "DELIVERED": updateData.deliveredAt = eventTime; break;
      case "OPENED":    updateData.openedAt = eventTime; break;
      case "CLICKED":   updateData.clickedAt = eventTime; break;
      case "CONVERTED": updateData.convertedAt = eventTime; break;
      case "FAILED":
        updateData.failedAt = eventTime;
        updateData.failureReason = (metadata as { reason?: string })?.reason;
        break;
    }

    await prisma.campaignRecipient.update({
      where: { id: recipientId },
      data: updateData,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Receipt error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}