"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Send, Loader2, CheckCircle, Users, MessageSquare,
  Zap, ChevronRight, ArrowRight, Edit3, Brain, Activity, Shield, Clock, AlertTriangle, Copy, Check,
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
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [originalMessageBody, setOriginalMessageBody] = useState("");
  const [originalSubject, setOriginalSubject] = useState("");
  const [variants, setVariants] = useState<{
    variantA: { label: string; subject: string; body: string; hook: string };
    variantB: { label: string; subject: string; body: string; hook: string };
  } | null>(null);
  const [generatingVariants, setGeneratingVariants] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<"A" | "B" | null>(null);
  const [optimalTime, setOptimalTime] = useState<{ time: string; rationale: string; source: "data" | "ai" } | null>(null);
  const [loadingOptimalTime, setLoadingOptimalTime] = useState(false);

  const formatINR = (n: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(n).replace(/\s+/g, "");

  const sectionLabelStyle = {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "rgba(255, 255, 255, 0.5)",
    display: "inline-flex",
    alignItems: "center",
    gap: 6
  };

  const audienceRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const variantsRef = useRef<HTMLDivElement>(null);
  const predictionRef = useRef<HTMLDivElement>(null);
  const launchRef = useRef<HTMLDivElement>(null);
  const launchButtonRef = useRef<HTMLButtonElement>(null);

  const [activeStep, setActiveStep] = useState(0);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [variantError, setVariantError] = useState(false);

  useEffect(() => {
    if (!result) return;

    const sectionRefs = [audienceRef, channelRef, messageRef, variantsRef, predictionRef, launchRef];
    
    const handleScroll = () => {
      let currentActive = 0;
      let minDistance = Infinity;

      sectionRefs.forEach((ref, idx) => {
        if (ref.current) {
          const rect = ref.current.getBoundingClientRect();
          const distance = Math.abs(rect.top - 80);
          if (rect.top < window.innerHeight * 0.6 && rect.bottom > 80) {
            if (distance < minDistance) {
              minDistance = distance;
              currentActive = idx;
            }
          }
        }
      });

      setActiveStep(currentActive);

      if (launchButtonRef.current) {
        const rect = launchButtonRef.current.getBoundingClientRect();
        const isOutOfView = rect.bottom < 0 || rect.top > window.innerHeight;
        setShowStickyBar(isOutOfView);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [result]);

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

  useEffect(() => {
    if (!result) {
      setOptimalTime(null);
      return;
    }
    const channel = result.channel;
    const segmentId = segmentContext?.id || "";
    setLoadingOptimalTime(true);
    fetch(`/api/campaigns/optimal-time?channel=${channel}&segmentId=${segmentId}`)
      .then(res => res.json())
      .then(data => {
        if (data.time) {
          setOptimalTime(data);
        }
      })
      .catch(err => console.error("Error fetching optimal time:", err))
      .finally(() => setLoadingOptimalTime(false));
  }, [result, segmentContext]);

  async function handleSubmit() {
    if (!prompt.trim() || loading) return;
    setLoading(true); setResult(null); setLaunched(null); setSource(null); setEditingMessage(false);
    setOriginalMessageBody("");
    setOriginalSubject("");
    setVariants(null);
    setSelectedVariant(null);
    setOptimalTime(null);
    setVariantError(false);
    try {
      const res = await fetch("/api/ai/command", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data.ok) {
        setResult(data.data);
        setEditedMessage(data.data.messageBody);
        setOriginalMessageBody(data.data.messageBody);
        setOriginalSubject(data.data.subject || "");
        setSource(data.source ?? "gemini");
      } else toast.error("AI error: " + data.error);
    } catch { toast.error("Something went wrong"); }
    finally { setLoading(false); }
  }

  async function generateABVariants() {
    if (!result || generatingVariants) return;
    setGeneratingVariants(true);
    setVariantError(false);
    try {
      const reach = segmentContext?.audienceCount || estimateAudience(result.estimatedAudience);
      const res = await fetch("/api/ai/variants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          segmentName: result.segmentName,
          audienceSize: reach,
          channel: result.channel,
          originalMessage: originalMessageBody || result.messageBody,
        })
      });
      const data = await res.json();
      if (data.ok) {
        setVariants(data.data);
        toast.success("Successfully generated A/B variants!");
      } else {
        setVariantError(true);
        toast.error("Failed to generate variants: " + data.error);
      }
    } catch {
      setVariantError(true);
      toast.error("Error generating variants");
    } finally {
      setGeneratingVariants(false);
    }
  }

  const handleSelectVariant = (vKey: "A" | "B") => {
    if (!variants) return;
    const variant = vKey === "A" ? variants.variantA : variants.variantB;
    if (result) {
      setResult({
        ...result,
        messageBody: variant.body,
        subject: variant.subject || result.subject
      });
    }
    setEditedMessage(variant.body);
    setSelectedVariant(vKey);
    toast.success(`Variant ${vKey} selected — message preview updated`);
  };

  const handleUseOriginal = () => {
    if (result) {
      setResult({
        ...result,
        messageBody: originalMessageBody,
        subject: originalSubject
      });
    }
    setEditedMessage(originalMessageBody);
    setSelectedVariant(null);
  };

  const toggleEditing = () => {
    if (editingMessage && result) {
      setResult({
        ...result,
        messageBody: editedMessage
      });
    }
    setEditingMessage(!editingMessage);
  };

  async function handleLaunch() {
    if (!result) return;
    setLaunching(true);
    const finalMessage = editedMessage;
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

    const finalMessage = editedMessage;
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
            {/* Sticky Step Progress Indicator */}
            <div style={{
              position: "sticky",
              top: 0,
              zIndex: 40,
              height: 48,
              background: "rgba(13, 13, 31, 0.9)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 12px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              marginBottom: 20,
              borderRadius: 12
            }}>
              {["Audience", "Channel", "Message", "Variants", "Prediction", "Launch"].map((label, idx) => {
                const isCompleted = idx < activeStep;
                const isActive = idx === activeStep;
                const dotColor = isCompleted ? "#34d399" : isActive ? "#a78bfa" : "transparent";
                const dotBorder = isCompleted ? "none" : isActive ? "none" : "1px solid rgba(255, 255, 255, 0.2)";
                const glow = isActive ? "0 0 8px #a78bfa" : "none";
                
                return (
                  <div key={label} style={{ display: "flex", flex: 1, flexDirection: "column", alignItems: "center", position: "relative" }}>
                    {idx < 5 && (
                      <div style={{
                        position: "absolute",
                        top: 10,
                        left: "50%",
                        right: "-50%",
                        height: 2,
                        background: idx < activeStep ? "#34d399" : "rgba(255, 255, 255, 0.1)",
                        zIndex: 1
                      }} />
                    )}
                    <div style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: dotColor,
                      border: dotBorder,
                      boxShadow: glow,
                      zIndex: 2,
                      cursor: "pointer"
                    }}
                    onClick={() => {
                      const refs = [audienceRef, channelRef, messageRef, variantsRef, predictionRef, launchRef];
                      refs[idx].current?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }}
                    />
                    <span style={{
                      fontSize: 9,
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? "#fff" : isCompleted ? "#34d399" : "rgba(255, 255, 255, 0.4)",
                      marginTop: 4
                    }}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Status bar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle size={16} color="#34d399" />
                <span style={{ fontSize: 14, fontWeight: 700, color: "#34d399" }}>ARIA has a plan</span>
                
                {/* Campaign Summary Pill */}
                <div style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: 9999,
                  padding: "4px 12px",
                  fontSize: 11,
                  color: "rgba(255, 255, 255, 0.7)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  marginLeft: 8
                }}>
                  <span>
                    {result.channel === "EMAIL" ? "📧 Email" : result.channel === "WHATSAPP" ? "💬 WhatsApp" : "💬 " + result.channel}
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.3)" }}>→</span>
                  <span>{result.segmentName}</span>
                  <span style={{ color: "rgba(255,255,255,0.3)" }}>→</span>
                  <span>≈ {result.estimatedAudience} customers</span>
                  <span style={{ color: "rgba(255,255,255,0.3)" }}>→</span>
                  <span>{formatINR(2600)} est.</span>
                </div>
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
              <div ref={audienceRef} style={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "18px 20px" }}>
                <div style={{ ...sectionLabelStyle, marginBottom: 12 }}>
                  <Users size={12} color="rgba(255, 255, 255, 0.4)" />
                  <span>Audience</span>
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: "0 0 5px" }}>{result.segmentName}</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "0 0 12px", lineHeight: 1.55 }}>{result.segmentDescription}</p>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: 7, padding: "4px 10px" }}>
                  <Users size={11} color="#a78bfa" />
                  <span style={{ fontSize: 11, color: "#c4b5fd", fontWeight: 600 }}>≈ {result.estimatedAudience}</span>
                </div>
              </div>

              <div style={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "18px 20px" }}>
                <div style={{ ...sectionLabelStyle, marginBottom: 12 }}>
                  <Zap size={12} color="rgba(255, 255, 255, 0.4)" />
                  <span>Channel</span>
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: ch?.bg, border: `1px solid ${ch?.color}30`, borderRadius: 8, padding: "4px 10px", marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: ch?.color }}>{ch?.label || result.channel}</span>
                </div>
                {result.subject && (
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, padding: "6px 10px", marginBottom: 10 }}>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 0.5 }}>Subject</span>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.85)", margin: "2px 0 0", lineHeight: 1.4 }}>{result.subject}</p>
                  </div>
                )}
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", margin: 0, lineHeight: 1.55, fontStyle: "italic" }}>{result.reasoning}</p>

                {/* Divider */}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "14px 0" }} />

                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ ...sectionLabelStyle, marginBottom: 6 }}>
                    <Clock size={12} color="rgba(255, 255, 255, 0.4)" />
                    <span>Optimal Send Time</span>
                  </div>
                  {loadingOptimalTime ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "6px 0 0" }}>
                      <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} color="rgba(255,255,255,0.3)" />
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Calculating send times...</span>
                    </div>
                  ) : optimalTime ? (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, margin: "6px 0 4px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Clock size={12} color="#0d9488" />
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#0d9488" }}>
                            Best time to send: {optimalTime.time}
                          </span>
                        </div>
                        {/* Source badge */}
                        <span style={{
                          fontSize: 9,
                          fontWeight: 800,
                          background: optimalTime.source === "data" ? "rgba(16,185,129,0.08)" : "rgba(167,139,250,0.08)",
                          border: `1px solid ${optimalTime.source === "data" ? "rgba(16,185,129,0.2)" : "rgba(167,139,250,0.2)"}`,
                          color: optimalTime.source === "data" ? "#10b981" : "#a78bfa",
                          borderRadius: 5,
                          padding: "2px 6px",
                          whiteSpace: "nowrap"
                        }}>
                          {optimalTime.source === "data" ? "Based on your data" : "AI recommendation"}
                        </span>
                      </div>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.32)", margin: 0, fontStyle: "italic", lineHeight: 1.4 }}>
                        {optimalTime.rationale}
                      </p>
                    </div>
                  ) : (
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontStyle: "italic" }}>No send time recommendation available.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Message preview with edit toggle */}
            <div style={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "18px 20px", marginBottom: 11 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={sectionLabelStyle}>
                  <MessageSquare size={12} color="rgba(255, 255, 255, 0.4)" />
                  <span>Message Preview</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {selectedVariant && (
                    <div style={{ display: "flex", alignItems: "center", gap: 5, background: selectedVariant === "A" ? "rgba(245,158,11,0.12)" : "rgba(167,139,250,0.12)", border: `1px solid ${selectedVariant === "A" ? "rgba(245,158,11,0.25)" : "rgba(167,139,250,0.25)"}`, borderRadius: 6, padding: "3px 8px" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: selectedVariant === "A" ? "#f59e0b" : "#a78bfa" }}>
                        ✓ Variant {selectedVariant} selected
                      </span>
                    </div>
                  )}
                  {/* Copy button */}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(editedMessage);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                      toast.success("Message copied to clipboard!");
                    }}
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: copied ? "#34d399" : "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 700, padding: "4px 9px", borderRadius: 6, cursor: "pointer", transition: "all 0.15s" }}
                  >
                    {copied ? <Check size={10} /> : <Copy size={10} />} {copied ? "Copied!" : "Copy"}
                  </button>
                  <button onClick={toggleEditing} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: editingMessage ? "rgba(124,58,237,0.15)" : "transparent", border: `1px solid ${editingMessage ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.1)"}`, color: editingMessage ? "#c4b5fd" : "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 700, padding: "4px 9px", borderRadius: 6, cursor: "pointer" }}>
                    <Edit3 size={10} /> {editingMessage ? "Done editing" : "Edit message"}
                  </button>
                </div>
              </div>

              {/* Dynamic Verified Branding Header */}
              {result.channel === "EMAIL" && (
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, padding: "10px 14px", marginBottom: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                    <span style={{ fontWeight: 600 }}>From:</span> Lumora Fashion <span style={{ color: "#a78bfa" }}>&lt;concierge@lumora.in&gt;</span>
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                    <span style={{ fontWeight: 600 }}>Subject:</span> <span style={{ color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>{result.subject || "Your Style Awaits"}</span>
                  </div>
                </div>
              )}

              {result.channel === "WHATSAPP" && (
                <div style={{ background: "rgba(37, 211, 102, 0.05)", border: "1px solid rgba(37, 211, 102, 0.15)", borderRadius: 8, padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#25D366" }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>Lumora Fashion</span>
                  <span style={{ display: "inline-flex", background: "#25D366", color: "#0d0d1a", borderRadius: "50%", width: 12, height: 12, alignItems: "center", justifyContent: "center" }}>
                    <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </span>
                  <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginLeft: "auto", textTransform: "uppercase", letterSpacing: 0.5 }}>Official Business Account</span>
                </div>
              )}

              {result.channel === "RCS" && (
                <div style={{ background: "rgba(251, 146, 60, 0.05)", border: "1px solid rgba(251, 146, 60, 0.15)", borderRadius: 8, padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fb923c" }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>Lumora Fashion</span>
                  <span style={{ display: "inline-flex", background: "#fb923c", color: "#0d0d1a", borderRadius: 4, padding: "1px 4px", fontSize: 8, fontWeight: 800 }}>VERIFIED</span>
                  <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginLeft: "auto", textTransform: "uppercase", letterSpacing: 0.5 }}>RCS Business Messaging</span>
                </div>
              )}

              {result.channel === "SMS" && (
                <div style={{ background: "rgba(56, 189, 248, 0.05)", border: "1px solid rgba(56, 189, 248, 0.15)", borderRadius: 8, padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#38bdf8" }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>LUMORA</span>
                  <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginLeft: "auto", textTransform: "uppercase", letterSpacing: 0.5 }}>Transactional Carrier SMS</span>
                </div>
              )}

              {editingMessage ? (
                <div>
                  <textarea
                    value={editedMessage}
                    onChange={e => setEditedMessage(e.target.value)}
                    style={{ width: "100%", minHeight: 140, background: "rgba(255,255,255,0.03)", border: `1px solid ${result.channel === "SMS" && editedMessage.length > 160 ? "rgba(248,113,113,0.5)" : "rgba(124,58,237,0.3)"}`, borderRadius: 10, color: "#fff", fontSize: 13, lineHeight: 1.7, padding: "12px 14px", outline: "none", fontFamily: "inherit", resize: "vertical" }}
                  />
                  {/* Character counter */}
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 5, gap: 10 }}>
                    {result.channel === "SMS" && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: editedMessage.length > 160 ? "#f87171" : editedMessage.length > 130 ? "#f59e0b" : "rgba(255,255,255,0.3)" }}>
                        {editedMessage.length}/160 chars {editedMessage.length > 160 ? "⚠️ Over SMS limit" : editedMessage.length > 130 ? "⚡ Near limit" : ""}
                      </span>
                    )}
                    {result.channel !== "SMS" && (
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>
                        {editedMessage.length} characters
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ background: "rgba(255,255,255,0.025)", borderRadius: 10, padding: "14px 16px" }}>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", margin: 0, lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{editedMessage}</p>
                </div>
              )}

              {/* RCS Dynamic Action Chips */}
              {!editingMessage && result.channel === "RCS" && (
                <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                  <a href="#" onClick={e => e.preventDefault()} style={{ background: "rgba(251, 146, 60, 0.1)", border: "1px solid rgba(251, 146, 60, 0.3)", borderRadius: 20, padding: "6px 14px", fontSize: 11, fontWeight: 700, color: "#fb923c", textDecoration: "none", cursor: "default" }}>
                    Shop Collection 🛍️
                  </a>
                  <a href="#" onClick={e => e.preventDefault()} style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: 20, padding: "6px 14px", fontSize: 11, fontWeight: 700, color: "rgba(255, 255, 255, 0.4)", textDecoration: "none", cursor: "default" }}>
                    Stop messages
                  </a>
                </div>
              )}
            </div>

            {/* A/B VARIANT GENERATOR Card */}
            <div ref={variantsRef} style={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "18px 20px", marginBottom: 11 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={sectionLabelStyle}>
                    <Sparkles size={12} color="rgba(255, 255, 255, 0.4)" />
                    <span>A/B Variant Generator</span>
                  </div>
                  <span style={{
                    fontSize: 9,
                    fontWeight: 800,
                    background: "linear-gradient(135deg, #7c3aed, #0d9488)",
                    color: "#fff",
                    padding: "2px 8px",
                    borderRadius: 9999,
                    textTransform: "uppercase",
                    letterSpacing: 0.5
                  }}>
                    AI
                  </span>
                </div>
                <span style={{
                  fontSize: 9,
                  fontWeight: 800,
                  background: "rgba(245, 158, 11, 0.12)",
                  border: "1px solid rgba(245, 158, 11, 0.22)",
                  color: "#f59e0b",
                  borderRadius: 6,
                  padding: "2px 8px",
                  textTransform: "uppercase",
                  letterSpacing: 0.5
                }}>
                  BETA
                </span>
              </div>

              {variantError ? (
                /* Friendly Error State */
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "24px 16px" }}>
                  <AlertTriangle size={32} color="#f59e0b" style={{ marginBottom: 12 }} />
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>ARIA couldn't generate variants right now.</h4>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "0 0 16px" }}>The original message above is ready to send.</p>
                  <button
                    onClick={() => {
                      setVariantError(false);
                      generateABVariants();
                    }}
                    style={{
                      background: "transparent",
                      border: "1px solid #7c3aed",
                      color: "#c4b5fd",
                      borderRadius: 9,
                      padding: "8px 16px",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    Try again
                  </button>
                </div>
              ) : generatingVariants ? (
                /* Shimmer Loader */
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[1, 2].map((i) => (
                    <div key={i} className="shimmer-skeleton" style={{ height: 260, borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", padding: 16 }}>
                      <div style={{ width: 80, height: 16, background: "rgba(255,255,255,0.08)", borderRadius: 4, marginBottom: 12 }} />
                      <div style={{ width: "100%", height: 12, background: "rgba(255,255,255,0.05)", borderRadius: 4, marginBottom: 8 }} />
                      <div style={{ width: "95%", height: 12, background: "rgba(255,255,255,0.05)", borderRadius: 4, marginBottom: 8 }} />
                      <div style={{ width: "60%", height: 12, background: "rgba(255,255,255,0.05)", borderRadius: 4, marginBottom: 16 }} />
                      <div style={{ width: "100%", height: 10, background: "rgba(255,255,255,0.04)", borderRadius: 4, marginBottom: 6 }} />
                      <div style={{ width: "80%", height: 10, background: "rgba(255,255,255,0.04)", borderRadius: 4 }} />
                    </div>
                  ))}
                </div>
              ) : !variants ? (
                /* Collapsed State */
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                    <div className="shimmer-skeleton" style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 12, padding: 12, height: 64, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.25)", fontWeight: 500 }}>Variant A: Exclusivity</span>
                    </div>
                    <div className="shimmer-skeleton" style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 12, padding: 12, height: 64, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.25)", fontWeight: 500 }}>Variant B: Warmth</span>
                    </div>
                  </div>

                  <button
                    onClick={generateABVariants}
                    style={{
                      width: "100%",
                      height: 44,
                      background: "linear-gradient(135deg, #7c3aed, #0d9488)",
                      color: "#fff",
                      border: "none",
                      borderRadius: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "opacity 0.15s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                  >
                    <Sparkles size={14} color="#fff" />
                    Generate variants →
                  </button>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 8, textAlign: "center" }}>
                    ARIA uses psychological principles to generate two distinct message strategies
                  </p>
                </div>
              ) : (
                /* Expanded State */
                <div style={{ position: "relative" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: "100%", position: "relative" }}>
                    {/* Left Card: Variant A */}
                    <div style={{
                      background: "rgba(255,255,255,0.02)",
                      border: `1px solid ${selectedVariant === "A" ? "#f59e0b" : "rgba(255,255,255,0.06)"}`,
                      boxShadow: selectedVariant === "A" ? "0 0 0 2px #f59e0b" : "none",
                      borderRadius: 12,
                      overflow: "hidden",
                      opacity: selectedVariant === "B" ? 0.4 : 1,
                      pointerEvents: selectedVariant === "B" ? "none" : "auto",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      position: "relative",
                      transition: "all 0.2s"
                    }}>
                      <div style={{ height: 3, background: "linear-gradient(90deg, #F59E0B, #EF4444)", width: "100%" }} />
                      
                      {selectedVariant === "A" && (
                        <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.22)", borderRadius: 6, padding: "2px 8px", color: "#34d399", fontSize: 10, fontWeight: 700 }}>
                          ✓ Selected
                        </div>
                      )}

                      <div style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 12, marginTop: 4 }}>
                          <span style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.4)" }}>VARIANT A</span>
                          <span style={{ background: "rgba(245,158,11,0.2)", border: "1px solid rgba(245,158,11,0.3)", color: "#fcd34d", borderRadius: 9999, padding: "2px 10px", fontSize: 10, fontWeight: 600 }}>
                            {variants.variantA.label || "Exclusivity & FOMO"}
                          </span>
                        </div>
                        {variants.variantA.subject && (
                          <p style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: "0 0 8px", lineHeight: 1.4 }}>
                            {variants.variantA.subject}
                          </p>
                        )}
                        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", margin: "0 0 12px", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                          {variants.variantA.body}
                        </p>
                        
                        <div style={{ background: "rgba(245, 158, 11, 0.08)", borderRadius: 8, padding: "8px 12px", marginTop: 12 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#fbbf24", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                            🧠 PSYCHOLOGICAL HOOK
                          </div>
                          <p style={{ fontSize: 12, color: "rgba(253, 230, 138, 0.8)", margin: "4px 0 0", fontStyle: "italic", lineHeight: 1.5 }}>
                            {variants.variantA.hook}
                          </p>
                        </div>
                      </div>

                      <div style={{ padding: "0 16px 16px" }}>
                        <button
                          onClick={() => handleSelectVariant("A")}
                          style={{
                            width: "100%",
                            height: 40,
                            background: selectedVariant === "A" ? "rgba(245,158,11,0.15)" : "transparent",
                            border: "1px solid rgba(245, 158, 11, 0.5)",
                            color: "#f59e0b",
                            borderRadius: 12,
                            fontWeight: 700,
                            fontSize: 12,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                            transition: "all 0.12s"
                          }}
                          onMouseEnter={(e) => { if (selectedVariant !== "A") e.currentTarget.style.background = "rgba(245,158,11,0.1)"; }}
                          onMouseLeave={(e) => { if (selectedVariant !== "A") e.currentTarget.style.background = "transparent"; }}
                        >
                          Use Variant A →
                        </button>
                      </div>
                    </div>

                    {/* Right Card: Variant B */}
                    <div style={{
                      background: "rgba(255,255,255,0.02)",
                      border: `1px solid ${selectedVariant === "B" ? "#7c3aed" : "rgba(255,255,255,0.06)"}`,
                      boxShadow: selectedVariant === "B" ? "0 0 0 2px #7c3aed" : "none",
                      borderRadius: 12,
                      overflow: "hidden",
                      opacity: selectedVariant === "A" ? 0.4 : 1,
                      pointerEvents: selectedVariant === "A" ? "none" : "auto",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      position: "relative",
                      transition: "all 0.2s"
                    }}>
                      <div style={{ height: 3, background: "linear-gradient(90deg, #7C3AED, #0D9488)", width: "100%" }} />
                      
                      {selectedVariant === "B" && (
                        <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.22)", borderRadius: 6, padding: "2px 8px", color: "#34d399", fontSize: 10, fontWeight: 700 }}>
                          ✓ Selected
                        </div>
                      )}

                      <div style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 12, marginTop: 4 }}>
                          <span style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.4)" }}>VARIANT B</span>
                          <span style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.3)", color: "#d8b4fe", borderRadius: 9999, padding: "2px 10px", fontSize: 10, fontWeight: 600 }}>
                            {variants.variantB.label || "Warmth & Relationship"}
                          </span>
                        </div>
                        {variants.variantB.subject && (
                          <p style={{ fontSize: 15, fontWeight: 700, color: "#f3e8ff", margin: "0 0 8px", lineHeight: 1.4 }}>
                            {variants.variantB.subject}
                          </p>
                        )}
                        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", margin: "0 0 12px", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                          {variants.variantB.body}
                        </p>
                        
                        <div style={{ background: "rgba(124, 58, 237, 0.08)", borderRadius: 8, padding: "8px 12px", marginTop: 12 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                            🧠 PSYCHOLOGICAL HOOK
                          </div>
                          <p style={{ fontSize: 12, color: "rgba(233, 213, 255, 0.8)", margin: "4px 0 0", fontStyle: "italic", lineHeight: 1.5 }}>
                            {variants.variantB.hook}
                          </p>
                        </div>
                      </div>

                      <div style={{ padding: "0 16px 16px" }}>
                        <button
                          onClick={() => handleSelectVariant("B")}
                          style={{
                            width: "100%",
                            height: 40,
                            background: selectedVariant === "B" ? "rgba(124,58,237,0.15)" : "transparent",
                            border: "1px solid rgba(124, 58, 237, 0.5)",
                            color: "#a78bfa",
                            borderRadius: 12,
                            fontWeight: 700,
                            fontSize: 12,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                            transition: "all 0.12s"
                          }}
                          onMouseEnter={(e) => { if (selectedVariant !== "B") e.currentTarget.style.background = "rgba(124,58,237,0.1)"; }}
                          onMouseLeave={(e) => { if (selectedVariant !== "B") e.currentTarget.style.background = "transparent"; }}
                        >
                          Use Variant B →
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* VS badge */}
                  <div style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    background: "#0d0d1f",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "50%",
                    width: 32,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "rgba(255, 255, 255, 0.6)",
                    fontSize: 12,
                    fontWeight: "bold",
                    zIndex: 10,
                    pointerEvents: "none"
                  }}>
                    VS
                  </div>

                  {/* Use original link */}
                  {selectedVariant && (
                    <div style={{ textAlign: "center", marginTop: 14 }}>
                      <button
                        onClick={handleUseOriginal}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "rgba(255,255,255,0.4)",
                          fontSize: 12,
                          cursor: "pointer",
                          transition: "color 0.15s"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = "#fff"}
                        onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}
                      >
                        ← Use original message instead
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Pre-launch prediction */}
            {prediction && (
              <div ref={predictionRef} style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.18)", borderRadius: 14, padding: "18px 20px", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={sectionLabelStyle}>
                    <Activity size={12} color="rgba(255, 255, 255, 0.4)" />
                    <span>Pre-launch prediction</span>
                  </div>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", fontStyle: "italic" }}>Modeled from audience × channel benchmarks</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
                  {[
                    { label: "Reach",    value: prediction.reach.toLocaleString(),               color: "#fff" },
                    { label: "Opens",    value: prediction.opens.toLocaleString(),               color: "#a78bfa" },
                    { label: "Clicks",   value: prediction.clicks.toLocaleString(),              color: "#38bdf8" },
                    { label: "Conv.",    value: prediction.conversions.toLocaleString(),         color: "#34d399" },
                    { label: "Revenue",  value: formatINR(prediction.revenue),                   color: "#34d399" },
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
            <div ref={launchRef}>
              {!launched ? (
                <button ref={launchButtonRef} onClick={handleLaunch} disabled={launching} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: launching ? "rgba(124,58,237,0.28)" : "linear-gradient(135deg, #7c3aed, #0891b2)", color: "#fff", border: "none", cursor: launching ? "wait" : "pointer", fontSize: 15, fontWeight: 800, padding: "15px 24px", borderRadius: 13, transition: "opacity 0.15s", boxShadow: launching ? "none" : "0 8px 28px rgba(124,58,237,0.3)" }}>
                  {launching
                    ? <><Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Launching Campaign...</>
                    : <><Zap size={18} /> Launch This Campaign — Human approval granted</>
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
            </div>

            {/* Sticky Launch Bar (4A) */}
            {showStickyBar && !launched && (
              <div style={{
                position: "fixed",
                bottom: 0,
                left: 228,
                right: 0,
                background: "rgba(13, 13, 31, 0.95)",
                backdropFilter: "blur(8px)",
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                padding: "12px 24px",
                zIndex: 50,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                boxShadow: "0 -10px 30px rgba(0,0,0,0.5)"
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
                    {result.campaignName}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                    Audience: {result.segmentName} ({prediction?.reach || 0} matched shoppers)
                  </div>
                </div>
                <button
                  onClick={handleLaunch}
                  disabled={launching}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    background: launching ? "rgba(124,58,237,0.28)" : "linear-gradient(135deg, #7c3aed, #0891b2)",
                    color: "#fff",
                    border: "none",
                    cursor: launching ? "wait" : "pointer",
                    fontSize: 13,
                    fontWeight: 800,
                    padding: "10px 20px",
                    borderRadius: 10,
                    transition: "opacity 0.15s",
                    boxShadow: launching ? "none" : "0 4px 14px rgba(124,58,237,0.3)"
                  }}
                >
                  {launching ? (
                    <>
                      <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                      Launching...
                    </>
                  ) : (
                    <>
                      <Zap size={14} />
                      Launch Campaign
                    </>
                  )}
                </button>
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

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .shimmer-skeleton {
          background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
          50% { box-shadow: 0 0 0 8px rgba(16,185,129,0.2); }
        }
      `}</style>
    </div>
  );
}
