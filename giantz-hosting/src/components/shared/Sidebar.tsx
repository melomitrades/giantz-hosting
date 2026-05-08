"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Modal, { FormField, FormRow, FormActions } from "@/components/shared/Modal";
import { generateId } from "@/lib/utils";
import { User } from "@/types";

const JOINER_NAV = [
  { href: "/joiner/orders", label: "My Orders", icon: "📦" },
  { href: "/joiner/deadlines", label: "Deadlines", icon: "📅" },
  { href: "/joiner/status", label: "Order Status", icon: "🔍" },
  { href: "/joiner/boxes", label: "My Boxes", icon: "📫" },
];

const GOM_NAV = [
  { href: "/gom/orders", label: "All Orders", icon: "📋" },
  { href: "/gom/boxes", label: "Boxes", icon: "📦" },
  { href: "/gom/sending", label: "Sending Out", icon: "📬" },
  { href: "/gom/payments", label: "Payments", icon: "💸" },
  { href: "/gom/fancalls", label: "Fancalls / Shops", icon: "🎤" },
  { href: "/gom/addy", label: "K/C/J-Addy", icon: "📍" },
  { href: "/gom/sorter", label: "PC Sorter", icon: "🃏" },
  { href: "/gom/joiners", label: "Joiners", icon: "👥" },
];

function JoinerModal({ onClose }: { onClose: () => void }) {
  const { addUser } = useApp();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: User = {
      id: generateId("u"),
      name: name.trim(),
      role: "joiner",
      email: email.trim(),
    };
    addUser(newUser);
    onClose();
  };

  return (
    <Modal title="Add New Joiner" onClose={onClose} width={420}>
      <form onSubmit={submit}>
        <FormField label="Username / Display Name">
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. 소율 (Soyul)" autoFocus />
        </FormField>
        <div style={{ marginTop: "1rem" }}>
          <FormField label="Email (optional)">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="joiner@example.com" />
          </FormField>
        </div>
        <FormActions onClose={onClose} submitLabel="Add Joiner" />
      </form>
    </Modal>
  );
}

export default function Sidebar() {
  const { currentUser, users, setRole, switchToJoiner, notifications, markNotificationRead } = useApp();
  const pathname = usePathname();
  const isGom = currentUser.role === "gom";
  const nav = isGom ? GOM_NAV : JOINER_NAV;
  const joiners = users.filter((u) => u.role === "joiner");
  const [showJoinerModal, setShowJoinerModal] = useState(false);

  const myNotifs = notifications.filter(
    (n) => !n.read && (n.forRole === currentUser.role || n.forRole === "both")
  );

  return (
    <aside style={{
      width: 240, minHeight: "100vh", background: "var(--bg-card)",
      borderRight: "1px solid var(--border)", display: "flex",
      flexDirection: "column", padding: "1.5rem 0",
      position: "sticky", top: 0, flexShrink: 0,
    }}>
      {showJoinerModal && <JoinerModal onClose={() => setShowJoinerModal(false)} />}

      {/* Logo */}
      <div style={{ padding: "0 1.25rem 1.5rem" }}>
        <div style={{ fontSize: "1.3rem", fontFamily: "'DM Serif Display', serif", color: "var(--accent-blossom)" }}>✦ Group Orders</div>
        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 2 }}>GO Management</div>
      </div>

      {/* Role switcher */}
      <div style={{ margin: "0 1rem 0.75rem", background: "var(--bg-elevated)", borderRadius: "var(--radius-md)", padding: "4px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
        {(["joiner", "gom"] as const).map((role) => (
          <button key={role} onClick={() => setRole(role)}
            style={{ padding: "5px 0", borderRadius: "var(--radius-sm)", border: "none", cursor: "pointer", fontSize: "0.78rem", fontWeight: 500, transition: "all 0.15s",
              background: currentUser.role === role ? "var(--accent-blossom)" : "transparent",
              color: currentUser.role === role ? "#0d0f14" : "var(--text-muted)" }}>
            {role === "gom" ? "GOM" : "Joiner"}
          </button>
        ))}
      </div>

      {/* Joiner picker — only visible in Joiner mode */}
      {!isGom && (
        <div style={{ margin: "0 1rem 1rem" }}>
          <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 4 }}>Viewing as</div>
          <div style={{ display: "flex", gap: 4 }}>
            <select value={currentUser.id} onChange={(e) => switchToJoiner(e.target.value)}
              style={{ flex: 1, fontSize: "0.8rem", padding: "5px 8px" }}>
              {joiners.map((j) => <option key={j.id} value={j.id}>{j.name}</option>)}
            </select>
            <button onClick={() => setShowJoinerModal(true)}
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", cursor: "pointer", color: "var(--accent-blossom)", fontSize: "0.85rem", padding: "0 8px" }}>
              +
            </button>
          </div>
        </div>
      )}

      {/* User info */}
      <div style={{ padding: "0 1.25rem 1rem", borderBottom: "1px solid var(--border)" }}>
        <div style={{ fontSize: "0.85rem", fontWeight: 500 }}>{currentUser.name}</div>
        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{currentUser.role.toUpperCase()}</div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "1rem 0.75rem", display: "flex", flexDirection: "column", gap: 3 }}>
        {nav.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: "var(--radius-sm)", fontSize: "0.875rem", textDecoration: "none",
                color: active ? "var(--accent-blossom)" : "var(--text-secondary)",
                background: active ? "var(--accent-blossom-dim)" : "transparent",
                transition: "all 0.15s", fontWeight: active ? 600 : 400 }}>
              <span>{item.icon}</span>{item.label}
            </Link>
          );
        })}
      </nav>

      {/* Notifications */}
      {myNotifs.length > 0 && (
        <div style={{ margin: "0 0.75rem", background: "var(--bg-elevated)", borderRadius: "var(--radius-md)", padding: "0.75rem", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
            🔔 Notifications ({myNotifs.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {myNotifs.slice(0, 3).map((n) => (
              <div key={n.id} onClick={() => markNotificationRead(n.id)}
                style={{ fontSize: "0.75rem", color: "var(--text-secondary)", cursor: "pointer", lineHeight: 1.4, padding: "4px 6px", borderRadius: "var(--radius-sm)", background: "var(--bg-card)", borderLeft: "2px solid var(--accent-blossom)" }}>
                {n.message}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ padding: "1rem 1.25rem 0", marginTop: "0.5rem" }}>
        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>✦ biasroom • {new Date().getFullYear()}</div>
      </div>
    </aside>
  );
}
