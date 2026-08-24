// ApexMind Store Background Service Worker
const CACHE_NAME = "apexmind-sw-v5";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle real-time Web Push when the browser / app is closed
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { 
      title: "🎉 New Order Received!", 
      body: event.data ? event.data.text() : "A new order was placed on your store!" 
    };
  }

  const title = data.title || "🎉 New Order Received!";
  const options = {
    body: data.body || "A new order was placed on store",
    icon: "/favicon.png",
    badge: "/favicon.png",
    vibrate: [250, 100, 250, 100, 250],
    tag: data.tag || `order-${Date.now()}`,
    renotify: true,
    data: {
      url: data.url || "/admin/orders"
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Open admin orders page when tapping the notification
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || "/admin/orders";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url && client.url.includes("/admin") && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
