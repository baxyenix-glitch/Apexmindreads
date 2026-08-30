import type { RequestHandler } from "express";
import { 
  VAPID_PUBLIC_KEY, 
  savePushSubscription, 
  removePushSubscription, 
  sendOrderPushNotification 
} from "../lib/pushNotifications.js";

/** GET /api/admin/push-vapid-public-key */
export const handleGetVapidPublicKey: RequestHandler = (_req, res) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
};

/** POST /api/admin/push-subscribe */
export const handlePushSubscribe: RequestHandler = async (req, res) => {
  const sub = req.body.subscription || req.body;
  if (!sub || !sub.endpoint || !sub.keys || !sub.keys.p256dh || !sub.keys.auth) {
    res.status(400).json({ error: "Invalid push subscription object. Required: endpoint, keys.p256dh, keys.auth" });
    return;
  }

  try {
    await savePushSubscription({
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
      },
      userAgent: req.headers["user-agent"],
      createdAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
    });
    console.log(`[PushNotification] Successfully saved push subscription for ${req.headers["user-agent"]?.slice(0, 50) || "device"}`);
    res.json({ ok: true, message: "Push subscription registered successfully" });
  } catch (err: any) {
    console.error("Failed to register push subscription:", err);
    res.status(500).json({ error: err.message || "Failed to register subscription" });
  }
};

/** POST /api/admin/push-unsubscribe */
export const handlePushUnsubscribe: RequestHandler = async (req, res) => {
  const { endpoint } = req.body;
  if (!endpoint) {
    res.status(400).json({ error: "Endpoint is required" });
    return;
  }

  try {
    await removePushSubscription(endpoint);
    res.json({ ok: true, message: "Push subscription removed" });
  } catch (err: any) {
    console.error("Failed to remove push subscription:", err);
    res.status(500).json({ error: err.message || "Failed to remove subscription" });
  }
};

/** GET /api/admin/push-status */
export const handleGetPushStatus: RequestHandler = async (_req, res) => {
  try {
    const { getPushSubscriptions } = await import("../lib/pushNotifications.js");
    const subs = await getPushSubscriptions();
    res.json({
      ok: true,
      activeDevices: subs.length,
      devices: subs.map((s) => ({
        endpoint: s.endpoint.slice(0, 45) + "...",
        userAgent: s.userAgent || "Unknown Device",
        updatedAt: (s as any).updatedAt || s.createdAt,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to get push status" });
  }
};

/** POST /api/admin/push-test */
export const handlePushTest: RequestHandler = async (req, res) => {
  try {
    const result = await sendOrderPushNotification({
      title: "🎉 New Order: ₦15,000",
      body: "Alex Morgan placed an order totaling ₦15,000 (2 items)",
      url: "/admin/orders",
      tag: `test-push-${Date.now()}`,
    });
    res.json({ ok: true, ...result, message: `Test push dispatched to ${result.sent} active admin device(s)` });
  } catch (err: any) {
    console.error("Failed to send test push:", err);
    res.status(500).json({ error: err.message || "Failed to send test push" });
  }
};

