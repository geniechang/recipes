<script>
  // Bottom sheet (design 14): scrim, grabber, title + secondary line, × close. Dismiss by ×, scrim tap or swipe down.
  import Icon from './Icon.svelte';
  let { title, subtitle = '', onclose, children } = $props();
  let startY = 0, dy = $state(0);
  function down(e) { startY = e.touches[0].clientY; }
  function move(e) { dy = Math.max(0, e.touches[0].clientY - startY); }
  function up() { if (dy > 100) onclose(); dy = 0; }
  function key(e) { if (e.key === 'Escape') onclose(); }
</script>

<svelte:window onkeydown={key} />
<button class="scrim" aria-label="Close" onclick={onclose}></button>
<div class="sheet" role="dialog" aria-modal="true" aria-label={title} style="transform:translateY({dy}px)">
  <div class="grab" ontouchstart={down} ontouchmove={move} ontouchend={up}><span></span></div>
  <div class="head">
    <div class="titles">
      <h2>{title}</h2>
      {#if subtitle}<p>{subtitle}</p>{/if}
    </div>
    <button class="close icon-btn" aria-label="Close" onclick={onclose}><span><Icon name="x" size={16} stroke={2.25} /></span></button>
  </div>
  <div class="body">{@render children()}</div>
</div>

<style>
  .scrim { position: fixed; inset: 0; background: color-mix(in srgb, var(--color-text) 40%, transparent); z-index: 50; animation: fade .2s; }
  .sheet {
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 51; max-width: 600px; margin: 0 auto; max-height: 88dvh; overflow: auto;
    background: var(--color-background); border-radius: var(--radius-xl) var(--radius-xl) 0 0; box-shadow: 0 -10px 30px var(--color-shadow);
    padding-bottom: calc(var(--spacing-8) + env(safe-area-inset-bottom)); animation: up .25s ease-out;
  }
  .grab { display: flex; justify-content: center; padding-block: var(--spacing-2) var(--spacing-1); }
  .grab span { width: 36px; height: 5px; border-radius: var(--radius-full); background: var(--color-border-strong); }
  .head { display: flex; align-items: flex-start; gap: var(--spacing-3); padding: var(--spacing-3) var(--spacing-3-5) var(--spacing-4) var(--spacing-6); }
  .titles { flex: 1 1 0%; }
  h2 { margin: 0; font-family: var(--font-display); font-size: var(--text-2xl); font-weight: var(--font-weight-extrabold); letter-spacing: var(--tracking-tight); line-height: var(--leading-title); }
  p { margin: var(--spacing-0-5) 0 0; color: var(--color-text-muted); font-size: var(--text-md); line-height: var(--leading-md); }
  .close span { width: 32px; height: 32px; border-radius: var(--radius-full); background: var(--color-surface); display: flex; align-items: center; justify-content: center; }
  .body { padding-inline: var(--spacing-6); }
  @keyframes up { from { transform: translateY(100%); } }
  @keyframes fade { from { opacity: 0; } }
</style>
