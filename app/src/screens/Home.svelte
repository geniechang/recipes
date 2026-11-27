<script>
  import Icon from '../components/Icon.svelte';
  import Cover from '../components/Cover.svelte';
  import RecipeRow from '../components/RecipeRow.svelte';
  import SortControl from '../components/SortControl.svelte';
  import EmptyState from '../components/EmptyState.svelte';
  import { app, setSetting, showExpiryBanner, keyDaysLeft, dismissBanner } from '../lib/store.svelte.js';
  import { strings, lt } from '../lib/i18n.js';
  import { visibleCategories, sortRecipes, inCategory, catMap, recipeCats } from '../lib/model.js';
  import { go } from '../lib/router.svelte.js';

  const lang = $derived(app.settings.lang);
  const t = $derived(strings(lang));
  let filter = $state('all');

  const recipes = $derived(app.data?.recipes || []);
  const cats = $derived(visibleCategories(app.data));
  const cmap = $derived(catMap(app.data));
  const recent = $derived(app.recent.map((id) => recipes.find((r) => r.id === id)).filter(Boolean));
  const list = $derived(sortRecipes(filter === 'all' ? recipes : recipes.filter((r) => inCategory(r, filter)), app.settings.homeSort, lang, app.opened));
  const expired = $derived(app.error === 'auth' || (keyDaysLeft() ?? 1) < 0);
  const sortOptions = $derived([
    { value: 'newest', label: t.sortNewest },
    { value: 'recent', label: t.sortRecent },
    { value: 'name', label: t.sortName }
  ]);
</script>

<div class="screen">
  <header class="top gutter">
    <h1 class="large-title">{t.library}</h1>
    <button class="icon-btn gear" aria-label={t.settings} onclick={() => (app.settingsOpen = true)}><Icon name="gear" size={20} /></button>
  </header>

  {#if !app.token || expired}
    <EmptyState icon="cloud-off" title={expired ? t.keyExpired : t.notConnected} body={expired ? t.keyExpiredBody : t.notConnectedBody}>
      <button class="btn-primary" onclick={() => go('/connect')}>{expired ? t.updateKey : t.connectStorage}</button>
    </EmptyState>
  {:else if !app.data}
    <div class="skeleton" aria-label={t.loading}>
      <div class="sk-label"></div>
      <div class="sk-cards">{#each [0, 1, 2] as i (i)}<div class="sk-card"></div>{/each}</div>
      <div class="sk-chips">{#each [0, 1, 2, 3] as i (i)}<div class="sk-chip"></div>{/each}</div>
      {#each [0, 1, 2, 3, 4] as i (i)}<div class="sk-row"><div class="sk-thumb"></div><div class="sk-lines"><div></div><div></div></div></div>{/each}
    </div>
  {:else if !recipes.length}
    <EmptyState icon="shelf" title={t.noRecipes} body={t.noRecipesBody} />
  {:else}
    {#if showExpiryBanner()}
      <div class="banner-wrap gutter">
        <div class="banner" role="status">
          <span class="b-icon"><Icon name="clock" size={20} /></span>
          <span class="b-text">{t.keyExpiresIn(keyDaysLeft())}</span>
          <button class="btn-text" onclick={() => go('/connect')}>{t.updateKey}</button>
          <button class="icon-btn" aria-label={t.close} onclick={dismissBanner}><Icon name="x" size={16} stroke={2} /></button>
        </div>
      </div>
    {/if}

    {#if recent.length}
      <section class="recent">
        <h2 class="label gutter" class:zh={lang === 'zh'}>{t.recentlyViewed}</h2>
        <div class="carousel">
          {#each recent as r (r.id)}
            <button class="card" onclick={() => go(`/recipe/${r.id}`)}>
              <span class="card-img"><Cover src={r.cover} icon={recipeCats(r, cmap)[0]?.icon} iconSize={32} /></span>
              <span class="card-title ellipsis">{lt(r.title, lang)}</span>
            </button>
          {/each}
        </div>
      </section>
    {/if}

    <div class="list-head gutter">
      <h2 class="label" class:zh={lang === 'zh'}>{t.allRecipes}</h2>
      <SortControl options={sortOptions} value={app.settings.homeSort} onchange={(v) => setSetting('homeSort', v)} />
    </div>
    <div class="chips gutter" role="tablist">
      <button class="chip" class:active={filter === 'all'} onclick={() => (filter = 'all')}>{t.all}</button>
      {#each cats as c (c.id)}
        {#if c.count}
          <button class="chip" class:active={filter === c.id} onclick={() => (filter = c.id)}>{lt(c.name, lang)}</button>
        {/if}
      {/each}
    </div>
    <div class="gutter">
      {#each list as r (r.id)}<RecipeRow recipe={r} />{/each}
    </div>
  {/if}
</div>

<style>
  .top { display: flex; align-items: center; justify-content: space-between; padding-top: var(--spacing-2); padding-bottom: var(--spacing-5); }
  .gear { margin-right: calc(-1 * var(--spacing-2-5)); }
  .banner-wrap { padding-bottom: var(--spacing-5); }
  .banner { display: flex; align-items: center; gap: var(--spacing-2); padding: var(--spacing-1) var(--spacing-1) var(--spacing-1) var(--spacing-3-5); background: var(--color-surface); border-radius: var(--radius-lg); }
  .b-icon { color: var(--color-primary-text); display: flex; }
  .b-text { flex: 1 1 0%; font-size: var(--text-sm); line-height: var(--leading-sm); }
  .recent { padding-bottom: var(--spacing-7); }
  .recent h2 { margin: 0 0 var(--spacing-3); }
  .carousel { display: flex; gap: var(--spacing-3); overflow-x: auto; padding-inline: var(--spacing-6); scroll-snap-type: x mandatory; scrollbar-width: none; }
  .carousel::-webkit-scrollbar { display: none; }
  .card { flex: 0 0 140px; display: flex; flex-direction: column; gap: var(--spacing-2); text-align: left; scroll-snap-align: start; scroll-margin-left: var(--spacing-6); }
  .card-img { width: 140px; height: 105px; }
  .card-title { font-size: var(--text-sm); font-weight: var(--font-weight-semibold); line-height: var(--leading-sm); }
  .list-head { display: flex; align-items: center; justify-content: space-between; padding-bottom: var(--spacing-1); }
  .list-head h2 { margin: 0; }
  .chips { display: flex; gap: var(--spacing-2); overflow-x: auto; padding-bottom: var(--spacing-2); scrollbar-width: none; }
  .chips::-webkit-scrollbar { display: none; }
  .chip {
    flex-shrink: 0; height: 36px; padding-inline: var(--spacing-3-5); border-radius: var(--radius-full); border: 1px solid var(--color-border);
    font-size: var(--text-sm); font-weight: var(--font-weight-medium); line-height: var(--leading-sm); position: relative;
  }
  .chip::after { content: ''; position: absolute; inset: -4px 0; } /* 44px hit area */
  .chip.active { background: var(--color-text); border-color: var(--color-text); color: var(--color-on-primary); }

  .skeleton { padding-inline: var(--spacing-6); }
  .skeleton div { background: var(--color-surface); border-radius: var(--radius-md); animation: shimmer 1.4s ease-in-out infinite; }
  .sk-label { width: 120px; height: 14px; margin-bottom: var(--spacing-3); }
  .sk-cards { display: flex; gap: var(--spacing-3); background: none !important; margin-bottom: var(--spacing-7); }
  .sk-card { width: 140px; height: 131px; flex-shrink: 0; }
  .sk-chips { display: flex; gap: var(--spacing-2); background: none !important; margin-bottom: var(--spacing-3); }
  .sk-chip { width: 58px; height: 36px; border-radius: var(--radius-full) !important; }
  .sk-row { display: flex; gap: var(--spacing-3-5); align-items: center; padding-block: var(--spacing-3-5); background: none !important; }
  .sk-thumb { width: 56px; height: 56px; flex-shrink: 0; }
  .sk-lines { flex: 1; display: flex; flex-direction: column; gap: var(--spacing-2); background: none !important; }
  .sk-lines div:first-child { height: 16px; width: 70%; }
  .sk-lines div:last-child { height: 14px; width: 35%; }
  @keyframes shimmer { 50% { opacity: 0.55; } }
</style>
