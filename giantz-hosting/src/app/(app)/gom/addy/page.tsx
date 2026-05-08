"use client";

import { useState, useRef } from "react";
import { useApp } from "@/context/AppContext";
import { formatDate, generateId } from "@/lib/utils";
import { AddyItem, AddyCountry, AddyAddresses } from "@/types";
import Modal, { FormRow, FormField, FormActions } from "@/components/shared/Modal";

const COUNTRY_LABELS: Record<AddyCountry, string> = {
  korea: "🇰🇷 K-Addy", china: "🇨🇳 C-Addy", japan: "🇯🇵 J-Addy", other: "🌐 Other",
};
const COUNTRY_COLORS: Record<AddyCountry, string> = {
  korea: "var(--accent-blossom)", china: "var(--accent-gold)",
  japan: "var(--accent-mint)", other: "var(--accent-lavender)",
};

function emptyAddy(): AddyItem {
  return { id: generateId("ad"), country: "korea", arrivedItems: "", arrivedAt: new Date().toISOString().slice(0, 10) };
}

// ── Arrival log modal ─────────────────────────────────────────────────────────
function AddyModal({ initial, isNew, onClose }: { initial: AddyItem; isNew: boolean; onClose: () => void }) {
  const { addAddyItem, updateAddyItem, users, shopOrders, updateShopOrder } = useApp();
  const joiners = users.filter((u) => u.role === "joiner");
  const [form, setForm] = useState<AddyItem>({ ...initial });
  const [picturePreview, setPicturePreview] = useState<string | null>(initial.pictureUrl ?? null);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (f: keyof AddyItem, v: unknown) => setForm((p) => ({ ...p, [f]: v }));

  const handleOrderSelect = (orderId: string) => {
    set("shopOrderId", orderId);
    if (!orderId) return;
    const order = shopOrders.find((o) => o.id === orderId);
    if (order && order.joiners.length === 1) set("joinerId", order.joiners[0].joinerId);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setPicturePreview(dataUrl);
      set("pictureUrl", dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const final: AddyItem = {
      ...form,
      arrivedAt: new Date(form.arrivedAt).toISOString(),
      joinerId: form.joinerId || undefined,
      shopOrderId: form.shopOrderId || undefined,
      pictureUrl: form.pictureUrl || undefined,
    };
    if (isNew) {
      addAddyItem(final);
      if (final.shopOrderId) updateShopOrder(final.shopOrderId, { fulfillmentStatus: "received_at_kaddy" });
    } else {
      updateAddyItem(final.id, final);
      if (final.shopOrderId && final.shopOrderId !== initial.shopOrderId)
        updateShopOrder(final.shopOrderId, { fulfillmentStatus: "received_at_kaddy" });
    }
    onClose();
  };

  return (
    <Modal title={isNew ? "Log Arrival" : "Edit Arrival"} onClose={onClose} width={520}>
      <form onSubmit={submit}>
        <FormRow cols={2}>
          <FormField label="Country / Addy">
            <select value={form.country} onChange={(e) => set("country", e.target.value as AddyCountry)}>
              <option value="korea">🇰🇷 K-Addy (Korea)</option>
              <option value="china">🇨🇳 C-Addy (China)</option>
              <option value="japan">🇯🇵 J-Addy (Japan)</option>
              <option value="other">🌐 Other</option>
            </select>
          </FormField>
          <FormField label="Arrived At">
            <input type="date" value={form.arrivedAt?.slice(0, 10) ?? ""} onChange={(e) => set("arrivedAt", e.target.value)} />
          </FormField>
        </FormRow>

        <FormField label="Linked Order (auto-fills joiner if single)">
          <select value={form.shopOrderId ?? ""} onChange={(e) => handleOrderSelect(e.target.value)}>
            <option value="">— None —</option>
            {shopOrders.map((o) => (
              <option key={o.id} value={o.id}>{o.group} — {o.shop}{o.round ? ` · ${o.round}` : ""}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Joiner">
          <select value={form.joinerId ?? ""} onChange={(e) => set("joinerId", e.target.value)}>
            <option value="">— Personal / unknown —</option>
            {joiners.map((j) => <option key={j.id} value={j.id}>{j.name}</option>)}
          </select>
        </FormField>

        <FormField label="Arrived Items">
          <textarea rows={2} required value={form.arrivedItems}
            onChange={(e) => set("arrivedItems", e.target.value)}
            placeholder="e.g. SEVENTEEN Photocard Set ×2, Photobook ×1" style={{ resize: "vertical" }} />
        </FormField>

        <FormField label="Arrival Picture">
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
            <button type="button" className="btn btn-ghost" style={{ fontSize: "0.82rem" }} onClick={() => fileRef.current?.click()}>
              📷 {picturePreview ? "Change Photo" : "Upload Photo"}
            </button>
            {picturePreview && (
              <div style={{ position: "relative" }}>
                <img src={picturePreview} alt="Arrival" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }} />
                <button type="button" onClick={() => { setPicturePreview(null); set("pictureUrl", undefined); }}
                  style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%", background: "var(--status-unpaid)", border: "none", color: "#fff", cursor: "pointer", fontSize: "0.65rem", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
              </div>
            )}
          </div>
          {isNew && form.shopOrderId && (
            <div style={{ fontSize: "0.75rem", color: "var(--accent-mint)", marginTop: 6 }}>
              ✓ Will auto-set linked order to "Received at Kaddy"
            </div>
          )}
        </FormField>

        <FormActions onClose={onClose} submitLabel={isNew ? "Log Arrival" : "Save Changes"} />
      </form>
    </Modal>
  );
}

// ── Editable address card ─────────────────────────────────────────────────────
function AddressCard({
  country, label, color, count, isSelected,
  address, onAddressChange, onClick,
}: {
  country: AddyCountry | "all"; label: string; color: string; count: number; isSelected: boolean;
  address?: string; onAddressChange?: (v: string) => void; onClick: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(address ?? "");

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (address) { navigator.clipboard.writeText(address); }
  };

  const saveAddress = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddressChange?.(draft);
    setEditing(false);
  };

  const flag = label.split(" ")[0];
  const name = label.split(" ").slice(1).join(" ");

  if (country === "all") {
    return (
      <div className="card" style={{ cursor: "pointer", borderColor: isSelected ? "var(--accent-blossom)" : undefined, padding: "0.875rem", textAlign: "center" }} onClick={onClick}>
        <div style={{ fontSize: "1.5rem" }}>🌏</div>
        <div style={{ fontWeight: 600, fontSize: "0.875rem", marginTop: 4 }}>All</div>
        <div className="text-muted text-xs">{count} items</div>
      </div>
    );
  }

  return (
    <div className="card" style={{ cursor: "pointer", borderColor: isSelected ? color : undefined, padding: "0.875rem" }} onClick={onClick}>
      <div style={{ textAlign: "center", marginBottom: address ? "0.625rem" : 0 }}>
        <div style={{ fontSize: "1.5rem" }}>{flag}</div>
        <div style={{ fontWeight: 600, fontSize: "0.875rem", marginTop: 4, color }}>{name}</div>
        <div className="text-muted text-xs">{count} items</div>
      </div>

      {/* Address section */}
      <div onClick={(e) => e.stopPropagation()}>
        {editing ? (
          <div style={{ marginTop: "0.5rem" }}>
            <textarea rows={3} value={draft} onChange={(e) => setDraft(e.target.value)}
              style={{ fontSize: "0.72rem", resize: "vertical", width: "100%" }}
              placeholder="Enter address…" autoFocus />
            <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
              <button className="btn btn-primary" style={{ fontSize: "0.7rem", padding: "3px 8px" }} onClick={saveAddress}>Save</button>
              <button className="btn btn-ghost" style={{ fontSize: "0.7rem", padding: "3px 8px" }} onClick={(e) => { e.stopPropagation(); setEditing(false); setDraft(address ?? ""); }}>Cancel</button>
            </div>
          </div>
        ) : address ? (
          <div style={{ marginTop: "0.5rem", borderTop: "1px solid var(--border-subtle)", paddingTop: "0.5rem" }}>
            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
              <span>ADDRESS</span>
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={handleCopy} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.65rem", color: "var(--text-muted)", padding: 0 }} title="Copy">📋</button>
                <button onClick={(e) => { e.stopPropagation(); setDraft(address); setEditing(true); }}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.65rem", color: "var(--text-muted)", padding: 0 }} title="Edit">✏️</button>
              </div>
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1.4, cursor: "copy" }} onClick={handleCopy} title="Click to copy">
              {address}
            </div>
          </div>
        ) : (
          <button onClick={(e) => { e.stopPropagation(); setDraft(""); setEditing(true); }}
            style={{ marginTop: "0.5rem", width: "100%", background: "none", border: "1px dashed var(--border)", borderRadius: "var(--radius-sm)", cursor: "pointer", fontSize: "0.7rem", color: "var(--text-muted)", padding: "4px 0" }}>
            + Add address
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function GomAddyPage() {
  const { addyItems, deleteAddyItem, users, addyAddresses, setAddyAddresses } = useApp();
  const [filterCountry, setFilterCountry] = useState<AddyCountry | "all">("all");
  const [modal, setModal] = useState<{ item: AddyItem; isNew: boolean } | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const joiners = users.filter((u) => u.role === "joiner");
  const filtered = addyItems.filter((a) => filterCountry === "all" || a.country === filterCountry);
  const countByCountry = addyItems.reduce((acc, a) => { acc[a.country] = (acc[a.country] ?? 0) + 1; return acc; }, {} as Record<string, number>);
  const joinerName = (id?: string) => joiners.find((j) => j.id === id)?.name;

  const updateAddress = (country: AddyCountry, value: string) =>
    setAddyAddresses({ ...addyAddresses, [country]: value });

  return (
    <div className="fade-in">
      {modal && <AddyModal initial={modal.item} isNew={modal.isNew} onClose={() => setModal(null)} />}

      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out" }}>
          <img src={lightbox} alt="Arrival" style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: "var(--radius-md)", boxShadow: "0 24px 80px rgba(0,0,0,0.8)" }} />
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 style={{ fontSize: "1.8rem" }}>K/C/J-Addy Tracker</h1>
          <p className="text-secondary text-sm mt-1">Click an address to copy · ✏️ to edit</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({ item: emptyAddy(), isNew: true })}>+ Log Arrival</button>
      </div>

      {/* Country filter cards with editable addresses */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", marginBottom: "1.5rem", alignItems: "start" }}>
        <AddressCard
          country="all" label="All" color="var(--accent-blossom)"
          count={addyItems.length} isSelected={filterCountry === "all"}
          onClick={() => setFilterCountry("all")} />
        {(["korea", "china", "japan"] as AddyCountry[]).map((country) => (
          <AddressCard key={country}
            country={country}
            label={COUNTRY_LABELS[country]}
            color={COUNTRY_COLORS[country]}
            count={countByCountry[country] ?? 0}
            isSelected={filterCountry === country}
            address={addyAddresses[country] || undefined}
            onAddressChange={(v) => updateAddress(country, v)}
            onClick={() => setFilterCountry(country)} />
        ))}
      </div>

      {/* Arrival items */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {filtered.map((item) => {
          const color = COUNTRY_COLORS[item.country];
          return (
            <div key={item.id} className="card" style={{ borderLeft: `3px solid ${color}` }}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  {item.pictureUrl ? (
                    <img src={item.pictureUrl} alt="Arrival" onClick={() => setLightbox(item.pictureUrl!)}
                      style={{ width: 52, height: 52, objectFit: "cover", borderRadius: "var(--radius-sm)", border: `1px solid ${color}`, cursor: "zoom-in", flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 52, height: 52, borderRadius: "var(--radius-sm)", background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", flexShrink: 0 }}>
                      {COUNTRY_LABELS[item.country].split(" ")[0]}
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{item.arrivedItems}</div>
                    <div className="text-muted text-xs mt-1">
                      Arrived {formatDate(item.arrivedAt)}
                      {item.joinerId && <span style={{ color: "var(--accent-blossom)", marginLeft: 6 }}>· {joinerName(item.joinerId)}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="badge" style={{ background: `${color}20`, color }}>{COUNTRY_LABELS[item.country]}</span>
                  {item.pictureUrl && (
                    <button className="btn btn-ghost" style={{ fontSize: "0.75rem", padding: "3px 8px" }} onClick={() => setLightbox(item.pictureUrl!)}>📷 View</button>
                  )}
                  <button className="btn btn-ghost" style={{ fontSize: "0.78rem", padding: "4px 10px" }} onClick={() => setModal({ item, isNew: false })}>Edit</button>
                  <button className="btn" style={{ fontSize: "0.78rem", padding: "4px 10px", color: "var(--status-unpaid)", borderColor: "#f4758a40", background: "transparent" }}
                    onClick={() => { if (confirm("Delete this arrival entry?")) deleteAddyItem(item.id); }}>Delete</button>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <div className="card" style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>Nothing arrived yet ✦</div>}
      </div>
    </div>
  );
}
