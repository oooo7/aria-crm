"use client";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Megaphone, Target,
  Sparkles, BarChart3, Zap, Circle, Plus, Activity
} from "lucide-react";

const NAV_SECTIONS = [
  {
    label: "Intelligence",
    items: [
      { href: "/", label: "Mission Control", icon: LayoutDashboard, shortcut: "G H" },
      { href: "/command", label: "Growth Agent", icon: Sparkles, ai: true, shortcut: "G A" },
    ]
  },
  {
    label: "Data",
    items: [
      { href: "/customers", label: "Customers", icon: Users, shortcut: "G C" },
      { href: "/segments", label: "Segments", icon: Target, shortcut: "G S" },
    ]
  },
  {
    label: "Execution",
    items: [
      { href: "/campaigns", label: "Campaigns", icon: Megaphone, shortcut: "G P" },
      { href: "/analytics", label: "Analytics", icon: BarChart3, shortcut: "G N" },
    ]
  },
];

export default function Sidebar() {
  const path = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return path === "/";
    return path.startsWith(href);
  };

  // Keyboard navigation shortcuts (G H, G A, G C, etc.)
  useEffect(() => {
    let lastKey = "";
    let lastKeyTime = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in input fields
      const target = e.target as HTMLElement;
      if (
        !target ||
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      const now = Date.now();

      if (lastKey === "g" && now - lastKeyTime < 1000) {
        let dest = "";
        switch (key) {
          case "h": dest = "/"; break;
          case "a": dest = "/command"; break;
          case "c": dest = "/customers"; break;
          case "s": dest = "/segments"; break;
          case "p": dest = "/campaigns"; break;
          case "n": dest = "/analytics"; break;
        }
        if (dest) {
          e.preventDefault();
          window.location.href = dest;
        }
        lastKey = "";
      } else if (key === "g") {
        lastKey = "g";
        lastKeyTime = now;
      } else {
        lastKey = "";
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <aside style={{
      position: "fixed", left: 0, top: 0, height: "100vh", width: 228,
      background: "linear-gradient(180deg, #07070f 0%, #060610 100%)",
      borderRight: "1px solid rgba(255,255,255,0.065)",
      display: "flex", flexDirection: "column", zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ padding: "18px 16px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #7c3aed 0%, #0891b2 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, boxShadow: "0 4px 18px rgba(124,58,237,0.35)",
          }}>
            <Zap size={17} color="white" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: 0.3, lineHeight: 1 }}>
              ARIA
            </div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: 2.5, textTransform: "uppercase", marginTop: 2 }}>
              Marketing OS
            </div>
          </div>
        </div>

        {/* Quick create button */}
        <Link
          href="/command"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            marginTop: 12, padding: "8px 12px", borderRadius: 9,
            background: "linear-gradient(135deg, rgba(124,58,237,0.22), rgba(8,145,178,0.15))",
            border: "1px solid rgba(124,58,237,0.28)",
            color: "#c4b5fd", fontSize: 12, fontWeight: 700,
            textDecoration: "none", transition: "all 0.15s",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg, rgba(124,58,237,0.35), rgba(8,145,178,0.25))";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(124,58,237,0.45)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg, rgba(124,58,237,0.22), rgba(8,145,178,0.15))";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(124,58,237,0.28)";
          }}
        >
          <Plus size={13} />
          New Campaign
        </Link>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "10px 10px", display: "flex", flexDirection: "column", gap: 0, overflowY: "auto" }}>
        {NAV_SECTIONS.map((section, si) => (
          <div key={section.label} style={{ marginBottom: 4 }}>
            <div style={{
              fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.2)",
              textTransform: "uppercase", letterSpacing: 1.6,
              padding: "8px 10px 4px",
            }}>
              {section.label}
            </div>
            {section.items.map(({ href, label, icon: Icon, ai, shortcut }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  title={shortcut ? `${label} (${shortcut})` : label}
                  style={{
                    display: "flex", alignItems: "center", gap: 9,
                    padding: "8px 10px", borderRadius: 9, textDecoration: "none",
                    fontSize: 13, fontWeight: active ? 600 : 400,
                    color: active ? "#c4b5fd" : "rgba(255,255,255,0.42)",
                    background: active ? "rgba(124,58,237,0.13)" : "transparent",
                    border: active ? "1px solid rgba(124,58,237,0.22)" : "1px solid transparent",
                    transition: "all 0.12s ease",
                    position: "relative",
                    marginBottom: 1,
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.75)";
                      (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.42)";
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                    }
                  }}
                >
                  {/* Active left indicator */}
                  {active && (
                    <div style={{
                      position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
                      width: 3, height: "60%", borderRadius: "0 3px 3px 0",
                      background: "linear-gradient(180deg, #a78bfa, #38bdf8)",
                    }} />
                  )}
                  <Icon
                    size={15}
                    color={active ? "#a78bfa" : "currentColor"}
                    strokeWidth={active ? 2.5 : 1.8}
                  />
                  <span style={{ flex: 1 }}>{label}</span>
                  {ai && (
                    <span style={{
                      fontSize: 8, fontWeight: 800,
                      background: "linear-gradient(135deg, rgba(124,58,237,0.35), rgba(8,145,178,0.25))",
                      color: "#a78bfa", padding: "2px 5px",
                      borderRadius: 4, letterSpacing: 0.8,
                      textTransform: "uppercase",
                      border: "1px solid rgba(124,58,237,0.28)",
                    }}>
                      AI
                    </span>
                  )}
                </Link>
              );
            })}
            {si < NAV_SECTIONS.length - 1 && (
              <div style={{ height: 1, background: "rgba(255,255,255,0.04)", margin: "6px 10px 2px" }} />
            )}
          </div>
        ))}
      </nav>

      {/* Channel Service Status */}
      <div style={{ padding: "8px 10px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.15)",
          borderRadius: 9, padding: "8px 10px",
        }}>
          <Activity size={11} color="#34d399" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#34d399", lineHeight: 1 }}>Channel Service</div>
            <div style={{ fontSize: 9, color: "rgba(52,211,153,0.55)", marginTop: 1 }}>Simulating delivery events</div>
          </div>
          <div style={{
            width: 7, height: 7, borderRadius: "50%", background: "#34d399",
            animation: "pulse-dot 2s ease-in-out infinite",
          }} />
        </div>
      </div>

      {/* Brand footer */}
      <div style={{ padding: "8px 10px 14px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{
          background: "rgba(124,58,237,0.08)",
          border: "1px solid rgba(124,58,237,0.16)",
          borderRadius: 9, padding: "10px 12px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
            <Circle size={6} color="#a78bfa" fill="#a78bfa" />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#c4b5fd" }}>Lumora Fashion</span>
          </div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: 0.4 }}>
            AI-native marketing workspace
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 8, paddingTop: 6, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <Sparkles size={9} color="#a78bfa" />
            <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>Built with Gemini AI</span>
          </div>
        </div>

        {/* Cmd+K hint */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          marginTop: 8, padding: "6px 10px",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.05)",
          borderRadius: 7, cursor: "pointer",
        }}
        onClick={() => {
          const event = new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true });
          window.dispatchEvent(event);
        }}
        >
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", fontWeight: 600 }}>⌘K</span>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.18)" }}>Quick commands</span>
        </div>
      </div>
    </aside>
  );
}

