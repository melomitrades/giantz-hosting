import { FeeCalculation, ShopOrder } from "@/types";

// ─── Formatting ───────────────────────────────────────────────────────────────

export function formatKRW(amount: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

// ─── Deadline Helpers ─────────────────────────────────────────────────────────

export function getDeadlineUrgency(iso: string): "overdue" | "critical" | "soon" | "ok" {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return "overdue";
  if (diff < 3600000) return "critical"; // < 1h
  if (diff < 86400000) return "soon";   // < 24h
  return "ok";
}

export function timeUntilDeadline(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return "Overdue";
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h left`;
  if (hours > 0) return `${hours}h left`;
  const mins = Math.floor(diff / 60000);
  return `${mins}m left`;
}

// ─── Fee Calculator ───────────────────────────────────────────────────────────

interface JoinerItemGroup {
  joinerId: string;
  joinerName: string;
  items: { weightPoints: number; quantity: number }[];
}

export function calculateFees(
  joinerGroups: JoinerItemGroup[],
  boxPrice: number
): FeeCalculation["items"] {
  const totalPoints = joinerGroups.reduce(
    (sum, jg) => sum + jg.items.reduce((s, i) => s + i.weightPoints * i.quantity, 0), 0
  );
  return joinerGroups.map((jg) => {
    const joinerPoints = jg.items.reduce((acc, i) => acc + i.weightPoints * i.quantity, 0);
    return {
      joinerId: jg.joinerId,
      joinerName: jg.joinerName,
      totalPoints: joinerPoints,
      emsShare: totalPoints > 0 ? Math.round((joinerPoints / totalPoints) * boxPrice) : 0,
    };
  });
}

// ─── Shop Order Total ──────────────────────────────────────────────────────────

export function shopOrderTotal(order: ShopOrder): number {
  return order.joiners.reduce(
    (sum, j) => sum + j.items.reduce((s, it) => s + it.pricePerUnit * it.quantity, 0), 0
  );
}

// ─── Status Label Maps ────────────────────────────────────────────────────────

export const FULFILLMENT_LABELS: Record<string, string> = {
  ordered: "Ordered",
  received_at_kaddy: "At Kaddy",
  otw_to_gom: "OTW to GOM",
  arrived_to_gom: "At GOM",
};

export const SHIPPING_STATUS_LABELS: Record<string, string> = {
  unpacked: "Unpacked",
  packing: "Packing",
  sorting: "Sorting",
  sent: "Sent ✓",
};

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  unpaid: "text-rose-400",
  paid: "text-emerald-400",
};

// ─── ID Generator ─────────────────────────────────────────────────────────────

export function generateId(prefix = "id"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function formatEur(amount: number): string {
  return `€${amount.toFixed(2)}`;
}
