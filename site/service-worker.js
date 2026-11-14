const CACHE_NAME = 'bc2-app-shell-secure-v34-download-conta';
const APP_SHELL = [
  './',
  './index.html',
  './mobile.css', './mobile-ui.js?v=download-conta-20261109', './connection.js', './scanner-photo.js', './install-app.js', './vendor/zxing-browser-0.2.1.min.js',
  './manifest.webmanifest',
  './firebase-config.js',
  './epi-folders.js', './epi-folders.css', './record-client.js?v=download-conta-20261109', './app.js?v=download-conta-20261109',
  './auth-registration.js',
  './epi-core.js',
  './epi-central.js',
  './epi-cadastro.js',
  './epi-cadastro.css',
  './icons/bc2.svg',
  './icons/bc2-192.png',
  './icons/bc2-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys
        .filter(key => key.startsWith('bc2-app-shell-') && key !== CACHE_NAME)
        .map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  // Sessão, dados, aprovações e log nunca podem ser guardados no cache offline.
  if (url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy));
          }
          return response;
        })
        .catch(() => new Response('<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BC2 — conexão necessária</title><body style="font:16px system-ui;background:#f5f7f5;color:#244234;padding:40px 24px;text-align:center"><h1>Conecte-se para usar o BC2</h1><p>O aplicativo funciona somente com internet. Ative o Wi-Fi ou os dados móveis.</p><p><a href="./" style="color:#176b45">Tentar novamente</a></p></body></html>',{status:503,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}}))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      const update = fetch(request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      });
      return cached || update;
    })
  );
});
