"use client";
import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Loader2, CheckCircle, Users, MessageSquare, Zap, ChevronRight, ArrowRight } from "lucide-react";
import { toast } from "@/components/ui/toast";
import Link from "next/link";

interface AIResult {
  intent: string;
  segmentName: string;
  segmentDescription: string;
  filterRules: Record<string, unknown>;
  channel: string;
  subject?: string;
  messageBody: string;
  campaignName: string;
  reasoning: string;
  estimatedAudience: string;
}

interface SegmentContext {
  id: string;
  name: string;
  description: string | null;
  audienceCount: number;
}

const PROMPTS = [
  { text: "Send a win-back offer to customers who haven't ordered in 90 days", tag: "Win-back" },
  { text: "Create a VIP exclusive campaign for our top spenders", tag: "VIP" },
  { text: "Welcome new customers who joined this month with a first order discount", tag: "Onboarding" },
  { text: "Re-engage at-risk customers in Mumbai before they churn", tag: "Retention" },
  { text: "Launch a flash sale for customers who clicked but didn't buy", tag: "Conversion" },
];

const CH_STYLE: Record<string, { color: string; bg: string }> = {
  EMAIL:    { color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  SMS:      { color: "#38bdf8", bg: "rgba(56,189,248,0.12)" },
  WHATSAPP: { color: "#34d399", bg: "rgba(52,211,153,0.12)" },
  RCS:      { color: "#fb923c", bg: "rgba(251,146,60,0.12)" },
};

export default function CommandPage() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);
  const [launching, setLaunching] = useState(false);
  const [launched, setLaunched] = useState<{ campaignId: string } | null>(null);
  const [segmentContext, setSegmentContext] = useState<SegmentContext | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) textareaRef.current.focus();

    const prefill = sessionStorage.getItem("aria_prefill");
    if (prefill) {
      setPrompt(prefill);
      sessionStorage.removeItem("aria_prefill");
    }

    const segment = sessionStorage.getItem("aria_segment_context");
    if (segment) {
      try {
        setSegmentContext(JSON.parse(segment) as SegmentContext);
      } catch {
        sessionStorage.removeItem("aria_segment_context");
      }
    }
  }, []);

  async function handleSubmit() {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setResult(null);
    setLaunched(null);
    try {
      const res = await fetch("/api/ai/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data.ok) setResult(data.data);
      else toast.error("AI error: " + data.error);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleLaunch() {
    if (!result) return;
    setLaunching(true);
    try {
      let segmentId = segmentContext?.id;

      if (!segmentId) {
        const segRes = await fetch("/api/segments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: result.segmentName,
            description: result.segmentDescription,
            filterRules: result.filterRules,
            aiGenerated: true,
            prompt,
          }),
        });
        const segment = await segRes.json();
        segmentId = segment.id;
      }

      const campRes = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: result.campaignName,
          description: result.intent,
          segmentId,
          channel: result.channel,
          messageBody: result.messageBody,
          subject: result.subject,
          aiGenerated: true,
          prompt,
        }),
      });
      const campaign = await campRes.json();

      await fetch(`/api/campaigns/${campaign.id}/send`, { method: "POST" });
      setLaunched({ campaignId: campaign.id });
      sessionStorage.removeItem("aria_segment_context");
      toast.success("Campaign launched! Delivery tracking is live.");
    } catch {
      toast.error("Launch failed — please try again");
    } finally {
      setLaunching(false);
    }
  }

  const ch = result ? (CH_STYLE[result.channel] || CH_STYLE.EMAIL) : null;

  return (
    <div style={{ padding: "36px 40px 60px", maxWidth: 760, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg, #7c3aed, #0891b2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sparkles size={18} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: 0 }}>AI Command</h1>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0 }}>Powered by Gemini 2.5 Flash</p>
          </div>
        </div>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.38)", marginTop: 10 }}>
          Describe your marketing goal in plain English. ARIA builds the audience, writes the copy, and launches the campaign.
        </p>
        {segmentContext && (
          <div style={{ marginTop: 16, background: "rgba(167,139,250,0.09)", border: "1px solid rgba(167,139,250,0.22)", borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: 1 }}>Selected audience</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginTop: 3 }}>{segmentContext.name}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", marginTop: 2 }}>{segmentContext.description || "Existing segment"} · {segmentContext.audienceCount.toLocaleString()} matched shoppers</div>
            </div>
            <button
              onClick={() => {
                setSegmentContext(null);
                sessionStorage.removeItem("aria_segment_context");
              }}
              style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.5)", borderRadius: 8, padding: "7px 10px", fontSize: 12, cursor: "pointer" }}
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ background: "#0d0d1a", border: `1px solid ${loading ? "rgba(124,58,237,0.5)" : "#1e1e32"}`, borderRadius: 14, overflow: "hidden", transition: "border-color 0.2s" }}>
        <div style={{ display: "flex", gap: 12, padding: "16px 18px 0" }}>
          <div style={{ paddingTop: 3, flexShrink: 0 }}>
            <Sparkles size={16} color="#a78bfa" />
          </div>
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }}}
            placeholder={"Describe your campaign goal in plain English...\ne.g. Send a win-back offer to customers who haven't ordered in 90 days"}
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: 14, lineHeight: 1.6, resize: "none", minHeight: 72, fontFamily: "-apple-system, sans-serif", caretColor: "#a78bfa" }}
            rows={3}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 18px 14px", borderTop: "1px solid #16162a", marginTop: 12 }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.18)" }}>Enter to run · Shift+Enter for new line</span>
          <button
            onClick={handleSubmit}
            disabled={!prompt.trim() || loading}
            style={{ display: "inline-flex", alignItems: "center", gap: 7, background: prompt.trim() && !loading ? "linear-gradient(135deg, #7c3aed, #0891b2)" : "rgba(255,255,255,0.06)", color: prompt.trim() && !loading ? "#fff" : "rgba(255,255,255,0.25)", border: "none", cursor: prompt.trim() && !loading ? "pointer" : "not-allowed", fontSize: 13, fontWeight: 600, padding: "8px 18px", borderRadius: 8, transition: "all 0.15s" }}
          >
            {loading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={14} />}
            {loading ? "Thinking..." : "Run ARIA"}
          </button>
        </div>
      </div>

      {/* Suggestions */}
      {!result && !loading && (
        <div style={{ marginTop: 24 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.22)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 }}>Try these</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {PROMPTS.map(({ text, tag }) => (
              <button key={text} onClick={() => setPrompt(text)}
                style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", padding: "11px 14px", borderRadius: 10, background: "#0d0d1a", border: "1px solid #1a1a2e", cursor: "pointer", transition: "all 0.12s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(124,58,237,0.3)"; (e.currentTarget as HTMLElement).style.background = "rgba(124,58,237,0.06)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#1a1a2e"; (e.currentTarget as HTMLElement).style.background = "#0d0d1a"; }}
              >
                <span style={{ fontSize: 10, fontWeight: 700, color: "#a78bfa", background: "rgba(124,58,237,0.15)", padding: "2px 7px", borderRadius: 4, letterSpacing: 0.4, whiteSpace: "nowrap", flexShrink: 0 }}>{tag}</span>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", flex: 1 }}>{text}</span>
                <ChevronRight size={13} color="rgba(255,255,255,0.2)" style={{ flexShrink: 0 }} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ marginTop: 40, textAlign: "center", padding: "32px 0" }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(124,58,237,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Sparkles size={26} color="#a78bfa" />
          </div>
          <p style={{ fontSize: 15, fontWeight: 500, color: "rgba(255,255,255,0.6)", margin: 0 }}>ARIA is thinking...</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginTop: 6 }}>Analysing audience · crafting message · choosing channel</p>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div style={{ marginTop: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <CheckCircle size={16} color="#34d399" />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#34d399" }}>ARIA has a plan</span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginLeft: 4 }}>{result.intent}</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div style={{ background: "#0d0d1a", border: "1px solid #1e1e32", borderRadius: 12, padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
                <Users size={13} color="#a78bfa" />
                <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1.2 }}>Audience</span>
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#fff", margin: "0 0 4px" }}>{result.segmentName}</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", margin: "0 0 12px", lineHeight: 1.5 }}>{result.segmentDescription}</p>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: 6, padding: "4px 10px" }}>
                <Users size={11} color="#a78bfa" />
                <span style={{ fontSize: 12, color: "#c4b5fd", fontWeight: 500 }}>≈ {result.estimatedAudience}</span>
              </div>
            </div>

            <div style={{ background: "#0d0d1a", border: "1px solid #1e1e32", borderRadius: 12, padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
                <Zap size={13} color="#38bdf8" />
                <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1.2 }}>Channel</span>
              </div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: ch?.bg, borderRadius: 8, padding: "5px 14px", marginBottom: 10 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: ch?.color }}>{result.channel}</span>
              </div>
              {result.subject && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "0 0 8px" }}>Subject: <span style={{ color: "rgba(255,255,255,0.6)" }}>{result.subject}</span></p>}
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>{result.reasoning}</p>
            </div>
          </div>

          <div style={{ background: "#0d0d1a", border: "1px solid #1e1e32", borderRadius: 12, padding: "18px 20px", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
              <MessageSquare size={13} color="#34d399" />
              <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1.2 }}>Message Preview</span>
            </div>
            {result.subject && (
              <div style={{ marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid #1a1a2e" }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Subject: </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>{result.subject}</span>
              </div>
            )}
            <div style={{ background: "rgba(255,255,255,0.025)", borderRadius: 8, padding: "14px 16px" }}>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.72)", margin: 0, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{result.messageBody}</p>
            </div>
          </div>

          {!launched ? (
            <button onClick={handleLaunch} disabled={launching}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: launching ? "rgba(124,58,237,0.3)" : "linear-gradient(135deg, #7c3aed, #0891b2)", color: "#fff", border: "none", cursor: launching ? "wait" : "pointer", fontSize: 15, fontWeight: 700, padding: "15px 24px", borderRadius: 12, transition: "opacity 0.15s", boxShadow: "0 4px 20px rgba(124,58,237,0.28)" }}
            >
              {launching ? <><Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Launching Campaign...</> : <><Zap size={18} /> Launch This Campaign</>}
            </button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: 12, padding: "14px 24px", color: "#34d399", fontSize: 14, fontWeight: 600 }}>
                <CheckCircle size={18} /> Campaign Launched! Delivery tracking is live.
              </div>
              <Link href={`/campaigns/${launched.campaignId}`}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: "#a78bfa", fontSize: 13, textDecoration: "none", padding: "10px", borderRadius: 10, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.18)" }}
              >
                View live analytics <ArrowRight size={13} />
              </Link>
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
