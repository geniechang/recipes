<script>
  import Icon from './Icon.svelte';
  let { icon, title, body = '', children } = $props();
</script>

<div class="empty">
  <span class="circle"><Icon name={icon} size={30} stroke={1.5} /></span>
  <h2>{title}</h2>
  {#if body}<p>{body}</p>{/if}
  {#if children}<div class="actions">{@render children()}</div>{/if}
</div>

<style>
  .empty { display: flex; flex-direction: column; align-items: center; text-align: center; gap: var(--spacing-3); padding: var(--spacing-15) var(--spacing-8); }
  .circle { width: 72px; height: 72px; border-radius: var(--radius-full); background: var(--color-surface); display: flex; align-items: center; justify-content: center; color: var(--color-text-muted); margin-bottom: var(--spacing-1); }
  h2 { margin: 0; font-family: var(--font-display); font-size: var(--text-xl); font-weight: var(--font-weight-bold); letter-spacing: var(--tracking-snug); line-height: var(--leading-lg); }
  p { margin: 0; color: var(--color-text-muted); font-size: var(--text-md); line-height: var(--leading-base); max-width: 300px; }
  .actions { margin-top: var(--spacing-3); }
</style>
