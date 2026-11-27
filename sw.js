// Offline caching for 食譜 (see data-storage-spec §6 and the caching notes in design-direction).
// - App shell (HTML/JS/CSS/icons): precached at install, replaced when a new build is deployed.
// - Cover photos (covers/*.jpg): cached the first time they're shown; max 100, oldest removed.
// - recipes.json is NOT cached here: the app keeps its own copy and refreshes it in the background.
const VERSION = '20261127122801';
const SHELL = 'shell-' + VERSION;
const COVERS = 'covers-v1';
const MAX_COVERS = 100;
const ASSETS = ["assets/index-BTkHIcDV.css","assets/index-b20JQG1-.js","assets/inter-cyrillic-ext-wght-normal-BOeWTOD4.woff2","assets/inter-cyrillic-wght-normal-DqGufNeO.woff2","assets/inter-greek-ext-wght-normal-DlzME5K_.woff2","assets/inter-greek-wght-normal-CkhJZR-_.woff2","assets/inter-latin-ext-wght-normal-DO1Apj_S.woff2","assets/inter-latin-wght-normal-Dx4kXJAl.woff2","assets/inter-tight-cyrillic-ext-wght-normal-okcGN4Nq.woff2","assets/inter-tight-cyrillic-wght-normal-BS41q_Tv.woff2","assets/inter-tight-greek-ext-wght-normal-DQgQPNk4.woff2","assets/inter-tight-greek-wght-normal-sS1B39LI.woff2","assets/inter-tight-latin-ext-wght-normal-B4u9PlvR.woff2","assets/inter-tight-latin-wght-normal-DX-nOvPD.woff2","assets/inter-tight-vietnamese-wght-normal-TKKdAiBA.woff2","assets/inter-vietnamese-wght-normal-CBcvBZtf.woff2"];
const PRECACHE = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/apple-touch-icon.png', ...ASSETS];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('shell-') && k !== SHELL).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function trimCovers() {
  const c = await caches.open(COVERS);
  const keys = await c.keys();
  for (let i = 0; i < keys.length - MAX_COVERS; i++) await c.delete(keys[i]);
}

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (url.pathname.includes('/covers/')) {
    e.respondWith(
      caches.open(COVERS).then(async (c) => {
        const hit = await c.match(e.request);
        if (hit) return hit;
        const res = await fetch(e.request);
        if (res.ok) { await c.put(e.request, res.clone()); trimCovers(); }
        return res;
      })
    );
    return;
  }

  if (e.request.mode === 'navigate') {
    // Network first so a new build shows up; fall back to the cached shell offline.
    e.respondWith(fetch(e.request).catch(() => caches.match('index.html')));
    return;
  }

  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request)));
});
