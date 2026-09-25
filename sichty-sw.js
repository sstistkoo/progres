const CACHE_NAME = 'sichty-cache-v7';
const CACHE_FILES = [
    'sichty.html',
    'sichty-manifest.json',
    'icon-192.png',
    'icon-512.png',
    'icon-maskable.png',
    'apple-touch-icon.png'
];

// Ikony (šipky měsíců, kalkulačka, ...) - bez nich by offline zůstala prázdná tlačítka
const FONT_AWESOME_BASE = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/';
const CDN_FILES = [
    FONT_AWESOME_BASE + 'css/all.min.css',
    FONT_AWESOME_BASE + 'webfonts/fa-solid-900.woff2'
];

const LOCAL_URLS = new Set(CACHE_FILES.map((f) => new URL(f, self.registration.scope).href));

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) =>
            // cache: 'reload' - vzít soubory ze serveru, ne případně starou kopii z HTTP cache prohlížeče
            cache.addAll(CACHE_FILES.map((f) => new Request(f, { cache: 'reload' }))).then(() =>
                // CDN je jen bonus - když zrovna nejde, instalace kvůli tomu nesmí selhat
                cache.addAll(CDN_FILES).catch(() => {})
            )
        )
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

function cacheResponse(request, response) {
    if (response && response.status === 200) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
    }
    return response;
}

self.addEventListener('fetch', (event) => {
    const request = event.request;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);
    url.search = '';
    url.hash = '';
    const isLocalAppFile = LOCAL_URLS.has(url.href);
    const isFontAwesome = request.url.startsWith(FONT_AWESOME_BASE);

    // Service worker má rozsah celé složky - ostatní stránky webu (index.html, cas.html, ...)
    // necháme jít normálně na síť, ať se jim nikdy nepodstrčí stará verze z cache.
    if (!isLocalAppFile && !isFontAwesome) return;

    if (request.mode === 'navigate') {
        // Samotná stránka: nejdřív síť (nová verze hned), offline záloha z cache
        event.respondWith(
            fetch(request)
                .then((response) => cacheResponse(request, response))
                .catch(() => caches.match(request, { ignoreSearch: true }))
        );
        return;
    }

    // Ostatní (ikony, manifest, Font Awesome): nejdřív cache, na pozadí dotažení nové verze
    event.respondWith(
        caches.match(request, { ignoreSearch: true }).then((cached) => {
            const networkFetch = fetch(request)
                .then((response) => cacheResponse(request, response))
                .catch(() => cached);
            return cached || networkFetch;
        })
    );
});
