// App state. Everything here except the recipe data itself is device-only (spec §2).
import { fetchData, putData, GitHubError } from './github.js';

const K = {
  token: 'r.token', expires: 'r.tokenExpires', data: 'r.data', sha: 'r.sha', fetchedAt: 'r.fetchedAt',
  settings: 'r.settings', recent: 'r.recent', opened: 'r.opened', checks: 'r.checks', pending: 'r.pendingBookmarks',
  savedAt: 'r.savedAt', bannerDismissed: 'r.bannerDismissed'
};

function load(key, fallback) {
  try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); } catch { return fallback; }
}
function save(key, value) {
  try { if (value == null) localStorage.removeItem(key); else localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage full or blocked */ }
}

const defaultLang = (navigator.language || '').toLowerCase().startsWith('zh') ? 'zh' : 'en';

export const app = $state({
  token: load(K.token, null),
  tokenExpiresAt: load(K.expires, null),
  data: load(K.data, null),
  sha: load(K.sha, null),
  fetchedAt: load(K.fetchedAt, 0),
  loading: false,
  error: null,            // null | 'auth' | 'network' | 'other'
  settings: { lang: defaultLang, temp: 'C', units: 'metric', homeSort: 'newest', ...load(K.settings, {}) },
  recent: load(K.recent, []),
  opened: load(K.opened, {}),
  checks: load(K.checks, {}),
  pending: load(K.pending, {}),   // recipeId -> { bookmarked, at }
  saving: false,
  saveFailed: false,
  savedAt: load(K.savedAt, null),
  bannerDismissed: load(K.bannerDismissed, null),
  online: navigator.onLine,
  settingsOpen: false
});

export function setSetting(key, value) {
  app.settings[key] = value;
  save(K.settings, $state.snapshot(app.settings));
}

// ---------- connection ----------
export function hasToken() { return !!app.token; }

export async function connect(token) {
  const res = await fetchData(token); // throws on a bad key
  app.token = token; save(K.token, token);
  applyFetched(res);
  app.error = null;
}

export function disconnectForNewKey() {
  // Keep cached data; just drop the key so the Connect screen can take a new one.
  app.token = null; save(K.token, null);
}

function applyFetched({ data, sha, expiresAt }) {
  // Re-apply bookmark changes that haven't reached GitHub yet.
  for (const [id, p] of Object.entries(app.pending)) {
    const r = data.recipes?.find((x) => x.id === id);
    if (r) { r.bookmarked = p.bookmarked; r.bookmarkedAt = p.bookmarked ? p.at : null; }
  }
  app.data = data; app.sha = sha; app.fetchedAt = Date.now();
  if (expiresAt) { app.tokenExpiresAt = expiresAt; save(K.expires, expiresAt); }
  save(K.data, data); save(K.sha, sha); save(K.fetchedAt, app.fetchedAt);
}

export async function refresh({ quiet = false } = {}) {
  if (!app.token || app.loading) return;
  app.loading = !quiet || !app.data;
  try {
    applyFetched(await fetchData(app.token));
    app.error = null;
    if (Object.keys(app.pending).length) flushBookmarks();
  } catch (e) {
    app.error = e instanceof GitHubError && (e.status === 401 || e.status === 403) ? 'auth' : (navigator.onLine ? 'other' : 'network');
  } finally {
    app.loading = false;
  }
}

/** Refetch when returning to the app if the last fetch is older than a minute (spec §6). */
export function refreshIfStale() {
  if (Date.now() - app.fetchedAt > 60_000) refresh({ quiet: true });
}

// ---------- bookmarks (the only thing the app writes) ----------
export function toggleBookmark(recipe) {
  const now = Date.now();
  const next = !recipe.bookmarked;
  recipe.bookmarked = next; recipe.bookmarkedAt = next ? now : null;
  app.pending[recipe.id] = { bookmarked: next, at: now };
  save(K.pending, $state.snapshot(app.pending));
  save(K.data, $state.snapshot(app.data));
  flushBookmarks();
}

let flushing = false;
export async function flushBookmarks() {
  if (flushing || !app.token || !Object.keys(app.pending).length) return;
  flushing = true; app.saving = true; app.saveFailed = false;
  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        // Always write on top of the latest file so Claude's edits are never overwritten.
        const latest = await fetchData(app.token);
        const pending = $state.snapshot(app.pending);
        const titles = [];
        for (const [id, p] of Object.entries(pending)) {
          const r = latest.data.recipes.find((x) => x.id === id);
          if (!r) continue;
          r.bookmarked = p.bookmarked; r.bookmarkedAt = p.bookmarked ? p.at : null;
          titles.push(`${p.bookmarked ? 'Bookmark' : 'Unbookmark'}: ${r.title.zh}`);
        }
        const sha = await putData(app.token, latest.data, latest.sha, titles.join('; ') || 'Update bookmarks');
        for (const id of Object.keys(pending)) if (app.pending[id]?.at === pending[id].at) delete app.pending[id];
        save(K.pending, $state.snapshot(app.pending));
        applyFetched({ data: latest.data, sha, expiresAt: latest.expiresAt });
        app.savedAt = Date.now(); save(K.savedAt, app.savedAt);
        break;
      } catch (e) {
        if (e instanceof GitHubError && e.status === 409 && attempt < 2) continue; // file changed in between: retry
        throw e;
      }
    }
  } catch {
    app.saveFailed = true;
  } finally {
    flushing = false; app.saving = false;
  }
}

// ---------- device-only history ----------
export function markOpened(id) {
  app.opened[id] = Date.now(); save(K.opened, $state.snapshot(app.opened));
  app.recent = [id, ...app.recent.filter((x) => x !== id)].slice(0, 6); save(K.recent, $state.snapshot(app.recent));
}

const DAY = 24 * 3600 * 1000;
export function checksFor(id) {
  const c = app.checks[id];
  if (!c || Date.now() - c.at > DAY) return [];
  return c.items;
}
export function toggleCheck(id, itemId) {
  const items = new Set(checksFor(id));
  items.has(itemId) ? items.delete(itemId) : items.add(itemId);
  app.checks[id] = { at: Date.now(), items: [...items] };
  save(K.checks, $state.snapshot(app.checks));
}

export function dismissBanner() {
  app.bannerDismissed = { token: (app.token || '').slice(-8), at: Date.now() };
  save(K.bannerDismissed, app.bannerDismissed);
}

/** Days until the key expires, or null if unknown. */
export function keyDaysLeft() {
  if (!app.tokenExpiresAt) return null;
  return Math.ceil((app.tokenExpiresAt - Date.now()) / DAY);
}

export function showExpiryBanner() {
  const d = keyDaysLeft();
  if (d == null || d > 7 || d < 0) return false;
  const b = app.bannerDismissed;
  if (b && b.token === (app.token || '').slice(-8) && d > 1) return false; // returns on the last day
  return true;
}

window.addEventListener('online', () => { app.online = true; flushBookmarks(); });
window.addEventListener('offline', () => { app.online = false; });
