"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { generateId } from "@/lib/utils";
import { User, KnownGroup } from "@/types";
import Modal, { FormField, FormRow, FormActions } from "@/components/shared/Modal";

// ── Joiner Modal ──────────────────────────────────────────────────────────────
function JoinerModal({ initial, isNew, onClose }: { initial: User; isNew: boolean; onClose: () => void }) {
  const { addUser, updateUser } = useApp();
  const [form, setForm] = useState<User>({ ...initial });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const final = { id: form.id, name: form.name.trim(), role: "joiner" as const, email: form.email.trim() };
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

// ── Group Modal ───────────────────────────────────────────────────────────────
function GroupModal({ initial, isNew, onClose }: { initial: KnownGroup; isNew: boolean; onClose: () => void }) {
  const { addKnownGroup, updateKnownGroup, users } = useApp();
  const joiners = users.filter((u) => u.role === "joiner");
  const [group, setGroup] = useState<KnownGroup>({
    ...initial,
    members: [...initial.members],
    fixedJoiners: [...(initial.fixedJoiners ?? [])],
  });
  const [newMemberName, setNewMemberName] = useState("");

  const addMember = () => {
    if (!newMemberName.trim()) return;
    setGroup((g) => ({ ...g, members: [...g.members, { id: generateId("m"), name: newMemberName.trim() }] }));
    setNewMemberName("");
  };

  const toggleFixedJoiner = (joinerId: string) => {
    setGroup((g) => {
      const fixed = g.fixedJoiners ?? [];
      return { ...g, fixedJoiners: fixed.includes(joinerId) ? fixed.filter((id) => id !== joinerId) : [...fixed, joinerId] };
    });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // Send clean object — API expects { id, name, members, fixedJoiners }
    const payload = {
      id: group.id,
      name: group.name,
      members: group.members,
      fixedJoiners: group.fixedJoiners ?? [],
    };
    if (isNew) {
      addKnownGroup(payload as KnownGroup);
    } else {
      updateKnownGroup(group.id, payload as Partial<KnownGroup>);
    }
    onClose();
  };

  return (
    <Modal title={isNew ? "Add Group" : `Edit — ${initial.name}`} onClose={onClose} width={500}>
      <form onSubmit={submit}>
        <FormField label="Group Name">
          <input required value={group.name} onChange={(e) => setGroup((g) => ({ ...g, name: e.target.value }))} placeholder="e.g. SEVENTEEN" autoFocus />
        </FormField>

        {/* Members */}
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
            <input value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} placeholder="Member name"
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addMember(); } }} />
            <button type="button" className="btn btn-ghost" style={{ flexShrink: 0 }} onClick={addMember}>+ Add</button>
          </div>
        </div>

        {/* Fixed joiners */}
        {joiners.length > 0 && (
          <div style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
            <label style={{ fontSize: "0.72rem", color: "var(--text-muted)", letterSpacing: "0.04em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Fixed Joiners</label>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: 8 }}>Auto-added to every new order for this group</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {joiners.map((j) => {
                const fixed = (group.fixedJoiners ?? []).includes(j.id);
                return (
                  <button key={j.id} type="button" onClick={() => toggleFixedJoiner(j.id)}
                    style={{ padding: "3px 10px", borderRadius: 99, fontSize: "0.78rem", cursor: "pointer", border: "1px solid", transition: "all 0.12s",
                      background: fixed ? "var(--accent-mint)" : "transparent",
                      color: fixed ? "#0d0f14" : "var(--text-muted)",
                      borderColor: fixed ? "var(--accent-mint)" : "var(--border)" }}>
                    {fixed ? "✓ " : ""}{j.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <FormActions onClose={onClose} submitLabel={isNew ? "Create Group" : "Save Changes"} />
      </form>
    </Modal>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
type Tab = "joiners" | "groups";

export default function GomJoinersPage() {
  const { users, deleteUser, shopOrders, knownGroups, deleteKnownGroup } = useApp();
  const joiners = users.filter((u) => u.role === "joiner");
  const [tab, setTab] = useState<Tab>("joiners");
  const [joinerModal, setJoinerModal] = useState<{ user: User; isNew: boolean } | null>(null);
  const [groupModal, setGroupModal] = useState<{ group: KnownGroup; isNew: boolean } | null>(null);

  const orderCountFor = (joinerId: string) =>
    shopOrders.filter((o) => o.joiners.some((j) => j.joinerId === joinerId)).length;
  const unpaidCountFor = (joinerId: string) =>
    shopOrders.flatMap((o) => o.joiners).filter((j) => j.joinerId === joinerId && j.paymentStatus === "unpaid").length;
  const fixedGroupsFor = (joinerId: string) =>
    knownGroups.filter((g) => (g.fixedJoiners ?? []).includes(joinerId)).map((g) => g.name);

  const emptyJoiner = (): User => ({ id: generateId("u"), name: "", role: "joiner", email: "" });
  const emptyGroup = (): KnownGroup => ({ id: generateId("kg"), name: "", members: [], fixedJoiners: [] });

  return (
    <div className="fade-in">
      {joinerModal && <JoinerModal initial={joinerModal.user} isNew={joinerModal.isNew} onClose={() => setJoinerModal(null)} />}
      {groupModal && <GroupModal initial={groupModal.group} isNew={groupModal.isNew} onClose={() => setGroupModal(null)} />}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 style={{ fontSize: "1.8rem" }}>Joiners &amp; Groups</h1>
          <p className="text-secondary text-sm mt-1">
            {joiners.length} joiner{joiners.length !== 1 ? "s" : ""} · {knownGroups.length} group{knownGroups.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => tab === "joiners" ? setJoinerModal({ user: emptyJoiner(), isNew: true }) : setGroupModal({ group: emptyGroup(), isNew: true })}>
          {tab === "joiners" ? "+ Add Joiner" : "+ Add Group"}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: "1.5rem", background: "var(--bg-elevated)", borderRadius: "var(--radius-md)", padding: 4, width: "fit-content" }}>
        {(["joiners", "groups"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: "6px 20px", borderRadius: "var(--radius-sm)", border: "none", cursor: "pointer", fontSize: "0.875rem", fontWeight: 500, transition: "all 0.15s",
              background: tab === t ? "var(--accent-blossom)" : "transparent",
              color: tab === t ? "#0d0f14" : "var(--text-muted)" }}>
            {t === "joiners" ? "👤 Joiners" : "🎤 Groups"}
          </button>
        ))}
      </div>

      {/* Joiners tab */}
      {tab === "joiners" && (
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
                            <span key={g} style={{ fontSize: "0.68rem", padding: "1px 7px", borderRadius: 99, background: "var(--accent-mint-dim)", color: "var(--accent-mint)" }}>✓ Fixed: {g}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="badge badge-muted">{orders} order{orders !== 1 ? "s" : ""}</span>
                    {unpaid > 0 && <span className="badge" style={{ background: "#f4758a20", color: "var(--status-unpaid)" }}>{unpaid} unpaid</span>}
                    <button className="btn btn-ghost" style={{ fontSize: "0.78rem", padding: "4px 10px" }} onClick={() => setJoinerModal({ user: j, isNew: false })}>Edit</button>
                    <button className="btn" style={{ fontSize: "0.78rem", padding: "4px 10px", color: "var(--status-unpaid)", borderColor: "#f4758a40", background: "transparent" }}
                      onClick={() => { if (confirm(`Remove "${j.name}"?`)) deleteUser(j.id); }}>Remove</button>
                  </div>
                </div>
              </div>
            );
          })}
          {joiners.length === 0 && <div className="card" style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>No joiners yet ✦</div>}
        </div>
      )}

      {/* Groups tab */}
      {tab === "groups" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {knownGroups.map((g) => {
            const fixedNames = (g.fixedJoiners ?? []).map((id) => users.find((u) => u.id === id)?.name).filter(Boolean);
            return (
              <div key={g.id} className="card">
                <div className="flex justify-between items-center">
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "1rem" }}>{g.name}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                      {g.members.map((m) => (
                        <span key={m.id} style={{ fontSize: "0.72rem", padding: "1px 8px", borderRadius: 99, background: "var(--accent-blossom-dim)", color: "var(--accent-blossom)" }}>{m.name}</span>
                      ))}
                      {g.members.length === 0 && <span className="text-muted text-xs">No members</span>}
                    </div>
                    {fixedNames.length > 0 && (
                      <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                        {fixedNames.map((name) => (
                          <span key={name} style={{ fontSize: "0.68rem", padding: "1px 7px", borderRadius: 99, background: "var(--accent-mint-dim)", color: "var(--accent-mint)" }}>✓ Fixed: {name}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="badge badge-muted">{g.members.length} member{g.members.length !== 1 ? "s" : ""}</span>
                    <button className="btn btn-ghost" style={{ fontSize: "0.78rem", padding: "4px 10px" }} onClick={() => setGroupModal({ group: g, isNew: false })}>Edit</button>
                    <button className="btn" style={{ fontSize: "0.78rem", padding: "4px 10px", color: "var(--status-unpaid)", borderColor: "#f4758a40", background: "transparent" }}
                      onClick={() => { if (confirm(`Delete group "${g.name}"?`)) deleteKnownGroup(g.id); }}>Delete</button>
                  </div>
                </div>
              </div>
            );
          })}
          {knownGroups.length === 0 && <div className="card" style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>No groups yet ✦</div>}
        </div>
      )}
    </div>
  );
}
