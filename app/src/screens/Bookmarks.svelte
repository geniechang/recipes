<script>
  import RecipeRow from '../components/RecipeRow.svelte';
  import EmptyState from '../components/EmptyState.svelte';
  import { app } from '../lib/store.svelte.js';
  import { strings } from '../lib/i18n.js';
  import { sortRecipes } from '../lib/model.js';
  const lang = $derived(app.settings.lang);
  const t = $derived(strings(lang));
  const list = $derived(sortRecipes((app.data?.recipes || []).filter((r) => r.bookmarked), 'saved', lang));
</script>

<div class="screen">
  <header class="gutter top"><h1 class="large-title">{t.bookmarks}</h1></header>
  {#if !list.length}
    <EmptyState icon="bookmark" title={t.noBookmarks} body={t.noBookmarksBody} />
  {:else}
    <div class="head gutter">
      <span class="label muted" class:zh={lang === 'zh'}>{t.nRecipes(list.length)}</span>
      <span class="label muted" class:zh={lang === 'zh'}>{t.sortRecentlySaved}</span>
    </div>
    <div class="gutter">
      {#each list as r (r.id)}<RecipeRow recipe={r} trailing="bookmark" />{/each}
    </div>
  {/if}
</div>

<style>
  .top { padding-top: var(--spacing-2); padding-bottom: var(--spacing-5); }
  .head { display: flex; justify-content: space-between; padding-bottom: var(--spacing-2); border-bottom: 1px solid var(--color-text); }
</style>
