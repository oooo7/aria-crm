"use client";
import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Megaphone, Plus, ArrowRight, Loader2, Sparkles,
  CheckCircle, Clock, Send, XCircle, Users, Filter, Brain,
  MoreVertical, Trash2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "@/components/ui/toast";

function CampaignRowMenu({ campaign, onDelete }: { campaign: Campaign; onDelete: (c: Campaign) => void }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div ref={menuRef} style={{ position: "relative" }}>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(!open);
        }}
        style={{
          background: "transparent",
          border: "none",
          color: "rgba(255, 255, 255, 0.4)",
          cursor: "pointer",
          padding: 8,
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "#fff";
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "rgba(255, 255, 255, 0.4)";
          e.currentTarget.style.background = "transparent";
        }}
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <div
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          style={{
            position: "absolute",
            right: 0,
            top: "100%",
            marginTop: 4,
            background: "#0f0f1a",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 10,
            padding: 4,
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
            zIndex: 50,
            minWidth: 145,
          }}
        >
          <button
            onClick={() => {
              setOpen(false);
              onDelete(campaign);
            }}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "transparent",
              border: "none",
              color: "#f87171",
              fontSize: 12,
              fontWeight: 600,
              padding: "8px 12px",
              borderRadius: 6,
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.12s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(248, 113, 113, 0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <Trash2 size={13} /> Delete campaign
          </button>
        </div>
      )}
    </div>
  );
}

interface Campaign {
  id: string; name: string; status: string; channel: string;
  aiGenerated: boolean; sentAt: string | null; createdAt: string;
  segment: { name: string } | null;
  _count: { recipients: number };
}

const CH: Record<string, { color: string; bg: string; label: string }> = {
  EMAIL:    { color: "#a78bfa", bg: "rgba(167,139,250,0.12)", label: "Email" },
  SMS:      { color: "#38bdf8", bg: "rgba(56,189,248,0.12)",  label: "SMS" },
  WHATSAPP: { color: "#34d399", bg: "rgba(52,211,153,0.12)",  label: "WhatsApp" },
  RCS:      { color: "#fb923c", bg: "rgba(251,146,60,0.12)",  label: "RCS" },
};

const STATUS: Record<string, { color: string; bg: string; border: string; icon: typeof CheckCircle; label: string }> = {
  SENT:    { color: "#34d399", bg: "rgba(52,211,153,0.1)",   border: "rgba(52,211,153,0.25)",   icon: CheckCircle, label: "Sent" },
  SENDING: { color: "#38bdf8", bg: "rgba(56,189,248,0.1)",   border: "rgba(56,189,248,0.25)",   icon: Send,        label: "Sending" },
  DRAFT:   { color: "rgba(255,255,255,0.35)", bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)", icon: Clock, label: "Draft" },
  FAILED:  { color: "#f87171", bg: "rgba(248,113,113,0.1)",  border: "rgba(248,113,113,0.25)",  icon: XCircle,     label: "Failed" },
};

type StatusFilter = "all" | "SENT" | "SENDING" | "DRAFT";

function timeAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (d < 1) return "Just now";
  if (d < 60) return `${d}m ago`;
  if (d < 1440) return `${Math.floor(d / 60)}h ago`;
  return `${Math.floor(d / 1440)}d ago`;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading]     = useState(true);
  const [statusFilter, setStatus] = useState<StatusFilter>("all");
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);

  useEffect(() => {
    fetch("/api/campaigns").then(r => r.json()).then(d => { setCampaigns(d); setLoading(false); });
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setCampaignToDelete(null);
      }
    }
    if (campaignToDelete) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [campaignToDelete]);

  async function confirmDelete() {
    if (!campaignToDelete) return;
    const target = campaignToDelete;
    setCampaignToDelete(null);

    // Optimistic delete
    setCampaigns(prev => prev.filter(c => c.id !== target.id));
    toast.delete("Campaign deleted");

    try {
      const res = await fetch(`/api/campaigns/${target.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      const data = await res.json();
      if (!data.success) throw new Error("Delete failed");
    } catch (err) {
      toast.error("Failed to delete. Please try again.");
      // Revert optimistic delete
      setCampaigns(prev => {
        if (prev.some(c => c.id === target.id)) return prev;
        return [...prev, target].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      });
    }
  }

  const filtered = campaigns.filter(c => statusFilter === "all" || c.status === statusFilter);
  const aiCount  = campaigns.filter(c => c.aiGenerated).length;
  const sentCount = campaigns.filter(c => c.status === "SENT").length;

  const statusCounts: Record<string, number> = campaigns.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div style={{ padding: "30px 36px 60px", maxWidth: 1080, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 22, gap: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(56,189,248,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Megaphone size={14} color="#38bdf8" />
            </div>
            <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.32)", textTransform: "uppercase", letterSpacing: 1.5 }}>Campaign Control</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "#fff", margin: "0 0 5px" }}>Campaigns</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: 0 }}>
            {campaigns.length} campaigns · {aiCount} AI-generated · {sentCount} dispatched
          </p>
        </div>
        <Link href="/command" style={{ display: "inline-flex", alignItems: "center", gap: 7, textDecoration: "none", background: "linear-gradient(135deg, #7c3aed, #0891b2)", color: "#fff", fontSize: 12, fontWeight: 800, padding: "10px 16px", borderRadius: 11, boxShadow: "0 6px 20px rgba(124,58,237,0.28)" }}>
          <Plus size={14} /> New with AI
        </Link>
      </div>

      {/* Summary stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 18 }}>
        {[
          { label: "All",     id: "all",     count: campaigns.length,     color: "#a78bfa", icon: Filter },
          { label: "Sent",    id: "SENT",    count: statusCounts.SENT || 0, color: "#34d399", icon: CheckCircle },
          { label: "Sending", id: "SENDING", count: statusCounts.SENDING || 0, color: "#38bdf8", icon: Send },
          { label: "Drafts",  id: "DRAFT",   count: statusCounts.DRAFT || 0,   color: "rgba(255,255,255,0.5)", icon: Clock },
        ].map(({ label, id, count, color, icon: Icon }) => {
          const active = statusFilter === id;
          return (
            <button key={id} onClick={() => setStatus(id as StatusFilter)} style={{ textAlign: "left", background: active ? `${color}0e` : "rgba(255,255,255,0.025)", border: active ? `1px solid ${color}35` : "1px solid rgba(255,255,255,0.06)", borderRadius: 13, padding: "14px 16px", cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.025)"; }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}14`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={13} color={color} />
                </div>
                <span style={{ fontSize: 22, fontWeight: 900, color: active ? color : "rgba(255,255,255,0.7)", lineHeight: 1 }}>{count}</span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: active ? color : "#fff" }}>{label}</div>
              {active && <div style={{ height: 2, background: `linear-gradient(90deg, ${color}, transparent)`, borderRadius: 2, marginTop: 10 }} />}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "80px 0", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <Loader2 size={22} color="#a78bfa" style={{ animation: "spin 1s linear infinite" }} />
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", margin: 0 }}>Loading campaigns...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", background: "rgba(255,255,255,0.018)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 18 }}>
          <Megaphone size={40} color="rgba(255,255,255,0.06)" style={{ marginBottom: 14 }} />
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.35)", margin: "0 0 5px", fontWeight: 600 }}>No campaigns found</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", margin: "0 0 20px" }}>Use the Growth Agent to launch your first AI-powered campaign</p>
          <Link href="/command" style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.28)", color: "#c4b5fd", fontSize: 13, fontWeight: 700, padding: "10px 18px", borderRadius: 11, textDecoration: "none" }}>
            <Sparkles size={14} /> Create with ARIA
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((c, i) => {
            const ch  = CH[c.channel] || CH.EMAIL;
            const st  = STATUS[c.status] || STATUS.DRAFT;
            const StIcon = st.icon;
            return (
              <motion.div key={c.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} style={{ position: "relative" }}>
                <Link href={`/campaigns/${c.id}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, background: "rgba(10,10,22,0.9)", border: "1px solid rgba(255,255,255,0.065)", borderRadius: 14, padding: "14px 54px 14px 18px", textDecoration: "none", transition: "all 0.12s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(124,58,237,0.25)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(10,10,22,0.9)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.065)"; }}
                >
                  {/* Channel icon */}
                  <div style={{ width: 38, height: 38, borderRadius: 11, background: ch.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, color: ch.color, flexShrink: 0 }}>
                    {c.channel[0]}
                  </div>

                  {/* Name + meta */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.88)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                      {c.aiGenerated && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 8, fontWeight: 800, background: "rgba(124,58,237,0.18)", color: "#a78bfa", padding: "2px 6px", borderRadius: 4, letterSpacing: 0.7, textTransform: "uppercase", border: "1px solid rgba(124,58,237,0.28)", flexShrink: 0 }}>
                          <Brain size={7} /> AI
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.28)" }}>
                      {c.segment?.name || "All customers"} · <span style={{ color: ch.color }}>{ch.label}</span> · {timeAgo(c.sentAt || c.createdAt)}
                    </div>
                  </div>

                  {/* Recipients */}
                  <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                    <Users size={12} color="rgba(255,255,255,0.25)" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.55)" }}>{c._count.recipients.toLocaleString()}</span>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.22)" }}>recipients</span>
                  </div>

                  {/* Status badge */}
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: st.bg, border: `1px solid ${st.border}`, color: st.color, fontSize: 10, fontWeight: 800, padding: "4px 10px", borderRadius: 999, whiteSpace: "nowrap" }}>
                    <StIcon size={10} />
                    {c.status === "SENDING" ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        {st.label}
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#38bdf8", animation: "pulse-dot 1.5s ease-in-out infinite" }} />
                      </span>
                    ) : st.label}
                  </div>

                  <ArrowRight size={14} color="rgba(255,255,255,0.18)" style={{ flexShrink: 0, marginRight: -18 }} />
                </Link>

                <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", zIndex: 10 }}>
                  <CampaignRowMenu campaign={c} onDelete={setCampaignToDelete} />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      {campaignToDelete && (
        <div
          onClick={() => setCampaignToDelete(null)}
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
              This will permanently remove <strong style={{ color: "#fff" }}>&ldquo;{campaignToDelete.name}&rdquo;</strong> and all its delivery data. This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 10, width: "100%" }}>
              <button
                onClick={() => setCampaignToDelete(null)}
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

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.75)} }`}</style>
    </div>
  );
}