// ─── Users ───────────────────────────────────────────────────────────────────

export type UserRole = "joiner" | "gom";

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
}

// ─── Weight Categories (fully dynamic, managed by GOM) ───────────────────────

export interface WeightCategory {
  id: string;
  name: string;   // e.g. "PC", "Photobook", "Album"
  points: number; // weight points
}

// ─── Known Groups & Members ───────────────────────────────────────────────────

export interface KnownMember {
  id: string;
  name: string;      // e.g. "S.Coups"
  stageName?: string;
}

export interface KnownGroup {
  id: string;
  name: string;      // e.g. "SEVENTEEN"
  members: KnownMember[];
}

// ─── Shop Orders (new shop-based structure) ───────────────────────────────────

export type OrderFulfillmentStatus =
  | "ordered"
  | "received_at_kaddy"
  | "otw_to_gom"
  | "arrived_to_gom";

export type JoinerPaymentStatus = "unpaid" | "paid";

// Pricing option defined at the order level (shared across all joiners)
export interface PricingOption {
  id: string;
  label: string;          // e.g. "POB only", "POB + inclusions", "Custom"
  priceEur: number;       // price in EUR
  weightCategoryId: string; // auto-applied weight category
}

// A joiner's claimed item references one of the order-level pricing options
export interface ClaimedItem {
  id: string;
  name?: string;            // optional item description e.g. "Photocard ver.A"
  quantity: number;         // auto-set to number of members if members selected
  membersClaimed: MemberClaim[]; // which members this item is for (per-item)
  pricingOptionId: string;  // references PricingOption.id; "custom" = manual override
  pricePerUnit: number;     // auto-filled from PricingOption, or manual if custom
  weightCategoryId: string; // auto-filled from PricingOption, or manual if custom
  inclusions: string;
}

export interface MemberClaim {
  memberId: string;         // KnownMember.id or "custom"
  memberName: string;
}

export interface JoinerEntry {
  id: string;
  joinerId: string;
  joinerName: string;
  items: ClaimedItem[];
  paymentStatus: JoinerPaymentStatus;
  paymentProofUrl?: string;
  deadline?: string;
}

// One ShopOrder = one group order for a specific shop
export interface ShopOrder {
  id: string;
  group: string;
  shop: string;
  dateOfOrder: string;
  fulfillmentStatus: OrderFulfillmentStatus;
  round?: string;
  isFancall?: boolean;       // if true, a fancall entry is auto-linked
  pricingOptions: PricingOption[]; // defined once per order, reused by all joiners
  shopDeadline?: string;
  joiners: JoinerEntry[];
  notes?: string;
}

// ─── Shipping / Sending Out ───────────────────────────────────────────────────

export type ShippingStatus = "unpacked" | "packing" | "sorting" | "sent";
export type WeightType = "letter" | "package";

export interface ShippingPackage {
  id: string;
  joinerId: string;
  joinerName: string;
  courier: string;
  address: string;
  shippingStatus: ShippingStatus;
  weightType: WeightType;
  weightKg?: number;
  claimsPictureUrl?: string;
  shippingDeadline?: string;
  miscNotes?: string;
  shopOrderIds: string[];
}

// ─── Fees ─────────────────────────────────────────────────────────────────────

export interface FeeCalculation {
  id: string;
  batchId: string;
  boxPrice: number;
  items: {
    joinerId: string;
    joinerName: string;
    totalPoints: number;
    emsShare: number;
  }[];
  totalPoints: number;
  calculatedAt: string;
}

// ─── Payment Tracker ─────────────────────────────────────────────────────────

export type PaymentRecipientType = "kaddy" | "shop" | "proxy" | "seller";
export type PaymentMethod = "bank_transfer" | "paypal" | "wise" | "other";

export interface PaymentRecord {
  id: string;
  recipientType: PaymentRecipientType;
  recipientName: string;
  amountSentSenderCurrency: number;
  senderCurrency: string;
  amountSentReceiverCurrency: number;
  receiverCurrency: string;
  paymentMethod: PaymentMethod;
  shopOrderId?: string;
  paidAt: string;
  coveringLog?: {
    amountToSend: number;
    amountClaimed: number;
    coverOrExcess: number;
  };
}

// ─── Fancalls ────────────────────────────────────────────────────────────────

export interface Fancall {
  id: string;
  shop: string;
  resultPage?: string;
  dateTime: string;
  enteredByJoinerId: string;
  enteredByJoinerName: string;
  won: boolean;
  received: boolean;
  benefitsToKaddy?: string;
  shopOrderId?: string;
}

// ─── Shops ───────────────────────────────────────────────────────────────────

export interface Shop {
  id: string;
  name: string;
  acceptsEnglishWebsiteShippingToKorea: boolean;
  acceptsIdOrPassport: boolean;
  url?: string;
  notes?: string;
}

// ─── Addy Tracker ────────────────────────────────────────────────────────────

export type AddyCountry = "korea" | "china" | "japan" | "other";

export interface AddyItem {
  id: string;
  country: AddyCountry;
  joinerId?: string;
  shopOrderId?: string;
  arrivedItems: string;
  pictureUrl?: string;
  arrivedAt: string;
}


// ─── Per-country addy addresses (global, editable by GOM) ────────────────────

export interface AddyAddresses {
  korea: string;
  china: string;
  japan: string;
  other: string;
}

// ─── Notifications ───────────────────────────────────────────────────────────

export type NotificationType =
  | "order_status_update"
  | "deadline_new"
  | "deadline_48h"
  | "deadline_24h"
  | "deadline_1h"
  | "payment_submitted";

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  relatedOrderId?: string;
  forRole: UserRole | "both";
  createdAt: string;
  read: boolean;
}

// ─── Box (groups orders for EMS/customs calculation) ─────────────────────────

export interface BoxJoinerFee {
  joinerId: string;
  joinerName: string;
  totalPoints: number;
  emsShareEur: number;
  emsShareKrw: number;
  customsShareEur: number;
  customsShareKrw: number;
  emsPaid: boolean;
  customsPaid: boolean;
  feeProofUrl?: string;
}

export interface Box {
  id: string;
  name: string;
  shopOrderIds: string[];
  emsCostEur: number;
  emsCostKrw: number;
  customsCostEur: number;
  customsCostKrw: number;
  exchangeRate: number;
  joinerFees: BoxJoinerFee[];
  sentAt?: string;
  notes?: string;
}

// ─── PC Sorter ────────────────────────────────────────────────────────────────

export interface PcVersion {
  id: string;
  name: string;          // e.g. "Ver.A"
  totalPulled: number;   // total photocards pulled for this version
}

export interface PcMemberSlot {
  memberId: string;
  memberName: string;
  countPerVersion: Record<string, number>; // versionId → how many PCs of that version
}

export interface AssignedPc {
  memberId: string;
  memberName: string;
  versionId: string;
  versionName: string;
}

export interface SorterJoiner {
  joinerId: string;
  joinerName: string;
  // how many PCs needed per version (versionId → count)
  neededPerVersion: Record<string, number>;
  // priority list per version: versionId → ordered memberIds (most wanted first)
  prioritiesByVersion: Record<string, string[]>;
  submittedAt?: string;
  assigned?: AssignedPc[];
}

export interface SortingSession {
  id: string;
  group: string;
  versions: PcVersion[];
  memberSlots: PcMemberSlot[];   // how many PCs per member per version
  joiners: SorterJoiner[];
  sortedAt?: string;
  sortMethod?: "timestamp" | "fair";
  notes?: string;
}
