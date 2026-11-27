<script>
  import Icon from '../components/Icon.svelte';
  import PushedHeader from '../components/PushedHeader.svelte';
  import { app } from '../lib/store.svelte.js';
  import { strings } from '../lib/i18n.js';
  import { nameCompare } from '../lib/model.js';
  import { go } from '../lib/router.svelte.js';
  const lang = $derived(app.settings.lang);
  const t = $derived(strings(lang));
  const authors = $derived.by(() => {
    const recipes = app.data?.recipes || [];
    const cmp = nameCompare(lang);
    return (app.data?.authors || [])
      .map((a) => ({ ...a, count: recipes.filter((r) => r.author === a.id).length }))
      .sort((a, b) => cmp(a.name, b.name));
  });
</script>

<div class="screen pushed">
  <PushedHeader title={t.authors} />
  <div class="gutter">
    {#each authors as a (a.id)}
      <button class="row row-link" onclick={() => go(`/author/${a.id}`)}>
        <span class="avatar">{a.name.slice(0, 1)}</span>
        <span class="name">{a.name}</span>
        <span class="count">{t.nRecipes(a.count)}</span>
        <span class="muted"><Icon name="chevron-right" size={16} stroke={2} /></span>
      </button>
    {/each}
  </div>
</div>

<style>
  .row { display: flex; align-items: center; gap: var(--spacing-3-5); width: 100%; padding-block: var(--spacing-3); border-bottom: 1px solid var(--color-border); text-align: left; }
  .avatar {
    width: 44px; height: 44px; border-radius: var(--radius-full); background: var(--color-surface); flex-shrink: 0;
    display: flex; align-items: center; justify-content: center; font-family: var(--font-display); font-weight: var(--font-weight-bold); font-size: var(--text-lg);
  }
  .name { flex: 1 1 0%; font-size: var(--text-base); font-weight: var(--font-weight-semibold); line-height: var(--leading-md); }
  .count { color: var(--color-text-muted); font-size: var(--text-sm); line-height: var(--leading-sm); }
</style>
