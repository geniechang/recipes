<script>
  // Floating timer pill (design 06): shown while a timer runs and its recipe isn't on screen.
  import Icon from './Icon.svelte';
  import { timers, activeTimers, remainingOf, resetTimer } from '../lib/timers.svelte.js';
  import { app } from '../lib/store.svelte.js';
  import { strings, lt } from '../lib/i18n.js';
  import { formatClock } from '../lib/format.js';
  import { route, go } from '../lib/router.svelte.js';
  let { raised = true } = $props();

  const t = $derived(strings(app.settings.lang));
  const list = $derived((timers.now, activeTimers()));
  const onRecipe = $derived(route.parts[0] === 'recipe' ? route.parts[1] : null);
  const shown = $derived(list.filter((x) => x.recipeId !== onRecipe));
  const first = $derived(shown[0]);

  function open() {
    const tm = first;
    if (tm.done) resetTimer(tm.key);
    go(`/recipe/${tm.recipeId}?tab=method&step=${tm.stepId}`);
  }
</script>

{#if first}
  <button class="pill" class:done={first.done} class:raised onclick={open}>
    {#if first.done}
      <Icon name="check" size={16} stroke={2.5} />
      <span class="label">{t.done} · {lt(first.label, app.settings.lang)}</span>
    {:else}
      <span class="dot"></span>
      <span class="label">{lt(first.label, app.settings.lang)}</span>
      <span class="time tnum">{formatClock(remainingOf(first))}</span>
    {/if}
    {#if shown.length > 1}<span class="more">+{shown.length - 1}</span>{/if}
    <Icon name="chevron-right" size={16} stroke={2} />
  </button>
{/if}

<style>
  .pill {
    position: fixed; left: 50%; transform: translateX(-50%); z-index: 25;
    bottom: calc(var(--spacing-7-5) + env(safe-area-inset-bottom) * 0.4);
    display: flex; align-items: center; gap: var(--spacing-2); min-height: var(--spacing-11);
    padding: var(--spacing-2-5) var(--spacing-3) var(--spacing-2-5) var(--spacing-4); border-radius: var(--radius-full);
    background: var(--color-text); color: var(--color-on-primary); box-shadow: 0 10px 30px var(--color-shadow);
    font-size: var(--text-sm); font-weight: var(--font-weight-semibold); line-height: var(--leading-sm); white-space: nowrap;
  }
  .pill.raised { bottom: calc(112px + env(safe-area-inset-bottom) * 0.4); }
  .pill.done { background: var(--color-primary); }
  .dot { width: 8px; height: 8px; border-radius: var(--radius-full); background: var(--color-primary-light); animation: pulse 1.2s infinite; }
  .time { font-weight: var(--font-weight-bold); }
  .more { opacity: 0.7; }
  @keyframes pulse { 50% { opacity: 0.3; } }
</style>
