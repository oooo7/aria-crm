"use client";

import { use, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, Brain, CalendarClock, CircleDollarSign, Loader2,
  Mail, MessageCircle, ShieldAlert, Sparkles, Target, TrendingUp,
  Phone, MapPin, ShoppingBag, Zap, Crown, AlertTriangle, Star,
  BarChart3, Activity, ArrowRight,
} from "lucide-react";
import Link from "next/link";

interface Customer360 {
  customer: {
    id: string; name: string; email: string; phone: string | null;
    city: string | null; totalSpent: number; orderCount: number;
    lastOrderAt: string | null;
    orders: Array<{ id: string; amount: number; createdAt: string; channel: string; status: string }>;
    campaignRecipients: Array<{
      id: string; status: string; openedAt: string | null; clickedAt: string | null;
      convertedAt: string | null; campaign: { name: string; channel: string };
    }>;
  };
  intelligence: {
    lifecycleStage: string; churnRisk: number; predictedNextPurchaseDays: number;
    preferredChannel: string; avgOrderValue: number; aiSummary: string;
    recommendedAction: string; confidence: number;
  };
}

const glass = {
  background: "linear-gradient(145deg, rgba(15,15,30,0.92), rgba(8,8,20,0.78))",
  border: "1px solid rgba(255,255,255,0.075)",
  boxShadow: "0 20px 60px rgba(0,0,0,0.28)",
  backdropFilter: "blur(20px)",
};

const channelColor: Record<string, string> = {
  EMAIL: "#a78bfa", SMS: "#38bdf8", WHATSAPP: "#34d399", RCS: "#fb923c",
};
const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(n).replace(/\s+/g, "");

function money(v: number) { return formatINR(Math.round(v)); }

function daysAgo(iso: string | null) {
  if (!iso) return "No order";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} year ago`;
}

function LifecycleIcon({ stage }: { stage: string }) {
  const s = stage.toLowerCase();
  if (s.includes("vip"))    return <Crown size={14} color="#fbbf24" />;
  if (s.includes("lapsed")) return <TrendingUp size={14} color="#f59e0b" />;
  if (s.includes("risk"))   return <AlertTriangle size={14} color="#f87171" />;
  if (s.includes("new"))    return <Sparkles size={14} color="#38bdf8" />;
  return <Star size={14} color="#34d399" />;
}

function LifecycleColor(stage: string): string {
  const s = stage.toLowerCase();
  if (s.includes("vip"))    return "#fbbf24";
  if (s.includes("lapsed")) return "#f59e0b";
  if (s.includes("risk"))   return "#f87171";
  if (s.includes("new"))    return "#38bdf8";
  return "#34d399";
}

function SpendBar({ value, maxValue }: { value: number; maxValue: number }) {
  return (
    <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden", marginTop: 8 }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${maxValue > 0 ? Math.min((value / maxValue) * 100, 100) : 0}%` }}
        transition={{ duration: 1.1, ease: "easeOut", delay: 0.3 }}
        style={{ height: "100%", background: "linear-gradient(90deg, #7c3aed, #34d399)", borderRadius: 4 }}
      />
    </div>
  );
}

function EngagementScore({ recipients }: { recipients: Customer360["customer"]["campaignRecipients"] }) {
  if (recipients.length === 0) return null;
  const opens   = recipients.filter(r => r.openedAt).length;
  const clicks  = recipients.filter(r => r.clickedAt).length;
  const convs   = recipients.filter(r => r.convertedAt).length;
  const total   = recipients.length;
  const score   = Math.round(((opens * 1 + clicks * 2 + convs * 3) / (total * 6)) * 100);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.18)", borderRadius: 10, padding: "8px 12px" }}>
      <Activity size={13} color="#a78bfa" />
      <div>
        <span style={{ fontSize: 12, fontWeight: 800, color: "#c4b5fd" }}>Engagement score: {score}%</span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginLeft: 8 }}>{opens} opens · {clicks} clicks · {convs} conversions</span>
      </div>
    </div>
  );
}

export default function Customer360Page({ params }: { params: Promise<{ id: string }> }) {
  const { id }  = use(params);
  const [data, setData] = useState<Customer360 | null>(null);

  useEffect(() => {
    fetch(`/api/customers/${id}`).then(r => r.json()).then(setData);
  }, [id]);

  if (!data) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(124,58,237,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Sparkles size={24} color="#a78bfa" />
        </div>
        <Loader2 size={20} color="#a78bfa" style={{ animation: "spin 1s linear infinite" }} />
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>Loading customer intelligence...</p>
      </div>
    );
  }

  const { customer, intelligence } = data;
  const lifColor = LifecycleColor(intelligence.lifecycleStage);
  const churnColor = intelligence.churnRisk > 70 ? "#f87171" : intelligence.churnRisk > 40 ? "#f59e0b" : "#34d399";
  const churnBg   = intelligence.churnRisk > 70 ? "rgba(248,113,113,0.1)" : intelligence.churnRisk > 40 ? "rgba(245,158,11,0.1)" : "rgba(52,211,153,0.1)";
  const churnBorder = intelligence.churnRisk > 70 ? "rgba(248,113,113,0.25)" : intelligence.churnRisk > 40 ? "rgba(245,158,11,0.2)" : "rgba(52,211,153,0.2)";

  const channelForPref = intelligence.preferredChannel === "WHATSAPP" ? MessageCircle : intelligence.preferredChannel === "SMS" ? Phone : Mail;
  const ChannelIcon = channelForPref;

  const maxOrderAmount = Math.max(...customer.orders.map(o => o.amount), 1);

  return (
    <div style={{ minHeight: "100vh", padding: "28px 36px 70px", background: "radial-gradient(ellipse at 15% 0%, rgba(124,58,237,0.14) 0%, transparent 45%), #080810" }}>
      {/* Back */}
      <Link href="/customers" style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "rgba(255,255,255,0.35)", textDecoration: "none", fontSize: 13, marginBottom: 22, transition: "color 0.12s" }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.65)"}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.35)"}
      >
        <ArrowLeft size={14} /> Back to Customers
      </Link>

      {/* Hero header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, gap: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 60, height: 60, borderRadius: 18, background: "linear-gradient(135deg, #7c3aed, #0891b2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900, color: "#fff", flexShrink: 0, boxShadow: "0 8px 24px rgba(124,58,237,0.3)" }}>
            {customer.name.split(" ").map(p => p[0]).slice(0, 2).join("")}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 6 }}>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: "#fff", margin: 0 }}>{customer.name}</h1>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: `${lifColor}14`, color: lifColor, border: `1px solid ${lifColor}28`, fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 20, textTransform: "uppercase", letterSpacing: 0.8 }}>
                <LifecycleIcon stage={intelligence.lifecycleStage} />
                {intelligence.lifecycleStage}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <Mail size={12} color="rgba(255,255,255,0.25)" />
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{customer.email}</span>
              </div>
              {customer.phone && (
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <Phone size={12} color="rgba(255,255,255,0.25)" />
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{customer.phone}</span>
                </div>
              )}
              {customer.city && (
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <MapPin size={12} color="rgba(255,255,255,0.25)" />
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{customer.city}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Churn risk + launch CTA */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{ ...glass, borderRadius: 14, padding: "12px 18px", textAlign: "center", background: churnBg, border: `1px solid ${churnBorder}` }}>
            <div style={{ fontSize: 28, color: churnColor, fontWeight: 900, lineHeight: 1 }}>{intelligence.churnRisk}%</div>
            <div style={{ fontSize: 9, color: churnColor, textTransform: "uppercase", letterSpacing: 1.3, marginTop: 4, fontWeight: 800 }}>Churn risk</div>
          </div>
          <button
            onClick={() => {
              sessionStorage.setItem("aria_prefill", intelligence.recommendedAction);
              window.location.href = "/command";
            }}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg, #7c3aed, #0891b2)", border: "none", color: "#fff", fontSize: 13, fontWeight: 800, padding: "12px 18px", borderRadius: 13, cursor: "pointer", boxShadow: "0 8px 24px rgba(124,58,237,0.28)", transition: "opacity 0.15s" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "0.88"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
          >
            <Zap size={14} /> Launch campaign <ArrowRight size={13} />
          </button>
        </div>
      </motion.div>

      {/* AI brief + intel grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 14, marginBottom: 14 }}>
        {/* AI brief */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} style={{ ...glass, borderRadius: 20, padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(167,139,250,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Brain size={14} color="#a78bfa" />
            </div>
            <span style={{ fontSize: 10, fontWeight: 900, color: "#a78bfa", textTransform: "uppercase", letterSpacing: 1.4 }}>AI customer brief</span>
            <span style={{ fontSize: 9, background: "rgba(167,139,250,0.12)", color: "#c4b5fd", border: "1px solid rgba(167,139,250,0.2)", borderRadius: 4, padding: "2px 7px", fontWeight: 700 }}>{intelligence.confidence}% confidence</span>
          </div>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.7, margin: "0 0 18px" }}>{intelligence.aiSummary}</p>
          <div style={{ background: "rgba(52,211,153,0.07)", border: "1px solid rgba(52,211,153,0.16)", borderRadius: 14, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
              <Sparkles size={13} color="#34d399" />
              <span style={{ fontSize: 10, fontWeight: 900, color: "#34d399", textTransform: "uppercase", letterSpacing: 1.2 }}>Recommended action</span>
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", margin: 0, lineHeight: 1.55 }}>{intelligence.recommendedAction}</p>
          </div>

          {/* Engagement score */}
          {customer.campaignRecipients.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <EngagementScore recipients={customer.campaignRecipients} />
            </div>
          )}
        </motion.div>

        {/* KPI cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { label: "Lifetime value", value: money(customer.totalSpent), icon: CircleDollarSign, color: "#34d399", sub: `${customer.orderCount} orders` },
            { label: "Lifecycle stage", value: intelligence.lifecycleStage, icon: Target,          color: lifColor, sub: `${intelligence.confidence}% confidence` },
            { label: "Next purchase",   value: `~${intelligence.predictedNextPurchaseDays}d`,       icon: CalendarClock, color: "#38bdf8", sub: "AI prediction" },
            { label: "Best channel",    value: intelligence.preferredChannel,                       icon: ChannelIcon,   color: channelColor[intelligence.preferredChannel] || "#a78bfa", sub: "Preferred reach" },
          ].map(({ label, value, icon: Icon, color, sub }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + i * 0.04 }} style={{ ...glass, borderRadius: 16, padding: 18 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: `${color}14`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <Icon size={15} color={color} />
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1.1, fontWeight: 800, marginBottom: 5 }}>{label}</div>
              <div style={{ fontSize: 20, color, fontWeight: 900, marginBottom: 4 }}>{value}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{sub}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Order history + Engagement memory */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        {/* Orders */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} style={{ ...glass, borderRadius: 20, padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: "rgba(56,189,248,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShoppingBag size={13} color="#38bdf8" />
            </div>
            <span style={{ fontSize: 10, fontWeight: 900, color: "rgba(255,255,255,0.38)", textTransform: "uppercase", letterSpacing: 1.4 }}>Order history</span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginLeft: "auto" }}>{customer.orders.length} orders · {money(customer.totalSpent)} total</span>
          </div>
          {customer.orders.length === 0 ? (
            <p style={{ color: "rgba(255,255,255,0.28)", fontSize: 13 }}>No orders yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {customer.orders.map(order => (
                <div key={order.id} style={{ background: "rgba(255,255,255,0.035)", borderRadius: 11, padding: "12px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{money(order.amount)}</span>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", marginLeft: 9 }}>{daysAgo(order.createdAt)} · {order.channel}</span>
                    </div>
                    <span style={{ fontSize: 9, color: "#34d399", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.18)", padding: "3px 8px", borderRadius: 999, fontWeight: 700 }}>{order.status}</span>
                  </div>
                  <SpendBar value={order.amount} maxValue={maxOrderAmount} />
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Campaign engagement memory */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} style={{ ...glass, borderRadius: 20, padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: "rgba(248,113,113,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShieldAlert size={13} color="#f87171" />
            </div>
            <span style={{ fontSize: 10, fontWeight: 900, color: "rgba(255,255,255,0.38)", textTransform: "uppercase", letterSpacing: 1.4 }}>Campaign engagement memory</span>
          </div>
          {customer.campaignRecipients.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <Activity size={28} color="rgba(255,255,255,0.08)" style={{ marginBottom: 10 }} />
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, margin: "0 0 4px" }}>No campaign touches yet.</p>
              <p style={{ color: "rgba(255,255,255,0.18)", fontSize: 11, margin: 0 }}>ARIA can start with the recommended action above.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {customer.campaignRecipients.map(r => {
                const cColor = channelColor[r.campaign.channel] || "#a78bfa";
                const delivered = r.status !== "QUEUED" && r.status !== "FAILED";
                return (
                  <div key={r.id} style={{ background: "rgba(255,255,255,0.035)", borderRadius: 11, padding: "12px 14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 9 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.campaign.name}</span>
                      <span style={{ fontSize: 9, color: cColor, background: `${cColor}14`, border: `1px solid ${cColor}28`, padding: "2px 7px", borderRadius: 4, fontWeight: 800, whiteSpace: "nowrap" }}>{r.campaign.channel}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {[
                        { label: "Delivered", active: delivered,         color: "#34d399" },
                        { label: "Opened",    active: !!r.openedAt,      color: "#a78bfa" },
                        { label: "Clicked",   active: !!r.clickedAt,     color: "#38bdf8" },
                        { label: "Converted", active: !!r.convertedAt,   color: "#fb923c" },
                      ].map(step => (
                        <div key={step.label} style={{ flex: 1, background: step.active ? `${step.color}12` : "rgba(255,255,255,0.03)", border: `1px solid ${step.active ? step.color + "30" : "rgba(255,255,255,0.06)"}`, borderRadius: 7, padding: "5px 6px", textAlign: "center" }}>
                          <div style={{ fontSize: 9, fontWeight: 700, color: step.active ? step.color : "rgba(255,255,255,0.2)", lineHeight: 1 }}>{step.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Spend timeline mini-visualization */}
      {customer.orders.length > 1 && (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} style={{ ...glass, borderRadius: 20, padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: "rgba(167,139,250,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <BarChart3 size={13} color="#a78bfa" />
            </div>
            <span style={{ fontSize: 10, fontWeight: 900, color: "rgba(255,255,255,0.38)", textTransform: "uppercase", letterSpacing: 1.4 }}>Spend timeline</span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginLeft: "auto" }}>Largest: {money(Math.max(...customer.orders.map(o => o.amount)))}</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 60 }}>
            {customer.orders.map(order => {
              const pct = (order.amount / maxOrderAmount) * 100;
              return (
                <div key={order.id} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }} title={`${money(order.amount)} · ${daysAgo(order.createdAt)}`}>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(pct * 0.6, 6)}%` }}
                    transition={{ duration: 0.9, ease: "easeOut", delay: 0.3 }}
                    style={{ width: "100%", background: "linear-gradient(180deg, #7c3aed, #0891b2)", borderRadius: "4px 4px 0 0", minHeight: 4 }}
                  />
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>Oldest</span>
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>Most recent</span>
          </div>
        </motion.div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
