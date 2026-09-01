import { adminDb } from "../lib/firebase-admin.js";
import type { Product, Order, Promotion, StoreSettings } from "../../shared/schema";
import crypto from "node:crypto";

export function generateId(prefix: string): string {
  return `${prefix}-${crypto.randomBytes(6).toString("hex")}`;
}

// ─── In-Memory Caches for Blazing Fast 0ms API Latency ────
const inMemoryProducts = new Map<string, Product>();
const inMemoryOrders = new Map<string, Order>();
const inMemoryPromotions = new Map<string, Promotion>();

// Helper to strictly deduplicate products by ID and slug
function getUniqueProducts(): Product[] {
  const bySlug = new Map<string, Product>();
  for (const p of inMemoryProducts.values()) {
    if (!p) continue;
    const key = (p.slug || p.id || "").toLowerCase();
    if (!bySlug.has(key)) {
      bySlug.set(key, p);
    }
  }
  return Array.from(bySlug.values());
}

// ─── Products ─────────────────────────────────────────────
let lastProductSyncTime = 0;
let isSyncingProducts = false;

async function syncProductsFromRTDB(): Promise<void> {
  if (isSyncingProducts) return;
  isSyncingProducts = true;
  try {
    const fetchPromise = adminDb.ref("products").get();
    const timeoutPromise = new Promise<any>((_, reject) => setTimeout(() => reject(new Error("RTDB products timeout")), 1500));
    const snapshot = await Promise.race([fetchPromise, timeoutPromise]);
    if (snapshot && snapshot.exists()) {
      const data = snapshot.val();
      inMemoryProducts.clear();
      if (data && typeof data === "object") {
        Object.values(data).forEach((item: any) => {
          if (item && item.id) {
            inMemoryProducts.set(item.id, item as Product);
          }
        });
      }
      lastProductSyncTime = Date.now();
    }
  } catch (err: any) {
    console.warn("Background RTDB products sync notice:", err?.message || err);
  } finally {
    isSyncingProducts = false;
  }
}

export async function getProducts(): Promise<Product[]> {
  if (inMemoryProducts.size > 0) {
    if (Date.now() - lastProductSyncTime > 10000) {
      syncProductsFromRTDB().catch(() => {});
    }
    return getUniqueProducts();
  }

  await syncProductsFromRTDB();
  return getUniqueProducts();
}

export async function getProductById(id: string): Promise<Product | null> {
  if (inMemoryProducts.has(id)) {
    return inMemoryProducts.get(id)!;
  }
  for (const p of inMemoryProducts.values()) {
    if (p.id === id || p.slug === id) return p;
  }

  try {
    const snap = await adminDb.ref(`products/${id}`).get();
    if (snap.exists()) {
      const item = snap.val() as Product;
      inMemoryProducts.set(item.id, item);
      return item;
    }
    // Search by slug if not found by direct ID key
    const allSnap = await adminDb.ref("products").get();
    if (allSnap.exists()) {
      const data = allSnap.val();
      for (const p of Object.values(data) as Product[]) {
        if (p && (p.id === id || p.slug === id)) {
          inMemoryProducts.set(p.id, p);
          return p;
        }
      }
    }
  } catch (err: any) {
    console.warn("RTDB product lookup notice:", err?.message || err);
  }
  return null;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const norm = slug.toLowerCase();
  for (const p of inMemoryProducts.values()) {
    if ((p.slug && p.slug.toLowerCase() === norm) || (p.id && p.id.toLowerCase() === norm)) {
      return p;
    }
  }

  try {
    const allSnap = await adminDb.ref("products").get();
    if (allSnap.exists()) {
      const data = allSnap.val();
      for (const p of Object.values(data) as Product[]) {
        if (p && ((p.slug && p.slug.toLowerCase() === norm) || (p.id && p.id.toLowerCase() === norm))) {
          inMemoryProducts.set(p.id, p);
          return p;
        }
      }
    }
  } catch (err: any) {
    console.warn("RTDB slug lookup notice:", err?.message || err);
  }
  return null;
}

export async function createProduct(product: Product): Promise<void> {
  inMemoryProducts.set(product.id, product);
  try {
    const clean = JSON.parse(JSON.stringify(product));
    await adminDb.ref(`products/${product.id}`).set(clean);
  } catch (err) {
    console.error("RTDB createProduct failed:", err);
  }
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<void> {
  const existing = inMemoryProducts.get(id);
  if (existing) {
    inMemoryProducts.set(id, { ...existing, ...updates });
  }
  try {
    const clean = JSON.parse(JSON.stringify(updates));
    await adminDb.ref(`products/${id}`).update(clean);
  } catch (err) {
    console.error("RTDB updateProduct failed:", err);
  }
}

export async function deleteProduct(id: string): Promise<void> {
  inMemoryProducts.delete(id);
  try {
    await adminDb.ref(`products/${id}`).remove();
  } catch (err) {
    console.error("RTDB deleteProduct failed:", err);
  }
}

// ─── Orders ───────────────────────────────────────────────
let lastOrderSyncTime = 0;
let isSyncingOrders = false;

async function syncOrdersFromRTDB(): Promise<void> {
  if (isSyncingOrders) return;
  isSyncingOrders = true;
  try {
    const fetchPromise = adminDb.ref("orders").get();
    const timeoutPromise = new Promise<any>((_, reject) => setTimeout(() => reject(new Error("RTDB orders timeout")), 1500));
    const snapshot = await Promise.race([fetchPromise, timeoutPromise]);
    if (snapshot && snapshot.exists()) {
      const data = snapshot.val();
      inMemoryOrders.clear();
      if (data && typeof data === "object") {
        Object.values(data).forEach((item: any) => {
          if (item && item.id) {
            inMemoryOrders.set(item.id, item as Order);
          }
        });
      }
      lastOrderSyncTime = Date.now();
    }
  } catch (err: any) {
    console.warn("Background RTDB orders sync notice:", err?.message || err);
  } finally {
    isSyncingOrders = false;
  }
}

export async function getOrders(): Promise<Order[]> {
  if (inMemoryOrders.size > 0) {
    if (Date.now() - lastOrderSyncTime > 10000) {
      syncOrdersFromRTDB().catch(() => {});
    }
    return Array.from(inMemoryOrders.values()).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  }

  await syncOrdersFromRTDB();
  return Array.from(inMemoryOrders.values()).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
}

export async function getOrderById(id: string): Promise<Order | null> {
  if (inMemoryOrders.has(id)) {
    return inMemoryOrders.get(id)!;
  }
  try {
    const snap = await adminDb.ref(`orders/${id}`).get();
    if (snap.exists()) {
      const item = snap.val() as Order;
      inMemoryOrders.set(item.id, item);
      return item;
    }
  } catch (err: any) {
    console.warn("RTDB order lookup notice:", err?.message || err);
  }
  return null;
}

export async function createOrder(order: Order): Promise<void> {
  inMemoryOrders.set(order.id, order);
  try {
    const clean = JSON.parse(JSON.stringify(order));
    await adminDb.ref(`orders/${order.id}`).set(clean);
  } catch (err) {
    console.error("RTDB createOrder failed:", err);
  }
}

export async function updateOrder(id: string, updates: Partial<Order>): Promise<void> {
  const existing = inMemoryOrders.get(id);
  if (existing) {
    inMemoryOrders.set(id, { ...existing, ...updates });
  }
  try {
    const clean = JSON.parse(JSON.stringify(updates));
    await adminDb.ref(`orders/${id}`).update(clean);
  } catch (err) {
    console.error("RTDB updateOrder failed:", err);
  }
}

export async function getUserOrders(email: string): Promise<Order[]> {
  const matches = Array.from(inMemoryOrders.values())
    .filter((o) => o.customerEmail?.toLowerCase() === email.toLowerCase())
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

  if (matches.length > 0) return matches;

  try {
    const snapshot = await adminDb.ref("orders").get();
    if (snapshot.exists()) {
      const data = snapshot.val();
      const all = Object.values(data) as Order[];
      return all
        .filter((o) => o && o.customerEmail?.toLowerCase() === email.toLowerCase())
        .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    }
  } catch (e) {
    console.warn("RTDB user orders lookup notice:", e);
  }
  return matches;
}

// ─── Promotions ───────────────────────────────────────────
let lastPromoSyncTime = 0;
let isSyncingPromotions = false;

async function syncPromotionsFromRTDB(): Promise<void> {
  if (isSyncingPromotions) return;
  isSyncingPromotions = true;
  try {
    const snapshot = await adminDb.ref("promotions").get();
    if (snapshot.exists()) {
      const data = snapshot.val();
      inMemoryPromotions.clear();
      if (data && typeof data === "object") {
        Object.values(data).forEach((item: any) => {
          if (item && item.id) {
            inMemoryPromotions.set(item.id, item as Promotion);
          }
        });
      }
      lastPromoSyncTime = Date.now();
    }
  } catch (err: any) {
    console.warn("Background RTDB promotions sync notice:", err?.message || err);
  } finally {
    isSyncingPromotions = false;
  }
}

export async function getPromotions(): Promise<Promotion[]> {
  if (inMemoryPromotions.size > 0) {
    if (Date.now() - lastPromoSyncTime > 10000) {
      syncPromotionsFromRTDB().catch(() => {});
    }
    return Array.from(inMemoryPromotions.values()).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  }

  await syncPromotionsFromRTDB();
  return Array.from(inMemoryPromotions.values()).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
}

export async function getPromotionById(id: string): Promise<Promotion | null> {
  if (inMemoryPromotions.has(id)) {
    return inMemoryPromotions.get(id)!;
  }
  try {
    const snap = await adminDb.ref(`promotions/${id}`).get();
    if (snap.exists()) {
      const item = snap.val() as Promotion;
      inMemoryPromotions.set(item.id, item);
      return item;
    }
  } catch (err: any) {
    console.warn("RTDB promotion lookup notice:", err?.message || err);
  }
  return null;
}

export async function createPromotion(promo: Promotion): Promise<void> {
  inMemoryPromotions.set(promo.id, promo);
  try {
    const clean = JSON.parse(JSON.stringify(promo));
    await adminDb.ref(`promotions/${promo.id}`).set(clean);
  } catch (err) {
    console.error("RTDB createPromotion failed:", err);
  }
}

export async function updatePromotion(id: string, updates: Partial<Promotion>): Promise<void> {
  const existing = inMemoryPromotions.get(id);
  if (existing) {
    inMemoryPromotions.set(id, { ...existing, ...updates });
  }
  try {
    const clean = JSON.parse(JSON.stringify(updates));
    await adminDb.ref(`promotions/${id}`).update(clean);
  } catch (err) {
    console.error("RTDB updatePromotion failed:", err);
  }
}

export async function deletePromotion(id: string): Promise<void> {
  inMemoryPromotions.delete(id);
  try {
    await adminDb.ref(`promotions/${id}`).remove();
  } catch (err) {
    console.error("RTDB deletePromotion failed:", err);
  }
}

// ─── Settings ─────────────────────────────────────────────
let cachedSettings: StoreSettings = {
  storeName: "ApexMindReads",
  supportEmail: "support@apexmindreads.com",
  downloadMode: "instant",
  currency: "NGN",
  paymentGateway: (process.env.PAYMENT_GATEWAY as any) || "flutterwave",
};
let lastSettingsSyncTime = 0;

export async function getSettings(): Promise<StoreSettings> {
  if (Date.now() - lastSettingsSyncTime < 15000) {
    return cachedSettings;
  }
  try {
    const snap = await adminDb.ref("settings/store").get();
    if (snap.exists()) {
      const data = snap.val() as Partial<StoreSettings>;
      cachedSettings = {
        ...cachedSettings,
        ...data,
        paymentGateway: data.paymentGateway || cachedSettings.paymentGateway || "flutterwave",
      };
      lastSettingsSyncTime = Date.now();
      return cachedSettings;
    }
    // Initialize default if absent
    await adminDb.ref("settings/store").set(cachedSettings).catch(() => {});
    lastSettingsSyncTime = Date.now();
    return cachedSettings;
  } catch (e) {
    console.warn("RTDB settings read notice (serving cached defaults):", e);
    return cachedSettings;
  }
}

export async function updateSettings(updates: Partial<StoreSettings>): Promise<StoreSettings> {
  const clean = JSON.parse(JSON.stringify(updates));
  cachedSettings = {
    ...cachedSettings,
    ...clean,
  };
  lastSettingsSyncTime = Date.now();
  try {
    await adminDb.ref("settings/store").update(clean);
  } catch (e) {
    console.warn("RTDB updateSettings notice:", e);
  }
  return cachedSettings;
}
