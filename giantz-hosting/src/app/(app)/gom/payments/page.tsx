"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { formatCurrency, formatDateTime, generateId } from "@/lib/utils";
import { PaymentRecord, PaymentRecipientType, PaymentMethod } from "@/types";
import Modal, { FormRow, FormField, FormActions } from "@/components/shared/Modal";

const RECIPIENT_COLORS: Record<string, string> = {
  kaddy: "var(--accent-blossom)", shop: "var(--accent-lavender)",
  proxy: "var(--accent-gold)", seller: "var(--accent-mint)",
};
const RECIPIENT_ICONS: Record<string, string> = {
  kaddy: "🏠", shop: "🛍️", proxy: "🔄", seller: "👤",
};

function emptyPayment(): PaymentRecord {
  return {
    id: generateId("pay"), recipientType: "shop", recipientName: "",
    amountSentSenderCurrency: 0, senderCurrency: "EUR",
    amountSentReceiverCurrency: 0, receiverCurrency: "KRW",
    paymentMethod: "wise", paidAt: new Date().toISOString(),
  };
}

function PaymentModal({ initial, isNew, onClose }: { initial: PaymentRecord; isNew: boolean; onClose: () => void }) {
  const { addPayment, updatePayment, shopOrders } = useApp();
  const [form, setForm] = useState<PaymentRecord>({ ...initial });
  const [hasCovering, setHasCovering] = useState(!!initial.coveringLog);
  const [covering, setCovering] = useState(initial.coveringLog ?? { amountToSend: 0, amountClaimed: 0, coverOrExcess: 0 });

  const set = (f: keyof PaymentRecord, v: unknown) => setForm((p) => ({ ...p, [f]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const final: PaymentRecord = {
      ...form,
      paidAt: form.paidAt ? new Date(form.paidAt).toISOString() : new Date().toISOString(),
      coveringLog: hasCovering ? {
        ...covering,
        coverOrExcess: covering.amountClaimed - covering.amountToSend,
      } : undefined,
      shopOrderId: form.shopOrderId || undefined,
    };
    isNew ? addPayment(final) : updatePayment(final.id, final);
    onClose();
  };

  return (
    <Modal title={isNew ? "Log Payment" : `Edit Payment — ${initial.recipientName}`} onClose={onClose}>
      <form onSubmit={submit}>
        <FormRow cols={2}>
          <FormField label="Recipient Type">
            <select value={form.recipientType} onChange={(e) => set("recipientType", e.target.value as PaymentRecipientType)}>
              <option value="shop">🛍️ Shop</option>
              <option value="kaddy">🏠 Kaddy</option>
              <option value="proxy">🔄 Proxy</option>
              <option value="seller">👤 Seller</option>
            </select>
          </FormField>
          <FormField label="Recipient Name">
            <input required value={form.recipientName} onChange={(e) => set("recipientName", e.target.value)} placeholder="e.g. Weverse Shop" />
          </FormField>
        </FormRow>
        <FormRow cols={2}>
          <FormField label="Amount Sent">
            <input type="number" min={0} step={0.01} required value={form.amountSentSenderCurrency} onChange={(e) => set("amountSentSenderCurrency", Number(e.target.value))} />
          </FormField>
          <FormField label="Sender Currency">
            <input value={form.senderCurrency} onChange={(e) => set("senderCurrency", e.target.value.toUpperCase())} placeholder="EUR" maxLength={3} />
          </FormField>
        </FormRow>
        <FormRow cols={2}>
          <FormField label="Amount Received">
            <input type="number" min={0} step={1} value={form.amountSentReceiverCurrency} onChange={(e) => set("amountSentReceiverCurrency", Number(e.target.value))} />
          </FormField>
          <FormField label="Receiver Currency">
            <input value={form.receiverCurrency} onChange={(e) => set("receiverCurrency", e.target.value.toUpperCase())} placeholder="KRW" maxLength={3} />
          </FormField>
        </FormRow>
        <FormRow cols={2}>
          <FormField label="Payment Method">
            <select value={form.paymentMethod} onChange={(e) => set("paymentMethod", e.target.value as PaymentMethod)}>
              <option value="wise">Wise</option>
              <option value="paypal">PayPal</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="other">Other</option>
            </select>
          </FormField>
          <FormField label="Date">
            <input type="date" value={form.paidAt?.slice(0, 10) ?? ""} onChange={(e) => set("paidAt", e.target.value)} />
          </FormField>
        </FormRow>
        <FormField label="Linked Order (optional)">
          <select value={form.shopOrderId ?? ""} onChange={(e) => set("shopOrderId", e.target.value)}>
            <option value="">— None —</option>
            {shopOrders.map((o) => <option key={o.id} value={o.id}>{o.group} — {o.shop}</option>)}
          </select>
        </FormField>

        {/* Covering log toggle */}
        <div style={{ marginTop: "1rem" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", textTransform: "none", letterSpacing: 0, fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            <input type="checkbox" checked={hasCovering} onChange={(e) => setHasCovering(e.target.checked)} style={{ width: "auto" }} />
            Include covering log
          </label>
        </div>

        {hasCovering && (
          <div style={{ marginTop: "0.75rem", background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)", padding: "0.75rem" }}>
            <FormRow cols={2}>
              <FormField label="Amount to Send">
                <input type="number" min={0} value={covering.amountToSend} onChange={(e) => setCovering((p) => ({ ...p, amountToSend: Number(e.target.value) }))} />
              </FormField>
              <FormField label="Amount Claimed">
                <input type="number" min={0} value={covering.amountClaimed} onChange={(e) => setCovering((p) => ({ ...p, amountClaimed: Number(e.target.value) }))} />
              </FormField>
            </FormRow>
            <div className="text-sm" style={{ color: covering.amountClaimed - covering.amountToSend >= 0 ? "var(--accent-mint)" : "var(--status-unpaid)" }}>
              {covering.amountClaimed - covering.amountToSend >= 0 ? "Excess" : "Cover"}: {Math.abs(covering.amountClaimed - covering.amountToSend).toLocaleString()} {form.receiverCurrency}
            </div>
          </div>
        )}

        <FormActions onClose={onClose} submitLabel={isNew ? "Log Payment" : "Save Changes"} />
      </form>
    </Modal>
  );
}

export default function GomPaymentsPage() {
  const { payments, deletePayment } = useApp();
  const [filterType, setFilterType] = useState<PaymentRecipientType | "all">("all");
  const [modal, setModal] = useState<{ payment: PaymentRecord; isNew: boolean } | null>(null);

  const filtered = payments.filter((p) => filterType === "all" || p.recipientType === filterType);
  const totalBySenderCurrency = filtered.reduce((acc, p) => {
    acc[p.senderCurrency] = (acc[p.senderCurrency] ?? 0) + p.amountSentSenderCurrency;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="fade-in">
      {modal && <PaymentModal initial={modal.payment} isNew={modal.isNew} onClose={() => setModal(null)} />}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 style={{ fontSize: "1.8rem" }}>Payment Tracker</h1>
          <p className="text-secondary text-sm mt-1">{filtered.length} payments recorded</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({ payment: emptyPayment(), isNew: true })}>+ Log Payment</button>
      </div>

      {/* Summary filter cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {(["kaddy", "shop", "proxy", "seller"] as const).map((type) => {
          const count = payments.filter((p) => p.recipientType === type).length;
          const color = RECIPIENT_COLORS[type];
          return (
            <div key={type} className="card" style={{ cursor: "pointer", borderColor: filterType === type ? color : undefined, padding: "1rem" }}
              onClick={() => setFilterType(filterType === type ? "all" : type)}>
              <div style={{ fontSize: "1.25rem", marginBottom: 4 }}>{RECIPIENT_ICONS[type]}</div>
              <div style={{ fontWeight: 600, textTransform: "capitalize", color }}>{type}</div>
              <div className="text-muted text-xs">{count} payment{count !== 1 ? "s" : ""}</div>
            </div>
          );
        })}
      </div>

      <div className="card mb-6">
        <div className="text-xs text-muted mb-3" style={{ letterSpacing: "0.06em", textTransform: "uppercase" }}>Total Sent (filtered)</div>
        <div className="flex gap-6">
          {Object.entries(totalBySenderCurrency).map(([currency, amount]) => (
            <div key={currency}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "1.2rem", color: "var(--accent-gold)" }}>{formatCurrency(amount, currency)}</span>
              <span className="text-muted text-xs" style={{ marginLeft: 6 }}>{currency}</span>
            </div>
          ))}
          {Object.keys(totalBySenderCurrency).length === 0 && <span className="text-muted text-sm">No payments</span>}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {filtered.map((p) => {
          const color = RECIPIENT_COLORS[p.recipientType];
          return (
            <div key={p.id} className="card" style={{ borderLeft: `3px solid ${color}` }}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: "1.25rem" }}>{RECIPIENT_ICONS[p.recipientType]}</span>
                  <div>
                    <div style={{ fontWeight: 600 }}>{p.recipientName}</div>
                    <div className="text-muted text-xs">{formatDateTime(p.paidAt)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "'DM Mono', monospace", color: "var(--accent-gold)", fontSize: "0.95rem" }}>{formatCurrency(p.amountSentSenderCurrency, p.senderCurrency)}</div>
                    <div className="text-muted text-xs">→ {formatCurrency(p.amountSentReceiverCurrency, p.receiverCurrency)}</div>
                  </div>
                  <span className="badge badge-muted">{p.paymentMethod.replace("_", " ")}</span>
                  {p.shopOrderId && <span className="badge badge-purple">{p.shopOrderId}</span>}
                  <button className="btn btn-ghost" style={{ fontSize: "0.78rem", padding: "4px 10px" }} onClick={() => setModal({ payment: p, isNew: false })}>Edit</button>
                  <button className="btn" style={{ fontSize: "0.78rem", padding: "4px 10px", color: "var(--status-unpaid)", borderColor: "#f4758a40", background: "transparent" }}
                    onClick={() => { if (confirm("Delete this payment?")) deletePayment(p.id); }}>Delete</button>
                </div>
              </div>
              {p.coveringLog && (
                <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border)", display: "flex", gap: "2rem" }}>
                  <div><div className="text-xs text-muted mb-1">TO SEND</div><div className="mono text-sm">{formatCurrency(p.coveringLog.amountToSend, p.receiverCurrency)}</div></div>
                  <div><div className="text-xs text-muted mb-1">CLAIMED</div><div className="mono text-sm">{formatCurrency(p.coveringLog.amountClaimed, p.receiverCurrency)}</div></div>
                  <div>
                    <div className="text-xs text-muted mb-1">{p.coveringLog.coverOrExcess >= 0 ? "EXCESS" : "COVER"}</div>
                    <div className="mono text-sm" style={{ color: p.coveringLog.coverOrExcess >= 0 ? "var(--accent-mint)" : "var(--status-unpaid)" }}>
                      {p.coveringLog.coverOrExcess >= 0 ? "+" : ""}{formatCurrency(p.coveringLog.coverOrExcess, p.receiverCurrency)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && <div className="card" style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>No payments recorded ✦</div>}
      </div>
    </div>
  );
}
