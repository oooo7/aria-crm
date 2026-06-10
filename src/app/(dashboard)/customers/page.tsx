"use client";
import { useEffect, useState } from "react";
import { Search, Loader2, Crown, Sparkles } from "lucide-react";

interface Customer {
  id: string; name: string; email: string;
  city: string; totalSpent: number; orderCount: number;
  lastOrderAt: string | null; tags: string[];
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/customers?page=${page}&limit=20&search=${search}`)
      .then(r => r.json())
      .then(d => { setCustomers(d.customers); setTotal(d.total); setPages(d.pages); setLoading(false); });
  }, [page, search]);

  function daysAgo(date: string | null) {
    if (!date) return "Never";
    const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days}d ago`;
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Customers</h1>
          <p className="text-white/40 text-sm mt-1">{total.toLocaleString()} total shoppers</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search customers..."
            className="bg-[#0d0d14] border border-white/10 text-white placeholder-white/25 text-sm rounded-xl pl-9 pr-4 py-2.5 outline-none focus:border-violet-500/50 w-64 transition-colors"
          />
        </div>
      </div>

      <div className="bg-[#0d0d14] border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left text-white/30 text-xs uppercase tracking-wider px-6 py-4 font-medium">Customer</th>
              <th className="text-left text-white/30 text-xs uppercase tracking-wider px-6 py-4 font-medium">City</th>
              <th className="text-left text-white/30 text-xs uppercase tracking-wider px-6 py-4 font-medium">Orders</th>
              <th className="text-left text-white/30 text-xs uppercase tracking-wider px-6 py-4 font-medium">Total Spent</th>
              <th className="text-left text-white/30 text-xs uppercase tracking-wider px-6 py-4 font-medium">Last Order</th>
              <th className="text-left text-white/30 text-xs uppercase tracking-wider px-6 py-4 font-medium">Tags</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-16"><Loader2 className="w-5 h-5 text-violet-400 animate-spin mx-auto" /></td></tr>
            ) : customers.map((c, i) => (
              <tr key={c.id} className={`border-b border-white/3 hover:bg-white/2 transition-colors ${i % 2 === 0 ? "" : "bg-white/1"}`}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/30 to-cyan-500/30 flex items-center justify-center text-xs font-bold text-white/60">
                      {c.name[0]}
                    </div>
                    <div>
                      <p className="text-white/90 text-sm font-medium">{c.name}</p>
                      <p className="text-white/30 text-xs">{c.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-white/50 text-sm">{c.city || "—"}</td>
                <td className="px-6 py-4 text-white/70 text-sm font-medium">{c.orderCount}</td>
                <td className="px-6 py-4">
                  <span className="text-emerald-400 text-sm font-semibold">₹{c.totalSpent.toLocaleString()}</span>
                </td>
                <td className="px-6 py-4 text-white/40 text-xs">{daysAgo(c.lastOrderAt)}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-1">
                    {c.tags.map(tag => (
                      <span key={tag} className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                        tag === "vip" ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20" : "bg-cyan-500/15 text-cyan-400 border border-cyan-500/20"
                      }`}>
                        {tag === "vip" && <Crown className="w-2.5 h-2.5" />}
                        {tag === "new" && <Sparkles className="w-2.5 h-2.5" />}
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
          <p className="text-white/30 text-xs">Page {page} of {pages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-white/40 hover:text-white/70 disabled:opacity-30 transition-colors">
              Previous
            </button>
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
              className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-white/40 hover:text-white/70 disabled:opacity-30 transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}