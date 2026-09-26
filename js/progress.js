// Saved game state, kept in this browser's localStorage.
const KEY = 'math-wonderland-v1';

function fresh() {
  return { v: 1, profiles: [], current: null, muted: false };
}

let saved = null;
try { saved = JSON.parse(localStorage.getItem(KEY)); } catch (e) { /* storage blocked */ }
export const state = saved && saved.v === 1 ? saved : fresh();

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage blocked */ }
}

export function me() {
  return state.profiles.find(p => p.id === state.current) || null;
}

export function addProfile(avatar) {
  const p = {
    id: Date.now().toString(36),
    avatar,
    gems: 0,
    pet: { kind: Math.floor(Math.random() * 3), stage: 0, xp: 0, hat: null },
    stages: {},
    stickers: [],
    hats: [],
    unlockAll: false,
  };
  state.profiles.push(p);
  state.current = p.id;
  save();
  return p;
}

export function removeProfile(id) {
  state.profiles = state.profiles.filter(p => p.id !== id);
  if (state.current === id) state.current = null;
  save();
}

export function stageRec(p, id) {
  if (!p.stages[id]) p.stages[id] = { stars: 0, demo: false, plays: 0 };
  return p.stages[id];
}

export function isUnlocked(p, stages, idx) {
  if (p.unlockAll || idx === 0) return true;
  return (p.stages[stages[idx - 1].id]?.stars || 0) > 0;
}

// Pet lines: egg, baby, young, grown. Growth comes from feeding with gems.
export const PETS = [
  ['🥚', '🦎', '🐊', '🐉'],
  ['🥚', '🐣', '🐥', '🦚'],
  ['🥚', '🐢', '🦕', '🦖'],
];
export const FEED_COST = 10;
const GROW_AT = [0, 0, 6, 20]; // feeds needed to reach stage 2 and 3

export function petEmoji(p) {
  return PETS[p.pet.kind][p.pet.stage];
}

export function hatch(p) {
  if (p.pet.stage === 0) { p.pet.stage = 1; return true; }
  return false;
}

// Returns true when the pet grows to its next form.
export function feed(p) {
  if (p.gems < FEED_COST || p.pet.stage === 0) return false;
  p.gems -= FEED_COST;
  p.pet.xp += 1;
  const next = p.pet.stage + 1;
  if (next <= 3 && p.pet.xp >= GROW_AT[next]) { p.pet.stage = next; return true; }
  return false;
}

export function feedProgress(p) {
  const s = p.pet.stage;
  if (s === 0 || s === 3) return 1;
  const from = GROW_AT[s] || 0, to = GROW_AT[s + 1];
  return Math.min(1, (p.pet.xp - from) / (to - from));
}
