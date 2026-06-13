import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "ARIA — AI Marketing OS for D2C Brands",
  description: "ARIA is an AI-native CRM built for D2C brands. It analyzes your customer base, identifies revenue opportunities, builds precise audience segments, and launches personalised campaigns — all from a single goal.",
  keywords: ["CRM", "AI marketing", "D2C", "customer segmentation", "campaign automation", "retention"],
  openGraph: {
    title: "ARIA — AI Marketing OS",
    description: "Revenue-first AI marketing for D2C brands. Built on Xeno.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{
        background: "#080810",
        color: "#fff",
        margin: 0,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
      }}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}