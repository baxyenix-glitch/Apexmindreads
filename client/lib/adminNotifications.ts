import { useEffect, useState, useRef } from "react";
import { formatCurrency, type Currency } from "../lib/store";
import type { Order, OrderListResponse } from "../lib/api";

/**
 * Play a luxury POS cash register chime using Web Audio API
 */
export function playOrderChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Tone 1: High crisp bell (587.33Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.35, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.4);

    // Tone 2: Harmonious chime (880.00Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(880, now + 0.12);
    gain2.gain.setValueAtTime(0.4, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.7);
  } catch (e) {
    console.warn("Audio chime error:", e);
  }
}

/**
 * Request permission for mobile push notifications
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
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
  if (!("Notification" in window)) return false;
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

  if ("vibrate" in navigator) {
    try {
      navigator.vibrate([200, 100, 200, 100, 200]);
    } catch (e) {
      // ignore
    }
  }

  if (!("Notification" in window) || Notification.permission !== "granted") {
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

    // Initial check of orders
    const checkOrders = async () => {
      try {
        const token = localStorage.getItem("apexmind_admin_token");
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch("/api/admin/orders", { headers });
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

    // Initial fetch
    checkOrders();

    // Poll every 8 seconds
    const interval = setInterval(checkOrders, 8000);

    return () => {
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
    // Check if iOS
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
      // General instructions
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
