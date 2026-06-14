"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle, ChevronLeft, ChevronRight, Crown, Loader2,
  Search, Sparkles, Star, TrendingDown, Upload, Users,
  Mail, MessageCircle, Phone, MapPin, ShoppingBag, ArrowRight,
  Activity, Filter,
} from "lucide-react";
import Link from "next/link";
import ImportCustomersModal from "@/components/ImportCustomersModal";

const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(n).replace(/\s+/g, "");

interface Customer {
  id: string; name: string; email: string; city: string | null;
  totalSpent: number; orderCount: number; lastOrderAt: string | null;
  tags: string[];
}
interface Summary { all: number; vip: number; lapsed: number; atRisk: number; new: number; }
type Lifecycle = "all" | "vip" | "lapsed" | "at-risk" | "new";

const FILTERS: Array<{
  id: Lifecycle; label: string; description: string;
  icon: typeof Users; color: string; summaryKey: keyof Summary;
}> = [
  { id: "all",     label: "All shoppers", description: "Full customer base", icon: Users,         color: "#a78bfa", summaryKey: "all" },
  { id: "vip",     label: "VIP",          description: "₹20K+ lifetime",    icon: Crown,         color: "#fbbf24", summaryKey: "vip" },
  { id: "lapsed",  label: "Lapsed",       description: "90+ days inactive",  icon: TrendingDown,  color: "#f59e0b", summaryKey: "lapsed" },
  { id: "at-risk", label: "At risk",      description: "45–89 days idle",    icon: AlertTriangle, color: "#f87171", summaryKey: "atRisk" },
  { id: "new",     label: "New",          description: "First order ≤30d",   icon: Sparkles,      color: "#38bdf8", summaryKey: "new" },
];

const AVATAR_COLORS = [
  { bg: "rgba(167,139,250,0.18)", color: "#a78bfa" },
  { bg: "rgba(56,189,248,0.18)",  color: "#38bdf8" },
  { bg: "rgba(52,211,153,0.18)",  color: "#34d399" },
  { bg: "rgba(251,146,60,0.18)",  color: "#fb923c" },
  { bg: "rgba(244,114,182,0.18)", color: "#f472b6" },
  { bg: "rgba(250,204,21,0.18)",  color: "#facc15" },
];

function daysAgo(iso: string | null) {
  if (!iso) return "No orders";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function initials(name: string) {
  return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

function lifecycleFor(customer: Customer) {
  const days = customer.lastOrderAt
    ? Math.floor((Date.now() - new Date(customer.lastOrderAt).getTime()) / 86400000)
    : null;
  if (customer.totalSpent >= 20000)
    return { label: "VIP",     color: "#fbbf24", bg: "rgba(251,191,36,0.12)",  icon: Crown,         action: "Reward with early access" };
  if (days !== null && days >= 90)
    return { label: "Lapsed",  color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  icon: TrendingDown,  action: "Send win-back offer" };
  if (days !== null && days >= 45)
    return { label: "At risk", color: "#f87171", bg: "rgba(248,113,113,0.12)", icon: AlertTriangle, action: "Re-engage this week" };
  if (customer.orderCount <= 1)
    return { label: "New",     color: "#38bdf8", bg: "rgba(56,189,248,0.12)",  icon: Sparkles,      action: "Drive second purchase" };
  return    { label: "Active", color: "#34d399", bg: "rgba(52,211,153,0.12)",  icon: Star,          action: "Keep warm" };
}

function preferredChannel(customer: Customer) {
  if (customer.totalSpent >= 20000) return { icon: MessageCircle, label: "WhatsApp", color: "#34d399" };
  if (customer.orderCount >= 5)     return { icon: Phone,         label: "SMS",      color: "#38bdf8" };
  return                                    { icon: Mail,          label: "Email",    color: "#a78bfa" };
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [summary, setSummary]     = useState<Summary>({ all: 0, vip: 0, lapsed: 0, atRisk: 0, new: 0 });
  const [total, setTotal]         = useState(0);
  const [search, setSearch]       = useState("");
  const [lifecycle, setLifecycle] = useState<Lifecycle>("all");
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [pages, setPages]         = useState(1);
  const [showImport, setShowImport] = useState(false);

  function loadCustomers() {
    setLoading(true);
    fetch(`/api/customers?page=${page}&limit=20&search=${encodeURIComponent(search)}&lifecycle=${lifecycle}`)
      .then(r => r.json())
      .then(data => {
        setCustomers(data.customers);
        setTotal(data.total);
        setPages(data.pages || 1);
        setSummary(data.summary);
        setLoading(false);
      });
  }

  useEffect(() => {
    const t = setTimeout(loadCustomers, 180);
    return () => clearTimeout(t);
  }, [page, search, lifecycle]);

  const activeFilter = FILTERS.find(f => f.id === lifecycle)!;

  return (
    <div style={{ padding: "30px 36px 60px", maxWidth: 1160, margin: "0 auto" }}>
      {showImport && <ImportCustomersModal onClose={() => setShowImport(false)} onImported={loadCustomers} />}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 22, gap: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(167,139,250,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={14} color="#a78bfa" />
            </div>
            <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.32)", textTransform: "uppercase", letterSpacing: 1.5 }}>Customer Intelligence</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "#fff", margin: "0 0 5px" }}>Customers</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: 0 }}>
            Shopper intelligence · segmentation · retention · campaign targeting
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ position: "relative" }}>
            <Search size={14} color="rgba(255,255,255,0.28)" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }} />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search name, email, city..."
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff", fontSize: 13, borderRadius: 10, padding: "9px 14px 9px 34px", outline: "none", width: 240, transition: "border-color 0.15s" }}
              onFocus={e => (e.target as HTMLInputElement).style.borderColor = "rgba(124,58,237,0.4)"}
              onBlur={e => (e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.08)"}
            />
          </div>
          <button
            onClick={() => setShowImport(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "linear-gradient(135deg, #7c3aed, #0891b2)", border: "none", color: "#fff", fontSize: 12, fontWeight: 800, padding: "9px 15px", borderRadius: 10, cursor: "pointer", boxShadow: "0 6px 20px rgba(124,58,237,0.28)" }}
          >
            <Upload size={13} /> Import Customers
          </button>
        </div>
      </div>

      {/* Lifecycle filter cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 18 }}>
        {FILTERS.map(filter => {
          const Icon = filter.icon;
          const active = lifecycle === filter.id;
          const count = summary[filter.summaryKey] || 0;
          return (
            <button
              key={filter.id}
              onClick={() => { setLifecycle(filter.id); setPage(1); }}
              style={{
                textAlign: "left", background: active ? `${filter.color}10` : "rgba(255,255,255,0.025)",
                border: active ? `1px solid ${filter.color}40` : "1px solid rgba(255,255,255,0.06)",
                borderRadius: 13, padding: "14px 15px", cursor: "pointer", transition: "all 0.15s",
              }}
              onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)"; } }}
              onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.025)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"; } }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: `${filter.color}16`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={14} color={filter.color} />
                </div>
                <span style={{ fontSize: 22, fontWeight: 900, color: active ? filter.color : "rgba(255,255,255,0.75)", lineHeight: 1 }}>
                  {count.toLocaleString()}
                </span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: active ? filter.color : "#fff", marginBottom: 3 }}>{filter.label}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", lineHeight: 1.35 }}>{filter.description}</div>
              {active && (
                <div style={{ height: 2, background: `linear-gradient(90deg, ${filter.color}, transparent)`, borderRadius: 2, marginTop: 10 }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Stats bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, padding: "10px 16px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 11 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <Filter size={12} color={activeFilter.color} />
          <span style={{ fontSize: 11, fontWeight: 700, color: activeFilter.color }}>{activeFilter.label}</span>
        </div>
        <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.08)" }} />
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.38)" }}>
          Showing <strong style={{ color: "#fff" }}>{total.toLocaleString()}</strong> shoppers · Page {page} of {pages}
        </span>
        {search && (
          <>
            <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.08)" }} />
            <span style={{ fontSize: 11, color: "#a78bfa" }}>
              Searching for &quot;{search}&quot;
            </span>
            <button onClick={() => { setSearch(""); setPage(1); }} style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.05)", border: "none", cursor: "pointer", padding: "2px 6px", borderRadius: 4 }}>
              Clear
            </button>
          </>
        )}
      </div>

      {/* Table */}
      <div style={{ background: "rgba(10,10,22,0.9)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 90px 70px 110px 90px 100px 140px 90px", padding: "10px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: 1.3 }}>
          <span>Customer</span>
          <span>City</span>
          <span style={{ textAlign: "center" }}>Orders</span>
          <span style={{ textAlign: "right" }}>Spent</span>
          <span style={{ textAlign: "center" }}>Last order</span>
          <span style={{ textAlign: "center" }}>Stage</span>
          <span>Next action</span>
          <span></span>
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "56px 0", flexDirection: "column", gap: 12 }}>
            <Loader2 size={22} color="#a78bfa" style={{ animation: "spin 1s linear infinite" }} />
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", margin: 0 }}>Loading shoppers...</p>
          </div>
        ) : customers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "56px 0" }}>
            <Users size={36} color="rgba(255,255,255,0.08)" style={{ marginBottom: 12 }} />
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.35)", margin: "0 0 4px", fontWeight: 600 }}>No shoppers match this view</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", margin: 0 }}>Try adjusting the filter or search query</p>
          </div>
        ) : (
          customers.map((customer, idx) => {
            const avatar = AVATAR_COLORS[idx % AVATAR_COLORS.length];
            const state  = lifecycleFor(customer);
            const ch     = preferredChannel(customer);
            const StateIcon  = state.icon;
            const ChannelIcon = ch.icon;

            const briefARIA = (e: React.MouseEvent) => {
              e.preventDefault();
              e.stopPropagation();
              const prompt = `Create a personalized ${ch.label} campaign for ${customer.name}, a ${state.label.toLowerCase()} customer from ${customer.city || "India"} with ₹${Math.round(customer.totalSpent).toLocaleString("en-IN")} lifetime spend`;
              sessionStorage.setItem("aria_prefill", prompt);
              window.location.href = "/command";
            };

            return (
              <div key={customer.id} style={{ position: "relative" }}>
                <Link
                  href={`/customers/${customer.id}`}
                  style={{
                    display: "grid", gridTemplateColumns: "2fr 90px 70px 110px 90px 100px 140px 90px",
                    padding: "12px 20px", alignItems: "center",
                    borderBottom: idx < customers.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    textDecoration: "none", transition: "background 0.12s", cursor: "pointer",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
                    const btn = e.currentTarget.querySelector(".brief-aria-btn") as HTMLElement | null;
                    if (btn) btn.style.opacity = "1";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                    const btn = e.currentTarget.querySelector(".brief-aria-btn") as HTMLElement | null;
                    if (btn) btn.style.opacity = "0";
                  }}
                >
                  {/* Customer identity */}
                  <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: avatar.bg, color: avatar.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, flexShrink: 0, letterSpacing: 0.5 }}>
                      {initials(customer.name)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.88)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{customer.name}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.22)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>{customer.email}</div>
                    </div>
                  </div>

                  {/* City */}
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    {customer.city && <MapPin size={10} color="rgba(255,255,255,0.2)" />}
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.38)" }}>{customer.city || "—"}</span>
                  </div>

                  {/* Orders */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                    <ShoppingBag size={11} color="rgba(255,255,255,0.22)" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.58)" }}>{customer.orderCount}</span>
                  </div>

                  {/* Spent */}
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#34d399", textAlign: "right" }}>
                    {formatINR(customer.totalSpent)}
                  </span>

                  {/* Last order */}
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.32)", textAlign: "center" }}>
                    {daysAgo(customer.lastOrderAt)}
                  </span>

                  {/* Lifecycle stage */}
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: state.bg, color: state.color, border: `1px solid ${state.color}26`, fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 20, whiteSpace: "nowrap" }}>
                      <StateIcon size={9} /> {state.label}
                    </span>
                  </div>

                  {/* Next action + channel hint */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 18, height: 18, borderRadius: 5, background: `${ch.color}14`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <ChannelIcon size={9} color={ch.color} />
                    </div>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.36)", lineHeight: 1.35, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{state.action}</span>
                  </div>

                  {/* Brief ARIA button (hover-reveal) */}
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      className="brief-aria-btn"
                      onClick={briefARIA}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        background: "rgba(167,139,250,0.12)",
                        border: "1px solid rgba(167,139,250,0.25)",
                        color: "#c4b5fd", fontSize: 9, fontWeight: 800,
                        padding: "3px 8px", borderRadius: 6,
                        cursor: "pointer", whiteSpace: "nowrap",
                        opacity: 0,
                        transition: "all 0.15s",
                      }}
                    >
                      <Sparkles size={8} /> Brief ARIA
                    </button>
                  </div>
                </Link>
              </div>
            );
          })
        )}

        {/* Pagination */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Activity size={12} color="rgba(255,255,255,0.2)" />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.28)" }}>
              {total.toLocaleString()} total · Page {page} of {pages}
            </span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {[
              { icon: ChevronLeft,  action: () => setPage(p => Math.max(1, p - 1)),       disabled: page === 1,     label: "Prev" },
              { icon: ChevronRight, action: () => setPage(p => Math.min(pages, p + 1)),   disabled: page === pages, label: "Next" },
            ].map(({ icon: Icon, action, disabled, label }) => (
              <button key={label} onClick={action} disabled={disabled} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: disabled ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.48)", fontSize: 12, padding: "6px 13px", borderRadius: 8, cursor: disabled ? "not-allowed" : "pointer", transition: "all 0.12s" }}
                onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.18)"; }}
                onMouseLeave={e => { if (!disabled) (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; }}
              >
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
