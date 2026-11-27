// Step timers (spec §8). Stored as end times so they survive leaving the recipe and reloads.
const KEY = 'r.timers';
function load() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } }
function persist() { try { localStorage.setItem(KEY, JSON.stringify(timers.list)); } catch { /* ignore */ } }

export const timers = $state({ list: load(), now: Date.now() });

// timer: { key, recipeId, stepId, label: LText, total (ms), endAt|null, remaining (ms, when paused), done }
export function timerKey(recipeId, stepId) { return `${recipeId}:${stepId}`; }
export function getTimer(key) { return timers.list.find((t) => t.key === key); }

export function startTimer(recipeId, step) {
  const key = timerKey(recipeId, step.id);
  const total = step.timer.minutes * 60_000;
  const existing = getTimer(key);
  if (existing) {
    if (existing.endAt == null && !existing.done) existing.endAt = Date.now() + existing.remaining; // resume
  } else {
    timers.list.push({ key, recipeId, stepId: step.id, label: step.timer.label, total, endAt: Date.now() + total, remaining: total, done: false });
  }
  unlockAudio();
  persist();
}
export function pauseTimer(key) {
  const t = getTimer(key); if (!t || t.endAt == null) return;
  t.remaining = Math.max(0, t.endAt - Date.now()); t.endAt = null; persist();
}
export function resetTimer(key) {
  timers.list = timers.list.filter((t) => t.key !== key); persist();
}
export function remainingOf(t) {
  if (t.done) return 0;
  return t.endAt == null ? t.remaining : Math.max(0, t.endAt - timers.now);
}
/** Timers to show in the floating pill: running or finished, soonest first. */
export function activeTimers() {
  return timers.list.filter((t) => t.done || t.endAt != null).sort((a, b) => (a.done ? 0 : remainingOf(a)) - (b.done ? 0 : remainingOf(b)));
}

// ---------- alert ----------
let ctx;
function unlockAudio() {
  try { ctx ||= new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === 'suspended') ctx.resume(); } catch { /* no audio */ }
}
function beep() {
  try {
    unlockAudio();
    const t0 = ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = 880; o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, t0 + i * 0.5);
      g.gain.exponentialRampToValueAtTime(0.3, t0 + i * 0.5 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.5 + 0.35);
      o.start(t0 + i * 0.5); o.stop(t0 + i * 0.5 + 0.4);
    }
  } catch { /* ignore */ }
  try { navigator.vibrate?.([300, 150, 300, 150, 300]); } catch { /* ignore */ }
}

setInterval(() => {
  timers.now = Date.now();
  let changed = false;
  for (const t of timers.list) {
    if (!t.done && t.endAt != null && t.endAt <= timers.now) { t.done = true; t.endAt = null; changed = true; beep(); }
  }
  if (changed) persist();
}, 500);
