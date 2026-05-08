"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { generateId } from "@/lib/utils";
import { User } from "@/types";
import Modal, { FormField, FormActions } from "@/components/shared/Modal";

function JoinerModal({ initial, isNew, onClose }: { initial: User; isNew: boolean; onClose: () => void }) {
  const { addUser, updateUser } = useApp();
  const [form, setForm] = useState<User>({ ...initial });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const final: User = { ...form, name: form.name.trim(), email: form.email.trim() };
    isNew ? addUser(final) : updateUser(final.id, final);
    onClose();
  };

  return (
    <Modal title={isNew ? "Add Joiner" : `Edit — ${initial.name}`} onClose={onClose} width={420}>
      <form onSubmit={submit}>
        <FormField label="Username / Display Name">
          <input required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. 소율 (Soyul)" autoFocus />
        </FormField>
        <div style={{ marginTop: "1rem" }}>
          <FormField label="Email (optional)">
            <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="joiner@example.com" />
          </FormField>
        </div>
        <FormActions onClose={onClose} submitLabel={isNew ? "Add Joiner" : "Save Changes"} />
      </form>
    </Modal>
  );
}

function emptyJoiner(): User {
  return { id: generateId("u"), name: "", role: "joiner", email: "" };
}

export default function GomJoinersPage() {
  const { users, deleteUser, shopOrders, knownGroups } = useApp();
  const joiners = users.filter((u) => u.role === "joiner");
  const [modal, setModal] = useState<{ user: User; isNew: boolean } | null>(null);

  const orderCountFor = (joinerId: string) =>
    shopOrders.filter((o) => o.joiners.some((j) => j.joinerId === joinerId)).length;

  const unpaidCountFor = (joinerId: string) =>
    shopOrders.flatMap((o) => o.joiners).filter((j) => j.joinerId === joinerId && j.paymentStatus === "unpaid").length;

  // Which groups have this joiner as fixed
  const fixedGroupsFor = (joinerId: string) =>
    knownGroups.filter((g) => (g.fixedJoiners ?? []).includes(joinerId)).map((g) => g.name);

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
          const fixedGroups = fixedGroupsFor(j.id);
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
                          <span key={g} style={{ fontSize: "0.68rem", padding: "1px 7px", borderRadius: 99, background: "var(--accent-mint-dim)", color: "var(--accent-mint)" }}>
                            ✓ Fixed: {g}
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
          <div className="card" style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
            No joiners yet — add the first one ✦
          </div>
        )}
      </div>
    </div>
  );
}
