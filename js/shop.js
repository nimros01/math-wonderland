// Diamond shop: a room for every pet, golden and rainbow colors for grown pets, and mystery eggs.
// Everything lives in fields that older copies of the game carry along untouched (see mergeShop in cloud.js):
//   p.homeOwn[world] = items bought for that world's room     p.home[world] = { spot: item }
//   p.shine[world]   = colors bought for that world's pet     p.wear[world] = 'gold' | 'rainbow' | ''
//   p.zoo            = creatures hatched from mystery eggs (any world)
// Emoji are from Unicode 12 (2019) or older, so they show on older phones too (iOS 13.2+, Android 10+).

// Room spots in the order the picker lists them, with the room's own items: cheap, nice, fancy.
export const SPOTS = ['bed', 'window', 'wall', 'light', 'toy', 'plant', 'bowl', 'rug'];
export const ROOM_PRICES = [40, 120, 300];
export const RUGS = ['rug1', 'rug2', 'rug3']; // drawn in CSS: plain, striped, rainbow

export const ROOMS = {
  meadow: { bed: ['🧺', '🛏️', '🛋️'], window: ['🌤️', '🌈', '🌙'], wall: ['🌻', '🦋', '🏆'], light: ['🕯️', '💡', '🏮'], toy: ['⚽', '🪀', '🪁'], plant: ['🌱', '🌷', '🌳'], bowl: ['🥣', '🍯', '🎂'] },
  ocean: { bed: ['🐚', '🛶', '🏝️'], window: ['🌊', '🐋', '🌅'], wall: ['⚓', '🗺️', '🔱'], light: ['🔦', '🏮', '🌟'], toy: ['🏐', '🎣', '🤿'], plant: ['🌿', '🎋', '🌴'], bowl: ['🦐', '🍣', '🍱'] },
  candy: { bed: ['🍩', '🍰', '🏰'], window: ['🍭', '🎈', '🎆'], wall: ['🍫', '🍬', '🖼️'], light: ['🎐', '🏮', '🎇'], toy: ['🧸', '🎁', '🎠'], plant: ['🍄', '🌸', '🌺'], bowl: ['🍪', '🍦', '🍨'] },
  desert: { bed: ['⛺', '🏕️', '🏺'], window: ['🌞', '🌅', '🌌'], wall: ['📜', '🧭', '🔺'], light: ['🔥', '🪔', '☀️'], toy: ['🎲', '🥁', '🎯'], plant: ['🌵', '🌾', '🌴'], bowl: ['🥙', '🍉', '🥥'] },
  volcano: { bed: ['🧱', '⛺', '🛏️'], window: ['🌋', '☄️', '🌠'], wall: ['🦴', '🥇', '🏆'], light: ['🕯️', '🔥', '⚡'], toy: ['🏀', '🎳', '🥁'], plant: ['🌵', '🍁', '🌲'], bowl: ['🍖', '🍗', '🌶️'] },
  space: { bed: ['🛸', '🪐', '🌙'], window: ['🌍', '🌌', '🌕'], wall: ['📡', '🔭', '🛰️'], light: ['💡', '⭐', '🌟'], toy: ['🤖', '🎮', '🧩'], plant: ['🌱', '🍄', '🎍'], bowl: ['🍕', '🧃', '🍩'] },
};

export const roomItems = (w, spot) => (spot === 'rug' ? RUGS : (ROOMS[w] || ROOMS.meadow)[spot]);
export const itemPrice = (w, spot, item) => ROOM_PRICES[roomItems(w, spot).indexOf(item)];

export const ownsItem = (p, w, item) => !!p.homeOwn?.[w]?.includes(item);
export const roomOf = (p, w) => p.home?.[w] || {};

// Put an owned item (or nothing) in a spot. The friend spot takes any creature from the collection.
export function place(p, w, spot, item) {
  const room = ((p.home ||= {})[w] ||= {});
  if (!item) { room[spot] = null; return true; } // kept as null, so sync knows the spot was cleared on purpose
  if (spot === 'friend' ? !(p.zoo || []).includes(item) : !ownsItem(p, w, item)) return false;
  room[spot] = item;
  return true;
}

// Buy an item for a world's room and put it in its spot. Returns false when it can't be bought.
export function buyItem(p, w, spot, item) {
  const price = itemPrice(w, spot, item);
  if (price === undefined || ownsItem(p, w, item) || p.gems < price) return false;
  p.gems -= price;
  ((p.homeOwn ||= {})[w] ||= []).push(item);
  return place(p, w, spot, item);
}

// A room is complete when every spot (the free friend spot aside) has something in it.
export const roomDone = (p, w) => SPOTS.every(s => roomOf(p, w)[s]);

// ---------- pet colors ----------
export const SHINES = [['gold', 500], ['rainbow', 1000]];
export const shinePrice = c => SHINES.find(s => s[0] === c)?.[1];
export const ownsShine = (p, w, c) => !!p.shine?.[w]?.includes(c);

// Only a grown pet can change color, and rainbow comes after gold.
export function canBuyShine(p, w, pet, c) {
  const price = shinePrice(c);
  if (price === undefined || pet.stage !== 3 || ownsShine(p, w, c)) return false;
  if (c === 'rainbow' && !ownsShine(p, w, 'gold')) return false;
  return p.gems >= price;
}

export function buyShine(p, w, pet, c) {
  if (!canBuyShine(p, w, pet, c)) return false;
  p.gems -= shinePrice(c);
  ((p.shine ||= {})[w] ||= []).push(c);
  (p.wear ||= {})[w] = c;
  return true;
}

export function wearShine(p, w, c) {
  if (c && !ownsShine(p, w, c)) return false;
  (p.wear ||= {})[w] = c || '';
  return true;
}

// The CSS class a pet shows with: only grown pets shine.
export function shineClass(p, w, pet) {
  const c = p?.wear?.[w];
  return c && pet?.stage === 3 && ownsShine(p, w, c) ? ' sh-' + c : '';
}

// ---------- mystery eggs ----------
export const EGG_COST = 150;
export const ZOO = {
  meadow: ['🐿️', '🦊', '🦝', '🦆', '🐓', '🐑', '🐐', '🦌'],
  ocean: ['🐤', '🐙', '🦑', '🐧', '🦦', '🐳', '🦩', '🦢'],
  candy: ['🐼', '🐨', '🦥', '🦙', '🐻', '🐷', '🐮', '🦨'],
  desert: ['🐫', '🦒', '🦓', '🐆', '🦛', '🦃', '🦜', '🐃'],
  volcano: ['🦇', '🕷️', '🐂', '🐅', '🐗', '🦡', '🐎', '🐺'],
  space: ['👻', '⛄', '🧸', '🎃', '🌝', '🌞', '🌚', '🦠'],
};
export const zooSet = w => ZOO[w] || [];
export const zooMissing = (p, w) => zooSet(w).filter(c => !(p.zoo || []).includes(c));

// An egg always hatches a creature this child doesn't have yet; a finished set sells no more eggs.
export function buyEgg(p, w, rnd = Math.random) {
  const left = zooMissing(p, w);
  if (!left.length || p.gems < EGG_COST) return null;
  const c = left[Math.floor(rnd() * left.length)];
  p.gems -= EGG_COST;
  (p.zoo ||= []).push(c);
  return c;
}

// ---------- family sync ----------
// Things bought on either phone are kept; where an item sits and which color is worn follow the newer copy,
// falling back to the older copy for worlds the newer one hasn't touched.
const union = (a, b) => [...new Set([...(a || []), ...(b || [])])];
export function mergeShop(m, older) {
  for (const key of ['homeOwn', 'shine']) {
    for (const [w, list] of Object.entries(older[key] || {})) (m[key] ||= {})[w] = union(m[key][w], list);
  }
  // A room is joined spot by spot: the newer copy's spots (null = cleared) win, the older copy fills the rest.
  for (const [w, room] of Object.entries(older.home || {})) {
    const n = ((m.home ||= {})[w] ||= {});
    for (const [spot, it] of Object.entries(room || {})) if (!(spot in n)) n[spot] = it;
  }
  for (const [w, c] of Object.entries(older.wear || {})) if (!(w in (m.wear ||= {}))) m.wear[w] = c;
  if (older.zoo) m.zoo = union(m.zoo, older.zoo);
}
