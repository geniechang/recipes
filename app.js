import { GH } from './config.js';

/* ---------- helpers ---------- */
const $ = s => document.querySelector(s);
const app = $('#app');
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const lines = t => String(t || '').split('\n').map(s => s.trim()).filter(Boolean);
const safeUrl = u => /^https?:\/\//i.test(u || '') ? u : '';
let toastTimer;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}
const CAT_COLORS = ['#c7361e', '#e08a1e', '#2f7d4f', '#2b5fa8', '#8a3fa0', '#b0476e', '#5b6b2e', '#1f8a8a'];
function catColor(c) { if (!c) return CAT_COLORS[0]; let h = 2166136261; for (const ch of c) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; } return CAT_COLORS[h % CAT_COLORS.length]; }
const starStr = n => n ? '★'.repeat(n) + '☆'.repeat(5 - n) : '';

/* 份量換算：把每行的第一個數字（含 1/2、1.5）乘上倍數 */
function fmtNum(x) {
  if (x >= 10) return String(Math.round(x));
  const r = Math.round(x * 10) / 10;
  const nice = { 0.3: '1/3', 0.5: '1/2', 0.7: '2/3', 0.8: '3/4', 0.2: '1/4' };
  if (r < 1 && nice[r]) return nice[r];
  return String(r);
}
function scaleLine(line, f) {
  if (f === 1) return line;
  return line.replace(/(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)/, m => {
    let v;
    if (/\s/.test(m)) { const [w, fr] = m.split(/\s+/); const [a, b] = fr.split('/'); v = +w + a / b; }
    else if (m.includes('/')) { const [a, b] = m.split('/'); v = a / b; }
    else v = +m;
    return fmtNum(v * f);
  });
}

/* ---------- data: local cache + GitHub sync ---------- */
const CACHE_KEY = 'myrecipes.cache.v2';
const TOKEN_KEY = 'myrecipes.ghtoken';
const OLD_LOCAL = 'myrecipes.local.v1';
const ls = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); return true; } catch { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch {} }
};

function loadCache() {
  let c;
  try { c = JSON.parse(ls.get(CACHE_KEY) || 'null'); } catch {}
  if (!c || !Array.isArray(c.recipes)) c = { recipes: [], deleted: {}, sha: null, dirty: false, msgs: [], lastSync: 0 };
  // 從舊版本機資料搬過來
  try {
    const old = JSON.parse(ls.get(OLD_LOCAL) || '[]');
    if (old.length) { c = mergeData(c, { recipes: old, deleted: {} }); c.dirty = true; ls.del(OLD_LOCAL); }
  } catch {}
  c.deleted = c.deleted || {}; c.msgs = c.msgs || [];
  return c;
}
let cache = loadCache();
let token = ls.get(TOKEN_KEY) || '';

const state = {
  recipes: [], loaded: true,
  sync: 'idle', // idle | syncing | ok | offline | error
  syncErr: '',
  q: '', cat: '全部', flag: 'all',
  scale: {}, checked: {}, done: {}
};
state.recipes = cache.recipes;

function persist() {
  if (!ls.set(CACHE_KEY, JSON.stringify(cache))) toast('無法儲存到這台裝置');
  state.recipes = cache.recipes;
}

/* 合併兩份資料：同一道菜取較新的；刪除紀錄比修改新就刪掉 */
function mergeData(a, b) {
  const deleted = { ...(a.deleted || {}) };
  for (const [id, t] of Object.entries(b.deleted || {})) deleted[id] = Math.max(deleted[id] || 0, t);
  const map = new Map();
  for (const r of [...(a.recipes || []), ...(b.recipes || [])]) {
    const cur = map.get(r.id);
    if (!cur || (r.updated || 0) > (cur.updated || 0)) map.set(r.id, r);
  }
  const recipes = [...map.values()].filter(r => !(deleted[r.id] >= (r.updated || 0)));
  return { ...a, recipes, deleted };
}

function change(msg, fn) {
  fn();
  cache.dirty = true;
  cache.msgs.push(msg);
  persist(); render(); scheduleSync(1200);
}
const store = {
  save(r) {
    const isNew = !cache.recipes.some(x => x.id === r.id);
    change(`${isNew ? '新增' : '更新'}：${r.title}`, () => {
      cache.recipes = cache.recipes.filter(x => x.id !== r.id).concat(r);
      delete cache.deleted[r.id];
    });
  },
  remove(id) {
    const r = cache.recipes.find(x => x.id === id);
    change(`刪除：${r ? r.title : id}`, () => {
      cache.recipes = cache.recipes.filter(x => x.id !== id);
      cache.deleted[id] = Date.now();
    });
  },
  bulk(list) {
    change(`匯入 ${list.length} 道食譜`, () => {
      const map = new Map(cache.recipes.map(x => [x.id, x]));
      list.forEach(r => { map.set(r.id, r); delete cache.deleted[r.id]; });
      cache.recipes = [...map.values()];
    });
  }
};

/* ---------- GitHub API ---------- */
const enc = s => { const b = new TextEncoder().encode(s); let out = ''; for (let i = 0; i < b.length; i += 0x8000) out += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(out); };
const dec = b64 => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g, '')), c => c.charCodeAt(0)));
class GhError extends Error { constructor(status, msg) { super(msg); this.status = status; } }

async function gh(path, opts = {}, tk = token) {
  const res = await fetch('https://api.github.com' + path, {
    ...opts, cache: 'no-store',
    headers: { Authorization: 'Bearer ' + tk, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(opts.body ? { 'Content-Type': 'application/json' } : {}) }
  });
  if (!res.ok) { let m = ''; try { m = (await res.json()).message; } catch {} throw new GhError(res.status, m); }
  return res.status === 204 ? null : res.json();
}
const repoPath = `/repos/${GH.owner}/${GH.repo}`;
const filePath = `${repoPath}/contents/${GH.path.split('/').map(encodeURIComponent).join('/')}`;

async function pull() {
  try {
    const f = await gh(`${filePath}?ref=${encodeURIComponent(GH.branch)}`);
    let text = f.content ? dec(f.content) : '';
    if (!text && f.size > 0) text = dec((await gh(`${repoPath}/git/blobs/${f.sha}`)).content);
    const j = text.trim() ? JSON.parse(text) : {};
    return { recipes: (j.recipes || []).filter(r => r && r.title).map(normalize), deleted: j.deleted || {}, sha: f.sha };
  } catch (e) {
    if (e.status === 404) {
      // 檔案還不存在（repo 是空的）就當作空資料；repo 本身不存在才是錯誤
      await gh(repoPath);
      return { recipes: [], deleted: {}, sha: null };
    }
    throw e;
  }
}

async function push(data, sha, msgs) {
  const sorted = [...data.recipes].sort((a, b) => (a.created || 0) - (b.created || 0));
  const body = JSON.stringify({ app: 'my-recipes', version: 2, recipes: sorted, deleted: data.deleted }, null, 2) + '\n';
  const uniq = [...new Set(msgs)];
  const message = uniq.length === 1 ? uniq[0] : uniq.length ? `更新 ${uniq.length} 項：${uniq.slice(0, 3).join('、')}${uniq.length > 3 ? '…' : ''}` : '同步食譜';
  const res = await gh(filePath, { method: 'PUT', body: JSON.stringify({ message, content: enc(body), branch: GH.branch, ...(sha ? { sha } : {}) }) });
  return res.content.sha;
}

let syncTimer, syncing = false, again = false;
function scheduleSync(ms = 0) { clearTimeout(syncTimer); syncTimer = setTimeout(sync, ms); }

async function sync() {
  if (!token) { setSync('idle'); return; }
  if (!navigator.onLine) { setSync('offline'); return; }
  if (syncing) { again = true; return; }
  syncing = true; setSync('syncing');
  try {
    for (let attempt = 0; attempt < 4; attempt++) {
      const remote = await pull();
      if (!cache.dirty) {
        if (remote.sha !== cache.sha) { cache = { ...cache, recipes: remote.recipes, deleted: remote.deleted, sha: remote.sha }; persist(); render(); }
        break;
      }
      const merged = mergeData({ recipes: cache.recipes, deleted: cache.deleted }, remote);
      const msgs = cache.msgs.slice();
      try {
        const sha = await push(merged, remote.sha, msgs);
        const grew = cache.msgs.length > msgs.length; // 上傳期間又有修改
        const base = grew ? mergeData(merged, { recipes: cache.recipes, deleted: cache.deleted }) : merged;
        cache = { ...cache, recipes: base.recipes, deleted: base.deleted, sha, dirty: grew, msgs: cache.msgs.slice(msgs.length) };
        persist(); render();
        if (!cache.dirty) break;
      } catch (e) {
        if (e.status === 409 || e.status === 422) continue; // 別台裝置剛好也改了：重新讀取後再合併
        throw e;
      }
    }
    cache.lastSync = Date.now(); persist();
    setSync('ok');
  } catch (e) {
    console.error(e);
    if (!navigator.onLine || e instanceof TypeError) setSync('offline');
    else setSync('error', ghMessage(e));
  } finally {
    syncing = false;
    if (again) { again = false; scheduleSync(300); }
  }
}

function ghMessage(e) {
  if (e.status === 401) return '金鑰無效或已過期，請重新設定';
  if (e.status === 403) return e.message?.includes('rate limit') ? 'GitHub 請求太頻繁，稍後再試' : '金鑰沒有寫入權限（Contents 要設成 Read and write）';
  if (e.status === 404) return `找不到 ${GH.owner}/${GH.repo}，或金鑰沒有這個 repo 的權限`;
  return `同步失敗（${e.status || '網路'}）${e.message ? '：' + e.message : ''}`;
}

function setSync(s, err = '') {
  state.sync = s; state.syncErr = err;
  const b = $('#syncBtn'), t = $('#syncText');
  b.classList.remove('on', 'off');
  if (!token) { t.textContent = '連接 GitHub 以同步'; return; }
  if (s === 'syncing') { b.classList.add('on'); t.textContent = '同步中…'; }
  else if (s === 'ok') { b.classList.add('on'); t.textContent = cache.dirty ? '等待同步' : '已同步'; }
  else if (s === 'offline') { b.classList.add('off'); t.textContent = '離線・稍後同步'; }
  else if (s === 'error') { b.classList.add('off'); t.textContent = '同步失敗'; }
  else t.textContent = '已連接';
}
addEventListener('online', () => scheduleSync(0));
addEventListener('offline', () => setSync('offline'));
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') scheduleSync(0); });
setInterval(() => { if (document.visibilityState === 'visible' && token) scheduleSync(0); }, 60000);

/* ---------- sheet (dialog) ---------- */
const sheet = $('#sheet'), sheetBody = $('#sheetBody');
function openSheet(html, bind) { sheetBody.innerHTML = html; bind && bind(sheetBody); if (!sheet.open) sheet.showModal(); }
function closeSheet() { if (sheet.open) sheet.close(); }
sheet.addEventListener('click', e => { if (e.target === sheet) closeSheet(); });

function confirmSheet(title, msg, okText, onOk) {
  openSheet(`<h2>${esc(title)}</h2><p>${esc(msg)}</p>
    <div class="row"><button class="btn danger" data-ok>${esc(okText)}</button><button class="btn ghost" data-x>取消</button></div>`, el => {
    el.querySelector('[data-ok]').onclick = () => { closeSheet(); onOk(); };
    el.querySelector('[data-x]').onclick = closeSheet;
  });
}

function timeAgo(t) {
  if (!t) return '還沒同步過';
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 60) return '剛剛';
  if (s < 3600) return `${Math.floor(s / 60)} 分鐘前`;
  if (s < 86400) return `${Math.floor(s / 3600)} 小時前`;
  return new Date(t).toLocaleString('zh-TW');
}

const TOKEN_URL = 'https://github.com/settings/personal-access-tokens/new';
function accountSheet() {
  const backup = `<hr><h2>備份</h2><p>把所有食譜存成一個檔案，或從備份檔還原。</p>
    <div class="row"><button class="btn" data-exp>匯出備份</button><button class="btn" data-imp>從備份匯入</button></div>`;
  const bindBackup = el => { el.querySelector('[data-exp]').onclick = exportJSON; el.querySelector('[data-imp]').onclick = () => $('#importFile').click(); };
  const repoUrl = `https://github.com/${GH.owner}/${GH.repo}`;

  if (token) {
    return openSheet(`<h2>GitHub 同步</h2>
      <p>食譜存在 <a href="${esc(repoUrl)}" target="_blank" rel="noopener">${esc(GH.owner)}/${esc(GH.repo)}</a>。每次修改都會留下紀錄，可以在 GitHub 上查看或還原。</p>
      <p>上次同步：${esc(timeAgo(cache.lastSync))}${cache.dirty ? '・有修改還沒上傳' : ''}</p>
      ${state.sync === 'error' ? `<p style="color:var(--red-ink)">${esc(state.syncErr)}</p>` : ''}
      <div class="row"><button class="btn primary" data-now>立即同步</button><button class="btn" data-off>中斷這台裝置的連接</button></div>
      ${backup}
      <div class="row"><button class="btn ghost" data-x>關閉</button></div>`, el => {
      bindBackup(el);
      el.querySelector('[data-now]').onclick = () => { closeSheet(); scheduleSync(0); };
      el.querySelector('[data-off]').onclick = () => confirmSheet('中斷這台裝置？', '會移除這台裝置上的金鑰。食譜還是留在 GitHub 上，重新貼上金鑰就能恢復同步。', '中斷連接', () => { token = ''; ls.del(TOKEN_KEY); setSync('idle'); toast('已中斷連接'); });
      el.querySelector('[data-x]').onclick = closeSheet;
    });
  }
  openSheet(`<h2>連接 GitHub</h2>
    <p>貼上 GitHub 金鑰後，這台裝置的食譜會和 <b>${esc(GH.owner)}/${esc(GH.repo)}</b> 同步。每台裝置只需要設定一次。</p>
    <ol style="margin:0;padding-left:1.3em;color:var(--muted)">
      <li>打開 <a href="${TOKEN_URL}" target="_blank" rel="noopener">GitHub 金鑰設定頁</a></li>
      <li>Token name 隨意填，Expiration 選長一點</li>
      <li>Repository access 選「Only select repositories」→ 選 <b>${esc(GH.repo)}</b></li>
      <li>Permissions → Repository permissions → <b>Contents</b> 設成 <b>Read and write</b></li>
      <li>按 Generate token，複製後貼到下面</li>
    </ol>
    <form class="field" data-form style="gap:10px">
      <input name="tk" type="password" placeholder="github_pat_…" autocomplete="off" spellcheck="false" required>
      <div class="row"><button class="btn primary">連接</button><button class="btn ghost" type="button" data-x>先不要</button></div>
      <p data-msg></p>
    </form>
    ${backup}`, el => {
    bindBackup(el);
    const f = el.querySelector('[data-form]'), msg = el.querySelector('[data-msg]');
    el.querySelector('[data-x]').onclick = closeSheet;
    f.onsubmit = async e => {
      e.preventDefault();
      const tk = f.tk.value.trim();
      if (!tk) return;
      msg.textContent = '檢查中…';
      try {
        const repo = await gh(repoPath, {}, tk);
        if (repo.permissions && !repo.permissions.push) throw new GhError(403, '');
        token = tk; ls.set(TOKEN_KEY, tk);
        if (cache.recipes.length) cache.dirty = true;
        closeSheet(); toast('已連接 GitHub'); scheduleSync(0);
      } catch (err) {
        msg.textContent = err instanceof GhError ? ghMessage(err) : '連不上 GitHub，請檢查網路';
        msg.style.color = 'var(--red-ink)';
      }
    };
  });
}
$('#syncBtn').onclick = accountSheet;

/* ---------- backup ---------- */
function exportJSON() {
  const data = JSON.stringify({ app: 'my-recipes', version: 1, exported: new Date().toISOString(), recipes: state.recipes }, null, 2);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
  a.download = `食譜備份-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  toast(`已匯出 ${state.recipes.length} 道食譜`);
}
$('#importFile').addEventListener('change', async e => {
  const file = e.target.files[0]; e.target.value = '';
  if (!file) return;
  try {
    const j = JSON.parse(await file.text());
    const list = (Array.isArray(j) ? j : j.recipes || []).filter(r => r && typeof r.title === 'string').map(normalize);
    if (!list.length) return toast('檔案裡沒有找到食譜');
    await store.bulk(list); closeSheet(); toast(`已匯入 ${list.length} 道食譜`);
  } catch { toast('無法讀取這個檔案'); }
});

function normalize(r) {
  const arr = v => Array.isArray(v) ? v.map(String) : lines(v);
  return {
    id: typeof r.id === 'string' && /^[\w-]{1,60}$/.test(r.id) ? r.id : uid(),
    title: String(r.title).slice(0, 120), category: String(r.category || ''), time: +r.time || 0,
    servings: +r.servings || 0, ingredients: arr(r.ingredients), steps: arr(r.steps), notes: String(r.notes || ''),
    tags: arr(r.tags).length ? arr(r.tags) : [], source: safeUrl(r.source), rating: Math.min(5, Math.max(0, +r.rating || 0)),
    status: r.status === 'made' ? 'made' : 'want', fav: !!r.fav, created: +r.created || Date.now(), updated: +r.updated || Date.now()
  };
}

/* ---------- views ---------- */
function route() {
  const h = location.hash.replace(/^#\/?/, '');
  const [view, id] = h.split('/');
  return { view: view || 'list', id: id ? decodeURIComponent(id) : '' };
}
function render() {
  const { view, id } = route();
  $('#fab').hidden = view !== 'list';
  if (!state.loaded) { app.innerHTML = `<p class="count">載入中…</p>`; return; }
  if (view === 'r') return renderDetail(id);
  if (view === 'new') return renderForm(null);
  if (view === 'edit') return renderForm(state.recipes.find(r => r.id === id));
  renderList();
}
addEventListener('hashchange', () => { render(); scrollTo(0, 0); });

function renderList() {
  const cats = [...new Set(state.recipes.map(r => r.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'zh-Hant'));
  if (state.cat !== '全部' && !cats.includes(state.cat)) state.cat = '全部';
  const q = state.q.trim().toLowerCase();
  const list = state.recipes.filter(r => {
    if (state.cat !== '全部' && r.category !== state.cat) return false;
    if (state.flag === 'fav' && !r.fav) return false;
    if (state.flag === 'made' && r.status !== 'made') return false;
    if (state.flag === 'want' && r.status === 'made') return false;
    if (!q) return true;
    return [r.title, r.category, ...(r.tags || []), ...(r.ingredients || []), r.notes].join(' ').toLowerCase().includes(q);
  }).sort((a, b) => (b.fav - a.fav) || (b.updated || 0) - (a.updated || 0));

  if (!state.recipes.length) {
    app.innerHTML = `<div class="empty"><h2>食譜本還是空的</h2>
      <p>按下方「新增食譜」寫下第一道菜，或先放幾道範例看看。</p>
      <div class="row" style="justify-content:center"><a class="btn primary" href="#/new">新增食譜</a><button class="btn" id="demo">加入 3 道範例</button></div></div>`;
    $('#demo').onclick = async () => { await store.bulk(SAMPLES.map(s => normalize({ ...s, id: uid() }))); toast('已加入範例食譜'); };
    return;
  }
  const chip = (label, on, attr) => `<button class="chip" aria-pressed="${on}" ${attr}>${esc(label)}</button>`;
  app.innerHTML = `
    <div class="tools">
      <input class="search" id="q" type="search" placeholder="搜尋菜名、食材、標籤…" value="${esc(state.q)}" autocomplete="off">
      <div class="chips" role="toolbar" aria-label="篩選">
        ${['全部', ...cats].map(c => chip(c, state.cat === c, `data-cat="${esc(c)}"`)).join('')}
        <span class="chip sep" aria-hidden="true"></span>
        ${[['fav', '★ 收藏'], ['made', '做過'], ['want', '想試試']].map(([k, l]) => chip(l, state.flag === k, `data-flag="${k}"`)).join('')}
      </div>
    </div>
    <p class="count">${list.length} 道食譜</p>
    <div class="grid">${list.map(card).join('') || '<p class="count">沒有符合條件的食譜。</p>'}</div>`;
  const qi = $('#q');
  qi.oninput = () => { state.q = qi.value; const pos = qi.selectionStart; renderList(); const n = $('#q'); n.focus(); n.setSelectionRange(pos, pos); };
  app.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => { state.cat = b.dataset.cat; renderList(); });
  app.querySelectorAll('[data-flag]').forEach(b => b.onclick = () => { state.flag = state.flag === b.dataset.flag ? 'all' : b.dataset.flag; renderList(); });
}

function card(r) {
  return `<a class="card" href="#/r/${encodeURIComponent(r.id)}" style="--cat:${catColor(r.category)}">
    ${r.fav ? '<span class="fav" aria-label="收藏">★</span>' : ''}
    <h3>${esc(r.title)}</h3>
    <div class="meta">
      ${r.category ? `<span>${esc(r.category)}</span>` : ''}
      ${r.time ? `<span>${esc(r.time)} 分鐘</span>` : ''}
      ${r.servings ? `<span>${esc(r.servings)} 人份</span>` : ''}
      ${r.rating ? `<span class="stars" aria-label="${r.rating} 顆星">${starStr(r.rating)}</span>` : ''}
    </div>
    <div class="tags">
      <span class="badge ${r.status === 'made' ? 'made' : ''}">${r.status === 'made' ? '做過' : '想試試'}</span>
      ${(r.tags || []).slice(0, 4).map(t => `<span class="tag">${esc(t)}</span>`).join('')}
    </div></a>`;
}

let wakeLock = null;
function renderDetail(id) {
  const r = state.recipes.find(x => x.id === id);
  if (!r) { app.innerHTML = `<a class="back" href="#/">← 全部食譜</a><div class="empty"><h2>找不到這道食譜</h2><p>可能已經被刪除了。</p></div>`; return; }
  const base = r.servings || 0;
  const cur = state.scale[id] || base || 1;
  const f = base ? cur / base : 1;
  const checked = state.checked[id] || (state.checked[id] = new Set());
  const done = state.done[id] || (state.done[id] = new Set());
  const src = safeUrl(r.source);
  app.innerHTML = `
    <a class="back" href="#/">← 全部食譜</a>
    <article class="recipe" style="--cat:${catColor(r.category)}">
      <h1>${esc(r.title)}</h1>
      <div class="meta">
        ${r.category ? `<span>${esc(r.category)}</span>` : ''}
        ${r.time ? `<span>${esc(r.time)} 分鐘</span>` : ''}
        ${(r.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('')}
      </div>
      <div class="ctrl">
        <button class="toggle" aria-pressed="${!!r.fav}" data-fav>${r.fav ? '★ 已收藏' : '☆ 收藏'}</button>
        <button class="toggle" aria-pressed="${r.status === 'made'}" data-made>${r.status === 'made' ? '✓ 做過' : '標記為做過'}</button>
        <span class="rate" role="group" aria-label="評分">${[1, 2, 3, 4, 5].map(n => `<button aria-label="${n} 顆星" class="${n <= (r.rating || 0) ? 'on' : ''}" data-rate="${n}">★</button>`).join('')}</span>
        ${'wakeLock' in navigator ? `<button class="toggle" aria-pressed="${!!wakeLock}" data-wake>${wakeLock ? '螢幕保持亮著' : '下廚模式：螢幕不關'}</button>` : ''}
      </div>
      <div class="cols">
        <section>
          <h2>食材 ${base ? `<span class="stepper"><button aria-label="減少份量" data-s="-1">−</button><output>${fmtNum(cur)} 人份</output><button aria-label="增加份量" data-s="1">＋</button></span>` : ''}</h2>
          ${r.ingredients?.length ? `<ul class="ing">${r.ingredients.map((l, i) => `<li><label><input type="checkbox" data-i="${i}" ${checked.has(i) ? 'checked' : ''}><span>${esc(scaleLine(l, f))}</span></label></li>`).join('')}</ul>` : '<p class="count">還沒有填食材。</p>'}
          ${base && f !== 1 ? `<p class="count" style="margin-top:8px">已依 ${fmtNum(cur)} 人份換算（原本 ${base} 人份）</p>` : ''}
        </section>
        <section>
          <h2>步驟</h2>
          ${r.steps?.length ? `<ol class="steps">${r.steps.map((s, i) => `<li data-step="${i}" class="${done.has(i) ? 'done' : ''}">${esc(s)}</li>`).join('')}</ol>` : '<p class="count">還沒有填步驟。</p>'}
        </section>
      </div>
      ${r.notes ? `<div class="notes"><b>筆記</b>${esc(r.notes)}</div>` : ''}
      ${src ? `<p class="count" style="margin-top:16px">來源：<a href="${esc(src)}" target="_blank" rel="noopener">${esc(new URL(src).hostname)}</a></p>` : ''}
      <div class="actions row">
        <a class="btn primary" href="#/edit/${encodeURIComponent(r.id)}">編輯</a>
        <button class="btn danger" data-del>刪除</button>
      </div>
    </article>`;
  const upd = patch => store.save({ ...r, ...patch, updated: Date.now() });
  app.querySelector('[data-fav]').onclick = () => upd({ fav: !r.fav });
  app.querySelector('[data-made]').onclick = () => upd({ status: r.status === 'made' ? 'want' : 'made' });
  app.querySelectorAll('[data-rate]').forEach(b => b.onclick = () => { const n = +b.dataset.rate; upd({ rating: n === r.rating ? 0 : n }); });
  app.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { state.scale[id] = Math.max(1, cur + +b.dataset.s); renderDetail(id); });
  app.querySelectorAll('[data-i]').forEach(c => c.onchange = () => { const i = +c.dataset.i; c.checked ? checked.add(i) : checked.delete(i); });
  app.querySelectorAll('[data-step]').forEach(li => li.onclick = () => { const i = +li.dataset.step; done.has(i) ? done.delete(i) : done.add(i); li.classList.toggle('done'); });
  const wk = app.querySelector('[data-wake]');
  if (wk) wk.onclick = async () => {
    try {
      if (wakeLock) { await wakeLock.release(); wakeLock = null; }
      else { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => { wakeLock = null; }); }
    } catch { toast('這個瀏覽器不支援保持螢幕亮著'); }
    renderDetail(id);
  };
  app.querySelector('[data-del]').onclick = () => confirmSheet('刪除這道食譜？', `「${r.title}」刪除後無法復原。`, '刪除', async () => { location.hash = '#/'; await store.remove(r.id); toast('已刪除'); });
}

function renderForm(r) {
  const isNew = !r;
  if (route().view === 'edit' && !r) { app.innerHTML = `<a class="back" href="#/">← 全部食譜</a><div class="empty"><h2>找不到這道食譜</h2></div>`; return; }
  r = r || { title: '', category: '', time: '', servings: '', ingredients: [], steps: [], notes: '', tags: [], source: '', status: 'want', fav: false };
  const cats = [...new Set(state.recipes.map(x => x.category).filter(Boolean))];
  app.innerHTML = `
    <a class="back" href="${isNew ? '#/' : '#/r/' + encodeURIComponent(r.id)}">← ${isNew ? '全部食譜' : '回到食譜'}</a>
    <form class="form" id="f" novalidate>
      <h1>${isNew ? '新增食譜' : '編輯食譜'}</h1>
      <label class="field"><span>菜名</span><input name="title" required value="${esc(r.title)}" placeholder="例如：番茄炒蛋"></label>
      <div class="two">
        <label class="field"><span>分類</span><input name="category" list="cats" value="${esc(r.category)}" placeholder="家常菜、湯、甜點…"><datalist id="cats">${cats.map(c => `<option value="${esc(c)}">`).join('')}</datalist></label>
        <label class="field"><span>時間（分鐘）</span><input name="time" type="number" inputmode="numeric" min="0" value="${esc(r.time || '')}"></label>
        <label class="field"><span>份量（人份）</span><input name="servings" type="number" inputmode="numeric" min="0" value="${esc(r.servings || '')}"></label>
      </div>
      <label class="field"><span>食材</span><small>一行一樣。數字寫在前面或後面都可以，調整份量時會自動換算，例如「雞腿肉 300 g」。</small>
        <textarea name="ingredients" placeholder="雞蛋 3 顆&#10;番茄 2 顆&#10;糖 1/2 小匙">${esc((r.ingredients || []).join('\n'))}</textarea></label>
      <label class="field"><span>步驟</span><small>一行一個步驟。</small>
        <textarea name="steps" placeholder="番茄切塊，蛋打散。&#10;先炒蛋到半熟盛起。">${esc((r.steps || []).join('\n'))}</textarea></label>
      <label class="field"><span>筆記</span><textarea name="notes" style="min-height:90px" placeholder="糖減一半剛好、下次多放蒜…">${esc(r.notes)}</textarea></label>
      <div class="two">
        <label class="field"><span>標籤</span><input name="tags" value="${esc((r.tags || []).join('、'))}" placeholder="快速、下飯（用頓號或逗號分開）"></label>
        <label class="field"><span>來源網址</span><input name="source" type="url" inputmode="url" value="${esc(r.source)}" placeholder="https://"></label>
      </div>
      <div class="row">
        <label class="check"><input type="checkbox" name="made" ${r.status === 'made' ? 'checked' : ''}> 做過了</label>
        <label class="check"><input type="checkbox" name="fav" ${r.fav ? 'checked' : ''}> 收藏</label>
      </div>
      <div class="row"><button class="btn primary" type="submit">儲存</button><a class="btn ghost" href="${isNew ? '#/' : '#/r/' + encodeURIComponent(r.id)}">取消</a></div>
    </form>`;
  const f = $('#f');
  if (isNew) f.title.focus();
  f.onsubmit = async e => {
    e.preventDefault();
    const title = f.title.value.trim();
    if (!title) { f.title.focus(); return toast('請填菜名'); }
    const rec = normalize({
      ...r, id: r.id || uid(), title, category: f.category.value.trim(), time: f.time.value, servings: f.servings.value,
      ingredients: lines(f.ingredients.value), steps: lines(f.steps.value), notes: f.notes.value.trim(),
      tags: f.tags.value.split(/[,，、]/).map(s => s.trim()).filter(Boolean), source: f.source.value.trim(),
      status: f.made.checked ? 'made' : 'want', fav: f.fav.checked, created: r.created || Date.now(), updated: Date.now()
    });
    location.hash = '#/r/' + encodeURIComponent(rec.id);
    store.save(rec);
    toast('已儲存');
  };
}

const SAMPLES = [
  { title: '番茄炒蛋', category: '家常菜', time: 15, servings: 2, tags: ['快速', '下飯'], status: 'made', fav: true, rating: 5,
    ingredients: ['雞蛋 3 顆', '番茄 2 顆', '蔥 1 根', '糖 1 小匙', '鹽 1/2 小匙', '油 2 大匙'],
    steps: ['番茄切塊，蔥切段，蛋加一點鹽打散。', '熱油，倒入蛋液炒到半熟就盛起。', '原鍋炒番茄到出汁，加糖和鹽。', '倒回炒蛋，加蔥段拌勻就完成。'],
    notes: '番茄先燙一下去皮，口感更滑。' },
  { title: '三杯雞', category: '家常菜', time: 35, servings: 3, tags: ['台式', '下飯'], status: 'want', rating: 0,
    ingredients: ['雞腿肉 600 g', '麻油 3 大匙', '米酒 3 大匙', '醬油 3 大匙', '冰糖 1 大匙', '老薑 1 塊', '蒜頭 10 瓣', '九層塔 1 把'],
    steps: ['雞腿切塊，薑切片。', '麻油小火把薑片煸到捲曲，加入蒜頭炒香。', '放入雞肉炒到表面變色。', '加米酒、醬油、冰糖，蓋鍋小火燜 15 分鐘。', '開蓋收汁，起鍋前放九層塔拌一下。'] },
  { title: '紅豆湯', category: '甜點', time: 90, servings: 4, tags: ['冬天'], status: 'want',
    ingredients: ['紅豆 200 g', '水 1500 ml', '二砂糖 80 g', '鹽 1 小撮'],
    steps: ['紅豆洗淨，泡水 4 小時以上。', '倒掉泡豆水，加新的水煮滾後轉小火 60 分鐘。', '豆子煮開花後加糖和鹽，再煮 10 分鐘。'],
    notes: '用電鍋的話：外鍋 2 杯水跳起後燜 30 分鐘，再加糖。' }
];

/* ---------- start ---------- */
setSync('idle');
render();
if (token) scheduleSync(0);
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
