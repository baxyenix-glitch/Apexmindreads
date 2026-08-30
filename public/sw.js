// ApexMind Store Background Service Worker
const CACHE_NAME = "apexmind-sw-v8";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Clear older caches if needed
      caches.keys().then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        )
      ),
    ])
  );
});

// Handle real-time Web Push when the browser / app is closed or backgrounded
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
    body: data.body || "A new order was placed on your store",
    icon: data.icon || "/notification-icon.png",
    badge: data.badge || "/status-bar-badge.png", // Displays bold Apex status icon in Android top status bar
    sound: data.sound || "/modestas123123-cash-register-kaching-sound-effect-125042.mp3",
    vibrate: [300, 100, 300, 100, 300],
    tag: data.tag || `order-${Date.now()}`,
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.url || "/admin/orders",
      timestamp: Date.now(),
    },
  };

  const showNotificationPromise = self.registration.showNotification(title, options);

  // Broadcast to all open client tabs so active tabs play custom audio immediately
  const broadcastPromise = self.clients
    .matchAll({ type: "window", includeUncontrolled: true })
    .then((clients) => {
      clients.forEach((client) => {
        client.postMessage({ type: "PLAY_ORDER_SOUND", payload: data });
      });
    })
    .catch(() => {});

  event.waitUntil(Promise.all([showNotificationPromise, broadcastPromise]));
});

// Open admin orders page when tapping the notification
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || "/admin/orders";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url && client.url.includes("/admin") && "focus" in client) {
          if ("navigate" in client) {
            client.navigate(urlToOpen);
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
