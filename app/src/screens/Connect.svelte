<script>
  import Icon from '../components/Icon.svelte';
  import { app, connect } from '../lib/store.svelte.js';
  import { strings } from '../lib/i18n.js';
  import { TOKEN_URL } from '../lib/github.js';
  import { back, go } from '../lib/router.svelte.js';
  const t = $derived(strings(app.settings.lang));
  let key = $state('');
  let busy = $state(false);
  let failed = $state(false);

  async function paste() {
    try { key = (await navigator.clipboard.readText()).trim(); } catch { /* clipboard blocked: user types instead */ }
  }
  async function submit(e) {
    e.preventDefault();
    if (!key.trim()) return;
    busy = true; failed = false;
    try { await connect(key.trim()); go('/', { replace: true }); }
    catch { failed = true; }
    finally { busy = false; }
  }
</script>

<div class="screen pushed">
  <header class="hdr"><button class="icon-btn" aria-label={t.back} onclick={() => back('/')}><Icon name="chevron-left" size={24} stroke={2} /></button></header>
  <div class="gutter body">
    <span class="badge"><Icon name="key" size={28} /></span>
    <h1 class="large-title">{t.connectTitle}</h1>
    <p class="lead">{t.connectBody}</p>
    <ol>
      <li>{t.connectStep1}</li>
      <li>{t.connectStep2}</li>
      <li>{t.connectStep3}</li>
    </ol>
    <a class="btn-text gh" href={TOKEN_URL} target="_blank" rel="noopener"><Icon name="link" size={16} stroke={2} /> {t.openGitHub}</a>

    <form onsubmit={submit}>
      <div class="field" class:err={failed}>
        <input type="password" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="github_pat_…" bind:value={key} aria-label={t.accessKey} />
        <button type="button" class="btn-text" onclick={paste}>{t.paste}</button>
      </div>
      {#if failed}<p class="error" role="alert">{t.connectFailed}</p>{/if}
      <button class="btn-primary wide" disabled={busy || !key.trim()}>{busy ? t.connecting : t.connect}</button>
      {#if app.data}<button type="button" class="btn-text wide" onclick={() => back('/')}>{t.notNow}</button>{/if}
    </form>
    <p class="fine">{t.keyStays}</p>
  </div>
</div>

<style>
  .hdr { padding: var(--spacing-3) var(--spacing-3-5) 0; }
  .body { display: flex; flex-direction: column; }
  .badge { width: 56px; height: 56px; border-radius: var(--radius-lg); background: var(--color-surface); color: var(--color-primary-text); display: flex; align-items: center; justify-content: center; margin: var(--spacing-4) 0 var(--spacing-5); }
  .lead { margin: var(--spacing-3) 0 var(--spacing-4); color: var(--color-text-muted); font-size: var(--text-md); line-height: var(--leading-relaxed); }
  ol { margin: 0; padding-left: var(--spacing-5); font-size: var(--text-md); line-height: var(--leading-relaxed); }
  li { margin-bottom: var(--spacing-1-5); }
  .gh { display: inline-flex; align-items: center; gap: var(--spacing-1-5); align-self: flex-start; margin: var(--spacing-1) 0 var(--spacing-6) calc(-1 * var(--spacing-2)); }
  form { display: flex; flex-direction: column; gap: var(--spacing-3); }
  .field { display: flex; align-items: center; gap: var(--spacing-2); border: 1.5px solid var(--color-border-strong); border-radius: var(--radius-lg); padding-left: var(--spacing-4); }
  .field:focus-within { border-color: var(--color-primary); }
  .field.err { border-color: var(--color-danger); }
  input { flex: 1 1 0%; min-width: 0; border: 0; outline: 0; background: none; min-height: var(--spacing-12); font-size: var(--text-base); color: var(--color-text); }
  .error { margin: 0; color: var(--color-danger); font-size: var(--text-sm); line-height: var(--leading-sm); }
  .wide { width: 100%; }
  .fine { margin: var(--spacing-5) 0 0; text-align: center; color: var(--color-text-muted); font-size: var(--text-sm); line-height: var(--leading-sm); }
</style>
