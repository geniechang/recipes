<script>
  // Cover photo with the category-icon fallback (spec: cover null or fails to load).
  import Icon from './Icon.svelte';
  let { src = null, icon = 'uncategorized', iconSize = 24, radius = 'var(--radius-md)', alt = '' } = $props();
  let failed = $state(false);
  $effect(() => { src; failed = false; });
</script>

<div class="cover" style="border-radius:{radius}">
  {#if src && !failed}
    <img {src} {alt} loading="lazy" decoding="async" onerror={() => (failed = true)} />
  {:else}
    <span class="fallback"><Icon name={icon} size={iconSize} stroke={1.5} /></span>
  {/if}
</div>

<style>
  .cover { width: 100%; height: 100%; overflow: hidden; background: var(--color-surface); position: relative; }
  img { width: 100%; height: 100%; object-fit: cover; }
  .fallback { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: var(--color-text-muted); }
</style>
