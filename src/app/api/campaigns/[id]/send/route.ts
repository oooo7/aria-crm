import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import axios from "axios";

const CHANNEL_SERVICE_URL = process.env.CHANNEL_SERVICE_URL || "http://localhost:3001";

function buildWhere(rules: Record<string, unknown>) {
  const where: Record<string, unknown> = {};
  const now = new Date();
  for (const [key, value] of Object.entries(rules)) {
    if (key === "lastOrderDaysAgo") {
      const v = value as Record<string, number>;
      const dateCondition: Record<string, Date> = {};
      if (v.gte !== undefined) { const d = new Date(now); d.setDate(d.getDate() - v.gte); dateCondition.lte = d; }
      if (v.lte !== undefined) { const d = new Date(now); d.setDate(d.getDate() - v.lte); dateCondition.gte = d; }
      where.lastOrderAt = dateCondition;
    } else if (key === "tags") {
      where.tags = { hasSome: value as string[] };
    } else {
      where[key] = value;
    }
  }
  return where;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({
    where: { id }, include: { segment: true },
  });
  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (campaign.status === "SENT" || campaign.status === "SENDING") {
    return NextResponse.json({ error: "Already sent" }, { status: 400 });
  }

  let customers;
  if (campaign.segmentId && campaign.segment?.filterRules) {
    const where = buildWhere(campaign.segment.filterRules as Record<string, unknown>);
    customers = await prisma.customer.findMany({ where, take: 500 });
  } else {
    customers = await prisma.customer.findMany({ take: 500 });
  }

  if (customers.length === 0) {
    return NextResponse.json({ error: "No customers in audience" }, { status: 400 });
  }

  await prisma.campaign.update({ where: { id }, data: { status: "SENDING", sentAt: new Date() } });

  let sent = 0;
  for (const customer of customers) {
    const personalizedBody = campaign.messageBody.replace(/{{name}}/g, customer.name.split(" ")[0]);
    const recipient = await prisma.campaignRecipient.create({
      data: { campaignId: id, customerId: customer.id, messageBody: personalizedBody, status: "QUEUED" },
    });
    axios.post(`${CHANNEL_SERVICE_URL}/send`, {
      recipientId: recipient.id,
      channel: campaign.channel,
      to: customer.email,
      subject: campaign.subject,
      body: personalizedBody,
      campaignId: id,
    }).catch((err) => console.error(`Send failed:`, err.message));
    sent++;
  }

  await prisma.campaign.update({ where: { id }, data: { status: "SENT" } });
  return NextResponse.json({ ok: true, sent });
}