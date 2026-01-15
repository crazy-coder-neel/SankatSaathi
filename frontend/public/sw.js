const CACHE_NAME = 'sankatsaathi-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.webmanifest',
    '/vite.svg'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
    );
});

self.addEventListener('fetch', (event) => {
    // Only intercept GET requests for same-origin assets we want to cache
    if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            // Return cached response OR fetch from network
            return response || fetch(event.request).catch(() => {
                // Fallback or just let it fail if network is down
            });
        })
    );
});

self.addEventListener('push', function (event) {
    console.log('SW: Push Received', event);
    if (!event.data) {
        console.warn('SW: Push event had no data.');
        return;
    }

    try {
        const data = event.data.json();
        console.log('SW: Push Data Parsing', data);

        const options = {
            body: data.body,
            icon: '/vite.svg',
            vibrate: [200, 100, 200],
            data: data.data,
            tag: 'emergency-alert',
            requireInteraction: true, // Keep notification visible until user clicks/dismisses
            actions: [
                { action: 'open', title: 'View Details' }
            ]
        };

        event.waitUntil(
            self.registration.showNotification(data.title, options)
                .then(() => console.log('SW: Notification Shown'))
                .catch(err => console.error('SW: Failed to show notification', err))
        );
    } catch (e) {
        console.error('Push error:', e);
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    const incident_id = event.notification.data?.incident_id;
    const urlToOpen = incident_id ? `/intelligence?id=${incident_id}` : '/intelligence';

    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(windowClients => {
            for (var i = 0; i < windowClients.length; i++) {
                var client = windowClients[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
