<script>
  // Recipe row (design: "Recipe row pattern"): thumbnail · title + "by author" · category tags · chevron.
  import Icon from './Icon.svelte';
  import Cover from './Cover.svelte';
  import { app } from '../lib/store.svelte.js';
  import { lt } from '../lib/i18n.js';
  import { catMap, authorMap, recipeCats } from '../lib/model.js';
  import { go } from '../lib/router.svelte.js';

  let { recipe, showAuthor = true, extra = '', trailing = 'chevron' } = $props();
  const lang = $derived(app.settings.lang);
  const cats = $derived(recipeCats(recipe, catMap(app.data)));
  const author = $derived(showAuthor && recipe.author ? authorMap(app.data).get(recipe.author) : null);
</script>

<button class="row row-link" onclick={() => go(`/recipe/${recipe.id}`)}>
  <span class="thumb"><Cover src={recipe.cover} icon={cats[0]?.icon} alt="" /></span>
  <span class="text">
    <span class="title-row">
      <span class="title ellipsis">{lt(recipe.title, lang)}</span>
      {#if author}<span class="by">by {author.name}</span>{/if}
    </span>
    <span class="meta">
      {#each cats as c (c.id)}<span class="tag">{lt(c.name, lang)}</span>{/each}
      {#if extra}<span class="extra">{extra}</span>{/if}
    </span>
  </span>
  {#if trailing === 'bookmark'}
    <span class="trail primary"><Icon name="bookmark" size={18} fill /></span>
  {:else}
    <span class="trail muted"><Icon name="chevron-right" size={16} stroke={2} /></span>
  {/if}
</button>

<style>
  .row {
    display: flex; align-items: center; gap: var(--spacing-3-5); width: 100%; text-align: left;
    padding-block: var(--spacing-3-5); border-bottom: 1px solid var(--color-border);
  }
  .thumb { width: 56px; height: 56px; flex-shrink: 0; }
  .text { flex: 1 1 0%; min-width: 0; display: flex; flex-direction: column; gap: var(--spacing-1-5); }
  .title-row { display: flex; align-items: baseline; gap: var(--spacing-1-5); min-width: 0; }
  .title { font-size: var(--text-base); font-weight: var(--font-weight-semibold); line-height: var(--leading-md); }
  .by { flex-shrink: 0; color: var(--color-text-muted); font-size: var(--text-sm); line-height: var(--leading-sm); white-space: nowrap; }
  .meta { display: flex; flex-wrap: wrap; align-items: center; gap: var(--spacing-1); }
  .tag {
    padding: var(--spacing-0-5) var(--spacing-1-5); background: var(--color-surface); border-radius: var(--radius-sm);
    font-size: var(--text-xs); font-weight: var(--font-weight-medium); line-height: var(--leading-xs);
  }
  .extra { padding-left: var(--spacing-1); color: var(--color-text-muted); font-size: var(--text-sm); line-height: var(--leading-sm); }
  .trail { width: 24px; display: flex; justify-content: flex-end; flex-shrink: 0; }
  .primary { color: var(--color-primary); }
</style>
