<script>
  // Line icons, 24×24, drawn with currentColor. Category icon keys match spec §3 "Category.icon".
  let { name, size = 24, stroke = 1.75, fill = false, title = '' } = $props();

  const P = {
    shelf: '<path d="M4 20V5m4 15V5m4 15V7m4.3 13-3-12.5 3-.7 3 12.5"/><path d="M3 20h18"/>',
    folders: '<path d="M3 8V18a2 2 0 0 0 2 2h12"/><path d="M7 5.5A1.5 1.5 0 0 1 8.5 4h3l2 2H19.5A1.5 1.5 0 0 1 21 7.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 7 14.5z"/>',
    bookmark: '<path d="M7 3.5h10v17l-5-4-5 4z"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    'chevron-right': '<path d="M9 6l6 6-6 6"/>',
    'chevron-left': '<path d="M15 6l-6 6 6 6"/>',
    'chevron-down': '<path d="M6 9l6 6 6-6"/>',
    sort: '<path d="M7 4v16m0 0-3-3m3 3 3-3M17 20V4m0 0-3 3m3-3 3 3"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><circle cx="12" cy="7.5" r=".6" fill="currentColor"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    link: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>',
    'cloud-off': '<path d="M3 3l18 18"/><path d="M8.5 6.3A6 6 0 0 1 17.7 10H18a4 4 0 0 1 2.3 7.3M17 18H7a5 5 0 0 1-2.6-9.3"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/>',
    phone: '<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M10.5 18.5h3M12 7v3"/>',
    reset: '<path d="M4 12a8 8 0 1 0 2.3-5.7"/><path d="M4 4v4h4"/>',
    check: '<path d="M5 12l5 5 9-10"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    refresh: '<path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v4h-4"/>',
    history: '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v4h4M12 8v4l3 2"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="M10.8 12.2 20 3m-3 3 2.5 2.5M14.5 8.5 17 11"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    thermometer: '<path d="M14 14.8V5a2 2 0 1 0-4 0v9.8a4 4 0 1 0 4 0z"/><path d="M12 9v7"/>',
    scale: '<path d="M4 20h16M12 4v16M6 8h12M6 8l-3 6a3 3 0 0 0 6 0zm12 0-3 6a3 3 0 0 0 6 0z"/>',
    // category icons
    cupcake: '<path d="M6 12h12l-1.5 8h-9z"/><path d="M5 12a3 3 0 0 1 1.5-5.6A5.5 5.5 0 0 1 17.5 6.4 3 3 0 0 1 19 12M10 12l.5 8M14 12l-.5 8"/>',
    cake: '<path d="M4 21h16M5 21v-8h14v8M5 16c2 1.5 3.5 1.5 5 0 1.5 1.5 3 1.5 4.5 0 1.5 1.5 3 1.5 4.5 0"/><path d="M12 13V9m0-5c-1 1.2-1 2.2 0 3 1-.8 1-1.8 0-3z"/>',
    bowl: '<path d="M3.5 11h17a8.5 8.5 0 0 1-17 0z"/><path d="M9 21h6M13 4l7-1.5M11.5 8 20 5"/>',
    'fork-knife': '<path d="M7 3v8a2 2 0 0 1-2 2v8M5 3v5m4-5v5M7 13v8M17 21V3c-2 2-3 5-3 8h3"/>',
    cookie: '<path d="M12 3a9 9 0 1 0 9 9 3 3 0 0 1-3-3 3 3 0 0 1-3-3 3 3 0 0 1-3-3z"/><circle cx="8.5" cy="10" r=".8" fill="currentColor"/><circle cx="10" cy="15.5" r=".8" fill="currentColor"/><circle cx="15" cy="14" r=".8" fill="currentColor"/>',
    bread: '<path d="M6 20V10.5A3.5 3.5 0 0 1 4.5 4C6 3 8 3 12 3s6 0 7.5 1A3.5 3.5 0 0 1 18 10.5V20z"/><path d="M9 9l2 2m2-4 2 2"/>',
    chili: '<path d="M6.5 20.5C4 18 5.5 13 9 9.5s7-5 9-4c1 3-1 7-4.5 10.5S8 22 6.5 20.5z"/><path d="M18 5.5c0-1.5.5-2.5 2-3M15.5 6.5c-.5-1.5-.2-2.6.8-3.5"/>',
    pasta: '<path d="M3.5 11h17a8.5 8.5 0 0 1-17 0z"/><path d="M8 11c0-3 2-3 2-5.5M12 11c0-3 2-3 2-5.5M16 11c0-2 1.5-2.5 1.5-4.5"/>',
    soup: '<path d="M3.5 11h17a8.5 8.5 0 0 1-17 0z"/><path d="M9 3.5c-.8 1 .8 2 0 3M12 3.5c-.8 1 .8 2 0 3M15 3.5c-.8 1 .8 2 0 3"/>',
    fish: '<path d="M2.5 12c3-4.5 9-6 14-3l4.5-3v12l-4.5-3c-5 3-11 1.5-14-3z"/><circle cx="7.5" cy="11" r=".8" fill="currentColor"/>',
    egg: '<path d="M12 3c3.5 0 7 6 7 10.5a7 7 0 0 1-14 0C5 9 8.5 3 12 3z"/>',
    drink: '<path d="M6 7h12l-1.5 14h-9zM9 3l1.5 4M6.5 12h11"/>',
    person: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5"/>',
    uncategorized: '<circle cx="12" cy="12" r="8.5" stroke-dasharray="3 3"/>'
  };
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill={fill ? 'currentColor' : 'none'}
  stroke="currentColor"
  stroke-width={stroke}
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden={title ? undefined : 'true'}
  role={title ? 'img' : undefined}
  aria-label={title || undefined}
  style="flex-shrink:0;display:block"
>{@html P[name] || P.uncategorized}</svg>
