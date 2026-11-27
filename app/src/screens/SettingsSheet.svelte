<script>
  import Icon from '../components/Icon.svelte';
  import Sheet from '../components/Sheet.svelte';
  import { app, setSetting, refresh, flushBookmarks, keyDaysLeft } from '../lib/store.svelte.js';
  import { strings } from '../lib/i18n.js';
  import { HISTORY_URL } from '../lib/github.js';
  import { go } from '../lib/router.svelte.js';
  const lang = $derived(app.settings.lang);
  const t = $derived(strings(lang));
  const close = () => (app.settingsOpen = false);

  function ago(ts) {
    if (!ts) return '—';
    const m = Math.floor((Date.now() - ts) / 60000);
    return m < 1 ? t.justNow : m < 60 ? t.minAgo(m) : t.hAgo(Math.floor(m / 60));
  }
  const status = $derived(
    !app.online ? t.offline
      : app.saving ? t.saving
      : app.saveFailed ? t.notSaved
      : t.saved(ago(Math.max(app.savedAt || 0, app.fetchedAt || 0)))
  );
  const days = $derived(keyDaysLeft());
  async function sync() { await refresh(); flushBookmarks(); }
  function seg(key, options) { return { key, options }; }
  const prefs = $derived([
    { icon: 'globe', label: t.language, body: '', ...seg('lang', [['zh', '中文'], ['en', 'English']]) },
    { icon: 'thermometer', label: t.temperature, body: t.temperatureBody, ...seg('temp', [['C', '°C'], ['F', '°F']]) },
    { icon: 'scale', label: t.units, body: t.unitsBody, ...seg('units', [['metric', t.metric], ['us', t.us]]) }
  ]);
</script>

<Sheet title={t.settings} subtitle={status} onclose={close}>
  <div class="group">
    <button class="row row-link" onclick={sync} disabled={app.loading}>
      <span class="ic"><Icon name="refresh" size={20} /></span>
      <span class="txt"><span class="name">{t.syncNow}</span></span>
    </button>
    <button class="row row-link" onclick={() => { close(); go('/connect'); }}>
      <span class="ic"><Icon name="key" size={20} /></span>
      <span class="txt"><span class="name">{t.accessKey}</span><span class="sub">{days == null ? t.expiryUnknown : t.expiresIn(Math.max(0, days))}</span></span>
      <span class="muted"><Icon name="chevron-right" size={16} stroke={2} /></span>
    </button>
    <a class="row row-link" href={HISTORY_URL} target="_blank" rel="noopener">
      <span class="ic"><Icon name="history" size={20} /></span>
      <span class="txt"><span class="name">{t.versionHistory}</span><span class="sub">{t.versionHistoryBody}</span></span>
      <span class="muted"><Icon name="link" size={16} stroke={2} /></span>
    </a>
  </div>

  <h3 class="label" class:zh={lang === 'zh'}>{t.preferences}</h3>
  <div class="group">
    {#each prefs as p (p.key)}
      <div class="row">
        <span class="ic"><Icon name={p.icon} size={20} /></span>
        <span class="txt"><span class="name">{p.label}</span>{#if p.body}<span class="sub">{p.body}</span>{/if}</span>
        <div class="seg" role="radiogroup" aria-label={p.label}>
          {#each p.options as [v, l] (v)}
            <button role="radio" aria-checked={app.settings[p.key] === v} class:on={app.settings[p.key] === v} onclick={() => setSetting(p.key, v)}>{l}</button>
          {/each}
        </div>
      </div>
    {/each}
  </div>
</Sheet>

<style>
  .group { border-top: 1px solid var(--color-text); }
  h3 { margin: var(--spacing-6) 0 var(--spacing-2); }
  .row { display: flex; align-items: center; gap: var(--spacing-3); width: 100%; min-height: 56px; padding-block: var(--spacing-2-5); border-bottom: 1px solid var(--color-border); text-align: left; }
  .row:disabled { opacity: 0.5; }
  .ic { display: flex; color: var(--color-text); }
  .txt { flex: 1 1 0%; min-width: 0; display: flex; flex-direction: column; }
  .name { font-size: var(--text-base); font-weight: var(--font-weight-medium); line-height: var(--leading-md); }
  .sub { color: var(--color-text-muted); font-size: var(--text-sm); line-height: var(--leading-sm); }
  .seg { display: flex; background: var(--color-surface); border-radius: var(--radius-full); padding: 2px; flex-shrink: 0; }
  .seg button { min-height: 32px; padding-inline: var(--spacing-3); border-radius: var(--radius-full); font-size: var(--text-sm); font-weight: var(--font-weight-medium); color: var(--color-text-muted); }
  .seg button.on { background: var(--color-background); color: var(--color-text); box-shadow: 0 1px 3px var(--color-shadow); }
</style>
