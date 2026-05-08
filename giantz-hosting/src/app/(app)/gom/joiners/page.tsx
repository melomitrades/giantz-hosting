"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { generateId } from "@/lib/utils";
import { User } from "@/types";
import Modal, { FormField, FormActions } from "@/components/shared/Modal";

function JoinerModal({ initial, isNew, onClose }: { initial: User; isNew: boolean; onClose: () => void }) {
  const { addUser, updateUser, knownGroups } = useApp();
  const [form, setForm] = useState<User>({ ...initial, fixedForGroups: initial.fixedForGroups ?? [] });

  const toggleGroup = (groupName: string) => {
    setForm((p) => {
      const fixed = p.fixedForGroups ?? [];
      return { ...p, fixedForGroups: fixed.includes(groupName) ? fixed.filter((g) => g !== groupName) : [...fixed, groupName] };
    });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const final: User = { ...form, name: form.name.trim(), email: form.email.trim() };
    isNew ? addUser(final) : updateUser(final.id, final);
    onClose();
  };

  return (
    <Modal title={isNew ? "Add Joiner" : `Edit — ${initial.name}`} onClose={onClose} width={460}>
      <form onSubmit={submit}>
        <FormField label="Username / Display Name">
          <input required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. 소율 (Soyul)" autoFocus />
        </FormField>
        <div style={{ marginTop: "1rem" }}>
          <FormField label="Email (optional)">
            <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="joiner@example.com" />
          </FormField>
        </div>

        {/* Fixed groups */}
        {knownGroups.length > 0 && (
          <div style={{ marginTop: "1rem" }}>
            <label style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 8 }}>
              Fixed for groups
              <span style={{ marginLeft: 6, fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "none", letterSpacing: 0 }}>— auto-added to every new order from these groups</span>
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {knownGroups.map((g) => {
                const fixed = (form.fixedForGroups ?? []).includes(g.name);
                return (
                  <button key={g.id} type="button" onClick={() => toggleGroup(g.name)}
                    style={{ padding: "4px 12px", borderRadius: 99, fontSize: "0.78rem", cursor: "pointer", border: "1px solid", transition: "all 0.12s",
                      background: fixed ? "var(--accent-lavender)" : "transparent",
                      color: fixed ? "#0d0f14" : "var(--text-muted)",
                      borderColor: fixed ? "var(--accent-lavender)" : "var(--border)" }}>
                    {fixed ? "📌 " : ""}{g.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <FormActions onClose={onClose} submitLabel={isNew ? "Add Joiner" : "Save Changes"} />
      </form>
    </Modal>
  );
}

function emptyJoiner(): User {
  return { id: generateId("u"), name: "", role: "joiner", email: "", fixedForGroups: [] };
}

export default function GomJoinersPage() {
  const { users, deleteUser, shopOrders, knownGroups } = useApp();
  const joiners = users.filter((u) => u.role === "joiner");
  const [modal, setModal] = useState<{ user: User; isNew: boolean } | null>(null);

  const orderCountFor = (joinerId: string) =>
    shopOrders.filter((o) => o.joiners.some((j) => j.joinerId === joinerId)).length;
  const unpaidCountFor = (joinerId: string) =>
    shopOrders.flatMap((o) => o.joiners).filter((j) => j.joinerId === joinerId && j.paymentStatus === "unpaid").length;

  return (
    <div className="fade-in">
      {modal && <JoinerModal initial={modal.user} isNew={modal.isNew} onClose={() => setModal(null)} />}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 style={{ fontSize: "1.8rem" }}>Joiners</h1>
          <p className="text-secondary text-sm mt-1">{joiners.length} joiner{joiners.length !== 1 ? "s" : ""} registered</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({ user: emptyJoiner(), isNew: true })}>+ Add Joiner</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {joiners.map((j) => {
          const orders = orderCountFor(j.id);
          const unpaid = unpaidCountFor(j.id);
          const fixedGroups = j.fixedForGroups ?? [];
          return (
            <div key={j.id} className="card">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div style={{ width: 42, height: 42, borderRadius: "50%", background: "var(--accent-blossom-dim)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", color: "var(--accent-blossom)", fontWeight: 700 }}>
                    {j.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{j.name}</div>
                    <div className="text-muted text-xs mt-1">{j.email || "No email"}</div>
                    {fixedGroups.length > 0 && (
                      <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                        {fixedGroups.map((g) => (
                          <span key={g} style={{ fontSize: "0.68rem", padding: "1px 7px", borderRadius: 99, background: "var(--accent-lavender-dim)", color: "var(--accent-lavender)" }}>
                            📌 {g}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="badge badge-muted">{orders} order{orders !== 1 ? "s" : ""}</span>
                  {unpaid > 0 && <span className="badge" style={{ background: "#f4758a20", color: "var(--status-unpaid)" }}>{unpaid} unpaid</span>}
                  <button className="btn btn-ghost" style={{ fontSize: "0.78rem", padding: "4px 10px" }} onClick={() => setModal({ user: j, isNew: false })}>Edit</button>
                  <button className="btn" style={{ fontSize: "0.78rem", padding: "4px 10px", color: "var(--status-unpaid)", borderColor: "#f4758a40", background: "transparent" }}
                    onClick={() => { if (confirm(`Remove joiner "${j.name}"?`)) deleteUser(j.id); }}>Remove</button>
                </div>
              </div>
            </div>
          );
        })}
        {joiners.length === 0 && (
          <div className="card" style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>No joiners yet ✦</div>
        )}
      </div>
    </div>
  );
}
