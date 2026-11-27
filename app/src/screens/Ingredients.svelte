<script>
  import Icon from '../components/Icon.svelte';
  import PushedHeader from '../components/PushedHeader.svelte';
  import SortControl from '../components/SortControl.svelte';
  import { app } from '../lib/store.svelte.js';
  import { strings, lt } from '../lib/i18n.js';
  import { ingredientUsage, nameCompare } from '../lib/model.js';
  import { go, route } from '../lib/router.svelte.js';
  const lang = $derived(app.settings.lang);
  const t = $derived(strings(lang));
  let tab = $state(route.query.cat || 'all');
  let sort = $state('used');

  const usage = $derived(ingredientUsage(app.data));
  const ings = $derived((app.data?.ingredients || []).map((i) => {
    const uses = usage.get(i.id) || [];
    return { ...i, count: uses.length, added: Math.min(...uses.map((u) => u.recipe.created), Infinity) };
  }));
  // Tabs: ingredient categories that have ingredients, most populated first.
  const tabs = $derived((app.data?.ingredientCategories || [])
    .map((c) => ({ ...c, n: ings.filter((i) => i.categories?.includes(c.id)).length }))
    .filter((c) => c.n).sort((a, b) => b.n - a.n || a.order - b.order));
  const list = $derived.by(() => {
    const arr = tab === 'all' ? [...ings] : ings.filter((i) => i.categories?.includes(tab));
    const cmp = nameCompare(lang);
    const byName = (a, b) => cmp(lt(a.name, lang), lt(b.name, lang));
    if (sort === 'az') return arr.sort(byName);
    if (sort === 'added') return arr.sort((a, b) => (b.added === Infinity ? 0 : b.added) - (a.added === Infinity ? 0 : a.added) || byName(a, b));
    return arr.sort((a, b) => b.count - a.count || byName(a, b));
  });
  const options = $derived([
    { value: 'used', label: t.sortMostUsed }, { value: 'az', label: t.sortAZ }, { value: 'added', label: t.sortRecentlyAdded }
  ]);
</script>

<div class="screen pushed">
  <PushedHeader title={t.ingredients} />
  <div class="tabs gutter" role="tablist">
    <button role="tab" aria-selected={tab === 'all'} class:active={tab === 'all'} onclick={() => (tab = 'all')}>{t.all}</button>
    {#each tabs as c (c.id)}
      <button role="tab" aria-selected={tab === c.id} class:active={tab === c.id} onclick={() => (tab = c.id)}>{lt(c.name, lang)}</button>
    {/each}
  </div>
  <div class="head gutter">
    <span class="label muted" class:zh={lang === 'zh'}>{t.nIngredients(list.length)}</span>
    <SortControl {options} value={sort} onchange={(v) => (sort = v)} />
  </div>
  <div class="gutter">
    {#each list as i (i.id)}
      <button class="row row-link" onclick={() => go(`/ingredient/${i.id}`)}>
        <span class="name ellipsis">{lt(i.name, lang)}</span>
        <span class="count">{t.nRecipes(i.count)}</span>
        <span class="muted"><Icon name="chevron-right" size={16} stroke={2} /></span>
      </button>
    {/each}
  </div>
</div>

<style>
  .tabs { display: flex; gap: var(--spacing-5); overflow-x: auto; border-bottom: 1px solid var(--color-border); scrollbar-width: none; }
  .tabs::-webkit-scrollbar { display: none; }
  .tabs button {
    flex-shrink: 0; min-height: var(--spacing-11); color: var(--color-text-muted); font-size: var(--text-md); font-weight: var(--font-weight-medium);
    border-bottom: 2px solid transparent; margin-bottom: -1px;
  }
  .tabs button.active { color: var(--color-text); font-weight: var(--font-weight-semibold); border-bottom-color: var(--color-text); }
  .head { display: flex; align-items: center; justify-content: space-between; }
  .row { display: flex; align-items: center; gap: var(--spacing-3); width: 100%; padding-block: var(--spacing-3-5); border-bottom: 1px solid var(--color-border); text-align: left; }
  .row:first-child { border-top: 1px solid var(--color-text); }
  .name { flex: 1 1 0%; font-size: var(--text-base); font-weight: var(--font-weight-semibold); line-height: var(--leading-md); }
  .count { color: var(--color-text-muted); font-size: var(--text-sm); line-height: var(--leading-sm); white-space: nowrap; }
</style>
