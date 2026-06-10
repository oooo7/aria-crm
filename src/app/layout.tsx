import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "ARIA — AI Marketing Copilot",
  description: "AI-native CRM for D2C brands",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ background: "#080810", color: "#fff", margin: 0, fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif", WebkitFontSmoothing: "antialiased" }}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}