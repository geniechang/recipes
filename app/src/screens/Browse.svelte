<script>
  import Icon from '../components/Icon.svelte';
  import { app } from '../lib/store.svelte.js';
  import { strings } from '../lib/i18n.js';
  import { visibleCategories } from '../lib/model.js';
  import { go } from '../lib/router.svelte.js';
  const t = $derived(strings(app.settings.lang));
  const rows = $derived([
    { path: '/categories', icon: 'folders', label: t.categories, count: t.nCategories(visibleCategories(app.data).length) },
    { path: '/authors', icon: 'person', label: t.authors, count: t.nAuthors(app.data?.authors?.length || 0) },
    { path: '/ingredients', icon: 'bowl', label: t.ingredients, count: t.nIngredients(app.data?.ingredients?.length || 0) }
  ]);
</script>

<div class="screen">
  <header class="gutter top"><h1 class="large-title">{t.browse}</h1></header>
  <div class="gutter">
    {#each rows as r (r.path)}
      <button class="row row-link" onclick={() => go(r.path)}>
        <Icon name={r.icon} size={24} />
        <span class="name">{r.label}</span>
        <span class="count">{r.count}</span>
        <span class="muted"><Icon name="chevron-right" size={16} stroke={2} /></span>
      </button>
    {/each}
  </div>
</div>

<style>
  .top { padding-top: var(--spacing-2); padding-bottom: var(--spacing-6); }
  .row { display: flex; align-items: center; gap: var(--spacing-3-5); width: 100%; padding-block: var(--spacing-4-5); border-bottom: 1px solid var(--color-border); text-align: left; }
  .row:first-child { border-top: 1px solid var(--color-text); }
  .name { flex: 1 1 0%; font-family: var(--font-display); font-size: var(--text-lg); font-weight: var(--font-weight-bold); line-height: var(--leading-lg); }
  .count { color: var(--color-text-muted); font-size: var(--text-sm); line-height: var(--leading-sm); }
</style>
