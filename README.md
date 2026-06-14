# ARIA CRM — AI-Native Customer Intelligence Platform

> **Take-home assignment for Xeno Software Engineering Internship**  
> Built for **Lumora Fashion**, a fictional D2C retail brand, to demonstrate real-world CRM product thinking.

---

## What is ARIA?

**ARIA** (Automated Revenue Intelligence Agent) is a full-stack, AI-native CRM platform purpose-built for D2C retail brands. It combines customer lifecycle analytics, multi-channel campaign orchestration, and a generative AI growth agent — all in one cohesive product.

The platform is designed around a single idea: **marketing managers should describe what they want in plain English, and the system should handle everything else** — segmentation, message creation, channel selection, delivery, and analytics.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Next.js 16 (App Router)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Dashboard   │  │ Growth Agent │  │   ARIA Chatbot       │   │
│  │  /analytics  │  │  /command    │  │  (floating overlay)  │   │
│  │  /customers  │  │              │  │                      │   │
│  │  /campaigns  │  │  AI Pipeline │  │  Gemini 2.5 Flash →  │   │
│  │  /segments   │  │  ┌─────────┐ │  │  2.0 Flash → 1.5 →   │   │
│  └──────────────┘  │  │ Gemini  │ │  │  Local fallback      │   │
│                    │  │ 2.5 Flash│ │  └──────────────────────┘   │
│  ┌─────────────────┤  └─────────┘ │                             │
│  │  API Routes     │  └──────────────┘                          │
│  │  /api/ai/*      │                                             │
│  │  /api/campaigns │                                             │
│  │  /api/customers │                                             │
│  │  /api/segments  │                                             │
│  │  /api/analytics │                                             │
│  └─────────────────┘                                             │
└─────────────────────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
┌─────────────────┐          ┌──────────────────────┐
│   PostgreSQL     │          │  Channel Service      │
│   via Prisma ORM │          │  (Express, port 3001) │
│                  │          │                       │
│  Customer        │          │  Simulates delivery:  │
│  Campaign        │          │  EMAIL / SMS /         │
│  Segment         │          │  WHATSAPP / RCS       │
│  CampaignRecip.  │          │                       │
│  DeliveryLog     │          │  Fires callbacks with │
│                  │          │  idempotency checks   │
└─────────────────┘          └──────────────────────┘
```

---

## Core Features

### 🤖 Growth Agent (AI Campaign Orchestration)
The flagship feature. Accepts plain-English campaign requests and produces a fully-formed campaign plan:

**Input:** `"Send a win-back offer to customers who haven't ordered in 90 days"`

**Output:**
- ✅ Audience segment name + filter rules
- ✅ Estimated reach + audience breakdown
- ✅ Recommended channel (Email/SMS/WhatsApp/RCS)
- ✅ AI-written message copy (subject + body)
- ✅ Predicted opens, clicks, conversions, and revenue
- ✅ Optimal send time (AI + historical data)
- ✅ One-click campaign launch with live delivery tracking

**Additional Growth Agent capabilities:**
- **A/B Variant Generator** — generates two distinct message variants with different hooks, CTAs, and tone — reviewable side-by-side before launch
- **Edit & Save** — inline message editing that persists to launch
- **Duplicate Campaign Detection** — warns if same campaign+segment was previously sent
- **SMS Character Counter** — live 160-char counter with amber/red warnings

### 📊 Analytics (Full-Funnel Performance Intelligence)
- Live-updating analytics (auto-refreshes every 5s)
- Full engagement funnel: Sent → Delivered → Opened → Clicked → Converted
- Per-channel delivery, open, and conversion rates with animated progress bars
- **Performance grade column** (A+/A/B+/B/C) per channel — weighted scoring
- City-level customer distribution (horizontal bar chart)
- Weekly campaign trend (area chart)
- **Export CSV** — downloads real channel performance data as `lumora_analytics.csv`

### 👥 Customer Intelligence (360° Customer View)
- Full customer profile with AI-generated brief
- Lifecycle stage detection: VIP / At-Risk / Lapsed / New
- Churn risk score (0–100%)
- Predicted next purchase days (AI)
- Preferred channel recommendation
- Order history with spend timeline visualization
- Campaign engagement memory — tracks opens, clicks, conversions per customer
- **"Launch Targeted Campaign" CTA** — pre-fills Growth Agent with customer context
- **"Brief ARIA" hover button** on every customer row

### 🎯 Audience Segments
- AI-generated segments from natural language descriptions
- Filter rules (city, spend threshold, order count, days since last order)
- Real-time audience count per segment
- **Segment Health Score** (0–100) — derived from audience coverage + campaign engagement
- Segment search with live filtering
- Sample customer preview per segment
- One-click "Brief ARIA for this audience" CTA

### 📣 Campaign Management
- Campaign list with delivery progress bars (animated for `SENDING` status)
- Live per-campaign analytics page: rate rings, event feed, ARIA readout
- Pause / Resume / Delete campaigns
- **Resend** previously sent campaigns with auto-renamed deduplication

### 💬 ARIA Chatbot
- Floating chatbot available on every page
- Context-aware: reads current page and CRM snapshot
- **16+ intent handlers** (even without Gemini API):
  - VIP customers, churn risk, revenue, campaign analytics, city targeting, segment breakdown, strategy recommendations, channel comparison, new customers, growth agent usage, and more
- Tiered AI fallback: Gemini 2.5 Flash → 2.0 Flash → 1.5 Flash → Local intelligence
- Multi-turn conversation history maintained per session
- Page-context injection (knows if you're on /campaigns vs /customers)

### ⌨️ Command Palette (⌘K)
- Global keyboard shortcut — opens from anywhere
- Navigate to any page instantly
- Quick-launch campaign templates (pre-fills Growth Agent)
- Full keyboard navigation (↑↓ Enter Esc)

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 16 (App Router) | Full-stack React with API routes |
| Database | PostgreSQL + Prisma ORM | Type-safe queries, proper relational modeling |
| AI | Google Gemini 2.5 Flash | Best cost/quality ratio for structured output |
| UI | React + Framer Motion | Glassmorphic dark UI with smooth animations |
| Charts | Recharts | Flexible, composable charting library |
| Channel Service | Express.js (port 3001) | Separate microservice for delivery simulation |
| Icons | Lucide React | Consistent, clean icon set |
| Fonts | Inter (Google Fonts) | Modern, legible UI typography |

---

## AI Architecture

### Structured Output Pipeline
The Growth Agent uses a **JSON schema-constrained prompt** to ensure AI output is always parseable:

```
User prompt → System prompt with CRM context → Gemini 2.5 Flash → 
JSON schema validation → { segmentName, filterRules, channel, messageBody, 
                           subject, estimatedAudience, campaignName, intent }
```

If Gemini fails, a local fallback engine generates a valid response using keyword-matching rules and CRM snapshot data — **the app never crashes**.

### Gemini Waterfall
```
Request → gemini-2.5-flash (primary)
        → gemini-2.0-flash (fallback 1)
        → gemini-1.5-flash (fallback 2)
        → Local intelligence engine (final fallback)
```

### A/B Variant Generation
Separate `/api/ai/variants` endpoint accepts the original message and generates two variants with distinct **hook styles** (urgency vs. aspiration), different **CTAs**, and tailored tone — returned as structured JSON.

---

## Campaign Delivery Architecture

```
Launch Campaign API
      │
      ▼
Create CampaignRecipient records (status: QUEUED)
      │
      ▼
POST /send → Channel Service (port 3001)
      │
      ▼  [async, per recipient]
Channel Service simulates delivery
      │
      ├── 85% delivered → fires DELIVERED callback
      │       │
      │       ├── 60% opened → fires OPENED callback
      │       │       │
      │       │       └── 30% clicked → fires CLICKED callback
      │       │               │
      │       │               └── 25% converted → fires CONVERTED callback
      │       │
      │       └── 15% failed → fires FAILED callback
      │
      ▼
/api/receipt → Updates CampaignRecipient + creates DeliveryLog
             → Idempotency check (prevents duplicate updates)
```

---

## Setup & Installation

### Prerequisites
- Node.js 18+
- PostgreSQL (local or cloud)
- Google Gemini API key (optional — app works without it via local fallback)

### 1. Clone & Install
```bash
git clone <repo-url>
cd aria-crm
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/aria_crm"
GEMINI_API_KEY="your-gemini-api-key"   # optional
CHANNEL_SERVICE_URL="http://localhost:3001"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

### 3. Database Setup
```bash
npx prisma migrate dev --name init
npx prisma db seed
```

This seeds **200 realistic Indian customers** with order history, campaign recipients, and delivery logs.

### 4. Start the Channel Service
```bash
node channel-service.js
```
The delivery simulation service runs on port 3001 and handles all message delivery callbacks.

### 5. Start the App
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── page.tsx              # Mission Control dashboard
│   │   ├── customers/
│   │   │   ├── page.tsx          # Customer list with lifecycle filtering
│   │   │   └── [id]/page.tsx     # 360° customer profile
│   │   ├── campaigns/
│   │   │   ├── page.tsx          # Campaign list with delivery bars
│   │   │   └── [id]/page.tsx     # Live campaign analytics
│   │   ├── segments/page.tsx     # Audience segments with health scores
│   │   ├── analytics/page.tsx    # Full-funnel analytics + CSV export
│   │   └── command/page.tsx      # Growth Agent (main AI feature)
│   ├── api/
│   │   ├── ai/
│   │   │   ├── command/          # Main campaign generation endpoint
│   │   │   ├── variants/         # A/B variant generation
│   │   │   ├── insights/         # Dashboard AI insights
│   │   │   ├── mission/          # Business health scoring
│   │   │   ├── optimal-time/     # Send time AI recommendation
│   │   │   └── reasoning/        # Campaign reasoning chain
│   │   ├── aria/
│   │   │   ├── chat/             # Chatbot with 16+ intent handlers
│   │   │   └── snapshot/         # CRM data snapshot for chatbot
│   │   ├── campaigns/            # CRUD + analytics + send + receipt
│   │   ├── customers/            # Customer list + 360° profile
│   │   ├── segments/             # Segment management
│   │   ├── analytics/            # Overview analytics endpoint
│   │   └── import/               # Bulk customer import
├── components/
│   ├── AriaChatbot.tsx           # Floating AI chatbot
│   ├── CommandPalette.tsx        # ⌘K global command palette
│   ├── Sidebar.tsx               # Navigation sidebar
│   └── ui/
│       └── toast.tsx             # Toast notification system
├── lib/
│   ├── prisma.ts                 # Database client
│   └── marketing/
│       └── intelligence.ts       # Core CRM analytics engine
└── prisma/
    ├── schema.prisma             # Database schema
    └── seed.ts                   # Realistic Indian D2C data seed
```

---

## Key Design Decisions

### Why PostgreSQL + Prisma over a BaaS?
Full control over the data model. The `CampaignRecipient` table with its delivery funnel fields (`deliveredAt`, `openedAt`, `clickedAt`, `convertedAt`) enables proper funnel analytics that would be difficult to model in a schemaless system.

### Why a separate Channel Service?
Real CRM platforms don't process delivery in the same server that handles user requests. The channel service simulates a real messaging gateway — it accepts a batch send, processes each recipient asynchronously with realistic delays, and fires webhook callbacks. This is the same pattern used by Sendgrid, Twilio, and Kaleyra.

### Why Gemini over GPT-4?
1. Better structured JSON output for complex nested schemas
2. Free tier with generous limits suitable for a take-home demo
3. Supports system instructions separate from conversation — cleaner architecture

### Why a local fallback for AI?
The app should never be broken during a demo due to API rate limits or missing keys. Every AI feature has a deterministic fallback that produces meaningful output from the database snapshot.

---

## What Makes This Different

Most CRM take-homes submit:
- A CRUD app with a campaign "send" button
- Static charts with hardcoded data
- A basic AI text input that calls GPT with no structure

ARIA instead demonstrates:
- **Production-grade architecture**: Microservice delivery, callback receipts, idempotency
- **Structured AI outputs**: JSON schema validation, not raw text generation
- **Resilient AI**: Waterfall fallback chain so the app never degrades
- **Real product thinking**: Lifecycle stages, churn scoring, LTV calculation, optimal send times
- **D2C domain knowledge**: Indian market context, INR formatting, city-level targeting

---

## Screenshots

> Run the app locally to see the full interactive experience.

Key pages:
- **Dashboard** — Business health score, revenue at risk, AI recommendations
- **Growth Agent** — Natural language → full campaign in 30 seconds  
- **Customer 360** — AI brief, churn risk, order history, engagement memory
- **Analytics** — Live-updating multi-chart dashboard with CSV export
- **Segments** — AI-generated audience cards with health scores

---

*Built with ❤️ + Gemini AI for the Xeno Software Engineering Internship*
