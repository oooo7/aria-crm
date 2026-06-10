import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SYSTEM_PROMPT = `You are ARIA, an AI marketing copilot for "Lumora", a premium D2C fashion brand.

Customer data fields:
- totalSpent (INR), orderCount, lastOrderDaysAgo, city, tags (vip/new)

Respond ONLY with valid JSON:
{
  "intent": "description",
  "segmentName": "name",
  "segmentDescription": "description", 
  "filterRules": {},
  "channel": "EMAIL|SMS|WHATSAPP|RCS",
  "subject": "subject if EMAIL",
  "messageBody": "message with {{name}}",
  "campaignName": "name",
  "reasoning": "why",
  "estimatedAudience": "X-Y customers"
}`;

const SMART_RESPONSES: Record<string, object> = {
  "win-back": {
    intent: "Re-engage customers who haven't purchased in 90+ days",
    segmentName: "Lapsed Customers — 90 Days",
    segmentDescription: "Customers who haven't ordered in over 90 days",
    filterRules: { lastOrderDaysAgo: { gte: 90 } },
    channel: "EMAIL",
    subject: "We miss you, {{name}} — here's 20% off to come back 🌸",
    messageBody: "Hi {{name}},\n\nIt's been a while since we've seen you at Lumora, and we genuinely miss you!\n\nAs a token of our appreciation, here's an exclusive 20% off your next order. Use code COMEBACK20 at checkout.\n\nYour style awaits you. 🌸\n\nWith love,\nThe Lumora Team",
    campaignName: "Win-Back Campaign — 90 Day Lapsed",
    reasoning: "Email chosen for higher engagement with lapsed customers. 20% discount creates urgency without being too aggressive.",
    estimatedAudience: "25-35 customers"
  },
  "vip": {
    intent: "Reward VIP customers with exclusive access",
    segmentName: "VIP Shoppers",
    segmentDescription: "Top customers with total spend above ₹20,000",
    filterRules: { totalSpent: { gte: 20000 } },
    channel: "WHATSAPP",
    subject: "",
    messageBody: "Hi {{name}} 👑\n\nAs one of our most valued Lumora members, you get first access to our exclusive new collection — 48 hours before anyone else.\n\nYou've always had exceptional taste, and this collection was made for someone like you.\n\nShop your early access now → lumora.in/vip\n\nWith gratitude,\nLumora",
    campaignName: "VIP Early Access Campaign",
    reasoning: "WhatsApp chosen for VIP customers — higher open rates and feels more personal and exclusive.",
    estimatedAudience: "20-30 customers"
  },
  "new": {
    intent: "Welcome new customers and encourage second purchase",
    segmentName: "New Customers — First Month",
    segmentDescription: "Customers who joined in the last 30 days with only 1 order",
    filterRules: { lastOrderDaysAgo: { lte: 30 }, orderCount: { lte: 1 } },
    channel: "EMAIL",
    subject: "Welcome to Lumora, {{name}} — your style journey starts here ✨",
    messageBody: "Hi {{name}},\n\nWelcome to the Lumora family! We're so glad you found us.\n\nAs a thank you for your first purchase, here's 15% off your next order. Use code WELCOME15 — valid for the next 7 days.\n\nDiscover what thousands of fashion lovers already know — Lumora is where style meets soul.\n\nShop now → lumora.in/new\n\nWarmly,\nThe Lumora Team",
    campaignName: "New Customer Welcome Series",
    reasoning: "Email with discount drives second purchase — the most critical conversion for new customer retention.",
    estimatedAudience: "30-50 customers"
  },
  "mumbai": {
    intent: "Target customers in Mumbai with location-specific campaign",
    segmentName: "Mumbai Customers",
    segmentDescription: "All customers based in Mumbai",
    filterRules: { city: "Mumbai" },
    channel: "SMS",
    subject: "",
    messageBody: "Hi {{name}}! Lumora's Mumbai Pop-Up is HERE 🎉 Exclusive styles, live styling sessions & members-only discounts. This weekend only at Bandra. RSVP: lumora.in/mumbai",
    campaignName: "Mumbai Pop-Up Event Campaign",
    reasoning: "SMS for instant local event notification — highest open rate for time-sensitive local campaigns.",
    estimatedAudience: "20-25 customers"
  },
  "flash": {
    intent: "Flash sale for engaged customers who clicked but didn't buy",
    segmentName: "Clicked But Not Converted",
    segmentDescription: "Customers who engaged with campaigns but haven't converted recently",
    filterRules: { lastOrderDaysAgo: { gte: 30 }, orderCount: { gte: 1 } },
    channel: "WHATSAPP",
    subject: "",
    messageBody: "⚡ Hey {{name}}! FLASH SALE — 30% off everything at Lumora. Next 6 hours only!\n\nYou've been eyeing our collection — now's your moment.\n\nShop now → lumora.in/flash\n\nDon't miss out! ⏰",
    campaignName: "Flash Sale — 6 Hour Urgency",
    reasoning: "WhatsApp for flash sales — near-instant delivery and 85%+ open rate ensures time-sensitive offers land.",
    estimatedAudience: "40-60 customers"
  }
};

function matchResponse(prompt: string): object {
  const p = prompt.toLowerCase();
  if (p.includes("win-back") || p.includes("winback") || p.includes("90 day") || p.includes("lapsed") || p.includes("haven't ordered")) {
    return SMART_RESPONSES["win-back"];
  }
  if (p.includes("vip") || p.includes("top spend") || p.includes("high value") || p.includes("exclusive")) {
    return SMART_RESPONSES["vip"];
  }
  if (p.includes("new customer") || p.includes("welcome") || p.includes("first order") || p.includes("joined")) {
    return SMART_RESPONSES["new"];
  }
  if (p.includes("mumbai") || p.includes("bangalore") || p.includes("delhi") || p.includes("chennai") || p.includes("city")) {
    return SMART_RESPONSES["mumbai"];
  }
  if (p.includes("flash") || p.includes("clicked") || p.includes("sale") || p.includes("discount")) {
    return SMART_RESPONSES["flash"];
  }
  // Default — win-back is most common use case
  return SMART_RESPONSES["win-back"];
}

async function callGemini(prompt: string): Promise<object> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("No API key");

  const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"];
  const body = JSON.stringify({
    contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\nMarketer says: ${prompt}\n\nRespond with JSON only:` }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
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

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();
  if (!prompt?.trim()) {
    return NextResponse.json({ error: "Prompt required" }, { status: 400 });
  }

  let parsed: object;

  try {
    // Current (tries Gemini first, falls back if quota hit)
    parsed = await callGemini(prompt);
  } catch {
    // Fall back to smart responses
    console.log("Using smart fallback for:", prompt);
    parsed = matchResponse(prompt);
  }

  try {
    await prisma.aICommand.create({
      data: { prompt, response: JSON.stringify(parsed), actions: parsed },
    });
  } catch { /* ignore db error */ }

  return NextResponse.json({ ok: true, data: parsed });
}