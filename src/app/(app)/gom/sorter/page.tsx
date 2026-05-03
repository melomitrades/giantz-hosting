"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { generateId, formatDateTime } from "@/lib/utils";
import { SortingSession, PcVersion, SorterJoiner, AssignedPc } from "@/types";
import Modal, { FormRow, FormField, FormActions } from "@/components/shared/Modal";

// ─── Sort logic ───────────────────────────────────────────────────────────────
function runSort(session: SortingSession, method: "timestamp" | "fair"): Record<string, AssignedPc[]> {
  // available[memberId][versionId] = how many PCs left
  const available: Record<string, Record<string, number>> = {};
  for (const slot of session.memberSlots) {
    available[slot.memberId] = { ...slot.countPerVersion };
  }

  const result: Record<string, AssignedPc[]> = {};
  // remaining[joinerId][versionId] = how many still needed for that version
  const remaining: Record<string, Record<string, number>> = {};
  for (const j of session.joiners) {
    result[j.joinerId] = [];
    remaining[j.joinerId] = { ...j.neededPerVersion };
  }

  const tryAssign = (joinerId: string, memberId: string, versionId: string): boolean => {
    if ((available[memberId]?.[versionId] ?? 0) > 0 && (remaining[joinerId]?.[versionId] ?? 0) > 0) {
      const slot = session.memberSlots.find((s) => s.memberId === memberId);
      const ver = session.versions.find((v) => v.id === versionId);
      result[joinerId].push({
        memberId, memberName: slot?.memberName ?? memberId,
        versionId, versionName: ver?.name ?? versionId,
      });
      available[memberId][versionId]--;
      remaining[joinerId][versionId]--;
      return true;
    }
    return false;
  };

  const orderedJoiners = method === "timestamp"
    ? [...session.joiners].sort((a, b) => (a.submittedAt ?? "9999").localeCompare(b.submittedAt ?? "9999"))
    : [...session.joiners];

  if (method === "timestamp") {
    // Per version, per joiner (in timestamp order): keep assigning until their needed quota is filled
    for (const version of session.versions) {
      for (const joiner of orderedJoiners) {
        const needed = remaining[joiner.joinerId]?.[version.id] ?? 0;
        if (needed <= 0) continue;
        const prioList = joiner.prioritiesByVersion[version.id] ?? [];
        // Keep assigning PCs for this version until quota met or priorities exhausted
        let assigned = 0;
        // Loop through priorities repeatedly until quota filled or no more stock
        let changed = true;
        while (assigned < needed && changed) {
          changed = false;
          for (const memberId of prioList) {
            if (remaining[joiner.joinerId][version.id] <= 0) break;
            if (tryAssign(joiner.joinerId, memberId, version.id)) {
              assigned++;
              changed = true;
            }
          }
        }
      }
    }
  } else {
    // Fair: per version, go level by level. At each level handle all requests simultaneously.
    // If everyone at that level can be satisfied → assign. If not → nobody gets it at that level.
    // Repeat until all quotas filled or all priorities exhausted.
    for (const version of session.versions) {
      const maxDepth = Math.max(...session.joiners.map((j) => (j.prioritiesByVersion[version.id] ?? []).length), 1);

      // We may need multiple passes if quota > 1
      let anyProgress = true;
      while (anyProgress && session.joiners.some((j) => (remaining[j.joinerId]?.[version.id] ?? 0) > 0)) {
        anyProgress = false;
        for (let level = 0; level < maxDepth; level++) {
          // collect requests at this priority level for joiners still needing this version
          const requests: { joinerId: string; memberId: string }[] = [];
          for (const joiner of session.joiners) {
            if ((remaining[joiner.joinerId]?.[version.id] ?? 0) <= 0) continue;
            const memberId = (joiner.prioritiesByVersion[version.id] ?? [])[level];
            if (memberId) requests.push({ joinerId: joiner.joinerId, memberId });
          }

          // Group by member
          const wants: Record<string, string[]> = {};
          for (const r of requests) {
            if (!wants[r.memberId]) wants[r.memberId] = [];
            wants[r.memberId].push(r.joinerId);
          }

          // Assign where stock >= demand
          for (const [memberId, wanters] of Object.entries(wants)) {
            const avail = available[memberId]?.[version.id] ?? 0;
            if (avail >= wanters.length) {
              for (const joinerId of wanters) {
                if (tryAssign(joinerId, memberId, version.id)) anyProgress = true;
              }
            } else if (avail > 0) {
              // Partial stock: give to as many as possible (in joiner list order)
              let given = 0;
              for (const joinerId of wanters) {
                if (given >= avail) break;
                if (tryAssign(joinerId, memberId, version.id)) { given++; anyProgress = true; }
              }
            }
          }
        }
      }
    }
  }

  return result;
}

// ─── Per-joiner priority + needed-count editor ────────────────────────────────
function JoinerEditor({ joiner, versions, memberSlots, onChange }: {
  joiner: SorterJoiner;
  versions: PcVersion[];
  memberSlots: { memberId: string; memberName: string }[];
  onChange: (j: SorterJoiner) => void;
}) {
  const [activeVid, setActiveVid] = useState(versions[0]?.id ?? "");

  const getPrios = (vId: string) => joiner.prioritiesByVersion[vId] ?? [];
  const setPrios = (vId: string, list: string[]) =>
    onChange({ ...joiner, prioritiesByVersion: { ...joiner.prioritiesByVersion, [vId]: list } });

  const move = (vId: string, memberId: string, dir: -1 | 1) => {
    const list = [...getPrios(vId)];
    const idx = list.indexOf(memberId);
    if (idx < 0) return;
    const swap = idx + dir;
    if (swap < 0 || swap >= list.length) return;
    [list[idx], list[swap]] = [list[swap], list[idx]];
    setPrios(vId, list);
  };

  const toggle = (vId: string, memberId: string) => {
    const list = getPrios(vId);
    setPrios(vId, list.includes(memberId) ? list.filter((m) => m !== memberId) : [...list, memberId]);
  };

  const setNeeded = (vId: string, val: number) =>
    onChange({ ...joiner, neededPerVersion: { ...joiner.neededPerVersion, [vId]: Math.max(0, val) } });

  if (versions.length === 0) return <div className="text-muted text-xs">Add versions first</div>;

  return (
    <div>
      {/* Needed per version — inline row */}
      <div style={{ marginBottom: "0.625rem" }}>
        <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 5 }}>
          PCs needed per version
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {versions.map((v) => (
            <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{v.name}:</span>
              <input type="number" min={0} value={joiner.neededPerVersion[v.id] ?? 0}
                onChange={(e) => setNeeded(v.id, Number(e.target.value))}
                style={{ width: 52, textAlign: "center" }} />
            </div>
          ))}
        </div>
      </div>

      {/* Version tabs for priorities */}
      <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 5 }}>
        Priority order
      </div>
      <div style={{ display: "flex", gap: 3, marginBottom: "0.5rem", background: "var(--bg)", borderRadius: "var(--radius-sm)", padding: 3, width: "fit-content" }}>
        {versions.map((v) => (
          <button key={v.id} type="button" onClick={() => setActiveVid(v.id)}
            style={{ padding: "3px 10px", borderRadius: "var(--radius-sm)", border: "none", cursor: "pointer", fontSize: "0.75rem", fontWeight: 500,
              background: activeVid === v.id ? "var(--accent-lavender)" : "transparent",
              color: activeVid === v.id ? "#0d0f14" : "var(--text-muted)" }}>
            {v.name || "?"}
          </button>
        ))}
      </div>

      <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginBottom: 4 }}>
        For {versions.find((v) => v.id === activeVid)?.name ?? "?"} — needs {joiner.neededPerVersion[activeVid] ?? 0} PC{(joiner.neededPerVersion[activeVid] ?? 0) !== 1 ? "s" : ""}
      </div>

      {memberSlots.map((slot) => {
        const prios = getPrios(activeVid);
        const rank = prios.indexOf(slot.memberId);
        const included = rank >= 0;
        return (
          <div key={slot.memberId} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, padding: "3px 0" }}>
            <span style={{ width: 22, fontSize: "0.72rem", fontFamily: "'DM Mono', monospace", color: "var(--accent-lavender)", textAlign: "center" }}>
              {included ? rank + 1 : "—"}
            </span>
            <span style={{ fontSize: "0.82rem", flex: 1, color: included ? "var(--text-primary)" : "var(--text-muted)" }}>{slot.memberName}</span>
            {included ? (
              <>
                <button type="button" onClick={() => move(activeVid, slot.memberId, -1)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "0.8rem", padding: "0 2px" }}>↑</button>
                <button type="button" onClick={() => move(activeVid, slot.memberId, 1)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "0.8rem", padding: "0 2px" }}>↓</button>
                <button type="button" onClick={() => toggle(activeVid, slot.memberId)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--status-unpaid)", fontSize: "0.72rem", padding: "0 2px" }}>✕</button>
              </>
            ) : (
              <button type="button" onClick={() => toggle(activeVid, slot.memberId)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent-blossom)", fontSize: "0.72rem" }}>+ Add</button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Session form modal ───────────────────────────────────────────────────────
function SessionModal({ initial, isNew, onClose }: { initial: SortingSession; isNew: boolean; onClose: () => void }) {
  const { addSortingSession, updateSortingSession, knownGroups, users } = useApp();
  const joiners = users.filter((u) => u.role === "joiner");

  const [form, setForm] = useState<SortingSession>({
    ...initial,
    versions: initial.versions.map((v) => ({ ...v })),
    memberSlots: initial.memberSlots.map((m) => ({ ...m, countPerVersion: { ...m.countPerVersion } })),
    joiners: initial.joiners.map((j) => ({ ...j, neededPerVersion: { ...j.neededPerVersion }, prioritiesByVersion: { ...j.prioritiesByVersion } })),
  });

  const setField = (f: keyof SortingSession, v: unknown) => setForm((p) => ({ ...p, [f]: v }));
  const groupMembers = knownGroups.find((g) => g.name.toLowerCase() === form.group.toLowerCase())?.members ?? [];

  // Versions
  const addVersion = () => setForm((p) => ({ ...p, versions: [...p.versions, { id: generateId("v"), name: "", totalPulled: 0 }] }));
  const updVersion = (id: string, f: keyof PcVersion, v: unknown) =>
    setForm((p) => ({ ...p, versions: p.versions.map((v2) => v2.id === id ? { ...v2, [f]: v } : v2) }));
  const delVersion = (id: string) =>
    setForm((p) => ({ ...p, versions: p.versions.filter((v) => v.id !== id) }));

  // Member slots
  const toggleMemberSlot = (memberId: string, memberName: string) => {
    const exists = form.memberSlots.some((m) => m.memberId === memberId);
    if (exists) {
      setForm((p) => ({ ...p, memberSlots: p.memberSlots.filter((m) => m.memberId !== memberId) }));
    } else {
      const counts: Record<string, number> = {};
      form.versions.forEach((v) => { counts[v.id] = 0; });
      setForm((p) => ({ ...p, memberSlots: [...p.memberSlots, { memberId, memberName, countPerVersion: counts }] }));
    }
  };
  const updSlotCount = (memberId: string, versionId: string, val: number) =>
    setForm((p) => ({ ...p, memberSlots: p.memberSlots.map((m) => m.memberId === memberId ? { ...m, countPerVersion: { ...m.countPerVersion, [versionId]: val } } : m) }));

  // Joiners
  const toggleJoiner = (joinerId: string, joinerName: string) => {
    const exists = form.joiners.some((j) => j.joinerId === joinerId);
    if (exists) {
      setForm((p) => ({ ...p, joiners: p.joiners.filter((j) => j.joinerId !== joinerId) }));
    } else {
      const needed: Record<string, number> = {};
      form.versions.forEach((v) => { needed[v.id] = 0; });
      setForm((p) => ({ ...p, joiners: [...p.joiners, { joinerId, joinerName, neededPerVersion: needed, prioritiesByVersion: {} }] }));
    }
  };
  const updJoiner = (joinerId: string, updated: SorterJoiner) =>
    setForm((p) => ({ ...p, joiners: p.joiners.map((j) => j.joinerId === joinerId ? updated : j) }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    isNew ? addSortingSession(form) : updateSortingSession(form.id, form);
    onClose();
  };

  return (
    <Modal title={isNew ? "New Sorting Session" : `Edit — ${initial.group}`} onClose={onClose} width={780}>
      <form onSubmit={submit}>
        <FormRow cols={2}>
          <FormField label="Group">
            <select required value={form.group} onChange={(e) => setField("group", e.target.value)}>
              <option value="">— Select group —</option>
              {knownGroups.map((g) => <option key={g.id} value={g.name}>{g.name}</option>)}
            </select>
          </FormField>
          <FormField label="Notes">
            <input value={form.notes ?? ""} onChange={(e) => setField("notes", e.target.value)} placeholder="Optional notes" />
          </FormField>
        </FormRow>

        {/* Versions */}
        <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.625rem" }}>
            <label style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Album Versions</label>
            <button type="button" className="btn btn-ghost" style={{ fontSize: "0.75rem", padding: "3px 10px" }} onClick={addVersion}>+ Add Version</button>
          </div>
          {form.versions.map((v) => (
            <div key={v.id} style={{ display: "grid", gridTemplateColumns: "2fr 120px 22px", gap: 6, marginBottom: 5, alignItems: "center" }}>
              <input placeholder="Version name (e.g. Ver.A)" value={v.name} onChange={(e) => updVersion(v.id, "name", e.target.value)} />
              <input type="number" min={0} value={v.totalPulled}
                onChange={(e) => updVersion(v.id, "totalPulled", Number(e.target.value))}
                placeholder="Total PCs pulled" />
              <button type="button" onClick={() => delVersion(v.id)}
                style={{ background: "none", border: "none", color: "var(--status-unpaid)", cursor: "pointer", fontSize: "0.9rem" }}>✕</button>
            </div>
          ))}
          {form.versions.length === 0 && <div className="text-muted text-xs">Add at least one version</div>}
        </div>

        {/* Member stock grid — count of each member's PCs per version */}
        {form.group && groupMembers.length > 0 && form.versions.length > 0 && (
          <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
            <label style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: "0.625rem" }}>
              Members &amp; PC stock per version
            </label>
            <div style={{ overflowX: "auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: `160px repeat(${form.versions.length}, 90px)`, gap: 4, marginBottom: 4, minWidth: "fit-content" }}>
                <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Member</div>
                {form.versions.map((v) => (
                  <div key={v.id} style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", textAlign: "center" }}>
                    {v.name || "?"}<br/>
                    <span style={{ color: "var(--accent-lavender)" }}>({v.totalPulled} total)</span>
                  </div>
                ))}
              </div>
              {groupMembers.map((m) => {
                const slot = form.memberSlots.find((s) => s.memberId === m.id);
                const memberTotal = slot ? Object.values(slot.countPerVersion).reduce((a, b) => a + b, 0) : 0;
                return (
                  <div key={m.id} style={{ display: "grid", gridTemplateColumns: `160px repeat(${form.versions.length}, 90px)`, gap: 4, marginBottom: 4, alignItems: "center", minWidth: "fit-content" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", textTransform: "none", letterSpacing: 0, fontSize: "0.82rem", color: slot ? "var(--accent-blossom)" : "var(--text-muted)" }}>
                      <input type="checkbox" checked={!!slot} onChange={() => toggleMemberSlot(m.id, m.name)} style={{ width: "auto" }} />
                      {m.name}
                      {slot && <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>×{memberTotal}</span>}
                    </label>
                    {form.versions.map((v) => (
                      <input key={v.id} type="number" min={0} value={slot?.countPerVersion[v.id] ?? 0}
                        disabled={!slot} onChange={(e) => updSlotCount(m.id, v.id, Number(e.target.value))}
                        style={{ textAlign: "center", opacity: slot ? 1 : 0.3 }} />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Joiners */}
        <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
          <label style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: "0.625rem" }}>
            Joiners — needs per version &amp; priority order
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: "0.75rem" }}>
            {joiners.map((j) => {
              const active = form.joiners.some((fj) => fj.joinerId === j.id);
              return (
                <button key={j.id} type="button" onClick={() => toggleJoiner(j.id, j.name)}
                  style={{ padding: "3px 10px", borderRadius: 99, fontSize: "0.78rem", cursor: "pointer", border: "1px solid", transition: "all 0.12s",
                    background: active ? "var(--accent-blossom)" : "transparent",
                    color: active ? "#0d0f14" : "var(--text-muted)",
                    borderColor: active ? "var(--accent-blossom)" : "var(--border)" }}>
                  {j.name}
                </button>
              );
            })}
          </div>

          {form.joiners.map((j) => (
            <div key={j.joinerId} style={{ background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)", padding: "0.875rem", marginBottom: "0.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>{j.joinerName}</span>
                <input type="datetime-local" value={j.submittedAt?.slice(0, 16) ?? ""}
                  onChange={(e) => updJoiner(j.joinerId, { ...j, submittedAt: e.target.value || undefined })}
                  style={{ fontSize: "0.72rem", width: 165 }} title="Submission timestamp (for timestamp sort)" />
              </div>
              {form.memberSlots.length > 0 && form.versions.length > 0 && (
                <JoinerEditor
                  joiner={j}
                  versions={form.versions}
                  memberSlots={form.memberSlots}
                  onChange={(updated) => updJoiner(j.joinerId, updated)} />
              )}
            </div>
          ))}
        </div>

        <FormActions onClose={onClose} submitLabel={isNew ? "Create Session" : "Save Changes"} />
      </form>
    </Modal>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function GomSorterPage() {
  const { sortingSessions, updateSortingSession, deleteSortingSession } = useApp();
  const [modal, setModal] = useState<{ session: SortingSession; isNew: boolean } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const emptySession = (): SortingSession => ({
    id: generateId("ss"), group: "", versions: [], memberSlots: [], joiners: [], notes: "",
  });

  return (
    <div className="fade-in">
      {modal && <SessionModal initial={modal.session} isNew={modal.isNew} onClose={() => setModal(null)} />}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 style={{ fontSize: "1.8rem" }}>PC Sorter</h1>
          <p className="text-secondary text-sm mt-1">Sort album photocards by version and priority</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({ session: emptySession(), isNew: true })}>+ New Session</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {sortingSessions.map((session) => {
          const isExpanded = expandedId === session.id;
          const totalPCs = session.versions.reduce((s, v) => s + v.totalPulled, 0);

          return (
            <div key={session.id} className="card" style={{ borderLeft: "3px solid var(--accent-lavender)" }}>
              <div className="flex justify-between items-center" style={{ cursor: "pointer" }} onClick={() => setExpandedId(isExpanded ? null : session.id)}>
                <div>
                  <div style={{ fontWeight: 700 }}>{session.group}
                    <span style={{ fontWeight: 400, color: "var(--text-muted)", marginLeft: 8, fontSize: "0.875rem" }}>
                      · {session.versions.length} ver · {totalPCs} PCs · {session.joiners.length} joiner{session.joiners.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {session.notes && <div className="text-muted text-xs mt-1">{session.notes}</div>}
                  {session.sortedAt && (
                    <div style={{ fontSize: "0.72rem", color: "var(--accent-mint)", marginTop: 2 }}>
                      ✓ Sorted · {session.sortMethod === "fair" ? "⚖️ Fair" : "⏱ Timestamp"} · {formatDateTime(session.sortedAt)}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                  <button className="btn btn-ghost" style={{ fontSize: "0.75rem", padding: "3px 8px" }} onClick={() => setModal({ session, isNew: false })}>Edit</button>
                  <button className="btn" style={{ fontSize: "0.75rem", padding: "3px 8px", color: "var(--status-unpaid)", borderColor: "#f4758a40", background: "transparent" }}
                    onClick={() => { if (confirm("Delete this session?")) deleteSortingSession(session.id); }}>Del</button>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{isExpanded ? "▲" : "▼"}</span>
                </div>
              </div>

              {isExpanded && (
                <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>

                  {/* Stock table */}
                  {session.memberSlots.length > 0 && (
                    <div style={{ marginBottom: "1rem" }}>
                      <div className="text-xs text-muted mb-2">STOCK BY MEMBER &amp; VERSION</div>
                      <div style={{ overflowX: "auto" }}>
                        <div style={{ display: "grid", gridTemplateColumns: `130px repeat(${session.versions.length}, 75px)`, gap: 4, marginBottom: 3, minWidth: "fit-content" }}>
                          <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Member</div>
                          {session.versions.map((v) => (
                            <div key={v.id} style={{ fontSize: "0.62rem", color: "var(--text-muted)", textTransform: "uppercase", textAlign: "center" }}>
                              {v.name} ({v.totalPulled})
                            </div>
                          ))}
                        </div>
                        {session.memberSlots.map((slot) => (
                          <div key={slot.memberId} style={{ display: "grid", gridTemplateColumns: `130px repeat(${session.versions.length}, 75px)`, gap: 4, marginBottom: 2, minWidth: "fit-content" }}>
                            <span style={{ fontSize: "0.82rem", color: "var(--accent-blossom)" }}>{slot.memberName}</span>
                            {session.versions.map((v) => (
                              <span key={v.id} style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.82rem", color: "var(--text-secondary)", textAlign: "center" }}>
                                {slot.countPerVersion[v.id] ?? 0}
                              </span>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Joiners summary */}
                  <div style={{ marginBottom: "1rem" }}>
                    <div className="text-xs text-muted mb-2">JOINERS</div>
                    {session.joiners.map((j) => (
                      <div key={j.joinerId} style={{ background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)", padding: "0.625rem 0.875rem", marginBottom: 4 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>{j.joinerName}</span>
                            {j.submittedAt && <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginLeft: 8 }}>· {formatDateTime(j.submittedAt)}</span>}
                          </div>
                          {/* Needed per version */}
                          <div style={{ display: "flex", gap: 6 }}>
                            {session.versions.map((v) => (
                              <span key={v.id} style={{ fontSize: "0.72rem", padding: "1px 7px", borderRadius: 99, background: "var(--bg)", border: "1px solid var(--border)" }}>
                                {v.name}: <strong style={{ color: "var(--accent-lavender)" }}>{j.neededPerVersion[v.id] ?? 0}</strong>
                              </span>
                            ))}
                          </div>
                        </div>
                        {/* Per-version priorities */}
                        <div style={{ marginTop: 6, display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                          {session.versions.map((v) => {
                            const prios = j.prioritiesByVersion[v.id] ?? [];
                            const needed = j.neededPerVersion[v.id] ?? 0;
                            if (needed === 0) return null;
                            return (
                              <div key={v.id}>
                                <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", marginBottom: 3 }}>{v.name}</div>
                                <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                                  {prios.map((memberId, rank) => {
                                    const slot = session.memberSlots.find((s) => s.memberId === memberId);
                                    return (
                                      <span key={memberId} style={{ fontSize: "0.68rem", padding: "1px 7px", borderRadius: 99, background: "var(--accent-blossom-dim)", color: "var(--accent-blossom)" }}>
                                        {rank + 1}. {slot?.memberName ?? memberId}
                                      </span>
                                    );
                                  })}
                                  {prios.length === 0 && <span className="text-muted text-xs">No priorities</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {/* Results */}
                        {j.assigned && j.assigned.length > 0 && (
                          <div style={{ marginTop: 6, display: "flex", gap: 4, flexWrap: "wrap" }}>
                            {j.assigned.map((a, i) => (
                              <span key={i} style={{ fontSize: "0.72rem", padding: "2px 8px", borderRadius: 99, background: "var(--accent-mint-dim)", color: "var(--accent-mint)" }}>
                                ✓ {a.memberName} · {a.versionName}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Sort controls */}
                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", paddingTop: "0.75rem", borderTop: "1px solid var(--border)" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", flex: 1 }}>Sort method:</span>
                    <button className="btn btn-ghost" style={{ fontSize: "0.82rem" }} onClick={() => {
                      const res = runSort(session, "timestamp");
                      updateSortingSession(session.id, { sortedAt: new Date().toISOString(), sortMethod: "timestamp", joiners: session.joiners.map((j) => ({ ...j, assigned: res[j.joinerId] ?? [] })) });
                    }}>⏱ By Timestamp</button>
                    <button className="btn btn-primary" style={{ fontSize: "0.82rem" }} onClick={() => {
                      const res = runSort(session, "fair");
                      updateSortingSession(session.id, { sortedAt: new Date().toISOString(), sortMethod: "fair", joiners: session.joiners.map((j) => ({ ...j, assigned: res[j.joinerId] ?? [] })) });
                    }}>⚖️ Fair Sort</button>
                    {session.sortedAt && (
                      <button className="btn btn-ghost" style={{ fontSize: "0.78rem", color: "var(--status-unpaid)" }} onClick={() =>
                        updateSortingSession(session.id, { sortedAt: undefined, sortMethod: undefined, joiners: session.joiners.map((j) => ({ ...j, assigned: undefined })) })}>
                        Reset
                      </button>
                    )}
                  </div>

                  {/* Results summary */}
                  {session.sortedAt && (
                    <div style={{ marginTop: "0.875rem", background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)", padding: "0.875rem" }}>
                      <div className="text-xs text-muted mb-3">RESULTS — {session.sortMethod === "fair" ? "⚖️ Fair" : "⏱ Timestamp"}</div>
                      {session.joiners.map((j) => {
                        const totalNeeded = Object.values(j.neededPerVersion).reduce((a, b) => a + b, 0);
                        const got = j.assigned?.length ?? 0;
                        return (
                          <div key={j.joinerId} style={{ padding: "6px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                              <span style={{ fontWeight: 500, fontSize: "0.875rem" }}>{j.joinerName}</span>
                              <span style={{ fontSize: "0.72rem", color: got < totalNeeded ? "var(--accent-gold)" : "var(--accent-mint)" }}>
                                {got}/{totalNeeded} PC{totalNeeded !== 1 ? "s" : ""} assigned
                                {got < totalNeeded && ` ⚠ ${totalNeeded - got} unassigned`}
                              </span>
                            </div>
                            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                              {(j.assigned ?? []).map((a, i) => (
                                <span key={i} className="badge badge-mint">✓ {a.memberName} ({a.versionName})</span>
                              ))}
                              {got === 0 && <span className="text-muted text-xs">None assigned</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {sortingSessions.length === 0 && (
          <div className="card" style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
            No sorting sessions yet ✦
          </div>
        )}
      </div>
    </div>
  );
}
