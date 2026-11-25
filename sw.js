// 離線快取：App 本身的檔案先存起來，沒網路也能打開。
// 食譜資料另外存在這台裝置上，連上網後再和 GitHub 同步。
const CACHE = 'recipes-v2';
const SHELL = [
  './', 'index.html', 'style.css', 'app.js', 'config.js',
  'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // GitHub API（食譜資料）不經過快取
  if (url.hostname === 'api.github.com') return;

  const sameOrigin = url.origin === self.location.origin;
  const cacheable = sameOrigin || /^(fonts\.googleapis\.com|fonts\.gstatic\.com|www\.gstatic\.com)$/.test(url.hostname);
  if (!cacheable) return;

  // 先用網路（拿到最新版），失敗時用快取
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok || res.type === 'opaque') {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req).then(r => r || (req.mode === 'navigate' ? caches.match('index.html') : undefined)))
  );
});
