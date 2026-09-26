// Offline support: serve the game files from a cache, refresh them in the background.
const CACHE = 'mw-v1';
const FILES = ['./', 'index.html', 'css/style.css', 'js/main.js', 'js/play.js', 'js/skills.js',
  'js/visuals.js', 'js/progress.js', 'js/audio.js', 'icon.svg', 'manifest.webmanifest'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(e.request);
    const net = fetch(e.request).then(r => { if (r.ok && r.type === 'basic') c.put(e.request, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
