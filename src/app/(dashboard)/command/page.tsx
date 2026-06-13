"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Send, Loader2, CheckCircle, Users, MessageSquare,
  Zap, ChevronRight, ArrowRight, Edit3, Brain, Activity, Shield,
} from "lucide-react";
import { toast } from "@/components/ui/toast";
import Link from "next/link";

interface AIResult {
  intent: string; segmentName: string; segmentDescription: string;
  filterRules: Record<string, unknown>; channel: string;
  subject?: string; messageBody: string; campaignName: string;
  reasoning: string; estimatedAudience: string;
}

interface SegmentContext {
  id: string; name: string; description: string | null; audienceCount: number;
}

const PROMPTS = [
  { text: "Send a win-back offer to customers who haven't ordered in 90 days", tag: "Win-back",  color: "#f59e0b" },
  { text: "Create a VIP exclusive campaign for our top spenders",               tag: "VIP",       color: "#fbbf24" },
  { text: "Welcome new customers who joined this month with a first order discount", tag: "Onboarding", color: "#38bdf8" },
  { text: "Re-engage at-risk customers in Mumbai before they churn",            tag: "Retention", color: "#f87171" },
  { text: "Launch a flash sale for customers who clicked but didn't buy",       tag: "Conversion", color: "#34d399" },
];

const CH_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  EMAIL:    { color: "#a78bfa", bg: "rgba(167,139,250,0.12)", label: "Email" },
  SMS:      { color: "#38bdf8", bg: "rgba(56,189,248,0.12)",  label: "SMS" },
  WHATSAPP: { color: "#34d399", bg: "rgba(52,211,153,0.12)",  label: "WhatsApp" },
  RCS:      { color: "#fb923c", bg: "rgba(251,146,60,0.12)",  label: "RCS" },
};

const CHANNEL_MODEL: Record<string, { open: number; click: number; conversion: number }> = {
  EMAIL:    { open: 0.38, click: 0.11, conversion: 0.045 },
  SMS:      { open: 0.82, click: 0.18, conversion: 0.055 },
  WHATSAPP: { open: 0.76, click: 0.24, conversion: 0.075 },
  RCS:      { open: 0.62, click: 0.20, conversion: 0.065 },
};

function estimateAudience(text: string) {
  const nums = text.match(/\d+/g)?.map(Number) || [];
  if (!nums.length) return 40;
  return Math.round(nums.reduce((s, n) => s + n, 0) / nums.length);
}

const THINKING_STEPS = [
  "Parsing intent and audience criteria...",
  "Querying Gemini 2.5 Flash...",
  "Generating segment filter rules...",
  "Drafting personalised message copy...",
  "Selecting optimal channel...",
  "Estimating predicted impact...",
];

function ThinkingAnimation() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setStep(s => Math.min(s + 1, THINKING_STEPS.length - 1)), 600);
    return () => clearInterval(iv);
  }, []);
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 40, padding: "32px 0", textAlign: "center" }}>
      <div style={{ width: 60, height: 60, borderRadius: 18, background: "rgba(124,58,237,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", border: "1px solid rgba(124,58,237,0.2)" }}>
        <Sparkles size={26} color="#a78bfa" />
      </div>
      <p style={{ fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.65)", margin: "0 0 8px" }}>ARIA is thinking...</p>
      <div style={{ height: 24, overflow: "hidden" }}>
        <AnimatePresence mode="wait">
          <motion.p key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} style={{ fontSize: 12, color: "rgba(255,255,255,0.28)", margin: 0 }}>
            {THINKING_STEPS[step]}
          </motion.p>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function CommandPage() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);
  const [source, setSource] = useState<"gemini" | "fallback" | null>(null);
  const [launching, setLaunching] = useState(false);
  const [launched, setLaunched] = useState<{ campaignId: string } | null>(null);
  const [segmentContext, setSegmentContext] = useState<SegmentContext | null>(null);
  const [editingMessage, setEditingMessage] = useState(false);
  const [editedMessage, setEditedMessage] = useState("");
  const [duplicateCampaign, setDuplicateCampaign] = useState<any | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setDuplicateCampaign(null);
      }
    }
    if (duplicateCampaign) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [duplicateCampaign]);


  useEffect(() => {
    if (textareaRef.current) textareaRef.current.focus();
    const prefill = sessionStorage.getItem("aria_prefill");
    if (prefill) { setPrompt(prefill); sessionStorage.removeItem("aria_prefill"); }
    const seg = sessionStorage.getItem("aria_segment_context");
    if (seg) { try { setSegmentContext(JSON.parse(seg) as SegmentContext); } catch { sessionStorage.removeItem("aria_segment_context"); } }
  }, []);

  async function handleSubmit() {
    if (!prompt.trim() || loading) return;
    setLoading(true); setResult(null); setLaunched(null); setSource(null); setEditingMessage(false);
    try {
      const res = await fetch("/api/ai/command", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data.ok) {
        setResult(data.data);
        setEditedMessage(data.data.messageBody);
        setSource(data.source ?? "gemini");
      } else toast.error("AI error: " + data.error);
    } catch { toast.error("Something went wrong"); }
    finally { setLoading(false); }
  }

  async function handleLaunch() {
    if (!result) return;
    setLaunching(true);
    const finalMessage = editingMessage ? editedMessage : result.messageBody;
    try {
      let segmentId = segmentContext?.id;
      if (!segmentId) {
        const segRes = await fetch("/api/segments", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: result.segmentName, description: result.segmentDescription, filterRules: result.filterRules, aiGenerated: true, prompt }),
        });
        const seg = await segRes.json();
        segmentId = seg.id;
      }

      // Check for duplicate campaign (same name AND same segmentId)
      const campaignsRes = await fetch("/api/campaigns");
      const campaignsList = await campaignsRes.json();
      const duplicate = campaignsList.find(
        (c: any) => c.name === result.campaignName && c.segmentId === segmentId
      );

      if (duplicate) {
        setDuplicateCampaign({ ...duplicate, segmentName: result.segmentName || duplicate.segment?.name });
        setLaunching(false);
        return;
      }

      const campRes = await fetch("/api/campaigns", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: result.campaignName, description: result.intent, segmentId, channel: result.channel, messageBody: finalMessage, subject: result.subject, aiGenerated: true, prompt }),
      });
      const campaign = await campRes.json();
      await fetch(`/api/campaigns/${campaign.id}/send`, { method: "POST" });
      setLaunched({ campaignId: campaign.id });
      sessionStorage.removeItem("aria_segment_context");
      toast.success("Campaign launched! Delivery tracking is live.");
    } catch { toast.error("Launch failed — please try again"); }
    finally { setLaunching(false); }
  }

  async function handleLaunchAnyway() {
    if (!result || !duplicateCampaign) return;
    const target = duplicateCampaign;
    setDuplicateCampaign(null);
    setLaunching(true);

    const finalMessage = editingMessage ? editedMessage : result.messageBody;
    const dateStr = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const finalCampaignName = `${result.campaignName} — Re-send ${dateStr}`;

    try {
      let segmentId = target.segmentId;
      const campRes = await fetch("/api/campaigns", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: finalCampaignName, description: result.intent, segmentId, channel: result.channel, messageBody: finalMessage, subject: result.subject, aiGenerated: true, prompt }),
      });
      const campaign = await campRes.json();
      await fetch(`/api/campaigns/${campaign.id}/send`, { method: "POST" });
      setLaunched({ campaignId: campaign.id });
      sessionStorage.removeItem("aria_segment_context");
      toast.success("Campaign launched! Delivery tracking is live.");
    } catch { toast.error("Launch failed — please try again"); }
    finally { setLaunching(false); }
  }

  const ch = result ? (CH_STYLE[result.channel] || CH_STYLE.EMAIL) : null;
  const prediction = result ? (() => {
    const reach = segmentContext?.audienceCount || estimateAudience(result.estimatedAudience);
    const model = CHANNEL_MODEL[result.channel] || CHANNEL_MODEL.EMAIL;
    const opens = Math.round(reach * model.open);
    const clicks = Math.round(reach * model.click);
    const conversions = Math.round(reach * model.conversion);
    const revenue = conversions * 2600;
    return { reach, opens, clicks, conversions, revenue, roi: revenue > 0 ? `${((revenue / 2600) * 0.85).toFixed(1)}x` : "TBD" };
  })() : null;

  return (
    <div style={{ padding: "30px 40px 60px", maxWidth: 780, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <div style={{ width: 42, height: 42, borderRadius: 13, background: "linear-gradient(135deg, #7c3aed, #0891b2)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(124,58,237,0.28)" }}>
            <Sparkles size={20} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: 0 }}>Growth Agent</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Powered by Gemini 2.5 Flash</span>
              <span style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(255,255,255,0.2)" }} />
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Intent → Segment → Message → Launch</span>
            </div>
          </div>
        </div>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", lineHeight: 1.65 }}>
          Describe your marketing goal in plain English. ARIA builds the audience, writes the copy, picks the channel, and predicts impact — then waits for your approval.
        </p>

        {segmentContext && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 14, background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.22)", borderRadius: 12, padding: "12px 15px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 800, color: "#a78bfa", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 3 }}>Pre-selected audience</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{segmentContext.name}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{segmentContext.description || "Existing segment"} · {segmentContext.audienceCount.toLocaleString()} matched shoppers</div>
            </div>
            <button onClick={() => { setSegmentContext(null); sessionStorage.removeItem("aria_segment_context"); }} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", borderRadius: 8, padding: "6px 10px", fontSize: 11, cursor: "pointer" }}>
              Clear
            </button>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div style={{ background: "#0d0d1a", border: `1px solid ${loading ? "rgba(124,58,237,0.5)" : "rgba(255,255,255,0.08)"}`, borderRadius: 16, overflow: "hidden", transition: "border-color 0.2s", boxShadow: loading ? "0 0 0 3px rgba(124,58,237,0.08)" : "none" }}>
        <div style={{ display: "flex", gap: 12, padding: "16px 18px 0" }}>
          <div style={{ paddingTop: 3, flexShrink: 0 }}><Sparkles size={16} color="#a78bfa" /></div>
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
            placeholder={"Describe your campaign goal in plain English...\ne.g. Send a win-back offer to customers who haven't ordered in 90 days"}
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: 14, lineHeight: 1.65, resize: "none", minHeight: 76, fontFamily: "inherit", caretColor: "#a78bfa" }}
            rows={3}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 18px 14px", borderTop: "1px solid rgba(255,255,255,0.05)", marginTop: 12 }}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.16)" }}>Enter to run · Shift+Enter for new line</span>
          <button onClick={handleSubmit} disabled={!prompt.trim() || loading} style={{ display: "inline-flex", alignItems: "center", gap: 7, background: prompt.trim() && !loading ? "linear-gradient(135deg, #7c3aed, #0891b2)" : "rgba(255,255,255,0.05)", color: prompt.trim() && !loading ? "#fff" : "rgba(255,255,255,0.2)", border: "none", cursor: prompt.trim() && !loading ? "pointer" : "not-allowed", fontSize: 12, fontWeight: 700, padding: "9px 18px", borderRadius: 9, transition: "all 0.15s" }}>
            {loading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={14} />}
            {loading ? "Thinking..." : "Run ARIA"}
          </button>
        </div>
      </div>

      {/* Suggestions */}
      {!result && !loading && (
        <div style={{ marginTop: 22 }}>
          <p style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: 1.6, marginBottom: 10 }}>Try these</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {PROMPTS.map(({ text, tag, color }) => (
              <button key={text} onClick={() => setPrompt(text)} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", padding: "11px 14px", borderRadius: 11, background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer", transition: "all 0.12s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(124,58,237,0.3)"; (e.currentTarget as HTMLElement).style.background = "rgba(124,58,237,0.05)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLElement).style.background = "#0d0d1a"; }}
              >
                <span style={{ fontSize: 9, fontWeight: 800, color, background: `${color}18`, border: `1px solid ${color}35`, padding: "2px 8px", borderRadius: 5, letterSpacing: 0.5, whiteSpace: "nowrap", flexShrink: 0 }}>{tag}</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.48)", flex: 1 }}>{text}</span>
                <ChevronRight size={12} color="rgba(255,255,255,0.18)" style={{ flexShrink: 0 }} />
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && <ThinkingAnimation />}

      {/* Result */}
      <AnimatePresence>
        {result && !loading && (
          <motion.div key="command-result" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ marginTop: 26 }}>
            {/* Status bar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle size={16} color="#34d399" />
                <span style={{ fontSize: 14, fontWeight: 700, color: "#34d399" }}>ARIA has a plan</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>{result.intent}</span>
              </div>
              {/* Source indicator */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: source === "gemini" ? "rgba(167,139,250,0.08)" : "rgba(245,158,11,0.08)", border: `1px solid ${source === "gemini" ? "rgba(167,139,250,0.2)" : "rgba(245,158,11,0.2)"}`, borderRadius: 8, padding: "4px 10px" }}>
                {source === "gemini" ? <Brain size={11} color="#a78bfa" /> : <Shield size={11} color="#f59e0b" />}
                <span style={{ fontSize: 10, fontWeight: 700, color: source === "gemini" ? "#a78bfa" : "#f59e0b" }}>
                  {source === "gemini" ? "Gemini 2.5 Flash" : "Cached intelligence"}
                </span>
              </div>
            </div>

            {/* Audience + Channel */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11, marginBottom: 11 }}>
              <div style={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "18px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
                  <Users size={13} color="#a78bfa" />
                  <span style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1.2 }}>Audience</span>
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: "0 0 5px" }}>{result.segmentName}</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "0 0 12px", lineHeight: 1.55 }}>{result.segmentDescription}</p>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: 7, padding: "4px 10px" }}>
                  <Users size={11} color="#a78bfa" />
                  <span style={{ fontSize: 11, color: "#c4b5fd", fontWeight: 600 }}>≈ {result.estimatedAudience}</span>
                </div>
              </div>

              <div style={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "18px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
                  <Zap size={13} color="#38bdf8" />
                  <span style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1.2 }}>Channel</span>
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: ch?.bg, borderRadius: 9, padding: "6px 14px", marginBottom: 10 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: ch?.color }}>{ch?.label || result.channel}</span>
                </div>
                {result.subject && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.32)", margin: "0 0 8px" }}>Subject: <span style={{ color: "rgba(255,255,255,0.6)" }}>{result.subject}</span></p>}
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", margin: 0, lineHeight: 1.55, fontStyle: "italic" }}>{result.reasoning}</p>
              </div>
            </div>

            {/* Message preview with edit toggle */}
            <div style={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "18px 20px", marginBottom: 11 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <MessageSquare size={13} color="#34d399" />
                  <span style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1.2 }}>Message Preview</span>
                </div>
                <button onClick={() => setEditingMessage(!editingMessage)} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 700, padding: "4px 9px", borderRadius: 6, cursor: "pointer" }}>
                  <Edit3 size={10} /> {editingMessage ? "Done editing" : "Edit message"}
                </button>
              </div>
              {result.subject && (
                <div style={{ marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.28)" }}>Subject: </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>{result.subject}</span>
                </div>
              )}
              {editingMessage ? (
                <textarea
                  value={editedMessage}
                  onChange={e => setEditedMessage(e.target.value)}
                  style={{ width: "100%", minHeight: 140, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 10, color: "#fff", fontSize: 13, lineHeight: 1.7, padding: "12px 14px", outline: "none", fontFamily: "inherit", resize: "vertical" }}
                />
              ) : (
                <div style={{ background: "rgba(255,255,255,0.025)", borderRadius: 10, padding: "14px 16px" }}>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", margin: 0, lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{editingMessage ? editedMessage : result.messageBody}</p>
                </div>
              )}
            </div>

            {/* Pre-launch prediction */}
            {prediction && (
              <div style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.18)", borderRadius: 14, padding: "18px 20px", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <Activity size={13} color="#a78bfa" />
                    <span style={{ fontSize: 9, fontWeight: 800, color: "#a78bfa", textTransform: "uppercase", letterSpacing: 1.2 }}>Pre-launch prediction</span>
                  </div>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", fontStyle: "italic" }}>Modeled from audience × channel benchmarks</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
                  {[
                    { label: "Reach",    value: prediction.reach.toLocaleString(),               color: "#fff" },
                    { label: "Opens",    value: prediction.opens.toLocaleString(),               color: "#a78bfa" },
                    { label: "Clicks",   value: prediction.clicks.toLocaleString(),              color: "#38bdf8" },
                    { label: "Conv.",    value: prediction.conversions.toLocaleString(),         color: "#34d399" },
                    { label: "Revenue",  value: `₹${prediction.revenue.toLocaleString("en-IN")}`, color: "#34d399" },
                    { label: "ROI est.", value: prediction.roi,                                  color: "#fbbf24" },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
                      <div style={{ fontSize: 14, fontWeight: 900, color, lineHeight: 1.15 }}>{value}</div>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", marginTop: 4 }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Launch / success */}
            {!launched ? (
              <button onClick={handleLaunch} disabled={launching} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: launching ? "rgba(124,58,237,0.28)" : "linear-gradient(135deg, #7c3aed, #0891b2)", color: "#fff", border: "none", cursor: launching ? "wait" : "pointer", fontSize: 15, fontWeight: 800, padding: "15px 24px", borderRadius: 13, transition: "opacity 0.15s", boxShadow: launching ? "none" : "0 8px 28px rgba(124,58,237,0.3)" }}>
                {launching
                  ? <><Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Launching Campaign...</>
                  : <><Zap size={18} /> Launch This Campaign &mdash; Human approval granted</>
                }
              </button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: 13, padding: "15px 24px", color: "#34d399", fontSize: 14, fontWeight: 700 }}>
                  <CheckCircle size={18} /> Campaign Launched! Delivery tracking is now live.
                </div>
                <Link href={`/campaigns/${launched.campaignId}`} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: "#a78bfa", fontSize: 13, textDecoration: "none", padding: "11px", borderRadius: 11, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.18)", fontWeight: 700 }}>
                  View live analytics <ArrowRight size={13} />
                </Link>
              </div>
            )}
          </motion.div>
        )}
      {/* Duplicate Campaign Warning Modal */}
      {duplicateCampaign && (
        <div
          key="duplicate-warning-backdrop"
          onClick={() => setDuplicateCampaign(null)}
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
              maxWidth: 420,
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
                background: "rgba(245, 158, 11, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
                color: "#f59e0b",
                fontSize: 20,
              }}
            >
              ⚠️
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#fff", margin: "0 0 8px" }}>
              This campaign already exists
            </h3>
            <p style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.5)", margin: "0 0 20px", lineHeight: 1.5 }}>
              A campaign called <strong style={{ color: "#fff" }}>&ldquo;{duplicateCampaign.name}&rdquo;</strong> was already sent to <strong style={{ color: "#fff" }}>&ldquo;{duplicateCampaign.segmentName}&rdquo;</strong> on {new Date(duplicateCampaign.sentAt || duplicateCampaign.createdAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}. Sending it again would reach the same audience with the same message.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", alignItems: "center" }}>
              <button
                onClick={handleLaunchAnyway}
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "1px solid #7c3aed",
                  color: "#c4b5fd",
                  padding: "12px",
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                  transition: "all 0.12s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(124, 58, 237, 0.08)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                Launch anyway — I want to re-engage this audience
              </button>
              <button
                onClick={() => {
                  setDuplicateCampaign(null);
                  setEditingMessage(true);
                }}
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "#fff",
                  padding: "12px",
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                  transition: "all 0.12s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                Edit before launching
              </button>
              <button
                onClick={() => setDuplicateCampaign(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "rgba(255, 255, 255, 0.4)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  textDecoration: "underline",
                  marginTop: 6,
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = "rgba(255, 255, 255, 0.6)"}
                onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255, 255, 255, 0.4)"}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
