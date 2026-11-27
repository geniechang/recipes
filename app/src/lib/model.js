// Derived lists (spec §4).
export const UNCAT = 'cat_uncategorized';

/** Collator for the "Name" sort: stroke order in Chinese if the browser supports it, else pinyin. */
let zhCollator;
export function zhCollatorInfo() {
  if (!zhCollator) {
    const stroke = new Intl.Collator('zh-Hant-TW-u-co-stroke');
    zhCollator = stroke.resolvedOptions().collation === 'stroke'
      ? { c: stroke, kind: 'stroke' }
      : { c: new Intl.Collator('zh-u-co-pinyin'), kind: 'pinyin' };
  }
  return zhCollator;
}
const enCollator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });

export function nameCompare(lang) {
  const c = lang === 'zh' ? zhCollatorInfo().c : enCollator;
  return (a, b) => c.compare(a, b);
}

export function catMap(data) { return new Map((data?.categories || []).map((c) => [c.id, c])); }
export function authorMap(data) { return new Map((data?.authors || []).map((a) => [a.id, a])); }
export function ingMap(data) { return new Map((data?.ingredients || []).map((i) => [i.id, i])); }

/** Recipe's categories in category order; empty -> [未分類]. */
export function recipeCats(recipe, cmap) {
  const ids = recipe.categories?.length ? recipe.categories : [UNCAT];
  return ids.map((id) => cmap.get(id)).filter(Boolean).sort((a, b) => a.order - b.order);
}

export function inCategory(recipe, catId) {
  return catId === UNCAT ? !recipe.categories?.length : recipe.categories?.includes(catId);
}

export function sortRecipes(list, mode, lang, opened = {}) {
  const arr = [...list];
  if (mode === 'name') {
    const cmp = nameCompare(lang);
    return arr.sort((a, b) => cmp(a.title[lang] || a.title.zh, b.title[lang] || b.title.zh));
  }
  if (mode === 'recent') {
    return arr.sort((a, b) => (opened[b.id] || 0) - (opened[a.id] || 0) || b.created - a.created);
  }
  if (mode === 'saved') return arr.sort((a, b) => (b.bookmarkedAt || 0) - (a.bookmarkedAt || 0));
  return arr.sort((a, b) => b.created - a.created);
}

/** Visible categories: ordered, 未分類 only when it has recipes. */
export function visibleCategories(data) {
  const recipes = data?.recipes || [];
  return (data?.categories || [])
    .filter((c) => c.id !== UNCAT || recipes.some((r) => !r.categories?.length))
    .map((c) => ({ ...c, count: recipes.filter((r) => inCategory(r, c.id)).length }))
    .sort((a, b) => a.order - b.order);
}

/** ingredientId -> [{ recipe, item }] */
export function ingredientUsage(data) {
  const m = new Map();
  for (const r of data?.recipes || []) for (const g of r.ingredientGroups) for (const it of g.items) {
    if (!m.has(it.ref)) m.set(it.ref, []);
    m.get(it.ref).push({ recipe: r, item: it });
  }
  return m;
}
