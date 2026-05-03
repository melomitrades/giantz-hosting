"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import {
  ShopOrder, ShippingPackage, PaymentRecord, Fancall, Shop, AddyItem,
  Notification, User, UserRole, WeightCategory, KnownGroup, Box,
  AddyAddresses, SortingSession,
} from "@/types";

// ── API helpers ───────────────────────────────────────────────────────────────
async function api(path: string, method = "GET", body?: unknown) {
  const res = await fetch(`/api/${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

const get = (path: string) => api(path);
const post = (path: string, body: unknown) => api(path, "POST", body);
const put = (path: string, body: unknown) => api(path, "PUT", body);
const del = (path: string) => api(path, "DELETE");

// ── Context type ──────────────────────────────────────────────────────────────
interface AppContextValue {
  currentUser: User;
  users: User[];
  shopOrders: ShopOrder[];
  shipping: ShippingPackage[];
  payments: PaymentRecord[];
  fancalls: Fancall[];
  shops: Shop[];
  addyItems: AddyItem[];
  notifications: Notification[];
  weightCategories: WeightCategory[];
  knownGroups: KnownGroup[];
  boxes: Box[];
  addyAddresses: AddyAddresses;
  sortingSessions: SortingSession[];
  eurToKrw: number;
  loading: boolean;
  unreadCount: number;

  setRole: (role: UserRole) => void;
  switchToJoiner: (id: string) => void;
  markNotificationRead: (id: string) => void;

  addUser: (u: User) => Promise<void>;
  updateUser: (id: string, u: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;

  addShopOrder: (o: ShopOrder) => Promise<void>;
  updateShopOrder: (id: string, u: Partial<ShopOrder>) => Promise<void>;
  deleteShopOrder: (id: string) => Promise<void>;

  addShipping: (p: ShippingPackage) => Promise<void>;
  updateShipping: (id: string, u: Partial<ShippingPackage>) => Promise<void>;
  deleteShipping: (id: string) => Promise<void>;

  addPayment: (p: PaymentRecord) => Promise<void>;
  updatePayment: (id: string, u: Partial<PaymentRecord>) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;

  addFancall: (f: Fancall) => Promise<void>;
  updateFancall: (id: string, u: Partial<Fancall>) => Promise<void>;
  deleteFancall: (id: string) => Promise<void>;

  addShop: (s: Shop) => Promise<void>;
  updateShop: (id: string, u: Partial<Shop>) => Promise<void>;
  deleteShop: (id: string) => Promise<void>;

  addAddyItem: (a: AddyItem) => Promise<void>;
  updateAddyItem: (id: string, u: Partial<AddyItem>) => Promise<void>;
  deleteAddyItem: (id: string) => Promise<void>;

  addWeightCategory: (w: WeightCategory) => Promise<void>;
  updateWeightCategory: (id: string, u: Partial<WeightCategory>) => Promise<void>;
  deleteWeightCategory: (id: string) => Promise<void>;

  addKnownGroup: (g: KnownGroup) => Promise<void>;
  updateKnownGroup: (id: string, u: Partial<KnownGroup>) => Promise<void>;
  deleteKnownGroup: (id: string) => Promise<void>;

  addBox: (b: Box) => Promise<void>;
  updateBox: (id: string, u: Partial<Box>) => Promise<void>;
  deleteBox: (id: string) => Promise<void>;

  setAddyAddresses: (a: AddyAddresses) => Promise<void>;

  addSortingSession: (s: SortingSession) => Promise<void>;
  updateSortingSession: (id: string, u: Partial<SortingSession>) => Promise<void>;
  deleteSortingSession: (id: string) => Promise<void>;

  setEurToKrw: (rate: number) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

// ── Fallback empty state (shown while loading) ────────────────────────────────
const EMPTY_ADDRESSES: AddyAddresses = { korea: "", china: "", japan: "", other: "" };
const DEFAULT_GOM: User = { id: "u4", name: "GOM Admin", role: "gom", email: "" };

export function AppProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_GOM);
  const [shopOrders, setShopOrders] = useState<ShopOrder[]>([]);
  const [shipping, setShipping] = useState<ShippingPackage[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [fancalls, setFancalls] = useState<Fancall[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [addyItems, setAddyItems] = useState<AddyItem[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [weightCategories, setWeightCategories] = useState<WeightCategory[]>([]);
  const [knownGroups, setKnownGroups] = useState<KnownGroup[]>([]);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [addyAddresses, setAddyAddressesState] = useState<AddyAddresses>(EMPTY_ADDRESSES);
  const [sortingSessions, setSortingSessions] = useState<SortingSession[]>([]);
  const [eurToKrw, setEurToKrw] = useState(1480);

  // ── Load all data on mount ─────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      get("users"),
      get("known-groups"),
      get("weight-categories"),
      get("shops"),
      get("shop-orders"),
      get("fancalls"),
      get("shipping"),
      get("payments"),
      get("addy"),
      get("addy-addresses"),
      get("boxes"),
      get("sorting-sessions"),
      get("notifications"),
    ]).then(([u, kg, wc, sh, so, fc, sp, pay, addy, addyAddr, bx, ss, notifs]) => {
      setUsers(u);
      setCurrentUser(u.find((x: User) => x.role === "gom") ?? DEFAULT_GOM);
      setKnownGroups(kg);
      setWeightCategories(wc);
      setShops(sh);
      setShopOrders(so);
      setFancalls(fc);
      setShipping(sp);
      setPayments(pay);
      setAddyItems(addy);
      setAddyAddressesState(addyAddr);
      setBoxes(bx);
      setSortingSessions(ss);
      setNotifications(notifs);
      setLoading(false);
    }).catch((e) => {
      console.error("Failed to load data:", e);
      setLoading(false);
    });
  }, []);

  // ── Role switching (local only) ────────────────────────────────────────────
  const setRole = useCallback((role: UserRole) => {
    setCurrentUser((prev) => {
      if (prev.role === role) return prev;
      return users.find((u) => u.role === role) ?? prev;
    });
  }, [users]);

  const switchToJoiner = useCallback((id: string) => {
    const u = users.find((u) => u.id === id);
    if (u) setCurrentUser(u);
  }, [users]);

  const markNotificationRead = useCallback(async (id: string) => {
    await put(`notifications/${id}`, { read: true });
    setNotifications((p) => p.map((n) => n.id === id ? { ...n, read: true } : n));
  }, []);

  // ── CRUD factories ─────────────────────────────────────────────────────────
  function makeCrud<T extends { id: string }>(
    endpoint: string,
    setter: React.Dispatch<React.SetStateAction<T[]>>
  ) {
    const add = async (item: T) => {
      const saved = await post(endpoint, item);
      setter((p) => [saved, ...p]);
    };
    const update = async (id: string, updates: Partial<T>) => {
      // Optimistic update first so UI is instant
      setter((p) => p.map((x) => x.id === id ? { ...x, ...updates } : x));
      // Then persist — send only the changed fields
      await put(`${endpoint}/${id}`, updates).catch(console.error);
    };
    const remove = async (id: string) => {
      await del(`${endpoint}/${id}`);
      setter((p) => p.filter((x) => x.id !== id));
    };
    return { add, update, remove };
  }

  const usersCrud = makeCrud<User>("users", setUsers);
  const ordersCrud = makeCrud<ShopOrder>("shop-orders", setShopOrders);
  const shippingCrud = makeCrud<ShippingPackage>("shipping", setShipping);
  const paymentsCrud = makeCrud<PaymentRecord>("payments", setPayments);
  const fancallsCrud = makeCrud<Fancall>("fancalls", setFancalls);
  const shopsCrud = makeCrud<Shop>("shops", setShops);
  const addyCrud = makeCrud<AddyItem>("addy", setAddyItems);
  const wcCrud = makeCrud<WeightCategory>("weight-categories", setWeightCategories);
  const groupsCrud = makeCrud<KnownGroup>("known-groups", setKnownGroups);
  const boxesCrud = makeCrud<Box>("boxes", setBoxes);
  const ssCrud = makeCrud<SortingSession>("sorting-sessions", setSortingSessions);

  const setAddyAddresses = useCallback(async (a: AddyAddresses) => {
    const saved = await put("addy-addresses", a);
    setAddyAddressesState(saved);
  }, []);

  const unreadCount = notifications.filter(
    (n) => !n.read && (n.forRole === currentUser.role || n.forRole === "both")
  ).length;

  return (
    <AppContext.Provider value={{
      currentUser, users, shopOrders, shipping, payments, fancalls, shops,
      addyItems, notifications, weightCategories, knownGroups, boxes,
      addyAddresses, sortingSessions, eurToKrw, loading, unreadCount,
      setRole, switchToJoiner, markNotificationRead,
      addUser: usersCrud.add, updateUser: usersCrud.update, deleteUser: usersCrud.remove,
      addShopOrder: ordersCrud.add, updateShopOrder: ordersCrud.update, deleteShopOrder: ordersCrud.remove,
      addShipping: shippingCrud.add, updateShipping: shippingCrud.update, deleteShipping: shippingCrud.remove,
      addPayment: paymentsCrud.add, updatePayment: paymentsCrud.update, deletePayment: paymentsCrud.remove,
      addFancall: fancallsCrud.add, updateFancall: fancallsCrud.update, deleteFancall: fancallsCrud.remove,
      addShop: shopsCrud.add, updateShop: shopsCrud.update, deleteShop: shopsCrud.remove,
      addAddyItem: addyCrud.add, updateAddyItem: addyCrud.update, deleteAddyItem: addyCrud.remove,
      addWeightCategory: wcCrud.add, updateWeightCategory: wcCrud.update, deleteWeightCategory: wcCrud.remove,
      addKnownGroup: groupsCrud.add, updateKnownGroup: groupsCrud.update, deleteKnownGroup: groupsCrud.remove,
      addBox: boxesCrud.add, updateBox: boxesCrud.update, deleteBox: boxesCrud.remove,
      addSortingSession: ssCrud.add, updateSortingSession: ssCrud.update, deleteSortingSession: ssCrud.remove,
      setAddyAddresses, setEurToKrw,
    }}>
      {loading ? (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", color: "var(--text-muted)", fontSize: "1rem", gap: 12 }}>
          <span style={{ animation: "pulse-glow 1.5s ease-in-out infinite" }}>✦</span>
          Loading…
        </div>
      ) : children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
