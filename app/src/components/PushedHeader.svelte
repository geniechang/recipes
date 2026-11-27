<script>
  // Header for pushed screens: icon-only back + large title (+ optional trailing action).
  import Icon from './Icon.svelte';
  import { back } from '../lib/router.svelte.js';
  import { app } from '../lib/store.svelte.js';
  import { strings } from '../lib/i18n.js';
  let { title, fallback = '/browse', trailing } = $props();
  const t = $derived(strings(app.settings.lang));
</script>

<header class="hdr">
  <button class="icon-btn" aria-label={t.back} onclick={() => back(fallback)}><Icon name="chevron-left" size={24} stroke={2} /></button>
  <h1 class="large-title ellipsis">{title}</h1>
  {#if trailing}<div class="trail">{@render trailing()}</div>{/if}
</header>

<style>
  .hdr {
    display: flex; align-items: center; gap: var(--spacing-0-5);
    padding: var(--spacing-3) var(--spacing-6) var(--spacing-4) var(--spacing-3-5);
  }
  h1 { flex: 1 1 0%; }
  .trail { flex-shrink: 0; margin-right: calc(-1 * var(--spacing-2-5)); }
</style>
