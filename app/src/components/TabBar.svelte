<script>
  // Floating glass tab bar — only on tab roots (Library, Browse, Bookmarks).
  import Icon from './Icon.svelte';
  import { route, go } from '../lib/router.svelte.js';
  import { app } from '../lib/store.svelte.js';
  import { strings } from '../lib/i18n.js';
  const t = $derived(strings(app.settings.lang));
  const tabs = $derived([
    { path: '/', icon: 'shelf', label: t.library },
    { path: '/browse', icon: 'folders', label: t.browse },
    { path: '/bookmarks', icon: 'bookmark', label: t.bookmarks }
  ]);
</script>

<nav class="bar" aria-label="Tabs">
  <div class="capsule">
    {#each tabs as tab (tab.path)}
      {@const active = route.path === tab.path}
      <button class="tab" class:active aria-label={tab.label} aria-current={active ? 'page' : undefined} onclick={() => go(tab.path, { replace: true })}>
        <Icon name={tab.icon} size={24} stroke={1.75} />
      </button>
    {/each}
  </div>
</nav>

<style>
  .bar {
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 20; display: flex; justify-content: center; pointer-events: none;
    padding: 0 var(--spacing-4) calc(var(--spacing-7-5) + env(safe-area-inset-bottom) * 0.4);
  }
  .capsule {
    pointer-events: auto; display: flex; width: 216px; height: 60px; padding: 5px; border-radius: var(--radius-full);
    background: var(--color-glass); border: 1px solid var(--color-glass-border);
    backdrop-filter: blur(24px) saturate(180%); -webkit-backdrop-filter: blur(24px) saturate(180%);
    box-shadow: inset 0 1px 0 var(--color-glass-highlight), 0 10px 30px var(--color-shadow);
  }
  .tab { flex: 1 1 0%; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-full); color: var(--color-text); }
  .tab.active { background: var(--color-pressed); color: var(--color-primary); }
</style>
