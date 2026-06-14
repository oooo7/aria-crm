import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a D2C marketing expert. Given a campaign, generate TWO alternative message variants:
Variant A (Control): Emphasize exclusivity and FOMO
Variant B (Challenger): Emphasize warmth and relationship

Respond ONLY in this exact JSON format, no preamble or markdown block:
{
  "variantA": {
    "label": "Exclusivity & FOMO",
    "subject": "...",
    "body": "...",
    "hook": "What makes this work psychologically"
  },
  "variantB": {
    "label": "Warmth & Relationship",
    "subject": "...",
    "body": "...",
    "hook": "What makes this work psychologically"
  }
}`;

async function callGemini(prompt: string): Promise<any> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("No API key configured");

  const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"];
  const body = JSON.stringify({
    contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\nCampaign:\n${prompt}\n\nRespond with JSON only:` }] }],
    generationConfig: { temperature: 0.8, maxOutputTokens: 1024 }
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
    } catch (err) {
      console.error(`Gemini model ${model} failed for variants:`, err);
      continue;
    }
  }
  throw new Error("API unavailable");
}

function generateLocalFallback(segmentName: string, channel: string, originalMessage: string) {
  const isEmail = channel.toUpperCase() === "EMAIL";
  const firstNamePlaceholder = "{{name}}";

  const cleanMsg = originalMessage.replace(/{{name}}/g, firstNamePlaceholder);

  // Variant A: Exclusivity & FOMO fallback
  const subjectA = isEmail 
    ? `An exclusive invitation for our top VIPs 👑`
    : "";
  const bodyA = isEmail
    ? `Hi ${firstNamePlaceholder},\n\nWe are reaching out to select members of our community to grant early access to our premium collections.\n\nItems are in limited quantities and will sell out soon. Act now to claim your exclusive privilege.\n\nShop early access → lumora.in/exclusive`
    : `Hi ${firstNamePlaceholder}! Exclusive early access is live. Very limited quantities, will sell out. Shop now: lumora.in/exclusive`;
  
  // Variant B: Warmth & Relationship fallback
  const subjectB = isEmail
    ? `We appreciate you being part of the Lumora family 🌸`
    : "";
  const bodyB = isEmail
    ? `Hi ${firstNamePlaceholder},\n\nWe just wanted to say thank you for being a part of our journey. Customers like you make Lumora special.\n\nWe've hand-picked a few signature pieces we think you'll love. Let us know what you think.\n\nExplore style crafted for you → lumora.in/family`
    : `Hi ${firstNamePlaceholder}! We're so grateful for your presence. Explore handpicked styles made with care: lumora.in/family`;

  return {
    variantA: {
      label: "Exclusivity & FOMO",
      subject: subjectA,
      body: bodyA,
      hook: "Leverages the scarcity principle and status-seeking behavior, making the customer feel selected and creating urgency."
    },
    variantB: {
      label: "Warmth & Relationship",
      subject: subjectB,
      body: bodyB,
      hook: "Utilizes the reciprocity norm and belongingness, fostering a strong emotional connection to the brand."
    }
  };
}

export async function POST(req: NextRequest) {
  try {
    const { segmentName, audienceSize, channel, originalMessage } = await req.json();

    if (!segmentName || !channel || !originalMessage) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const prompt = `- Audience: ${segmentName} (${audienceSize || 40} customers)
- Channel: ${channel}
- Original message: ${originalMessage}
- Brand: Lumora Fashion (premium D2C fashion)`;

    try {
      const result = await callGemini(prompt);
      // Validate structure
      if (result.variantA && result.variantB) {
        return NextResponse.json({ ok: true, data: result, source: "gemini" });
      }
      throw new Error("Invalid output structure");
    } catch (e) {
      console.log("Using local variant generator fallback due to error:", e);
      const fallback = generateLocalFallback(segmentName, channel, originalMessage);
      return NextResponse.json({ ok: true, data: fallback, source: "fallback" });
    }
  } catch (error: any) {
    console.error("Variants API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
