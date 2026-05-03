"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { formatKRW } from "@/lib/utils";

export default function JoinerBoxesPage() {
  const { boxes, shopOrders, currentUser } = useApp();
  const [currency, setCurrency] = useState<"EUR" | "KRW">("EUR");

  const myBoxes = boxes.filter((b) => b.joinerFees.some((f) => f.joinerId === currentUser.id));

  const fmt = (val: number) => currency === "EUR" ? `€${val.toFixed(2)}` : formatKRW(val);

  return (
    <div className="fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 style={{ fontSize: "1.8rem" }}>My Boxes</h1>
          <p className="text-secondary text-sm mt-1">EMS & customs fees for your orders</p>
        </div>
        <div style={{ display: "flex", background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)", padding: 3, gap: 3 }}>
          {(["EUR", "KRW"] as const).map((c) => (
            <button key={c} onClick={() => setCurrency(c)}
              style={{ padding: "5px 14px", borderRadius: "var(--radius-sm)", border: "none", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600,
                background: currency === c ? "var(--accent-gold)" : "transparent", color: currency === c ? "#0d0f14" : "var(--text-muted)" }}>
              {c === "EUR" ? "€ EUR" : "₩ KRW"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {myBoxes.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>No boxes assigned to you yet ✦</div>
        ) : (
          myBoxes.map((box) => {
            const myFee = box.joinerFees.find((f) => f.joinerId === currentUser.id)!;
            const linkedOrders = shopOrders.filter((o) => box.shopOrderIds.includes(o.id));
            const allPaid = myFee.emsPaid && myFee.customsPaid;
            const emsShare = currency === "EUR" ? myFee.emsShareEur : myFee.emsShareKrw;
            const customsShare = currency === "EUR" ? myFee.customsShareEur : myFee.customsShareKrw;
            const totalShare = currency === "EUR" ? myFee.emsShareEur + myFee.customsShareEur : myFee.emsShareKrw + myFee.customsShareKrw;

            return (
              <div key={box.id} className="card" style={{ borderLeft: `3px solid ${allPaid ? "var(--accent-mint)" : "var(--accent-lavender)"}` }}>
                <div className="flex justify-between items-center">
                  <div>
                    <div style={{ fontWeight: 700 }}>{box.name}</div>
                    <div className="text-secondary text-sm mt-1">{linkedOrders.map((o) => `${o.group} · ${o.shop}`).join(", ")}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="badge" style={{ background: allPaid ? "var(--accent-mint-dim)" : "#f4758a20", color: allPaid ? "var(--accent-mint)" : "var(--status-unpaid)" }}>
                      {allPaid ? "✓ All Paid" : !myFee.emsPaid && !myFee.customsPaid ? "Unpaid" : "Partially Paid"}
                    </span>
                    <span style={{ fontFamily: "'DM Mono', monospace", color: "var(--accent-gold)", fontSize: "0.95rem", fontWeight: 700 }}>{fmt(totalShare)}</span>
                  </div>
                </div>

                <div style={{ marginTop: "0.875rem", paddingTop: "0.875rem", borderTop: "1px solid var(--border)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "0.875rem" }}>
                    {/* EMS */}
                    <div style={{ background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)", padding: "0.75rem", border: `1px solid ${myFee.emsPaid ? "var(--accent-lavender-dim)" : "var(--border)"}` }}>
                      <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>EMS Share</div>
                      <div style={{ fontFamily: "'DM Mono', monospace", color: "var(--accent-lavender)", fontSize: "1rem", fontWeight: 700 }}>{fmt(emsShare)}</div>
                      <div style={{ marginTop: 6 }}>
                        <span style={{ fontSize: "0.72rem", padding: "2px 7px", borderRadius: 99, background: myFee.emsPaid ? "var(--accent-lavender-dim)" : "var(--bg)", color: myFee.emsPaid ? "var(--accent-lavender)" : "var(--text-muted)", border: "1px solid currentColor" }}>
                          {myFee.emsPaid ? "✓ Paid" : "Unpaid"}
                        </span>
                      </div>
                    </div>
                    {/* Customs */}
                    <div style={{ background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)", padding: "0.75rem", border: `1px solid ${myFee.customsPaid ? "var(--accent-gold-dim)" : "var(--border)"}` }}>
                      <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>Customs Share</div>
                      <div style={{ fontFamily: "'DM Mono', monospace", color: "var(--accent-gold)", fontSize: "1rem", fontWeight: 700 }}>{fmt(customsShare)}</div>
                      <div style={{ marginTop: 6 }}>
                        <span style={{ fontSize: "0.72rem", padding: "2px 7px", borderRadius: 99, background: myFee.customsPaid ? "var(--accent-gold-dim)" : "var(--bg)", color: myFee.customsPaid ? "var(--accent-gold)" : "var(--text-muted)", border: "1px solid currentColor" }}>
                          {myFee.customsPaid ? "✓ Paid" : "Unpaid"}
                        </span>
                      </div>
                    </div>
                    {/* Total */}
                    <div style={{ background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)", padding: "0.75rem" }}>
                      <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>Total · {myFee.totalPoints} pts</div>
                      <div style={{ fontFamily: "'DM Mono', monospace", color: "var(--accent-mint)", fontSize: "1rem", fontWeight: 700 }}>{fmt(totalShare)}</div>
                    </div>
                  </div>

                  {(!myFee.emsPaid || !myFee.customsPaid) && (
                    <div style={{ padding: "0.75rem", background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                      💸 Please send the GOM:
                      {!myFee.emsPaid && <span style={{ color: "var(--accent-lavender)", fontWeight: 600 }}> {fmt(emsShare)} (EMS)</span>}
                      {!myFee.emsPaid && !myFee.customsPaid && " + "}
                      {!myFee.customsPaid && <span style={{ color: "var(--accent-gold)", fontWeight: 600 }}>{fmt(customsShare)} (Customs)</span>}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
