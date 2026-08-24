import { useEffect, useState, useRef } from "react";
import { formatCurrency, type Currency } from "@/lib/currency";
import { adminAuthHeaders } from "@/lib/admin-auth";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import type { Order, OrderListResponse } from "@shared/api";

// Cached AudioContext for instant playback
let globalAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!globalAudioCtx) {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      globalAudioCtx = new AudioCtx();
    }
  }
  if (globalAudioCtx && globalAudioCtx.state === "suspended") {
    globalAudioCtx.resume().catch(() => {});
  }
  return globalAudioCtx;
}

// Unlock audio on first touch/click anywhere on page
if (typeof window !== "undefined") {
  const unlockAudio = () => {
    getAudioContext();
    window.removeEventListener("touchstart", unlockAudio);
    window.removeEventListener("click", unlockAudio);
  };
  window.addEventListener("touchstart", unlockAudio, { passive: true });
  window.addEventListener("click", unlockAudio, { passive: true });
}

/**
 * Play a crisp luxury POS cash register chime using Web Audio API
 */
export function playOrderChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Tone 1: High crisp bell (587.33Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.4, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.45);

    // Tone 2: Harmonious chime (880.00Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(880, now + 0.14);
    gain2.gain.setValueAtTime(0.45, now + 0.14);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.14);
    osc2.stop(now + 0.8);
  } catch (e) {
    console.warn("Audio chime error:", e);
  }
}

/**
 * Request permission for mobile push notifications
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    alert("Notifications are not supported in this browser. Please open in Safari or Chrome on your phone.");
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      localStorage.setItem("apexmind_admin_notifications_enabled", "true");
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

/**
 * Send native system notification (without badge, with favicon logo & vibration)
 */
export async function sendOrderNotification(opts: {
  title?: string;
  body: string;
  url?: string;
}) {
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
    // No badge icon per user specification
    tag: `order-${Date.now()}`,
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
 * React hook to listen for new store orders, play chimes, and fire phone notification alerts
 */
export function useOrderLiveAlerts(currency: Currency) {
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [iosModal, setIosModal] = useState(false);
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const initialLoadDoneRef = useRef(false);

  useEffect(() => {
    setNotifEnabled(areNotificationsEnabled());

    // Listen for PWA install prompt (Android / Chrome / Edge)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // 1. Real-time Firestore Listener
    let unsubscribeFirestore = () => {};
    try {
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(25));
      unsubscribeFirestore = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          const order = change.doc.data() as Order;
          const orderId = change.doc.id || order.id;

          if (change.type === "added") {
            if (!initialLoadDoneRef.current) {
              knownOrderIdsRef.current.add(orderId);
            } else if (!knownOrderIdsRef.current.has(orderId)) {
              knownOrderIdsRef.current.add(orderId);
              const totalFormatted = formatCurrency(order.total || 0, currency);
              sendOrderNotification({
                title: "🎉 New Order Received!",
                body: `A new order totaling ${totalFormatted} was placed on store`,
                url: "/admin/orders",
              });
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
          orders.forEach((o) => knownOrderIdsRef.current.add(o.id));
          initialLoadDoneRef.current = true;
          return;
        }

        // Detect new orders
        for (const order of orders) {
          if (!knownOrderIdsRef.current.has(order.id)) {
            knownOrderIdsRef.current.add(order.id);
            const totalFormatted = formatCurrency(order.total, currency);
            sendOrderNotification({
              title: "🎉 New Order Received!",
              body: `A new order totaling ${totalFormatted} was placed on store`,
              url: "/admin/orders",
            });
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
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, [currency]);

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
          body: "You will receive real-time alerts whenever a customer places an order on your store!",
          url: "/admin",
        });
      }
    }
  };

  const testNotification = () => {
    sendOrderNotification({
      title: "🎉 New Order Received!",
      body: `A new order totaling ${formatCurrency(15000, currency)} was placed on store`,
      url: "/admin/orders",
    });
  };

  const triggerInstall = async () => {
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone;

    if (isStandalone) {
      alert("Apex Admin is already installed on your device!");
      return;
    }

    if (isIos) {
      setIosModal(true);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
    } else {
      setIosModal(true);
    }
  };

  return {
    notifEnabled,
    toggleNotifications,
    testNotification,
    triggerInstall,
    isInstallable,
    iosModal,
    setIosModal,
  };
}

