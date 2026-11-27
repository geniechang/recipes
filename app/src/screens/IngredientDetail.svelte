<script>
  import Icon from '../components/Icon.svelte';
  import PushedHeader from '../components/PushedHeader.svelte';
  import RecipeRow from '../components/RecipeRow.svelte';
  import Sheet from '../components/Sheet.svelte';
  import EmptyState from '../components/EmptyState.svelte';
  import { app } from '../lib/store.svelte.js';
  import { strings, lt } from '../lib/i18n.js';
  import { ingredientUsage } from '../lib/model.js';
  import { formatAmount } from '../lib/format.js';
  let { id } = $props();
  const lang = $derived(app.settings.lang);
  const t = $derived(strings(lang));
  const ing = $derived(app.data?.ingredients?.find((i) => i.id === id));
  const uses = $derived((ingredientUsage(app.data).get(id) || []).sort((a, b) => b.recipe.created - a.recipe.created));
  let info = $state(false);
  const catNames = $derived((ing?.categories || []).map((c) => lt(app.data.ingredientCategories.find((x) => x.id === c)?.name, lang)).filter(Boolean).join(' · '));
</script>

{#if !ing}
  <div class="screen pushed">
    <PushedHeader title="" fallback="/ingredients" />
    <EmptyState icon="bowl" title={t.notFound} />
  </div>
{:else}
  <div class="screen pushed">
    <PushedHeader title={lt(ing.name, lang)} fallback="/ingredients">
      {#snippet trailing()}
        {#if ing.about || ing.storage}
          <button class="icon-btn" aria-label={t.about} onclick={() => (info = true)}><Icon name="info" size={22} /></button>
        {/if}
      {/snippet}
    </PushedHeader>
    <div class="gutter">
      <h2 class="label" class:zh={lang === 'zh'}>{t.usedIn} · {t.nRecipes(uses.length)}</h2>
      {#each uses as u (u.recipe.id + u.item.id)}
        <RecipeRow recipe={u.recipe} extra={formatAmount(u.item, { lang, system: app.settings.units })} />
      {/each}
    </div>
  </div>
  {#if info}
    <Sheet title={lt(ing.name, lang)} subtitle={catNames} onclose={() => (info = false)}>
      {#if ing.about}<h3 class="label" class:zh={lang === 'zh'}>{t.about}</h3><p>{lt(ing.about, lang)}</p>{/if}
      {#if ing.storage}<h3 class="label" class:zh={lang === 'zh'}>{t.storage}</h3><p>{lt(ing.storage, lang)}</p>{/if}
    </Sheet>
  {/if}
{/if}

<style>
  h2 { margin: 0; padding-bottom: var(--spacing-2); border-bottom: 1px solid var(--color-text); }
  h3 { margin: var(--spacing-4) 0 var(--spacing-1-5); }
  p { margin: 0; font-size: var(--text-md); line-height: var(--leading-relaxed); }
</style>
