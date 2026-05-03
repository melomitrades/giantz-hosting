"use client";

import { useApp } from "@/context/AppContext";
import { formatDate, getDeadlineUrgency, timeUntilDeadline } from "@/lib/utils";

export default function JoinerDeadlinesPage() {
  const { shopOrders, currentUser } = useApp();
  const now = new Date();

  // Collect all per-joiner deadlines (unpaid) + shop deadlines
  type DeadlineEntry = { label: string; deadline: string };
  const deadlines: DeadlineEntry[] = [];

  for (const order of shopOrders) {
    const myEntry = order.joiners.find((j) => j.joinerId === currentUser.id);
    if (myEntry?.paymentStatus === "unpaid" && myEntry.deadline) {
      deadlines.push({ label: `${order.group} · ${order.shop} (payment)`, deadline: myEntry.deadline });
    }
    if (order.shopDeadline) {
      deadlines.push({ label: `${order.group} · ${order.shop} (shop)`, deadline: order.shopDeadline });
    }
  }

  deadlines.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  // Calendar
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const deadlineDays = new Set(deadlines.map((d) => new Date(d.deadline).getDate()));
  const monthName = now.toLocaleString("en-GB", { month: "long", year: "numeric" });

  const urgencyColors: Record<string, string> = {
    ok: "var(--accent-mint)", soon: "var(--accent-gold)",
    critical: "var(--status-unpaid)", overdue: "var(--text-muted)",
  };

  return (
    <div className="fade-in">
      <h1 style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>Deadlines</h1>
      <p className="text-secondary text-sm mb-6">Your upcoming payment and shop deadlines</p>

      <div className="grid-2" style={{ gap: "1.5rem", alignItems: "start" }}>
        <div className="card">
          <div style={{ textAlign: "center", marginBottom: "1rem", fontFamily: "'DM Serif Display', serif", fontSize: "1.1rem", color: "var(--accent-blossom)" }}>{monthName}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
            {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
              <div key={d} style={{ textAlign: "center", fontSize: "0.7rem", color: "var(--text-muted)", padding: "4px 0" }}>{d}</div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isToday = day === now.getDate();
              const has = deadlineDays.has(day);
              return (
                <div key={day} style={{ textAlign: "center", padding: "6px 2px", borderRadius: "50%", fontSize: "0.8rem",
                  fontWeight: isToday ? 700 : 400,
                  color: isToday ? "var(--accent-blossom)" : has ? "var(--accent-gold)" : "var(--text-secondary)",
                  background: isToday ? "var(--accent-blossom-dim)" : has ? "var(--accent-gold-dim)" : "transparent",
                  border: has ? "1px solid var(--accent-gold)" : "1px solid transparent" }}>
                  {day}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {deadlines.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>No upcoming deadlines ✦</div>
          ) : (
            deadlines.map((d, idx) => {
              const urgency = getDeadlineUrgency(d.deadline);
              return (
                <div key={idx} className="card" style={{ borderLeft: `3px solid ${urgencyColors[urgency]}` }}>
                  <div className="flex justify-between items-center">
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{d.label}</div>
                      <div className="text-secondary text-sm mt-1">Due: {formatDate(d.deadline)}</div>
                    </div>
                    <span className="badge" style={{ color: urgencyColors[urgency], background: `${urgencyColors[urgency]}20` }}>
                      {timeUntilDeadline(d.deadline)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
