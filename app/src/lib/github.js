// GitHub storage (spec §1, §6). The data file lives in the private repo; covers are served with the app.
export const REPO = { owner: 'geniechang', repo: 'recipes-data', path: 'recipes.json', branch: 'main' };
const API = `https://api.github.com/repos/${REPO.owner}/${REPO.repo}/contents/${REPO.path}`;
export const HISTORY_URL = `https://github.com/${REPO.owner}/${REPO.repo}/commits/${REPO.branch}/${REPO.path}`;
export const TOKEN_URL = 'https://github.com/settings/personal-access-tokens/new';

export class GitHubError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function headers(token) {
  return { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
}

function decodeBase64Utf8(b64) {
  const bin = atob(b64.replace(/\n/g, ''));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
function encodeBase64Utf8(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

/** Expiry of a fine-grained token, if GitHub exposes it to the browser. */
function readExpiry(res) {
  const v = res.headers.get('github-authentication-token-expiration');
  if (!v) return null;
  const t = Date.parse(v.replace(' UTC', 'Z').replace(' ', 'T'));
  return Number.isFinite(t) ? t : null;
}

export async function fetchData(token) {
  const res = await fetch(`${API}?ref=${REPO.branch}`, { headers: headers(token), cache: 'no-store' });
  if (!res.ok) throw new GitHubError(res.status, `GitHub ${res.status}`);
  const body = await res.json();
  let text;
  if (body.content) text = decodeBase64Utf8(body.content);
  else {
    // Files over 1 MB come back without content; fetch the raw blob instead.
    const raw = await fetch(`${API}?ref=${REPO.branch}`, { headers: { ...headers(token), Accept: 'application/vnd.github.raw+json' }, cache: 'no-store' });
    if (!raw.ok) throw new GitHubError(raw.status, `GitHub ${raw.status}`);
    text = await raw.text();
  }
  return { data: JSON.parse(text), sha: body.sha, expiresAt: readExpiry(res) };
}

export async function putData(token, data, sha, message) {
  const res = await fetch(API, {
    method: 'PUT',
    headers: { ...headers(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, content: encodeBase64Utf8(JSON.stringify(data, null, 2) + '\n'), sha, branch: REPO.branch })
  });
  if (!res.ok) throw new GitHubError(res.status, `GitHub ${res.status}`);
  const body = await res.json();
  return body.content.sha;
}
