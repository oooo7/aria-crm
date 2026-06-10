"use client";
import { useEffect, useState } from "react";
import { Megaphone, Plus, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

interface Campaign {
  id: string;
  name: string;
  status: string;
  channel: string;
  aiGenerated: boolean;
  sentAt: string | null;
  createdAt: string;
  segment: { name: string } | null;
  _count: { recipients: number };
}

const statusStyles: Record<string, string> = {
  SENT: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  SENDING: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
  DRAFT: "text-white/40 bg-white/5 border-white/10",
  FAILED: "text-red-400 bg-red-400/10 border-red-400/20",
};

const channelStyles: Record<string, string> = {
  EMAIL: "text-violet-400 bg-violet-400/10",
  SMS: "text-cyan-400 bg-cyan-400/10",
  WHATSAPP: "text-emerald-400 bg-emerald-400/10",
  RCS: "text-orange-400 bg-orange-400/10",
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/campaigns").then(r => r.json()).then(d => { setCampaigns(d); setLoading(false); });
  }, []);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Campaigns</h1>
          <p className="text-white/40 text-sm mt-1">{campaigns.length} total campaigns</p>
        </div>
        <Link
          href="/command"
          className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white text-sm px-4 py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> New with AI
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-20 bg-[#0d0d14] rounded-2xl border border-white/5">
          <Megaphone className="w-12 h-12 text-white/10 mx-auto mb-4" />
          <p className="text-white/40 font-medium">No campaigns yet</p>
          <p className="text-white/20 text-sm mt-1">Use AI Command to create your first campaign</p>
          <Link href="/command" className="inline-flex items-center gap-2 mt-4 text-violet-400 hover:text-violet-300 text-sm">
            Create with ARIA <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map(c => (
            <Link
              key={c.id}
              href={`/campaigns/${c.id}`}
              className="flex items-center justify-between bg-[#0d0d14] border border-white/5 hover:border-violet-500/20 rounded-2xl p-5 transition-all duration-200 group"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold ${channelStyles[c.channel] || "bg-white/5 text-white/30"}`}>
                  {c.channel[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-white/90 font-medium group-hover:text-white transition-colors">{c.name}</p>
                    {c.aiGenerated && (
                      <span className="text-[9px] bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded-full border border-violet-500/20 uppercase tracking-wider">AI</span>
                    )}
                  </div>
                  <p className="text-white/30 text-xs mt-0.5">{c.segment?.name || "All customers"} · {c.channel}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-white/60 text-sm font-medium">{c._count.recipients.toLocaleString()}</p>
                  <p className="text-white/25 text-xs">recipients</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full border font-medium ${statusStyles[c.status]}`}>
                  {c.status}
                </span>
                <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}