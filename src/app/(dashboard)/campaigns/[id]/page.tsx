"use client";
import { useEffect, useState, use } from "react";
import {
  ArrowLeft, Loader2, TrendingUp, Mail, MousePointer,
  CheckCircle, XCircle, ShoppingBag, Clock, Zap, Users, Trash2
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "@/components/ui/toast";

interface Analytics {
  total: number; delivered: number; opened: number;
  clicked: number; converted: number; failed: number; queued: number;
  insight: string; bottleneck: string; nextBestAction: string;
  recentEvents: Array<{ id: string; event: string; timestamp: string; customerName: string; customerCity: string | null }>;
  rates: { deliveryRate: string; openRate: string; clickRate: string; conversionRate: string };
}

interface Campaign {
  id: string; name: string; status: string; channel: string;
  aiGenerated: boolean; sentAt: string | null; messageBody: string;
  subject: string | null; segment: { name: string } | null;
  _count: { recipients: number };
}

const CH: Record<string, { color: string; label: string; bg: string }> = {
  EMAIL:    { color: "#a78bfa", label: "Email",     bg: "rgba(167,139,250,0.12)" },
  SMS:      { color: "#38bdf8", label: "SMS",       bg: "rgba(56,189,248,0.12)" },
  WHATSAPP: { color: "#34d399", label: "WhatsApp",  bg: "rgba(52,211,153,0.12)" },
  RCS:      { color: "#fb923c", label: "RCS",       bg: "rgba(251,146,60,0.12)" },
};

const STATUS_THEME: Record<string, { color: string; bg: string; border: string; label: string }> = {
  SENT:    { color: "#34d399", bg: "rgba(52,211,153,0.1)",   border: "rgba(52,211,153,0.25)",   label: "Sent" },
  SENDING: { color: "#38bdf8", bg: "rgba(56,189,248,0.1)",   border: "rgba(56,189,248,0.25)",   label: "Sending" },
  DRAFT:   { color: "rgba(255,255,255,0.35)", bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)", label: "Draft" },
  FAILED:  { color: "#f87171", bg: "rgba(248,113,113,0.1)",  border: "rgba(248,113,113,0.25)",  label: "Failed" },
  PAUSED:  { color: "#fb923c", bg: "rgba(251,146,60,0.1)",   border: "rgba(251,146,60,0.25)",   label: "Paused" },
};

function Ticker({ value, color }: { value: number; color: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const diff = value - display;
    if (diff === 0) return;
    const step = Math.ceil(Math.abs(diff) / 8);
    const timer = setTimeout(() => setDisplay(d => {
      if (Math.abs(value - d) <= step) return value;
      return d + (diff > 0 ? step : -step);
    }), 40);
    return () => clearTimeout(timer);
  }, [value, display]);
  return <span style={{ color, fontVariantNumeric: "tabular-nums" }}>{display.toLocaleString()}</span>;
}

function RateRing({ pct, color, size = 64 }: { pct: number; color: string; size?: number }) {
  const r = size / 2 - 6;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={5} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={5}
        strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 1.2s ease", strokeLinecap: "round" }}
      />
    </svg>
  );
}

export default function CampaignDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setShowDeleteModal(false);
      }
    }
    if (showDeleteModal) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showDeleteModal]);

  async function confirmDelete() {
    setShowDeleteModal(false);
    toast.delete("Campaign deleted");
    window.location.href = "/campaigns";

    try {
      const res = await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      const data = await res.json();
      if (!data.success) throw new Error("Delete failed");
    } catch (err) {
      toast.error("Failed to delete. Please try again.");
    }
  }

  async function handleTogglePause() {
    if (!campaign) return;
    const nextStatus = campaign.status === "SENDING" ? "PAUSED" : "SENDING";

    // Optimistic update
    setCampaign(prev => prev ? { ...prev, status: nextStatus } : null);

    try {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error("Update failed");
      const data = await res.json();
      if (!data.success) throw new Error("Update failed");
      toast.success(nextStatus === "PAUSED" ? "Campaign paused" : "Campaign resumed");
    } catch (err) {
      toast.error("Failed to update status. Please try again.");
      // Revert optimistic update
      setCampaign(prev => prev ? { ...prev, status: campaign.status } : null);
    }
  }

  useEffect(() => {
    fetch("/api/campaigns")
      .then(r => r.json())
      .then((list: Campaign[]) => {
        const found = list.find(c => c.id === id);
        if (found) setCampaign(found);
      });
  }, [id]);

  useEffect(() => {
    const load = () =>
      fetch(`/api/campaigns/${id}/analytics`)
        .then(r => r.json())
        .then(d => { setAnalytics(d); setLoading(false); });
    load();
    const iv = setInterval(() => { load(); setTick(t => t + 1); }, 3000);
    return () => clearInterval(iv);
  }, [id]);

  const ch = campaign ? (CH[campaign.channel] || CH.EMAIL) : CH.EMAIL;
  const processed = analytics ? analytics.total - analytics.queued : 0;
  const processPct = analytics?.total ? Math.round((processed / analytics.total) * 100) : 0;

  const FUNNEL = analytics ? [
    { label: "Sent",       value: analytics.total,     color: "rgba(255,255,255,0.5)", bg: "rgba(255,255,255,0.08)" },
    { label: "Delivered",  value: analytics.delivered,  color: "#34d399",   bg: "rgba(52,211,153,0.15)" },
    { label: "Opened",     value: analytics.opened,     color: "#a78bfa",   bg: "rgba(167,139,250,0.15)" },
    { label: "Clicked",    value: analytics.clicked,    color: "#38bdf8",   bg: "rgba(56,189,248,0.15)" },
    { label: "Converted",  value: analytics.converted,  color: "#fb923c",   bg: "rgba(251,146,60,0.15)" },
  ] : [];

  const METRICS = analytics ? [
    { label: "Delivery", rate: analytics.rates.deliveryRate, color: "#34d399",  icon: CheckCircle, value: analytics.delivered },
    { label: "Open",     rate: analytics.rates.openRate,     color: "#a78bfa",  icon: Mail,         value: analytics.opened },
    { label: "Click",    rate: analytics.rates.clickRate,    color: "#38bdf8",  icon: MousePointer, value: analytics.clicked },
    { label: "Convert",  rate: analytics.rates.conversionRate, color: "#fb923c", icon: ShoppingBag, value: analytics.converted },
  ] : [];

  return (
    <div style={{ padding: "36px 40px 60px", maxWidth: 1080, margin: "0 auto" }}>

      {/* Back nav */}
      <Link href="/campaigns" style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        color: "rgba(255,255,255,0.3)", textDecoration: "none",
        fontSize: 13, marginBottom: 24, transition: "color 0.1s",
      }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.65)"}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.3)"}
      >
        <ArrowLeft size={14} /> Back to Campaigns
      </Link>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: 0 }}>
              {campaign?.name || "Campaign Analytics"}
            </h1>
            {campaign?.aiGenerated && (
              <span style={{ fontSize: 9, fontWeight: 700, background: "rgba(124,58,237,0.22)", color: "#a78bfa", padding: "3px 7px", borderRadius: 4, letterSpacing: 0.8, textTransform: "uppercase" }}>AI</span>
            )}
            {campaign?.channel && (
              <span style={{ fontSize: 11, fontWeight: 600, background: ch.bg, color: ch.color, padding: "3px 10px", borderRadius: 6 }}>
                {ch.label}
              </span>
            )}
            {campaign?.status && (
              <span style={{
                fontSize: 11,
                fontWeight: 600,
                background: STATUS_THEME[campaign.status]?.bg || "rgba(255,255,255,0.05)",
                color: STATUS_THEME[campaign.status]?.color || "#fff",
                border: `1px solid ${STATUS_THEME[campaign.status]?.border || "rgba(255,255,255,0.1)"}`,
                padding: "3px 10px",
                borderRadius: 6
              }}>
                {STATUS_THEME[campaign.status]?.label || campaign.status}
              </span>
            )}
          </div>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.32)", margin: 0 }}>
            {campaign?.segment?.name || "All customers"}
            {campaign?._count.recipients ? ` · ${campaign._count.recipients.toLocaleString()} recipients` : ""}
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Live badge */}
          <div style={{
            display: "flex", alignItems: "center", gap: 7,
            background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)",
            borderRadius: 20, padding: "6px 14px",
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", animation: "livePulse 2s ease-in-out infinite" }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "#34d399" }}>Live · updates every 3s</span>
          </div>

          {campaign?.status === "SENDING" && (
            <button
              onClick={handleTogglePause}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(251, 146, 60, 0.1)",
                border: "1px solid rgba(251, 146, 60, 0.4)",
                color: "#fb923c",
                fontSize: 11,
                fontWeight: 700,
                padding: "6px 14px",
                borderRadius: 20,
                cursor: "pointer",
                transition: "all 0.12s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(251, 146, 60, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(251, 146, 60, 0.1)";
              }}
            >
              Pause campaign
            </button>
          )}

          {campaign?.status === "PAUSED" && (
            <button
              onClick={handleTogglePause}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(52, 211, 153, 0.1)",
                border: "1px solid rgba(52, 211, 153, 0.4)",
                color: "#34d399",
                fontSize: 11,
                fontWeight: 700,
                padding: "6px 14px",
                borderRadius: 20,
                cursor: "pointer",
                transition: "all 0.12s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(52, 211, 153, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(52, 211, 153, 0.1)";
              }}
            >
              Resume campaign
            </button>
          )}

          {/* Delete campaign button */}
          <button
            onClick={() => setShowDeleteModal(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "transparent",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              color: "#f87171",
              fontSize: 11,
              fontWeight: 700,
              padding: "6px 14px",
              borderRadius: 20,
              cursor: "pointer",
              transition: "all 0.12s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.08)";
              e.currentTarget.style.borderColor = "#f87171";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.4)";
            }}
          >
            <Trash2 size={12} /> Delete campaign
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
          <div style={{ textAlign: "center" }}>
            <Loader2 size={28} color="#a78bfa" style={{ animation: "spin 1s linear infinite", display: "block", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", margin: 0 }}>Loading campaign data...</p>
          </div>
        </div>
      ) : analytics && (
        <>
          {/* Progress hero card */}
          <div style={{
            background: "#0d0d1a", border: "1px solid #1a1a2e",
            borderRadius: 16, padding: "28px 32px", marginBottom: 16,
            position: "relative", overflow: "hidden",
          }}>
            {/* Subtle background glow */}
            <div style={{
              position: "absolute", top: -60, right: -60, width: 200, height: 200,
              background: ch.color, opacity: 0.04, borderRadius: "50%", filter: "blur(40px)",
              pointerEvents: "none",
            }} />

            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 8 }}>
                  Campaign Progress
                </p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                  <span style={{ fontSize: 48, fontWeight: 700, color: "#fff", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                    {processPct}%
                  </span>
                  <span style={{ fontSize: 14, color: "rgba(255,255,255,0.35)" }}>processed</span>
                </div>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginTop: 6 }}>
                  {processed.toLocaleString()} of {analytics.total.toLocaleString()} messages dispatched
                </p>
              </div>
              <div style={{ display: "flex", gap: 24 }}>
                {[
                  { label: "In Queue",  value: analytics.queued,  color: "rgba(255,255,255,0.4)" },
                  { label: "Failed",    value: analytics.failed,  color: "#f87171" },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color, lineHeight: 1 }}>
                      <Ticker value={value} color={color} />
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", marginTop: 4 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress track */}
            <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 6, overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${processPct}%`,
                background: `linear-gradient(90deg, #7c3aed, ${ch.color})`,
                borderRadius: 6, transition: "width 1.2s ease",
              }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>Started</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>Complete</span>
            </div>
          </div>

          {/* ARIA readout */}
          <div style={{
            background: "rgba(124,58,237,0.07)",
            border: "1px solid rgba(124,58,237,0.18)",
            borderRadius: 14,
            padding: "18px 22px",
            marginBottom: 16,
            display: "grid",
            gridTemplateColumns: "1.5fr 0.8fr 1fr",
            gap: 18,
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                <Zap size={14} color="#a78bfa" />
                <span style={{ fontSize: 10, fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: 1.4 }}>ARIA readout</span>
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.62)", margin: 0, lineHeight: 1.55 }}>{analytics.insight}</p>
            </div>
            <div style={{ borderLeft: "1px solid rgba(255,255,255,0.08)", paddingLeft: 18 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: 1.2, margin: "0 0 6px" }}>Bottleneck</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", margin: 0 }}>{analytics.bottleneck}</p>
            </div>
            <div style={{ borderLeft: "1px solid rgba(255,255,255,0.08)", paddingLeft: 18 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: 1.2, margin: "0 0 6px" }}>Next action</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: 0, lineHeight: 1.5 }}>{analytics.nextBestAction}</p>
            </div>
          </div>

          {/* Rate rings row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
            {METRICS.map(({ label, rate, color, icon: Icon, value }) => {
              const pct = parseFloat(rate);
              return (
                <div key={label} style={{ background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 14, padding: "20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ position: "relative", marginBottom: 12 }}>
                    <RateRing pct={pct} color={color} size={72} />
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon size={16} color={color} />
                    </div>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1, marginBottom: 4 }}>
                    {rate}%
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 6 }}>
                    {label} Rate
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
                    <Ticker value={value} color="rgba(255,255,255,0.35)" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Funnel + Message preview */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 12, marginBottom: 12 }}>

            {/* Funnel */}
            <div style={{ background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 14, padding: "22px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 22 }}>
                <TrendingUp size={14} color="rgba(255,255,255,0.4)" />
                <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1.4 }}>
                  Engagement Funnel
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {FUNNEL.map(({ label, value, color, bg }) => {
                  const pct = analytics.total > 0 ? (value / analytics.total) * 100 : 0;
                  return (
                    <div key={label}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{label}</span>
                        </div>
                        <div style={{ display: "flex", gap: 10 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color, fontVariantNumeric: "tabular-nums" }}>
                            <Ticker value={value} color={color} />
                          </span>
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.22)", fontFamily: "monospace", width: 42, textAlign: "right" }}>
                            {pct.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div style={{ height: 28, background: "rgba(255,255,255,0.04)", borderRadius: 6, overflow: "hidden" }}>
                        <div style={{
                          height: "100%",
                          width: `${Math.max(pct > 0 ? pct : 0, pct > 0 ? 1.5 : 0)}%`,
                          background: bg, borderRadius: 6,
                          transition: "width 1.2s ease",
                          borderLeft: `3px solid ${color}`,
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Message preview + failed */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

              {/* Message preview */}
              <div style={{ background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 14, padding: "18px 20px", flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
                  <Mail size={13} color="rgba(255,255,255,0.4)" />
                  <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1.4 }}>
                    Message Sent
                  </span>
                </div>
                {campaign?.subject && (
                  <div style={{ marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid #16162a" }}>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", margin: "0 0 3px", textTransform: "uppercase", letterSpacing: 0.8 }}>Subject</p>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.72)", margin: 0 }}>{campaign.subject}</p>
                  </div>
                )}
                <div style={{ background: "rgba(255,255,255,0.025)", borderRadius: 8, padding: "12px 14px" }}>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", margin: 0, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
                    {campaign?.messageBody || "—"}
                  </p>
                </div>
              </div>

              {/* Failed count */}
              {analytics.failed > 0 && (
                <div style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.15)", borderRadius: 14, padding: "14px 18px", display: "flex", alignItems: "center", gap: 10 }}>
                  <XCircle size={16} color="#f87171" />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#f87171", margin: 0 }}>{analytics.failed} Failed</p>
                    <p style={{ fontSize: 11, color: "rgba(248,113,113,0.6)", margin: 0 }}>Carrier rejections</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Audience Cohort performance card */}
          <div style={{ background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 14, padding: "20px 22px", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 16 }}>
              <Users size={14} color="#38bdf8" />
              <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1.4 }}>
                Audience Cohort Performance
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {[
                { cohort: "VIP Buyers", reach: "Top 15% spenders", conversion: "12.4%", engagement: "High", color: "#fbbf24" },
                { cohort: "Regular Shoppers", reach: "Mainstream audience", conversion: "4.8%", engagement: "Moderate", color: "#a78bfa" },
                { cohort: "At-Risk Cohort", reach: "Idle 45+ days", conversion: "1.2%", engagement: "Low", color: "#f87171" }
              ].map(c => (
                <div key={c.cohort} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, padding: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: c.color }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{c.cohort}</span>
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginBottom: 8 }}>{c.reach}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 0.5 }}>Conversion</div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: c.color }}>{c.conversion}</div>
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 800, color: c.color, background: `${c.color}15`, padding: "2px 6px", borderRadius: 4 }}>
                      {c.engagement}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 14, padding: "20px 22px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <Zap size={14} color="#a78bfa" />
                <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1.4 }}>
                  Channel orchestration stream
                </span>
              </div>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.24)" }}>latest simulated provider callbacks</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
              {analytics.recentEvents.length === 0 ? (
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: 0 }}>No delivery callbacks have arrived yet.</p>
              ) : analytics.recentEvents.map((event) => {
                const eventColor = event.event === "FAILED" ? "#f87171" : event.event === "CONVERTED" ? "#fb923c" : event.event === "CLICKED" ? "#38bdf8" : event.event === "OPENED" ? "#a78bfa" : "#34d399";
                return (
                  <div key={event.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.055)", borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: eventColor, boxShadow: `0 0 18px ${eventColor}` }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{event.event} · {event.customerName}</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", marginTop: 2 }}>{event.customerCity || "Unknown city"} · {new Date(event.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
      {/* Confirmation Modal */}
      {showDeleteModal && campaign && (
        <div
          onClick={() => setShowDeleteModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#0f0f1a",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: 24,
              padding: 24,
              width: "90%",
              maxWidth: 400,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "rgba(239, 68, 68, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
                color: "#ef4444",
              }}
            >
              <Trash2 size={22} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#fff", margin: "0 0 8px" }}>
              Delete this campaign?
            </h3>
            <p style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.5)", margin: "0 0 24px", lineHeight: 1.5 }}>
              This will permanently remove <strong style={{ color: "#fff" }}>&ldquo;{campaign.name}&rdquo;</strong> and all its delivery data. This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 10, width: "100%" }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "rgba(255, 255, 255, 0.8)",
                  borderRadius: 12,
                  padding: "12px 16px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.12s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  flex: 1,
                  background: "#ef4444",
                  border: "none",
                  color: "#fff",
                  borderRadius: 12,
                  padding: "12px 16px",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: "pointer",
                  transition: "all 0.12s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#dc2626"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#ef4444"}
              >
                Yes, delete
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.85); }
        }
      `}</style>
    </div>
  );
}
