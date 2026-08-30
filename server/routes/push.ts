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
  const { subscription } = req.body;
  if (!subscription || !subscription.endpoint || !subscription.keys) {
    res.status(400).json({ error: "Invalid push subscription object" });
    return;
  }

  try {
    await savePushSubscription({
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      userAgent: req.headers["user-agent"],
      createdAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
    });
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
