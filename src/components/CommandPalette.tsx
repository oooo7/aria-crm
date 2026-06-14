"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, Megaphone, Target, Sparkles,
  BarChart3, ArrowRight, Command, Search, Zap, Brain
} from "lucide-react";

interface PaletteItem {
  id: string;
  label: string;
  description: string;
  icon: typeof LayoutDashboard;
  href: string;
  shortcut?: string;
  color: string;
  category: string;
}

const ITEMS: PaletteItem[] = [
  { id: "dashboard",  label: "Mission Control",  description: "Business health, revenue intelligence & recommended actions", icon: LayoutDashboard, href: "/",          shortcut: "G H", color: "#a78bfa", category: "Navigation" },
  { id: "command",    label: "Growth Agent",      description: "Generate campaigns from plain English with Gemini AI",        icon: Sparkles,       href: "/command",   shortcut: "G A", color: "#c4b5fd", category: "Navigation" },
  { id: "customers",  label: "Customers",          description: "Customer intelligence, lifecycle segments & profiles",         icon: Users,          href: "/customers", shortcut: "G C", color: "#38bdf8", category: "Navigation" },
  { id: "segments",   label: "Segments",           description: "Audience groups, filter rules and campaign targeting",         icon: Target,         href: "/segments",  shortcut: "G S", color: "#34d399", category: "Navigation" },
  { id: "campaigns",  label: "Campaigns",          description: "All campaigns, delivery tracking & performance",               icon: Megaphone,      href: "/campaigns", shortcut: "G P", color: "#fb923c", category: "Navigation" },
  { id: "analytics",  label: "Analytics",          description: "Channel performance, funnels & conversion insights",           icon: BarChart3,      href: "/analytics", shortcut: "G N", color: "#f472b6", category: "Navigation" },
  { id: "winback",    label: "Win-back campaign",  description: "Send offer to customers who haven't ordered in 90 days",       icon: Brain,          href: "/command",   color: "#f59e0b", category: "Quick Launch" },
  { id: "vip",        label: "VIP exclusive campaign", description: "Reward top spenders with early access and exclusive deals", icon: Zap,           href: "/command",   color: "#fbbf24", category: "Quick Launch" },
  { id: "atrisk",     label: "Re-engage at-risk customers", description: "Target 45–89 day inactive customers before they churn", icon: Sparkles,     href: "/command",   color: "#f87171", category: "Quick Launch" },
];

const QUICK_PROMPTS: Record<string, string> = {
  winback: "Send a win-back offer to customers who haven't ordered in 90 days",
  vip:     "Create a VIP exclusive campaign for our top spenders",
  atrisk:  "Re-engage at-risk customers in Mumbai before they churn",
};

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(o => !o);
        setQuery("");
        setSelected(0);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 60);
  }, [open]);

  const filtered = query.trim()
    ? ITEMS.filter(item =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
      )
    : ITEMS;

  const grouped = filtered.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, PaletteItem[]>);

  const flatList = Object.values(grouped).flat();

  useEffect(() => {
    setSelected(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected(s => Math.min(s + 1, flatList.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected(s => Math.max(s - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = flatList[selected];
      if (item) activate(item);
    }
  };

  const activate = (item: PaletteItem) => {
    if (QUICK_PROMPTS[item.id]) {
      sessionStorage.setItem("aria_prefill", QUICK_PROMPTS[item.id]);
    }
    setOpen(false);
    window.location.href = item.href;
  };

  let globalIdx = 0;

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setOpen(false)}
              style={{
                position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
                backdropFilter: "blur(6px)", zIndex: 9990,
              }}
            />

            {/* Palette */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              style={{
                position: "fixed", top: "18%", left: "50%",
                transform: "translateX(-50%)",
                width: "min(620px, calc(100vw - 32px))",
                background: "rgba(10,10,22,0.98)",
                border: "1px solid rgba(124,58,237,0.28)",
                borderRadius: 18,
                boxShadow: "0 30px 80px rgba(0,0,0,0.7), 0 0 60px rgba(124,58,237,0.12)",
                zIndex: 9995, overflow: "hidden",
              }}
            >
              {/* Search input */}
              <div style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "14px 18px",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
              }}>
                <Search size={16} color="rgba(255,255,255,0.35)" style={{ flexShrink: 0 }} />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search pages, commands..."
                  style={{
                    flex: 1, background: "transparent", border: "none",
                    outline: "none", color: "#fff", fontSize: 15, fontFamily: "inherit",
                  }}
                />
                <div style={{
                  display: "flex", alignItems: "center", gap: 4,
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 6, padding: "2px 7px",
                }}>
                  <Command size={10} color="rgba(255,255,255,0.35)" />
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>K</span>
                </div>
              </div>

              {/* Results */}
              <div style={{ maxHeight: 400, overflowY: "auto", padding: "8px 0" }}>
                {Object.entries(grouped).map(([category, items]) => (
                  <div key={category}>
                    <div style={{
                      fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.25)",
                      textTransform: "uppercase", letterSpacing: 1.5,
                      padding: "6px 18px 4px",
                    }}>
                      {category}
                    </div>
                    {items.map((item) => {
                      const Icon = item.icon;
                      const itemIdx = globalIdx++;
                      const isSelected = selected === itemIdx;
                      return (
                        <div
                          key={item.id}
                          onClick={() => activate(item)}
                          onMouseEnter={() => setSelected(itemIdx)}
                          style={{
                            display: "flex", alignItems: "center", gap: 12,
                            padding: "10px 18px", cursor: "pointer",
                            background: isSelected ? "rgba(124,58,237,0.1)" : "transparent",
                            borderLeft: isSelected ? `2px solid ${item.color}` : "2px solid transparent",
                            transition: "all 0.1s",
                          }}
                        >
                          <div style={{
                            width: 34, height: 34, borderRadius: 10,
                            background: `${item.color}16`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0,
                          }}>
                            <Icon size={15} color={item.color} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{item.label}</div>
                            <div style={{
                              fontSize: 11, color: "rgba(255,255,255,0.38)",
                              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                            }}>
                              {item.description}
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                            {item.shortcut && (
                              <span style={{
                                fontSize: 9, color: "rgba(255,255,255,0.25)",
                                background: "rgba(255,255,255,0.06)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                borderRadius: 4, padding: "2px 6px", fontWeight: 600,
                              }}>
                                {item.shortcut}
                              </span>
                            )}
                            <ArrowRight size={12} color={isSelected ? item.color : "rgba(255,255,255,0.15)"} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}

                {filtered.length === 0 && (
                  <div style={{
                    padding: "32px 18px", textAlign: "center",
                    color: "rgba(255,255,255,0.3)", fontSize: 13,
                  }}>
                    No commands found for &ldquo;{query}&rdquo;
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{
                display: "flex", alignItems: "center", gap: 16,
                padding: "10px 18px",
                borderTop: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(0,0,0,0.2)",
              }}>
                {[
                  { keys: ["↑", "↓"], label: "Navigate" },
                  { keys: ["↵"], label: "Select" },
                  { keys: ["Esc"], label: "Close" },
                ].map(({ keys, label }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    {keys.map(k => (
                      <span key={k} style={{
                        fontSize: 9, color: "rgba(255,255,255,0.3)",
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 4, padding: "1px 5px", fontWeight: 700,
                      }}>{k}</span>
                    ))}
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{label}</span>
                  </div>
                ))}
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5 }}>
                  <Sparkles size={10} color="#a78bfa" />
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>ARIA Command</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
