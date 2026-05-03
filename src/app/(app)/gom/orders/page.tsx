"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { formatDate, formatEur, generateId } from "@/lib/utils";
import {
  ShopOrder, JoinerEntry, ClaimedItem, MemberClaim, KnownGroup, KnownMember,
  OrderFulfillmentStatus, JoinerPaymentStatus, PricingOption,
} from "@/types";
import Modal, { FormRow, FormField, FormActions } from "@/components/shared/Modal";

// ── Constants ─────────────────────────────────────────────────────────────────
const FULFILLMENT_COLOR: Record<string, string> = {
  ordered: "var(--status-ordered)", received_at_kaddy: "var(--status-kaddy)",
  otw_to_gom: "var(--status-otw)", arrived_to_gom: "var(--status-arrived)",
};
const FULFILLMENT_LABELS: Record<string, string> = {
  ordered: "Ordered", received_at_kaddy: "At Kaddy",
  otw_to_gom: "OTW to GOM", arrived_to_gom: "At GOM",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function emptyPricingOption(weightCategoryId: string): PricingOption {
  return { id: generateId("po"), label: "", priceEur: 0, weightCategoryId };
}

function emptyItem(pricingOptions: PricingOption[]): ClaimedItem {
  const first = pricingOptions[0];
  return {
    id: generateId("ci"),
    name: "",
    quantity: 1,
    membersClaimed: [],
    pricingOptionId: first?.id ?? "custom",
    pricePerUnit: first?.priceEur ?? 0,
    weightCategoryId: first?.weightCategoryId ?? "",
    inclusions: "",
  };
}

function emptyJoiner(joinerId: string, joinerName: string): JoinerEntry {
  return { id: generateId("je"), joinerId, joinerName, items: [], paymentStatus: "unpaid" };
}

function emptyOrder(): ShopOrder {
  return {
    id: generateId("so"), group: "", shop: "",
    dateOfOrder: new Date().toISOString().slice(0, 10),
    fulfillmentStatus: "ordered", pricingOptions: [], joiners: [],
  };
}

// ── Group manager modal ───────────────────────────────────────────────────────
function GroupManagerModal({ initial, isNew, onClose }: { initial: KnownGroup; isNew: boolean; onClose: () => void }) {
  const { addKnownGroup, updateKnownGroup } = useApp();
  const [group, setGroup] = useState<KnownGroup>({ ...initial, members: [...initial.members] });
  const [newName, setNewName] = useState("");

  const addMember = () => {
    if (!newName.trim()) return;
    setGroup((g) => ({ ...g, members: [...g.members, { id: generateId("m"), name: newName.trim() }] }));
    setNewName("");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    isNew ? addKnownGroup(group) : updateKnownGroup(group.id, group);
    onClose();
  };

  return (
    <Modal title={isNew ? "Add Group" : `Edit — ${initial.name}`} onClose={onClose} width={460}>
      <form onSubmit={submit}>
        <FormField label="Group Name">
          <input required value={group.name} onChange={(e) => setGroup((g) => ({ ...g, name: e.target.value }))} placeholder="e.g. SEVENTEEN" />
        </FormField>
        <div style={{ marginTop: "1rem" }}>
          <label style={{ fontSize: "0.72rem", color: "var(--text-muted)", letterSpacing: "0.04em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Members</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8, minHeight: 32 }}>
            {group.members.map((m) => (
              <span key={m.id} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 99, background: "var(--accent-blossom-dim)", color: "var(--accent-blossom)", fontSize: "0.8rem" }}>
                {m.name}
                <button type="button" onClick={() => setGroup((g) => ({ ...g, members: g.members.filter((x) => x.id !== m.id) }))}
                  style={{ background: "none", border: "none", color: "var(--accent-blossom)", cursor: "pointer", fontSize: "0.65rem" }}>✕</button>
              </span>
            ))}
            {group.members.length === 0 && <span className="text-muted text-xs">No members yet</span>}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Member name"
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addMember(); } }} />
            <button type="button" className="btn btn-ghost" style={{ flexShrink: 0 }} onClick={addMember}>+ Add</button>
          </div>
        </div>
        <FormActions onClose={onClose} submitLabel={isNew ? "Create Group" : "Save"} />
      </form>
    </Modal>
  );
}

// ── Pricing options editor ────────────────────────────────────────────────────
function PricingOptionsEditor({ options, onChange }: { options: PricingOption[]; onChange: (o: PricingOption[]) => void }) {
  const { weightCategories } = useApp();
  const defaultWcId = weightCategories.find((w) => w.name.toLowerCase() === "pc")?.id ?? weightCategories[0]?.id ?? "";

  const upd = (id: string, f: keyof PricingOption, v: unknown) =>
    onChange(options.map((o) => o.id === id ? { ...o, [f]: v } : o));

  return (
    <div style={{ marginTop: "0.5rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 100px 1fr 22px", gap: 6, marginBottom: 4 }}>
        {["Option label", "Price (€)", "Weight category", ""].map((h) => (
          <div key={h} style={{ fontSize: "0.63rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</div>
        ))}
      </div>
      {options.map((opt) => (
        <div key={opt.id} style={{ display: "grid", gridTemplateColumns: "2fr 100px 1fr 22px", gap: 6, marginBottom: 5, alignItems: "center" }}>
          <input value={opt.label} onChange={(e) => upd(opt.id, "label", e.target.value)} placeholder='e.g. "POB only"' />
          <input type="number" min={0} step={0.01} value={opt.priceEur} onChange={(e) => upd(opt.id, "priceEur", Number(e.target.value))} />
          <select value={opt.weightCategoryId} onChange={(e) => upd(opt.id, "weightCategoryId", e.target.value)}>
            {weightCategories.map((wc) => <option key={wc.id} value={wc.id}>{wc.name} ({wc.points}pt)</option>)}
          </select>
          <button type="button" onClick={() => onChange(options.filter((o) => o.id !== opt.id))}
            style={{ background: "none", border: "none", color: "var(--status-unpaid)", cursor: "pointer", fontSize: "0.9rem" }}>✕</button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...options, emptyPricingOption(defaultWcId)])}
        style={{ background: "none", border: "none", color: "var(--accent-blossom)", cursor: "pointer", fontSize: "0.78rem", marginTop: 2 }}>
        + Add pricing option
      </button>
      {options.length === 0 && (
        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4 }}>
          No options yet — add at least one before logging items.
        </div>
      )}
    </div>
  );
}

// ── Item row ──────────────────────────────────────────────────────────────────
function ItemRow({ item, pricingOptions, groupMembers, onChange, onRemove }: {
  item: ClaimedItem;
  pricingOptions: PricingOption[];
  groupMembers: KnownMember[];
  onChange: (updated: ClaimedItem) => void;  // whole item, not field-by-field
  onRemove: () => void;
}) {
  const { weightCategories } = useApp();
  const isCustom = item.pricingOptionId === "custom";

  // Pricing option dropdown — update pricingOptionId + price + weightCat atomically
  const handleOptionChange = (optId: string) => {
    if (optId === "custom") {
      onChange({ ...item, pricingOptionId: "custom" });
      return;
    }
    const opt = pricingOptions.find((o) => o.id === optId);
    if (opt) {
      onChange({ ...item, pricingOptionId: optId, pricePerUnit: opt.priceEur, weightCategoryId: opt.weightCategoryId });
    }
  };

  // Toggle a known member — update membersClaimed + quantity atomically
  const toggleMember = (m: KnownMember) => {
    const already = item.membersClaimed.some((mc) => mc.memberId === m.id);
    const next: MemberClaim[] = already
      ? item.membersClaimed.filter((mc) => mc.memberId !== m.id)
      : [...item.membersClaimed, { memberId: m.id, memberName: m.name }];
    onChange({ ...item, membersClaimed: next, quantity: next.length > 0 ? next.length : item.quantity });
  };

  // Add a custom (non-roster) member atomically
  const addCustomMember = () => {
    const name = prompt("Member name:");
    if (!name?.trim()) return;
    const next: MemberClaim[] = [...item.membersClaimed, { memberId: generateId("cm"), memberName: name.trim() }];
    onChange({ ...item, membersClaimed: next, quantity: next.length });
  };

  const removeMember = (memberId: string) => {
    const next = item.membersClaimed.filter((m) => m.memberId !== memberId);
    onChange({ ...item, membersClaimed: next, quantity: next.length > 0 ? next.length : item.quantity });
  };

  return (
    <div style={{ background: "var(--bg)", borderRadius: "var(--radius-sm)", padding: "0.75rem", marginBottom: "0.5rem", border: "1px solid var(--border-subtle)" }}>

      {/* Row 1: Members picker */}
      <div style={{ marginBottom: "0.625rem" }}>
        <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 5 }}>Members for this item</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
          {/* Known member pills */}
          {groupMembers.map((m) => {
            const sel = item.membersClaimed.some((mc) => mc.memberId === m.id);
            return (
              <button key={m.id} type="button" onClick={() => toggleMember(m)}
                style={{
                  padding: "3px 10px", borderRadius: 99, fontSize: "0.75rem", cursor: "pointer",
                  border: "1px solid", transition: "all 0.12s",
                  background: sel ? "var(--accent-blossom)" : "transparent",
                  color: sel ? "#0d0f14" : "var(--text-muted)",
                  borderColor: sel ? "var(--accent-blossom)" : "var(--border)",
                }}>
                {m.name}
              </button>
            );
          })}
          {/* Custom members already added (not from group roster) */}
          {item.membersClaimed
            .filter((mc) => !groupMembers.some((m) => m.id === mc.memberId))
            .map((mc) => (
              <span key={mc.memberId} style={{ display: "flex", alignItems: "center", gap: 3, padding: "3px 10px", borderRadius: 99, fontSize: "0.75rem", background: "var(--accent-blossom)", color: "#0d0f14" }}>
                {mc.memberName}
                <button type="button" onClick={() => removeMember(mc.memberId)}
                  style={{ background: "none", border: "none", color: "#0d0f14", cursor: "pointer", fontSize: "0.65rem", lineHeight: 1 }}>✕</button>
              </span>
            ))}
          <button type="button" onClick={addCustomMember}
            style={{ padding: "3px 10px", borderRadius: 99, fontSize: "0.75rem", cursor: "pointer", border: "1px dashed var(--border)", background: "transparent", color: "var(--text-muted)" }}>
            + {groupMembers.length > 0 ? "Custom" : "Add member"}
          </button>
        </div>
        {/* Member count feedback */}
        {item.membersClaimed.length > 0 && (
          <div style={{ fontSize: "0.68rem", color: "var(--accent-blossom)", marginTop: 4 }}>
            {item.membersClaimed.length} member{item.membersClaimed.length !== 1 ? "s" : ""} → qty auto-set to {item.membersClaimed.length}
          </div>
        )}
      </div>

      {/* Row 2: pricing dropdown + optional description + qty + inclusions + remove */}
      <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 60px 1fr 22px", gap: 6, alignItems: "flex-end" }}>

        {/* Pricing dropdown */}
        <div>
          <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>Pricing option</div>
          <select
            value={item.pricingOptionId}
            onChange={(e) => handleOptionChange(e.target.value)}
            style={{ color: isCustom ? "var(--accent-gold)" : "var(--accent-blossom)" }}>
            {pricingOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.label} — €{opt.priceEur.toFixed(2)}</option>
            ))}
            <option value="custom">Custom price</option>
          </select>
        </div>

        {/* Optional description */}
        <div>
          <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>Description <span style={{ opacity: 0.5 }}>(optional)</span></div>
          <input placeholder="e.g. ver.A, signed…" value={item.name ?? ""} onChange={(e) => onChange({ ...item, name: e.target.value })} />
        </div>

        {/* Quantity — editable but auto-set by member count */}
        <div>
          <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>Qty</div>
          <input type="number" min={1} value={item.quantity}
            onChange={(e) => onChange({ ...item, quantity: Number(e.target.value) })}
            style={{ textAlign: "center" }} />
        </div>

        {/* Inclusions */}
        <div>
          <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>Inclusions</div>
          <input placeholder="e.g. Random PC ×1" value={item.inclusions} onChange={(e) => onChange({ ...item, inclusions: e.target.value })} />
        </div>

        {/* Remove button */}
        <button type="button" onClick={onRemove}
          style={{ background: "none", border: "none", color: "var(--status-unpaid)", cursor: "pointer", fontSize: "0.9rem", paddingBottom: 6 }}>✕</button>
      </div>

      {/* Row 3: Price display + custom price/weight inputs */}
      <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginTop: "0.5rem" }}>
        {isCustom ? (
          <>
            <div style={{ minWidth: 110 }}>
              <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>Custom price (€)</div>
              <input type="number" min={0} step={0.01} value={item.pricePerUnit}
                onChange={(e) => onChange({ ...item, pricePerUnit: Number(e.target.value) })} />
            </div>
            <div style={{ minWidth: 130 }}>
              <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>Weight category</div>
              <select value={item.weightCategoryId} onChange={(e) => onChange({ ...item, weightCategoryId: e.target.value })}>
                {weightCategories.map((wc) => <option key={wc.id} value={wc.id}>{wc.name} ({wc.points}pt)</option>)}
              </select>
            </div>
          </>
        ) : (
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
              <span style={{ color: "var(--accent-gold)", fontFamily: "'DM Mono', monospace" }}>€{item.pricePerUnit.toFixed(2)}</span>
              {" "}/ unit
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
              Weight: <span style={{ color: "var(--text-secondary)" }}>
                {weightCategories.find((w) => w.id === item.weightCategoryId)?.name ?? "?"} ({weightCategories.find((w) => w.id === item.weightCategoryId)?.points ?? "?"}pt)
              </span>
            </div>
          </div>
        )}
        {/* Line total */}
        <div style={{ marginLeft: "auto", fontFamily: "'DM Mono', monospace", color: "var(--accent-mint)", fontSize: "0.875rem", fontWeight: 600 }}>
          = €{(item.pricePerUnit * item.quantity).toFixed(2)}
        </div>
      </div>
    </div>
  );
}

// ── Joiner section ────────────────────────────────────────────────────────────
function JoinerSection({ entry, pricingOptions, groupName, onChange, onRemove }: {
  entry: JoinerEntry;
  pricingOptions: PricingOption[];
  groupName: string;
  onChange: (u: JoinerEntry) => void;
  onRemove: () => void;
}) {
  const { users, knownGroups } = useApp();
  const joiners = users.filter((u) => u.role === "joiner");
  const groupMembers = knownGroups.find((g) => g.name.toLowerCase() === groupName.toLowerCase())?.members ?? [];

  const updateItem = (idx: number, updated: ClaimedItem) =>
    onChange({ ...entry, items: entry.items.map((it, i) => i === idx ? updated : it) });

  const addItem = () => onChange({ ...entry, items: [...entry.items, emptyItem(pricingOptions)] });
  const removeItem = (idx: number) => onChange({ ...entry, items: entry.items.filter((_, i) => i !== idx) });

  return (
    <div style={{ background: "var(--bg-elevated)", borderRadius: "var(--radius-md)", padding: "0.875rem", marginBottom: "0.625rem", border: "1px solid var(--border)" }}>
      {/* Joiner meta row */}
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "0.875rem" }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Joiner</label>
          <select value={entry.joinerId} style={{ marginTop: 2 }}
            onChange={(e) => { const j = joiners.find((j) => j.id === e.target.value); if (j) onChange({ ...entry, joinerId: j.id, joinerName: j.name }); }}>
            {joiners.map((j) => <option key={j.id} value={j.id}>{j.name}</option>)}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Payment</label>
          <select value={entry.paymentStatus} style={{ marginTop: 2 }}
            onChange={(e) => onChange({ ...entry, paymentStatus: e.target.value as JoinerPaymentStatus })}>
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Deadline</label>
          <input type="date" style={{ marginTop: 2 }} value={entry.deadline?.slice(0, 10) ?? ""}
            onChange={(e) => onChange({ ...entry, deadline: e.target.value || undefined })} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Proof URL</label>
          <input style={{ marginTop: 2 }} value={entry.paymentProofUrl ?? ""} placeholder="https://..."
            onChange={(e) => onChange({ ...entry, paymentProofUrl: e.target.value || undefined })} />
        </div>
        <button type="button" onClick={onRemove}
          style={{ background: "none", border: "none", color: "var(--status-unpaid)", cursor: "pointer", fontSize: "1.1rem", flexShrink: 0 }}>✕</button>
      </div>

      {/* Items */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <label style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Items — {entry.items.length} line{entry.items.length !== 1 ? "s" : ""}
          </label>
          <button type="button" onClick={addItem}
            style={{ background: "none", border: "none", color: "var(--accent-blossom)", cursor: "pointer", fontSize: "0.75rem" }}>
            + Add item
          </button>
        </div>

        {pricingOptions.length === 0 && (
          <div style={{ fontSize: "0.75rem", color: "var(--accent-gold)", padding: "6px 0" }}>
            ⚠️ Define pricing options at the top before adding items
          </div>
        )}

        {entry.items.map((item, idx) => (
          <ItemRow key={item.id} item={item} pricingOptions={pricingOptions} groupMembers={groupMembers}
            onChange={(updated) => updateItem(idx, updated)}
            onRemove={() => removeItem(idx)} />
        ))}

        {entry.items.length === 0 && pricingOptions.length > 0 && (
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", padding: "6px 0" }}>No items yet</div>
        )}
      </div>
    </div>
  );
}

// ── Shop Order Modal ──────────────────────────────────────────────────────────
function ShopOrderModal({ initial, isNew, onClose }: { initial: ShopOrder; isNew: boolean; onClose: () => void }) {
  const { addShopOrder, updateShopOrder, users, knownGroups, shops, addFancall } = useApp();
  const joiners = users.filter((u) => u.role === "joiner");
  const [form, setForm] = useState<ShopOrder>({
    ...initial,
    pricingOptions: initial.pricingOptions.map((p) => ({ ...p })),
    joiners: initial.joiners.map((j) => ({
      ...j,
      items: j.items.map((it) => ({ ...it, membersClaimed: [...it.membersClaimed] })),
    })),
  });
  const [groupModal, setGroupModal] = useState<{ group: KnownGroup; isNew: boolean } | null>(null);
  const setField = (f: keyof ShopOrder, v: unknown) => setForm((p) => ({ ...p, [f]: v }));
  const matchedGroup = knownGroups.find((g) => g.name.toLowerCase() === form.group.toLowerCase());

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const final: ShopOrder = {
      ...form,
      dateOfOrder: new Date(form.dateOfOrder || Date.now()).toISOString(),
      shopDeadline: form.shopDeadline ? new Date(form.shopDeadline).toISOString() : undefined,
      notes: form.notes || undefined,
      round: form.round || undefined,
      joiners: form.joiners.map((j) => ({
        ...j,
        deadline: j.deadline ? new Date(j.deadline).toISOString() : undefined,
        paymentProofUrl: j.paymentProofUrl || undefined,
      })),
    };
    isNew ? addShopOrder(final) : updateShopOrder(final.id, final);

    // Auto-create fancall if flagged
    if (form.isFancall && isNew) {
      const defaultJoiner = joiners[0];
      addFancall({
        id: generateId("fc"),
        shop: form.shop,
        dateTime: final.dateOfOrder,
        enteredByJoinerId: defaultJoiner?.id ?? "",
        enteredByJoinerName: defaultJoiner?.name ?? "",
        won: false, received: false,
        shopOrderId: final.id,
        benefitsToKaddy: undefined,
        resultPage: undefined,
      });
    }
    onClose();
  };

  return (
    <Modal title={isNew ? "New Shop Order" : `Edit — ${initial.group} · ${initial.shop}`} onClose={onClose} width={820}>
      {groupModal && (
        <GroupManagerModal initial={groupModal.group} isNew={groupModal.isNew} onClose={() => setGroupModal(null)} />
      )}
      <form onSubmit={submit}>
        {/* Shop-level fields */}
        <FormRow cols={2}>
          <FormField label="Group">
            <div style={{ display: "flex", gap: 6 }}>
              <select style={{ flex: 1 }} value={form.group} onChange={(e) => setField("group", e.target.value)} required>
                <option value="">— Select group —</option>
                {knownGroups.map((g) => <option key={g.id} value={g.name}>{g.name}</option>)}
              </select>
              <button type="button" className="btn btn-ghost" style={{ flexShrink: 0, fontSize: "0.75rem", padding: "4px 8px" }}
                onClick={() => setGroupModal(matchedGroup
                  ? { group: matchedGroup, isNew: false }
                  : { group: { id: generateId("kg"), name: form.group || "", members: [] }, isNew: true })}>
                {matchedGroup ? "✏️" : "+ New"}
              </button>
            </div>
          </FormField>
          <FormField label="Shop">
            <select value={form.shop} onChange={(e) => setField("shop", e.target.value)} required>
              <option value="">— Select shop —</option>
              {shops.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </FormField>
        </FormRow>
        <FormRow cols={4}>
          <FormField label="Date of Order">
            <input type="date" value={form.dateOfOrder?.slice(0, 10) ?? ""}
              onChange={(e) => setField("dateOfOrder", e.target.value)} />
          </FormField>
          <FormField label="Round">
            <input value={form.round ?? ""} onChange={(e) => setField("round", e.target.value)} placeholder="e.g. Round 1" />
          </FormField>
          <FormField label="Shop Deadline">
            <input type="date" value={form.shopDeadline?.slice(0, 10) ?? ""}
              onChange={(e) => setField("shopDeadline", e.target.value)} />
          </FormField>
          <FormField label="Fulfillment">
            <select value={form.fulfillmentStatus}
              onChange={(e) => setField("fulfillmentStatus", e.target.value as OrderFulfillmentStatus)}>
              <option value="ordered">Ordered</option>
              <option value="received_at_kaddy">At Kaddy</option>
              <option value="otw_to_gom">OTW to GOM</option>
              <option value="arrived_to_gom">At GOM</option>
            </select>
          </FormField>
        </FormRow>
        <FormField label="Notes">
          <input value={form.notes ?? ""} onChange={(e) => setField("notes", e.target.value)} placeholder="Any notes" />
        </FormField>

        {/* Fancall toggle */}
        <div style={{ marginTop: "0.75rem" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", textTransform: "none", letterSpacing: 0, fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            <input type="checkbox" checked={!!form.isFancall} onChange={(e) => setField("isFancall", e.target.checked)} style={{ width: "auto" }} />
            <span>🎤 This round is a fancall</span>
            {form.isFancall && isNew && (
              <span style={{ fontSize: "0.72rem", color: "var(--accent-lavender)", background: "var(--accent-lavender-dim)", padding: "1px 8px", borderRadius: 99 }}>
                Will auto-create a Fancall entry linked to this order
              </span>
            )}
          </label>
        </div>

        {/* Pricing options */}
        <div style={{ margin: "1.25rem 0 0.5rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}>
              Pricing Options
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>— set once by GOM, reused for all joiners' items</div>
          </div>
          <PricingOptionsEditor
            options={form.pricingOptions}
            onChange={(opts) => setField("pricingOptions", opts)}
          />
        </div>

        {/* Joiners */}
        <div style={{ margin: "1.25rem 0 0.75rem", paddingTop: "1rem", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}>
            Joiners ({form.joiners.length})
          </div>
          <button type="button" className="btn btn-ghost" style={{ fontSize: "0.78rem", padding: "4px 12px" }}
            onClick={() => { const j = joiners[0]; if (j) setForm((p) => ({ ...p, joiners: [...p.joiners, emptyJoiner(j.id, j.name)] })); }}>
            + Add Joiner
          </button>
        </div>
        {form.joiners.length === 0 && (
          <div style={{ textAlign: "center", padding: "0.875rem", color: "var(--text-muted)", fontSize: "0.85rem", border: "1px dashed var(--border)", borderRadius: "var(--radius-sm)", marginBottom: "0.75rem" }}>
            No joiners yet
          </div>
        )}
        {form.joiners.map((entry, idx) => (
          <JoinerSection key={entry.id} entry={entry} pricingOptions={form.pricingOptions} groupName={form.group}
            onChange={(updated) => setForm((p) => ({ ...p, joiners: p.joiners.map((j, i) => i === idx ? updated : j) }))}
            onRemove={() => setForm((p) => ({ ...p, joiners: p.joiners.filter((_, i) => i !== idx) }))} />
        ))}

        <FormActions onClose={onClose} submitLabel={isNew ? "Create Order" : "Save Changes"} />
      </form>
    </Modal>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function GomOrdersPage() {
  const { shopOrders, deleteShopOrder, weightCategories } = useApp();
  const [filterGroup, setFilterGroup] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [modal, setModal] = useState<{ order: ShopOrder; isNew: boolean } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const groups = [...new Set(shopOrders.map((o) => o.group))];
  const filtered = shopOrders.filter((o) => {
    if (filterGroup !== "all" && o.group !== filterGroup) return false;
    if (filterStatus !== "all" && o.fulfillmentStatus !== filterStatus) return false;
    return true;
  });

  const getWcName = (id: string) => weightCategories.find((w) => w.id === id)?.name ?? "?";
  const orderTotal = (o: ShopOrder) =>
    o.joiners.reduce((s, j) => s + j.items.reduce((ss, it) => ss + it.pricePerUnit * it.quantity, 0), 0);
  const unpaidCount = (o: ShopOrder) => o.joiners.filter((j) => j.paymentStatus === "unpaid").length;

  return (
    <div className="fade-in">
      {modal && <ShopOrderModal initial={modal.order} isNew={modal.isNew} onClose={() => setModal(null)} />}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 style={{ fontSize: "1.8rem" }}>All Orders</h1>
          <p className="text-secondary text-sm mt-1">{filtered.length} shop orders</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({ order: emptyOrder(), isNew: true })}>+ New Order</button>
      </div>

      <div className="card mb-6" style={{ display: "flex", gap: "1rem", alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <label>Group</label>
          <select value={filterGroup} onChange={(e) => setFilterGroup(e.target.value)}>
            <option value="all">All groups</option>
            {groups.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label>Fulfillment</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All</option>
            <option value="ordered">Ordered</option>
            <option value="received_at_kaddy">At Kaddy</option>
            <option value="otw_to_gom">OTW to GOM</option>
            <option value="arrived_to_gom">At GOM</option>
          </select>
        </div>
        <button className="btn btn-ghost" onClick={() => { setFilterGroup("all"); setFilterStatus("all"); }}>Clear</button>
      </div>

      {/* Order cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {filtered.map((order) => {
          const isExpanded = expandedId === order.id;
          const color = FULFILLMENT_COLOR[order.fulfillmentStatus];
          const unpaid = unpaidCount(order);

          return (
            <div key={order.id} className="card" style={{ borderLeft: `3px solid ${color}`, cursor: "pointer" }}
              onClick={() => setExpandedId(isExpanded ? null : order.id)}>

              {/* Card header */}
              <div className="flex justify-between items-center">
                <div>
                  <div style={{ fontWeight: 700, fontSize: "1rem" }}>
                    {order.group}
                    <span style={{ fontWeight: 400, color: "var(--text-muted)", marginLeft: 8, fontSize: "0.875rem" }}>· {order.shop}</span>
                    {order.round && (
                      <span style={{ marginLeft: 8, fontSize: "0.72rem", color: "var(--accent-lavender)", background: "var(--accent-lavender-dim)", padding: "1px 7px", borderRadius: 99 }}>
                        {order.round}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                    <span className="text-secondary text-sm">{formatDate(order.dateOfOrder)} · {order.joiners.length} joiner{order.joiners.length !== 1 ? "s" : ""}</span>
                    {order.pricingOptions.map((opt) => (
                      <span key={opt.id} style={{ fontSize: "0.68rem", padding: "1px 7px", borderRadius: 99, background: "var(--accent-blossom-dim)", color: "var(--accent-blossom)" }}>
                        {opt.label} €{opt.priceEur.toFixed(2)}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                  {unpaid > 0 && <span className="badge" style={{ background: "#f4758a20", color: "var(--status-unpaid)" }}>{unpaid} unpaid</span>}
                  {order.shopDeadline && <span className="text-sm" style={{ color: "var(--accent-gold)" }}>🗓 {formatDate(order.shopDeadline)}</span>}
                  <span className="badge" style={{ color, background: `${color}20` }}>{FULFILLMENT_LABELS[order.fulfillmentStatus]}</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", color: "var(--accent-gold)", fontSize: "0.85rem" }}>{formatEur(orderTotal(order))}</span>
                  <button className="btn btn-ghost" style={{ fontSize: "0.75rem", padding: "3px 8px" }} onClick={() => setModal({ order, isNew: false })}>Edit</button>
                  <button className="btn" style={{ fontSize: "0.75rem", padding: "3px 8px", color: "var(--status-unpaid)", borderColor: "#f4758a40", background: "transparent" }}
                    onClick={() => { if (confirm(`Delete ${order.group} — ${order.shop}?`)) deleteShopOrder(order.id); }}>Del</button>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{isExpanded ? "▲" : "▼"}</span>
                </div>
              </div>

              {/* Expanded view */}
              {isExpanded && (
                <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}
                  onClick={(e) => e.stopPropagation()}>
                  {order.notes && <div className="text-secondary text-sm mb-3" style={{ fontStyle: "italic" }}>📝 {order.notes}</div>}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {order.joiners.map((je) => {
                      const jTotal = je.items.reduce((s, it) => s + it.pricePerUnit * it.quantity, 0);
                      // Gather all members across all items for display
                      const allMembers = [...new Map(je.items.flatMap((it) => it.membersClaimed).map((m) => [m.memberId, m])).values()];

                      return (
                        <div key={je.id} style={{ background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)", padding: "0.75rem" }}>
                          <div className="flex justify-between items-center mb-2">
                            <div>
                              <span style={{ fontWeight: 600 }}>{je.joinerName}</span>
                              {allMembers.length > 0 && (
                                <span style={{ marginLeft: 8, fontSize: "0.75rem", color: "var(--accent-blossom)" }}>
                                  {allMembers.map((m) => m.memberName).join(", ")}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {je.deadline && <span style={{ fontSize: "0.72rem", color: "var(--accent-gold)" }}>⏰ {formatDate(je.deadline)}</span>}
                              <span className="badge" style={{ background: je.paymentStatus === "paid" ? "var(--accent-mint-dim)" : "#f4758a20", color: je.paymentStatus === "paid" ? "var(--accent-mint)" : "var(--status-unpaid)" }}>
                                {je.paymentStatus}
                              </span>
                              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.85rem", color: "var(--accent-gold)", fontWeight: 600 }}>{formatEur(jTotal)}</span>
                            </div>
                          </div>

                          {je.items.length > 0 && (
                            <table style={{ fontSize: "0.78rem", width: "100%" }}>
                              <thead>
                                <tr>
                                  {["Members", "Description", "Qty", "Option", "Price", "Inclusions", "Total"].map((h) => (
                                    <th key={h} style={{ textAlign: "left", color: "var(--text-muted)", fontSize: "0.62rem", padding: "2px 6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {je.items.map((it) => {
                                  const opt = order.pricingOptions.find((o) => o.id === it.pricingOptionId);
                                  return (
                                    <tr key={it.id}>
                                      <td style={{ padding: "3px 6px" }}>
                                        {it.membersClaimed.length > 0 ? (
                                          <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                                            {it.membersClaimed.map((m) => (
                                              <span key={m.memberId} style={{ fontSize: "0.65rem", padding: "1px 6px", borderRadius: 99, background: "var(--accent-blossom-dim)", color: "var(--accent-blossom)" }}>
                                                {m.memberName}
                                              </span>
                                            ))}
                                          </div>
                                        ) : <span style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>—</span>}
                                      </td>
                                      <td style={{ padding: "3px 6px", color: "var(--text-secondary)" }}>{it.name || "—"}</td>
                                      <td style={{ padding: "3px 6px", color: "var(--text-secondary)" }}>×{it.quantity}</td>
                                      <td style={{ padding: "3px 6px" }}>
                                        <span style={{ fontSize: "0.65rem", padding: "1px 6px", borderRadius: 99, background: it.pricingOptionId === "custom" ? "var(--accent-gold-dim)" : "var(--accent-blossom-dim)", color: it.pricingOptionId === "custom" ? "var(--accent-gold)" : "var(--accent-blossom)" }}>
                                          {opt?.label ?? "Custom"}
                                        </span>
                                      </td>
                                      <td style={{ padding: "3px 6px", fontFamily: "'DM Mono', monospace", color: "var(--accent-mint)" }}>€{it.pricePerUnit.toFixed(2)}</td>
                                      <td style={{ padding: "3px 6px", color: "var(--text-muted)", fontSize: "0.72rem" }}>{it.inclusions || "—"}</td>
                                      <td style={{ padding: "3px 6px", fontFamily: "'DM Mono', monospace", color: "var(--accent-gold)", textAlign: "right" }}>€{(it.pricePerUnit * it.quantity).toFixed(2)}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="card" style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>No orders found ✦</div>
        )}
      </div>
    </div>
  );
}
