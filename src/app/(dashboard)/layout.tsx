"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import AriaChatbot from "@/components/AriaChatbot";
import CommandPalette from "@/components/CommandPalette";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [pathname]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#080810" }}>
      <Sidebar />
      <main ref={mainRef} style={{ marginLeft: 228, flex: 1, minHeight: "100vh", overflow: "auto" }}>
        {children}
      </main>
      <AriaChatbot />
      <CommandPalette />
    </div>
  );
}