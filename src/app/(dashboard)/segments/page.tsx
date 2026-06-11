"use client";
import { useEffect, useState } from "react";
import { ArrowRight, Target, Sparkles, Plus, Loader2, Users, Zap } from "lucide-react";
import Link from "next/link";

interface Segment {
  id: string; name: string; description: string | null;
  filterRules: Record<string, unknown>;
  aiGenerated: boolean; prompt: string | null; createdAt: string;
  audienceCount: number;
  sampleCustomers: Array<{ id: string; name: string; city: string | null; totalSpent: number }>;
  _count: { campaigns: number };
}

function FilterBadges({ rules }: { rules: Record<string, unknown> }) {
  const badges: string[] = [];
  if (rules.lastOrderDaysAgo) {
    const v = rules.lastOrderDaysAgo as Record<string, number>;
    if (v.gte) badges.push(`Last order ≥ ${v.gte}d ago`);
    if (v.lte) badges.push(`Last order ≤ ${v.lte}d ago`);
  }
  if (rules.totalSpent) {
    const v = rules.totalSpent as Record<string, number>;
    if (v.gte) badges.push(`Spent ≥ ₹${v.gte.toLocaleString()}`);
  }
  if (rules.orderCount) {
    const v = rules.orderCount as Record<string, number>;
    if (v.lte) badges.push(`Orders ≤ ${v.lte}`);
    if (v.gte) badges.push(`Orders ≥ ${v.gte}`);
  }
  if (rules.city) badges.push(`City: ${rules.city}`);
  if (rules.tags) badges.push(`Tag: ${(rules.tags as { hasSome: string[] })?.hasSome?.join(", ") || "—"}`);

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 10 }}>
      {badges.map(b => (
        <span key={b} style={{
          fontSize: 10, fontWeight: 500, padding: "3px 8px", borderRadius: 4,
          background: "rgba(56,189,248,0.1)", color: "#38bdf8",
          border: "1px solid rgba(56,189,248,0.18)",
        }}>{b}</span>
      ))}
      {badges.length === 0 && (
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", fontStyle: "italic" }}>No filters defined</span>
      )}
    </div>
  );
}

const CARD_ACCENTS = ["#a78bfa", "#38bdf8", "#34d399", "#fb923c", "#f472b6", "#facc15"];

export default function SegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/segments").then(r => r.json()).then(d => { setSegments(d); setLoading(false); });
  }, []);

  function createCampaignFromSegment(segment: Segment) {
    sessionStorage.setItem("aria_segment_context", JSON.stringify({
      id: segment.id,
      name: segment.name,
      description: segment.description,
      audienceCount: segment.audienceCount,
    }));
    sessionStorage.setItem(
      "aria_prefill",
      `Create a personalized campaign for the "${segment.name}" segment`
    );
    window.location.href = "/command";
  }

  return (
    <div style={{ padding: "36px 40px 60px", maxWidth: 1080, margin: "0 auto" }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: "0 0 5px" }}>Segments</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: 0 }}>
            {segments.length} audience group{segments.length !== 1 ? "s" : ""} · {segments.reduce((sum, s) => sum + s.audienceCount, 0).toLocaleString()} matched shoppers
          </p>
        </div>
        <Link href="/command" style={{
          display: "inline-flex", alignItems: "center", gap: 7, textDecoration: "none",
          background: "linear-gradient(135deg, #7c3aed, #0891b2)",
          color: "#fff", fontSize: 13, fontWeight: 600,
          padding: "9px 16px", borderRadius: 10,
          boxShadow: "0 2px 12px rgba(124,58,237,0.3)",
        }}>
          <Plus size={14} /> New with AI
        </Link>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
          <Loader2 size={22} color="#a78bfa" style={{ animation: "spin 1s linear infinite" }} />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {segments.map((s, i) => {
            const accent = CARD_ACCENTS[i % CARD_ACCENTS.length];
            return (
              <div key={s.id} style={{
                background: "#0d0d1a",
                border: "1px solid #1a1a2e",
                borderTop: `3px solid ${accent}`,
                borderRadius: 14, padding: "20px",
                transition: "border-color 0.15s",
              }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = `${accent}60`}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderTopColor = accent;
                  el.style.borderRightColor = "#1a1a2e";
                  el.style.borderBottomColor = "#1a1a2e";
                  el.style.borderLeftColor = "#1a1a2e";
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 9,
                    background: `${accent}18`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Target size={16} color={accent} />
                  </div>
                  {s.aiGenerated && (
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      fontSize: 9, fontWeight: 700, background: "rgba(124,58,237,0.2)",
                      color: "#a78bfa", padding: "3px 7px", borderRadius: 4,
                      letterSpacing: 0.6, textTransform: "uppercase",
                    }}>
                      <Sparkles size={8} /> AI
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: 14, fontWeight: 600, color: "#fff", margin: "0 0 4px" }}>{s.name}</h3>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", margin: 0, lineHeight: 1.5 }}>
                  {s.description || "No description"}
                </p>

                <FilterBadges rules={s.filterRules} />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 14 }}>
                  <div style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.16)", borderRadius: 9, padding: "10px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <Users size={12} color="#a78bfa" />
                      <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.32)", textTransform: "uppercase", letterSpacing: 0.8 }}>Audience</span>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#c4b5fd", lineHeight: 1 }}>{s.audienceCount.toLocaleString()}</div>
                  </div>
                  <div style={{ background: "rgba(52,211,153,0.07)", border: "1px solid rgba(52,211,153,0.14)", borderRadius: 9, padding: "10px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <Zap size={12} color="#34d399" />
                      <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.32)", textTransform: "uppercase", letterSpacing: 0.8 }}>Used In</span>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#86efac", lineHeight: 1 }}>{s._count.campaigns}</div>
                  </div>
                </div>

                {s.sampleCustomers.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.22)", margin: "0 0 7px", textTransform: "uppercase", letterSpacing: 0.8 }}>Top matched shoppers</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {s.sampleCustomers.map(customer => (
                        <div key={customer.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{customer.name}</span>
                          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", whiteSpace: "nowrap" }}>{customer.city || "Unknown"} · ₹{customer.totalSpent.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {s.prompt && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #16162a" }}>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 0.8 }}>AI Prompt</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", margin: 0, fontStyle: "italic", lineHeight: 1.45 }}>
                      "{s.prompt.length > 70 ? s.prompt.slice(0, 70) + "…" : s.prompt}"
                    </p>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, paddingTop: 14, borderTop: "1px solid #12121e" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <Zap size={11} color="rgba(255,255,255,0.25)" />
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.28)" }}>{s._count.campaigns} campaign{s._count.campaigns !== 1 ? "s" : ""}</span>
                  </div>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>
                    {new Date(s.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                </div>

                <button
                  onClick={() => createCampaignFromSegment(s)}
                  style={{
                    width: "100%", marginTop: 14,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                    background: `${accent}18`, border: `1px solid ${accent}35`,
                    color: accent, fontSize: 12, fontWeight: 700,
                    padding: "9px 12px", borderRadius: 9, cursor: "pointer",
                  }}
                >
                  Create campaign <ArrowRight size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
