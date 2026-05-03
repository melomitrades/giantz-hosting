"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { formatDateTime, generateId } from "@/lib/utils";
import { Fancall, Shop } from "@/types";
import Modal, { FormRow, FormField, FormActions } from "@/components/shared/Modal";

type Tab = "fancalls" | "shops";

// ── Fancall Modal ─────────────────────────────────────────────────────────────
function emptyFancall(joinerId: string, joinerName: string): Fancall {
  return { id: generateId("fc"), shop: "", dateTime: new Date().toISOString().slice(0, 16), enteredByJoinerId: joinerId, enteredByJoinerName: joinerName, won: false, received: false };
}

function FancallModal({ initial, isNew, onClose }: { initial: Fancall; isNew: boolean; onClose: () => void }) {
  const { addFancall, updateFancall, users, shops, shopOrders } = useApp();
  const joiners = users.filter((u) => u.role === "joiner");
  const shopNames = shops.map((s) => s.name);
  const [form, setForm] = useState<Fancall>({ ...initial });
  const set = (f: keyof Fancall, v: unknown) => setForm((p) => ({ ...p, [f]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const joiner = joiners.find((j) => j.id === form.enteredByJoinerId) ?? joiners[0];
    const final: Fancall = {
      ...form,
      enteredByJoinerName: joiner?.name ?? form.enteredByJoinerName,
      dateTime: new Date(form.dateTime).toISOString(),
      resultPage: form.resultPage || undefined,
      benefitsToKaddy: form.benefitsToKaddy || undefined,
      shopOrderId: form.shopOrderId || undefined,
    };
    isNew ? addFancall(final) : updateFancall(final.id, final);
    onClose();
  };

  // Filter orders by the selected shop
  const linkedOrders = shopOrders.filter((o) => !form.shop || o.shop.toLowerCase() === form.shop.toLowerCase());

  return (
    <Modal title={isNew ? "Log Fancall" : `Edit Fancall — ${initial.shop}`} onClose={onClose}>
      <form onSubmit={submit}>
        <FormRow cols={2}>
          <FormField label="Shop">
            <input list="fc-shop-list" required value={form.shop} onChange={(e) => { set("shop", e.target.value); set("shopOrderId", ""); }}
              placeholder="e.g. Weverse" />
            <datalist id="fc-shop-list">{shopNames.map((n) => <option key={n} value={n} />)}</datalist>
          </FormField>
          <FormField label="Entered By">
            <select value={form.enteredByJoinerId} onChange={(e) => set("enteredByJoinerId", e.target.value)}>
              {joiners.map((j) => <option key={j.id} value={j.id}>{j.name}</option>)}
            </select>
          </FormField>
        </FormRow>
        <FormRow cols={2}>
          <FormField label="Date & Time">
            <input type="datetime-local" value={form.dateTime?.slice(0, 16) ?? ""} onChange={(e) => set("dateTime", e.target.value)} />
          </FormField>
          <FormField label="Result Page URL">
            <input value={form.resultPage ?? ""} onChange={(e) => set("resultPage", e.target.value)} placeholder="https://..." />
          </FormField>
        </FormRow>
        <FormField label="Linked Order (optional)">
          <select value={form.shopOrderId ?? ""} onChange={(e) => set("shopOrderId", e.target.value)}>
            <option value="">— None —</option>
            {linkedOrders.map((o) => <option key={o.id} value={o.id}>{o.group} — {o.shop}{o.round ? ` · ${o.round}` : ""}</option>)}
          </select>
        </FormField>
        <FormField label="Benefits to Kaddy">
          <input value={form.benefitsToKaddy ?? ""} onChange={(e) => set("benefitsToKaddy", e.target.value)} placeholder="e.g. Extra photocard set" />
        </FormField>
        <div style={{ display: "flex", gap: "2rem", marginTop: "0.875rem" }}>
          {(["won", "received"] as const).map((field) => (
            <label key={field} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", textTransform: "none", letterSpacing: 0, fontSize: "0.875rem", color: "var(--text-secondary)" }}>
              <input type="checkbox" checked={form[field]} onChange={(e) => set(field, e.target.checked)} style={{ width: "auto" }} />
              {field === "won" ? "Won 🏆" : "Received ✓"}
            </label>
          ))}
        </div>
        <FormActions onClose={onClose} submitLabel={isNew ? "Log Fancall" : "Save Changes"} />
      </form>
    </Modal>
  );
}

// ── Shop Modal ────────────────────────────────────────────────────────────────
function emptyShop(): Shop {
  return { id: generateId("sh"), name: "", acceptsEnglishWebsiteShippingToKorea: false, acceptsIdOrPassport: false };
}

function ShopModal({ initial, isNew, onClose }: { initial: Shop; isNew: boolean; onClose: () => void }) {
  const { addShop, updateShop } = useApp();
  const [form, setForm] = useState<Shop>({ ...initial });
  const set = (f: keyof Shop, v: unknown) => setForm((p) => ({ ...p, [f]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const final: Shop = { ...form, url: form.url || undefined, notes: form.notes || undefined };
    isNew ? addShop(final) : updateShop(final.id, final);
    onClose();
  };

  return (
    <Modal title={isNew ? "Add Shop" : `Edit — ${initial.name}`} onClose={onClose}>
      <form onSubmit={submit}>
        <FormRow cols={2}>
          <FormField label="Shop Name">
            <input required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Weverse Shop" />
          </FormField>
          <FormField label="URL">
            <input value={form.url ?? ""} onChange={(e) => set("url", e.target.value)} placeholder="https://..." />
          </FormField>
        </FormRow>
        <FormField label="Notes">
          <textarea rows={2} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} placeholder="Any notes about this shop" style={{ resize: "vertical" }} />
        </FormField>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: "0.75rem" }}>
          {(["acceptsEnglishWebsiteShippingToKorea", "acceptsIdOrPassport"] as const).map((field) => (
            <label key={field} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", textTransform: "none", letterSpacing: 0, fontSize: "0.875rem", color: "var(--text-secondary)" }}>
              <input type="checkbox" checked={form[field]} onChange={(e) => set(field, e.target.checked)} style={{ width: "auto" }} />
              {field === "acceptsEnglishWebsiteShippingToKorea" ? "Accepts payments on English website shipped to Korea" : "Accepts ID or Passport"}
            </label>
          ))}
        </div>
        <FormActions onClose={onClose} submitLabel={isNew ? "Add Shop" : "Save Changes"} />
      </form>
    </Modal>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function GomFancallsPage() {
  const { fancalls, shops, deleteFancall, deleteShop, users, shopOrders } = useApp();
  const [tab, setTab] = useState<Tab>("fancalls");
  const [fancallModal, setFancallModal] = useState<{ fc: Fancall; isNew: boolean } | null>(null);
  const [shopModal, setShopModal] = useState<{ shop: Shop; isNew: boolean } | null>(null);
  const defaultJoiner = users.find((u) => u.role === "joiner");

  const getLinkedOrderLabel = (id?: string) => {
    if (!id) return null;
    const o = shopOrders.find((o) => o.id === id);
    return o ? `${o.group} — ${o.shop}${o.round ? ` · ${o.round}` : ""}` : id;
  };

  return (
    <div className="fade-in">
      {fancallModal && <FancallModal initial={fancallModal.fc} isNew={fancallModal.isNew} onClose={() => setFancallModal(null)} />}
      {shopModal && <ShopModal initial={shopModal.shop} isNew={shopModal.isNew} onClose={() => setShopModal(null)} />}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 style={{ fontSize: "1.8rem" }}>Fancalls / Shops</h1>
          <p className="text-secondary text-sm mt-1">Track fancall entries and shop info</p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          if (tab === "fancalls" && defaultJoiner) setFancallModal({ fc: emptyFancall(defaultJoiner.id, defaultJoiner.name), isNew: true });
          else setShopModal({ shop: emptyShop(), isNew: true });
        }}>
          {tab === "fancalls" ? "+ Log Fancall" : "+ Add Shop"}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: "1.5rem", background: "var(--bg-elevated)", borderRadius: "var(--radius-md)", padding: 4, width: "fit-content" }}>
        {(["fancalls", "shops"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: "6px 20px", borderRadius: "var(--radius-sm)", border: "none", cursor: "pointer", fontSize: "0.875rem", fontWeight: 500, transition: "all 0.15s",
              background: tab === t ? "var(--accent-blossom)" : "transparent", color: tab === t ? "#0d0f14" : "var(--text-muted)" }}>
            {t === "fancalls" ? "🎤 Fancalls" : "🛍️ Shops"}
          </button>
        ))}
      </div>

      {tab === "fancalls" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {fancalls.map((fc) => (
            <div key={fc.id} className="card">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: fc.won ? "var(--accent-mint-dim)" : "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>
                    {fc.won ? "🏆" : "🎲"}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{fc.shop}</div>
                    <div className="text-secondary text-sm">By {fc.enteredByJoinerName} · {formatDateTime(fc.dateTime)}</div>
                    {fc.shopOrderId && <div style={{ fontSize: "0.72rem", color: "var(--accent-lavender)", marginTop: 2 }}>🔗 {getLinkedOrderLabel(fc.shopOrderId)}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {fc.benefitsToKaddy && <span className="badge badge-gold">🎁 {fc.benefitsToKaddy}</span>}
                  <span className="badge" style={{ background: fc.won ? "var(--accent-mint-dim)" : "var(--bg-elevated)", color: fc.won ? "var(--accent-mint)" : "var(--text-muted)" }}>{fc.won ? "Won" : "Lost"}</span>
                  <span className="badge" style={{ background: fc.received ? "var(--accent-blossom-dim)" : "var(--bg-elevated)", color: fc.received ? "var(--accent-blossom)" : "var(--text-muted)" }}>{fc.received ? "✓ Received" : "Pending"}</span>
                  {fc.resultPage && <a href={fc.resultPage} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ fontSize: "0.78rem", padding: "4px 10px" }}>Results ↗</a>}
                  <button className="btn btn-ghost" style={{ fontSize: "0.78rem", padding: "4px 10px" }} onClick={() => setFancallModal({ fc, isNew: false })}>Edit</button>
                  <button className="btn" style={{ fontSize: "0.78rem", padding: "4px 10px", color: "var(--status-unpaid)", borderColor: "#f4758a40", background: "transparent" }}
                    onClick={() => { if (confirm("Delete this fancall?")) deleteFancall(fc.id); }}>Delete</button>
                </div>
              </div>
            </div>
          ))}
          {fancalls.length === 0 && <div className="card" style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>No fancalls logged yet ✦</div>}
        </div>
      )}

      {tab === "shops" && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table>
            <thead>
              <tr>
                <th>Shop</th><th>Ships to Korea (EN)</th><th>Accepts ID/Passport</th><th>URL</th><th>Notes</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {shops.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600 }}>{s.name}</td>
                  <td><span className="badge" style={{ background: s.acceptsEnglishWebsiteShippingToKorea ? "var(--accent-mint-dim)" : "var(--bg-elevated)", color: s.acceptsEnglishWebsiteShippingToKorea ? "var(--accent-mint)" : "var(--text-muted)" }}>{s.acceptsEnglishWebsiteShippingToKorea ? "✓ Yes" : "✗ No"}</span></td>
                  <td><span className="badge" style={{ background: s.acceptsIdOrPassport ? "var(--accent-lavender-dim)" : "var(--bg-elevated)", color: s.acceptsIdOrPassport ? "var(--accent-lavender)" : "var(--text-muted)" }}>{s.acceptsIdOrPassport ? "✓ Yes" : "✗ No"}</span></td>
                  <td>{s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-blossom)", fontSize: "0.8rem" }}>{s.url.replace("https://", "")} ↗</a> : <span className="text-muted text-sm">—</span>}</td>
                  <td className="text-secondary text-sm">{s.notes ?? "—"}</td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-ghost" style={{ fontSize: "0.75rem", padding: "3px 8px" }} onClick={() => setShopModal({ shop: s, isNew: false })}>Edit</button>
                      <button className="btn" style={{ fontSize: "0.75rem", padding: "3px 8px", color: "var(--status-unpaid)", borderColor: "#f4758a40", background: "transparent" }}
                        onClick={() => { if (confirm(`Delete shop "${s.name}"?`)) deleteShop(s.id); }}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {shops.length === 0 && <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>No shops added yet ✦</div>}
        </div>
      )}
    </div>
  );
}
