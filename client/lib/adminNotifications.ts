import { useEffect, useState, useRef } from "react";
import { formatCurrency, type Currency } from "@/lib/currency";
import { adminAuthHeaders } from "@/lib/admin-auth";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import type { Order, OrderListResponse } from "@shared/api";

const NOTIFICATION_SOUND_PATH = "/modestas123123-cash-register-kaching-sound-effect-125042.mp3";
const NOTIFIED_ORDERS_KEY = "apexmind_notified_order_ids";

// Global cache of notified order IDs to prevent duplicate alerts across tabs/instances
const notifiedOrderIds = new Set<string>();

// Load previously notified orders from localStorage on startup
if (typeof window !== "undefined") {
  try {
    const stored = localStorage.getItem(NOTIFIED_ORDERS_KEY);
    if (stored) {
      const parsed: string[] = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        parsed.slice(-100).forEach((id) => notifiedOrderIds.add(id));
      }
    }
  } catch (e) {
    // ignore
  }
}

/**
 * Mark an order ID as notified. Returns true if it was newly marked, false if already seen.
 */
function markOrderAsNotified(orderId: string): boolean {
  if (!orderId) return false;
  if (notifiedOrderIds.has(orderId)) {
    return false;
  }
  notifiedOrderIds.add(orderId);
  if (typeof window !== "undefined") {
    try {
      const list = Array.from(notifiedOrderIds).slice(-100);
      localStorage.setItem(NOTIFIED_ORDERS_KEY, JSON.stringify(list));
    } catch (e) {
      // ignore
    }
  }
  return true;
}

// Single preloaded Audio instance for only the custom cash register sound
let audioInstance: HTMLAudioElement | null = null;

function getAudioInstance(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!audioInstance) {
    audioInstance = new Audio(NOTIFICATION_SOUND_PATH);
    audioInstance.preload = "auto";
  }
  return audioInstance;
}

// Unlock audio on mobile devices upon the very first user interaction
if (typeof window !== "undefined") {
  const unlockAudio = () => {
    try {
      const audio = getAudioInstance();
      if (audio) {
        audio.load();
      }
    } catch (e) {
      // ignore
    }
    window.removeEventListener("touchstart", unlockAudio);
    window.removeEventListener("click", unlockAudio);
    window.removeEventListener("keydown", unlockAudio);
  };
  window.addEventListener("touchstart", unlockAudio, { passive: true });
  window.addEventListener("click", unlockAudio, { passive: true });
  window.addEventListener("keydown", unlockAudio, { passive: true });
}

/**
 * Play ONLY the custom cash register sound effect from public folder
 */
export function playOrderChime() {
  try {
    const audio = getAudioInstance() || new Audio(NOTIFICATION_SOUND_PATH);
    audio.currentTime = 0;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn("Audio file playback blocked by browser:", err);
      });
    }
  } catch (e) {
    console.warn("Audio playback error:", e);
  }
}

/**
 * Helper to convert Base64 URL string to Uint8Array for VAPID key
 */
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Subscribe admin device for background Web Push notifications.
 * Works even when the browser or app is completely closed.
 */
export async function subscribeAdminToPush(): Promise<boolean> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return false;
  }
  try {
    const reg = await navigator.serviceWorker.ready;
    const headers = await adminAuthHeaders();
    const keyRes = await fetch("/api/admin/push-vapid-public-key", { headers });
    if (!keyRes.ok) return false;
    const { publicKey } = await keyRes.json();
    if (!publicKey) return false;

    let subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }

    // Save to server
    await fetch("/api/admin/push-subscribe", {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ subscription }),
    });

    return true;
  } catch (err) {
    console.warn("Background Web Push registration error:", err);
    return false;
  }
}

/**
 * Request permission for mobile push notifications and register background push
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    alert("Notifications are not supported in this browser. Please open in Safari or Chrome on your device.");
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      localStorage.setItem("apexmind_admin_notifications_enabled", "true");
      // Also register background Web Push subscription
      subscribeAdminToPush().catch(() => {});
      return true;
    } else {
      localStorage.setItem("apexmind_admin_notifications_enabled", "false");
      return false;
    }
  } catch (err) {
    console.warn("Notification permission request failed:", err);
    return false;
  }
}

export function areNotificationsEnabled(): boolean {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  return Notification.permission === "granted" && localStorage.getItem("apexmind_admin_notifications_enabled") !== "false";
}

// Cooldown tracker to prevent duplicate notifications firing within 1.5 seconds
let lastNotificationTime = 0;
let lastNotificationTag = "";

/**
 * Send native system notification (with cash register sound, silencing OS default chime)
 */
export async function sendOrderNotification(opts: {
  title?: string;
  body: string;
  url?: string;
  tag?: string;
}) {
  const now = Date.now();
  const tag = opts.tag || `order-${now}`;

  // Prevent duplicate execution of identical notification within 1.5s
  if (tag === lastNotificationTag && now - lastNotificationTime < 1500) {
    return;
  }
  lastNotificationTime = now;
  lastNotificationTag = tag;

  // Play ONLY our custom cash register sound
  playOrderChime();

  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate([200, 100, 200, 100, 200]);
    } catch (e) {
      // ignore
    }
  }

  if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  const title = opts.title || "🎉 New Order Received!";
  const options: NotificationOptions = {
    body: opts.body,
    icon: "/favicon.png",
    tag,
    // silent: true ensures the OS does NOT play its own default ding simultaneously
    silent: true,
    data: {
      url: opts.url || "/admin/orders",
    },
  };

  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, options);
        return;
      }
    }
  } catch (swErr) {
    console.warn("SW notification failed, falling back to Notification API:", swErr);
  }

  try {
    const notif = new Notification(title, options);
    notif.onclick = () => {
      window.focus();
      if (opts.url) {
        window.location.href = opts.url;
      }
    };
  } catch (e) {
    console.warn("Notification trigger error:", e);
  }
}

/**
 * Trigger an order notification with customer name and formatted amount
 */
function triggerOrderAlert(order: Order, currency: Currency) {
  const totalFormatted = formatCurrency(order.total || 0, currency);
  const customerName = order.customerName?.trim() || order.customerEmail?.split("@")[0] || "Customer";
  const itemsCount = order.items?.length || 1;
  const itemsLabel = itemsCount === 1 ? "item" : "items";

  sendOrderNotification({
    title: `🎉 New Order: ${totalFormatted}`,
    body: `${customerName} placed an order totaling ${totalFormatted} (${itemsCount} ${itemsLabel})`,
    url: "/admin/orders",
    tag: `order-${order.id}`,
  });
}

/**
 * React hook to listen for new store orders, play cash-register chime, and fire notification alerts.
 * Protected against duplicate notifications, single-sound playback, and auto-syncs background push.
 */
export function useOrderLiveAlerts(currency: Currency) {
  const [notifEnabled, setNotifEnabled] = useState(false);
  const initialLoadDoneRef = useRef(false);
  const currencyRef = useRef(currency);
  currencyRef.current = currency;

  useEffect(() => {
    const isEnabled = areNotificationsEnabled();
    setNotifEnabled(isEnabled);
    if (isEnabled) {
      subscribeAdminToPush().catch(() => {});
    }

    // 1. Real-time Firestore Listener (foreground active tab)
    let unsubscribeFirestore = () => {};
    try {
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(25));
      unsubscribeFirestore = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          const order = change.doc.data() as Order;
          const orderId = change.doc.id || order.id;

          if (change.type === "added") {
            if (!initialLoadDoneRef.current) {
              // Pre-populate known order IDs on initial load without firing alerts
              notifiedOrderIds.add(orderId);
            } else {
              // Only fire if order is new and hasn't been notified yet
              if (markOrderAsNotified(orderId)) {
                triggerOrderAlert(order, currencyRef.current);
              }
            }
          }
        });

        if (!initialLoadDoneRef.current) {
          initialLoadDoneRef.current = true;
        }
      }, (err) => {
        console.warn("Firestore onSnapshot error, relying on REST polling:", err);
      });
    } catch (e) {
      console.warn("Firestore listener setup failed:", e);
    }

    // 2. Continuous REST API Polling Backup
    const checkOrdersViaApi = async () => {
      try {
        const headers = await adminAuthHeaders();
        const res = await fetch("/api/admin/orders", { 
          headers: { ...headers, "Content-Type": "application/json" } 
        });
        if (!res.ok) return;

        const data: OrderListResponse = await res.json();
        const orders: Order[] = data.orders || [];

        if (!initialLoadDoneRef.current) {
          orders.forEach((o) => notifiedOrderIds.add(o.id));
          initialLoadDoneRef.current = true;
          return;
        }

        // Detect new orders strictly using global deduplicator
        for (const order of orders) {
          if (markOrderAsNotified(order.id)) {
            triggerOrderAlert(order, currencyRef.current);
          }
        }
      } catch (err) {
        // quiet polling error
      }
    };

    checkOrdersViaApi();
    const interval = setInterval(checkOrdersViaApi, 6000);

    return () => {
      unsubscribeFirestore();
      clearInterval(interval);
    };
  }, []);

  const toggleNotifications = async () => {
    if (notifEnabled) {
      localStorage.setItem("apexmind_admin_notifications_enabled", "false");
      setNotifEnabled(false);
    } else {
      const granted = await requestNotificationPermission();
      setNotifEnabled(granted);
      if (granted) {
        sendOrderNotification({
          title: "🔔 Notifications Active",
          body: "You will receive real-time cash register alerts whenever a customer places an order!",
          url: "/admin/orders",
          tag: "notification-enabled",
        });
      }
    }
  };

  const testNotification = async () => {
    const sampleAmount = formatCurrency(15000, currency);
    sendOrderNotification({
      title: `🎉 New Order: ${sampleAmount}`,
      body: `Alex Morgan placed an order totaling ${sampleAmount} (2 items)`,
      url: "/admin/orders",
      tag: `test-order-${Date.now()}`,
    });

    // Also trigger server-side test push if subscribed
    try {
      const headers = await adminAuthHeaders();
      await fetch("/api/admin/push-test", { method: "POST", headers });
    } catch (e) {
      // ignore
    }
  };

  return {
    notifEnabled,
    toggleNotifications,
    testNotification,
  };
}
