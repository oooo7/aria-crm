import express, { Request, Response } from "express";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;
const CRM_URL = process.env.CRM_RECEIPT_URL || "http://localhost:3000";

const CHANNELS: Record<string, {
  deliveryChance: number; openChance: number;
  clickChance: number; convertChance: number;
  deliveryMs: [number, number]; openMs: [number, number]; clickMs: [number, number];
}> = {
  EMAIL:    { deliveryChance: 0.95, openChance: 0.35, clickChance: 0.12, convertChance: 0.04, deliveryMs: [500,2000],  openMs: [3000,8000],  clickMs: [8000,15000] },
  SMS:      { deliveryChance: 0.98, openChance: 0.85, clickChance: 0.20, convertChance: 0.06, deliveryMs: [200,800],   openMs: [1000,4000],  clickMs: [4000,10000] },
  WHATSAPP: { deliveryChance: 0.97, openChance: 0.75, clickChance: 0.25, convertChance: 0.08, deliveryMs: [300,1000],  openMs: [2000,6000],  clickMs: [6000,12000] },
  RCS:      { deliveryChance: 0.90, openChance: 0.60, clickChance: 0.22, convertChance: 0.07, deliveryMs: [400,1500],  openMs: [2000,7000],  clickMs: [7000,14000] },
};

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function wait(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function cb(recipientId: string, event: string, metadata?: object) {
  try {
    await axios.post(`${CRM_URL}/api/receipt`, { recipientId, event, metadata, timestamp: new Date().toISOString() });
    console.log(`✓ ${event} → ${recipientId.slice(0,8)}`);
  } catch {
    await wait(2000);
    try { await axios.post(`${CRM_URL}/api/receipt`, { recipientId, event, metadata, timestamp: new Date().toISOString() }); }
    catch { console.log(`✗ Failed ${event}`); }
  }
}

async function simulate(recipientId: string, channel: string, campaignId: string) {
  const cfg = CHANNELS[channel] || CHANNELS.EMAIL;
  await wait(rand(...cfg.deliveryMs));
  if (Math.random() > cfg.deliveryChance) { await cb(recipientId, "FAILED", { reason: "Carrier rejected" }); return; }
  await cb(recipientId, "DELIVERED");
  await wait(rand(...cfg.openMs));
  if (Math.random() > cfg.openChance) return;
  await cb(recipientId, "OPENED");
  await wait(rand(...cfg.clickMs));
  if (Math.random() > cfg.clickChance) return;
  await cb(recipientId, "CLICKED", { url: `https://lumora.in/shop?utm_campaign=${campaignId}` });
  await wait(rand(3000, 8000));
  if (Math.random() > cfg.convertChance) return;
  await cb(recipientId, "CONVERTED", { orderId: uuidv4(), orderValue: rand(800, 8000) });
}

app.get("/health", (_req: Request, res: Response) => { res.json({ status: "ok" }); });

app.post("/send", (req: Request, res: Response) => {
  const { recipientId, channel, campaignId } = req.body;
  if (!recipientId || !channel) { res.status(400).json({ error: "Missing fields" }); return; }
  res.json({ externalId: uuidv4(), status: "QUEUED" });
  simulate(recipientId, channel, campaignId || "unknown").catch(console.error);
});

app.listen(PORT, () => {
  console.log(`🚀 Channel service → port ${PORT}`);
  console.log(`📡 Callbacks → ${CRM_URL}`);
});
