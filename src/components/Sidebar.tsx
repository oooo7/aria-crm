"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Megaphone, Target, Sparkles, BarChart3, Zap } from "lucide-react";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/command", label: "AI Command", icon: Sparkles, badge: true },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/segments", label: "Segments", icon: Target },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside style={{
      position: "fixed", left: 0, top: 0, height: "100vh", width: "220px",
      background: "#0a0a14", borderRight: "1px solid #1a1a28",
      display: "flex", flexDirection: "column", zIndex: 100
    }}>
      {/* Logo */}
      <div style={{ padding: "24px 20px", borderBottom: "1px solid #1a1a28" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #8b5cf6, #06b6d4)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <Zap size={18} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: 1, color: "#fff" }}>ARIA</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 2 }}>Copilot</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
        {nav.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", borderRadius: 10, textDecoration: "none",
              fontSize: 13, fontWeight: active ? 600 : 400, transition: "all 0.15s",
              background: active ? "rgba(139,92,246,0.15)" : "transparent",
              color: active ? "#a78bfa" : "rgba(255,255,255,0.45)",
              border: active ? "1px solid rgba(139,92,246,0.25)" : "1px solid transparent",
            }}
            onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.8)"; }}}
            onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)"; }}}
            >
              <Icon size={15} />
              <span style={{ flex: 1 }}>{label}</span>
              {badge && <span style={{ fontSize: 9, background: "rgba(139,92,246,0.3)", color: "#a78bfa", padding: "2px 6px", borderRadius: 20, fontWeight: 600, letterSpacing: 1 }}>AI</span>}
            </Link>
          );
        })}
      </nav>

      {/* Brand badge */}
      <div style={{ padding: "16px 12px", borderTop: "1px solid #1a1a28" }}>
        <div style={{
          background: "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(6,182,212,0.1))",
          border: "1px solid rgba(139,92,246,0.2)", borderRadius: 10, padding: "12px"
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#a78bfa" }}>Lumora Fashion</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>200 customers · 3 segments</div>
        </div>
      </div>
    </aside>
  );
}