"use client";
import { useEffect, useState, use } from "react";
import { ArrowLeft, Loader2, TrendingUp, Mail, MousePointer, CheckCircle, XCircle, ShoppingBag, Clock } from "lucide-react";
import Link from "next/link";

interface Campaign {
  id: string; name: string; status: string; channel: string;
  sentAt: string | null; segment: { name: string } | null;
  _count: { recipients: number };
}

interface Analytics {
  total: number; delivered: number; opened: number;
  clicked: number; converted: number; failed: number; queued: number;
  rates: { deliveryRate: string; openRate: string; clickRate: string; conversionRate: string };
}

const CH_COLOR: Record<string, string> = {
  EMAIL: "#a78bfa", SMS: "#38bdf8", WHATSAPP: "#34d399", RCS: "#fb923c"
};

export default function CampaignDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load campaign details
    fetch("/api/campaigns").then(r => r.json()).then((campaigns: Campaign[]) => {
      const found = campaigns.find(c => c.id === id);
      if (found) setCampaign(found);
    });

    const load = () => fetch(`/api/campaigns/${id}/analytics`).then(r => r.json()).then(setAnalytics);
    load().finally(() => setLoading(false));
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [id]);

  const stats = analytics ? [
    { label: "Delivered", value: analytics.delivered, rate: analytics.rates.deliveryRate + "%", icon: CheckCircle, color: "#34d399", bg: "rgba(52,211,153,0.1)", border: "rgba(52,211,153,0.2)" },
    { label: "Opened", value: analytics.opened, rate: analytics.rates.openRate + "%", icon: Mail, color: "#a78bfa", bg: "rgba(167,139,250,0.1)", border: "rgba(167,139,250,0.2)" },
    { label: "Clicked", value: analytics.clicked, rate: analytics.rates.clickRate + "%", icon: MousePointer, color: "#38bdf8", bg: "rgba(56,189,248,0.1)", border: "rgba(56,189,248,0.2)" },
    { label: "Converted", value: analytics.converted, rate: analytics.rates.conversionRate + "%", icon: ShoppingBag, color: "#fb923c", bg: "rgba(251,146,60,0.1)", border: "rgba(251,146,60,0.2)" },
    { label: "Failed", value: analytics.failed, rate: analytics.total > 0 ? ((analytics.failed / analytics.total) * 100).toFixed(1) + "%" : "0%", icon: XCircle, color: "#f87171", bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.2)" },
  ] : [];

  return (
    <div style={{ padding: "40px", maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <Link href="/campaigns" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.35)", textDecoration: "none", fontSize: 13, marginBottom: 20 }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.7)"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.35)"}>
          <ArrowLeft size={14} /> Back to Campaigns
        </Link>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff" }}>
                {campaign?.name || "Campaign Analytics"}
              </h1>
              {campaign?.channel && (
                <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: "rgba(167,139,250,0.15)", color: CH_COLOR[campaign.channel], border: "1px solid rgba(167,139,250,0.2)" }}>
                  {campaign.channel}
                </span>
              )}
            </div>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>
              {campaign?.segment?.name || "All customers"} · {campaign?._count.recipients || 0} recipients
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: 20, padding: "6px 14px" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 12, color: "#34d399", fontWeight: 500 }}>Live · updates every 3s</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
          <Loader2 size={24} color="#a78bfa" style={{ animation: "spin 1s linear infinite" }} />
        </div>
      ) : analytics ? (
        <>
          {/* Progress Overview */}
          <div style={{ background: "#0f0f1a", border: "1px solid #1e1e30", borderRadius: 16, padding: 24, marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
              <div>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>Total Recipients</p>
                <p style={{ fontSize: 40, fontWeight: 700, color: "#fff", lineHeight: 1 }}>{analytics.total.toLocaleString()}</p>
              </div>
              <div style={{ display: "flex", gap: 24 }}>
                {[
                  { label: "Queued", value: analytics.queued, color: "rgba(255,255,255,0.3)" },
                  { label: "Processing", value: analytics.total - analytics.queued - analytics.failed, color: "#38bdf8" },
                  { label: "Failed", value: analytics.failed, color: "#f87171" },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 20, fontWeight: 700, color }}>{value}</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ height: 8, background: "rgba(255,255,255,0.05)", borderRadius: 8, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: analytics.total > 0 ? `${((analytics.total - analytics.queued) / analytics.total) * 100}%` : "0%",
                background: "linear-gradient(90deg, #8b5cf6, #06b6d4)",
                borderRadius: 8, transition: "width 1s ease"
              }} />
            </div>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 8 }}>
              {analytics.total > 0 ? Math.round(((analytics.total - analytics.queued) / analytics.total) * 100) : 0}% processed
            </p>
          </div>

          {/* Stat Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 20 }}>
            {stats.map(({ label, value, rate, icon: Icon, color, bg, border }) => (
              <div key={label} style={{ background: "#0f0f1a", border: `1px solid ${border}`, borderRadius: 16, padding: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                  <Icon size={16} color={color} />
                </div>
                <p style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{value.toLocaleString()}</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>{label}</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 6, fontFamily: "monospace" }}>{rate} rate</p>
              </div>
            ))}
          </div>

          {/* Funnel */}
          <div style={{ background: "#0f0f1a", border: "1px solid #1e1e30", borderRadius: 16, padding: 24 }}>
            <h3 style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
              <TrendingUp size={14} /> Engagement Funnel
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "Sent", value: analytics.total, color: "rgba(255,255,255,0.2)", text: "#fff" },
                { label: "Delivered", value: analytics.delivered, color: "linear-gradient(90deg,#34d399,#059669)", text: "#34d399" },
                { label: "Opened", value: analytics.opened, color: "linear-gradient(90deg,#a78bfa,#7c3aed)", text: "#a78bfa" },
                { label: "Clicked", value: analytics.clicked, color: "linear-gradient(90deg,#38bdf8,#0891b2)", text: "#38bdf8" },
                { label: "Converted", value: analytics.converted, color: "linear-gradient(90deg,#fb923c,#ea580c)", text: "#fb923c" },
              ].map(({ label, value, color, text }) => {
                const pct = analytics.total > 0 ? (value / analytics.total) * 100 : 0;
                return (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", width: 72, textAlign: "right", flexShrink: 0 }}>{label}</p>
                    <div style={{ flex: 1, height: 32, background: "rgba(255,255,255,0.04)", borderRadius: 8, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", width: `${Math.max(pct > 0 ? pct : 0, pct > 0 ? 2 : 0)}%`,
                        background: color, borderRadius: 8, transition: "width 1s ease",
                        display: "flex", alignItems: "center", paddingLeft: 12
                      }}>
                        {value > 0 && <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{value.toLocaleString()}</span>}
                      </div>
                    </div>
                    <p style={{ fontSize: 12, color: text, width: 44, textAlign: "right", fontFamily: "monospace", flexShrink: 0 }}>{pct.toFixed(1)}%</p>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.2)" }}>
          <Clock size={40} style={{ margin: "0 auto 16px" }} />
          <p>No data yet — campaign may still be processing</p>
        </div>
      )}
    </div>
  );
}