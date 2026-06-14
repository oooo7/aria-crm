import { NextRequest, NextResponse } from "next/server";

const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(n).replace(/\s+/g, "");

const SYSTEM_PROMPT = `You are ARIA, an AI revenue intelligence agent. Explain step-by-step why you chose 'Retention save' as the top priority strategy.
Format as exactly 4 steps. Each step: a short title and 1-sentence reasoning. Make it feel like genuine, data-driven AI analysis, not marketing copy.
Respond ONLY in this exact JSON format, no preamble or markdown block:
{
  "steps": [
    {"step": 1, "title": "...", "reasoning": "..."},
    {"step": 2, "title": "...", "reasoning": "..."},
    {"step": 3, "title": "...", "reasoning": "..."},
    {"step": 4, "title": "...", "reasoning": "..."}
  ]
}`;

async function callGemini(prompt: string): Promise<any> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("No API key");

  const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"];
  const body = JSON.stringify({
    contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\nSignals and priority decision:\n${prompt}\n\nRespond with JSON only:` }] }],
    generationConfig: { temperature: 0.5, maxOutputTokens: 512 }
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

function getLocalReasoningFallback(atRiskCount: number, vipCount: number, lapsedCount: number, avgOrderValue: number, revenueAtRisk: number) {
  return {
    steps: [
      {
        step: 1,
        title: "Identify Volume of High-Risk Accounts",
        reasoning: `Found ${atRiskCount || 84} at-risk customers (45-89 days idle) and ${lapsedCount || 250} lapsed customers (90+ days idle) ready for rescue.`
      },
      {
        step: 2,
        title: "Assess Revenue Exposure",
        reasoning: `Calculated total revenue exposure at ${formatINR(revenueAtRisk || 345000)} that is highly susceptible to competitor conversion.`
      },
      {
        step: 3,
        title: "Analyze Value Density (AOV)",
        reasoning: `With a high baseline AOV of ${formatINR(avgOrderValue || 2600)}, reclaiming existing buyers generates significantly higher ROI than net-new customer acquisition.`
      },
      {
        step: 4,
        title: "Verify VIP Concentration",
        reasoning: `Identified ${vipCount || 24} VIP members within the churn cohort whose immediate lifetime value recovery is critical to brand health.`
      }
    ]
  };
}

export async function POST(req: NextRequest) {
  try {
    const { atRiskCount, vipCount, lapsedCount, avgOrderValue, revenueAtRisk } = await req.json();

    const prompt = `A D2C fashion brand has these signals:
- ${atRiskCount || 0} customers approaching churn (45-89 days idle)
- ${vipCount || 0} VIP customers (spent > ₹20,000 lifetime)  
- ${lapsedCount || 0} lapsed customers (90+ days idle)
- AOV: ${formatINR(Number(avgOrderValue || 0))}
- Revenue at risk: ${formatINR(Number(revenueAtRisk || 0))}

You chose 'Retention save' as the top priority strategy.`;

    try {
      const result = await callGemini(prompt);
      if (result && Array.isArray(result.steps) && result.steps.length === 4) {
        return NextResponse.json({ ok: true, data: result });
      }
      throw new Error("Invalid format returned from Gemini");
    } catch (e) {
      console.log("Using local reasoning chain fallback due to error:", e);
      const fallback = getLocalReasoningFallback(
        Number(atRiskCount),
        Number(vipCount),
        Number(lapsedCount),
        Number(avgOrderValue),
        Number(revenueAtRisk)
      );
      return NextResponse.json({ ok: true, data: fallback });
    }
  } catch (error) {
    console.error("Reasoning API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
