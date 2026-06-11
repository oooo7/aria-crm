"use client";
import { useEffect, useState } from "react";
import { BarChart3, Loader2, TrendingUp, Users, Megaphone, ShoppingBag, Sparkles } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface Overview {
  totalCustomers: number; totalCampaigns: number; totalRevenue: number;
  totalSent: number; totalDelivered: number; totalOpened: number; totalConverted: number;
  avgOpenRate: string;
  topCities: Array<{ city: string; count: number }>;
}

const CITY_COLORS = ["#a78bfa", "#38bdf8", "#34d399", "#fb923c", "#f472b6", "#facc15"];

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0d0d1a", border: "1px solid #1e1e32", borderRadius: 8, padding: "10px 14px" }}>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: "0 0 4px" }}>{label}</p>
      <p style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: 0 }}>{payload[0].value.toLocaleString()}</p>
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics/overview").then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <Loader2 size={24} color="#a78bfa" style={{ animation: "spin 1s linear infinite" }} />
    </div>
  );
  if (!data) return null;

  const funnelData = [
    { name: "Sent",      value: data.totalSent,      fill: "rgba(255,255,255,0.3)" },
    { name: "Delivered", value: data.totalDelivered,  fill: "#34d399" },
    { name: "Opened",    value: data.totalOpened,     fill: "#a78bfa" },
    { name: "Converted", value: data.totalConverted,  fill: "#fb923c" },
  ];

  const cityData = data.topCities.map((c, i) => ({
    name: c.city, value: c.count, fill: CITY_COLORS[i % CITY_COLORS.length],
  }));

  const deliveryRate = data.totalSent > 0 ? ((data.totalDelivered / data.totalSent) * 100).toFixed(1) : "0";
  const openRate = data.totalDelivered > 0 ? ((data.totalOpened / data.totalDelivered) * 100).toFixed(1) : "0";
  const convRate = data.totalSent > 0 ? ((data.totalConverted / data.totalSent) * 100).toFixed(1) : "0";

  return (
    <div style={{ padding: "36px 40px 60px", maxWidth: 1080, margin: "0 auto" }}>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: "0 0 5px" }}>Analytics</h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: 0 }}>
          Overall performance across all campaigns
        </p>
      </div>

      {/* KPI grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Customers",   value: data.totalCustomers.toLocaleString(), icon: Users,     color: "#a78bfa" },
          { label: "Campaigns",   value: data.totalCampaigns.toLocaleString(), icon: Megaphone, color: "#38bdf8" },
          { label: "Avg Open Rate", value: `${data.avgOpenRate}%`,             icon: TrendingUp, color: "#34d399" },
          { label: "Conversions", value: data.totalConverted.toLocaleString(), icon: ShoppingBag, color: "#fb923c" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} style={{ background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 14, padding: "20px 22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: 1.2 }}>{label}</span>
              <Icon size={15} color={color} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Rate strip */}
      <div style={{ background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 14, padding: "20px 28px", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: 1.4 }}>Key Rates</span>
          <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(124,58,237,0.1)", padding: "4px 10px", borderRadius: 6 }}>
            <Sparkles size={11} color="#a78bfa" />
            <span style={{ fontSize: 11, color: "#a78bfa", fontWeight: 500 }}>AI-generated campaigns</span>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 0, marginTop: 16 }}>
          {[
            { label: "Delivery Rate", value: deliveryRate, color: "#34d399", desc: `${data.totalDelivered.toLocaleString()} of ${data.totalSent.toLocaleString()} sent` },
            { label: "Open Rate",     value: openRate,     color: "#a78bfa", desc: `${data.totalOpened.toLocaleString()} opened` },
            { label: "Conversion Rate", value: convRate,   color: "#fb923c", desc: `${data.totalConverted.toLocaleString()} converted` },
          ].map(({ label, value, color, desc }, i) => (
            <div key={label} style={{ padding: "0 28px", borderRight: i < 2 ? "1px solid #1a1a2e" : "none" }}>
              <div style={{ fontSize: 36, fontWeight: 700, color, lineHeight: 1 }}>{value}%</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", marginTop: 5 }}>{label}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.22)", marginTop: 3 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Funnel bar chart */}
        <div style={{ background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 14, padding: "22px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 20 }}>
            <BarChart3 size={14} color="rgba(255,255,255,0.4)" />
            <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1.4 }}>
              Engagement Funnel
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={funnelData} barSize={36}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                {funnelData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* City bar chart */}
        <div style={{ background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 14, padding: "22px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 20 }}>
            <Users size={14} color="rgba(255,255,255,0.4)" />
            <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1.4 }}>
              Customers by City
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={cityData} layout="vertical" barSize={18}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={72} axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="value" radius={[0, 5, 5, 0]}>
                {cityData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}