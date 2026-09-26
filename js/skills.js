// Meadow stages and their question generators.
// A generator takes a difficulty level (0 easy, 1 medium, 2 hard) and returns a question:
//   eq       what is shown in big numbers ("7 + 5 = ?")
//   visual   picture aid (HTML) or null
//   show     true when the picture is shown straight away, otherwise it is the hint
//   answer   the right value
//   input    'choice' (tap a bubble) or 'pad' (type on the number pad)
//   choices  [{value, html}] for 'choice'
//   layout   'grid' (default), 'pair' (two big picture buttons) or 'row'
import { frames, fill, blocks, pair, array, row } from './visuals.js';

const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const chance = p => Math.random() < p;
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Four answer bubbles: the answer plus three likely mistakes.
export function numChoices(ans, near = []) {
  const set = new Set();
  for (const c of shuffle(near.slice())) {
    if (set.size < 3 && Number.isInteger(c) && c >= 0 && c !== ans) set.add(c);
  }
  for (let d = 1; set.size < 3; d++) {
    for (const c of shuffle([ans + d, ans - d])) if (set.size < 3 && c >= 0 && c !== ans) set.add(c);
  }
  return shuffle([ans, ...set]).map(v => ({ value: v, html: String(v) }));
}

const numQ = (eq, answer, near, extra = {}) => ({
  eq, answer, input: 'choice', choices: numChoices(answer, near), visual: null, show: false, ...extra,
});

// 1. Count and compare to 20
function genCount(lvl) {
  const max = [10, 15, 20][lvl];
  if (chance(0.55)) {
    const n = R(1, max);
    return numQ('?', n, [n + 1, n - 1, n + 2, n - 2, n + 10], { visual: frames(fill(n)), show: true });
  }
  const a = R(1, max);
  let b = a;
  const gap = lvl === 2 ? 2 : 6;
  while (b === a) b = Math.min(max, Math.max(1, a + R(-gap, gap)));
  return {
    eq: '👑', answer: a > b ? 'L' : 'R', input: 'choice', layout: 'pair', visual: null, show: false,
    choices: [{ value: 'L', html: frames(fill(a)) }, { value: 'R', html: frames(fill(b, 'b')) }],
  };
}

// 2. Patterns
const PATTERN_SETS = [
  ['🔴', '🔵', '🟡', '🟢'], ['🍎', '🍌', '🍇', '🍊'], ['⭐', '🌙', '☀️', '☁️'],
  ['🐶', '🐱', '🐭', '🐰'], ['🟥', '🟩', '🟦', '🟨'], ['🌸', '🍀', '🍁', '🌻'],
];
const UNITS = [[[0, 1]], [[0, 1, 2], [0, 0, 1], [0, 1, 1]], [[0, 1, 2, 3], [0, 0, 1, 1], [0, 1, 2, 1]]];
function genPattern(lvl) {
  if (lvl >= 1 && chance(lvl === 2 ? 0.5 : 0.25)) {
    const step = pick(lvl === 2 ? [2, 3, 5, 10, 4] : [1, 2, 10]);
    const start = R(0, 10);
    const seq = [0, 1, 2, 3].map(i => start + i * step);
    const ans = start + 4 * step;
    return numQ('', ans, [ans + step, ans - 1, ans + 1, ans - step], { visual: row([...seq, '❓']), show: true });
  }
  const set = pick(PATTERN_SETS);
  const unit = pick(UNITS[lvl]);
  const len = lvl === 0 ? 5 : 7;
  const seq = Array.from({ length: len + 1 }, (_, i) => set[unit[i % unit.length]]);
  const ans = seq[len];
  const opts = shuffle(set.slice()).slice(0, 3);
  if (!opts.includes(ans)) opts[0] = ans;
  return {
    eq: '', answer: ans, input: 'choice', layout: 'row', visual: row([...seq.slice(0, len), '❓']), show: true,
    choices: shuffle(opts).map(v => ({ value: v, html: v })),
  };
}

// 3. Add and take away to 20
function genAdd20(lvl) {
  const max = [10, 15, 20][lvl];
  if (chance(0.5)) {
    const a = R(1, max - 1), b = R(1, max - a), s = a + b;
    return numQ(`${a} + ${b} = ?`, s, [s + 1, s - 1, s + 2, Math.abs(a - b)],
      { visual: frames([...fill(a), ...fill(b, 'b')]), show: lvl === 0 });
  }
  const a = R(2, max), b = R(1, a - 1), d = a - b;
  return numQ(`${a} − ${b} = ?`, d, [d + 1, d - 1, a + b, d + 2],
    { visual: frames([...fill(d), ...fill(b, 'x')]), show: lvl === 0 });
}

// 4. Make 10 and doubles
function genMake10(lvl) {
  const kind = pick(lvl === 0 ? ['bond', 'bond', 'double'] : lvl === 1 ? ['bond', 'double', 'near'] : ['bond', 'near', 'bridge', 'bridge']);
  if (kind === 'bond') {
    const a = R(1, 9);
    return numQ(`${a} + ? = 10`, 10 - a, [a, 11 - a, 9 - a], { visual: frames(fill(a)), show: lvl < 2 });
  }
  if (kind === 'double') {
    const n = R(1, lvl ? 10 : 5);
    return numQ(`${n} + ${n} = ?`, 2 * n, [2 * n + 1, 2 * n - 1, n + 1, 2 * n + 2],
      { visual: frames([...fill(n), ...fill(10 - n, 'e'), ...fill(n, 'b')]), show: lvl === 0 });
  }
  if (kind === 'near') {
    const n = R(2, 9), s = 2 * n + 1;
    return numQ(`${n} + ${n + 1} = ?`, s, [2 * n, s + 1, 2 * n + 2, s - 2],
      { visual: frames([...fill(n), ...fill(10 - n, 'e'), ...fill(n + 1, 'b')]), show: false });
  }
  const a = R(6, 9), b = R(11 - a, 9), s = a + b;
  return numQ(`${a} + ${b} = ?`, s, [s - 1, s + 1, s - 10, s + 10],
    { visual: frames([...fill(a), ...fill(b, 'b')]), show: false });
}

// 5. Tens and ones to 100
function genTens(lvl) {
  const t = R(1, 9), o = R(lvl ? 0 : 1, 9), n = t * 10 + o;
  if (lvl >= 1 && chance(0.4)) {
    const up = chance(0.5) || n < 20;
    const ans = up ? n + 10 : n - 10;
    if (ans <= 100) {
      return numQ(`${n} ${up ? '+' : '−'} 10 = ?`, ans, [up ? n + 1 : n - 1, up ? n + 20 : n - 20, n],
        { visual: blocks(n, 'a', up ? 0 : 1, 0), show: lvl === 1, input: lvl === 2 ? 'pad' : 'choice' });
    }
  }
  const swapped = o > 0 ? o * 10 + t : n + 1;
  const q = numQ('?', n, [swapped, n + 10, n - 10, n + 1], { visual: blocks(n), show: true });
  if (lvl === 2) q.input = 'pad';
  return q;
}

// 6. Add and subtract to 100, no carrying
function genAdd100(lvl) {
  if (chance(0.5)) {
    let a, b;
    if (lvl === 0) {
      a = R(1, 8) * 10 + R(0, 5);
      b = chance(0.5) ? R(1, 9 - Math.floor(a / 10)) * 10 : R(1, 9 - (a % 10));
    } else {
      const t1 = R(1, 7), t2 = R(1, 8 - t1), o1 = R(0, 8), o2 = R(1, 9 - o1);
      a = t1 * 10 + o1; b = t2 * 10 + o2;
    }
    const s = a + b;
    return numQ(`${a} + ${b} = ?`, s, [s + 10, s - 10, s + 1, s - 1],
      { visual: pair(blocks(a), '+', blocks(b, 'b')), show: false, input: lvl === 0 ? 'choice' : 'pad' });
  }
  const t1 = R(2, 9), o1 = R(1, 9);
  const t2 = lvl === 0 && chance(0.5) ? 0 : R(1, t1 - 1);
  const o2 = lvl === 0 && t2 > 0 ? 0 : R(0, o1);
  const a = t1 * 10 + o1, b = t2 * 10 + o2, d = a - b;
  if (b === 0) return genAdd100(lvl);
  return numQ(`${a} − ${b} = ?`, d, [d + 10, d - 10, d + 1, a + b],
    { visual: blocks(a, 'a', t2, o2), show: false, input: lvl === 0 ? 'choice' : 'pad' });
}

// 7. Add and subtract to 100, with carrying
function genCarry(lvl) {
  if (chance(0.5)) {
    let a, b;
    do {
      a = R(11, 89);
      b = lvl === 0 ? R(2, 9) : R(11, 89);
    } while ((a % 10) + (b % 10) < 10 || a + b > 100);
    const s = a + b;
    return numQ(`${a} + ${b} = ?`, s, [s - 10, s + 10, s - 1, s + 1],
      { visual: pair(blocks(a), '+', blocks(b, 'b')), show: false, input: lvl === 0 ? 'choice' : 'pad' });
  }
  let a, b;
  do {
    a = R(20, 99);
    b = lvl === 0 ? R(2, 9) : R(11, a - 1);
  } while ((a % 10) >= (b % 10) || b >= a);
  const d = a - b;
  return numQ(`${a} − ${b} = ?`, d, [d + 10, d - 10, d + 1, d - 1],
    { visual: pair(blocks(a), '−', blocks(b, 'b')), show: false, input: lvl === 0 ? 'choice' : 'pad' });
}

// 8 to 13. Times tables
const timesNear = (a, b) => [a * (b + 1), a * (b - 1), (a + 1) * b, (a - 1) * b, a * b + 1, a + b];
function genTables(tables, mixer = false) {
  return lvl => {
    const a = mixer ? R(2, 10) : pick(tables);
    const b = R(mixer ? 2 : 1, lvl === 0 && !mixer ? 5 : 10);
    const input = mixer && chance(0.5) ? 'pad' : 'choice';
    if (lvl === 2 && chance(0.35)) {
      return numQ(`${a} × ? = ${a * b}`, b, [b + 1, b - 1, a, b + 2], { visual: array(a, b), show: false, input });
    }
    const [x, y] = lvl >= 1 && chance(0.5) ? [b, a] : [a, b];
    return numQ(`${x} × ${y} = ?`, a * b, timesNear(a, b),
      { visual: array(x, y), show: lvl === 0 && !mixer, input });
  };
}

export const STAGES = [
  { id: 'count', icon: '🔢', gen: genCount },
  { id: 'pattern', icon: '🔁', gen: genPattern },
  { id: 'add20', icon: '🍎', gen: genAdd20 },
  { id: 'make10', icon: '🔟', gen: genMake10 },
  { id: 'tens', icon: '🧱', gen: genTens },
  { id: 'add100', icon: '➕', gen: genAdd100 },
  { id: 'carry', icon: '🔄', gen: genCarry },
  { id: 'x2', icon: '×2', gen: genTables([1, 2, 10]) },
  { id: 'x5', icon: '×5', gen: genTables([5]) },
  { id: 'x34', icon: '×3', gen: genTables([3, 4]) },
  { id: 'x67', icon: '×7', gen: genTables([6, 7]) },
  { id: 'x89', icon: '×9', gen: genTables([8, 9]) },
  { id: 'mix', icon: '✖️', gen: genTables([], true) },
];

export const STICKERS = ['🌻', '🐞', '🦋', '🍄', '🌈', '🐝', '🌷', '🐌', '🍓', '🐢', '🦔', '🌳', '🐇', '🪺', '☘️', '🌼'];
export const HATS = ['🎩', '👑', '🎀', '🧢', '🕶️', '🎓'];
export const AVATARS = ['🦊', '🐼', '🐯', '🐸', '🐵', '🦁', '🐰', '🐨'];
