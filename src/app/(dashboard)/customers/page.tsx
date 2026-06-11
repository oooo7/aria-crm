"use client";
import { useEffect, useState } from "react";
import { Search, Loader2, Crown, Star, ChevronLeft, ChevronRight } from "lucide-react";

interface Customer {
  id: string; name: string; email: string;
  city: string; totalSpent: number; orderCount: number;
  lastOrderAt: string | null; tags: string[];
}

function daysAgo(iso: string | null) {
  if (!iso) return "—";
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 30) return `${d}d ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

function initials(name: string) {
  return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

const AVATAR_COLORS = [
  { bg: "rgba(167,139,250,0.15)", color: "#a78bfa" },
  { bg: "rgba(56,189,248,0.15)",  color: "#38bdf8" },
  { bg: "rgba(52,211,153,0.15)",  color: "#34d399" },
  { bg: "rgba(251,146,60,0.15)",  color: "#fb923c" },
];

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      fetch(`/api/customers?page=${page}&limit=20&search=${encodeURIComponent(search)}`)
        .then(r => r.json())
        .then(d => { setCustomers(d.customers); setTotal(d.total); setPages(d.pages); setLoading(false); });
    }, 200);
    return () => clearTimeout(t);
  }, [page, search]);

  return (
    <div style={{ padding: "36px 40px 60px", maxWidth: 1080, margin: "0 auto" }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: "0 0 5px" }}>Customers</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: 0 }}>
            {total.toLocaleString()} total shoppers
          </p>
        </div>
        <div style={{ position: "relative" }}>
          <Search size={14} color="rgba(255,255,255,0.3)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search customers..."
            style={{
              background: "#0d0d1a", border: "1px solid #1e1e32",
              color: "#fff", fontSize: 13, borderRadius: 9,
              padding: "9px 14px 9px 34px", outline: "none", width: 220,
              transition: "border-color 0.15s",
            }}
            onFocus={e => (e.target as HTMLElement).style.borderColor = "rgba(124,58,237,0.4)"}
            onBlur={e => (e.target as HTMLElement).style.borderColor = "#1e1e32"}
          />
        </div>
      </div>

      <div style={{ background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 14, overflow: "hidden" }}>
        {/* Header */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 100px 80px 110px 100px 100px",
          padding: "11px 20px", borderBottom: "1px solid #16162a",
          fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.28)",
          textTransform: "uppercase", letterSpacing: 1.2,
        }}>
          <span>Customer</span>
          <span>City</span>
          <span style={{ textAlign: "center" }}>Orders</span>
          <span style={{ textAlign: "right" }}>Total Spent</span>
          <span style={{ textAlign: "center" }}>Last Order</span>
          <span style={{ textAlign: "center" }}>Tags</span>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
            <Loader2 size={20} color="#a78bfa" style={{ animation: "spin 1s linear infinite" }} />
          </div>
        ) : (
          customers.map((c, i) => {
            const av = AVATAR_COLORS[i % AVATAR_COLORS.length];
            return (
              <div
                key={c.id}
                style={{
                  display: "grid", gridTemplateColumns: "1fr 100px 80px 110px 100px 100px",
                  padding: "12px 20px", alignItems: "center",
                  borderBottom: i < customers.length - 1 ? "1px solid #12121e" : "none",
                  transition: "background 0.1s",
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
              >
                {/* Customer */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: av.bg, color: av.color,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700, flexShrink: 0,
                  }}>
                    {initials(c.name)}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.82)" }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>{c.email}</div>
                  </div>
                </div>

                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{c.city || "—"}</span>

                <div style={{ textAlign: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>{c.orderCount}</span>
                </div>

                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#34d399" }}>
                    ₹{c.totalSpent.toLocaleString()}
                  </span>
                </div>

                <div style={{ textAlign: "center" }}>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{daysAgo(c.lastOrderAt)}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "center", gap: 4 }}>
                  {c.tags.map(tag => (
                    <span key={tag} style={{
                      display: "inline-flex", alignItems: "center", gap: 3,
                      fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
                      textTransform: "uppercase", letterSpacing: 0.5,
                      background: tag === "vip" ? "rgba(251,191,36,0.12)" : "rgba(56,189,248,0.12)",
                      color: tag === "vip" ? "#fbbf24" : "#38bdf8",
                    }}>
                      {tag === "vip" ? <Crown size={8} /> : <Star size={8} />}
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            );
          })
        )}

        {/* Pagination */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 20px", borderTop: "1px solid #16162a",
        }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.28)" }}>
            Page {page} of {pages} · {total} total
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            {[
              { icon: ChevronLeft, action: () => setPage(p => Math.max(1, p - 1)), disabled: page === 1, label: "Prev" },
              { icon: ChevronRight, action: () => setPage(p => Math.min(pages, p + 1)), disabled: page === pages, label: "Next" },
            ].map(({ icon: Icon, action, disabled, label }) => (
              <button key={label} onClick={action} disabled={disabled} style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                background: "transparent", border: "1px solid #1e1e32",
                color: disabled ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.5)",
                fontSize: 12, padding: "6px 12px", borderRadius: 7,
                cursor: disabled ? "not-allowed" : "pointer",
                transition: "all 0.1s",
              }}
                onMouseEnter={e => { if (!disabled) { (e.currentTarget as HTMLElement).style.borderColor = "rgba(124,58,237,0.3)"; (e.currentTarget as HTMLElement).style.color = "#a78bfa"; }}}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#1e1e32"; (e.currentTarget as HTMLElement).style.color = disabled ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.5)"; }}
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