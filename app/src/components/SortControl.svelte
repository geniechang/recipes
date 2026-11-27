<script>
  // Sort control + popover menu (design 05 "Sort menu").
  import Icon from './Icon.svelte';
  let { options, value, onchange } = $props(); // options: [{ value, label }]
  let open = $state(false);
  const current = $derived(options.find((o) => o.value === value) || options[0]);
  function pick(v) { open = false; onchange(v); }
</script>

<div class="wrap">
  <button class="control" aria-haspopup="menu" aria-expanded={open} onclick={() => (open = !open)}>
    <Icon name="sort" size={14} stroke={2} />
    <span>{current.label}</span>
    <Icon name="chevron-down" size={12} stroke={2} />
  </button>
  {#if open}
    <button class="scrim" aria-label="Close" onclick={() => (open = false)}></button>
    <div class="menu" role="menu">
      {#each options as o (o.value)}
        <button role="menuitemradio" aria-checked={o.value === value} class="item" onclick={() => pick(o.value)}>
          <span>{o.label}</span>
          {#if o.value === value}<span class="tick"><Icon name="check" size={18} stroke={2.25} /></span>{/if}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .wrap { position: relative; }
  .control {
    display: inline-flex; align-items: center; gap: var(--spacing-1); min-height: var(--spacing-11);
    font-size: var(--text-sm); font-weight: var(--font-weight-medium); line-height: var(--leading-xs); color: var(--color-text);
  }
  .scrim { position: fixed; inset: 0; z-index: 30; cursor: default; }
  .menu {
    position: absolute; right: 0; top: calc(100% - var(--spacing-1)); z-index: 31; min-width: 200px;
    background: var(--color-background); border: 1px solid var(--color-border); border-radius: var(--radius-lg);
    box-shadow: 0 10px 30px var(--color-shadow); padding-block: var(--spacing-1); overflow: hidden;
  }
  .item {
    display: flex; align-items: center; justify-content: space-between; width: 100%; min-height: var(--spacing-11);
    padding-inline: var(--spacing-4); font-size: var(--text-md); line-height: var(--leading-md); text-align: left;
  }
  .item:active { background: var(--color-pressed); }
  .tick { color: var(--color-primary-text); }
</style>
