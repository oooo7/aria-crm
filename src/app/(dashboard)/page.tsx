"use client";
import { useEffect, useState } from "react";
import { Users, Megaphone, TrendingUp, MousePointer, ArrowRight, Sparkles, Zap } from "lucide-react";
import Link from "next/link";

interface Overview {
  totalCustomers: number;
  totalCampaigns: number;
  totalRevenue: number;
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalConverted: number;
  avgOpenRate: string;
  recentCampaigns: Array<{ id: string; name: string; status: string; channel: string; createdAt: string; _count: { recipients: number } }>;
  topCities: Array<{ city: string; count: number }>;
}

const S = {
  card: { background: "#0f0f1a", border: "1px solid #1e1e30", borderRadius: 16, padding: 24 } as React.CSSProperties,
  label: { fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase" as const, letterSpacing: 1.5 },
  val: { fontSize: 32, fontWeight: 700, marginTop: 8, lineHeight: 1 },
};

const STATUS_STYLE: Record<string, React.CSSProperties> = {
  SENT: { background: "rgba(52,211,153,0.1)", color: "#34d399", border: "1px solid rgba(52,211,153,0.2)" },
  SENDING: { background: "rgba(56,189,248,0.1)", color: "#38bdf8", border: "1px solid rgba(56,189,248,0.2)" },
  DRAFT: { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.08)" },
  FAILED: { background: "rgba(248,113,113,0.1)", color: "#f87171", border: "1px solid rgba(248,113,113,0.2)" },
};

const CH_COLOR: Record<string, string> = {
  EMAIL: "#a78bfa", SMS: "#38bdf8", WHATSAPP: "#34d399", RCS: "#fb923c"
};

export default function Dashboard() {
  const [data, setData] = useState<Overview | null>(null);

  useEffect(() => {
    fetch("/api/analytics/overview").then(r => r.json()).then(setData);
  }, []);

  if (!data) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg,#8b5cf6,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <Sparkles size={24} color="white" />
        </div>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Loading ARIA...</p>
      </div>
    </div>
  );

  const stats = [
    { label: "Total Customers", value: data.totalCustomers.toLocaleString(), icon: Users, color: "#a78bfa", glow: "rgba(139,92,246,0.15)" },
    { label: "Campaigns Sent", value: data.totalCampaigns.toLocaleString(), icon: Megaphone, color: "#38bdf8", glow: "rgba(56,189,248,0.15)" },
    { label: "Avg Open Rate", value: `${data.avgOpenRate}%`, icon: TrendingUp, color: "#34d399", glow: "rgba(52,211,153,0.15)" },
    { label: "Conversions", value: data.totalConverted.toLocaleString(), icon: MousePointer, color: "#fb923c", glow: "rgba(251,146,60,0.15)" },
  ];

  return (
    <div style={{ padding: "40px 40px 60px", maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 40 }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#fff", marginBottom: 6 }}>
            Good morning ✦
          </div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.35)" }}>
            Here's what's happening with Lumora today
          </div>
        </div>
        <Link href="/command" style={{
          display: "flex", alignItems: "center", gap: 8, textDecoration: "none",
          background: "linear-gradient(135deg, #7c3aed, #0891b2)",
          color: "#fff", fontSize: 13, fontWeight: 600,
          padding: "10px 20px", borderRadius: 12,
          boxShadow: "0 4px 24px rgba(124,58,237,0.3)"
        }}>
          <Sparkles size={15} /> Ask ARIA
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 32 }}>
        {stats.map(({ label, value, icon: Icon, color, glow }) => (
          <div key={label} style={{ ...S.card, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, right: 0, width: 80, height: 80, background: glow, borderRadius: "0 16px 0 80px", filter: "blur(20px)" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={S.label}>{label}</div>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: glow, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={16} color={color} />
              </div>
            </div>
            <div style={{ ...S.val, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, marginBottom: 20 }}>
        {/* Recent Campaigns */}
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: 1.5 }}>Recent Campaigns</div>
            <Link href="/campaigns" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#a78bfa", textDecoration: "none" }}>
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {data.recentCampaigns.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <Megaphone size={32} color="rgba(255,255,255,0.08)" style={{ margin: "0 auto 12px" }} />
              <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 13 }}>No campaigns yet</p>
              <Link href="/command" style={{ color: "#a78bfa", fontSize: 12, textDecoration: "none", display: "block", marginTop: 8 }}>
                Create one with ARIA →
              </Link>
            </div>
          ) : data.recentCampaigns.map(c => (
            <Link key={c.id} href={`/campaigns/${c.id}`} style={{ textDecoration: "none" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: 12, marginBottom: 6, cursor: "pointer", transition: "background 0.15s" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: CH_COLOR[c.channel] || "rgba(255,255,255,0.3)" }}>
                    {c.channel[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.85)" }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: CH_COLOR[c.channel] || "rgba(255,255,255,0.3)", marginTop: 2 }}>{c.channel}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{c._count.recipients} sent</span>
                  <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 600, ...STATUS_STYLE[c.status] }}>
                    {c.status}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Top Cities */}
        <div style={S.card}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 20 }}>Top Cities</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {data.topCities.map(c => {
              const pct = (c.count / (data.topCities[0]?.count || 1)) * 100;
              return (
                <div key={c.city}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>{c.city}</span>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{c.count}</span>
                  </div>
                  <div style={{ height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#8b5cf6,#06b6d4)", borderRadius: 4, transition: "width 0.8s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* AI CTA */}
      <div style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.12), rgba(8,145,178,0.12))", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 20, padding: "28px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg,#7c3aed,#0891b2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap size={22} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 4 }}>Try ARIA's AI Command</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Type your goal in plain English — ARIA creates the segment, writes the copy, and launches the campaign</div>
          </div>
        </div>
        <Link href="/command" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg,#7c3aed,#0891b2)", color: "#fff", fontSize: 13, fontWeight: 600, padding: "12px 24px", borderRadius: 12, whiteSpace: "nowrap", boxShadow: "0 4px 20px rgba(124,58,237,0.35)" }}>
          Open AI Command <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}