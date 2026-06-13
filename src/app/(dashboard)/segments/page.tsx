"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Target, Sparkles, Plus, Loader2, Users, Zap, BarChart3, Brain } from "lucide-react";
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
  if (rules.city) badges.push(`City: ${String(rules.city)}`);
  if (rules.tags) badges.push(`Tag: ${(rules.tags as { hasSome: string[] })?.hasSome?.join(", ") || "—"}`);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 10 }}>
      {badges.map(b => (
        <span key={b} style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 5, background: "rgba(56,189,248,0.09)", color: "#38bdf8", border: "1px solid rgba(56,189,248,0.18)" }}>{b}</span>
      ))}
      {badges.length === 0 && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.18)", fontStyle: "italic" }}>No filters defined</span>}
    </div>
  );
}

const CARD_ACCENTS = ["#a78bfa", "#38bdf8", "#34d399", "#fb923c", "#f472b6", "#facc15", "#818cf8", "#2dd4bf"];

function AudienceDonut({ count, total, color }: { count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.min((count / total) * 100, 100) : 0;
  const r = 18, circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div style={{ position: "relative", width: 44, height: 44 }}>
      <svg width="44" height="44" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="22" cy="22" r={r} stroke="rgba(255,255,255,0.06)" strokeWidth="5" fill="none" />
        <motion.circle cx="22" cy="22" r={r} stroke={color} strokeWidth="5" fill="none"
          strokeLinecap="round" strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color }}>
        {Math.round(pct)}%
      </div>
    </div>
  );
}

export default function SegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCustomers, setTotalCustomers] = useState(200);

  useEffect(() => {
    fetch("/api/segments").then(r => r.json()).then(d => { setSegments(d); setLoading(false); });
    fetch("/api/customers?limit=1").then(r => r.json()).then(d => { if (d.total) setTotalCustomers(d.total); });
  }, []);

  function createCampaignFromSegment(s: Segment) {
    sessionStorage.setItem("aria_segment_context", JSON.stringify({ id: s.id, name: s.name, description: s.description, audienceCount: s.audienceCount }));
    sessionStorage.setItem("aria_prefill", `Create a personalized campaign for the "${s.name}" segment`);
    window.location.href = "/command";
  }

  const totalMatched = segments.reduce((sum, s) => sum + s.audienceCount, 0);

  return (
    <div style={{ padding: "30px 36px 60px", maxWidth: 1140, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(56,189,248,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Target size={14} color="#38bdf8" />
            </div>
            <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.32)", textTransform: "uppercase", letterSpacing: 1.5 }}>Audience Intelligence</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "#fff", margin: "0 0 5px" }}>Segments</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: 0 }}>
            {segments.length} audience group{segments.length !== 1 ? "s" : ""} · {totalMatched.toLocaleString()} matched shoppers across all segments
          </p>
        </div>
        <Link href="/command" style={{ display: "inline-flex", alignItems: "center", gap: 7, textDecoration: "none", background: "linear-gradient(135deg, #7c3aed, #0891b2)", color: "#fff", fontSize: 12, fontWeight: 700, padding: "10px 16px", borderRadius: 11, boxShadow: "0 6px 20px rgba(124,58,237,0.28)" }}>
          <Plus size={14} /> New with AI
        </Link>
      </div>

      {/* Summary strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 11, marginBottom: 22 }}>
        {[
          { label: "Total segments", value: segments.length, icon: Target, color: "#a78bfa" },
          { label: "Total audience", value: totalMatched, icon: Users, color: "#38bdf8" },
          { label: "AI-generated", value: segments.filter(s => s.aiGenerated).length, icon: Brain, color: "#34d399" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}14`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon size={16} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.32)", marginTop: 3 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "80px 0", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <Loader2 size={22} color="#a78bfa" style={{ animation: "spin 1s linear infinite" }} />
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", margin: 0 }}>Loading audience segments...</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {Array.from(new Map(segments.map(s => [s.id, s])).values()).map((s, i) => {
            const accent = CARD_ACCENTS[i % CARD_ACCENTS.length];
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -4, transition: { duration: 0.18 } }}
                style={{ background: "rgba(10,10,22,0.9)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: 22, display: "flex", flexDirection: "column" }}
              >
                {/* Accent top bar */}
                <div style={{ height: 3, background: `linear-gradient(90deg, ${accent}, transparent)`, borderRadius: "3px 3px 0 0", margin: "-22px -22px 18px", borderTopLeftRadius: 18, borderTopRightRadius: 18 }} />

                {/* Card header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 11, background: `${accent}14`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Target size={17} color={accent} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.2 }}>{s.name}</h3>
                      {s.aiGenerated && (
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4, fontSize: 9, fontWeight: 700, background: "rgba(124,58,237,0.18)", color: "#a78bfa", padding: "2px 7px", borderRadius: 4, letterSpacing: 0.6, textTransform: "uppercase", border: "1px solid rgba(124,58,237,0.28)" }}>
                          <Sparkles size={7} /> AI-generated
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Mini donut */}
                  <AudienceDonut count={s.audienceCount} total={totalCustomers} color={accent} />
                </div>

                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "0 0 12px", lineHeight: 1.55 }}>{s.description || "No description"}</p>

                <FilterBadges rules={s.filterRules} />

                {/* Stats row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 14 }}>
                  <div style={{ background: `${accent}0e`, border: `1px solid ${accent}25`, borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
                      <Users size={11} color={accent} />
                      <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 0.8 }}>Audience</span>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: accent, lineHeight: 1 }}>{s.audienceCount.toLocaleString()}</div>
                  </div>
                  <div style={{ background: "rgba(52,211,153,0.07)", border: "1px solid rgba(52,211,153,0.16)", borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
                      <Zap size={11} color="#34d399" />
                      <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 0.8 }}>Campaigns</span>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: "#34d399", lineHeight: 1 }}>{s._count.campaigns}</div>
                  </div>
                </div>

                {/* Sample customers */}
                {s.sampleCustomers.length > 0 && (
                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <p style={{ fontSize: 9, color: "rgba(255,255,255,0.22)", margin: "0 0 9px", textTransform: "uppercase", letterSpacing: 0.9, fontWeight: 700 }}>Top matched shoppers</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {s.sampleCustomers.map((c, ci) => (
                        <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                            <div style={{ width: 22, height: 22, borderRadius: 6, background: `${CARD_ACCENTS[ci % CARD_ACCENTS.length]}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 900, color: CARD_ACCENTS[ci % CARD_ACCENTS.length] }}>
                              {c.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                            </div>
                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.52)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                          </div>
                          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", whiteSpace: "nowrap" }}>{c.city || "—"} · ₹{c.totalSpent.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI prompt */}
                {s.prompt && (
                  <div style={{ marginTop: 12, paddingTop: 11, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <p style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 700 }}>AI Prompt used</p>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.36)", margin: 0, fontStyle: "italic", lineHeight: 1.45 }}>
                      &ldquo;{s.prompt.length > 72 ? s.prompt.slice(0, 72) + "…" : s.prompt}&rdquo;
                    </p>
                  </div>
                )}

                {/* Footer meta */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.22)" }}>
                    Created {new Date(s.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <BarChart3 size={10} color="rgba(255,255,255,0.2)" />
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{s._count.campaigns} campaign{s._count.campaigns !== 1 ? "s" : ""}</span>
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={() => createCampaignFromSegment(s)}
                  style={{ width: "100%", marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: `linear-gradient(135deg, ${accent}22, ${accent}10)`, border: `1px solid ${accent}35`, color: accent, fontSize: 12, fontWeight: 800, padding: "10px 12px", borderRadius: 10, cursor: "pointer", transition: "all 0.15s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${accent}30`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `linear-gradient(135deg, ${accent}22, ${accent}10)`; }}
                >
                  <Sparkles size={12} /> Brief ARIA for this audience <ArrowRight size={12} />
                </button>
              </motion.div>
            );
          })}

          {/* Empty state / add more */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: segments.length * 0.06 + 0.1 }} style={{ background: "rgba(255,255,255,0.015)", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 18, padding: 22, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, minHeight: 220 }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, background: "rgba(124,58,237,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Plus size={20} color="#a78bfa" />
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.5)", margin: "0 0 4px" }}>Create new segment</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", margin: 0 }}>Describe your audience in plain English and ARIA builds the filter rules</p>
            </div>
            <Link href="/command" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.28)", color: "#c4b5fd", fontSize: 12, fontWeight: 700, padding: "8px 14px", borderRadius: 9, textDecoration: "none" }}>
              <Sparkles size={12} /> Use Growth Agent
            </Link>
          </motion.div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
