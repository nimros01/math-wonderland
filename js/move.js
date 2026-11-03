// Moving house: the game moved from GitHub Pages to its own address. A browser keeps saves per
// address, so the old address packs this device's saves into the link and opens the new one, which
// takes them in before the game starts. Nothing is ever deleted at the old address, and the saves
// are carried on every visit, so a device that played offline there still brings its newest stars.
// Runs before js/main.js (see index.html); go() resolves to true when the game should start here.

export const NEW_HOME = ''; // the game's own address, e.g. 'https://example.com/'; empty = no move yet
const OLD_HOST = 'nimros01.github.io';

// Everything a device keeps. The family code and sign-in in -cloud work at any address.
const KEYS = ['math-wonderland-v1', 'math-wonderland-cloud', 'math-wonderland-country', 'math-wonderland-round-v1', 'math-wonderland-recent-v1'];
const PLAYERS = 'math-wonderland-v1';
export const PENDING = 'math-wonderland-move-pending'; // players to merge in when this address already has some (js/cloud.js)

const get = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const set = (k, v) => { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } };

// base64url of bytes, and back
const enc = bytes => { let s = ''; for (const b of bytes) s += String.fromCharCode(b); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const dec = str => { const s = atob(str.replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(s, c => c.charCodeAt(0)); };
const pipe = async (bytes, stream) => new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());

export async function pack(data) {
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  if (typeof CompressionStream === 'function') {
    try { return 'g' + enc(await pipe(bytes, new CompressionStream('gzip'))); } catch (e) { /* fall through */ }
  }
  return 'j' + enc(bytes);
}

export async function unpack(str) {
  const bytes = dec(str.slice(1));
  const json = str[0] === 'g' ? await pipe(bytes, new DecompressionStream('gzip')) : bytes;
  return JSON.parse(new TextDecoder().decode(json));
}

const hasPlayers = raw => { try { return (JSON.parse(raw)?.profiles || []).length > 0; } catch (e) { return false; } };

// At the new address: take in what the old one sent.
export function receive(data) {
  if (!data || typeof data !== 'object') return;
  const here = get(PLAYERS);
  if (!hasPlayers(here)) {
    // A fresh device here: copy everything exactly as it was.
    for (const k of KEYS) if (typeof data[k] === 'string' && (k === PLAYERS || get(k) == null)) set(k, data[k]);
    return;
  }
  // This device already plays here too: its other settings win, and players are merged by sync's rules.
  for (const k of KEYS) if (k !== PLAYERS && typeof data[k] === 'string' && get(k) == null) set(k, data[k]);
  if (typeof data[PLAYERS] === 'string' && hasPlayers(data[PLAYERS])) set(PENDING, data[PLAYERS]);
}

export async function go() {
  try {
    if (NEW_HOME && location.hostname === OLD_HOST) {
      // Offline, the new address can't open, so keep playing here; the saves travel on the next visit.
      if (navigator.onLine === false) return true;
      const data = {};
      for (const k of KEYS) { const v = get(k); if (v != null) data[k] = v; }
      const hash = Object.keys(data).length ? '#move=' + await pack(data) : '';
      location.replace(NEW_HOME + hash);
      return false;
    }
    const m = /^#move=([gj][A-Za-z0-9_-]+)$/.exec(location.hash);
    if (m) {
      history.replaceState(null, '', location.pathname + location.search);
      receive(await unpack(m[1]));
    }
  } catch (e) { /* a broken link never stops the game */ }
  return true;
}
