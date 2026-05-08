"use client";

import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { formatKRW, generateId } from "@/lib/utils";
import { Box, BoxJoinerFee } from "@/types";
import Modal, { FormRow, FormField, FormActions } from "@/components/shared/Modal";

function fmt(val: number, currency: "EUR" | "KRW") {
  return currency === "EUR" ? `€${val.toFixed(2)}` : formatKRW(val);
}

// ── Box Form Modal ────────────────────────────────────────────────────────────
function BoxModal({ initial, isNew, onClose }: { initial: Box; isNew: boolean; onClose: () => void }) {
  const { addBox, updateBox, shopOrders, weightCategories, eurToKrw } = useApp();
  const [form, setForm] = useState<Box>({ ...initial, shopOrderIds: [...initial.shopOrderIds] });
  const set = (f: keyof Box, v: unknown) => setForm((p) => ({ ...p, [f]: v }));

  const toggleOrder = (id: string) =>
    setForm((p) => ({ ...p, shopOrderIds: p.shopOrderIds.includes(id) ? p.shopOrderIds.filter((x) => x !== id) : [...p.shopOrderIds, id] }));

  // Auto-calculate per-joiner fees (EMS + customs split proportionally by weight points)
  const autoFees = useMemo((): BoxJoinerFee[] => {
    const selected = shopOrders.filter((o) => form.shopOrderIds.includes(o.id));
    const joinerPts: Record<string, { joinerId: string; joinerName: string; points: number }> = {};
    for (const order of selected) {
      for (const je of order.joiners) {
        if (!joinerPts[je.joinerId]) joinerPts[je.joinerId] = { joinerId: je.joinerId, joinerName: je.joinerName, points: 0 };
        for (const item of je.items) {
          const wc = weightCategories.find((w) => w.id === item.weightCategoryId);
          joinerPts[je.joinerId].points += (wc?.points ?? 1) * item.quantity;
        }
      }
    }
    const totalPts = Object.values(joinerPts).reduce((s, j) => s + j.points, 0);
    return Object.values(joinerPts).map((j) => {
      const share = totalPts > 0 ? j.points / totalPts : 0;
      const existing = form.joinerFees.find((f) => f.joinerId === j.joinerId);
      return {
        joinerId: j.joinerId, joinerName: j.joinerName, totalPoints: j.points,
        emsShareEur: parseFloat((share * form.emsCostEur).toFixed(2)),
        emsShareKrw: Math.round(share * form.emsCostKrw),
        customsShareEur: parseFloat((share * form.customsCostEur).toFixed(2)),
        customsShareKrw: Math.round(share * form.customsCostKrw),
        emsPaid: existing?.emsPaid ?? false,
        customsPaid: existing?.customsPaid ?? false,
        feeProofUrl: existing?.feeProofUrl ?? "",
      };
    });
  }, [form.shopOrderIds, form.emsCostEur, form.emsCostKrw, form.customsCostEur, form.customsCostKrw, shopOrders, weightCategories]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const final: Box = { ...form, joinerFees: autoFees, notes: form.notes || undefined, sentAt: form.sentAt || undefined };
    isNew ? addBox(final) : updateBox(final.id, final);
    onClose();
  };

  return (
    <Modal title={isNew ? "New Box" : `Edit — ${initial.name}`} onClose={onClose} width={720}>
      <form onSubmit={submit}>
        <FormRow cols={2}>
          <FormField label="Box Name">
            <input required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Box 1 — March EMS" />
          </FormField>
          <FormField label="Sent At (optional)">
            <input type="date" value={form.sentAt?.slice(0, 10) ?? ""} onChange={(e) => set("sentAt", e.target.value)} />
          </FormField>
        </FormRow>

        {/* EMS */}
        <div style={{ fontSize: "0.72rem", color: "var(--accent-lavender)", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 6, marginTop: 4 }}>EMS Cost</div>
        <FormRow cols={3}>
          <FormField label="EMS (€)"><input type="number" min={0} step={0.01} value={form.emsCostEur} onChange={(e) => set("emsCostEur", Number(e.target.value))} /></FormField>
          <FormField label="EMS (₩)"><input type="number" min={0} value={form.emsCostKrw} onChange={(e) => set("emsCostKrw", Number(e.target.value))} /></FormField>
          <FormField label="Rate (€1 = ₩)"><input type="number" min={1} value={form.exchangeRate} onChange={(e) => set("exchangeRate", Number(e.target.value))} /></FormField>
        </FormRow>

        {/* Customs */}
        <div style={{ fontSize: "0.72rem", color: "var(--accent-gold)", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 6, marginTop: 8 }}>Customs Cost</div>
        <FormRow cols={2}>
          <FormField label="Customs (€)"><input type="number" min={0} step={0.01} value={form.customsCostEur} onChange={(e) => set("customsCostEur", Number(e.target.value))} /></FormField>
          <FormField label="Customs (₩)"><input type="number" min={0} value={form.customsCostKrw} onChange={(e) => set("customsCostKrw", Number(e.target.value))} /></FormField>
        </FormRow>

        <FormField label="Notes">
          <input value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} placeholder="Optional notes" />
        </FormField>

        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", letterSpacing: "0.05em", textTransform: "uppercase", margin: "1rem 0 0.5rem" }}>Select Orders</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5, maxHeight: 200, overflowY: "auto", marginBottom: "1rem" }}>
          {shopOrders.map((o) => {
            const sel = form.shopOrderIds.includes(o.id);
            return (
              <label key={o.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", borderRadius: "var(--radius-sm)", background: sel ? "var(--accent-lavender-dim)" : "var(--bg-elevated)", border: `1px solid ${sel ? "var(--accent-lavender)" : "var(--border)"}`, cursor: "pointer" }}>
                <input type="checkbox" checked={sel} onChange={() => toggleOrder(o.id)} style={{ width: "auto" }} />
                <span style={{ fontWeight: 500, fontSize: "0.875rem" }}>{o.group}</span>
                <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>· {o.shop}{o.round ? ` · ${o.round}` : ""}</span>
                <span style={{ marginLeft: "auto", fontSize: "0.72rem", color: "var(--text-muted)" }}>{o.joiners.length} joiner{o.joiners.length !== 1 ? "s" : ""}</span>
              </label>
            );
          })}
        </div>

        {/* Preview */}
        {autoFees.length > 0 && (
          <div style={{ background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)", padding: "0.75rem", marginBottom: "0.75rem" }}>
            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Calculated Shares Preview</div>
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 48px", gap: 4, marginBottom: 4 }}>
              {["Joiner", "EMS", "Customs", "Total", "pts"].map((h) => (
                <div key={h} style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</div>
              ))}
            </div>
            {autoFees.map((f) => (
              <div key={f.joinerId} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 48px", gap: 4, padding: "3px 0", fontSize: "0.82rem" }}>
                <span style={{ color: "var(--text-secondary)" }}>{f.joinerName}</span>
                <span style={{ fontFamily: "'DM Mono', monospace", color: "var(--accent-lavender)" }}>€{f.emsShareEur.toFixed(2)}</span>
                <span style={{ fontFamily: "'DM Mono', monospace", color: "var(--accent-gold)" }}>€{f.customsShareEur.toFixed(2)}</span>
                <span style={{ fontFamily: "'DM Mono', monospace", color: "var(--accent-mint)" }}>€{(f.emsShareEur + f.customsShareEur).toFixed(2)}</span>
                <span style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>{f.totalPoints}pt</span>
              </div>
            ))}
          </div>
        )}

        <FormActions onClose={onClose} submitLabel={isNew ? "Create Box" : "Save Changes"} />
      </form>
    </Modal>
  );
}

// ── Box Card ──────────────────────────────────────────────────────────────────
function BoxCard({ box }: { box: Box }) {
  const { updateBox, deleteBox, shopOrders } = useApp();
  const [expanded, setExpanded] = useState(false);
  const [currency, setCurrency] = useState<"EUR" | "KRW">("EUR");
  const [modal, setModal] = useState(false);

  const linkedOrders = shopOrders.filter((o) => box.shopOrderIds.includes(o.id));
  const emsPaidCount = box.joinerFees.filter((f) => f.emsPaid).length;
  const customsPaidCount = box.joinerFees.filter((f) => f.customsPaid).length;
  const totalPoints = box.joinerFees.reduce((s, f) => s + f.totalPoints, 0);

  const toggleFee = (joinerId: string, type: "emsPaid" | "customsPaid") => {
    updateBox(box.id, { joinerFees: box.joinerFees.map((f) => f.joinerId === joinerId ? { ...f, [type]: !f[type] } : f) });
  };

  return (
    <>
      {modal && <BoxModal initial={box} isNew={false} onClose={() => setModal(false)} />}
      <div className="card" style={{ borderLeft: "3px solid var(--accent-lavender)" }}>
        <div className="flex justify-between items-center" style={{ cursor: "pointer" }} onClick={() => setExpanded((v) => !v)}>
          <div>
            <div style={{ fontWeight: 700, fontSize: "1rem" }}>{box.name}</div>
            <div className="text-secondary text-sm mt-1">
              {linkedOrders.length} order{linkedOrders.length !== 1 ? "s" : ""} ·
              EMS {emsPaidCount}/{box.joinerFees.length} ·
              Customs {customsPaidCount}/{box.joinerFees.length}
              {box.sentAt && <span style={{ marginLeft: 8, color: "var(--accent-mint)" }}>· Sent ✓</span>}
            </div>
          </div>
          <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            {/* EUR/KRW toggle */}
            <div style={{ display: "flex", background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)", padding: 2, gap: 2 }}>
              {(["EUR", "KRW"] as const).map((c) => (
                <button key={c} onClick={() => setCurrency(c)}
                  style={{ padding: "3px 8px", borderRadius: "var(--radius-sm)", border: "none", cursor: "pointer", fontSize: "0.72rem", fontWeight: 600,
                    background: currency === c ? "var(--accent-gold)" : "transparent", color: currency === c ? "#0d0f14" : "var(--text-muted)" }}>
                  {c === "EUR" ? "€" : "₩"}
                </button>
              ))}
            </div>
            {/* Cost summary */}
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "'DM Mono', monospace", color: "var(--accent-lavender)", fontSize: "0.8rem" }}>
                EMS: {fmt(currency === "EUR" ? box.emsCostEur : box.emsCostKrw, currency)}
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", color: "var(--accent-gold)", fontSize: "0.8rem" }}>
                Customs: {fmt(currency === "EUR" ? box.customsCostEur : box.customsCostKrw, currency)}
              </div>
            </div>
            <button className="btn btn-ghost" style={{ fontSize: "0.75rem", padding: "3px 8px" }} onClick={() => setModal(true)}>Edit</button>
            <button className="btn" style={{ fontSize: "0.75rem", padding: "3px 8px", color: "var(--status-unpaid)", borderColor: "#f4758a40", background: "transparent" }}
              onClick={() => { if (confirm(`Delete box "${box.name}"?`)) deleteBox(box.id); }}>Del</button>
            <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{expanded ? "▲" : "▼"}</span>
          </div>
        </div>

        {expanded && (
          <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
            {box.notes && <div className="text-secondary text-sm mb-3" style={{ fontStyle: "italic" }}>📝 {box.notes}</div>}

            {linkedOrders.length > 0 && (
              <div style={{ marginBottom: "1rem" }}>
                <div className="text-xs text-muted mb-1">ORDERS IN BOX</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {linkedOrders.map((o) => <span key={o.id} className="badge badge-muted">{o.group} · {o.shop}{o.round ? ` · ${o.round}` : ""}</span>)}
                </div>
              </div>
            )}

            {/* Fee tracker with split EMS / Customs */}
            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Fee Tracker</div>

            {/* Header */}
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 20px 1fr 20px 1fr 1fr 48px", gap: "0.5rem", marginBottom: 4, padding: "0 0.5rem" }}>
              {["Joiner", "", "EMS share", "", "Customs share", "Total", "pts"].map((h, i) => (
                <div key={i} style={{ fontSize: "0.62rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</div>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              {box.joinerFees.map((fee) => {
                const totalShare = currency === "EUR" ? fee.emsShareEur + fee.customsShareEur : fee.emsShareKrw + fee.customsShareKrw;
                const pct = totalPoints > 0 ? (fee.totalPoints / totalPoints) * 100 : 0;
                return (
                  <div key={fee.joinerId} style={{ display: "grid", gridTemplateColumns: "1.5fr 20px 1fr 20px 1fr 1fr 48px", gap: "0.5rem", alignItems: "center", padding: "0.5rem 0.5rem", background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)", border: `1px solid ${(fee.emsPaid && fee.customsPaid) ? "var(--accent-mint-dim)" : "var(--border)"}` }}>
                    <div style={{ fontWeight: 500, fontSize: "0.82rem" }}>{fee.joinerName}</div>

                    {/* EMS paid toggle */}
                    <button onClick={() => toggleFee(fee.joinerId, "emsPaid")} title="Mark EMS paid"
                      style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${fee.emsPaid ? "var(--accent-lavender)" : "var(--border)"}`, background: fee.emsPaid ? "var(--accent-lavender)" : "transparent", cursor: "pointer", fontSize: "0.6rem", color: fee.emsPaid ? "#0d0f14" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      ✓
                    </button>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.82rem", color: fee.emsPaid ? "var(--accent-lavender)" : "var(--text-secondary)" }}>
                      {fmt(currency === "EUR" ? fee.emsShareEur : fee.emsShareKrw, currency)}
                    </div>

                    {/* Customs paid toggle */}
                    <button onClick={() => toggleFee(fee.joinerId, "customsPaid")} title="Mark Customs paid"
                      style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${fee.customsPaid ? "var(--accent-gold)" : "var(--border)"}`, background: fee.customsPaid ? "var(--accent-gold)" : "transparent", cursor: "pointer", fontSize: "0.6rem", color: fee.customsPaid ? "#0d0f14" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      ✓
                    </button>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.82rem", color: fee.customsPaid ? "var(--accent-gold)" : "var(--text-secondary)" }}>
                      {fmt(currency === "EUR" ? fee.customsShareEur : fee.customsShareKrw, currency)}
                    </div>

                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.85rem", color: "var(--accent-mint)", fontWeight: 600 }}>
                      {fmt(totalShare, currency)}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textAlign: "right" }}>{fee.totalPoints}pt · {pct.toFixed(0)}%</div>
                  </div>
                );
              })}
              {box.joinerFees.length === 0 && <div className="text-muted text-sm">No joiners — edit box to add orders</div>}
            </div>

            {/* Totals row */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "1.5rem", marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border)", alignItems: "center" }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase" }}>EMS Total</div>
                <div style={{ fontFamily: "'DM Mono', monospace", color: "var(--accent-lavender)", fontWeight: 700 }}>{fmt(currency === "EUR" ? box.emsCostEur : box.emsCostKrw, currency)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Customs Total</div>
                <div style={{ fontFamily: "'DM Mono', monospace", color: "var(--accent-gold)", fontWeight: 700 }}>{fmt(currency === "EUR" ? box.customsCostEur : box.customsCostKrw, currency)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Grand Total</div>
                <div style={{ fontFamily: "'DM Mono', monospace", color: "var(--accent-mint)", fontWeight: 700, fontSize: "1rem" }}>
                  {fmt(currency === "EUR" ? box.emsCostEur + box.customsCostEur : box.emsCostKrw + box.customsCostKrw, currency)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function emptyBox(): Box {
  return { id: generateId("bx"), name: "", shopOrderIds: [], emsCostEur: 0, emsCostKrw: 0, customsCostEur: 0, customsCostKrw: 0, exchangeRate: 1480, joinerFees: [] };
}

export default function GomBoxesPage() {
  const { boxes } = useApp();
  const [modal, setModal] = useState(false);

  const totalEms = boxes.reduce((s, b) => s + b.emsCostEur, 0);
  const totalCustoms = boxes.reduce((s, b) => s + b.customsCostEur, 0);

  return (
    <div className="fade-in">
      {modal && <BoxModal initial={emptyBox()} isNew={true} onClose={() => setModal(false)} />}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 style={{ fontSize: "1.8rem" }}>Boxes</h1>
          <p className="text-secondary text-sm mt-1">
            {boxes.length} box{boxes.length !== 1 ? "es" : ""} · EMS €{totalEms.toFixed(2)} · Customs €{totalCustoms.toFixed(2)}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>+ New Box</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {boxes.map((b) => <BoxCard key={b.id} box={b} />)}
        {boxes.length === 0 && <div className="card" style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>No boxes yet ✦</div>}
      </div>
    </div>
  );
}
