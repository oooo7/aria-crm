import Sidebar from "@/components/Sidebar";
import AriaChatbot from "@/components/AriaChatbot";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#080810" }}>
      <Sidebar />
      <main style={{ marginLeft: 228, flex: 1, minHeight: "100vh", overflow: "auto" }}>
        {children}
      </main>
      <AriaChatbot />
    </div>
  );
}