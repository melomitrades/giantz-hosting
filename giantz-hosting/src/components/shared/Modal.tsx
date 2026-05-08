"use client";

import { useEffect, ReactNode } from "react";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  width?: number;
}

export default function Modal({ title, onClose, children, width = 560 }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    // Lock body scroll while modal is open so page doesn't scroll behind it
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
        overflowY: "auto",
        padding: "2rem 1rem",
        minHeight: "100vh",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="fade-in"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
          width: "100%", maxWidth: width,
          margin: "0 auto",
          padding: "1.75rem",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontFamily: "'DM Serif Display', serif" }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: "var(--bg-elevated)", border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)", padding: "4px 10px",
              color: "var(--text-muted)", cursor: "pointer", fontSize: "1rem", lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function FormRow({ children, cols = 1 }: { children: ReactNode; cols?: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: "1rem", marginBottom: "1rem" }}>
      {children}
    </div>
  );
}

export function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", marginBottom: 5, color: "var(--text-muted)", fontSize: "0.78rem", letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

export function FormActions({ onClose, submitLabel = "Save" }: { onClose: () => void; submitLabel?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
      <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
      <button type="submit" className="btn btn-primary">{submitLabel}</button>
    </div>
  );
}
