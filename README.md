# ARIA — AI Revenue Intelligence Agent

> An AI-native Mini CRM that helps D2C brands intelligently reach their shoppers.

Built for the Xeno FDE Internship Assignment 2026.

![ARIA Dashboard](https://via.placeholder.com/1200x600/080810/a78bfa?text=ARIA+CRM)

## Live Demo

🌐 **[Live App](https://aria-crm.vercel.app)** — Coming soon after deployment

## What ARIA Does

A marketer types: *"Send a win-back offer to customers who haven't ordered in 90 days"*

ARIA automatically:
1. **Identifies the audience** — builds a segment from natural language
2. **Writes the message** — personalized copy with the customer's name
3. **Recommends the channel** — EMAIL, SMS, WhatsApp, or RCS
4. **Launches the campaign** — dispatches to all matched customers
5. **Tracks engagement** — delivered, opened, clicked, converted in real time

## Architecture
┌─────────────────────────────────────┐
│         ARIA CRM (Next.js 15)       │
│                                     │
│  AI Command Bar → Gemini 2.5 Flash  │
│  Segments · Campaigns · Analytics   │
│                                     │
│  PostgreSQL (Railway) + Prisma ORM  │
└──────────────┬──────────────────────┘
│ HTTP /send
▼
┌─────────────────────────────────────┐
│     Channel Service (Express)       │
│                                     │
│  Simulates: delivered → opened      │
│           → clicked → converted     │
│                                     │
│  Async callbacks → /api/receipt     │
└─────────────────────────────────────┘
## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, TailwindCSS |
| Backend | Next.js API Routes |
| Database | PostgreSQL (Railway) + Prisma ORM |
| AI | Google Gemini 2.5 Flash |
| Channel Service | Express.js (separate service) |
| Deployment | Vercel + Railway |

## Key Features

**AI-Native Command Bar**
- Natural language → campaign in one shot
- Gemini generates segment rules, message copy, and channel recommendation
- Smart fallback ensures 100% uptime even during API rate limits

**Two-Service Architecture**
- CRM sends to channel service via HTTP
- Channel service simulates realistic delivery lifecycle
- Async callbacks update campaign state in real time
- Retry logic for failed callbacks

**Live Analytics**
- Delivery funnel: Sent → Delivered → Opened → Clicked → Converted
- Auto-refreshes every 3 seconds
- Per-campaign and overall analytics

**Customer Intelligence**
- 200 seeded customers with realistic purchase history
- VIP, lapsed, at-risk, new customer archetypes
- City-based segmentation

## Running Locally

```bash
# Clone the repo
git clone https://github.com/oooo7/aria-crm.git
cd aria-crm

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add DATABASE_URL and GEMINI_API_KEY

# Run database migrations and seed
npx prisma migrate dev
npx prisma db seed

# Start the CRM
npm run dev

# In a separate terminal, start the channel service
cd channel-service
npm install
npm run dev
```

## System Design Decisions

**Why a separate channel service?**
Real messaging providers (Twilio, Kaleyra) work exactly this way — you fire a send request and receive async callbacks. This architecture forced proper async state management and mirrors production reality.

**Why JSON filter rules?**
Storing segment filters as JSON means the AI can generate them from natural language and they translate directly to Prisma `where` clauses. This is the bridge between NL intent and database queries.

**What I'd do at scale:**
- Bull/BullMQ with Redis for campaign dispatch queue
- Idempotency keys on receipt processing to handle duplicate callbacks
- Exponential backoff with dead letter queues for failed callbacks
- Database sharding for customer/event tables at 10M+ records

## Project Structure
aria-crm/
├── src/
│   ├── app/
│   │   ├── (dashboard)/     # All UI pages
│   │   │   ├── page.tsx     # Dashboard
│   │   │   ├── command/     # AI Command Bar
│   │   │   ├── campaigns/   # Campaign management
│   │   │   ├── segments/    # Audience segments
│   │   │   ├── customers/   # Customer table
│   │   │   └── analytics/   # Analytics dashboard
│   │   └── api/
│   │       ├── ai/command/  # Gemini AI integration
│   │       ├── campaigns/   # Campaign CRUD + send
│   │       ├── receipt/     # Channel service callbacks
│   │       ├── segments/    # Segment management
│   │       ├── customers/   # Customer data
│   │       └── analytics/   # Stats aggregation
│   ├── components/
│   │   └── Sidebar.tsx
│   └── lib/
│       └── prisma.ts        # Prisma singleton
├── channel-service/         # Separate Express service
│   └── src/index.ts         # Delivery simulation + callbacks
└── prisma/
├── schema.prisma
└── seed.ts              # 200 realistic customers
---

Built with ♥ by Krissh Batra for Xeno FDE Internship 2026