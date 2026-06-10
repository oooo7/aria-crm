"use client";
import { useEffect, useState } from "react";

type Toast = { id: number; message: string; type: "success" | "error" };
let toasts: Toast[] = [];
let listeners: Array<(t: Toast[]) => void> = [];

function notify() { listeners.forEach(l => l([...toasts])); }

export function toast(message: string, type: "success" | "error" = "success") {
  const id = Date.now();
  toasts.push({ id, message, type });
  notify();
  setTimeout(() => { toasts = toasts.filter(t => t.id !== id); notify(); }, 4000);
}
toast.success = (m: string) => toast(m, "success");
toast.error = (m: string) => toast(m, "error");

export function Toaster() {
  const [items, setItems] = useState<Toast[]>([]);
  useEffect(() => { listeners.push(setItems); return () => { listeners = listeners.filter(l => l !== setItems); }; }, []);
  return (
    <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map(t => (
        <div key={t.id} style={{
          padding: "12px 20px", borderRadius: 12, fontSize: 13, fontWeight: 500,
          background: t.type === "success" ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)",
          border: `1px solid ${t.type === "success" ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)"}`,
          color: t.type === "success" ? "#34d399" : "#f87171",
          backdropFilter: "blur(12px)", boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
          animation: "slideIn 0.2s ease"
        }}>
          {t.message}
        </div>
      ))}
    </div>
  );
}