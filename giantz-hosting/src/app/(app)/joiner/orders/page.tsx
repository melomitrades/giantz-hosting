"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { formatDate, formatKRW, formatEur } from "@/lib/utils";
import { ShopOrder, JoinerEntry } from "@/types";
import Modal, { FormField, FormActions } from "@/components/shared/Modal";

const FULFILLMENT_COLOR: Record<string, string> = {
  ordered: "var(--status-ordered)",
  received_at_kaddy: "var(--status-kaddy)",
  otw_to_gom: "var(--status-otw)",
  arrived_to_gom: "var(--status-arrived)",
};
const FULFILLMENT_LABELS: Record<string, string> = {
  ordered: "Ordered", received_at_kaddy: "At Kaddy",
  otw_to_gom: "OTW to GOM", arrived_to_gom: "At GOM",
};

// Proof submission modal
function ProofModal({ shopOrder, joinerEntry, onClose }: { shopOrder: ShopOrder; joinerEntry: JoinerEntry; onClose: () => void }) {
  const { updateShopOrder } = useApp();
  const [url, setUrl] = useState(joinerEntry.paymentProofUrl ?? "");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: ShopOrder = {
      ...shopOrder,
      joiners: shopOrder.joiners.map((j) =>
        j.id === joinerEntry.id ? { ...j, paymentStatus: "paid", paymentProofUrl: url } : j
      ),
    };
    updateShopOrder(shopOrder.id, updated);
    onClose();
  };

  return (
    <Modal title="Submit Payment Proof" onClose={onClose}>
      <p className="text-secondary text-sm mb-4">
        Paste the URL of your payment screenshot. Your entry will be marked as <strong style={{ color: "var(--accent-mint)" }}>paid</strong>.
      </p>
      <form onSubmit={submit}>
        <FormField label="Payment Proof URL">
          <input required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
        </FormField>
        <FormActions onClose={onClose} submitLabel="Submit Proof" />
      </form>
    </Modal>
  );
}

export default function JoinerOrdersPage() {
  const { shopOrders, currentUser } = useApp();
  const [filterStatus, setFilterStatus] = useState<"all" | "unpaid" | "paid">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [proof, setProof] = useState<{ order: ShopOrder; entry: JoinerEntry } | null>(null);

  // Find all shop orders where this joiner appears
  const myOrders = shopOrders
    .map((order) => ({ order, entry: order.joiners.find((j) => j.joinerId === currentUser.id) }))
    .filter((x): x is { order: ShopOrder; entry: JoinerEntry } => !!x.entry)
    .filter(({ entry }) => filterStatus === "all" || entry.paymentStatus === filterStatus);

  return (
    <div className="fade-in">
      {proof && <ProofModal shopOrder={proof.order} joinerEntry={proof.entry} onClose={() => setProof(null)} />}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 style={{ fontSize: "1.8rem" }}>My Orders</h1>
          <p className="text-secondary text-sm mt-1">{myOrders.length} order{myOrders.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-2">
          {(["all", "unpaid", "paid"] as const).map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)} className={`btn ${filterStatus === s ? "btn-primary" : "btn-ghost"}`}>
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {myOrders.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>No orders found ✦</div>
        ) : (
          myOrders.map(({ order, entry }) => {
            const isExpanded = expandedId === order.id + entry.id;
            const total = entry.items.reduce((s, it) => s + it.pricePerUnit * it.quantity, 0);
            const color = FULFILLMENT_COLOR[order.fulfillmentStatus];

            // Gather unique members across all items for this joiner
            const allMembers = [
              ...new Map(
                entry.items.flatMap((it) => it.membersClaimed ?? [])
                  .map((m) => [m.memberId, m])
              ).values()
            ];

            return (
              <div key={order.id + entry.id} className="card" style={{ cursor: "pointer", borderLeft: `3px solid ${color}`, borderColor: isExpanded ? "var(--accent-blossom)" : undefined, boxShadow: isExpanded ? "var(--shadow-glow-pink)" : undefined }}
                onClick={() => setExpandedId(isExpanded ? null : order.id + entry.id)}>

                <div className="flex justify-between items-center">
                  <div>
                    <div style={{ fontWeight: 700 }}>{order.group}
                      <span style={{ fontWeight: 400, color: "var(--text-muted)", marginLeft: 8, fontSize: "0.875rem" }}>· {order.shop}</span>
                    </div>
                    {allMembers.length > 0 && (
                      <div style={{ fontSize: "0.78rem", color: "var(--accent-blossom)", marginTop: 2 }}>
                        {allMembers.map((m) => m.memberName).join(", ")}
                      </div>
                    )}
                    <div className="text-secondary text-sm mt-1">{formatDate(order.dateOfOrder)}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="badge" style={{ color, background: `${color}20` }}>{FULFILLMENT_LABELS[order.fulfillmentStatus]}</span>
                    <span className="badge" style={{ background: entry.paymentStatus === "paid" ? "var(--accent-mint-dim)" : "#f4758a20", color: entry.paymentStatus === "paid" ? "var(--accent-mint)" : "var(--status-unpaid)" }}>
                      {entry.paymentStatus}
                    </span>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.85rem", color: "var(--accent-gold)" }}>{formatEur(total)}</span>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{isExpanded ? "▲" : "▼"}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
                    {entry.deadline && <div className="text-sm mb-3" style={{ color: "var(--accent-gold)" }}>⏰ Your deadline: {formatDate(entry.deadline)}</div>}
                    {order.shopDeadline && <div className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>🗓 Shop deadline: {formatDate(order.shopDeadline)}</div>}

                    <table>
                      <thead><tr>
                        <th>Members</th><th>Description</th><th>Qty</th><th>Option</th><th>Price</th><th>Inclusions</th><th style={{ textAlign: "right" }}>Total</th>
                      </tr></thead>
                      <tbody>
                        {entry.items.map((it) => {
                          const opt = order.pricingOptions?.find((o: { id: string }) => o.id === it.pricingOptionId);
                          return (
                            <tr key={it.id}>
                              <td style={{ padding: "3px 6px" }}>
                                {it.membersClaimed?.length > 0
                                  ? it.membersClaimed.map((m: { memberId: string; memberName: string }) => m.memberName).join(", ")
                                  : <span className="text-muted">—</span>}
                              </td>
                              <td style={{ fontWeight: 500 }}>{it.name || "—"}</td>
                              <td className="text-secondary">×{it.quantity}</td>
                              <td>
                                {opt ? <span style={{ fontSize: "0.72rem", padding: "1px 7px", borderRadius: 99, background: "var(--accent-blossom-dim)", color: "var(--accent-blossom)" }}>{opt.label}</span>
                                  : <span className="text-muted text-xs">Custom</span>}
                              </td>
                              <td style={{ fontFamily: "'DM Mono', monospace" }}>{formatEur(it.pricePerUnit)}</td>
                              <td className="text-secondary text-sm">{it.inclusions || "—"}</td>
                              <td style={{ textAlign: "right", fontFamily: "'DM Mono', monospace", color: "var(--accent-mint)" }}>{formatEur(it.pricePerUnit * it.quantity)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border)" }}>
                      <span className="text-secondary text-sm" style={{ marginRight: 12 }}>My Total</span>
                      <span style={{ fontFamily: "'DM Mono', monospace", color: "var(--accent-gold)", fontSize: "1rem", fontWeight: 600 }}>{formatEur(total)}</span>
                    </div>

                    <div className="flex gap-3 mt-4">
                      {entry.paymentStatus === "unpaid" && (
                        <button className="btn btn-primary" onClick={() => setProof({ order, entry })}>Submit Payment Proof</button>
                      )}
                      {entry.paymentProofUrl && (
                        <a href={entry.paymentProofUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">View Proof ↗</a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
