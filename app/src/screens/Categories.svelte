<script>
  import Icon from '../components/Icon.svelte';
  import PushedHeader from '../components/PushedHeader.svelte';
  import { app } from '../lib/store.svelte.js';
  import { strings, lt } from '../lib/i18n.js';
  import { visibleCategories } from '../lib/model.js';
  import { go } from '../lib/router.svelte.js';
  const lang = $derived(app.settings.lang);
  const t = $derived(strings(lang));
  const cats = $derived(visibleCategories(app.data));
</script>

<div class="screen pushed">
  <PushedHeader title={t.categories} />
  <div class="gutter">
    {#each cats as c (c.id)}
      <button class="row row-link" onclick={() => go(`/category/${c.id}`)}>
        <span class="ic"><Icon name={c.icon || 'uncategorized'} size={22} /></span>
        <span class="name">{lt(c.name, lang)}</span>
        <span class="count tnum">{c.count}</span>
        <span class="muted"><Icon name="chevron-right" size={16} stroke={2} /></span>
      </button>
    {/each}
  </div>
</div>

<style>
  .row { display: flex; align-items: center; gap: var(--spacing-3-5); width: 100%; padding-block: var(--spacing-3); border-bottom: 1px solid var(--color-border); text-align: left; }
  .ic { width: 44px; height: 44px; border-radius: var(--radius-md); background: var(--color-surface); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .name { flex: 1 1 0%; font-size: var(--text-base); font-weight: var(--font-weight-semibold); line-height: var(--leading-md); }
  .count { color: var(--color-text-muted); font-size: var(--text-sm); line-height: var(--leading-sm); }
</style>
