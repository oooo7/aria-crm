"use client";
import { useState } from "react";
import { Sparkles, Send, Loader2, CheckCircle, Users, MessageSquare, Zap, ChevronRight } from "lucide-react";
import { toast } from "@/components/ui/toast";

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

const SUGGESTIONS = [
  "Send a win-back offer to customers who haven't ordered in 90 days",
  "Create a VIP exclusive campaign for our top spenders",
  "Welcome new customers who joined this month with a first order discount",
  "Re-engage customers in Mumbai who haven't opened our last campaign",
  "Launch a flash sale campaign for customers who clicked but didn't buy",
];

const channelColors: Record<string, string> = {
  EMAIL: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  SMS: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  WHATSAPP: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  RCS: "bg-orange-500/20 text-orange-300 border-orange-500/30",
};

export default function CommandPage() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);
  const [launching, setLaunching] = useState(false);
  const [launched, setLaunched] = useState(false);

  async function handleSubmit() {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setResult(null);
    setLaunched(false);
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
      // 1. Create segment
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

      // 2. Create campaign
      const campRes = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: result.campaignName,
          description: result.intent,
          segmentId: segment.id,
          channel: result.channel,
          messageBody: result.messageBody,
          subject: result.subject,
          aiGenerated: true,
          prompt,
        }),
      });
      const campaign = await campRes.json();

      // 3. Send campaign
      await fetch(`/api/campaigns/${campaign.id}/send`, { method: "POST" });

      setLaunched(true);
      toast.success("Campaign launched! ARIA is sending messages now.");
    } catch {
      toast.error("Launch failed");
    } finally {
      setLaunching(false);
    }
  }

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">AI Command</h1>
            <p className="text-white/40 text-sm">Tell ARIA what you want to achieve</p>
          </div>
        </div>
      </div>

      {/* Command Input */}
      <div className="max-w-3xl mx-auto">
        <div className="relative bg-[#0d0d14] border border-white/10 rounded-2xl overflow-hidden focus-within:border-violet-500/50 transition-all duration-300 shadow-2xl">
          <div className="flex items-start gap-3 p-5">
            <Sparkles className="w-5 h-5 text-violet-400 mt-0.5 flex-shrink-0" />
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }}}
              placeholder="Describe your campaign goal in plain English...&#10;e.g. Send a win-back offer to customers who haven't ordered in 90 days"
              className="flex-1 bg-transparent text-white placeholder-white/25 text-base resize-none outline-none min-h-[80px] leading-relaxed"
              rows={3}
            />
          </div>
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/5">
            <p className="text-white/20 text-xs">Press Enter to run · Shift+Enter for new line</p>
            <button
              onClick={handleSubmit}
              disabled={!prompt.trim() || loading}
              className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm px-5 py-2 rounded-xl font-medium transition-all duration-200"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {loading ? "Thinking..." : "Run ARIA"}
            </button>
          </div>
        </div>

        {/* Suggestions */}
        {!result && !loading && (
          <div className="mt-6">
            <p className="text-white/30 text-xs uppercase tracking-widest mb-3">Try these</p>
            <div className="space-y-2">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => setPrompt(s)}
                  className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl bg-[#0d0d14] border border-white/5 hover:border-violet-500/30 hover:bg-violet-500/5 transition-all duration-200 group"
                >
                  <ChevronRight className="w-3 h-3 text-white/20 group-hover:text-violet-400 transition-colors flex-shrink-0" />
                  <span className="text-white/50 group-hover:text-white/80 text-sm transition-colors">{s}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="mt-8 flex flex-col items-center gap-4 py-12">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-violet-400 animate-pulse" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-white/60 font-medium">ARIA is thinking...</p>
              <p className="text-white/25 text-sm mt-1">Analyzing your audience and crafting the message</p>
            </div>
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-2 mb-6">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <p className="text-emerald-400 font-medium">ARIA has a plan</p>
            </div>

            {/* Campaign Plan Cards */}
            <div className="grid grid-cols-2 gap-4">
              {/* Audience */}
              <div className="bg-[#0d0d14] border border-white/5 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-violet-400" />
                  <p className="text-white/60 text-xs uppercase tracking-wider">Audience</p>
                </div>
                <p className="text-white font-semibold">{result.segmentName}</p>
                <p className="text-white/40 text-sm mt-1">{result.segmentDescription}</p>
                <p className="text-violet-400 text-xs mt-3 font-medium">≈ {result.estimatedAudience}</p>
              </div>

              {/* Channel */}
              <div className="bg-[#0d0d14] border border-white/5 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <p className="text-white/60 text-xs uppercase tracking-wider">Channel</p>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-lg border text-sm font-semibold ${channelColors[result.channel] || "bg-white/10 text-white/60"}`}>
                  {result.channel}
                </span>
                {result.subject && (
                  <p className="text-white/40 text-xs mt-3">Subject: {result.subject}</p>
                )}
                <p className="text-white/30 text-xs mt-2 italic">{result.reasoning}</p>
              </div>
            </div>

            {/* Message Preview */}
            <div className="bg-[#0d0d14] border border-white/5 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <p className="text-white/60 text-xs uppercase tracking-wider">Message Preview</p>
              </div>
              {result.subject && (
                <p className="text-white/50 text-xs mb-2 font-medium">Subject: <span className="text-white/70">{result.subject}</span></p>
              )}
              <div className="bg-white/3 rounded-xl p-4 border border-white/5">
                <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">{result.messageBody}</p>
              </div>
            </div>

            {/* Launch Button */}
            {!launched ? (
              <button
                onClick={handleLaunch}
                disabled={launching}
                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 disabled:opacity-50 text-white font-semibold py-4 rounded-2xl transition-all duration-200 shadow-lg shadow-violet-500/20 text-base"
              >
                {launching ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Launching Campaign...</>
                ) : (
                  <><Zap className="w-5 h-5" /> Launch This Campaign</>
                )}
              </button>
            ) : (
              <div className="w-full flex items-center justify-center gap-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-semibold py-4 rounded-2xl">
                <CheckCircle className="w-5 h-5" />
                Campaign Launched! Check Campaigns for live stats.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}