const CACHE = 'vaultpulse-current-package-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/icons/vaultpulse-icon-1024.png',
  './assets/vaultpulse-splash-screen.png'
];

const OFFLINE_HTML = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>VaultPulse Offline</title><style>body{font-family:Inter,system-ui,sans-serif;background:#050816;color:#eef5ff;display:grid;place-items:center;min-height:100vh;padding:24px;margin:0}.box{max-width:440px;padding:24px;border-radius:24px;background:rgba(19,28,54,.8);border:1px solid rgba(94,231,255,.18)}h1{margin:0 0 10px;background:linear-gradient(90deg,#5ee7ff,#6ea8ff);-webkit-background-clip:text;background-clip:text;color:transparent}p{color:#a6b7d6}</style></head><body><div class="box"><h1>VaultPulse</h1><p>You are offline. Cached screens and saved local data still work. Reconnect later to refresh app assets.</p></div></body></html>`;

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache =>
      cache.addAll(ASSETS.filter(Boolean)).then(() =>
        cache.put('./offline.html', new Response(OFFLINE_HTML, {headers:{'Content-Type':'text/html'}}))
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(cache => cache.put(req, copy));
          return res;
        })
        .catch(async () => (await caches.match(req)) || (await caches.match('./index.html')) || (await caches.match('./offline.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => {
      return cached || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(cache => cache.put(req, copy));
        return res;
      }).catch(() => cached);
    })
  );
});