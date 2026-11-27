// Minimal hash router: #/recipe/r_ny_bagels?tab=method
export const route = $state({ path: '/', parts: [], query: {} });

function parse() {
  const raw = location.hash.replace(/^#/, '') || '/';
  const [p, q = ''] = raw.split('?');
  route.path = p;
  route.parts = p.split('/').filter(Boolean).map(decodeURIComponent);
  route.query = Object.fromEntries(new URLSearchParams(q));
}
parse();

const scrollPos = new Map();
window.addEventListener('hashchange', () => {
  parse();
  requestAnimationFrame(() => window.scrollTo(0, scrollPos.get(location.hash) || 0));
});
window.addEventListener('scroll', () => scrollPos.set(location.hash, window.scrollY), { passive: true });

let depth = 0; // in-app pushes, so Back never leaves the app on a deep link
export function go(path, { replace = false } = {}) {
  if (replace) { history.replaceState(null, '', '#' + path); parse(); return; }
  depth++;
  location.hash = path;
}
export function back(fallback = '/') {
  if (depth > 0) { depth--; history.back(); }
  else go(fallback, { replace: true });
}
