// The worlds in order. Each has its stages and a boss; beating a boss opens the next world.
// Progress is keyed by stage id, so adding worlds never touches what players already earned.
import { STAGES } from './skills.js';
import { OCEAN } from './ocean.js';

export const WORLDS = [
  { id: 'meadow', icon: '🌻', stages: STAGES, boss: '🧌' },
  { id: 'ocean', icon: '🌊', stages: OCEAN, boss: '🐙' },
];

export const learnOf = w => w.stages.filter(s => !s.puzzle);

// Meadow's boss win predates worlds and lives in p.bossMeadow; later bosses are stored like a stage,
// which older copies of the game (and sync) already keep safe.
const bossId = w => 'boss-' + w.id;
export const bossBeaten = (p, w) => (w.id === 'meadow' ? !!p.bossMeadow : (p.stages[bossId(w)]?.stars || 0) > 0);
export function setBossBeaten(p, w) {
  if (w.id === 'meadow') { p.bossMeadow = true; return; }
  const rec = (p.stages[bossId(w)] ||= { stars: 0, demo: true, plays: 0 });
  rec.stars = 3;
}

export const worldOpen = (p, wi) => wi === 0 || !!p.unlockAll || bossBeaten(p, WORLDS[wi - 1]);

export function worldOfStage(id) {
  const wi = WORLDS.findIndex(w => w.stages.some(s => s.id === id));
  return wi < 0 ? 0 : wi;
}
