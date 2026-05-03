"use client";

import { useApp } from "@/context/AppContext";
import { ShopOrder, OrderFulfillmentStatus } from "@/types";

const STATUS_SEQUENCE: OrderFulfillmentStatus[] = ["ordered", "received_at_kaddy", "otw_to_gom", "arrived_to_gom"];
const STATUS_ICONS: Record<string, string> = { ordered: "🛒", received_at_kaddy: "🏠", otw_to_gom: "✈️", arrived_to_gom: "📦" };
const STATUS_LABELS: Record<string, string> = { ordered: "Ordered", received_at_kaddy: "At Kaddy", otw_to_gom: "OTW to GOM", arrived_to_gom: "At GOM" };
const STATUS_COLORS: Record<string, string> = { ordered: "var(--status-ordered)", received_at_kaddy: "var(--status-kaddy)", otw_to_gom: "var(--status-otw)", arrived_to_gom: "var(--status-arrived)" };

export default function JoinerStatusPage() {
  const { shopOrders, currentUser } = useApp();
  const myOrders = shopOrders.filter((o) => o.joiners.some((j) => j.joinerId === currentUser.id));
  const grouped = STATUS_SEQUENCE.reduce((acc, s) => { acc[s] = myOrders.filter((o) => o.fulfillmentStatus === s); return acc; }, {} as Record<string, ShopOrder[]>);

  return (
    <div className="fade-in">
      <h1 style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>Order Status</h1>
      <p className="text-secondary text-sm mb-6">Track where your orders are</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
        {STATUS_SEQUENCE.map((status) => {
          const items = grouped[status] ?? [];
          const color = STATUS_COLORS[status];
          return (
            <div key={status}>
              <div style={{ padding: "0.75rem 1rem", borderRadius: "var(--radius-md)", marginBottom: "0.75rem", background: `${color}15`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", gap: 8 }}>
                <span>{STATUS_ICONS[status]}</span>
                <div>
                  <div style={{ fontSize: "0.8rem", fontWeight: 600, color }}>{STATUS_LABELS[status]}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{items.length} order{items.length !== 1 ? "s" : ""}</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {items.length === 0 ? (
                  <div style={{ padding: "1.5rem 1rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.8rem", borderRadius: "var(--radius-md)", border: "1px dashed var(--border)" }}>Empty</div>
                ) : (
                  items.map((o) => {
                    const me = o.joiners.find((j) => j.joinerId === currentUser.id);
                    return (
                      <div key={o.id} className="card" style={{ padding: "0.875rem 1rem" }}>
                        <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{o.group}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 2 }}>{o.shop}</div>
                        {me && (
                          <div style={{ marginTop: "0.5rem", padding: "2px 8px", borderRadius: 99, fontSize: "0.7rem", display: "inline-block", background: me.paymentStatus === "paid" ? "var(--accent-mint-dim)" : "#f4758a20", color: me.paymentStatus === "paid" ? "var(--status-paid)" : "var(--status-unpaid)" }}>
                            {me.paymentStatus}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
