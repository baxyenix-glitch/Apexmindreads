import { adminDb } from "../lib/firebase-admin";
import type { Product, Order, Promotion, StoreSettings } from "../../shared/schema";
import crypto from "node:crypto";

export function generateId(prefix: string): string {
  return `${prefix}-${crypto.randomBytes(6).toString("hex")}`;
}

// ─── Products ─────────────────────────────────────────────
export async function getProducts(): Promise<Product[]> {
  const snapshot = await adminDb.collection("products").get();
  return snapshot.docs.map((doc) => doc.data() as Product);
}

export async function getProductById(id: string): Promise<Product | null> {
  const doc = await adminDb.collection("products").doc(id).get();
  return doc.exists ? (doc.data() as Product) : null;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const snapshot = await adminDb.collection("products").where("slug", "==", slug).limit(1).get();
  return snapshot.empty ? null : (snapshot.docs[0].data() as Product);
}

export async function createProduct(product: Product): Promise<void> {
  const clean = JSON.parse(JSON.stringify(product));
  await adminDb.collection("products").doc(product.id).set(clean);
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<void> {
  const clean = JSON.parse(JSON.stringify(updates));
  await adminDb.collection("products").doc(id).update(clean);
}

export async function deleteProduct(id: string): Promise<void> {
  await adminDb.collection("products").doc(id).delete();
}

// ─── Orders ───────────────────────────────────────────────
export async function getOrders(): Promise<Order[]> {
  try {
    const snapshot = await adminDb.collection("orders").orderBy("createdAt", "desc").get();
    return snapshot.docs.map((doc) => doc.data() as Order);
  } catch (err) {
    // If index is not yet built, fallback to non-ordered fetch
    const snapshot = await adminDb.collection("orders").get();
    return snapshot.docs.map((doc) => doc.data() as Order).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  }
}

export async function getOrderById(id: string): Promise<Order | null> {
  const doc = await adminDb.collection("orders").doc(id).get();
  return doc.exists ? (doc.data() as Order) : null;
}

export async function createOrder(order: Order): Promise<void> {
  const clean = JSON.parse(JSON.stringify(order));
  await adminDb.collection("orders").doc(order.id).set(clean);
}

export async function updateOrder(id: string, updates: Partial<Order>): Promise<void> {
  const clean = JSON.parse(JSON.stringify(updates));
  await adminDb.collection("orders").doc(id).update(clean);
}

export async function getUserOrders(email: string): Promise<Order[]> {
  const snapshot = await adminDb.collection("orders").where("customerEmail", "==", email).get();
  return snapshot.docs.map((doc) => doc.data() as Order).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
}

// ─── Promotions ───────────────────────────────────────────
export async function getPromotions(): Promise<Promotion[]> {
  try {
    const snapshot = await adminDb.collection("promotions").orderBy("createdAt", "desc").get();
    return snapshot.docs.map((doc) => doc.data() as Promotion);
  } catch {
    const snapshot = await adminDb.collection("promotions").get();
    return snapshot.docs.map((doc) => doc.data() as Promotion);
  }
}

export async function getPromotionById(id: string): Promise<Promotion | null> {
  const doc = await adminDb.collection("promotions").doc(id).get();
  return doc.exists ? (doc.data() as Promotion) : null;
}

export async function createPromotion(promo: Promotion): Promise<void> {
  const clean = JSON.parse(JSON.stringify(promo));
  await adminDb.collection("promotions").doc(promo.id).set(clean);
}

export async function updatePromotion(id: string, updates: Partial<Promotion>): Promise<void> {
  const clean = JSON.parse(JSON.stringify(updates));
  await adminDb.collection("promotions").doc(id).update(clean);
}

export async function deletePromotion(id: string): Promise<void> {
  await adminDb.collection("promotions").doc(id).delete();
}

// ─── Settings ─────────────────────────────────────────────
export async function getSettings(): Promise<StoreSettings> {
  const doc = await adminDb.collection("settings").doc("store").get();
  if (doc.exists) {
    return doc.data() as StoreSettings;
  }
  const defaults: StoreSettings = {
    storeName: "ApexMindReads",
    supportEmail: "support@apexmindreads.com",
    downloadMode: "instant",
    currency: "NGN",
  };
  await adminDb.collection("settings").doc("store").set(defaults);
  return defaults;
}

export async function updateSettings(updates: Partial<StoreSettings>): Promise<StoreSettings> {
  const clean = JSON.parse(JSON.stringify(updates));
  await adminDb.collection("settings").doc("store").set(clean, { merge: true });
  return getSettings();
}
