<script>
  import TabBar from './components/TabBar.svelte';
  import TimerPill from './components/TimerPill.svelte';
  import Home from './screens/Home.svelte';
  import Browse from './screens/Browse.svelte';
  import Bookmarks from './screens/Bookmarks.svelte';
  import Categories from './screens/Categories.svelte';
  import Authors from './screens/Authors.svelte';
  import Ingredients from './screens/Ingredients.svelte';
  import IngredientDetail from './screens/IngredientDetail.svelte';
  import RecipeList from './screens/RecipeList.svelte';
  import Recipe from './screens/Recipe.svelte';
  import Connect from './screens/Connect.svelte';
  import SettingsSheet from './screens/SettingsSheet.svelte';
  import { app, refresh, refreshIfStale } from './lib/store.svelte.js';
  import { strings, lt } from './lib/i18n.js';
  import { inCategory } from './lib/model.js';
  import { route } from './lib/router.svelte.js';

  const lang = $derived(app.settings.lang);
  const t = $derived(strings(lang));
  const [a, b] = $derived(route.parts);
  const isRoot = $derived(['/', '/browse', '/bookmarks'].includes(route.path));
  const recipes = $derived(app.data?.recipes || []);
  const cat = $derived(a === 'category' ? app.data?.categories?.find((c) => c.id === b) : null);
  const author = $derived(a === 'author' ? app.data?.authors?.find((x) => x.id === b) : null);

  $effect(() => { document.documentElement.lang = lang === 'zh' ? 'zh-Hant' : 'en'; document.title = lang === 'zh' ? '食譜' : 'Recipes'; });

  // Startup: show cached data at once, refresh in the background (spec §6).
  refresh({ quiet: true });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') refreshIfStale(); });

  // Pull to refresh on tab roots.
  let pull = $state(0), startY = null;
  function ts(e) { startY = isRoot && window.scrollY <= 0 ? e.touches[0].clientY : null; }
  function tm(e) { if (startY != null) pull = Math.max(0, Math.min(90, (e.touches[0].clientY - startY) * 0.5)); }
  function te() { if (pull >= 60) refresh(); pull = 0; startY = null; }
</script>

<svelte:window ontouchstart={ts} ontouchmove={tm} ontouchend={te} />

{#if pull > 0 || (app.loading && app.data)}
  <div class="ptr" style="height:{app.loading ? 48 : pull}px" aria-live="polite">
    <span class:spin={app.loading} style="transform:rotate({pull * 4}deg)">↻</span>
    {#if pull >= 60 && !app.loading}<small>{t.pullToRefresh}</small>{/if}
  </div>
{/if}

{#if route.path === '/'}<Home />
{:else if route.path === '/browse'}<Browse />
{:else if route.path === '/bookmarks'}<Bookmarks />
{:else if route.path === '/categories'}<Categories />
{:else if a === 'category'}
  {#key b}<RecipeList title={cat ? lt(cat.name, lang) : ''} recipes={cat ? recipes.filter((r) => inCategory(r, cat.id)) : []} fallback="/categories" />{/key}
{:else if route.path === '/authors'}<Authors />
{:else if a === 'author'}
  {#key b}<RecipeList title={author?.name || ''} recipes={author ? recipes.filter((r) => r.author === author.id) : []} showAuthor={false} fallback="/authors" />{/key}
{:else if route.path === '/ingredients'}<Ingredients />
{:else if a === 'ingredient'}{#key b}<IngredientDetail id={b} />{/key}
{:else if a === 'recipe'}{#key b}<Recipe id={b} />{/key}
{:else if route.path === '/connect'}<Connect />
{:else}<Home />
{/if}

{#if isRoot}<TabBar />{/if}
<TimerPill raised={isRoot} />
{#if app.settingsOpen}<SettingsSheet />{/if}

<style>
  .ptr { display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; color: var(--color-text-muted); padding-top: env(safe-area-inset-top); }
  .ptr span { font-size: 22px; line-height: 1; }
  .ptr small { font-size: var(--text-xs); }
  .spin { animation: spin 0.9s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
