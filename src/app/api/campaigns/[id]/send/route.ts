import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import axios from "axios";
import crypto from "crypto";

const CHANNEL_SERVICE_URL = process.env.CHANNEL_SERVICE_URL || "http://localhost:3001";

const CHANNELS: Record<string, {
  deliveryChance: number; openChance: number;
  clickChance: number; convertChance: number;
  deliveryMs: [number, number]; openMs: [number, number]; clickMs: [number, number];
}> = {
  EMAIL:    { deliveryChance: 0.95, openChance: 0.35, clickChance: 0.12, convertChance: 0.04, deliveryMs: [50, 200],  openMs: [300, 800],  clickMs: [800, 1500] },
  SMS:      { deliveryChance: 0.98, openChance: 0.85, clickChance: 0.20, convertChance: 0.06, deliveryMs: [20, 80],   openMs: [100, 400],  clickMs: [400, 1000] },
  WHATSAPP: { deliveryChance: 0.97, openChance: 0.75, clickChance: 0.25, convertChance: 0.08, deliveryMs: [30, 100],  openMs: [200, 600],  clickMs: [600, 1200] },
  RCS:      { deliveryChance: 0.90, openChance: 0.60, clickChance: 0.22, convertChance: 0.07, deliveryMs: [40, 150],  openMs: [200, 700],  clickMs: [700, 1400] },
};

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

async function recordEvent(recipientId: string, event: string, metadata?: any) {
  const eventTime = new Date();
  try {
    const existing = await prisma.deliveryEvent.findFirst({
      where: { recipientId, event },
    });
    if (existing) return;

    await prisma.deliveryEvent.create({
      data: { recipientId, event, metadata: metadata ?? {}, timestamp: eventTime },
    });

    const updateData: Record<string, any> = { status: event, updatedAt: new Date() };
    switch (event) {
      case "DELIVERED": updateData.deliveredAt = eventTime; break;
      case "OPENED":    updateData.openedAt    = eventTime; break;
      case "CLICKED":   updateData.clickedAt   = eventTime; break;
      case "CONVERTED": updateData.convertedAt = eventTime; break;
      case "FAILED":
        updateData.failedAt      = eventTime;
        updateData.failureReason = (metadata as { reason?: string })?.reason;
        break;
    }

    await prisma.campaignRecipient.update({
      where: { id: recipientId },
      data: updateData,
    });
  } catch (err) {
    console.error(`Failed to record event ${event} for ${recipientId}:`, err);
  }
}

async function simulateInApp(recipientId: string, channel: string, campaignId: string) {
  const cfg = CHANNELS[channel] || CHANNELS.EMAIL;
  
  await wait(rand(...cfg.deliveryMs));
  if (Math.random() > cfg.deliveryChance) {
    await recordEvent(recipientId, "FAILED", { reason: "Carrier rejected" });
    return;
  }
  await recordEvent(recipientId, "DELIVERED");
  
  await wait(rand(...cfg.openMs));
  if (Math.random() > cfg.openChance) return;
  await recordEvent(recipientId, "OPENED");
  
  await wait(rand(...cfg.clickMs));
  if (Math.random() > cfg.clickChance) return;
  await recordEvent(recipientId, "CLICKED", { url: `https://lumora.in/shop?utm_campaign=${campaignId}` });
  
  await wait(rand(300, 800));
  if (Math.random() > cfg.convertChance) return;
  await recordEvent(recipientId, "CONVERTED", { orderId: crypto.randomUUID(), orderValue: rand(800, 8000) });
}

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

  // 1. Check if local channel service is reachable
  let useInAppSimulation = false;
  try {
    const healthCheck = await axios.get(`${CHANNEL_SERVICE_URL}/health`, { timeout: 600 });
    if (healthCheck.data?.status !== "ok") {
      useInAppSimulation = true;
    }
  } catch (err) {
    useInAppSimulation = true;
  }

  const recipientsData: Array<{
    id: string;
    campaignId: string;
    customerId: string;
    messageBody: string;
    status: string;
  }> = [];

  const recipientsToSimulate: Array<{
    id: string;
    channel: string;
    campaignId: string;
    email: string | null;
    personalizedBody: string;
  }> = [];

  for (const customer of customers) {
    const personalizedBody = campaign.messageBody.replace(/{{name}}/g, customer.name.split(" ")[0]);
    const recipientId = crypto.randomUUID();

    recipientsData.push({
      id: recipientId,
      campaignId: id,
      customerId: customer.id,
      messageBody: personalizedBody,
      status: "QUEUED",
    });

    recipientsToSimulate.push({
      id: recipientId,
      channel: campaign.channel,
      campaignId: id,
      email: customer.email,
      personalizedBody,
    });
  }

  // Bulk insert all recipients in a single query
  await prisma.campaignRecipient.createMany({
    data: recipientsData,
  });

  // 2. Dispatch sending (either to local channel service or simulate in-app)
  if (useInAppSimulation) {
    after(async () => {
      console.log(`🚀 Channel service offline/unreachable. Running in-app simulation for ${recipientsToSimulate.length} recipients...`);
      await Promise.all(
        recipientsToSimulate.map(r => simulateInApp(r.id, r.channel, r.campaignId))
      );
      console.log(`✓ In-app simulation complete.`);
    });
  } else {
    // Call the external channel service asynchronously
    for (const r of recipientsToSimulate) {
      axios.post(`${CHANNEL_SERVICE_URL}/send`, {
        recipientId: r.id,
        channel: r.channel,
        to: r.email,
        subject: campaign.subject,
        body: r.personalizedBody,
        campaignId: id,
      }).catch((err) => console.error(`Send failed:`, err.message));
    }
  }

  await prisma.campaign.update({ where: { id }, data: { status: "SENT" } });
  return NextResponse.json({ ok: true, sent: customers.length });
}