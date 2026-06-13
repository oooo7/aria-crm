import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMarketingIntelligence } from "@/lib/marketing/intelligence";

async function getCRMDataSnapshot() {
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

  return {
    totalCustomers: intel.totalCustomers,
    vipCount: intel.segments.vip,
    atRiskCount: intel.segments.atRisk,
    lapsedCount: intel.segments.lapsed,
    newCount: intel.segments.new,
    totalCampaigns: intel.totalSent,
    avgOpenRate,
    avgConversionRate,
    totalRevenue: `₹${Math.round(totalRevenue).toLocaleString("en-IN")}`,
    revenueAtRisk: `₹${intel.revenueAtRisk.toLocaleString("en-IN")}`,
    recentCampaigns: intel.recentCampaigns.slice(0, 5).map(c => ({
      name: c.name,
      status: c.status,
      recipients: c.recipients,
      channel: c.channel
    })),
    topCustomers: topCustomers.map(c => ({
      name: c.name,
      city: c.city || "Unknown",
      spent: `₹${Math.round(c.totalSpent).toLocaleString("en-IN")}`,
      stage: c.totalSpent >= 20000 ? "VIP" : c.tags.includes("new") ? "New" : "Active"
    }))
  };
}

export async function POST(req: NextRequest) {
  try {
    const { messages, pathname } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array required" }, { status: 400 });
    }

    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return NextResponse.json({ error: "Gemini API key is not configured" }, { status: 500 });
    }

    const snapshot = await getCRMDataSnapshot();

    let pathnameContext = "";
    if (pathname === "/customers") {
      pathnameContext = "The user is currently viewing the Customers page.";
    } else if (pathname === "/campaigns") {
      pathnameContext = "The user is currently viewing the Campaigns page.";
    } else if (pathname === "/analytics") {
      pathnameContext = "The user is currently viewing the Analytics page.";
    } else if (pathname === "/segments") {
      pathnameContext = "The user is currently viewing the Segments page.";
    }

    const systemPrompt = `You are ARIA, an AI Revenue Intelligence Agent for a D2C retail brand called Lumora Fashion. You have full access to their CRM data.

Current data snapshot:
- Total customers: ${snapshot.totalCustomers} (${snapshot.vipCount} VIP, ${snapshot.atRiskCount} at risk, ${snapshot.lapsedCount} lapsed, ${snapshot.newCount} new)
- Campaigns sent: ${snapshot.totalCampaigns} | Avg open rate: ${snapshot.avgOpenRate} | Avg conversion: ${snapshot.avgConversionRate}
- Total estimated revenue: ${snapshot.totalRevenue} | Revenue at risk: ${snapshot.revenueAtRisk}
- Recent campaigns: ${JSON.stringify(snapshot.recentCampaigns)}
- Top customers: ${JSON.stringify(snapshot.topCustomers)}

Answer the marketer's questions with specific data from the snapshot above. 
Be concise, confident, and data-driven. Use bullet points for lists. 
Keep responses under 120 words unless the question genuinely requires more. 
Never say you don't have access to data — use the snapshot provided. 
Sign off complex answers with a brief 'Next best action:' suggestion.

${pathnameContext}`;

    // Map conversation history to Gemini structure
    const contents = messages.map((m: any) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.text }]
    }));

    const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
    let responseText = "";
    let success = false;

    const requestBody = JSON.stringify({
      contents,
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 500
      }
    });

    for (const model of models) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: requestBody
          }
        );

        if (res.ok) {
          const data = await res.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            responseText = text;
            success = true;
            break;
          }
        }
      } catch (err) {
        console.error(`Error with model ${model}:`, err);
        continue;
      }
    }

    if (!success) {
      throw new Error("All Gemini models failed to respond");
    }

    return NextResponse.json({ response: responseText });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
