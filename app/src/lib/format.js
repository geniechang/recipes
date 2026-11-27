// Amounts, units, temperatures and durations (spec §3 "IngredientGroup and item", "Temperatures").
import { lt } from './i18n.js';

const FRACTIONS = [
  [0, ''], [0.25, '¼'], [1 / 3, '⅓'], [0.5, '½'], [2 / 3, '⅔'], [0.75, '¾'], [1, '']
];

/** 2.25 -> "2¼", 0.5 -> "½", 3 -> "3". Snaps to the nearest quarter or third. */
export function fraction(x) {
  if (x <= 0) return '0';
  let whole = Math.floor(x);
  const rest = x - whole;
  let best = FRACTIONS[0], d = Infinity;
  for (const f of FRACTIONS) { const dd = Math.abs(rest - f[0]); if (dd < d) { d = dd; best = f; } }
  if (best[0] === 1) { whole += 1; return String(whole); }
  if (!best[1]) return String(whole);
  return whole ? `${whole}${best[1]}` : best[1];
}

function trim(n, digits = 1) {
  const s = n.toFixed(digits);
  return s.replace(/\.0+$/, '');
}

function metricNumber(n) {
  if (n >= 100) return String(Math.round(n));
  if (n >= 10) return String(Math.round(n));
  return trim(n, 1);
}

const SPOON = { tsp: { zh: '小匙', en: 'tsp' }, tbsp: { zh: '大匙', en: 'tbsp' } };

/**
 * Format one ingredient amount.
 * @param item  { amount, unit }  unit = canonical string | LText | null
 * @param opts  { lang, system: 'metric'|'us', scale }
 */
export function formatAmount(item, { lang, system = 'metric', scale = 1 }) {
  if (item.amount == null) return lang === 'zh' ? '適量' : 'to taste';
  const a = item.amount * scale;
  const u = item.unit;

  if (u && typeof u === 'object') return `${fraction(a)} ${lt(u, lang)}`;
  if (u === 'piece') return lang === 'zh' ? `${fraction(a)} 個` : fraction(a);
  if (u === 'tsp' || u === 'tbsp') return `${fraction(a)} ${SPOON[u][lang]}`;
  if (u === 'cup') return `${fraction(a)} ${a > 1 ? 'cups' : 'cup'}`;
  if (u === 'oz' || u === 'lb') return `${trim(a)} ${u}`;

  // grams / millilitres
  let grams = u === 'kg' ? a * 1000 : u === 'g' ? a : null;
  let ml = u === 'l' ? a * 1000 : u === 'ml' ? a : null;

  if (system === 'us') {
    if (grams != null) {
      if (grams < 10) return `${metricNumber(grams)} g`; // too small for oz
      const oz = grams / 28.3495;
      if (oz >= 16) return `${trim(oz / 16)} lb`;
      if (oz < 1.5) return `${fraction(oz)} oz`;
      return `${trim(oz)} oz`;
    }
    if (ml != null) {
      if (ml < 60) {
        const tbsp = ml / 14.787;
        if (tbsp < 1) return `${fraction(ml / 4.929)} ${SPOON.tsp[lang]}`;
        return `${fraction(tbsp)} ${SPOON.tbsp[lang]}`;
      }
      const cups = ml / 236.6;
      return `${fraction(cups)} ${cups > 1.1 ? 'cups' : 'cup'}`;
    }
  }
  if (grams != null) return grams >= 1000 ? `${trim(grams / 1000, 2)} kg` : `${metricNumber(grams)} g`;
  if (ml != null) return ml >= 1000 ? `${trim(ml / 1000, 2)} l` : `${metricNumber(ml)} ml`;
  return `${fraction(a)} ${u || ''}`.trim();
}

/** °C value -> display string in the chosen scale. Oven temperatures (≥100 °C) round to 5 °F. */
export function formatTemp(c, scale) {
  if (c == null) return '—';
  if (scale === 'F') {
    let f = c * 9 / 5 + 32;
    f = c >= 100 ? Math.round(f / 5) * 5 : Math.round(f);
    return `${f}°F`;
  }
  return `${c}°C`;
}

/** Replace {t1} tokens in a string with formatted temperatures. */
export function withTemps(text, temps, scale) {
  if (!text) return '';
  return text.replace(/\{(t\d+)\}/g, (_, k) => formatTemp(temps?.[k], scale));
}

/** LText -> string in the UI language with temperature tokens resolved. */
export function rt(v, lang, temps, scale) { return withTemps(lt(v, lang), temps, scale); }

export function formatDuration(mins, lang) {
  if (mins == null) return '';
  const h = Math.floor(mins / 60), m = Math.round(mins % 60);
  if (lang === 'zh') return [h ? `${h} 小時` : '', m ? `${m} 分鐘` : ''].filter(Boolean).join(' ');
  return [h ? `${h} hr` : '', m ? `${m} min` : ''].filter(Boolean).join(' ');
}

export function formatClock(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const mm = String(m).padStart(h ? 2 : 1, '0'), ss = String(sec).padStart(2, '0');
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
