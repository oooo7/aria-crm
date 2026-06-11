"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Megaphone, Target,
  Sparkles, BarChart3, Zap, Circle
} from "lucide-react";

const NAV = [
  { href: "/",           label: "Dashboard",   icon: LayoutDashboard },
  { href: "/command",    label: "AI Command",  icon: Sparkles, ai: true },
  { href: "/campaigns",  label: "Campaigns",   icon: Megaphone },
  { href: "/segments",   label: "Segments",    icon: Target },
  { href: "/customers",  label: "Customers",   icon: Users },
  { href: "/analytics",  label: "Analytics",   icon: BarChart3 },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside style={{
      position: "fixed", left: 0, top: 0, height: "100vh", width: 216,
      background: "#070711", borderRight: "1px solid #16162a",
      display: "flex", flexDirection: "column", zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid #16162a" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: "linear-gradient(135deg, #7c3aed 0%, #0891b2 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Zap size={16} color="white" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", letterSpacing: 0.5 }}>
              ARIA
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: 2, textTransform: "uppercase", marginTop: 1 }}>
              Copilot
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV.map(({ href, label, icon: Icon, ai }) => {
          const active = path === href;
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex", alignItems: "center", gap: 9,
                padding: "8px 10px", borderRadius: 9, textDecoration: "none",
                fontSize: 13, fontWeight: active ? 600 : 400,
                color: active ? "#c4b5fd" : "rgba(255,255,255,0.38)",
                background: active ? "rgba(124,58,237,0.14)" : "transparent",
                border: active ? "1px solid rgba(124,58,237,0.22)" : "1px solid transparent",
                transition: "all 0.12s ease",
                position: "relative",
              }}
              onMouseEnter={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.72)";
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.045)";
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.38)";
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }
              }}
            >
              <Icon
                size={15}
                color={active ? "#a78bfa" : "currentColor"}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span style={{ flex: 1 }}>{label}</span>
              {ai && (
                <span style={{
                  fontSize: 9, fontWeight: 700,
                  background: "rgba(124,58,237,0.28)",
                  color: "#a78bfa", padding: "2px 5px",
                  borderRadius: 4, letterSpacing: 0.8,
                  textTransform: "uppercase",
                }}>
                  AI
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Brand footer */}
      <div style={{ padding: "12px 10px 16px", borderTop: "1px solid #16162a" }}>
        <div style={{
          background: "rgba(124,58,237,0.08)",
          border: "1px solid rgba(124,58,237,0.18)",
          borderRadius: 9, padding: "10px 12px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
            <Circle size={6} color="#a78bfa" fill="#a78bfa" />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#c4b5fd" }}>Lumora Fashion</span>
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", letterSpacing: 0.3 }}>
            200 customers · 3 segments
          </div>
        </div>
      </div>
    </aside>
  );
}