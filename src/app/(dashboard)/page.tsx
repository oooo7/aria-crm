"use client";
import { useEffect, useState } from "react";
import { Users, Megaphone, TrendingUp, MousePointer, ArrowRight, Sparkles, Zap, Clock } from "lucide-react";
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
  recentCampaigns: Array<{
    id: string; name: string; status: string; channel: string;
    aiGenerated: boolean; createdAt: string;
    _count: { recipients: number };
  }>;
  topCities: Array<{ city: string; count: number }>;
}

const STATUS: Record<string, { color: string; bg: string; dot: string }> = {
  SENT:    { color: "#34d399", bg: "rgba(52,211,153,0.1)",  dot: "#34d399" },
  SENDING: { color: "#38bdf8", bg: "rgba(56,189,248,0.1)",  dot: "#38bdf8" },
  DRAFT:   { color: "rgba(255,255,255,0.3)", bg: "rgba(255,255,255,0.06)", dot: "rgba(255,255,255,0.3)" },
  FAILED:  { color: "#f87171", bg: "rgba(248,113,113,0.1)", dot: "#f87171" },
};

const CH: Record<string, string> = {
  EMAIL: "#a78bfa", SMS: "#38bdf8", WHATSAPP: "#34d399", RCS: "#fb923c",
};

function timeAgo(iso: string) {
  const secs = (Date.now() - new Date(iso).getTime()) / 1000;
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

function StatCard({ label, value, icon: Icon, color, delta }: {
  label: string; value: string; icon: React.ElementType; color: string; delta?: string;
}) {
  return (
    <div style={{
      background: "#0d0d1a", border: "1px solid #1a1a2e",
      borderRadius: 14, padding: "20px 22px", position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: -20, right: -20, width: 80, height: 80,
        borderRadius: "50%", background: color, opacity: 0.06, filter: "blur(16px)",
      }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <span style={{
          fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.32)",
          textTransform: "uppercase", letterSpacing: 1.2,
        }}>
          {label}
        </span>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: `${color}18`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={15} color={color} strokeWidth={2} />
        </div>
      </div>
      <div style={{ fontSize: 30, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      {delta && (
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", marginTop: 6 }}>{delta}</div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<Overview | null>(null);

  useEffect(() => {
    fetch("/api/analytics/overview").then(r => r.json()).then(setData);
  }, []);

  if (!data) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", flexDirection: "column", gap: 16 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: "linear-gradient(135deg, #7c3aed, #0891b2)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Sparkles size={22} color="white" />
        </div>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.35)" }}>Loading ARIA...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "36px 40px 60px", maxWidth: 1080, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 36 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff", margin: 0, marginBottom: 5 }}>
            Good morning ✦
          </h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: 0 }}>
            Here's what's happening with Lumora today
          </p>
        </div>
        <Link href="/command" style={{
          display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none",
          background: "linear-gradient(135deg, #7c3aed, #0891b2)",
          color: "#fff", fontSize: 13, fontWeight: 600,
          padding: "9px 18px", borderRadius: 10,
          boxShadow: "0 2px 16px rgba(124,58,237,0.32)",
        }}>
          <Sparkles size={14} /> Ask ARIA
        </Link>
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
        <StatCard label="Total Customers" value={data.totalCustomers.toLocaleString()} icon={Users} color="#a78bfa" delta="200 seeded" />
        <StatCard label="Campaigns" value={data.totalCampaigns.toLocaleString()} icon={Megaphone} color="#38bdf8" delta="All time" />
        <StatCard label="Avg Open Rate" value={`${data.avgOpenRate}%`} icon={TrendingUp} color="#34d399" delta="Across campaigns" />
        <StatCard label="Conversions" value={data.totalConverted.toLocaleString()} icon={MousePointer} color="#fb923c" delta="Total" />
      </div>

      {/* Content grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, marginBottom: 16 }}>

        {/* Recent campaigns */}
        <div style={{ background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 14, padding: "22px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1.4 }}>
              Recent Campaigns
            </span>
            <Link href="/campaigns" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "#a78bfa", textDecoration: "none" }}>
              View all <ArrowRight size={11} />
            </Link>
          </div>

          {data.recentCampaigns.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <Megaphone size={28} color="rgba(255,255,255,0.08)" style={{ margin: "0 auto 10px", display: "block" }} />
              <p style={{ color: "rgba(255,255,255,0.22)", fontSize: 13, margin: 0 }}>No campaigns yet</p>
              <Link href="/command" style={{ color: "#a78bfa", fontSize: 12, textDecoration: "none", display: "block", marginTop: 8 }}>
                Create one with ARIA →
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {data.recentCampaigns.map(c => {
                const s = STATUS[c.status] || STATUS.DRAFT;
                return (
                  <Link key={c.id} href={`/campaigns/${c.id}`} style={{ textDecoration: "none" }}>
                    <div
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 12px", borderRadius: 10, cursor: "pointer", transition: "background 0.1s" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: 9,
                          background: `${CH[c.channel] || "#ffffff"}18`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 12, fontWeight: 700, color: CH[c.channel] || "rgba(255,255,255,0.4)",
                        }}>
                          {c.channel[0]}
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.82)" }}>{c.name}</span>
                            {c.aiGenerated && (
                              <span style={{ fontSize: 9, fontWeight: 700, background: "rgba(124,58,237,0.22)", color: "#a78bfa", padding: "1px 5px", borderRadius: 3, letterSpacing: 0.5, textTransform: "uppercase" }}>AI</span>
                            )}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                            <span style={{ fontSize: 11, color: CH[c.channel] || "rgba(255,255,255,0.3)" }}>{c.channel}</span>
                            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>·</span>
                            <Clock size={10} color="rgba(255,255,255,0.2)" />
                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.22)" }}>{timeAgo(c.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{c._count.recipients.toLocaleString()} sent</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, background: s.bg, borderRadius: 20, padding: "3px 9px" }}>
                          <div style={{ width: 5, height: 5, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
                          <span style={{ fontSize: 11, fontWeight: 600, color: s.color }}>{c.status}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Top cities */}
        <div style={{ background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 14, padding: "22px 24px" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1.4, display: "block", marginBottom: 20 }}>
            Top Cities
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
            {data.topCities.map((c, i) => {
              const pct = Math.round((c.count / (data.topCities[0]?.count || 1)) * 100);
              return (
                <div key={c.city}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", fontFamily: "monospace", width: 14 }}>#{i + 1}</span>
                      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.62)" }}>{c.city}</span>
                    </div>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{c.count}</span>
                  </div>
                  <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", width: `${pct}%`,
                      background: "linear-gradient(90deg, #7c3aed, #0891b2)",
                      borderRadius: 4, transition: "width 0.9s ease",
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Delivery funnel strip */}
      <div style={{ background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 14, padding: "18px 24px", marginBottom: 16 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1.4, display: "block", marginBottom: 16 }}>
          Overall Delivery Funnel
        </span>
        <div style={{ display: "flex", gap: 0 }}>
          {[
            { label: "Sent", value: data.totalSent, color: "rgba(255,255,255,0.15)" },
            { label: "Delivered", value: data.totalDelivered, color: "#059669" },
            { label: "Opened", value: data.totalOpened, color: "#7c3aed" },
            { label: "Converted", value: data.totalConverted, color: "#ea580c" },
          ].map(({ label, value, color }, i) => {
            const base = data.totalSent || 1;
            const pct = ((value / base) * 100).toFixed(1);
            return (
              <div key={label} style={{ flex: 1, padding: "0 16px", borderRight: i < 3 ? "1px solid #1a1a2e" : "none" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: i === 0 ? "rgba(255,255,255,0.6)" : color, lineHeight: 1 }}>{value.toLocaleString()}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>{label}</div>
                <div style={{ fontSize: 10, color: i === 0 ? "rgba(255,255,255,0.2)" : color, marginTop: 4, fontFamily: "monospace", opacity: 0.7 }}>{pct}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI CTA */}
      <div style={{
        background: "rgba(124,58,237,0.07)", border: "1px solid rgba(124,58,237,0.2)",
        borderRadius: 14, padding: "22px 28px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: "linear-gradient(135deg, #7c3aed, #0891b2)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Zap size={20} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#fff", marginBottom: 4 }}>Try ARIA's AI Command</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.38)" }}>
              Type your goal in plain English — ARIA creates the segment, writes the copy, and launches the campaign
            </div>
          </div>
        </div>
        <Link href="/command" style={{
          display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none",
          background: "linear-gradient(135deg, #7c3aed, #0891b2)",
          color: "#fff", fontSize: 13, fontWeight: 600,
          padding: "10px 22px", borderRadius: 10, whiteSpace: "nowrap",
          boxShadow: "0 2px 16px rgba(124,58,237,0.3)",
        }}>
          Open AI Command <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}