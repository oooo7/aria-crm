"use client";
import { useEffect, useState, use } from "react";
import { ArrowLeft, Loader2, TrendingUp, Mail, MousePointer, CheckCircle, XCircle, ShoppingBag } from "lucide-react";
import Link from "next/link";

interface Analytics {
  total: number; delivered: number; opened: number;
  clicked: number; converted: number; failed: number; queued: number;
  rates: { deliveryRate: string; openRate: string; clickRate: string; conversionRate: string };
}

export default function CampaignDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = () => fetch(`/api/campaigns/${id}/analytics`).then(r => r.json()).then(setAnalytics);
    load().finally(() => setLoading(false));
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [id]);

  const stats = analytics ? [
    { label: "Delivered", value: analytics.delivered, rate: analytics.rates.deliveryRate + "%", icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    { label: "Opened", value: analytics.opened, rate: analytics.rates.openRate + "%", icon: Mail, color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
    { label: "Clicked", value: analytics.clicked, rate: analytics.rates.clickRate + "%", icon: MousePointer, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
    { label: "Converted", value: analytics.converted, rate: analytics.rates.conversionRate + "%", icon: ShoppingBag, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
    { label: "Failed", value: analytics.failed, rate: analytics.total > 0 ? ((analytics.failed / analytics.total) * 100).toFixed(1) + "%" : "0%", icon: XCircle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
  ] : [];

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link href="/campaigns" className="flex items-center gap-2 text-white/40 hover:text-white/70 text-sm mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Campaigns
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Campaign Analytics</h1>
            <p className="text-white/40 text-sm mt-1">Live stats · updates every 3 seconds</p>
          </div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            Live
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
        </div>
      ) : analytics ? (
        <>
          <div className="bg-[#0d0d14] border border-white/5 rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Total Recipients</p>
                <p className="text-4xl font-bold text-white">{analytics.total.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-white/40 text-xs uppercase tracking-wider mb-1">In Queue</p>
                <p className="text-2xl font-bold text-white/40">{analytics.queued}</p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-4 h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full transition-all duration-1000"
                style={{ width: analytics.total > 0 ? `${((analytics.total - analytics.queued) / analytics.total) * 100}%` : "0%" }}
              />
            </div>
            <p className="text-white/20 text-xs mt-2">
              {analytics.total > 0 ? Math.round(((analytics.total - analytics.queued) / analytics.total) * 100) : 0}% processed
            </p>
          </div>

          <div className="grid grid-cols-5 gap-4">
            {stats.map(({ label, value, rate, icon: Icon, color, bg, border }) => (
              <div key={label} className={`bg-[#0d0d14] border ${border} rounded-2xl p-5`}>
                <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-4`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <p className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}</p>
                <p className="text-white/40 text-xs mt-1">{label}</p>
                <p className="text-white/20 text-xs mt-2 font-mono">{rate}</p>
              </div>
            ))}
          </div>

          {/* Funnel */}
          <div className="mt-6 bg-[#0d0d14] border border-white/5 rounded-2xl p-6">
            <h3 className="text-white/60 text-xs uppercase tracking-wider mb-5 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Engagement Funnel
            </h3>
            <div className="space-y-3">
              {[
                { label: "Sent", value: analytics.total, color: "from-white/20 to-white/10" },
                { label: "Delivered", value: analytics.delivered, color: "from-emerald-500 to-emerald-600" },
                { label: "Opened", value: analytics.opened, color: "from-violet-500 to-violet-600" },
                { label: "Clicked", value: analytics.clicked, color: "from-cyan-500 to-cyan-600" },
                { label: "Converted", value: analytics.converted, color: "from-orange-500 to-orange-600" },
              ].map(({ label, value, color }) => {
                const pct = analytics.total > 0 ? (value / analytics.total) * 100 : 0;
                return (
                  <div key={label} className="flex items-center gap-4">
                    <p className="text-white/40 text-xs w-20 text-right">{label}</p>
                    <div className="flex-1 h-7 bg-white/5 rounded-lg overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${color} rounded-lg transition-all duration-1000 flex items-center px-3`}
                        style={{ width: `${Math.max(pct, pct > 0 ? 3 : 0)}%` }}
                      >
                        <span className="text-white text-xs font-medium">{value.toLocaleString()}</span>
                      </div>
                    </div>
                    <p className="text-white/30 text-xs w-12 font-mono">{pct.toFixed(1)}%</p>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-20 text-white/30">No data yet</div>
      )}
    </div>
  );
}