"use client";

import type { CSSProperties, ElementType } from "react";
import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock,
  Loader2,
  Megaphone,
  MousePointer,
  Rocket,
  Sparkles,
  Star,
  TrendingDown,
  TrendingUp,
  Upload,
  Users,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { toast } from "@/components/ui/toast";

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
    id: string;
    name: string;
    status: string;
    channel: string;
    aiGenerated: boolean;
    createdAt: string;
    _count: { recipients: number };
  }>;
  topCities: Array<{ city: string; count: number }>;
}

interface Insight {
  type: "warning" | "alert" | "opportunity";
  icon: string;
  title: string;
  body: string;
  action: string;
  prompt: string;
  tag: string;
}

const CARD: CSSProperties = {
  background: "#0d0d1a",
  border: "1px solid #1a1a2e",
  borderRadius: 14,
};

const STATUS: Record<string, { color: string; bg: string; dot: string }> = {
  SENT: { color: "#34d399", bg: "rgba(52,211,153,0.1)", dot: "#34d399" },
  SENDING: { color: "#38bdf8", bg: "rgba(56,189,248,0.1)", dot: "#38bdf8" },
  DRAFT: { color: "rgba(255,255,255,0.35)", bg: "rgba(255,255,255,0.06)", dot: "rgba(255,255,255,0.35)" },
  FAILED: { color: "#f87171", bg: "rgba(248,113,113,0.1)", dot: "#f87171" },
};

const CHANNEL_COLOR: Record<string, string> = {
  EMAIL: "#a78bfa",
  SMS: "#38bdf8",
  WHATSAPP: "#34d399",
  RCS: "#fb923c",
};

const INSIGHT_STYLE: Record<Insight["type"], { border: string; iconBg: string; color: string }> = {
  warning: { border: "#f59e0b", iconBg: "rgba(245,158,11,0.12)", color: "#f59e0b" },
  alert: { border: "#f87171", iconBg: "rgba(248,113,113,0.12)", color: "#f87171" },
  opportunity: { border: "#34d399", iconBg: "rgba(52,211,153,0.12)", color: "#34d399" },
};

const INSIGHT_ICONS: Record<string, ElementType> = {
  alert: AlertTriangle,
  clock: Clock,
  rocket: Rocket,
  star: Star,
  "trending-down": TrendingDown,
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
}

function timeAgo(iso: string) {
  const seconds = (Date.now() - new Date(iso).getTime()) / 1000;
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  delta,
}: {
  label: string;
  value: string;
  icon: ElementType;
  color: string;
  delta: string;
}) {
  return (
    <div style={{ ...CARD, padding: "20px 22px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -24, right: -24, width: 90, height: 90, borderRadius: "50%", background: color, opacity: 0.06, filter: "blur(16px)" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.32)", textTransform: "uppercase", letterSpacing: 1.2 }}>{label}</span>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={15} color={color} />
        </div>
      </div>
      <div style={{ fontSize: 30, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", marginTop: 6 }}>{delta}</div>
    </div>
  );
}

function InsightCard({ insight, onAction }: { insight: Insight; onAction: (prompt: string) => void }) {
  const style = INSIGHT_STYLE[insight.type];
  const Icon = INSIGHT_ICONS[insight.icon] || Sparkles;

  return (
    <div style={{ ...CARD, padding: "16px 18px", borderLeft: `3px solid ${style.border}` }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: style.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={15} color={style.color} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginBottom: 5 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{insight.title}</span>
            <span style={{ fontSize: 9, fontWeight: 800, color: style.color, background: style.iconBg, padding: "2px 6px", borderRadius: 4, textTransform: "uppercase", letterSpacing: 0.6 }}>
              {insight.tag}
            </span>
          </div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.42)", margin: 0, lineHeight: 1.5 }}>{insight.body}</p>
        </div>
      </div>
      <button
        onClick={() => onAction(insight.prompt)}
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", marginTop: 14, background: `${style.border}14`, border: `1px solid ${style.border}30`, color: style.color, fontSize: 12, fontWeight: 700, padding: "8px 12px", borderRadius: 8, cursor: "pointer" }}
      >
        <Sparkles size={12} /> {insight.action} with ARIA
      </button>
    </div>
  );
}

function CsvModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (count: number) => void }) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload() {
    if (!file) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/import", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        toast.error(data.error || "Upload failed");
        return;
      }

      setResult({ created: data.created, skipped: data.skipped });
      onSuccess(data.created);
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.72)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
    >
      <div style={{ ...CARD, width: 500, maxWidth: "100%", padding: "26px 30px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#fff", margin: 0 }}>Import Customers</h2>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.36)", margin: "4px 0 0" }}>Upload a CSV with name, email, city, phone, totalSpent, and orderCount.</p>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.45)", cursor: "pointer", padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {!result ? (
          <>
            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                const dropped = event.dataTransfer.files[0];
                if (dropped?.name.endsWith(".csv")) setFile(dropped);
              }}
              style={{ border: `2px dashed ${dragging ? "#a78bfa" : "#262640"}`, borderRadius: 12, padding: "34px 22px", textAlign: "center", background: dragging ? "rgba(124,58,237,0.08)" : "rgba(255,255,255,0.02)", cursor: "pointer", marginBottom: 16 }}
            >
              <Upload size={28} color={dragging ? "#a78bfa" : "rgba(255,255,255,0.25)"} style={{ marginBottom: 12 }} />
              {file ? (
                <>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#a78bfa", margin: "0 0 4px" }}>{file.name}</p>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.34)", margin: 0 }}>{(file.size / 1024).toFixed(1)} KB selected</p>
                </>
              ) : (
                <>
                  <p style={{ fontSize: 14, color: "rgba(255,255,255,0.58)", margin: "0 0 4px" }}>Drop CSV here or click to browse</p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", margin: 0 }}>Required columns: name, email</p>
                </>
              )}
              <input ref={inputRef} type="file" accept=".csv" style={{ display: "none" }} onChange={(event) => setFile(event.target.files?.[0] || null)} />
            </div>

            <div style={{ background: "rgba(255,255,255,0.025)", borderRadius: 8, padding: "10px 12px", marginBottom: 16 }}>
              <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", margin: "0 0 5px", textTransform: "uppercase", letterSpacing: 1 }}>CSV example</p>
              <code style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
                name,email,phone,city,totalSpent,orderCount<br />
                Priya Sharma,priya@example.com,+919876543210,Mumbai,4500,2
              </code>
            </div>

            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: file && !uploading ? "linear-gradient(135deg, #7c3aed, #0891b2)" : "rgba(255,255,255,0.06)", color: file && !uploading ? "#fff" : "rgba(255,255,255,0.28)", border: "none", cursor: file && !uploading ? "pointer" : "not-allowed", fontSize: 14, fontWeight: 700, padding: "12px 18px", borderRadius: 10 }}
            >
              {uploading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Importing...</> : <><Upload size={16} /> Import Customers</>}
            </button>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "18px 0" }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: "rgba(52,211,153,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <CheckCircle size={26} color="#34d399" />
            </div>
            <p style={{ fontSize: 18, fontWeight: 800, color: "#fff", margin: "0 0 6px" }}>Import Complete</p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.42)", margin: "0 0 20px" }}>{result.created} customers added or updated, {result.skipped} skipped</p>
            <button onClick={onClose} style={{ background: "linear-gradient(135deg, #7c3aed, #0891b2)", color: "#fff", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700, padding: "10px 28px", borderRadius: 10 }}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<Overview | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [showImport, setShowImport] = useState(false);

  async function loadDashboard() {
    const [overviewRes, insightsRes] = await Promise.all([
      fetch("/api/analytics/overview"),
      fetch("/api/ai/insights"),
    ]);

    const overview = await overviewRes.json();
    const insightData = await insightsRes.json();

    setData(overview);
    setInsights(insightData.insights || []);
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  function handleInsightAction(prompt: string) {
    sessionStorage.setItem("aria_prefill", prompt);
    window.location.href = "/command";
  }

  if (!data) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", flexDirection: "column", gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg, #7c3aed, #0891b2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Sparkles size={22} color="white" />
        </div>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.35)" }}>Loading ARIA...</p>
      </div>
    );
  }

  const funnel = [
    { label: "Sent", value: data.totalSent, color: "rgba(255,255,255,0.58)" },
    { label: "Delivered", value: data.totalDelivered, color: "#34d399" },
    { label: "Opened", value: data.totalOpened, color: "#a78bfa" },
    { label: "Converted", value: data.totalConverted, color: "#fb923c" },
  ];

  return (
    <div style={{ padding: "36px 40px 60px", maxWidth: 1120, margin: "0 auto" }}>
      {showImport && (
        <CsvModal
          onClose={() => setShowImport(false)}
          onSuccess={(count) => {
            toast.success(`${count} customers imported`);
            void loadDashboard();
          }}
        />
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 34, gap: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 6px" }}>{getGreeting()}.</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.36)", margin: 0 }}>ARIA is monitoring Lumora's shoppers, campaigns, and revenue opportunities.</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => setShowImport(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.66)", fontSize: 13, fontWeight: 700, padding: "9px 16px", borderRadius: 10, cursor: "pointer" }}
          >
            <Upload size={14} /> Import CSV
          </button>
          <Link href="/command" style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", background: "linear-gradient(135deg, #7c3aed, #0891b2)", color: "#fff", fontSize: 13, fontWeight: 700, padding: "9px 18px", borderRadius: 10, boxShadow: "0 2px 16px rgba(124,58,237,0.32)" }}>
            <Sparkles size={14} /> Ask ARIA
          </Link>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 26 }}>
        <StatCard label="Total Customers" value={data.totalCustomers.toLocaleString()} icon={Users} color="#a78bfa" delta="Shoppers in CRM" />
        <StatCard label="Campaigns" value={data.totalCampaigns.toLocaleString()} icon={Megaphone} color="#38bdf8" delta="All-time campaigns" />
        <StatCard label="Avg Open Rate" value={`${data.avgOpenRate}%`} icon={TrendingUp} color="#34d399" delta="Across delivered messages" />
        <StatCard label="Conversions" value={data.totalConverted.toLocaleString()} icon={MousePointer} color="#fb923c" delta="Attributed orders" />
      </div>

      {insights.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: "linear-gradient(135deg, #7c3aed, #0891b2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sparkles size={11} color="white" />
            </div>
            <span style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.48)", textTransform: "uppercase", letterSpacing: 1.4 }}>ARIA Insights</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.22)" }}>AI-detected opportunities from shopper behavior</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(insights.length, 3)}, 1fr)`, gap: 12 }}>
            {insights.slice(0, 3).map((insight) => (
              <InsightCard key={insight.title} insight={insight} onAction={handleInsightAction} />
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, marginBottom: 16 }}>
        <div style={{ ...CARD, padding: "22px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.42)", textTransform: "uppercase", letterSpacing: 1.4 }}>Recent Campaigns</span>
            <Link href="/campaigns" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "#a78bfa", textDecoration: "none" }}>
              View all <ArrowRight size={11} />
            </Link>
          </div>

          {data.recentCampaigns.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <Megaphone size={28} color="rgba(255,255,255,0.08)" style={{ margin: "0 auto 10px", display: "block" }} />
              <p style={{ color: "rgba(255,255,255,0.24)", fontSize: 13, margin: 0 }}>No campaigns yet</p>
              <Link href="/command" style={{ color: "#a78bfa", fontSize: 12, textDecoration: "none", display: "block", marginTop: 8 }}>Create one with ARIA</Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {data.recentCampaigns.map((campaign) => {
                const status = STATUS[campaign.status] || STATUS.DRAFT;
                const channelColor = CHANNEL_COLOR[campaign.channel] || "rgba(255,255,255,0.4)";

                return (
                  <Link key={campaign.id} href={`/campaigns/${campaign.id}`} style={{ textDecoration: "none" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 12px", borderRadius: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 9, background: `${channelColor}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: channelColor }}>
                          {campaign.channel[0]}
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.82)" }}>{campaign.name}</span>
                            {campaign.aiGenerated && <span style={{ fontSize: 9, fontWeight: 800, background: "rgba(124,58,237,0.22)", color: "#a78bfa", padding: "1px 5px", borderRadius: 3, letterSpacing: 0.5 }}>AI</span>}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                            <span style={{ fontSize: 11, color: channelColor }}>{campaign.channel}</span>
                            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>-</span>
                            <Clock size={10} color="rgba(255,255,255,0.22)" />
                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.24)" }}>{timeAgo(campaign.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{campaign._count.recipients.toLocaleString()} sent</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, background: status.bg, borderRadius: 20, padding: "3px 9px" }}>
                          <div style={{ width: 5, height: 5, borderRadius: "50%", background: status.dot }} />
                          <span style={{ fontSize: 11, fontWeight: 700, color: status.color }}>{campaign.status}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ ...CARD, padding: "22px 24px" }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.42)", textTransform: "uppercase", letterSpacing: 1.4, display: "block", marginBottom: 20 }}>Top Cities</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
            {data.topCities.map((city, index) => {
              const pct = Math.round((city.count / (data.topCities[0]?.count || 1)) * 100);
              return (
                <div key={city.city}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", fontFamily: "monospace", width: 14 }}>#{index + 1}</span>
                      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.62)" }}>{city.city}</span>
                    </div>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{city.count}</span>
                  </div>
                  <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #7c3aed, #0891b2)", borderRadius: 4 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ ...CARD, padding: "18px 24px", marginBottom: 16 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.42)", textTransform: "uppercase", letterSpacing: 1.4, display: "block", marginBottom: 16 }}>Overall Delivery Funnel</span>
        <div style={{ display: "flex" }}>
          {funnel.map((item, index) => {
            const base = data.totalSent || 1;
            const pct = ((item.value / base) * 100).toFixed(1);
            return (
              <div key={item.label} style={{ flex: 1, padding: "0 16px", borderRight: index < funnel.length - 1 ? "1px solid #1a1a2e" : "none" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: item.color, lineHeight: 1 }}>{item.value.toLocaleString()}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>{item.label}</div>
                <div style={{ fontSize: 10, color: item.color, marginTop: 4, fontFamily: "monospace", opacity: 0.75 }}>{pct}%</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ background: "rgba(124,58,237,0.07)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 14, padding: "22px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #7c3aed, #0891b2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Zap size={20} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Try ARIA's AI Command</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.38)" }}>Describe a goal. ARIA builds the audience, writes the copy, picks a channel, and launches.</div>
          </div>
        </div>
        <Link href="/command" style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", background: "linear-gradient(135deg, #7c3aed, #0891b2)", color: "#fff", fontSize: 13, fontWeight: 700, padding: "10px 22px", borderRadius: 10, whiteSpace: "nowrap", boxShadow: "0 2px 16px rgba(124,58,237,0.3)" }}>
          Open AI Command <ArrowRight size={14} />
        </Link>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
