// Custom service worker for handling push notifications
// Workbox will inject the precache manifest here
const precacheManifest = self.__WB_MANIFEST || [];

// Precache static assets
self.addEventListener('install', function(event) {
  console.log('📦 Service worker installing, precaching assets...');
  event.waitUntil(
    caches.open('v1').then(function(cache) {
      return cache.addAll(precacheManifest.map(entry => entry.url || entry));
    })
  );
});

// Handle push notifications
self.addEventListener('push', function(event) {
  console.log('🔔 Push notification received:', event);
  
  if (!event.data) {
    console.warn('Push event has no data');
    return;
  }

  try {
    // Parse notification data
    const notificationData = event.data.json();
    console.log('📨 Notification data:', notificationData);
    
    const options = {
      body: notificationData.body,
      icon: notificationData.icon || '/pwa-192x192.png',
      badge: notificationData.badge || '/pwa-192x192.png',
      data: notificationData.data,
      requireInteraction: false,
      tag: 'push-notification',
    };

    event.waitUntil(
      self.registration.showNotification(notificationData.title, options)
    );
  } catch (error) {
    console.error('❌ Error processing push notification:', error);
    
    // Fallback notification if parsing fails
    event.waitUntil(
      self.registration.showNotification('Новое уведомление', {
        body: 'У вас есть новое уведомление',
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
      })
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  console.log('🖱️ Notification click:', event);
  
  event.notification.close();
  
  // Open the app when notification is clicked
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});

self.addEventListener('notificationclose', function(event) {
  console.log('❌ Notification closed:', event);
  // Track notification close events if needed
});

// Handle service worker activation
self.addEventListener('activate', function(event) {
  console.log('✅ Service worker activated');
  event.waitUntil(self.clients.claim());
});

console.log('🚀 Push notification service worker loaded');
