// ApexMind Admin PWA Service Worker
const CACHE_NAME = "apexmind-admin-v2";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle push notifications
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: "🎉 New Order Received!", body: event.data ? event.data.text() : "A new order was placed on your store!" };
  }

  const title = data.title || "🎉 New Order Received!";
  const options = {
    body: data.body || "A new order was placed on your store!",
    icon: "/favicon.png",
    badge: "/favicon.png",
    vibrate: [200, 100, 200, 100, 200],
    data: {
      url: data.url || "/admin/orders"
    },
    actions: [
      { action: "view", title: "View Order" }
    ]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Open admin order page on notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || "/admin/orders";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes("/admin") && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
