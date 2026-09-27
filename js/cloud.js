// Family sync: players are shared between devices that enter the same family code.
// Uses Firebase (anonymous sign-in + Firestore) through its REST API, so no SDK is loaded.
// The game never waits on this: local saves are the truth, and sync merges in the background.
import { FIREBASE } from './cloud-config.js';
import * as P from './progress.js';

const LS = 'math-wonderland-cloud';
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O, 1/I/L
const CODE_LEN = 10;

let cfg = {};
try { cfg = JSON.parse(localStorage.getItem(LS)) || {}; } catch (e) { /* storage blocked */ }
const store = () => { try { localStorage.setItem(LS, JSON.stringify(cfg)); } catch (e) { /* storage blocked */ } };

export const configured = () => !!(FIREBASE && FIREBASE.apiKey && FIREBASE.projectId);
export const family = () => cfg.family || null;
export const lastSync = () => cfg.last || 0;
export let lastError = '';

const changeFns = [];
export const onRemoteChange = fn => changeFns.push(fn);

export const formatCode = c => c.replace(/(.{4})(.{3})(.{3})/, '$1-$2-$3');
export const cleanCode = c => String(c).toUpperCase().replace(/[^A-Z0-9]/g, '');

// One quiet retry on a network hiccup before giving up until the next sync.
async function fetch(url, opts) {
  try { return await window.fetch(url, opts); } catch (e) {
    await new Promise(r => setTimeout(r, 1500));
    return window.fetch(url, opts);
  }
}

// ---------- auth ----------
async function token() {
  if (cfg.idToken && cfg.exp > Date.now() + 60000) return cfg.idToken;
  const key = FIREBASE.apiKey;
  let r;
  if (cfg.refresh) {
    r = await fetch(`https://securetoken.googleapis.com/v1/token?key=${key}`, {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(cfg.refresh)}`,
    });
    if (r.ok) {
      const j = await r.json();
      Object.assign(cfg, { idToken: j.id_token, refresh: j.refresh_token, exp: Date.now() + j.expires_in * 1000 });
      store();
      return cfg.idToken;
    }
  }
  r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${key}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ returnSecureToken: true }),
  });
  if (!r.ok) throw new Error('sign-in ' + r.status);
  const j = await r.json();
  Object.assign(cfg, { idToken: j.idToken, refresh: j.refreshToken, exp: Date.now() + j.expiresIn * 1000 });
  store();
  return cfg.idToken;
}

// ---------- Firestore: one document per family, one string field per player ----------
const docUrl = code => `https://firestore.googleapis.com/v1/projects/${FIREBASE.projectId}/databases/(default)/documents/families/${code}`;

async function readFamily(code) {
  const r = await fetch(docUrl(code), { headers: { Authorization: 'Bearer ' + await token() } });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error('read ' + r.status);
  const j = await r.json();
  const out = {};
  for (const [k, v] of Object.entries(j.fields || {})) {
    if (!k.startsWith('p_')) continue;
    try { out[k.slice(2)] = JSON.parse(v.stringValue); } catch (e) { /* skip a broken entry */ }
  }
  return out;
}

async function writePlayers(code, entries) {
  if (!entries.length) return;
  const mask = entries.map(([id]) => 'updateMask.fieldPaths=p_' + id).join('&');
  const fields = { v: { integerValue: '1' } };
  for (const [id, val] of entries) fields['p_' + id] = { stringValue: JSON.stringify(val) };
  const r = await fetch(docUrl(code) + '?updateMask.fieldPaths=v&' + mask, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer ' + await token(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });
  if (!r.ok) throw new Error('write ' + r.status);
}

// ---------- merging ----------
// The newer copy wins, but nothing a child earned is lost: stars, stickers, hats and trophies
// from either copy are kept.
function mergeProfiles(a, b) {
  const [newer, older] = (a.updated || 0) >= (b.updated || 0) ? [a, b] : [b, a];
  const m = JSON.parse(JSON.stringify(newer));
  for (const [id, r] of Object.entries(older.stages || {})) {
    const n = (m.stages[id] ||= { stars: 0, demo: false, plays: 0 });
    n.stars = Math.max(n.stars || 0, r.stars || 0);
    n.demo = n.demo || r.demo;
    n.plays = Math.max(n.plays || 0, r.plays || 0);
  }
  m.stickers = [...new Set([...(m.stickers || []), ...(older.stickers || [])])];
  m.hats = [...new Set([...(m.hats || []), ...(older.hats || [])])];
  m.bossMeadow = !!(m.bossMeadow || older.bossMeadow);
  return m;
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Replace a player's contents in place, so screens holding the object see the new data.
function replaceInPlace(target, src) {
  for (const k of Object.keys(target)) delete target[k];
  Object.assign(target, src);
}

// A child added separately on two devices (same animal and name) becomes one player.
// Every device picks the same survivor (the smallest id), so they all end up agreeing.
const twinKey = p => (p.name ? p.avatar + '|' + p.name.trim().toLowerCase() : null);
function mergeTwins(st) {
  const groups = {};
  for (const p of st.profiles) { const k = twinKey(p); if (k) (groups[k] ||= []).push(p); }
  let changed = false;
  for (const g of Object.values(groups)) {
    if (g.length < 2) continue;
    g.sort((a, b) => (a.id < b.id ? -1 : 1));
    const keep = g[0];
    let m = keep;
    for (const other of g.slice(1)) {
      m = mergeProfiles(m, other);
      st.deleted[other.id] = Date.now();
      if (st.current === other.id) st.current = keep.id;
    }
    m.id = keep.id;
    m.updated = Math.max(...g.map(p => p.updated || 0));
    replaceInPlace(keep, m);
    st.profiles = st.profiles.filter(p => p === keep || !g.includes(p));
    changed = true;
  }
  return changed;
}

let running = null;
export function sync() {
  if (!configured() || !family()) return Promise.resolve(false);
  if (running) return running;
  running = doSync().finally(() => { running = null; });
  return running;
}

async function doSync() {
  const code = family();
  const st = P.state;
  st.deleted ||= {};
  let changed = false;
  try {
    const remote = (await readFamily(code)) || {};
    for (const [id, r] of Object.entries(remote)) {
      const local = st.profiles.find(p => p.id === id);
      const tomb = st.deleted[id];
      if (r.deleted) {
        if (local && (local.updated || 0) <= r.updated) {
          st.profiles = st.profiles.filter(p => p.id !== id);
          if (st.current === id) st.current = null;
          changed = true;
        }
        if (!tomb || tomb < r.updated) st.deleted[id] = r.updated;
        continue;
      }
      if (tomb && tomb >= (r.updated || 0)) continue;
      if (!local) { st.profiles.push(r); changed = true; continue; }
      const m = mergeProfiles(local, r);
      if (!same(m, local)) { replaceInPlace(local, m); changed = true; }
    }
    if (mergeTwins(st)) changed = true;
    // Send whatever the server doesn't have yet.
    const push = [];
    for (const p of st.profiles) if (!same(p, remote[p.id])) push.push([p.id, p]);
    for (const [id, t] of Object.entries(st.deleted)) {
      if (!remote[id]?.deleted && !st.profiles.some(p => p.id === id)) push.push([id, { deleted: true, updated: t }]);
    }
    await writePlayers(code, push);
    cfg.last = Date.now();
    store();
    lastError = '';
  } catch (e) {
    lastError = navigator.onLine === false ? 'offline' : String(e.message || e);
  }
  if (changed) { P.writeLocal(); changeFns.forEach(fn => fn()); }
  return changed;
}

// ---------- family code ----------
export function newCode() {
  const a = new Uint32Array(CODE_LEN);
  crypto.getRandomValues(a);
  return [...a].map(x => ALPHABET[x % ALPHABET.length]).join('');
}

export async function createFamily() {
  cfg.family = newCode();
  store();
  await sync();
  return cfg.family;
}

// Joining checks the code exists, so a typo doesn't start an empty family.
export async function joinFamily(input) {
  const code = cleanCode(input);
  if (code.length !== CODE_LEN) return 'short';
  let remote;
  try { remote = await readFamily(code); } catch (e) { return 'error'; }
  if (!remote) return 'missing';
  cfg.family = code;
  store();
  await sync();
  return 'ok';
}

export function leaveFamily() {
  delete cfg.family;
  delete cfg.last;
  store();
}

// Sync soon after each save, when the app comes back to the front, and every minute while open.
let timer = null;
P.onSave(() => { clearTimeout(timer); timer = setTimeout(sync, 3000); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) sync(); });
addEventListener('online', () => sync());
setInterval(() => { if (!document.hidden) sync(); }, 60000);
