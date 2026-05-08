"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { formatDate, SHIPPING_STATUS_LABELS, generateId } from "@/lib/utils";
import { ShippingPackage, ShippingStatus, WeightType } from "@/types";
import Modal, { FormRow, FormField, FormActions } from "@/components/shared/Modal";

const STATUS_COLORS: Record<string, string> = {
  unpacked: "var(--text-muted)",
  packing: "var(--accent-gold)",
  sorting: "var(--accent-lavender)",
  sent: "var(--accent-mint)",
};

function emptyPkg(joinerId: string, joinerName: string): ShippingPackage {
  return { id: generateId("sp"), joinerId, joinerName, courier: "", address: "", shippingStatus: "unpacked", weightType: "package", shopOrderIds: [] };
}

function ShippingModal({ initial, isNew, onClose }: { initial: ShippingPackage; isNew: boolean; onClose: () => void }) {
  const { addShipping, updateShipping, users, shopOrders } = useApp();
  const joiners = users.filter((u) => u.role === "joiner");
  const [form, setForm] = useState<ShippingPackage>({ ...initial });
  const set = (f: keyof ShippingPackage, v: unknown) => setForm((p) => ({ ...p, [f]: v }));

  const toggleOrder = (id: string) =>
    setForm((p) => ({ ...p, shopOrderIds: p.shopOrderIds.includes(id) ? p.shopOrderIds.filter((x) => x !== id) : [...p.shopOrderIds, id] }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const joiner = joiners.find((j) => j.id === form.joinerId) ?? joiners[0];
    const final: ShippingPackage = {
      ...form,
      joinerName: joiner?.name ?? form.joinerName,
      shippingDeadline: form.shippingDeadline ? new Date(form.shippingDeadline).toISOString() : undefined,
      weightKg: form.weightKg || undefined,
      miscNotes: form.miscNotes || undefined,
    };
    isNew ? addShipping(final) : updateShipping(final.id, final);
    onClose();
  };

  const ordersForJoiner = shopOrders.filter((o) => o.joiners.some((j) => j.joinerId === form.joinerId));

  return (
    <Modal title={isNew ? "New Package" : `Edit — ${initial.joinerName}`} onClose={onClose}>
      <form onSubmit={submit}>
        <FormRow cols={2}>
          <FormField label="Joiner">
            <select value={form.joinerId} onChange={(e) => set("joinerId", e.target.value)}>
              {joiners.map((j) => <option key={j.id} value={j.id}>{j.name}</option>)}
            </select>
          </FormField>
          <FormField label="Status">
            <select value={form.shippingStatus} onChange={(e) => set("shippingStatus", e.target.value as ShippingStatus)}>
              {(["unpacked", "packing", "sorting", "sent"] as const).map((s) => <option key={s} value={s}>{SHIPPING_STATUS_LABELS[s]}</option>)}
            </select>
          </FormField>
        </FormRow>
        <FormRow cols={2}>
          <FormField label="Courier">
            <input required value={form.courier} onChange={(e) => set("courier", e.target.value)} placeholder="e.g. EMS, DHL, K-Packet" />
          </FormField>
          <FormField label="Weight Type">
            <select value={form.weightType} onChange={(e) => set("weightType", e.target.value as WeightType)}>
              <option value="package">📦 Package</option>
              <option value="letter">📄 Letter</option>
            </select>
          </FormField>
        </FormRow>
        <FormRow cols={2}>
          <FormField label="Weight (kg)">
            <input type="number" min={0} step={0.1} value={form.weightKg ?? ""} onChange={(e) => set("weightKg", e.target.value ? Number(e.target.value) : undefined)} placeholder="e.g. 1.2" />
          </FormField>
          <FormField label="Shipping Deadline">
            <input type="date" value={form.shippingDeadline?.slice(0, 10) ?? ""} onChange={(e) => set("shippingDeadline", e.target.value)} />
          </FormField>
        </FormRow>
        <FormField label="Address">
          <textarea rows={2} value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Full shipping address" style={{ resize: "vertical" }} />
        </FormField>
        <FormField label="Misc Notes">
          <textarea rows={2} value={form.miscNotes ?? ""} onChange={(e) => set("miscNotes", e.target.value)} placeholder="e.g. Fragile items" style={{ resize: "vertical" }} />
        </FormField>

        <FormField label="Linked Orders">
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4, maxHeight: 160, overflowY: "auto" }}>
            {ordersForJoiner.length === 0
              ? <div className="text-muted text-sm">No orders found for this joiner</div>
              : ordersForJoiner.map((o) => (
                <label key={o.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", cursor: "pointer", textTransform: "none", letterSpacing: 0, color: "var(--text-secondary)" }}>
                  <input type="checkbox" checked={form.shopOrderIds.includes(o.id)} onChange={() => toggleOrder(o.id)} style={{ width: "auto" }} />
                  {o.group} — {o.shop}{o.round ? ` (${o.round})` : ""}
                  <span className="badge badge-muted" style={{ marginLeft: "auto", fontSize: "0.68rem" }}>
                    {o.fulfillmentStatus === "arrived_to_gom" ? "✓ At GOM" : o.fulfillmentStatus}
                  </span>
                </label>
              ))}
          </div>
        </FormField>

        <FormActions onClose={onClose} submitLabel={isNew ? "Create Package" : "Save Changes"} />
      </form>
    </Modal>
  );
}

export default function GomSendingPage() {
  const { shipping, updateShipping, deleteShipping, users, shopOrders, sortingSessions } = useApp();
  const [filterStatus, setFilterStatus] = useState<ShippingStatus | "all">("all");
  const [filterCourier, setFilterCourier] = useState("all");
  const [modal, setModal] = useState<{ pkg: ShippingPackage; isNew: boolean } | null>(null);
  const [expandedPkgId, setExpandedPkgId] = useState<string | null>(null);
  const defaultJoiner = users.find((u) => u.role === "joiner");

  const couriers = [...new Set(shipping.map((s) => s.courier))];
  const filtered = shipping.filter((s) => {
    if (filterStatus !== "all" && s.shippingStatus !== filterStatus) return false;
    if (filterCourier !== "all" && s.courier !== filterCourier) return false;
    return true;
  });

  return (
    <div className="fade-in">
      {modal && <ShippingModal initial={modal.pkg} isNew={modal.isNew} onClose={() => setModal(null)} />}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 style={{ fontSize: "1.8rem" }}>Sending Out</h1>
          <p className="text-secondary text-sm mt-1">{filtered.length} package{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <button className="btn btn-primary" onClick={() => defaultJoiner && setModal({ pkg: emptyPkg(defaultJoiner.id, defaultJoiner.name), isNew: true })}>
          + Add Package
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-6" style={{ display: "flex", gap: "1rem", alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <label>Status</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as ShippingStatus | "all")}>
            <option value="all">All statuses</option>
            {(["unpacked", "packing", "sorting", "sent"] as const).map((s) => <option key={s} value={s}>{SHIPPING_STATUS_LABELS[s]}</option>)}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label>Courier</label>
          <select value={filterCourier} onChange={(e) => setFilterCourier(e.target.value)}>
            <option value="all">All couriers</option>
            {couriers.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Package list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {filtered.map((pkg) => {
          const isExpanded = expandedPkgId === pkg.id;

          // Orders for this joiner: split into At GOM vs others
          const linkedOrders = shopOrders.filter((o) => pkg.shopOrderIds.includes(o.id));
          const atGomOrders = shopOrders.filter(
            (o) => o.fulfillmentStatus === "arrived_to_gom" && o.joiners.some((j) => j.joinerId === pkg.joinerId) && !pkg.shopOrderIds.includes(o.id)
          );

          // PC sorting results for this joiner
          const pcAssignments = sortingSessions
            .filter((s) => s.sortedAt)
            .flatMap((s) => {
              const joinerResult = s.joiners.find((j) => j.joinerId === pkg.joinerId);
              if (!joinerResult?.assigned?.length) return [];
              return [{ sessionGroup: s.group, assigned: joinerResult.assigned }];
            });

          return (
            <div key={pkg.id} className="card" style={{ cursor: "pointer" }} onClick={() => setExpandedPkgId(isExpanded ? null : pkg.id)}>
              {/* Card header */}
              <div className="flex justify-between items-center">
                <div>
                  <div style={{ fontWeight: 600 }}>{pkg.joinerName}</div>
                  <div className="text-secondary text-sm mt-1">
                    {pkg.courier} · {pkg.weightType === "letter" ? "📄 Letter" : "📦 Package"}
                    {pkg.weightKg ? ` · ${pkg.weightKg}kg` : ""}
                  </div>
                  {/* Quick badges */}
                  <div style={{ display: "flex", gap: 4, marginTop: 5, flexWrap: "wrap" }}>
                    {atGomOrders.length > 0 && (
                      <span style={{ fontSize: "0.68rem", padding: "1px 7px", borderRadius: 99, background: "var(--status-arrived)20", color: "var(--status-arrived)", border: "1px solid var(--status-arrived)40" }}>
                        📦 {atGomOrders.length} At GOM
                      </span>
                    )}
                    {pcAssignments.length > 0 && (
                      <span style={{ fontSize: "0.68rem", padding: "1px 7px", borderRadius: 99, background: "var(--accent-lavender-dim)", color: "var(--accent-lavender)" }}>
                        🃏 {pcAssignments.reduce((s, a) => s + a.assigned.length, 0)} PC{pcAssignments.reduce((s, a) => s + a.assigned.length, 0) !== 1 ? "s" : ""} assigned
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                  {pkg.shippingDeadline && <span className="text-sm" style={{ color: "var(--accent-gold)" }}>⏰ {formatDate(pkg.shippingDeadline)}</span>}
                  <select value={pkg.shippingStatus}
                    onChange={(e) => updateShipping(pkg.id, { shippingStatus: e.target.value as ShippingStatus })}
                    style={{ width: "auto", color: STATUS_COLORS[pkg.shippingStatus], fontSize: "0.85rem", padding: "4px 10px" }}>
                    {(["unpacked", "packing", "sorting", "sent"] as const).map((s) => <option key={s} value={s}>{SHIPPING_STATUS_LABELS[s]}</option>)}
                  </select>
                  <button className="btn btn-ghost" style={{ fontSize: "0.78rem", padding: "4px 10px" }} onClick={() => setModal({ pkg, isNew: false })}>Edit</button>
                  <button className="btn" style={{ fontSize: "0.78rem", padding: "4px 10px", color: "var(--status-unpaid)", borderColor: "#f4758a40", background: "transparent" }}
                    onClick={() => { if (confirm(`Delete package for ${pkg.joinerName}?`)) deleteShipping(pkg.id); }}>Delete</button>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{isExpanded ? "▲" : "▼"}</span>
                </div>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div style={{ marginTop: "0.875rem", paddingTop: "0.875rem", borderTop: "1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>

                    {/* Left column: At GOM items for this joiner */}
                    <div>
                      <div className="text-xs text-muted mb-2" style={{ color: "var(--status-arrived)" }}>
                        📦 AT GOM — READY TO PACK
                      </div>
                      {atGomOrders.length === 0 ? (
                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontStyle: "italic" }}>No At GOM items</div>
                      ) : (
                        atGomOrders.map((order) => {
                          const myEntry = order.joiners.find((j) => j.joinerId === pkg.joinerId);
                          const mems = [...new Map((myEntry?.items ?? []).flatMap((it) => it.membersClaimed ?? []).map((m) => [m.memberId, m])).values()];
                          return (
                            <div key={order.id} style={{ background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)", padding: "0.5rem 0.75rem", marginBottom: "0.375rem", borderLeft: "2px solid var(--status-arrived)" }}>
                              <div style={{ fontWeight: 600, fontSize: "0.82rem" }}>
                                {order.group} · {order.shop}{order.round ? ` · ${order.round}` : ""}
                              </div>
                              {myEntry?.items.map((it) => (
                                <div key={it.id} style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 2 }}>
                                  {it.name || "item"} ×{it.quantity}
                                  {it.inclusions ? ` (${it.inclusions})` : ""}
                                </div>
                              ))}
                              {mems.length > 0 && (
                                <div style={{ fontSize: "0.72rem", color: "var(--accent-blossom)", marginTop: 2 }}>
                                  {mems.map((m) => m.memberName).join(", ")}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Right column: PC sorting results */}
                    <div>
                      <div className="text-xs text-muted mb-2" style={{ color: "var(--accent-lavender)" }}>
                        🃏 PC SORTING RESULTS
                      </div>
                      {pcAssignments.length === 0 ? (
                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontStyle: "italic" }}>No sorted PCs</div>
                      ) : (
                        pcAssignments.map((pa, i) => (
                          <div key={i} style={{ background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)", padding: "0.5rem 0.75rem", marginBottom: "0.375rem", borderLeft: "2px solid var(--accent-lavender)" }}>
                            <div style={{ fontWeight: 600, fontSize: "0.82rem", color: "var(--accent-lavender)", marginBottom: 4 }}>
                              {pa.sessionGroup}
                            </div>
                            {pa.assigned.map((a, j) => (
                              <div key={j} style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-mint)", display: "inline-block", flexShrink: 0 }} />
                                <span style={{ color: "var(--accent-blossom)", fontWeight: 500 }}>{a.memberName}</span>
                                <span style={{ color: "var(--text-muted)" }}>· {a.versionName}</span>
                              </div>
                            ))}
                          </div>
                        ))
                      )}

                      {/* Address & notes */}
                      {(pkg.address || pkg.miscNotes) && (
                        <div style={{ marginTop: "0.75rem" }}>
                          {pkg.address && (
                            <div style={{ marginBottom: "0.5rem" }}>
                              <div className="text-xs text-muted mb-1">ADDRESS</div>
                              <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{pkg.address}</div>
                            </div>
                          )}
                          {pkg.miscNotes && (
                            <div>
                              <div className="text-xs text-muted mb-1">NOTES</div>
                              <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{pkg.miscNotes}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && <div className="card" style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>No packages found ✦</div>}
      </div>
    </div>
  );
}
