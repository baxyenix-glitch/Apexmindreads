import { adminDb } from "../lib/firebase-admin.js";
import type { Product, Order, Promotion, StoreSettings } from "../../shared/schema";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export function generateId(prefix: string): string {
  return `${prefix}-${crypto.randomBytes(6).toString("hex")}`;
}

// ─── Initial In-Memory Seed from Default JSON files ────────
function loadSeedJson<T>(filename: string): T[] {
  try {
    const filePath = path.join(process.cwd(), "server/data", filename);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error(`Failed to load seed JSON ${filename}:`, err);
  }
  return [];
}

const seedProducts: Product[] = loadSeedJson<Product>("default-products.json");
const seedOrders: Order[] = loadSeedJson<Order>("default-orders.json");

const inMemoryProducts = new Map<string, Product>();
for (const p of seedProducts) {
  if (p && p.id) {
    inMemoryProducts.set(p.id, p);
  }
}

const inMemoryOrders = new Map<string, Order>();
for (const o of seedOrders) {
  if (o && o.id) {
    inMemoryOrders.set(o.id, o);
  }
}

const inMemoryPromotions = new Map<string, Promotion>();

// Helper to strictly deduplicate products by ID and slug
function getUniqueProducts(): Product[] {
  const bySlug = new Map<string, Product>();
  for (const p of inMemoryProducts.values()) {
    const key = (p.slug || p.id || "").toLowerCase();
    if (!bySlug.has(key)) {
      bySlug.set(key, p);
    }
  }
  return Array.from(bySlug.values());
}

let lastProductSyncTime = 0;
let isSyncingProducts = false;

async function syncProductsFromFirestore(): Promise<void> {
  if (isSyncingProducts) return;
  isSyncingProducts = true;
  try {
    const snapshot = await adminDb.collection("products").get();
    if (!snapshot.empty) {
      // Clear and re-populate to prevent stale duplicates
      inMemoryProducts.clear();
      snapshot.docs.forEach((doc) => {
        const item = { id: doc.id, ...doc.data() } as Product;
        inMemoryProducts.set(item.id, item);
      });
      lastProductSyncTime = Date.now();
    }
  } catch (err: any) {
    console.warn("Background Firestore products sync notice:", err?.message || err);
  } finally {
    isSyncingProducts = false;
  }
}

// ─── Products ─────────────────────────────────────────────
export async function getProducts(): Promise<Product[]> {
  // If we have cached products, return them immediately for 0ms response time
  if (inMemoryProducts.size > 0) {
    // Background sync if cache is older than 15s
    if (Date.now() - lastProductSyncTime > 15000) {
      syncProductsFromFirestore().catch(() => {});
    }
    return getUniqueProducts();
  }

  // First cold load: sync from Firestore synchronously
  await syncProductsFromFirestore();
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
    const doc = await adminDb.collection("products").doc(id).get();
    if (doc.exists) {
      const item = { id: doc.id, ...doc.data() } as Product;
      inMemoryProducts.set(item.id, item);
      return item;
    }
    const byId = await adminDb.collection("products").where("id", "==", id).limit(1).get();
    if (!byId.empty) {
      const item = { id: byId.docs[0].id, ...byId.docs[0].data() } as Product;
      inMemoryProducts.set(item.id, item);
      return item;
    }
    const bySlug = await adminDb.collection("products").where("slug", "==", id).limit(1).get();
    if (!bySlug.empty) {
      const item = { id: bySlug.docs[0].id, ...bySlug.docs[0].data() } as Product;
      inMemoryProducts.set(item.id, item);
      return item;
    }
  } catch (err: any) {
    console.warn("Firestore product lookup notice:", err?.message || err);
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
    const snapshot = await adminDb.collection("products").where("slug", "==", slug).limit(1).get();
    if (!snapshot.empty) {
      const item = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Product;
      inMemoryProducts.set(item.id, item);
      return item;
    }
  } catch (err: any) {
    console.warn("Firestore slug lookup notice:", err?.message || err);
  }
  return null;
}

export async function createProduct(product: Product): Promise<void> {
  inMemoryProducts.set(product.id, product);
  try {
    const clean = JSON.parse(JSON.stringify(product));
    await adminDb.collection("products").doc(product.id).set(clean);
  } catch (err) {
    console.error("Async Firestore createProduct failed:", err);
  }
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<void> {
  const existing = inMemoryProducts.get(id);
  if (existing) {
    inMemoryProducts.set(id, { ...existing, ...updates });
  }
  try {
    const clean = JSON.parse(JSON.stringify(updates));
    await adminDb.collection("products").doc(id).set(clean, { merge: true });
  } catch (err) {
    console.error("Async Firestore updateProduct failed:", err);
  }
}

export async function deleteProduct(id: string): Promise<void> {
  inMemoryProducts.delete(id);
  try {
    await adminDb.collection("products").doc(id).delete();
  } catch (err) {
    console.error("Async Firestore deleteProduct failed:", err);
  }
}

// ─── Orders ───────────────────────────────────────────────
let lastOrderSyncTime = 0;
let isSyncingOrders = false;

async function syncOrdersFromFirestore(): Promise<void> {
  if (isSyncingOrders) return;
  isSyncingOrders = true;
  try {
    const snapshot = await adminDb.collection("orders").orderBy("createdAt", "desc").get();
    if (!snapshot.empty) {
      inMemoryOrders.clear();
      snapshot.docs.forEach((doc) => {
        const item = { id: doc.id, ...doc.data() } as Order;
        inMemoryOrders.set(item.id, item);
      });
      lastOrderSyncTime = Date.now();
    }
  } catch {
    try {
      const snapshot = await adminDb.collection("orders").get();
      if (!snapshot.empty) {
        inMemoryOrders.clear();
        snapshot.docs.forEach((doc) => {
          const item = { id: doc.id, ...doc.data() } as Order;
          inMemoryOrders.set(item.id, item);
        });
        lastOrderSyncTime = Date.now();
      }
    } catch (e) {
      console.warn("Background Firestore orders sync notice:", e);
    }
  } finally {
    isSyncingOrders = false;
  }
}

export async function getOrders(): Promise<Order[]> {
  if (inMemoryOrders.size > 0) {
    if (Date.now() - lastOrderSyncTime > 10000) {
      syncOrdersFromFirestore().catch(() => {});
    }
    return Array.from(inMemoryOrders.values()).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  }

  await syncOrdersFromFirestore();
  return Array.from(inMemoryOrders.values()).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
}

export async function getOrderById(id: string): Promise<Order | null> {
  if (inMemoryOrders.has(id)) {
    return inMemoryOrders.get(id)!;
  }
  try {
    const doc = await adminDb.collection("orders").doc(id).get();
    if (doc.exists) {
      const item = { id: doc.id, ...doc.data() } as Order;
      inMemoryOrders.set(item.id, item);
      return item;
    }
  } catch (err: any) {
    console.warn("Firestore order lookup notice:", err?.message || err);
  }
  return null;
}

export async function createOrder(order: Order): Promise<void> {
  inMemoryOrders.set(order.id, order);
  try {
    const clean = JSON.parse(JSON.stringify(order));
    await adminDb.collection("orders").doc(order.id).set(clean);
  } catch (err) {
    console.error("Async Firestore createOrder failed:", err);
  }
}

export async function updateOrder(id: string, updates: Partial<Order>): Promise<void> {
  const existing = inMemoryOrders.get(id);
  if (existing) {
    inMemoryOrders.set(id, { ...existing, ...updates });
  }
  try {
    const clean = JSON.parse(JSON.stringify(updates));
    await adminDb.collection("orders").doc(id).update(clean);
  } catch (err) {
    console.error("Async Firestore updateOrder failed:", err);
  }
}

export async function getUserOrders(email: string): Promise<Order[]> {
  const matches = Array.from(inMemoryOrders.values())
    .filter((o) => o.customerEmail?.toLowerCase() === email.toLowerCase())
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

  try {
    const snapshot = await adminDb.collection("orders").where("customerEmail", "==", email).get();
    if (!snapshot.empty) {
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Order)).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    }
  } catch (e) {
    console.warn("Firestore user orders lookup notice:", e);
  }
  return matches;
}

// ─── Promotions ───────────────────────────────────────────
export async function getPromotions(): Promise<Promotion[]> {
  if (inMemoryPromotions.size > 0) {
    return Array.from(inMemoryPromotions.values());
  }
  try {
    const snapshot = await adminDb.collection("promotions").orderBy("createdAt", "desc").get();
    if (!snapshot.empty) {
      snapshot.docs.forEach((doc) => {
        const item = { id: doc.id, ...doc.data() } as Promotion;
        inMemoryPromotions.set(item.id, item);
      });
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Promotion));
    }
  } catch {
    try {
      const snapshot = await adminDb.collection("promotions").get();
      if (!snapshot.empty) {
        snapshot.docs.forEach((doc) => {
          const item = { id: doc.id, ...doc.data() } as Promotion;
          inMemoryPromotions.set(item.id, item);
        });
        return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Promotion));
      }
    } catch (e) {
      console.warn("Firestore promotions read notice:", e);
    }
  }
  return Array.from(inMemoryPromotions.values());
}

export async function getPromotionById(id: string): Promise<Promotion | null> {
  if (inMemoryPromotions.has(id)) {
    return inMemoryPromotions.get(id)!;
  }
  try {
    const doc = await adminDb.collection("promotions").doc(id).get();
    if (doc.exists) {
      const item = { id: doc.id, ...doc.data() } as Promotion;
      inMemoryPromotions.set(item.id, item);
      return item;
    }
  } catch (err: any) {
    console.warn("Firestore promotion lookup notice:", err?.message || err);
  }
  return null;
}

export async function createPromotion(promo: Promotion): Promise<void> {
  inMemoryPromotions.set(promo.id, promo);
  try {
    const clean = JSON.parse(JSON.stringify(promo));
    await adminDb.collection("promotions").doc(promo.id).set(clean);
  } catch (err) {
    console.error("Async Firestore createPromotion failed:", err);
  }
}

export async function updatePromotion(id: string, updates: Partial<Promotion>): Promise<void> {
  const existing = inMemoryPromotions.get(id);
  if (existing) {
    inMemoryPromotions.set(id, { ...existing, ...updates });
  }
  try {
    const clean = JSON.parse(JSON.stringify(updates));
    await adminDb.collection("promotions").doc(id).update(clean);
  } catch (err) {
    console.error("Async Firestore updatePromotion failed:", err);
  }
}

export async function deletePromotion(id: string): Promise<void> {
  inMemoryPromotions.delete(id);
  try {
    await adminDb.collection("promotions").doc(id).delete();
  } catch (err) {
    console.error("Async Firestore deletePromotion failed:", err);
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

export async function getSettings(): Promise<StoreSettings> {
  try {
    const doc = await adminDb.collection("settings").doc("store").get();
    if (doc.exists) {
      const data = doc.data() as Partial<StoreSettings>;
      cachedSettings = {
        ...cachedSettings,
        ...data,
        paymentGateway: data.paymentGateway || cachedSettings.paymentGateway || "flutterwave",
      };
      return cachedSettings;
    }
    await adminDb.collection("settings").doc("store").set(cachedSettings).catch(() => {});
    return cachedSettings;
  } catch (e) {
    console.warn("Firestore settings read notice (serving defaults):", e);
    return cachedSettings;
  }
}

export async function updateSettings(updates: Partial<StoreSettings>): Promise<StoreSettings> {
  const clean = JSON.parse(JSON.stringify(updates));
  cachedSettings = {
    ...cachedSettings,
    ...clean,
  };
  try {
    await adminDb.collection("settings").doc("store").set(clean, { merge: true });
  } catch (e) {
    console.warn("Async Firestore updateSettings notice:", e);
  }
  return cachedSettings;
}

