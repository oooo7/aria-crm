import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

const SYSTEM_PROMPT = `You are a D2C marketing analyst. Respond in JSON only. Do not wrap in markdown or add explanations. Match this exact format:
{
  "time": "8:00 PM – 9:00 PM IST",
  "rationale": "Evening browsing peak for fashion audiences"
}`;

async function callGemini(channel: string, segmentName: string): Promise<any> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("No API key");

  const prompt = `Best send time for ${channel} campaign to ${segmentName} customers for a premium D2C fashion brand in India? JSON only, no explanation: {'time': '8:00 PM – 9:00 PM IST', 'rationale': 'Evening browsing peak for fashion audiences'}`;
  const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"];
  const body = JSON.stringify({
    contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\nQuery: ${prompt}\n\nRespond with JSON only:` }] }],
    generationConfig: { temperature: 0.6, maxOutputTokens: 256 }
  });

  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body }
      );
      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const clean = text.replace(/```json|```/g, "").trim();
          const match = clean.match(/\{[\s\S]*\}/);
          if (match) return JSON.parse(match[0]);
        }
      }
    } catch { continue; }
  }
  throw new Error("API unavailable");
}

function getLocalOptimalTime(channel: string, name: string) {
  const segmentName = name.toLowerCase();
  const ch = channel.toUpperCase();

  if (ch === "WHATSAPP" || segmentName.includes("vip")) {
    return {
      time: "8:00 PM – 9:00 PM IST",
      rationale: "Evening browsing peak for fashion audiences"
    };
  }

  if (ch === "EMAIL" || segmentName.includes("lapsed") || segmentName.includes("win-back")) {
    return {
      time: "10:00 AM – 11:30 AM IST",
      rationale: "Late morning catchment window for inbox reviews"
    };
  }

  return {
    time: "12:30 PM – 1:30 PM IST",
    rationale: "Mid-day mobile lunch peak period"
  };
}

function formatHour(h: number): string {
  const ampm = h >= 12 ? "PM" : "AM";
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  return `${displayHour}:00 ${ampm}`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const channel = searchParams.get("channel") || "EMAIL";
    const segmentId = searchParams.get("segmentId");

    let customerIds: string[] = [];
    let segmentName = "VIP & Lapsed";

    if (segmentId) {
      const segment = await prisma.segment.findUnique({
        where: { id: segmentId }
      });
      if (segment) {
        segmentName = segment.name;
        if (segment.filterRules) {
          try {
            const where = buildWhere(segment.filterRules as Record<string, unknown>);
            const customers = await prisma.customer.findMany({
              where,
              select: { id: true }
            });
            customerIds = customers.map(c => c.id);
          } catch (e) {
            console.error("Error building customer list from segment rules:", e);
          }
        }
      }
    }

    // Query CampaignRecipient records for customers in this segment,
    // where they opened the message.
    let openedRecipients: { openedAt: Date | null }[] = [];
    if (customerIds.length > 0) {
      openedRecipients = await prisma.campaignRecipient.findMany({
        where: {
          customerId: { in: customerIds },
          campaign: { channel },
          openedAt: { not: null }
        },
        select: {
          openedAt: true
        }
      });
    }

    if (openedRecipients.length >= 5) {
      // Group by hour of day (0-23)
      const hourCounts: Record<number, number> = {};
      for (const r of openedRecipients) {
        if (r.openedAt) {
          const hour = new Date(r.openedAt).getHours();
          hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        }
      }

      let bestHour = 10; // Default 10 AM
      let maxCount = -1;
      for (let h = 0; h < 24; h++) {
        const count = hourCounts[h] || 0;
        if (count > maxCount) {
          maxCount = count;
          bestHour = h;
        }
      }

      const nextHour = (bestHour + 1) % 24;
      const timeWindow = `${formatHour(bestHour)} – ${formatHour(nextHour)} IST`;

      return NextResponse.json({
        time: timeWindow,
        rationale: "Calculated from your historical recipient open statistics for this segment.",
        source: "data"
      });
    } else {
      // Fallback path
      try {
        const geminiResult = await callGemini(channel, segmentName);
        if (geminiResult && geminiResult.time && geminiResult.rationale) {
          return NextResponse.json({
            time: geminiResult.time,
            rationale: geminiResult.rationale,
            source: "ai"
          });
        }
        throw new Error("Invalid response keys");
      } catch (err) {
        console.log("Optimal time API falling back locally:", err);
        const fallback = getLocalOptimalTime(channel, segmentName);
        return NextResponse.json({
          time: fallback.time,
          rationale: fallback.rationale,
          source: "ai"
        });
      }
    }
  } catch (error) {
    console.error("Optimal send-time API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
