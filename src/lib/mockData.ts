import {
  ShopOrder, ShippingPackage, PaymentRecord, Fancall, Shop, AddyItem,
  Notification, User, FeeCalculation, WeightCategory, KnownGroup, Box,
} from "@/types";

export const MOCK_USERS: User[] = [
  { id: "u1", name: "소율 (Soyul)", role: "joiner", email: "soyul@example.com" },
  { id: "u2", name: "미래 (Mirae)", role: "joiner", email: "mirae@example.com" },
  { id: "u3", name: "하늘 (Haneul)", role: "joiner", email: "haneul@example.com" },
  { id: "u4", name: "GOM Admin", role: "gom", email: "gom@example.com" },
];

export const MOCK_WEIGHT_CATEGORIES: WeightCategory[] = [
  { id: "wc1", name: "PC",        points: 1 },
  { id: "wc2", name: "Photobook", points: 5 },
  { id: "wc3", name: "Album",     points: 3 },
  { id: "wc4", name: "Poster",    points: 2 },
  { id: "wc5", name: "Other",     points: 2 },
];

export const MOCK_KNOWN_GROUPS: KnownGroup[] = [
  {
    id: "kg1", name: "SEVENTEEN",
    members: [
      { id: "m1", name: "S.Coups" }, { id: "m2", name: "Jeonghan" },
      { id: "m3", name: "Joshua" },  { id: "m4", name: "Jun" },
      { id: "m5", name: "Hoshi" },   { id: "m6", name: "Wonwoo" },
      { id: "m7", name: "Woozi" },   { id: "m8", name: "The8" },
      { id: "m9", name: "Mingyu" },  { id: "m10", name: "DK" },
      { id: "m11", name: "Seungkwan" }, { id: "m12", name: "Vernon" },
      { id: "m13", name: "Dino" },
    ],
  },
  {
    id: "kg2", name: "aespa",
    members: [
      { id: "m14", name: "Karina" }, { id: "m15", name: "Giselle" },
      { id: "m16", name: "Winter" }, { id: "m17", name: "Ningning" },
    ],
  },
  {
    id: "kg3", name: "IVE",
    members: [
      { id: "m18", name: "Yujin" }, { id: "m19", name: "Gaeul" },
      { id: "m20", name: "Rei" },   { id: "m21", name: "Wonyoung" },
      { id: "m22", name: "Liz" },   { id: "m23", name: "Leeseo" },
    ],
  },
  {
    id: "kg4", name: "BTS",
    members: [
      { id: "m24", name: "RM" },   { id: "m25", name: "Jin" },
      { id: "m26", name: "Suga" }, { id: "m27", name: "J-Hope" },
      { id: "m28", name: "Jimin" },{ id: "m29", name: "V" },
      { id: "m30", name: "Jungkook" },
    ],
  },
];

export const MOCK_SHOP_ORDERS: ShopOrder[] = [
  {
    id: "so1",
    orderType: "group" as const,
    group: "SEVENTEEN",
    shop: "Weverse Shop",
    dateOfOrder: "2025-03-01T10:00:00Z",
    fulfillmentStatus: "ordered",
    shopDeadline: "2025-04-05T23:59:00Z",
    pricingOptions: [
      { id: "po1", label: "POB only", priceEur: 12, weightCategoryId: "wc1" },
      { id: "po2", label: "POB + inclusions", priceEur: 13.5, weightCategoryId: "wc1" },
    ],
    joiners: [
      {
        id: "je1", joinerId: "u1", joinerName: "소율 (Soyul)",
        items: [
          { id: "ci1", name: "Photocard Set", quantity: 2, membersClaimed: [{ memberId: "m9", memberName: "Mingyu" }, { memberId: "m7", memberName: "Woozi" }], pricingOptionId: "po1", pricePerUnit: 12, weightCategoryId: "wc1", inclusions: "" },
          { id: "ci2", name: "Photobook", quantity: 1, membersClaimed: [{ memberId: "m9", memberName: "Mingyu" }], pricingOptionId: "po2", pricePerUnit: 13.5, weightCategoryId: "wc1", inclusions: "Random PC ×1" },
        ],
        paymentStatus: "unpaid",
        deadline: "2025-04-01T23:59:00Z",
      },
      {
        id: "je2", joinerId: "u2", joinerName: "미래 (Mirae)",
        items: [
          { id: "ci3", name: "Album Ver.A", quantity: 1, membersClaimed: [{ memberId: "m3", memberName: "Joshua" }], pricingOptionId: "custom", pricePerUnit: 18, weightCategoryId: "wc3", inclusions: "Random PC ×1, Poster ×1" },
        ],
        paymentStatus: "paid",
        paymentProofUrl: "https://example.com/proof1.jpg",
        deadline: "2025-04-01T23:59:00Z",
      },
    ],
    notes: "Make sure to order before stock runs out!",
  },
  {
    id: "so2",
    orderType: "group" as const,
    group: "aespa",
    shop: "SM Store",
    dateOfOrder: "2025-03-05T14:00:00Z",
    fulfillmentStatus: "received_at_kaddy",
    pricingOptions: [
      { id: "po3", label: "POB only", priceEur: 15, weightCategoryId: "wc1" },
      { id: "po4", label: "POB + inclusions", priceEur: 18, weightCategoryId: "wc1" },
    ],
    joiners: [
      {
        id: "je3", joinerId: "u3", joinerName: "하늘 (Haneul)",
        items: [
          { id: "ci4", name: "Mini Album", quantity: 2, membersClaimed: [{ memberId: "m14", memberName: "Karina" }, { memberId: "m16", memberName: "Winter" }], pricingOptionId: "po4", pricePerUnit: 18, weightCategoryId: "wc1", inclusions: "Random PC ×1" },
        ],
        paymentStatus: "paid",
        paymentProofUrl: "https://example.com/proof2.jpg",
      },
    ],
  },
];

export const MOCK_SHIPPING: ShippingPackage[] = [
  {
    id: "sp1", joinerId: "u1", joinerName: "소율 (Soyul)",
    courier: "EMS", address: "123 Rue de la Paix, Paris 75001, France",
    shippingStatus: "packing", weightType: "package", weightKg: 1.2,
    shippingDeadline: "2025-04-10T23:59:00Z",
    miscNotes: "Fragile items, please wrap well",
    shopOrderIds: ["so1"],
  },
  {
    id: "sp2", joinerId: "u3", joinerName: "하늘 (Haneul)",
    courier: "K-Packet", address: "456 Baker Street, London W1U 6EJ, UK",
    shippingStatus: "sent", weightType: "package", weightKg: 0.8,
    shopOrderIds: ["so2"],
  },
];

export const MOCK_PAYMENTS: PaymentRecord[] = [
  {
    id: "pay1", recipientType: "shop", recipientName: "Weverse Shop",
    amountSentSenderCurrency: 120, senderCurrency: "EUR",
    amountSentReceiverCurrency: 170000, receiverCurrency: "KRW",
    paymentMethod: "wise", shopOrderId: "so1", paidAt: "2025-03-02T10:00:00Z",
    coveringLog: { amountToSend: 169000, amountClaimed: 165000, coverOrExcess: 4000 },
  },
  {
    id: "pay2", recipientType: "kaddy", recipientName: "K-Addy Seoul",
    amountSentSenderCurrency: 25, senderCurrency: "EUR",
    amountSentReceiverCurrency: 35000, receiverCurrency: "KRW",
    paymentMethod: "bank_transfer", paidAt: "2025-03-15T14:00:00Z",
  },
];

export const MOCK_FANCALLS: Fancall[] = [
  {
    id: "fc1", shop: "Weverse", resultPage: "https://weverse.io/results/fc1",
    dateTime: "2025-03-20T15:00:00Z",
    enteredByJoinerId: "u1", enteredByJoinerName: "소율 (Soyul)",
    won: true, received: false, benefitsToKaddy: "Extra photocard set",
  },
];

export const MOCK_SHOPS: Shop[] = [
  { id: "sh1", name: "Weverse Shop", acceptsEnglishWebsiteShippingToKorea: true, acceptsIdOrPassport: false, url: "https://shop.weverse.io" },
  { id: "sh2", name: "SM Store", acceptsEnglishWebsiteShippingToKorea: true, acceptsIdOrPassport: true, url: "https://store.smtown.com" },
  { id: "sh3", name: "Makestar", acceptsEnglishWebsiteShippingToKorea: false, acceptsIdOrPassport: false, url: "https://www.makestar.co", notes: "Korean website only, need proxy" },
];

export const MOCK_ADDY: AddyItem[] = [
  {
    id: "ad1", country: "korea",
    joinerId: "u1", shopOrderId: "so1",
    arrivedItems: "SEVENTEEN Photocard Set ×2, Photobook ×1",
    arrivedAt: "2025-03-18T09:00:00Z",
  },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: "n1", type: "deadline_24h", message: "Deadline for SEVENTEEN – Weverse Shop is in 24 hours!", relatedOrderId: "so1", forRole: "joiner", createdAt: new Date(Date.now() - 3600000).toISOString(), read: false },
  { id: "n2", type: "payment_submitted", message: "미래 (Mirae) has submitted a payment proof", relatedOrderId: "so1", forRole: "gom", createdAt: new Date(Date.now() - 7200000).toISOString(), read: false },
];

export const MOCK_FEE_CALCULATION: FeeCalculation = {
  id: "fee1", batchId: "batch1", boxPrice: 50000, totalPoints: 14,
  items: [
    { joinerId: "u1", joinerName: "소율 (Soyul)", totalPoints: 6, emsShare: 21428 },
    { joinerId: "u2", joinerName: "미래 (Mirae)", totalPoints: 3, emsShare: 10714 },
    { joinerId: "u3", joinerName: "하늘 (Haneul)", totalPoints: 5, emsShare: 17857 },
  ],
  calculatedAt: "2025-03-15T12:00:00Z",
};

export const MOCK_BOXES: Box[] = [
  {
    id: "bx1",
    name: "Box 1 — March EMS",
    shopOrderIds: ["so1"],
    emsCostEur: 34,
    emsCostKrw: 50320,
    customsCostEur: 12,
    customsCostKrw: 17760,
    exchangeRate: 1480,
    joinerFees: [
      { joinerId: "u1", joinerName: "소율 (Soyul)", totalPoints: 7, emsShareEur: 20, emsShareKrw: 29600, customsShareEur: 7.5, customsShareKrw: 11100, emsPaid: true, customsPaid: false },
      { joinerId: "u2", joinerName: "미래 (Mirae)", totalPoints: 3, emsShareEur: 14, emsShareKrw: 20720, customsShareEur: 4.5, customsShareKrw: 6660, emsPaid: false, customsPaid: false },
    ],
    notes: "SEVENTEEN Weverse batch",
  },
];

import { AddyAddresses, SortingSession } from "@/types";

export const MOCK_ADDY_ADDRESSES: AddyAddresses = {
  korea: "서울특별시 마포구 ...",
  china: "上海市...",
  japan: "〒100-0000 東京都...",
  other: "",
};

export const MOCK_SORTING_SESSIONS: SortingSession[] = [
  {
    id: "ss1",
    group: "SEVENTEEN",
    versions: [
      { id: "v1", name: "Ver.A", totalPulled: 4 },
      { id: "v2", name: "Ver.B", totalPulled: 3 },
    ],
    memberSlots: [
      { memberId: "m9", memberName: "Mingyu", countPerVersion: { v1: 2, v2: 1 } },
      { memberId: "m7", memberName: "Woozi",  countPerVersion: { v1: 2, v2: 2 } },
    ],
    joiners: [
      { joinerId: "u1", joinerName: "소율 (Soyul)", neededPerVersion: { v1: 1, v2: 1 }, prioritiesByVersion: { v1: ["m9", "m7"], v2: ["m7", "m9"] }, submittedAt: "2025-03-01T10:00:00Z" },
      { joinerId: "u2", joinerName: "미래 (Mirae)", neededPerVersion: { v1: 1, v2: 0 }, prioritiesByVersion: { v1: ["m9", "m7"], v2: [] }, submittedAt: "2025-03-01T11:00:00Z" },
    ],
    notes: "SEVENTEEN Weverse Shop batch",
  },
];
