"use client";

import { useMemo, useRef, useState } from "react";
import { CheckCircle2, FileSpreadsheet, Loader2, Upload, X } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "@/components/ui/toast";

type ImportResult = { created: number; skipped: number; ordersCreated: number };

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

function parsePreview(text: string) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  const headers = lines[0] ? parseCsvLine(lines[0]) : [];
  const rows = lines.slice(1, 6).map((line) => parseCsvLine(line));
  return { headers, rows, count: Math.max(0, lines.length - 1) };
}

export default function ImportCustomersModal({
  onClose,
  onImported,
}: {
  onClose: () => void;
  onImported?: (result: ImportResult) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ headers: string[]; rows: string[][]; count: number } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validation = useMemo(() => {
    const normalized = preview?.headers.map((header) => header.toLowerCase().replace(/\s/g, "")) || [];
    const missing = ["name", "email"].filter((field) => !normalized.includes(field));
    const hasOrders = normalized.includes("orderamount") || normalized.includes("amount");
    return { missing, hasOrders, valid: missing.length === 0 };
  }, [preview]);

  async function selectFile(nextFile: File | null) {
    if (!nextFile) return;
    setFile(nextFile);
    setResult(null);
    const text = await nextFile.text();
    setPreview(parsePreview(text));
  }

  async function uploadFile() {
    if (!file || !validation.valid) return;
    setUploading(true);
    setProgress(12);

    const timer = setInterval(() => {
      setProgress((current) => Math.min(88, current + 13));
    }, 180);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/import", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        toast.error(data.error || "Import failed");
        return;
      }

      const importResult = {
        created: data.created || 0,
        skipped: data.skipped || 0,
        ordersCreated: data.ordersCreated || 0,
      };
      setResult(importResult);
      onImported?.(importResult);
      setProgress(100);
    } catch {
      toast.error("Import failed");
    } finally {
      clearInterval(timer);
      setUploading(false);
    }
  }

  return (
    <div
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.72)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
    >
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        style={{ width: 760, maxWidth: "100%", background: "linear-gradient(145deg, rgba(18,18,34,0.96), rgba(10,10,20,0.94))", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 22, boxShadow: "0 30px 100px rgba(0,0,0,0.45)", overflow: "hidden" }}
      >
        <div style={{ padding: "22px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 6 }}>
              <FileSpreadsheet size={18} color="#a78bfa" />
              <h2 style={{ fontSize: 19, fontWeight: 900, color: "#fff", margin: 0 }}>Import Customer Data</h2>
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.42)", margin: 0 }}>Bring customers and optional order history into ARIA’s intelligence layer.</p>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.45)", cursor: "pointer", padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 24 }}>
          {!result ? (
            <>
              <div
                onClick={() => inputRef.current?.click()}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  void selectFile(event.dataTransfer.files[0] || null);
                }}
                style={{ border: `1.5px dashed ${dragging ? "#a78bfa" : "rgba(255,255,255,0.14)"}`, background: dragging ? "rgba(124,58,237,0.12)" : "rgba(255,255,255,0.035)", borderRadius: 16, padding: "28px 20px", textAlign: "center", cursor: "pointer", marginBottom: 18 }}
              >
                <Upload size={28} color={dragging ? "#a78bfa" : "rgba(255,255,255,0.34)"} style={{ marginBottom: 10 }} />
                <p style={{ fontSize: 14, fontWeight: 800, color: file ? "#c4b5fd" : "rgba(255,255,255,0.68)", margin: "0 0 4px" }}>{file ? file.name : "Drop CSV here or click to browse"}</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.32)", margin: 0 }}>Required: name, email. Optional: phone, city, totalSpent, orderCount, orderAmount, orderDate, items.</p>
                <input ref={inputRef} type="file" accept=".csv" style={{ display: "none" }} onChange={(event) => void selectFile(event.target.files?.[0] || null)} />
              </div>

              {preview && (
                <div style={{ display: "grid", gridTemplateColumns: "0.85fr 1.15fr", gap: 14, marginBottom: 18 }}>
                  <div style={{ background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 16 }}>
                    <p style={{ fontSize: 10, fontWeight: 900, color: "rgba(255,255,255,0.34)", textTransform: "uppercase", letterSpacing: 1.2, margin: "0 0 12px" }}>Validation</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, color: validation.valid ? "#34d399" : "#f87171", fontSize: 13 }}>
                        <CheckCircle2 size={14} /> {validation.valid ? "Required fields detected" : `Missing: ${validation.missing.join(", ")}`}
                      </div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.42)" }}>{preview.count.toLocaleString()} records detected</div>
                      <div style={{ fontSize: 12, color: validation.hasOrders ? "#38bdf8" : "rgba(255,255,255,0.34)" }}>{validation.hasOrders ? "Order history will be imported" : "Customer-only import"}</div>
                    </div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 16, overflow: "hidden" }}>
                    <p style={{ fontSize: 10, fontWeight: 900, color: "rgba(255,255,255,0.34)", textTransform: "uppercase", letterSpacing: 1.2, margin: "0 0 12px" }}>Field mapping preview</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                      {preview.headers.map((header) => (
                        <span key={header} style={{ fontSize: 11, color: "#c4b5fd", background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.18)", padding: "4px 8px", borderRadius: 999 }}>{header}</span>
                      ))}
                    </div>
                    <div style={{ maxHeight: 94, overflow: "auto", fontSize: 11, color: "rgba(255,255,255,0.44)", lineHeight: 1.7 }}>
                      {preview.rows.map((row, index) => (
                        <div key={index}>{row.slice(0, 4).join(" · ")}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {uploading && (
                <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 999, overflow: "hidden", marginBottom: 14 }}>
                  <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, #7c3aed, #0891b2)", transition: "width 0.18s ease" }} />
                </div>
              )}

              <button
                onClick={uploadFile}
                disabled={!file || !validation.valid || uploading}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, border: "none", borderRadius: 12, padding: "13px 16px", background: file && validation.valid && !uploading ? "linear-gradient(135deg, #7c3aed, #0891b2)" : "rgba(255,255,255,0.06)", color: file && validation.valid && !uploading ? "#fff" : "rgba(255,255,255,0.28)", fontWeight: 900, cursor: file && validation.valid && !uploading ? "pointer" : "not-allowed" }}
              >
                {uploading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Upload size={16} />}
                {uploading ? "Importing into ARIA..." : "Validate and import"}
              </button>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "22px 0" }}>
              <div style={{ width: 62, height: 62, borderRadius: 18, background: "rgba(52,211,153,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <CheckCircle2 size={30} color="#34d399" />
              </div>
              <h3 style={{ fontSize: 21, color: "#fff", fontWeight: 900, margin: "0 0 8px" }}>Import complete</h3>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.42)", margin: "0 0 18px" }}>{result.created} customers imported · {result.ordersCreated} orders created · {result.skipped} skipped</p>
              <button onClick={onClose} style={{ background: "linear-gradient(135deg, #7c3aed, #0891b2)", color: "#fff", border: "none", borderRadius: 12, padding: "11px 24px", fontWeight: 900, cursor: "pointer" }}>Done</button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
