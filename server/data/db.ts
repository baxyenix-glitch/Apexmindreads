import { rtdbPut, rtdbPatch, rtdbGet, rtdbDelete } from "../lib/firebase-rtdb.js";
import type { Product, Order, Promotion, StoreSettings } from "../../shared/schema";
import crypto from "node:crypto";

export function generateId(prefix: string): string {
  return `${prefix}-${crypto.randomBytes(6).toString("hex")}`;
}

// ─── In-Memory Caches for Blazing Fast 0ms API Latency ────
const inMemoryProducts = new Map<string, Product>();
const inMemoryOrders = new Map<string, Order>();
const inMemoryPromotions = new Map<string, Promotion>();

function sanitizeProduct(p: any): Product {
  if (!p) return p;
  return {
    ...p,
    benefits: Array.isArray(p.benefits) 
      ? p.benefits 
      : (typeof p.benefits === "string" && p.benefits ? [p.benefits] : []),
    cover: p.cover || {
      kicker: "APEXMINDREADS",
      title: p.title || "Guide",
      subtitle: p.eyebrow || "",
      author: "ApexMindReads Editorial",
      tone: "#d86f45",
      accent: "#f4c16e",
      pattern: "grid",
    },
  };
}

// Helper to strictly deduplicate products by ID and slug
function getUniqueProducts(): Product[] {
  const bySlug = new Map<string, Product>();
  for (const p of inMemoryProducts.values()) {
    if (!p) continue;
    const sanitized = sanitizeProduct(p);
    const key = (sanitized.slug || sanitized.id || "").toLowerCase();
    if (!bySlug.has(key)) {
      bySlug.set(key, sanitized);
    }
  }
  return Array.from(bySlug.values());
}

// ─── Products ─────────────────────────────────────────────
let lastProductSyncTime = 0;
let isSyncingProducts = false;

export async function syncProductsFromRTDB(): Promise<void> {
  if (isSyncingProducts) return;
  isSyncingProducts = true;
  try {
    const data = await rtdbGet("products");
    inMemoryProducts.clear();
    if (data && typeof data === "object") {
      Object.values(data).forEach((item: any) => {
        if (item && item.id) {
          inMemoryProducts.set(item.id, sanitizeProduct(item));
        }
      });
    }
    lastProductSyncTime = Date.now();
  } catch (err: any) {
    console.warn("Background RTDB products sync notice:", err?.message || err);
  } finally {
    isSyncingProducts = false;
  }
}

export async function getProducts(): Promise<Product[]> {
  if (lastProductSyncTime === 0) {
    await syncProductsFromRTDB();
  } else if (Date.now() - lastProductSyncTime > 5000) {
    syncProductsFromRTDB().catch(() => {});
  }
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
    const item = await rtdbGet(`products/${id}`);
    if (item && item.id) {
      const sanitized = sanitizeProduct(item);
      inMemoryProducts.set(item.id, sanitized);
      return sanitized;
    }
    const allData = await rtdbGet("products");
    if (allData && typeof allData === "object") {
      for (const p of Object.values(allData) as Product[]) {
        if (p && (p.id === id || p.slug === id)) {
          const sanitized = sanitizeProduct(p);
          inMemoryProducts.set(p.id, sanitized);
          return sanitized;
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
      return sanitizeProduct(p);
    }
  }

  try {
    const data = await rtdbGet("products");
    if (data && typeof data === "object") {
      for (const p of Object.values(data) as Product[]) {
        if (p && ((p.slug && p.slug.toLowerCase() === norm) || (p.id && p.id.toLowerCase() === norm))) {
          const sanitized = sanitizeProduct(p);
          inMemoryProducts.set(p.id, sanitized);
          return sanitized;
        }
      }
    }
  } catch (err: any) {
    console.warn("RTDB slug lookup notice:", err?.message || err);
  }
  return null;
}

export async function createProduct(product: Product, adminToken?: string): Promise<void> {
  const sanitized = sanitizeProduct(product);
  inMemoryProducts.set(sanitized.id, sanitized);
  try {
    const clean = JSON.parse(JSON.stringify(sanitized));
    await rtdbPut(`products/${product.id}`, clean, adminToken);
  } catch (err) {
    console.error("RTDB createProduct failed:", err);
  }
}

export async function updateProduct(id: string, updates: Partial<Product>, adminToken?: string): Promise<void> {
  const existing = inMemoryProducts.get(id);
  if (existing) {
    inMemoryProducts.set(id, { ...existing, ...updates });
  }
  try {
    const clean = JSON.parse(JSON.stringify(updates));
    await rtdbPatch(`products/${id}`, clean, adminToken);
  } catch (err) {
    console.error("RTDB updateProduct failed:", err);
  }
}

export async function deleteProduct(id: string, adminToken?: string): Promise<void> {
  inMemoryProducts.delete(id);
  try {
    await rtdbDelete(`products/${id}`, adminToken);
  } catch (err) {
    console.error("RTDB deleteProduct failed:", err);
  }
}

// ─── Orders ───────────────────────────────────────────────
let lastOrderSyncTime = 0;
let isSyncingOrders = false;

export async function syncOrdersFromRTDB(): Promise<void> {
  if (isSyncingOrders) return;
  isSyncingOrders = true;
  try {
    const data = await rtdbGet("orders");
    inMemoryOrders.clear();
    if (data && typeof data === "object") {
      Object.values(data).forEach((item: any) => {
        if (item && item.id) {
          inMemoryOrders.set(item.id, item as Order);
        }
      });
    }
    lastOrderSyncTime = Date.now();
  } catch (err: any) {
    console.warn("Background RTDB orders sync notice:", err?.message || err);
  } finally {
    isSyncingOrders = false;
  }
}

export async function getOrders(): Promise<Order[]> {
  if (lastOrderSyncTime === 0) {
    await syncOrdersFromRTDB();
  } else if (Date.now() - lastOrderSyncTime > 5000) {
    syncOrdersFromRTDB().catch(() => {});
  }
  return Array.from(inMemoryOrders.values()).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
}

export async function getOrderById(id: string): Promise<Order | null> {
  if (inMemoryOrders.has(id)) {
    return inMemoryOrders.get(id)!;
  }
  try {
    const item = await rtdbGet(`orders/${id}`);
    if (item && item.id) {
      inMemoryOrders.set(item.id, item as Order);
      return item as Order;
    }
  } catch (err: any) {
    console.warn("RTDB order lookup notice:", err?.message || err);
  }
  return null;
}

export async function createOrder(order: Order, adminToken?: string): Promise<void> {
  inMemoryOrders.set(order.id, order);
  try {
    const clean = JSON.parse(JSON.stringify(order));
    await rtdbPut(`orders/${order.id}`, clean, adminToken);
  } catch (err) {
    console.error("RTDB createOrder failed:", err);
  }
}

export async function updateOrder(id: string, updates: Partial<Order>, adminToken?: string): Promise<void> {
  const existing = inMemoryOrders.get(id);
  if (existing) {
    inMemoryOrders.set(id, { ...existing, ...updates });
  }
  try {
    const clean = JSON.parse(JSON.stringify(updates));
    await rtdbPatch(`orders/${id}`, clean, adminToken);
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
    const data = await rtdbGet("orders");
    if (data && typeof data === "object") {
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

export async function syncPromotionsFromRTDB(): Promise<void> {
  if (isSyncingPromotions) return;
  isSyncingPromotions = true;
  try {
    const data = await rtdbGet("promotions");
    inMemoryPromotions.clear();
    if (data && typeof data === "object") {
      Object.values(data).forEach((item: any) => {
        if (item && item.id) {
          inMemoryPromotions.set(item.id, item as Promotion);
        }
      });
    }
    lastPromoSyncTime = Date.now();
  } catch (err: any) {
    console.warn("Background RTDB promotions sync notice:", err?.message || err);
  } finally {
    isSyncingPromotions = false;
  }
}

export async function getPromotions(): Promise<Promotion[]> {
  if (lastPromoSyncTime === 0) {
    await syncPromotionsFromRTDB();
  } else if (Date.now() - lastPromoSyncTime > 5000) {
    syncPromotionsFromRTDB().catch(() => {});
  }
  return Array.from(inMemoryPromotions.values()).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
}

export async function getPromotionById(id: string): Promise<Promotion | null> {
  if (inMemoryPromotions.has(id)) {
    return inMemoryPromotions.get(id)!;
  }
  try {
    const item = await rtdbGet(`promotions/${id}`);
    if (item && item.id) {
      inMemoryPromotions.set(item.id, item as Promotion);
      return item as Promotion;
    }
  } catch (err: any) {
    console.warn("RTDB promotion lookup notice:", err?.message || err);
  }
  return null;
}

export async function createPromotion(promo: Promotion, adminToken?: string): Promise<void> {
  inMemoryPromotions.set(promo.id, promo);
  try {
    const clean = JSON.parse(JSON.stringify(promo));
    await rtdbPut(`promotions/${promo.id}`, clean, adminToken);
  } catch (err) {
    console.error("RTDB createPromotion failed:", err);
  }
}

export async function updatePromotion(id: string, updates: Partial<Promotion>, adminToken?: string): Promise<void> {
  const existing = inMemoryPromotions.get(id);
  if (existing) {
    inMemoryPromotions.set(id, { ...existing, ...updates });
  }
  try {
    const clean = JSON.parse(JSON.stringify(updates));
    await rtdbPatch(`promotions/${id}`, clean, adminToken);
  } catch (err) {
    console.error("RTDB updatePromotion failed:", err);
  }
}

export async function deletePromotion(id: string, adminToken?: string): Promise<void> {
  inMemoryPromotions.delete(id);
  try {
    await rtdbDelete(`promotions/${id}`, adminToken);
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

export async function syncSettingsFromRTDB(): Promise<void> {
  try {
    const data = await rtdbGet("settings/store");
    if (data && typeof data === "object") {
      cachedSettings = {
        ...cachedSettings,
        ...data,
        paymentGateway: data.paymentGateway || cachedSettings.paymentGateway || "flutterwave",
      };
    }
    lastSettingsSyncTime = Date.now();
  } catch (e) {
    console.warn("Background RTDB settings sync notice:", e);
  }
}

export async function getSettings(): Promise<StoreSettings> {
  if (lastSettingsSyncTime === 0) {
    await syncSettingsFromRTDB();
  } else if (Date.now() - lastSettingsSyncTime > 10000) {
    syncSettingsFromRTDB().catch(() => {});
  }
  return cachedSettings;
}

export async function updateSettings(updates: Partial<StoreSettings>, adminToken?: string): Promise<StoreSettings> {
  const clean = JSON.parse(JSON.stringify(updates));
  cachedSettings = {
    ...cachedSettings,
    ...clean,
  };
  lastSettingsSyncTime = Date.now();
  try {
    await rtdbPatch("settings/store", clean, adminToken);
  } catch (e) {
    console.warn("RTDB updateSettings notice:", e);
  }
  return cachedSettings;
}
