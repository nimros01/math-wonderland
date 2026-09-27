// Which country's coins the game shows (Israel or the US). A parent can change it in the parent corner.
// Stored on its own, outside player saves, so it never touches progress or family sync.
const KEY = 'math-wonderland-country';

function guess() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const langs = navigator.languages || [navigator.language || ''];
    if (tz === 'Asia/Jerusalem' || tz === 'Asia/Tel_Aviv' || langs.some(l => /^(he|iw)\b/i.test(l))) return 'IL';
  } catch (e) { /* fall through */ }
  return 'US';
}

let current = null;
export function country() {
  if (current) return current;
  try { current = localStorage.getItem(KEY); } catch (e) { /* storage blocked */ }
  if (current !== 'IL' && current !== 'US') current = guess();
  return current;
}
export function setCountry(c) {
  current = c;
  try { localStorage.setItem(KEY, c); } catch (e) { /* storage blocked */ }
}

// Coins from biggest to smallest, and how a price is written.
export const MONEY = {
  IL: { coins: [10, 5, 2, 1], fmt: v => `${v}₪`, pay: [20, 50], max: 40 },
  US: { coins: [25, 10, 5, 1], fmt: v => `${v}¢`, pay: [50, 100], max: 99 },
};
export const money = () => MONEY[country()];
