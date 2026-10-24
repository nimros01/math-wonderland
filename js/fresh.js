// Picking the next question so the same one doesn't come back soon: not twice in a row, not twice in a round,
// and not one of the player's last questions (kept across rounds by js/resume.js).

// A short fingerprint of a question (kept small: rounds are saved). Same as before this file, so a round left
// half-played keeps its list.
const hash = t => { let h = 2166136261; for (let k = 0; k < t.length; k++) h = Math.imul(h ^ t.charCodeAt(k), 16777619); return (h >>> 0).toString(36) + t.length; };
export const qKey = q => hash(q.eq + (q.visual || '') + q.answer + (q.target || '') + (q.items || []).map(it => it.html).join());

const TRIES = 24;

// gen(lvl) makes a question. last: the key of the question just asked; round: keys asked this round;
// recent: the player's last keys, oldest first (this round's too). A question never asked lately wins straight away.
// When a stage has only a few questions to give, the one asked longest ago wins, and never the one just asked.
export function freshQ(gen, lvl, last, round, recent) {
  let best = null, bestAge = -1;
  for (let k = 0; k < TRIES; k++) {
    const q = gen(lvl), key = qKey(q), at = recent.lastIndexOf(key);
    const age = key === last ? 0 : at >= 0 ? recent.length - at : round.has(key) ? 1 : Infinity;
    if (age > bestAge) { best = { q, key }; bestAge = age; }
    if (age === Infinity) break;
  }
  return best;
}
