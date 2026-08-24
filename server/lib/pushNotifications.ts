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

/**
 * Save a push subscription to Firestore
 */
export async function savePushSubscription(sub: PushSubscriptionData): Promise<void> {
  if (!sub || !sub.endpoint) return;
  try {
    const docId = Buffer.from(sub.endpoint).toString("base64url").slice(0, 100);
    await adminDb.collection("admin_push_subscriptions").doc(docId).set({
      ...sub,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.error("Failed to save push subscription:", err);
  }
}

/**
 * Remove an expired or unsubscribed push subscription
 */
export async function removePushSubscription(endpoint: string): Promise<void> {
  if (!endpoint) return;
  try {
    const docId = Buffer.from(endpoint).toString("base64url").slice(0, 100);
    await adminDb.collection("admin_push_subscriptions").doc(docId).delete();
  } catch (err) {
    console.error("Failed to remove push subscription:", err);
  }
}

/**
 * Fetch all active admin push subscriptions from Firestore
 */
export async function getPushSubscriptions(): Promise<PushSubscriptionData[]> {
  try {
    const snapshot = await adminDb.collection("admin_push_subscriptions").get();
    return snapshot.docs.map((doc) => doc.data() as PushSubscriptionData);
  } catch (err) {
    console.error("Failed to get push subscriptions:", err);
    return [];
  }
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
    return { sent: 0, failed: 0 };
  }

  const payloadString = JSON.stringify({
    title: payload.title,
    body: payload.body,
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
    } catch (err: any) {
      failed++;
      // If subscription has expired or is unregistered, prune it from database
      if (err.statusCode === 404 || err.statusCode === 410) {
        await removePushSubscription(sub.endpoint);
      } else {
        console.warn("Web Push send error for endpoint:", err.message || err);
      }
    }
  });

  await Promise.allSettled(promises);
  return { sent, failed };
}
