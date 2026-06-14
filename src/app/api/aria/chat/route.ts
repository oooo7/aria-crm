import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMarketingIntelligence } from "@/lib/marketing/intelligence";

const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(n).replace(/\s+/g, "");

// Resilience Mock Snapshot: returned if PostgreSQL database is offline or disconnected
const MOCK_SNAPSHOT = {
  totalCustomers: 200,
  vipCount: 30,
  atRiskCount: 15,
  lapsedCount: 25,
  newCount: 45,
  totalCampaigns: 6,
  avgOpenRate: "63.5%",
  avgConversionRate: "12.2%",
  totalRevenue: "₹86,49,390",
  revenueAtRisk: "₹3,39,073",
  recentCampaigns: [
    { name: "Win-Back Campaign — 90 Day Lapsed", status: "SENT", recipients: 35, channel: "EMAIL" },
    { name: "VIP Early Access Campaign", status: "SENT", recipients: 25, channel: "WHATSAPP" },
    { name: "New Customer Welcome Series", status: "DRAFT", recipients: 42, channel: "EMAIL" }
  ],
  topCustomers: [
    { name: "Priya Sharma", city: "Mumbai", spent: "₹45,000", stage: "VIP" },
    { name: "Aarav Patel", city: "Delhi", spent: "₹32,500", stage: "VIP" },
    { name: "Ananya Iyer", city: "Bangalore", spent: "₹28,400", stage: "VIP" },
    { name: "Kabir Mehta", city: "Mumbai", spent: "₹24,100", stage: "VIP" },
    { name: "Diya Rao", city: "Chennai", spent: "₹22,800", stage: "VIP" }
  ],
  topCities: [
    { city: "Mumbai", count: 62 },
    { city: "Delhi", count: 48 },
    { city: "Bangalore", count: 41 },
    { city: "Chennai", count: 25 }
  ]
};

async function getCRMDataSnapshot() {
  try {
    const [intel, topCustomers, revenueSum, topCities] = await Promise.all([
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
      }),
      prisma.customer.groupBy({
        by: ["city"],
        _count: { city: true },
        orderBy: { _count: { city: "desc" } },
        take: 4,
      }),
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
      totalRevenue: formatINR(Math.round(totalRevenue)),
      revenueAtRisk: formatINR(intel.revenueAtRisk),
      recentCampaigns: intel.recentCampaigns.slice(0, 5).map(c => ({
        name: c.name,
        status: c.status,
        recipients: c.recipients,
        channel: c.channel
      })),
      topCustomers: topCustomers.map(c => ({
        name: c.name,
        city: c.city || "Unknown",
        spent: formatINR(Math.round(c.totalSpent)),
        stage: c.totalSpent >= 20000 ? "VIP" : c.tags.includes("new") ? "New" : "Active"
      })),
      topCities: topCities.map(c => ({ city: c.city || "Unknown", count: c._count.city }))
    };
  } catch (dbErr) {
    console.error("Database snapshot failure (database connection down?):", dbErr);
    // Return static mock data so chatbot doesn't crash
    return MOCK_SNAPSHOT;
  }
}

function getChatLocalFallback(query: string, snapshot: any): string {
  const q = query.trim().toLowerCase();

  // 1. Greetings
  if (q === "hi" || q === "hello" || q === "hey" || q.startsWith("hello ") || q.startsWith("hi ") || q.startsWith("hey ") || q === "greetings") {
    return `Hello! I'm ARIA, your Revenue Intelligence Agent for Lumora Fashion. 👋\n\nI have live access to your CRM — **${snapshot.totalCustomers} customers**, **${snapshot.totalCampaigns} campaigns run**, and **${snapshot.totalRevenue}** in estimated revenue.\n\nAsk me about your VIP customers, revenue at risk, campaign analytics, or segment breakdowns!`;
  }
  if (q.includes("how are you") || q.includes("how's it going") || q.includes("how are things")) {
    return `Operating at full capacity! 🚀 I'm currently monitoring Lumora Fashion's business indicators.\n\n**Live snapshot:**\n• ${snapshot.vipCount} VIP customers active\n• ${snapshot.revenueAtRisk} revenue at risk of churning\n• Avg open rate: ${snapshot.avgOpenRate}\n\nWhat can I query for you today?`;
  }

  // 2. Capabilities & Help
  if (q.includes("what can you do") || q.includes("capabilities") || q.includes("how to use") || q.includes("who are you") || q.includes("help")) {
    return `I'm ARIA — your AI marketing operating companion with full read access to your CRM. Here's what I can do:\n\n**Customer Intelligence:**\n• "Who are my VIP customers?"\n• "How many new customers do I have?"\n• "Which customers are at risk of churning?"\n\n**Revenue & Risk:**\n• "How much revenue is at risk?"\n• "What's my total revenue?"\n• "Show me revenue breakdown"\n\n**Campaigns & Analytics:**\n• "How are my campaigns performing?"\n• "What's my open rate?"\n• "Which channel performs best?"\n\n**Segments & Strategy:**\n• "What segments do I have?"\n• "What should I do next?"\n• "Which city has the most customers?"`;
  }

  // 3. Gratitude
  if (q === "thank you" || q === "thanks" || q === "ok thanks" || q.includes("awesome") || q.includes("perfect") || q.includes("great job")) {
    return `You're very welcome! I'm always here to help Lumora Fashion unlock customer value. 🚀\n\n*Next best action:* Brief the Growth Agent → use ⌘K to quickly launch a new campaign.`;
  }

  // 4. VIP / Top Customers
  if (q.includes("vip") || q.includes("top customer") || q.includes("best customer") || q.includes("highest spend") || q.includes("premium")) {
    const list = snapshot.topCustomers.map((c: any, i: number) => `${i + 1}. **${c.name}** (${c.city}) — Lifetime spend: **${c.spent}** [${c.stage}]`).join("\n");
    return `Lumora Fashion has **${snapshot.vipCount} VIP shoppers** (≥₹20,000 lifetime spend).\n\nTop customers by value:\n${list}\n\n*Next best action:* Create a WhatsApp early-access campaign exclusively for VIPs — target them before your next collection drop.`;
  }

  // 5. Churn Risk / At Risk / Lapsed
  if (q.includes("risk") || q.includes("churn") || q.includes("lapsed") || q.includes("dormant") || q.includes("inactive") || q.includes("lost")) {
    return `Here's Lumora Fashion's current churn exposure:\n\n• **At-Risk Shoppers:** **${snapshot.atRiskCount} customers** (45–89 days inactive)\n• **Lapsed Shoppers:** **${snapshot.lapsedCount} customers** (90+ days inactive)\n• **Revenue Exposed:** **${snapshot.revenueAtRisk}** is at risk of being permanently lost\n\nThe clock is ticking on lapsed customers — every 30 days of inactivity reduces win-back probability by ~15%.\n\n*Next best action:* Brief the Growth Agent with "Send a win-back offer to customers who haven't ordered in 90 days" to recover this revenue.`;
  }

  // 6. New customers
  if (q.includes("new customer") || q.includes("new shopper") || q.includes("first time") || q.includes("onboard")) {
    return `Lumora Fashion currently has **${snapshot.newCount} new customers** (first purchase within 30 days).\n\nNew customers are your highest-leverage segment — they have the highest likelihood of becoming repeat buyers if engaged within the first 7 days.\n\n**Recommended onboarding sequence:**\n• Day 1: Welcome email with brand story\n• Day 3: Style recommendation WhatsApp message\n• Day 7: First-repeat-purchase incentive SMS\n\n*Next best action:* Brief the Growth Agent to "Create a welcome series for new customers in the last 30 days."`;
  }

  // 7. Revenue / Total revenue
  if ((q.includes("revenue") && !q.includes("risk")) || q.includes("total sales") || q.includes("how much have") || q.includes("earnings") || q.includes("ltv")) {
    return `**Lumora Fashion Revenue Overview:**\n\n• **Total Estimated Revenue:** **${snapshot.totalRevenue}**\n• **Revenue At Risk:** **${snapshot.revenueAtRisk}** (from churning segments)\n• **Top Contributors:** ${snapshot.topCustomers.slice(0, 3).map((c: any) => `${c.name} (${c.spent})`).join(", ")}\n\nVIP customers represent ~${snapshot.vipCount} shoppers but typically drive 60–70% of D2C revenue.\n\n*Next best action:* Double down on VIP retention — an exclusive early access campaign can drive 2–3× higher AOV.`;
  }

  // 8. Analytics, open rates, conversions or campaigns query
  if (q.includes("analytics") || q.includes("conversion") || q.includes("open rate") || q.includes("click") || q.includes("performance")) {
    const campaignsList = snapshot.recentCampaigns.slice(0, 4).map((c: any) => `• **${c.name}** — ${c.channel} → ${c.recipients} recipients [${c.status}]`).join("\n");
    return `**Campaign Performance Dashboard:**\n\n• **Total Campaigns Run:** ${snapshot.totalCampaigns}\n• **Average Open Rate:** **${snapshot.avgOpenRate}**\n• **Average Conversion Rate:** **${snapshot.avgConversionRate}**\n\n**Recent campaigns:**\n${campaignsList}\n\n*Next best action:* Visit the Analytics page for full-funnel breakdown and channel-level performance grades.`;
  }

  // 9. Campaigns listing
  if (q.includes("campaign") || q.includes("what campaigns") || q.includes("show me campaigns") || q.includes("recent campaign")) {
    const list = snapshot.recentCampaigns.map((c: any) => `• **${c.name}** (${c.channel}) — ${c.recipients} recipients — *${c.status}*`).join("\n");
    return `Here are your recent campaigns:\n\n${list}\n\n*Next best action:* Open the Campaigns page to see full delivery analytics, or brief the Growth Agent to create a new one.`;
  }

  // 10. City / Location
  if (q.includes("city") || q.includes("mumbai") || q.includes("delhi") || q.includes("bangalore") || q.includes("location") || q.includes("where") || q.includes("region")) {
    const cities = snapshot.topCities.map((c: any, i: number) => `${i + 1}. **${c.city}**: ${c.count} customers`).join("\n");
    return `**Customer distribution by city:**\n\n${cities}\n\nMumbai and Delhi typically account for the highest purchase frequency in Indian D2C.\n\n*Next best action:* Run a geo-targeted SMS/RCS campaign for your top-2 cities — invite them to a pop-up or flash sale event.`;
  }

  // 11. Channel comparison
  if (q.includes("which channel") || q.includes("best channel") || q.includes("email vs") || q.includes("whatsapp vs") || q.includes("sms vs")) {
    return `**Channel Performance Benchmarks (Lumora Fashion):**\n\n| Channel | Avg Open Rate | Best Use Case |\n|---|---|---|\n| WhatsApp | 70–85% | VIP + high-value offers |\n| Email | 40–60% | Newsletters, detailed offers |\n| SMS | 55–75% | Flash sales, time-sensitive |\n| RCS | 50–65% | Rich media, new collections |\n\nFor win-back campaigns, **WhatsApp** consistently outperforms other channels for re-engagement.\n\n*Next best action:* Use the Growth Agent — it selects the optimal channel automatically based on your audience segment.`;
  }

  // 12. What should I do / Next steps / Strategy
  if (q.includes("what should i do") || q.includes("next step") || q.includes("recommend") || q.includes("strategy") || q.includes("action") || q.includes("suggest")) {
    return `Based on Lumora Fashion's current CRM snapshot, here are the **top 3 revenue actions:**\n\n**1. 🔴 Win-back lapsed customers (Highest ROI)**\n   ${snapshot.lapsedCount} customers, ${snapshot.revenueAtRisk} at risk — brief Growth Agent: "Win-back offer for 90-day lapsed"\n\n**2. 💛 Re-engage at-risk customers (Urgent)**\n   ${snapshot.atRiskCount} customers approaching churn — act within 7 days\n\n**3. 👑 VIP early access campaign**\n   ${snapshot.vipCount} VIPs ready for your next collection — WhatsApp has 80%+ open rates with this segment\n\n*Use ⌘K → "Quick Launch" to execute any of these in 30 seconds.*`;
  }

  // 13. Segments
  if (q.includes("segment") || q.includes("audience") || q.includes("group") || q.includes("filter")) {
    return `**Lumora Fashion's customer segments:**\n\n• 👑 **VIP** (${snapshot.vipCount} customers) — Lifetime spend ≥ ₹20,000\n• ⚠️ **At-Risk** (${snapshot.atRiskCount} customers) — 45–89 days inactive\n• 😴 **Lapsed** (${snapshot.lapsedCount} customers) — 90+ days inactive\n• 🌱 **New** (${snapshot.newCount} customers) — First purchase ≤ 30 days\n\nTotal: **${snapshot.totalCustomers} customers** across all segments.\n\n*Next best action:* Visit Segments page to create custom filter rules for hyper-targeted campaigns.`;
  }

  // 14. Dashboard / Overview
  if (q.includes("dashboard") || q.includes("overview") || q.includes("summary") || q.includes("business health") || q.includes("how's the business")) {
    return `**Lumora Fashion Business Snapshot:**\n\n• 👥 **Total Customers:** ${snapshot.totalCustomers}\n• 💰 **Estimated Revenue:** ${snapshot.totalRevenue}\n• 🔴 **Revenue At Risk:** ${snapshot.revenueAtRisk}\n• 📊 **Campaigns Sent:** ${snapshot.totalCampaigns}\n• 📬 **Avg Open Rate:** ${snapshot.avgOpenRate}\n• 🎯 **Avg Conversion:** ${snapshot.avgConversionRate}\n\nYour business health looks stable. The biggest opportunity right now is recovering the **${snapshot.revenueAtRisk}** at risk through a targeted re-engagement campaign.\n\n*Next best action:* Check the Mission Control dashboard for live scoring and ARIA-recommended actions.`;
  }

  // 15. Growth Agent / How to create campaign
  if (q.includes("how to create") || q.includes("create campaign") || q.includes("growth agent") || q.includes("make a campaign") || q.includes("launch")) {
    return `Creating a campaign with ARIA is simple:\n\n**Step 1:** Go to **Growth Agent** (or press ⌘K → "Growth Agent")\n**Step 2:** Type a plain-English prompt like:\n   *"Send a win-back email to customers who haven't ordered in 90 days"*\n**Step 3:** ARIA generates:\n   → Audience segment + size estimate\n   → Channel recommendation\n   → Full message copy\n   → Predicted conversions & revenue\n   → Optimal send time\n**Step 4:** Edit message if needed, optionally generate A/B variants\n**Step 5:** Click "Launch Campaign" — delivery tracking goes live instantly\n\n*Next best action:* Press ⌘K and select a Quick Launch template to get started in 10 seconds.`;
  }

  // 16. Top cities / geography targeted
  if (q.includes("target") || q.includes("geo") || q.includes("geography")) {
    const topCity = snapshot.topCities[0]?.city || "Mumbai";
    return `For geo-targeting, Lumora Fashion's top city is **${topCity}** with ${snapshot.topCities[0]?.count || 0} customers.\n\n**Geo-targeting strategy:**\n• Mumbai + Delhi → Premium collections, high-AOV segments\n• Bangalore → Tech-savvy shoppers, digital-first channels (RCS/WhatsApp)\n• Chennai → Traditional occasions, seasonal campaigns\n\n*Next best action:* Brief the Growth Agent: "Create an SMS campaign for Mumbai customers who haven't ordered in 45 days."`;
  }

  // Default — intelligent fallback using actual data
  return `I understand you're asking about **"${query}"**. Let me pull what I know from the CRM:\n\n**Lumora Fashion Quick Stats:**\n• 👥 ${snapshot.totalCustomers} total customers (${snapshot.vipCount} VIPs, ${snapshot.atRiskCount} at risk)\n• 💰 Revenue: ${snapshot.totalRevenue} | At risk: ${snapshot.revenueAtRisk}\n• 📊 ${snapshot.totalCampaigns} campaigns · ${snapshot.avgOpenRate} avg open rate\n\nFor a more specific answer, try asking:\n• *"Who are my VIP customers?"*\n• *"What should I do next?"*\n• *"How are my campaigns performing?"*\n• *"Which city has the most customers?"*`;
}


export async function POST(req: NextRequest) {
  try {
    const { messages, pathname } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array required" }, { status: 400 });
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

    let responseText = "";
    let success = false;
    const key = process.env.GEMINI_API_KEY;

    if (key) {
      // Map conversation history to Gemini structure
      const contents = messages.map((m: any) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.text }]
      }));

      const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
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
    }

    if (!success) {
      console.log("Chatbot assistant falling back locally due to Gemini being unavailable.");
      const lastUserMessage = messages[messages.length - 1]?.text || "";
      responseText = getChatLocalFallback(lastUserMessage, snapshot);
    }

    return NextResponse.json({ response: responseText });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
