import Sidebar from "@/components/shared/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main
        style={{
          flex: 1,
          padding: "2rem 2.5rem",
          overflowY: "auto",
          maxWidth: "calc(100vw - 240px)",
        }}
      >
        {children}
      </main>
    </div>
  );
}
