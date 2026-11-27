<script>
  // Shared pushed list: category detail and author detail.
  import PushedHeader from '../components/PushedHeader.svelte';
  import RecipeRow from '../components/RecipeRow.svelte';
  import SortControl from '../components/SortControl.svelte';
  import EmptyState from '../components/EmptyState.svelte';
  import { app } from '../lib/store.svelte.js';
  import { strings } from '../lib/i18n.js';
  import { sortRecipes } from '../lib/model.js';
  let { title, recipes, showAuthor = true, fallback = '/browse' } = $props();
  const lang = $derived(app.settings.lang);
  const t = $derived(strings(lang));
  let sort = $state('newest');
  const list = $derived(sortRecipes(recipes, sort, lang, app.opened));
  const options = $derived([
    { value: 'newest', label: t.sortNewest },
    { value: 'recent', label: t.sortRecent },
    { value: 'name', label: t.sortName }
  ]);
</script>

<div class="screen pushed">
  <PushedHeader {title} {fallback} />
  {#if !recipes.length}
    <EmptyState icon="shelf" title={t.noRecipes} />
  {:else}
    <div class="head gutter">
      <span class="label muted" class:zh={lang === 'zh'}>{t.nRecipes(recipes.length)}</span>
      <SortControl {options} value={sort} onchange={(v) => (sort = v)} />
    </div>
    <div class="gutter">
      {#each list as r (r.id)}<RecipeRow recipe={r} {showAuthor} />{/each}
    </div>
  {/if}
</div>

<style>
  .head { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--color-text); }
</style>
