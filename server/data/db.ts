import { adminDb } from "../lib/firebase-admin";
import type { Product, Order, Promotion, StoreSettings } from "../../shared/schema";
import crypto from "node:crypto";

export function generateId(prefix: string): string {
  return `${prefix}-${crypto.randomBytes(6).toString("hex")}`;
}

// ─── Products ─────────────────────────────────────────────
export async function getProducts(): Promise<Product[]> {
  try {
    const snapshot = await adminDb.collection("products").get();
    return snapshot.docs.map((doc) => doc.data() as Product);
  } catch (err: any) {
    console.error("Error fetching products from Firestore:", err);
    return [];
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    const doc = await adminDb.collection("products").doc(id).get();
    return doc.exists ? (doc.data() as Product) : null;
  } catch (err: any) {
    console.error("Error fetching product by id:", err);
    return null;
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const snapshot = await adminDb.collection("products").where("slug", "==", slug).limit(1).get();
    return snapshot.empty ? null : (snapshot.docs[0].data() as Product);
  } catch (err: any) {
    console.error("Error fetching product by slug:", err);
    return null;
  }
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
    try {
      const snapshot = await adminDb.collection("orders").get();
      return snapshot.docs.map((doc) => doc.data() as Order).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    } catch (e) {
      console.error("Error fetching orders from Firestore:", e);
      return [];
    }
  }
}

export async function getOrderById(id: string): Promise<Order | null> {
  try {
    const doc = await adminDb.collection("orders").doc(id).get();
    return doc.exists ? (doc.data() as Order) : null;
  } catch (err: any) {
    console.error("Error fetching order by id:", err);
    return null;
  }
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
  try {
    const snapshot = await adminDb.collection("orders").where("customerEmail", "==", email).get();
    return snapshot.docs.map((doc) => doc.data() as Order).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  } catch (e) {
    console.error("Error fetching user orders from Firestore:", e);
    return [];
  }
}

// ─── Promotions ───────────────────────────────────────────
export async function getPromotions(): Promise<Promotion[]> {
  try {
    const snapshot = await adminDb.collection("promotions").orderBy("createdAt", "desc").get();
    return snapshot.docs.map((doc) => doc.data() as Promotion);
  } catch {
    try {
      const snapshot = await adminDb.collection("promotions").get();
      return snapshot.docs.map((doc) => doc.data() as Promotion);
    } catch (e) {
      console.error("Error fetching promotions from Firestore:", e);
      return [];
    }
  }
}

export async function getPromotionById(id: string): Promise<Promotion | null> {
  try {
    const doc = await adminDb.collection("promotions").doc(id).get();
    return doc.exists ? (doc.data() as Promotion) : null;
  } catch (err: any) {
    console.error("Error fetching promotion by id:", err);
    return null;
  }
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
  const defaults: StoreSettings = {
    storeName: "ApexMindReads",
    supportEmail: "support@apexmindreads.com",
    downloadMode: "instant",
    currency: "NGN",
  };
  try {
    const doc = await adminDb.collection("settings").doc("store").get();
    if (doc.exists) {
      return doc.data() as StoreSettings;
    }
    await adminDb.collection("settings").doc("store").set(defaults).catch(() => {});
    return defaults;
  } catch (e) {
    console.error("Error fetching settings from Firestore:", e);
    return defaults;
  }
}

export async function updateSettings(updates: Partial<StoreSettings>): Promise<StoreSettings> {
  const clean = JSON.parse(JSON.stringify(updates));
  try {
    await adminDb.collection("settings").doc("store").set(clean, { merge: true });
  } catch (e) {
    console.error("Error updating settings in Firestore:", e);
  }
  return getSettings();
}
