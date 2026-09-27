// Saved game state, kept in this browser's localStorage.
const KEY = 'math-wonderland-v1';

function fresh() {
  return { v: 1, profiles: [], current: null, muted: false };
}

let saved = null;
try { saved = JSON.parse(localStorage.getItem(KEY)); } catch (e) { /* storage blocked */ }
export const state = saved && saved.v === 1 ? saved : fresh();

// save() marks the current player as changed (for family sync); writeLocal() only stores.
const listeners = [];
export const onSave = fn => listeners.push(fn);

export function writeLocal() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage blocked */ }
}

export function save() {
  const p = me();
  if (p) p.updated = Date.now();
  writeLocal();
  listeners.forEach(fn => fn());
}

export function me() {
  return state.profiles.find(p => p.id === state.current) || null;
}

export function addProfile(avatar, name = '') {
  const p = {
    id: Date.now().toString(36),
    avatar,
    name: name.trim().slice(0, 14),
    gems: 0,
    pet: { kind: Math.floor(Math.random() * 3), stage: 0, xp: 0, hat: null },
    stages: {},
    stickers: [],
    hats: [],
    unlockAll: false,
    updated: Date.now(),
  };
  state.profiles.push(p);
  state.current = p.id;
  save();
  return p;
}

export function removeProfile(id) {
  state.profiles = state.profiles.filter(p => p.id !== id);
  if (state.current === id) state.current = null;
  (state.deleted ||= {})[id] = Date.now(); // so other synced devices remove it too
  save();
}

export function stageRec(p, id) {
  if (!p.stages[id]) p.stages[id] = { stars: 0, demo: false, plays: 0 };
  return p.stages[id];
}

// A stage opens when the one before it has a star. Stages that were already reached stay open,
// even if a new stage is later added in front of them.
export function isUnlocked(p, stages, idx) {
  if (p.unlockAll || idx === 0) return true;
  return stages.slice(idx - 1).some(s => (p.stages[s.id]?.stars || 0) > 0);
}

// Pet lines: egg, baby, young, grown. Growth comes from feeding with gems.
export const PETS = [
  ['🥚', '🦎', '🐊', '🐉'],
  ['🥚', '🐣', '🐥', '🦚'],
  ['🥚', '🐢', '🦕', '🦖'],
];

// Every world has its own pet egg, which hatches with the first star earned in that world.
// Meadow's pet is the original p.pet, where older copies of the game look for it. The others live
// in p.pets[worldId]; older copies (and their family sync) carry that field along untouched.
// Worlds not built yet already have their lines, so a new world gets its pet by using the same id.
export const WORLD_PETS = {
  meadow: PETS,
  ocean: [['🥚', '🐟', '🐠', '🐬'], ['🥚', '🦐', '🦀', '🦞'], ['🥚', '🐡', '🦈', '🐋']],
  candy: [['🥚', '🐭', '🐹', '🐰'], ['🥚', '🐛', '🐝', '🦋'], ['🥚', '🐶', '🐩', '🦄']],
  desert: [['🥚', '🦔', '🦘', '🐪'], ['🥚', '🐍', '🦂', '🐲'], ['🥚', '🦉', '🦅', '🦁']],
  volcano: [['🥚', '🐜', '🦗', '🦖'], ['🥚', '🐌', '🐸', '🐲'], ['🥚', '🦏', '🐘', '🦣']],
  space: [['🥚', '👾', '👽', '🤖'], ['🥚', '🐵', '🐒', '🦍'], ['🥚', '🐱', '🐈', '🐯']],
};
const OTHER_PETS = [['🥚', '🐣', '🐤', '🐓']];
const petLines = wid => WORLD_PETS[wid] || OTHER_PETS;

export function petOf(p, wid = 'meadow') {
  if (wid === 'meadow') return p.pet;
  const pets = (p.pets ||= {});
  return (pets[wid] ||= { kind: Math.floor(Math.random() * petLines(wid).length), stage: 0, xp: 0, hat: null });
}

// Reading a pet for display never adds anything to the save.
export const peekPet = (p, wid) => (wid === 'meadow' ? p.pet : p.pets?.[wid] || { kind: 0, stage: 0, xp: 0, hat: null });

// The pet that comes along to play: this world's pet once it has hatched, otherwise the Meadow pet.
export function companion(p, wid) {
  const pet = peekPet(p, wid);
  return pet.stage > 0 ? { pet, wid } : { pet: p.pet, wid: 'meadow' };
}

// Food costs more as the pet grows, so gems stay worth collecting.
export const feedCost = pet => [0, 10, 20, 40][pet.stage] || 40;
export const HAT_COST = 60;
const GROW_AT = [0, 0, 6, 16]; // feeds needed to reach stage 2 and 3

export function petEmoji(pet, wid = 'meadow') {
  const lines = petLines(wid);
  return lines[pet.kind % lines.length][pet.stage];
}

export function hatch(pet) {
  if (pet.stage === 0) { pet.stage = 1; return true; }
  return false;
}

// Returns true when the pet grows to its next form. Gems are shared by all of a child's pets.
export function feed(p, pet) {
  const cost = feedCost(pet);
  if (p.gems < cost || pet.stage === 0 || pet.stage === 3) return false;
  p.gems -= cost;
  pet.xp += 1;
  const next = pet.stage + 1;
  if (next <= 3 && pet.xp >= GROW_AT[next]) { pet.stage = next; return true; }
  return false;
}

export function feedProgress(pet) {
  const s = pet.stage;
  if (s === 0 || s === 3) return 1;
  const from = GROW_AT[s] || 0, to = GROW_AT[s + 1];
  return Math.min(1, (pet.xp - from) / (to - from));
}
