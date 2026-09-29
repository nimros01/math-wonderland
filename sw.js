// Offline support. Game files come from the network when it's there, so a new version shows up on
// the next launch; the cache is only a fallback for playing offline.
const CACHE = 'mw-v12';
const FILES = ['./', 'index.html', 'css/style.css', 'js/main.js', 'js/play.js', 'js/skills.js',
  'js/visuals.js', 'js/progress.js', 'js/audio.js', 'js/cloud.js', 'js/cloud-config.js', 'js/worlds.js', 'js/meadow2.js', 'js/country.js', 'js/ocean.js', 'js/candy.js', 'js/desert.js', 'js/volcano.js', 'js/space.js', 'js/help.js', 'js/solve.js', 'js/sol-basic.js', 'js/sol-pics.js', 'js/sol-words.js', 'js/sol-all.js', 'js/sol-pics2.js', 'js/sol-ocean.js', 'js/sol-candy.js', 'icon.svg', 'manifest.webmanifest'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (/googleapis\.com$/.test(new URL(e.request.url).hostname) && !e.request.url.includes('fonts.')) return; // family sync goes straight to the network
  e.respondWith(
    fetch(e.request)
      .then(r => {
        if (r.ok && (r.type === 'basic' || r.type === 'cors')) {
          const copy = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return r;
      })
      .catch(() => caches.match(e.request)),
  );
});
