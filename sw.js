const CACHE_NAME = 'customer-app-v3';
const ASSETS = [
    './',
    './index.html',
    './styles/main.css',
    './styles/customer.css',
    './js/db.js',
    './js/customer.js',
    './js/form-config.js',
    './js/form-generator.js',
    './js/ui.js',
    './manifest.json',
    './icons/icon-72x72.png',
    './icons/icon-96x96.png',
    './icons/icon-128x128.png',
    './icons/icon-144x144.png',
    './icons/icon-152x152.png',
    './icons/icon-192x192.png',
    './icons/icon-384x384.png',
    './icons/icon-512x512.png',
    'https://fonts.googleapis.com/icon?family=Material+Icons',
    'https://fonts.gstatic.com/s/materialicons/v140/flUhRq6tzZclQEJ-Vdg-IuiaDsNc.woff2'
];

// Install event - cache assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        }).then(() => {
            // Take control of all pages under scope immediately
            return self.clients.claim();
        })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
    // Skip chrome-extension URLs
    if (event.request.url.startsWith('chrome-extension://')) {
        return;
    }

    // Handle navigation requests differently
    if (event.request.mode === 'navigate') {
        event.respondWith(
            caches.match('./index.html')
                .then(response => {
                    return response || fetch(event.request);
                })
        );
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }

                return fetch(event.request).then(response => {
                    // Check if we received a valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clone the response
                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                }).catch(() => {
                    // Return a fallback response for failed fetches
                    if (event.request.url.endsWith('.png') || 
                        event.request.url.endsWith('.jpg') || 
                        event.request.url.endsWith('.jpeg')) {
                        return new Response(
                            '<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">' +
                            '<rect width="100" height="100" fill="#eee"/>' +
                            '<text x="50" y="50" text-anchor="middle" dy=".3em" fill="#aaa">Image</text>' +
                            '</svg>',
                            { headers: { 'Content-Type': 'image/svg+xml' } }
                        );
                    }
                    return new Response('Offline');
                });
            })
    );
}); 