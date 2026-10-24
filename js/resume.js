// A round in progress, so a child who leaves mid-round (✖, a phone call, closing the app) picks it up where
// they left off. Kept on this phone only, in its own key: the saved game and family sync never see it.
// If it can't be read or is too old, the round simply starts fresh.
// Stored as { playerId: { roundKey: round } }, the latest few rounds per player.
const KEY = 'math-wonderland-round-v1';
const MAX_AGE = 2 * 24 * 3600 * 1000;
const PER_PLAYER = 3;
const MAX_SIZE = 400000; // all rounds together, in characters: the oldest give way past this

let rounds = {};
try { rounds = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { rounds = {}; }
if (typeof rounds !== 'object' || Array.isArray(rounds)) rounds = {};

// Out of room: older rounds give way to the one just played, and if even that doesn't fit, rounds aren't kept.
// The saved game never gives way for them (and progress.js clears them if it needs the room).
function write(pid, key) {
  let data = JSON.stringify(rounds);
  // Over the size cap: drop the oldest rounds of anyone (never the one just played).
  if (data.length > MAX_SIZE) {
    const all = Object.entries(rounds).flatMap(([id, m]) => Object.keys(m).map(k => [id, k, m[k].t])).sort((a, b) => a[2] - b[2]);
    for (const [id, k] of all) {
      if (data.length <= MAX_SIZE) break;
      if (id === pid && k === key) continue;
      delete rounds[id][k];
      if (!Object.keys(rounds[id]).length) delete rounds[id];
      data = JSON.stringify(rounds);
    }
  }
  try { localStorage.setItem(KEY, data); return; } catch (e) { /* full, or storage blocked */ }
  const r = pid && rounds[pid]?.[key];
  rounds = r ? { [pid]: { [key]: r } } : {};
  try { localStorage.setItem(KEY, JSON.stringify(rounds)); } catch (e) {
    rounds = {};
    try { localStorage.removeItem(KEY); } catch (e2) { /* storage blocked */ }
  }
}

// Which round this is: a stage's normal round or skip test, a world's boss, or the placement quest.
export const roundKey = (mode, stage, world) => (mode === 'boss' ? 'boss:' + world.id : mode === 'placement' ? 'placement' : mode + ':' + stage.id);

const live = r => r && r.v === 1 && Date.now() - r.t >= 0 && Date.now() - r.t < MAX_AGE;

// The saved round for this player, if they left this one and it is still fresh. A copy, so playing it doesn't change it.
export function peek(pid, key) {
  const r = rounds[pid]?.[key];
  return live(r) ? JSON.parse(JSON.stringify(r)) : null;
}

export function keep(pid, key, data) {
  const mine = rounds[pid] && typeof rounds[pid] === 'object' ? rounds[pid] : {};
  mine[key] = JSON.parse(JSON.stringify({ v: 1, t: Date.now(), ...data })); // a copy: the round goes on changing its own
  // Only the latest few: the oldest round left half-played gives way.
  Object.keys(mine).sort((a, b) => mine[b].t - mine[a].t).slice(PER_PLAYER).forEach(k => delete mine[k]);
  rounds[pid] = mine;
  write(pid, key);
}

export function drop(pid, key) {
  if (!rounds[pid]?.[key]) return;
  delete rounds[pid][key];
  if (!Object.keys(rounds[pid]).length) delete rounds[pid];
  write();
}

// Forget rounds of players no longer on this phone, and stale ones.
export function prune(ids) {
  let changed = false;
  for (const id of Object.keys(rounds)) {
    const mine = rounds[id];
    if (!ids.includes(id) || !mine || typeof mine !== 'object') { delete rounds[id]; changed = true; continue; }
    for (const k of Object.keys(mine)) if (!live(mine[k])) { delete mine[k]; changed = true; }
    if (!Object.keys(mine).length) { delete rounds[id]; changed = true; }
  }
  if (changed) write();
  const gone = Object.keys(recentQs).filter(id => !ids.includes(id));
  gone.forEach(id => delete recentQs[id]);
  if (gone.length) saveRecent();
}

// For the quota guard in progress.js: free the room rounds take.
export function clearAll() {
  rounds = {};
  recentQs = {};
  try { localStorage.removeItem(KEY); localStorage.removeItem(RECENT_KEY); } catch (e) { /* storage blocked */ }
}

// The player's last questions, so a new round (🔁 or the next day) doesn't open with the ones just played.
// Fingerprints only (js/fresh.js), in their own key, on this phone only. Losing them only means less variety.
const RECENT_KEY = 'math-wonderland-recent-v1';
const RECENT = 30;
let recentQs = {};
try { recentQs = JSON.parse(localStorage.getItem(RECENT_KEY)) || {}; } catch (e) { recentQs = {}; }
if (typeof recentQs !== 'object' || Array.isArray(recentQs)) recentQs = {};
const saveRecent = () => { try { localStorage.setItem(RECENT_KEY, JSON.stringify(recentQs)); } catch (e) { /* full, or storage blocked */ } };

export const recent = pid => (Array.isArray(recentQs[pid]) ? recentQs[pid] : []);
export function asked(pid, key) {
  if (!pid) return;
  recentQs[pid] = [...recent(pid).filter(k => k !== key), key].slice(-RECENT);
  saveRecent();
}
