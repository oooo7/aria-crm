"use client";
import { useEffect, useState } from "react";
import { BarChart3, Loader2, TrendingUp, Users, Megaphone, ShoppingBag } from "lucide-react";

interface Overview {
  totalCustomers: number; totalCampaigns: number; totalRevenue: number;
  totalSent: number; totalDelivered: number; totalOpened: number; totalConverted: number;
  avgOpenRate: string;
  topCities: Array<{ city: string; count: number }>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics/overview").then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
    </div>
  );

  const funnelSteps = data ? [
    { label: "Sent", value: data.totalSent, color: "from-white/20 to-white/10", textColor: "text-white/60" },
    { label: "Delivered", value: data.totalDelivered, color: "from-emerald-500 to-emerald-600", textColor: "text-emerald-400" },
    { label: "Opened", value: data.totalOpened, color: "from-violet-500 to-violet-600", textColor: "text-violet-400" },
    { label: "Converted", value: data.totalConverted, color: "from-orange-500 to-orange-600", textColor: "text-orange-400" },
  ] : [];

  const max = funnelSteps[0]?.value || 1;

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-white/40 text-sm mt-1">Overall performance across all campaigns</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Customers", value: data?.totalCustomers.toLocaleString(), icon: Users, color: "text-violet-400", border: "border-violet-500/20" },
          { label: "Total Campaigns", value: data?.totalCampaigns.toLocaleString(), icon: Megaphone, color: "text-cyan-400", border: "border-cyan-500/20" },
          { label: "Avg Open Rate", value: `${data?.avgOpenRate}%`, icon: TrendingUp, color: "text-emerald-400", border: "border-emerald-500/20" },
          { label: "Total Conversions", value: data?.totalConverted.toLocaleString(), icon: ShoppingBag, color: "text-orange-400", border: "border-orange-500/20" },
        ].map(({ label, value, icon: Icon, color, border }) => (
          <div key={label} className={`bg-[#0d0d14] border ${border} rounded-2xl p-6`}>
            <Icon className={`w-5 h-5 ${color} mb-4`} />
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
            <p className="text-white/30 text-xs mt-2 uppercase tracking-wider">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Funnel */}
        <div className="bg-[#0d0d14] border border-white/5 rounded-2xl p-6">
          <h2 className="text-white/60 text-xs uppercase tracking-wider mb-6 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Overall Funnel
          </h2>
          <div className="space-y-4">
            {funnelSteps.map(({ label, value, color, textColor }) => {
              const pct = (value / max) * 100;
              return (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-white/50">{label}</span>
                    <span className={`font-semibold ${textColor}`}>{value.toLocaleString()}</span>
                  </div>
                  <div className="h-8 bg-white/5 rounded-xl overflow-hidden">
                    <div className={`h-full bg-gradient-to-r ${color} rounded-xl transition-all duration-1000`}
                      style={{ width: `${Math.max(pct, pct > 0 ? 2 : 0)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cities */}
        <div className="bg-[#0d0d14] border border-white/5 rounded-2xl p-6">
          <h2 className="text-white/60 text-xs uppercase tracking-wider mb-6 flex items-center gap-2">
            <Users className="w-4 h-4" /> Customers by City
          </h2>
          <div className="space-y-4">
            {data?.topCities.map((c, i) => {
              const cityMax = data.topCities[0]?.count || 1;
              const pct = (c.count / cityMax) * 100;
              return (
                <div key={c.city}>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-white/50 flex items-center gap-2">
                      <span className="text-white/20 font-mono">#{i + 1}</span> {c.city}
                    </span>
                    <span className="text-white/40">{c.count}</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}