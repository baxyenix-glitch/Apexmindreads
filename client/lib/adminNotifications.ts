import { useEffect, useState, useRef } from "react";
import { formatCurrency, type Currency } from "@/lib/currency";
import { adminAuthHeaders } from "@/lib/admin-auth";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import type { Order, OrderListResponse } from "@shared/api";
import { toast } from "sonner";

const NOTIFICATION_SOUND_PATH = "/modestas123123-cash-register-kaching-sound-effect-125042.mp3";
const NOTIFICATION_ICON_PATH = "/notification-icon.png";
const STATUS_BAR_BADGE_PATH = "/status-bar-badge.png";
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

// ─── Dual-Engine Audio Player (Web Audio API Buffer + Synthesizer + HTMLAudioElement) ───
let globalAudioCtx: AudioContext | null = null;
let decodedAudioBuffer: AudioBuffer | null = null;
let htmlAudioInstance: HTMLAudioElement | null = null;
let isKeepAliveRunning = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!globalAudioCtx) {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      globalAudioCtx = new AudioCtx();
    }
  }
  return globalAudioCtx;
}

function getHtmlAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!htmlAudioInstance) {
    htmlAudioInstance = new Audio(NOTIFICATION_SOUND_PATH);
    htmlAudioInstance.preload = "auto";
    htmlAudioInstance.volume = 1.0;
  }
  return htmlAudioInstance;
}

// Pre-fetch and decode the cash register sound file into an in-memory AudioBuffer
async function loadAudioBuffer() {
  if (typeof window === "undefined") return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const res = await fetch(NOTIFICATION_SOUND_PATH);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();
    
    // Cross-browser decode supporting both promise and callback formats
    if (ctx.decodeAudioData.length === 2) {
      ctx.decodeAudioData(arrayBuffer, (decoded) => {
        decodedAudioBuffer = decoded;
      }, (err) => {
        console.warn("Decode audio error:", err);
      });
    } else {
      decodedAudioBuffer = await ctx.decodeAudioData(arrayBuffer);
    }
  } catch (e) {
    console.warn("Could not pre-decode audio buffer, will use HTMLAudio fallback:", e);
  }
}

// Initialize buffer loading
if (typeof window !== "undefined") {
  loadAudioBuffer().catch(() => {});
}

/**
 * Robust mobile audio unlocking on user interactions with keep-alive loop.
 * Resumes AudioContext and starts a silent loop so mobile hardware never sleeps.
 */
export function unlockMobileAudio() {
  if (typeof window === "undefined") return;

  try {
    const ctx = getAudioContext();
    if (ctx) {
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }

      // Start continuous silent keep-alive buffer if not already running
      if (!isKeepAliveRunning) {
        const silentBuffer = ctx.createBuffer(1, 44100, 44100);
        const source = ctx.createBufferSource();
        source.buffer = silentBuffer;
        source.loop = true;
        const gain = ctx.createGain();
        gain.gain.value = 0.00001; // Practically inaudible, keeps mobile audio channel awake
        source.connect(gain);
        gain.connect(ctx.destination);
        source.start(0);
        isKeepAliveRunning = true;
      }
    }

    if (!decodedAudioBuffer) {
      loadAudioBuffer().catch(() => {});
    }

    const audio = getHtmlAudio();
    if (audio) {
      audio.volume = 1.0;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          audio.pause();
          audio.currentTime = 0;
        }).catch(() => {});
      }
    }
  } catch (e) {
    // ignore
  }
}

if (typeof window !== "undefined") {
  const handleUserGesture = () => {
    unlockMobileAudio();
  };
  window.addEventListener("touchstart", handleUserGesture, { passive: true });
  window.addEventListener("touchend", handleUserGesture, { passive: true });
  window.addEventListener("click", handleUserGesture, { passive: true });
  window.addEventListener("pointerdown", handleUserGesture, { passive: true });
}

/**
 * Synthesizes a high-pitch metallic cash register "ka-ching" chime as a bulletproof zero-fail backup
 */
function playSynthesizedCashChime(ctx: AudioContext) {
  try {
    const now = ctx.currentTime;
    
    // First high tone (the "ka")
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "triangle";
    osc1.frequency.setValueAtTime(1318.5, now); // E6
    osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.08); // A6
    gain1.gain.setValueAtTime(0.8, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.15);

    // Second metallic bell ring (the "ching")
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(2637, now + 0.09); // E7
    osc2.frequency.exponentialRampToValueAtTime(3520, now + 0.7); // A7 harmonic
    gain2.gain.setValueAtTime(0.9, now + 0.09);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.09);
    osc2.stop(now + 0.85);
  } catch (e) {
    // ignore
  }
}

/**
 * Play the custom cash register sound effect from the public folder.
 * Uses Web Audio API buffer playback with HTML5 & synthesized fail-safes.
 */
export function playOrderChime() {
  if (typeof window === "undefined") return;

  // 1. Try Web Audio API Buffer playback (highest quality, direct audio hardware output)
  try {
    const ctx = getAudioContext();
    if (ctx) {
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
      if (decodedAudioBuffer) {
        const source = ctx.createBufferSource();
        source.buffer = decodedAudioBuffer;
        const gainNode = ctx.createGain();
        gainNode.gain.value = 1.3; // High clarity volume
        source.connect(gainNode);
        gainNode.connect(ctx.destination);
        source.start(0);
        return;
      } else {
        // If buffer is still loading, synthesize instant bell while starting HTMLAudio
        playSynthesizedCashChime(ctx);
      }
    }
  } catch (e) {
    console.warn("Web Audio buffer playback error:", e);
  }

  // 2. Fallback to HTMLAudioElement
  try {
    const audio = getHtmlAudio() || new Audio(NOTIFICATION_SOUND_PATH);
    audio.currentTime = 0;
    audio.volume = 1.0;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn("HTMLAudioElement playback blocked by browser:", err);
      });
    }
  } catch (e) {
    console.warn("HTMLAudioElement error:", e);
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

function arrayBufferToBase64Url(buffer: ArrayBuffer | null): string {
  if (!buffer) return "";
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Subscribe admin device for background Web Push notifications.
 * Works even when the browser or app is completely closed.
 */
export async function subscribeAdminToPush(): Promise<boolean> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("[Push] ServiceWorker or PushManager not available in this browser context");
    return false;
  }

  try {
    // 1. Explicitly register Service Worker with root scope
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    
    // 2. Fetch server VAPID public key
    const keyRes = await fetch("/api/admin/push-vapid-public-key");
    if (!keyRes.ok) {
      throw new Error(`Failed to fetch VAPID key: HTTP ${keyRes.status}`);
    }
    const { publicKey } = await keyRes.json();
    if (!publicKey) {
      throw new Error("Empty VAPID public key received from server");
    }

    // 3. Get existing push subscription
    let subscription = await reg.pushManager.getSubscription();

    // 4. If none exists, create new subscription with VAPID applicationServerKey
    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }

    // 5. Extract keys cleanly
    const subJson = subscription.toJSON ? subscription.toJSON() : (subscription as any);
    let p256dh = subJson.keys?.p256dh || (subscription.getKey ? arrayBufferToBase64Url(subscription.getKey("p256dh")) : "");
    let auth = subJson.keys?.auth || (subscription.getKey ? arrayBufferToBase64Url(subscription.getKey("auth")) : "");

    // If existing subscription had missing keys, re-subscribe
    if (!p256dh || !auth) {
      await subscription.unsubscribe().catch(() => {});
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const freshJson = subscription.toJSON();
      p256dh = freshJson.keys?.p256dh || "";
      auth = freshJson.keys?.auth || "";
    }

    const payload = {
      subscription: {
        endpoint: subscription.endpoint,
        keys: { p256dh, auth },
      },
    };

    // 6. Save subscription to server backend
    const response = await fetch("/api/admin/push-subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.warn("[Push] Server subscription registration failed with HTTP", response.status);
    } else {
      console.log("[Push] Successfully registered device for background push alerts");
    }

    return true;
  } catch (err) {
    console.error("[Push] Background Web Push registration error:", err);
    return false;
  }
}

/**
 * Request permission for mobile push notifications and register background push
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    alert("Notifications are not supported in this browser. Please open in Chrome or Safari on your mobile device.");
    return false;
  }

  unlockMobileAudio();

  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      localStorage.setItem("apexmind_admin_notifications_enabled", "true");
      // Immediately register background Web Push subscription
      await subscribeAdminToPush();
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

// Cooldown tracker to prevent duplicate notifications firing for the same order within 2 seconds
let lastNotificationTime = 0;
let lastNotificationTag = "";

/**
 * Send native system notification (with cash register sound and mobile status bar badge)
 */
export async function sendOrderNotification(opts: {
  title?: string;
  body: string;
  url?: string;
  tag?: string;
}) {
  const now = Date.now();
  const tag = opts.tag || `order-${now}`;

  // Prevent duplicate execution of identical notification within 2s
  if (tag === lastNotificationTag && now - lastNotificationTime < 2000) {
    return;
  }
  lastNotificationTime = now;
  lastNotificationTag = tag;

  // 1. Play ONLY our custom cash register sound
  playOrderChime();

  // 2. Vibrate phone
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate([300, 100, 300, 100, 300]);
    } catch (e) {
      // ignore
    }
  }

  // 3. Show In-App Banner Toast
  const title = opts.title || "🎉 New Order Received!";
  try {
    toast.success(title, {
      description: opts.body,
      duration: 10000,
      action: {
        label: "View Orders",
        onClick: () => {
          if (typeof window !== "undefined") {
            window.location.href = opts.url || "/admin/orders";
          }
        },
      },
    });
  } catch (e) {
    // ignore
  }

  if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  const options: any = {
    body: opts.body,
    icon: NOTIFICATION_ICON_PATH,
    badge: STATUS_BAR_BADGE_PATH, // Displays bold Apex status icon in Android top status bar
    tag,
    renotify: true, // Forces phone to pop up fresh visible notification banner
    requireInteraction: true,
    vibrate: [300, 100, 300, 100, 300],
    data: {
      url: opts.url || "/admin/orders",
    },
  };

  try {
    if ("serviceWorker" in navigator) {
      let reg: ServiceWorkerRegistration | undefined;
      try {
        reg = await navigator.serviceWorker.ready;
      } catch {}
      if (!reg) {
        reg = await navigator.serviceWorker.getRegistration();
      }
      if (reg && reg.showNotification) {
        await reg.showNotification(title, options);
        return;
      }
    }
  } catch (swErr) {
    console.warn("SW notification failed, falling back to Notification API:", swErr);
  }

  try {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      const notif = new Notification(title, options);
      notif.onclick = () => {
        window.focus();
        if (opts.url) {
          window.location.href = opts.url;
        }
      };
    }
  } catch (e) {
    console.warn("Notification trigger error:", e);
  }
}

/**
 * Trigger an order notification with customer name and formatted amount
 */
export function triggerOrderAlert(order: Order, currency: Currency) {
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

    // Listen for Service Worker push messages to play custom cash register sound in active tab
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "PLAY_ORDER_SOUND") {
        playOrderChime();
      }
    };

    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", handleServiceWorkerMessage);
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
      }, () => {
        // Silently rely on secure authenticated backend REST polling
      });
    } catch {
      // quiet
    }

    // 2. Continuous REST API Polling
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
    const interval = setInterval(checkOrdersViaApi, 3000);

    return () => {
      unsubscribeFirestore();
      clearInterval(interval);
      if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("message", handleServiceWorkerMessage);
      }
    };
  }, []);

  const toggleNotifications = async () => {
    unlockMobileAudio();
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
    unlockMobileAudio();
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
