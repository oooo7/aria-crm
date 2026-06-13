"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Brain, CheckCircle2, CircleDollarSign,
  GitCompareArrows, Gauge, Loader2, Radio, ShieldAlert,
  Sparkles, Target, TrendingUp, Upload, Zap, Users,
  Megaphone, Activity, Crown, AlertTriangle, Star,
  ChevronRight, Clock,
} from "lucide-react";
import Link from "next/link";
import ImportCustomersModal from "@/components/ImportCustomersModal";

interface Action {
  id: string; title: string; goal: string; audience: number; channel: string;
  confidence: number; predictedReach: number; predictedOpens: number;
  predictedClicks: number; predictedConversions: number; predictedRevenue: number;
  riskRecovered: number; why: string; tradeoff: string; prompt: string;
}

interface Mission {
  businessHealthScore: number; revenueAtRisk: number; revenueOpportunity: number;
  predictedMonthlyRevenue: number; avgOrderValue: number; totalCustomers: number;
  totalSent: number; delivered: number; opened: number; clicked: number;
  converted: number; failed: number;
  segments: { lapsed: number; atRisk: number; vip: number; new: number };
  executiveSummary: string; recommendedActions: Action[];
  recentCampaigns: Array<{ id: string; name: string; status: string; channel: string; recipients: number; segment: string; aiGenerated: boolean }>;
}

const glass = {
  background: "linear-gradient(145deg, rgba(15,15,30,0.92), rgba(8,8,20,0.78))",
  border: "1px solid rgba(255,255,255,0.075)",
  boxShadow: "0 20px 60px rgba(0,0,0,0.32)",
  backdropFilter: "blur(20px)",
};

const channelColor: Record<string, string> = {
  EMAIL: "#a78bfa", SMS: "#38bdf8", WHATSAPP: "#34d399", RCS: "#fb923c",
};
const channelBg: Record<string, string> = {
  EMAIL: "rgba(167,139,250,0.12)", SMS: "rgba(56,189,248,0.12)",
  WHATSAPP: "rgba(52,211,153,0.12)", RCS: "rgba(251,146,60,0.12)",
};
const statusColor: Record<string, string> = {
  SENT: "#34d399", SENDING: "#38bdf8", DRAFT: "rgba(255,255,255,0.3)", FAILED: "#f87171",
};

function money(v: number) { return `₹${Math.round(v).toLocaleString("en-IN")}`; }
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

function AnimatedNumber({ value, prefix = "" }: { value: number; prefix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const start = display, delta = value - start, started = performance.now(), duration = 950;
    let frame = 0;
    function tick(now: number) {
      const p = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(start + delta * eased));
      if (p < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <>{prefix}{display.toLocaleString("en-IN")}</>;
}

function HealthRing({ score }: { score: number }) {
  const radius = 52, circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score > 75 ? "#34d399" : score > 58 ? "#f59e0b" : "#f87171";
  const label = score > 75 ? "Healthy" : score > 58 ? "At risk" : "Critical";
  return (
    <div style={{ position: "relative", width: 132, height: 132, flexShrink: 0 }}>
      <svg width="132" height="132" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="66" cy="66" r={radius} stroke="rgba(255,255,255,0.06)" strokeWidth="9" fill="none" />
        <motion.circle
          cx="66" cy="66" r={radius} stroke={color} strokeWidth="9" fill="none"
          strokeLinecap="round" strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 32, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: 9, color, textTransform: "uppercase", letterSpacing: 1.4, marginTop: 3, fontWeight: 700 }}>{label}</div>
      </div>
    </div>
  );
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden", marginTop: 6 }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${max > 0 ? (value / max) * 100 : 0}%` }}
        transition={{ duration: 1.1, ease: "easeOut" }}
        style={{ height: "100%", background: color, borderRadius: 4 }}
      />
    </div>
  );
}

function ActionCard({ action, index }: { action: Action; index: number }) {
  const color = channelColor[action.channel] || "#a78bfa";
  const bg = channelBg[action.channel] || "rgba(167,139,250,0.12)";

  function sendToCommand() {
    sessionStorage.setItem("aria_prefill", action.prompt);
    window.location.href = "/command";
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.45 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      style={{ ...glass, borderRadius: 18, padding: 20, cursor: "default", border: `1px solid rgba(255,255,255,0.075)` }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: bg, color, fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 6, letterSpacing: 0.8, textTransform: "uppercase" }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: color, display: "inline-block" }} />
              {action.channel}
            </span>
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: "#fff", margin: "0 0 3px", lineHeight: 1.3 }}>{action.title}</h3>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", margin: 0 }}>{action.goal}</p>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 24, fontWeight: 900, color, lineHeight: 1 }}>{action.confidence}%</div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: 1, marginTop: 2 }}>confidence</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 12 }}>
        {[["Reach", action.predictedReach], ["Opens", action.predictedOpens], ["Clicks", action.predictedClicks], ["Conv.", action.predictedConversions]].map(([label, value]) => (
          <div key={String(label)} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 9, padding: "9px 7px", textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{Number(value).toLocaleString("en-IN")}</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 12 }}>
        <div style={{ background: "rgba(52,211,153,0.07)", border: "1px solid rgba(52,211,153,0.13)", borderRadius: 9, padding: 11 }}>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Revenue</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: "#34d399" }}>{money(action.predictedRevenue)}</div>
        </div>
        <div style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.13)", borderRadius: 9, padding: 11 }}>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Recovered</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: "#f59e0b" }}>{money(action.riskRecovered)}</div>
        </div>
      </div>

      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.46)", margin: "0 0 6px", lineHeight: 1.55 }}>{action.why}</p>
      <p style={{ fontSize: 10, color: "rgba(255,255,255,0.26)", margin: "0 0 14px", lineHeight: 1.45 }}>Tradeoff: {action.tradeoff}</p>

      <button
        onClick={sendToCommand}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: `linear-gradient(135deg, ${color}CC, #0891b2)`, color: "#fff", border: "none", borderRadius: 10, padding: "10px 14px", fontSize: 12, fontWeight: 800, cursor: "pointer", transition: "opacity 0.15s" }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "0.88"}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
      >
        Brief ARIA to execute <ArrowRight size={13} />
      </button>
    </motion.div>
  );
}

function DecisionEngine({ action, mission }: { action: Action; mission: Mission }) {
  const alternatives = mission.recommendedActions.filter(a => a.id !== action.id).slice(0, 2);
  const color = channelColor[action.channel] || "#a78bfa";

  function sendToCommand() {
    sessionStorage.setItem("aria_prefill", action.prompt);
    window.location.href = "/command";
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ ...glass, borderRadius: 22, padding: 26, marginBottom: 16, border: `1px solid ${color}35` }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: 24, alignItems: "stretch" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Brain size={14} color={color} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 900, color, textTransform: "uppercase", letterSpacing: 1.6 }}>ARIA Decision Engine</span>
            <span style={{ fontSize: 9, background: "rgba(52,211,153,0.12)", color: "#34d399", border: "1px solid rgba(52,211,153,0.2)", borderRadius: 4, padding: "2px 7px", fontWeight: 700, letterSpacing: 0.6 }}>Top priority</span>
          </div>
          <h2 style={{ fontSize: 26, lineHeight: 1.1, fontWeight: 900, color: "#fff", margin: "0 0 10px" }}>{action.title}</h2>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.65, margin: "0 0 18px" }}>{action.why}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 18 }}>
            {[
              ["Expected Revenue", money(action.predictedRevenue), "#34d399"],
              ["Confidence", `${action.confidence}%`, color],
              ["Audience size", action.audience.toLocaleString("en-IN"), "#38bdf8"],
            ].map(([label, value, metricColor]) => (
              <div key={String(label)} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
                <div style={{ fontSize: 19, fontWeight: 950, color: String(metricColor), marginTop: 5 }}>{value}</div>
              </div>
            ))}
          </div>
          <button onClick={sendToCommand} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: `linear-gradient(135deg, ${color}, #0891b2)`, color: "#fff", border: "none", borderRadius: 12, padding: "13px 20px", fontSize: 13, fontWeight: 800, cursor: "pointer", boxShadow: `0 8px 24px ${color}30` }}>
            Approve strategy in Growth Agent <ArrowRight size={14} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 18, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
              <GitCompareArrows size={13} color="#fbbf24" />
              <span style={{ fontSize: 9, fontWeight: 900, color: "rgba(255,255,255,0.32)", textTransform: "uppercase", letterSpacing: 1.2 }}>Why this over alternatives</span>
            </div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.52)", lineHeight: 1.6, margin: "0 0 12px" }}>{action.tradeoff}</p>
            {alternatives.map(alt => (
              <div key={alt.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 8 }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.38)" }}>{alt.title}</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.24)", whiteSpace: "nowrap" }}>{money(alt.predictedRevenue)} · {alt.confidence}%</span>
              </div>
            ))}
          </div>
          <div style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.14)", borderRadius: 16, padding: 16 }}>
            <span style={{ fontSize: 9, fontWeight: 900, color: "#34d399", textTransform: "uppercase", letterSpacing: 1.2 }}>Signals used</span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginTop: 10 }}>
              {[
                `${mission.segments.vip} VIP`,
                `${mission.segments.lapsed} lapsed`,
                `${mission.segments.atRisk} at risk`,
                `${money(mission.avgOrderValue)} AOV`,
              ].map(signal => (
                <div key={signal} style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", background: "rgba(0,0,0,0.2)", borderRadius: 9, padding: "7px 10px" }}>{signal}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function MissionControl() {
  const [mission, setMission] = useState<Mission | null>(null);
  const [goal, setGoal] = useState("Increase revenue by 15% without over-discounting");
  const [planning, setPlanning] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [plan, setPlan] = useState<null | {
    confidence: number; predictedReach: number; predictedConversions: number;
    predictedRevenue: number; predictedROI: string; strategy: string;
    reasoning: string[]; workflow: string[]; campaigns: Action[];
  }>(null);

  function loadMission() {
    fetch("/api/ai/mission").then(r => r.json()).then(setMission);
  }

  useEffect(() => { loadMission(); }, []);

  async function buildPlan() {
    setPlanning(true); setPlan(null);
    const res = await fetch("/api/ai/plan", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal }),
    });
    const data = await res.json();
    setPlan(data.plan);
    setPlanning(false);
  }

  const agentSteps = useMemo(() => plan?.workflow || [
    "Analyzing customer base", "Scoring revenue risk",
    "Ranking lifecycle opportunities", "Waiting for goal",
  ], [plan]);

  if (!mission) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "radial-gradient(circle at 30% 20%, rgba(124,58,237,0.15), transparent 35%), #080810" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: "rgba(124,58,237,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", animation: "glow-pulse 2s ease-in-out infinite" }}>
            <Sparkles size={28} color="#a78bfa" />
          </div>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 15, fontWeight: 600 }}>ARIA is preparing the CMO briefing...</p>
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, marginTop: 6 }}>Analyzing customer lifecycle · Scoring revenue risk</p>
        </div>
      </div>
    );
  }

  const totalEngaged = mission.delivered + mission.opened + mission.clicked;
  const campaignDeliveryRate = mission.totalSent > 0 ? ((mission.delivered / mission.totalSent) * 100).toFixed(0) : "0";

  return (
    <div style={{ minHeight: "100vh", padding: "30px 36px 70px", background: "radial-gradient(ellipse at 10% 0%, rgba(124,58,237,0.16) 0%, transparent 45%), radial-gradient(ellipse at 90% 5%, rgba(8,145,178,0.12) 0%, transparent 40%), #080810" }}>
      {showImport && <ImportCustomersModal onClose={() => setShowImport(false)} onImported={loadMission} />}

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, marginBottom: 22 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)", color: "#c4b5fd", borderRadius: 999, padding: "5px 10px", fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#a78bfa", animation: "pulse-dot 2s ease-in-out infinite" }} />
              ARIA Mission Control
            </span>
          </div>
          <h1 style={{ fontSize: 32, lineHeight: 1.08, fontWeight: 900, color: "#fff", margin: "0 0 9px" }}>
            {getGreeting()}. ARIA has a revenue plan.
          </h1>
          <p style={{ color: "rgba(255,255,255,0.42)", fontSize: 13.5, maxWidth: 680, lineHeight: 1.65, margin: 0 }}>{mission.executiveSummary}</p>
        </div>
        <div style={{ display: "flex", gap: 9, flexShrink: 0 }}>
          <button onClick={() => setShowImport(true)} style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,0.055)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: 700, padding: "10px 15px", borderRadius: 11, cursor: "pointer" }}>
            <Upload size={13} /> Import Customers
          </button>
          <Link href="/command" style={{ display: "inline-flex", alignItems: "center", gap: 7, textDecoration: "none", background: "linear-gradient(135deg, #7c3aed, #0891b2)", color: "#fff", fontSize: 12, fontWeight: 800, padding: "10px 16px", borderRadius: 11, boxShadow: "0 12px 36px rgba(124,58,237,0.28)" }}>
            Open Growth Agent <Sparkles size={13} />
          </Link>
        </div>
      </motion.div>

      {/* KPI strip */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 11, marginBottom: 16 }}>
        {[
          { label: "Revenue at risk", value: mission.revenueAtRisk, icon: ShieldAlert, color: "#f87171", prefix: "₹", sub: `${mission.segments.lapsed + mission.segments.atRisk} shoppers drifting` },
          { label: "Revenue opportunity", value: mission.revenueOpportunity, icon: Target, color: "#34d399", prefix: "₹", sub: `${mission.segments.vip + mission.segments.new} shoppers to activate` },
          { label: "Predicted monthly", value: mission.predictedMonthlyRevenue, icon: TrendingUp, color: "#38bdf8", prefix: "₹", sub: "Based on current trajectory" },
          { label: "Avg order value", value: mission.avgOrderValue, icon: CircleDollarSign, color: "#fbbf24", prefix: "₹", sub: `${mission.totalCustomers.toLocaleString()} active shoppers` },
        ].map(({ label, value, icon: Icon, color, prefix, sub }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + i * 0.04 }} whileHover={{ y: -3, transition: { duration: 0.18 } }} style={{ ...glass, borderRadius: 16, padding: "18px 20px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", right: -20, top: -20, width: 80, height: 80, borderRadius: "50%", background: color, opacity: 0.07, filter: "blur(16px)" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: `${color}16`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={15} color={color} />
              </div>
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.32)", textTransform: "uppercase", letterSpacing: 1.1, fontWeight: 800, marginBottom: 5 }}>{label}</div>
            <div style={{ fontSize: 23, color, fontWeight: 900, lineHeight: 1, marginBottom: 6 }}>
              <AnimatedNumber value={value} prefix={prefix} />
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.22)" }}>{sub}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Decision Engine — hero */}
      {mission.recommendedActions[0] && <DecisionEngine action={mission.recommendedActions[0]} mission={mission} />}

      {/* Health + Segments + Agent */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
        {/* Business health */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ ...glass, borderRadius: 20, padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 18 }}>
            <Gauge size={15} color="#34d399" />
            <span style={{ fontSize: 10, fontWeight: 900, color: "rgba(255,255,255,0.38)", textTransform: "uppercase", letterSpacing: 1.4 }}>Business health score</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 18 }}>
            <HealthRing score={mission.businessHealthScore} />
            <div>
              <h3 style={{ fontSize: 15, color: "#fff", margin: "0 0 7px", fontWeight: 800, lineHeight: 1.3 }}>Retention pressure is visible, but recoverable.</h3>
              <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.42)", lineHeight: 1.55, margin: 0 }}>ARIA is prioritizing lifecycle moments where a campaign can protect revenue.</p>
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 14 }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 10 }}>Campaign delivery health</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.42)" }}>Delivery rate</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#34d399" }}>{campaignDeliveryRate}%</span>
            </div>
            <MiniBar value={mission.delivered} max={mission.totalSent || 1} color="#34d399" />
          </div>
        </motion.div>

        {/* Segment breakdown */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} style={{ ...glass, borderRadius: 20, padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <Users size={15} color="#a78bfa" />
              <span style={{ fontSize: 10, fontWeight: 900, color: "rgba(255,255,255,0.38)", textTransform: "uppercase", letterSpacing: 1.4 }}>Shopper pulse</span>
            </div>
            <Link href="/customers" style={{ fontSize: 10, color: "#a78bfa", textDecoration: "none", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
              View all <ChevronRight size={11} />
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "VIP shoppers", value: mission.segments.vip, icon: Crown, color: "#fbbf24", sub: "₹20K+ lifetime value" },
              { label: "At risk", value: mission.segments.atRisk, icon: AlertTriangle, color: "#f87171", sub: "45–89 days inactive" },
              { label: "Lapsed", value: mission.segments.lapsed, icon: TrendingUp, color: "#f59e0b", sub: "90+ days inactive" },
              { label: "New shoppers", value: mission.segments.new, icon: Star, color: "#38bdf8", sub: "First order this month" },
            ].map(({ label, value, icon: Icon, color, sub }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 11 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: `${color}14`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={14} color={color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: "#fff", fontWeight: 600 }}>{label}</span>
                    <span style={{ fontSize: 15, fontWeight: 900, color }}>{value}</span>
                  </div>
                  <MiniBar value={value} max={mission.totalCustomers} color={color} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* AI reasoning engine */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} style={{ ...glass, borderRadius: 20, padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 16 }}>
            <Brain size={15} color="#a78bfa" />
            <span style={{ fontSize: 10, fontWeight: 900, color: "rgba(255,255,255,0.38)", textTransform: "uppercase", letterSpacing: 1.4 }}>AI reasoning engine</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {agentSteps.map((step, i) => (
              <motion.div key={step} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.06 }} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <div style={{ width: 20, height: 20, borderRadius: 6, background: i < agentSteps.length - 1 || plan ? "rgba(52,211,153,0.12)" : "rgba(167,139,250,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <CheckCircle2 size={11} color={i < agentSteps.length - 1 || plan ? "#34d399" : "#a78bfa"} />
                </div>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.56)" }}>{step}</span>
              </motion.div>
            ))}
          </div>
          {!plan && (
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.32)", margin: 0, fontStyle: "italic" }}>Enter a goal below to build a full strategy.</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Goal builder + action cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
        {/* Goal planner */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} style={{ ...glass, borderRadius: 20, padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
            <Zap size={15} color="#a78bfa" />
            <span style={{ fontSize: 10, fontWeight: 900, color: "rgba(255,255,255,0.38)", textTransform: "uppercase", letterSpacing: 1.4 }}>Goal-driven strategy</span>
          </div>
          <textarea
            value={goal}
            onChange={e => setGoal(e.target.value)}
            style={{ width: "100%", minHeight: 80, resize: "none", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 12, outline: "none", color: "#fff", fontSize: 13, lineHeight: 1.6, padding: 12, marginBottom: 11, fontFamily: "inherit" }}
          />
          <button onClick={buildPlan} disabled={planning || !goal.trim()} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, border: "none", borderRadius: 11, padding: "11px 14px", background: planning ? "rgba(124,58,237,0.22)" : "linear-gradient(135deg, #7c3aed, #0891b2)", color: "#fff", fontWeight: 800, cursor: planning ? "wait" : "pointer", fontSize: 12 }}>
            {planning ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Brain size={14} />}
            {planning ? "ARIA is building the strategy..." : "Ask ARIA to build strategy"}
          </button>
          <AnimatePresence>
            {plan && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ marginTop: 14, background: "rgba(52,211,153,0.07)", border: "1px solid rgba(52,211,153,0.16)", borderRadius: 12, padding: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 7, marginBottom: 10 }}>
                  {[
                    ["Reach", plan.predictedReach],
                    ["Conv.", plan.predictedConversions],
                  ].map(([label, value]) => (
                    <div key={String(label)} style={{ background: "rgba(0,0,0,0.18)", borderRadius: 9, padding: "8px 10px" }}>
                      <div style={{ fontSize: 15, color: "#fff", fontWeight: 900 }}>{Number(value).toLocaleString("en-IN")}</div>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.32)", marginTop: 2 }}>{label}</div>
                    </div>
                  ))}
                  {[
                    ["Revenue", money(plan.predictedRevenue)],
                    ["Conf.", `${plan.confidence}%`],
                  ].map(([label, value]) => (
                    <div key={String(label)} style={{ background: "rgba(0,0,0,0.18)", borderRadius: 9, padding: "8px 10px" }}>
                      <div style={{ fontSize: 15, color: "#34d399", fontWeight: 900 }}>{value}</div>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.32)", marginTop: 2 }}>{label}</div>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.62)", lineHeight: 1.55, margin: "0 0 8px" }}>{plan.strategy}</p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.32)", margin: 0 }}>Predicted ROI: {plan.predictedROI}. Human approval required before launch.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Action cards */}
        {mission.recommendedActions.slice(1, 3).map((action, i) => (
          <ActionCard key={action.id} action={action} index={i} />
        ))}
      </div>

      {/* Recent campaigns */}
      {mission.recentCampaigns.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }} style={{ ...glass, borderRadius: 20, padding: 22, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <Megaphone size={15} color="#38bdf8" />
              <span style={{ fontSize: 10, fontWeight: 900, color: "rgba(255,255,255,0.38)", textTransform: "uppercase", letterSpacing: 1.4 }}>Recent campaigns</span>
            </div>
            <Link href="/campaigns" style={{ fontSize: 10, color: "#38bdf8", textDecoration: "none", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
              View all <ChevronRight size={11} />
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {mission.recentCampaigns.map(c => {
              const cColor = channelColor[c.channel] || "#a78bfa";
              const sColor = statusColor[c.status] || "rgba(255,255,255,0.3)";
              return (
                <Link key={c.id} href={`/campaigns/${c.id}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.055)", borderRadius: 11, padding: "12px 14px", textDecoration: "none", transition: "all 0.12s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.055)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.055)"; }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: channelBg[c.channel] || "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: cColor, flexShrink: 0 }}>
                      {c.channel[0]}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>{c.name}</span>
                        {c.aiGenerated && <span style={{ fontSize: 8, background: "rgba(124,58,237,0.2)", color: "#a78bfa", padding: "2px 5px", borderRadius: 3, fontWeight: 700, letterSpacing: 0.6 }}>AI</span>}
                      </div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", marginTop: 1 }}>{c.segment} · {c.recipients.toLocaleString()} recipients</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: sColor, background: `${sColor}14`, border: `1px solid ${sColor}30`, padding: "3px 9px", borderRadius: 999 }}>{c.status}</span>
                    <ArrowRight size={13} color="rgba(255,255,255,0.2)" />
                  </div>
                </Link>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Bottom action cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {mission.recommendedActions.slice(3, 6).map((action, i) => (
          <ActionCard key={action.id} action={action} index={i + 3} />
        ))}
      </div>

      {/* Activity feed */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }} style={{ ...glass, borderRadius: 20, padding: 22, marginTop: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
          <Activity size={15} color="#38bdf8" />
          <span style={{ fontSize: 10, fontWeight: 900, color: "rgba(255,255,255,0.38)", textTransform: "uppercase", letterSpacing: 1.4 }}>ARIA activity feed</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[
            { text: `Analyzed ${mission.totalCustomers.toLocaleString()} customers`, color: "#34d399" },
            { text: `Detected ${(mission.segments.atRisk + mission.segments.lapsed)} shoppers with churn pressure`, color: "#f87171" },
            { text: `Ranked ${mission.recommendedActions.length} revenue plays`, color: "#a78bfa" },
            { text: `Estimated ${money(mission.revenueOpportunity)} opportunity`, color: "#34d399" },
            { text: `${mission.delivered} messages delivered across all campaigns`, color: "#38bdf8" },
            { text: `${mission.converted} conversions recorded this period`, color: "#fb923c" },
            ...(plan ? plan.workflow.slice(0, 2).map(w => ({ text: w, color: "#a78bfa" })) : [{ text: "Waiting for human goal or approval", color: "rgba(255,255,255,0.35)" }]),
          ].slice(0, 8).map((item, i) => (
            <motion.div key={item.text} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} style={{ display: "flex", alignItems: "center", gap: 9, background: "rgba(255,255,255,0.025)", borderRadius: 9, padding: "9px 12px" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: item.color, boxShadow: `0 0 12px ${item.color}60`, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.52)" }}>{item.text}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.35;transform:scale(.75)} } @keyframes glow-pulse { 0%,100%{box-shadow:0 0 20px rgba(124,58,237,0.2)} 50%{box-shadow:0 0 40px rgba(124,58,237,0.45)} }`}</style>
    </div>
  );
}
