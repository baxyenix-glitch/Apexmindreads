import webpush from "web-push";
import { adminDb } from "./firebase-admin.js";

// VAPID credentials for Web Push
export const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "BHYEfyjs7ALmlPUaxog7bQMzLphLeLetV3x3dtAoOe6HjR55HcGfVwJmhfnWwB7baKQzEXp6YFDvY9PgEkk6Iq8";
export const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "S2OfsXso24Gnjb8IPIeQMPLkSyR_KfArhMR3jA_4mHQ";
export const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:support@apexmindreads.com";

// Configure Web Push with VAPID details
try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} catch (err) {
  console.warn("Failed to set VAPID details:", err);
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
  createdAt?: string;
  lastUsedAt?: string;
}

import fs from "fs";
import path from "path";
import crypto from "crypto";

// Multi-tier storage fallback: In-Memory Map + File persistence + Firestore Admin
const inMemorySubscriptions = new Map<string, PushSubscriptionData>();

function getStorageFilePath(): string {
  // In serverless /tmp is writable; locally server/data/ is writable
  const localDir = path.join(process.cwd(), "server/data");
  if (fs.existsSync(localDir)) {
    return path.join(localDir, "push-subscriptions.json");
  }
  return path.join("/tmp", "apexmind-push-subscriptions.json");
}

function loadSubscriptionsFromFile(): void {
  try {
    const filePath = getStorageFilePath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      const list: PushSubscriptionData[] = JSON.parse(raw);
      if (Array.isArray(list)) {
        list.forEach((sub) => {
          if (sub && sub.endpoint) {
            inMemorySubscriptions.set(sub.endpoint, sub);
          }
        });
      }
    }
  } catch (e) {
    // ignore
  }
}

function saveSubscriptionsToFile(): void {
  try {
    const filePath = getStorageFilePath();
    const list = Array.from(inMemorySubscriptions.values());
    fs.writeFileSync(filePath, JSON.stringify(list, null, 2), "utf-8");
  } catch (e) {
    // ignore
  }
}

// Initial load on startup
loadSubscriptionsFromFile();

/**
 * Save a push subscription with multi-tier persistence (Memory + File + Firestore)
 */
export async function savePushSubscription(sub: PushSubscriptionData): Promise<void> {
  if (!sub || !sub.endpoint) return;

  const normalizedSub: PushSubscriptionData = {
    ...sub,
    updatedAt: new Date().toISOString(),
    lastUsedAt: new Date().toISOString(),
  };

  // 1. In-Memory
  inMemorySubscriptions.set(sub.endpoint, normalizedSub);

  // 2. File
  saveSubscriptionsToFile();

  // 3. Firestore
  try {
    const docId = crypto.createHash("sha256").update(sub.endpoint).digest("hex");
    await adminDb.collection("admin_push_subscriptions").doc(docId).set(normalizedSub, { merge: true });
    console.log(`[PushNotification] Saved subscription for device: ${sub.userAgent?.slice(0, 50) || "Unknown"} (docId: ${docId.slice(0, 16)}...)`);
  } catch (err) {
    console.warn("[PushNotification] Firestore admin save skipped, saved to memory & file:", err);
  }
}

/**
 * Remove an expired or unsubscribed push subscription
 */
export async function removePushSubscription(endpoint: string): Promise<void> {
  if (!endpoint) return;

  // 1. In-Memory
  inMemorySubscriptions.delete(endpoint);

  // 2. File
  saveSubscriptionsToFile();

  // 3. Firestore
  try {
    const docId = crypto.createHash("sha256").update(endpoint).digest("hex");
    await adminDb.collection("admin_push_subscriptions").doc(docId).delete();
    console.log(`[PushNotification] Removed expired subscription: ${docId.slice(0, 16)}...`);
  } catch (err) {
    // ignore
  }
}

/**
 * Fetch all active admin push subscriptions by merging Memory, File, and Firestore
 */
export async function getPushSubscriptions(): Promise<PushSubscriptionData[]> {
  loadSubscriptionsFromFile();
  const subMap = new Map<string, PushSubscriptionData>(inMemorySubscriptions);

  try {
    const snapshot = await adminDb.collection("admin_push_subscriptions").get();
    snapshot.docs.forEach((doc) => {
      const data = doc.data() as PushSubscriptionData;
      if (data && data.endpoint) {
        subMap.set(data.endpoint, data);
        inMemorySubscriptions.set(data.endpoint, data);
      }
    });
  } catch (err) {
    // Fall back smoothly to memory + file
  }

  const list = Array.from(subMap.values());
  console.log(`[PushNotification] Total active admin push subscriptions available: ${list.length}`);
  return list;
}

/**
 * Send real-time Web Push notification to all subscribed admin devices.
 * Works even when the browser or app is completely closed.
 */
export async function sendOrderPushNotification(payload: {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}): Promise<{ sent: number; failed: number }> {
  const subscriptions = await getPushSubscriptions();
  if (subscriptions.length === 0) {
    console.warn("[PushNotification] No active admin push subscriptions found. Make sure to tap 'Enable Alerts' in Admin Dashboard on your device.");
    return { sent: 0, failed: 0 };
  }

  const payloadString = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: "/notification-icon.png",
    badge: "/status-bar-badge.png",
    sound: "/modestas123123-cash-register-kaching-sound-effect-125042.mp3",
    url: payload.url || "/admin/orders",
    tag: payload.tag || `order-${Date.now()}`,
  });

  let sent = 0;
  let failed = 0;

  const promises = subscriptions.map(async (sub) => {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.keys.p256dh,
            auth: sub.keys.auth,
          },
        },
        payloadString,
        {
          TTL: 86400, // 24 hours delivery window
          urgency: "high",
        }
      );
      sent++;
      console.log(`[PushNotification] Delivered push successfully to ${sub.userAgent?.slice(0, 40) || sub.endpoint.slice(0, 30)}`);
    } catch (err: any) {
      failed++;
      console.warn(`[PushNotification] Delivery failed for ${sub.endpoint.slice(0, 45)}... status: ${err.statusCode || err.message}`);
      // If subscription has expired or is unregistered, prune it
      if (err.statusCode === 404 || err.statusCode === 410) {
        await removePushSubscription(sub.endpoint);
      }
    }
  });

  await Promise.allSettled(promises);
  console.log(`[PushNotification] Push dispatch completed: ${sent} delivered, ${failed} failed out of ${subscriptions.length} device(s)`);
  return { sent, failed };
}


