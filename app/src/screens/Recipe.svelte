<script>
  import Icon from '../components/Icon.svelte';
  import Cover from '../components/Cover.svelte';
  import EmptyState from '../components/EmptyState.svelte';
  import { app, toggleBookmark, markOpened, checksFor, toggleCheck } from '../lib/store.svelte.js';
  import { strings, lt } from '../lib/i18n.js';
  import { catMap, authorMap, ingMap, recipeCats } from '../lib/model.js';
  import { formatAmount, rt, formatDuration, formatClock, fraction } from '../lib/format.js';
  import { timers, timerKey, getTimer, startTimer, pauseTimer, resetTimer, remainingOf } from '../lib/timers.svelte.js';
  import { route, go, back } from '../lib/router.svelte.js';
  import { tick, untrack } from 'svelte';

  let { id } = $props();
  const lang = $derived(app.settings.lang);
  const t = $derived(strings(lang));
  const r = $derived(app.data?.recipes?.find((x) => x.id === id));
  const cats = $derived(r ? recipeCats(r, catMap(app.data)) : []);
  const author = $derived(r?.author ? authorMap(app.data).get(r.author) : null);
  const ings = $derived(ingMap(app.data));
  const tab = $derived(route.query.tab === 'method' ? 'method' : 'ingredients');
  let system = $state(app.settings.units);
  let servings = $state(null);
  const scale = $derived(r?.yield?.amount && servings ? servings / r.yield.amount : 1);
  const checks = $derived((app.checks, checksFor(id)));
  const itemById = $derived(new Map((r?.ingredientGroups || []).flatMap((g) => g.items).map((i) => [i.id, i])));
  const stepNo = $derived(new Map((r?.steps || []).map((s, i) => [s.id, i + 1])));
  const scaleT = $derived(app.settings.temp);
  const txt = (v) => rt(v, lang, r?.temps, scaleT);

  // Steps grouped by section (consecutive runs).
  const sections = $derived.by(() => {
    const out = [];
    for (const s of r?.steps || []) {
      const name = lt(s.section, lang);
      if (!out.length || out.at(-1).name !== name) out.push({ name, steps: [] });
      out.at(-1).steps.push(s);
    }
    return out;
  });

  const rid = $derived(r?.id);
  $effect(() => { if (rid) untrack(() => { markOpened(rid); servings = r.yield?.amount ?? null; }); });

  // Deep link from the timer pill: scroll to the step.
  $effect(() => {
    const step = route.query.step;
    if (r && tab === 'method' && step) tick().then(() => document.getElementById('step-' + step)?.scrollIntoView({ block: 'center' }));
  });

  function setTab(v) { go(`/recipe/${id}${v === 'method' ? '?tab=method' : ''}`, { replace: true }); }

  // Cook mode = Screen Wake Lock. Hidden where unsupported.
  const canWake = 'wakeLock' in navigator;
  let lock = $state(null);
  async function toggleCook() {
    if (lock) { await lock.release(); lock = null; return; }
    try { lock = await navigator.wakeLock.request('screen'); lock.addEventListener('release', () => (lock = null)); } catch { lock = null; }
  }
  $effect(() => () => { lock?.release(); });

  const pad = (n) => String(n).padStart(2, '0');
  function ingName(item) { return lt(ings.get(item.ref)?.name, lang) || item.ref; }
  function amt(item) { return formatAmount(item, { lang, system, scale }); }
  function yieldText() {
    const u = r.yield.unit;
    return `${fraction(servings)}${lang === 'zh' ? ' ' : ' '}${typeof u === 'string' ? u : lt(u, lang)}`;
  }
</script>

{#if !r}
  <div class="screen pushed">
    <header class="nf-hdr"><button class="icon-btn" aria-label={t.back} onclick={() => back('/')}><Icon name="chevron-left" size={24} stroke={2} /></button></header>
    {#if app.data}
      <EmptyState icon="uncategorized" title={t.notFound} body={t.notFoundBody}>
        <button class="btn-primary" onclick={() => go('/', { replace: true })}>{t.backToLibrary}</button>
      </EmptyState>
    {:else}
      <EmptyState icon="refresh" title={t.loading} />
    {/if}
  </div>
{:else}
  <div class="screen pushed recipe">
    <div class="hero">
      <Cover src={r.cover} icon={cats[0]?.icon} iconSize={48} radius="0" alt={lt(r.title, lang)} />
      <div class="nav">
        <button class="glass" aria-label={t.back} onclick={() => back('/')}><Icon name="chevron-left" size={22} stroke={2} /></button>
        <span class="spacer"></span>
        {#if r.source?.url}
          <a class="glass" href={r.source.url} target="_blank" rel="noopener" aria-label={t.openSource}><Icon name="link" size={20} stroke={2} /></a>
        {/if}
        <button class="glass" class:on={r.bookmarked} aria-label={r.bookmarked ? t.removeBookmark : t.bookmark} aria-pressed={r.bookmarked} onclick={() => toggleBookmark(r)}>
          <Icon name="bookmark" size={20} stroke={2} fill={r.bookmarked} />
        </button>
      </div>
    </div>

    <div class="intro gutter">
      <p class="label cats" class:zh={lang === 'zh'}>{cats.map((c) => lt(c.name, lang)).join(' · ')}</p>
      <h1 class="title">{lt(r.title, lang)}</h1>
      {#if author}
        <p class="byline">by {author.name}</p>
      {:else if r.source?.label}
        <p class="byline">{t.from} {lt(r.source.label, lang)}</p>
      {/if}
      <div class="meta">
        {#if r.totalMinutes}
          <div class="m"><span class="label muted" class:zh={lang === 'zh'}>{t.totalTime}</span><span class="mv">{formatDuration(r.totalMinutes, lang)}</span></div>
        {/if}
        {#if r.yield?.amount}
          <div class="m">
            <span class="label muted" class:zh={lang === 'zh'}>{t.yieldLabel}</span>
            <div class="stepper">
              <button aria-label="−" disabled={servings <= 1} onclick={() => (servings = Math.max(1, servings - 1))}><Icon name="minus" size={16} stroke={2} /></button>
              <span class="mv tnum">{yieldText()}</span>
              <button aria-label="+" onclick={() => (servings += 1)}><Icon name="plus" size={16} stroke={2} /></button>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <div class="tabbar gutter">
      <div class="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'ingredients'} class:active={tab === 'ingredients'} onclick={() => setTab('ingredients')}>{t.ingredientsTab}</button>
        <button role="tab" aria-selected={tab === 'method'} class:active={tab === 'method'} onclick={() => setTab('method')}>{t.method}</button>
      </div>
      {#if tab === 'ingredients'}
        <div class="seg" role="radiogroup" aria-label={t.units}>
          <button role="radio" aria-checked={system === 'metric'} class:on={system === 'metric'} onclick={() => (system = 'metric')}>{t.metric}</button>
          <button role="radio" aria-checked={system === 'us'} class:on={system === 'us'} onclick={() => (system = 'us')}>{t.us}</button>
        </div>
      {/if}
    </div>

    {#if tab === 'ingredients'}
      <div class="gutter">
        {#each r.ingredientGroups as g, gi (gi)}
          {#if g.name}<h2 class="label group" class:zh={lang === 'zh'}>{lt(g.name, lang)}</h2>{/if}
          {#each g.items as it (it.id)}
            {@const done = checks.includes(it.id)}
            <div class="ing" class:done>
              <button class="check" role="checkbox" aria-checked={done} aria-label={ingName(it)} onclick={() => toggleCheck(id, it.id)}>
                <span class="box">{#if done}<Icon name="check" size={14} stroke={3} />{/if}</span>
              </button>
              <button class="ing-text" onclick={() => go(`/ingredient/${it.ref}`)}>
                <span class="ing-name">{ingName(it)}</span>
                {#if it.note}<span class="ing-note">{txt(it.note)}</span>{/if}
              </button>
              <span class="ing-amt tnum">{amt(it)}</span>
            </div>
          {/each}
        {/each}
      </div>
    {:else}
      <div class="gutter">
        {#if canWake}
          <div class="cook">
            <span class="cook-ic"><Icon name="phone" size={22} /></span>
            <span class="cook-text"><strong>{t.cookMode}</strong><span>{t.cookModeBody}</span></span>
            <button class="switch" role="switch" aria-checked={!!lock} aria-label={t.cookMode} class:on={!!lock} onclick={toggleCook}><span></span></button>
          </div>
        {/if}

        {#if r.prep?.length}
          <h2 class="label group" class:zh={lang === 'zh'}>{t.beforeYouStart}</h2>
          <ul class="prep">{#each r.prep as p, i (i)}<li>{txt(p)}</li>{/each}</ul>
        {/if}

        {#each sections as sec, si (si)}
          {#if sec.name}<h2 class="label group" class:zh={lang === 'zh'}>{sec.name}</h2>{/if}
          {#each sec.steps as s (s.id)}
            {@const key = timerKey(id, s.id)}
            {@const tm = (timers.now, getTimer(key))}
            <div class="step" id="step-{s.id}" class:hl={route.query.step === s.id}>
              <span class="num tnum">{pad(stepNo.get(s.id))}</span>
              <div class="step-body">
                <p>{txt(s.text)}</p>
                {#if s.uses?.length}
                  <div class="chips">
                    {#each s.uses as u, ui (ui)}
                      {#if u.ingredient && itemById.get(u.ingredient)}
                        {@const it = itemById.get(u.ingredient)}
                        <span class="chip"><b>{ingName(it)}</b> {amt(it)}</span>
                      {:else if u.fromStep}
                        <span class="chip prepped"><b>{lt(u.label, lang)}</b> · {t.step(pad(stepNo.get(u.fromStep)))}</span>
                      {/if}
                    {/each}
                  </div>
                {/if}
                {#if s.timer}
                  <div class="timer" class:running={tm && tm.endAt != null} class:finished={tm?.done}>
                    <Icon name="timer" size={18} stroke={2} />
                    <span class="t-label">{lt(s.timer.label, lang)}</span>
                    <span class="t-time tnum">{tm ? (tm.done ? t.timerDone : formatClock(remainingOf(tm))) : formatClock(s.timer.minutes * 60000)}</span>
                    <span class="spacer"></span>
                    {#if tm && (tm.done || tm.endAt == null)}
                      <button class="t-btn" aria-label={t.reset} onclick={() => resetTimer(key)}><Icon name="reset" size={16} stroke={2} /></button>
                    {/if}
                    {#if !tm || (!tm.done && tm.endAt == null)}
                      <button class="t-main" onclick={() => startTimer(id, s)}>{tm ? t.resume : t.start}</button>
                    {:else if !tm.done}
                      <button class="t-main" onclick={() => pauseTimer(key)}>{t.pause}</button>
                    {:else}
                      <button class="t-main" onclick={() => resetTimer(key)}>{t.done}</button>
                    {/if}
                  </div>
                {/if}
              </div>
            </div>
          {/each}
        {/each}

        {#if r.notes?.length}
          <h2 class="label group" class:zh={lang === 'zh'}>{t.notes}</h2>
          <ul class="notes">{#each r.notes as n, i (i)}<li>{txt(n)}</li>{/each}</ul>
        {/if}
      </div>
    {/if}
  </div>
{/if}

<style>
  .nf-hdr { padding: var(--spacing-3) var(--spacing-3-5); }
  .recipe { padding-top: 0; }
  .hero { position: relative; aspect-ratio: 4 / 3; width: 100%; }
  .nav { position: absolute; left: 0; right: 0; top: 0; display: flex; gap: var(--spacing-2); padding: calc(env(safe-area-inset-top) + var(--spacing-3)) var(--spacing-4) 0; }
  .spacer { flex: 1 1 0%; }
  .glass {
    width: var(--spacing-11); height: var(--spacing-11); border-radius: var(--radius-full); display: flex; align-items: center; justify-content: center;
    background: color-mix(in srgb, var(--color-background) 78%, transparent); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
    color: var(--color-text); box-shadow: 0 2px 10px var(--color-shadow);
  }
  .glass.on { color: var(--color-primary); }

  .intro { padding-top: var(--spacing-5); padding-bottom: var(--spacing-5); }
  .cats { margin: 0 0 var(--spacing-1-5); color: var(--color-primary-text); }
  .title { margin: 0; font-family: var(--font-display); font-size: var(--text-3xl); font-weight: var(--font-weight-extrabold); letter-spacing: var(--tracking-tight); line-height: var(--leading-headline); }
  .byline { margin: var(--spacing-1-5) 0 0; color: var(--color-text-muted); font-size: var(--text-md); line-height: var(--leading-md); }
  .meta { display: flex; gap: var(--spacing-8); margin-top: var(--spacing-5); padding-top: var(--spacing-4); border-top: 1px solid var(--color-border); }
  .m { display: flex; flex-direction: column; gap: var(--spacing-1); }
  .mv { font-size: var(--text-base); font-weight: var(--font-weight-semibold); line-height: var(--leading-md); }
  .stepper { display: flex; align-items: center; gap: var(--spacing-2); }
  .stepper button { width: 32px; height: 32px; border-radius: var(--radius-full); border: 1px solid var(--color-border); display: flex; align-items: center; justify-content: center; position: relative; }
  .stepper button::after { content: ''; position: absolute; inset: -6px; }
  .stepper button:disabled { opacity: 0.35; }

  .tabbar { position: sticky; top: 0; z-index: 5; display: flex; align-items: center; justify-content: space-between; background: var(--color-background); border-bottom: 1px solid var(--color-text); padding-top: env(safe-area-inset-top); }
  .tabs { display: flex; gap: var(--spacing-6); }
  .tabs button { min-height: var(--spacing-12); font-family: var(--font-display); font-size: var(--text-lg); font-weight: var(--font-weight-bold); color: var(--color-text-muted); border-bottom: 3px solid transparent; margin-bottom: -1px; }
  .tabs button.active { color: var(--color-text); border-bottom-color: var(--color-primary); }
  .seg { display: flex; background: var(--color-surface); border-radius: var(--radius-full); padding: 2px; }
  .seg button { min-height: 32px; padding-inline: var(--spacing-3); border-radius: var(--radius-full); font-size: var(--text-sm); font-weight: var(--font-weight-medium); color: var(--color-text-muted); }
  .seg button.on { background: var(--color-background); color: var(--color-text); box-shadow: 0 1px 3px var(--color-shadow); }

  .group { margin: var(--spacing-6) 0 var(--spacing-1); }
  .ing { display: flex; align-items: center; gap: var(--spacing-2); border-bottom: 1px solid var(--color-border); }
  .check { width: var(--spacing-11); height: var(--spacing-11); margin-left: calc(-1 * var(--spacing-2-5)); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .box { width: 22px; height: 22px; border-radius: var(--radius-sm); border: 1.5px solid var(--color-border-strong); display: flex; align-items: center; justify-content: center; color: var(--color-on-primary); }
  .done .box { background: var(--color-primary); border-color: var(--color-primary); }
  .ing-text { flex: 1 1 0%; min-width: 0; display: flex; flex-direction: column; text-align: left; padding-block: var(--spacing-3); }
  .ing-name { font-size: var(--text-base); font-weight: var(--font-weight-medium); line-height: var(--leading-md); }
  .ing-note { color: var(--color-text-muted); font-size: var(--text-sm); line-height: var(--leading-sm); }
  .ing-amt { font-size: var(--text-base); font-weight: var(--font-weight-semibold); line-height: var(--leading-md); white-space: nowrap; }
  .done .ing-name, .done .ing-amt { color: var(--color-text-muted); text-decoration: line-through; }

  .cook { display: flex; align-items: center; gap: var(--spacing-3); margin-top: var(--spacing-5); padding: var(--spacing-3) var(--spacing-4); background: var(--color-surface); border-radius: var(--radius-lg); }
  .cook-ic { color: var(--color-primary-text); display: flex; }
  .cook-text { flex: 1 1 0%; display: flex; flex-direction: column; font-size: var(--text-sm); line-height: var(--leading-sm); }
  .cook-text strong { font-size: var(--text-md); font-weight: var(--font-weight-semibold); }
  .cook-text span { color: var(--color-text-muted); }
  .switch { width: 51px; height: 31px; border-radius: var(--radius-full); background: var(--color-border-strong); position: relative; flex-shrink: 0; transition: background .2s; }
  .switch span { position: absolute; top: 2px; left: 2px; width: 27px; height: 27px; border-radius: var(--radius-full); background: var(--color-background); box-shadow: 0 2px 4px var(--color-shadow); transition: transform .2s; }
  .switch.on { background: var(--color-primary); }
  .switch.on span { transform: translateX(20px); }

  .prep, .notes { margin: 0; padding-left: var(--spacing-5); font-size: var(--text-md); line-height: var(--leading-relaxed); }
  .prep li, .notes li { margin-block: var(--spacing-1-5); }
  .step { display: flex; gap: var(--spacing-4); padding-block: var(--spacing-4); border-bottom: 1px solid var(--color-border); scroll-margin-top: 80px; }
  .step.hl { background: linear-gradient(var(--color-surface), var(--color-surface)) no-repeat; background-size: calc(100% + var(--spacing-6) * 2) 100%; background-position: center; }
  .num { font-family: var(--font-display); font-size: var(--text-xl); font-weight: var(--font-weight-extrabold); color: var(--color-primary-text); line-height: var(--leading-md); width: 28px; flex-shrink: 0; }
  .step-body { flex: 1 1 0%; min-width: 0; display: flex; flex-direction: column; gap: var(--spacing-2-5); }
  .step-body p { margin: 0; font-size: var(--text-base); line-height: var(--leading-relaxed); }
  .chips { display: flex; flex-wrap: wrap; gap: var(--spacing-1-5); }
  .chip { padding: var(--spacing-1) var(--spacing-2-5); background: var(--color-surface); border-radius: var(--radius-full); font-size: var(--text-sm); line-height: var(--leading-sm); color: var(--color-text-muted); }
  .chip b { color: var(--color-text); font-weight: var(--font-weight-semibold); }
  .chip.prepped { background: transparent; border: 1px dashed var(--color-border-strong); }
  .timer { display: flex; align-items: center; gap: var(--spacing-2); padding: var(--spacing-1) var(--spacing-1) var(--spacing-1) var(--spacing-3); border: 1px solid var(--color-border); border-radius: var(--radius-full); font-size: var(--text-sm); line-height: var(--leading-sm); }
  .timer.running { border-color: var(--color-primary); color: var(--color-primary-text); }
  .timer.finished { background: var(--color-primary); border-color: var(--color-primary); color: var(--color-on-primary); }
  .t-label { font-weight: var(--font-weight-medium); }
  .t-time { font-weight: var(--font-weight-bold); }
  .t-btn { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-full); }
  .t-main { min-height: 36px; padding-inline: var(--spacing-4); border-radius: var(--radius-full); background: var(--color-text); color: var(--color-on-primary); font-weight: var(--font-weight-semibold); }
  .finished .t-main { background: var(--color-background); color: var(--color-primary-text); }
</style>
