"use client";
import { useEffect, useState } from "react";
import { Target, Sparkles, Plus, Loader2 } from "lucide-react";
import Link from "next/link";

interface Segment {
  id: string; name: string; description: string | null;
  aiGenerated: boolean; createdAt: string;
  _count: { campaigns: number };
}

export default function SegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/segments").then(r => r.json()).then(d => { setSegments(d); setLoading(false); });
  }, []);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Segments</h1>
          <p className="text-white/40 text-sm mt-1">Audience groups for targeting</p>
        </div>
        <Link href="/command"
          className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white text-sm px-4 py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> New with AI
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {segments.map(s => (
            <div key={s.id} className="bg-[#0d0d14] border border-white/5 hover:border-violet-500/20 rounded-2xl p-6 transition-all duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-violet-400" />
                </div>
                {s.aiGenerated && (
                  <span className="flex items-center gap-1 text-[10px] bg-violet-500/20 text-violet-300 px-2 py-1 rounded-full border border-violet-500/20">
                    <Sparkles className="w-2.5 h-2.5" /> AI
                  </span>
                )}
              </div>
              <h3 className="text-white font-semibold mb-1">{s.name}</h3>
              <p className="text-white/40 text-sm mb-4">{s.description || "No description"}</p>
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <span className="text-white/30 text-xs">{s._count.campaigns} campaigns</span>
                <span className="text-white/20 text-xs">{new Date(s.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}