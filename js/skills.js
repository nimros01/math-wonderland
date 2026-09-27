// Meadow stages and their question generators.
// A generator takes a difficulty level (0 easy, 1 medium, 2 hard) and returns a question.
// Every question has:
//   input    'choice' (tap a bubble), 'pad' (type a number), 'multi' (tap every right item)
//            or 'pairs' (tap two cards that make the target)
//   eq       what is shown in big numbers; '?' and '◯' become yellow slots
//   visual   picture aid (HTML) or null; show = true shows it straight away, otherwise it is the 💡 hint
// 'choice' adds answer, choices [{value, html}], layout 'grid' | 'row' | 'pair', and optional fill
// (what goes into each slot). 'multi' adds target (HTML) and items [{html, ok}].
// 'pairs' adds target, op and cards [{v}].
import { genMeasure, genShop, genStory1 } from './meadow2.js';
import { frames, fill, blocks, pair, array, row, pyramid, polygon, circle, triangleFan, squareX, half, mirrorVis, solid, SOLID_NAMES } from './visuals.js';

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

// ✓ or ✗: is this sum right?
const tfQ = (left, shown, truth) => ({
  eq: `${left} = ${shown}`, answer: truth ? 'y' : 'n', input: 'choice', layout: 'row', visual: null, show: false,
  choices: [{ value: 'y', html: '✓' }, { value: 'n', html: '✗' }], tf: true,
});

// Tap every expression that equals the target.
function findAllQ(target, good, bad) {
  const items = shuffle([...good.map(html => ({ html, ok: true })), ...bad.map(html => ({ html, ok: false }))]);
  return { eq: '', input: 'multi', target: `= ${target}`, items, visual: null, show: false };
}

// Tap two cards that make the target.
function pairsQ(target, op, pairs, decoys) {
  const cards = shuffle([...pairs.flat(), ...decoys].map(v => ({ v })));
  return { eq: '', input: 'pairs', target, op, cards, need: pairs.length, visual: null, show: false };
}

// 1. Numbers: count, compare and number tracks
const SYMBOLS = [['<', '&lt;'], ['=', '='], ['>', '&gt;']].map(([v, html]) => ({ value: v, html }));
const symOf = (x, y) => (x > y ? '>' : x < y ? '<' : '=');
const cmpQ = (left, right, x, y, visual = null) =>
  ({ eq: `${left} ◯ ${right}`, answer: symOf(x, y), input: 'choice', layout: 'row', choices: SYMBOLS, visual, show: !!visual });

function genCount(lvl) {
  const kind = pick([['dots', 'cmpDots', 'cmpDots', 'track', 'track'], ['dots', 'cmp', 'cmp', 'track', 'track'], ['cmp', 'cmpSum', 'cmpSum', 'track', 'track']][lvl]);
  if (kind === 'dots') {
    const n = R(lvl ? 11 : 3, 20);
    return numQ('?', n, [n + 1, n - 1, n + 2, n - 2, n + 10], { visual: frames(fill(n)), show: true });
  }
  if (kind === 'cmpDots') {
    const a = R(5, 20);
    const b = chance(0.12) ? a : Math.min(20, Math.max(1, a + pick([-3, -2, -1, 1, 2, 3])));
    if (b === a && a === 20) return genCount(lvl);
    return cmpQ(a, b, a, b, pair(frames(fill(a)), '', frames(fill(b, 'b'))));
  }
  if (kind === 'cmp') {
    // Close numbers up to 100, including swapped digits like 36 and 63.
    const a = R(12, 99);
    const t = Math.floor(a / 10), o = a % 10;
    let b = chance(0.35) && o !== t && o > 0 ? o * 10 + t : a + pick([-4, -3, -2, -1, 1, 2, 3, 9, -9, 11, -11]);
    if (chance(0.12)) b = a;
    b = Math.min(100, Math.max(1, b));
    return cmpQ(a, b, a, b);
  }
  if (kind === 'cmpSum') {
    const a = R(3, 9), b = R(3, 9), s = a + b;
    const off = () => (chance(0.12) ? 0 : pick([-2, -1, 1, 2]));
    if (chance(0.5)) {
      const c = s + off();
      return cmpQ(`${a} + ${b}`, c, s, c);
    }
    const c = R(2, 9), d = s - c + off();
    if (d < 1) return genCount(lvl);
    return cmpQ(`${a} + ${b}`, `${c} + ${d}`, s, c + d);
  }
  const step = lvl === 2 ? pick([2, 5, 10, -1, -2, 3]) : lvl === 1 ? pick([1, 1, -1, 2]) : pick([1, 1, -1]);
  const len = 5;
  const lo = lvl === 0 ? 0 : 10, hi = lvl === 0 ? 20 : 100;
  let start = R(lo, hi);
  if (start + step * (len - 1) > hi) start = hi - step * (len - 1);
  if (start + step * (len - 1) < lo) start = lo - step * (len - 1);
  const seq = Array.from({ length: len }, (_, i) => start + i * step);
  const miss = R(lvl === 0 ? 2 : 1, len - 1);
  const ans = seq[miss];
  return numQ('', ans, [ans + 1, ans - 1, ans + step * 2, ans + 10, ans - 10], { visual: row(seq.map((v, i) => (i === miss ? '❓' : v))), show: true });
}

// 2. Patterns
const PATTERN_SETS = [
  ['🔴', '🔵', '🟡', '🟢'], ['🍎', '🍌', '🍇', '🍊'], ['⭐', '🌙', '☀️', '☁️'],
  ['🐶', '🐱', '🐭', '🐰'], ['🟥', '🟩', '🟦', '🟨'], ['🌸', '🍀', '🍁', '🌻'],
];
const UNITS = [
  [[0, 1], [0, 0, 1], [0, 1, 2]],
  [[0, 1, 2], [0, 0, 1], [0, 1, 1], [0, 1, 2, 1]],
  [[0, 1, 2, 3], [0, 0, 1, 1], [0, 1, 2, 1], [0, 0, 1, 2]],
];
function genPattern(lvl) {
  if (lvl >= 1 && chance(lvl === 2 ? 0.5 : 0.3)) {
    if (lvl === 2 && chance(0.4)) {
      // Growing steps: 2, 3, 5, 8, 12, ?
      const start = R(1, 6), d0 = R(1, 2);
      const seq = [start];
      for (let i = 0; i < 4; i++) seq.push(seq[i] + d0 + i);
      const ans = seq[4] + d0 + 4;
      return numQ('', ans, [ans + 1, ans - 1, seq[4] + d0 + 3, seq[4] + seq[4] - seq[3]], { visual: row([...seq, '❓']), show: true });
    }
    const step = pick(lvl === 2 ? [2, 3, 5, 10, 4] : [1, 2, 10]);
    const start = R(0, 10);
    const seq = [0, 1, 2, 3].map(i => start + i * step);
    const ans = start + 4 * step;
    return numQ('', ans, [ans + step, ans - 1, ans + 1, ans - step], { visual: row([...seq, '❓']), show: true });
  }
  const set = shuffle(pick(PATTERN_SETS).slice());
  const unit = pick(UNITS[lvl]);
  // Show the unit at least twice, and at most 8 tiles before the slot.
  const len = Math.min(8, unit.length * 2 + R(0, 2));
  const seq = Array.from({ length: len + 1 }, (_, i) => set[unit[i % unit.length]]);
  const ans = seq[len];
  // Every symbol in the pattern is a choice, plus one that isn't in it.
  const used = [...new Set(unit)].map(i => set[i]);
  const extra = set.find(s => !used.includes(s));
  const opts = extra ? [...used, extra] : used;
  return {
    eq: '', answer: ans, input: 'choice', layout: 'row', visual: row([...seq.slice(0, len), '❓']), show: true,
    choices: shuffle(opts).map(v => ({ value: v, html: v })),
  };
}

// 3. Add and take away to 20
function genAdd20(lvl) {
  const max = [10, 15, 20][lvl];
  if (lvl >= 1 && chance(0.15)) {
    const a = R(3, 12), b = R(2, 8), s = a + b, shown = chance(0.5) ? s : s + pick([-1, 1, 2]);
    return tfQ(`${a} + ${b}`, shown, shown === s);
  }
  if (lvl >= 1 && chance(0.15)) {
    const t = R(8, max);
    const good = [], bad = [];
    while (good.length < 3) { const a = R(1, t - 1), e = `${a} + ${t - a}`; if (!good.includes(e)) good.push(e); }
    while (bad.length < 3) { const a = R(1, t - 1), e = `${a} + ${t - a + pick([-1, 1])}`; if (!bad.includes(e)) bad.push(e); }
    return findAllQ(t, good, bad);
  }
  if (chance(0.5)) {
    const a = R(1, max - 1), b = R(1, max - a), s = a + b;
    return numQ(`${a} + ${b} = ?`, s, [s + 1, s - 1, s + 2, Math.abs(a - b)],
      { visual: frames([...fill(a), ...fill(b, 'b')]) });
  }
  const a = R(2, max), b = R(1, a - 1), d = a - b;
  return numQ(`${a} − ${b} = ?`, d, [d + 1, d - 1, a + b, d + 2],
    { visual: frames([...fill(d), ...fill(b, 'x')]) });
}

// 4. Make 10 and doubles
function genMake10(lvl) {
  const kind = pick(lvl === 0 ? ['bond', 'bondL', 'minus', 'double'] : lvl === 1 ? ['bond', 'minus', 'double', 'near', 'pairs'] : ['bondL', 'near', 'bridge', 'bridge', 'pairs']);
  if (kind === 'pairs') {
    const all = shuffle([[1, 9], [2, 8], [3, 7], [4, 6], [5, 5]]).slice(0, 3);
    const decoys = [R(1, 9), R(1, 9)];
    return pairsQ(10, '+', all, decoys);
  }
  if (kind === 'bond' || kind === 'bondL') {
    const a = R(1, 9);
    return numQ(kind === 'bond' ? `${a} + ? = 10` : `? + ${a} = 10`, 10 - a, [a, 11 - a, 9 - a], { visual: frames(fill(a)) });
  }
  if (kind === 'minus') {
    const a = R(1, 9);
    return numQ(`10 − ${a} = ?`, 10 - a, [a, 11 - a, 9 - a], { visual: frames([...fill(10 - a), ...fill(a, 'x')]) });
  }
  if (kind === 'double') {
    const n = R(2, lvl ? 10 : 6);
    return numQ(`${n} + ${n} = ?`, 2 * n, [2 * n + 1, 2 * n - 1, n + 1, 2 * n + 2],
      { visual: frames([...fill(n), ...fill(10 - n, 'e'), ...fill(n, 'b')]) });
  }
  if (kind === 'near') {
    const n = R(2, 9), s = 2 * n + 1;
    return numQ(`${n} + ${n + 1} = ?`, s, [2 * n, s + 1, 2 * n + 2, s - 2],
      { visual: frames([...fill(n), ...fill(10 - n, 'e'), ...fill(n + 1, 'b')]) });
  }
  const a = R(6, 9), b = R(11 - a, 9), s = a + b;
  return numQ(`${a} + ${b} = ?`, s, [s - 1, s + 1, s - 10, s + 10], { visual: frames([...fill(a), ...fill(b, 'b')]) });
}

// 5. Tens and ones to 100
function genTens(lvl) {
  const t = R(1, 9), o = R(lvl ? 0 : 1, 9), n = t * 10 + o;
  if (lvl >= 1 && chance(0.4)) {
    const up = chance(0.5) || n < 20;
    const ans = up ? n + 10 : n - 10;
    if (ans <= 100) {
      return numQ(`${n} ${up ? '+' : '−'} 10 = ?`, ans, [up ? n + 1 : n - 1, up ? n + 20 : n - 20, n],
        { visual: up ? pair(blocks(n), '+', blocks(10, 'b')) : blocks(n, 'a', 1, 0), input: lvl === 2 ? 'pad' : 'choice' });
    }
  }
  const swapped = o > 0 ? o * 10 + t : n + 1;
  const q = numQ('?', n, [swapped, n + 10, n - 10, n + 1], { visual: blocks(n), show: true });
  if (lvl === 2) q.input = 'pad';
  return q;
}

// 6. Add and subtract to 100, no carrying
function genAdd100(lvl) {
  if (lvl >= 1 && chance(0.12)) {
    const a = R(11, 60), b = R(11, 39 - (a % 10 > 5 ? 9 : 0)), s = a + b, shown = chance(0.5) ? s : s + pick([10, -10, 1]);
    return tfQ(`${a} + ${b}`, shown, shown === s);
  }
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
      { visual: pair(blocks(a), '+', blocks(b, 'b')), input: lvl === 0 ? 'choice' : 'pad' });
  }
  const t1 = R(2, 9), o1 = R(1, 9);
  const t2 = lvl === 0 && chance(0.5) ? 0 : R(1, t1 - 1);
  const o2 = lvl === 0 && t2 > 0 ? 0 : R(0, o1);
  const a = t1 * 10 + o1, b = t2 * 10 + o2, d = a - b;
  if (b === 0) return genAdd100(lvl);
  return numQ(`${a} − ${b} = ?`, d, [d + 10, d - 10, d + 1, a + b],
    { visual: blocks(a, 'a', t2, o2), input: lvl === 0 ? 'choice' : 'pad' });
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
      { visual: pair(blocks(a), '+', blocks(b, 'b')), input: lvl === 0 ? 'choice' : 'pad' });
  }
  let a, b;
  do {
    a = R(20, 99);
    b = lvl === 0 ? R(2, 9) : R(11, a - 1);
  } while ((a % 10) >= (b % 10) || b >= a);
  const d = a - b;
  return numQ(`${a} − ${b} = ?`, d, [d + 10, d - 10, d + 1, d - 1],
    { visual: pair(blocks(a), '−', blocks(b, 'b')), input: lvl === 0 ? 'choice' : 'pad' });
}

// Times tables
const timesNear = (a, b) => [a * (b + 1), a * (b - 1), (a + 1) * b, (a - 1) * b, a * b + 1, a + b];
function productsOf(t, max = 10) {
  const out = [];
  for (let a = 1; a <= max; a++) if (t % a === 0 && t / a <= max) out.push(`${a} × ${t / a}`);
  return out;
}
function genTables(tables, mixer = false) {
  return lvl => {
    const a = mixer ? R(2, 10) : pick(tables);
    const b = R(mixer ? 2 : 1, 10);
    if (lvl >= 1 && chance(0.12)) {
      const s = a * b, shown = chance(0.5) ? s : pick([s + a, s - a, s + 1, s - 1].filter(v => v > 0));
      return tfQ(`${a} × ${b}`, shown, shown === s);
    }
    if (lvl >= 1 && chance(0.12)) {
      // Pop every card equal to the target.
      const t = pick([12, 16, 18, 20, 24, 30, 36, 40].filter(v => mixer || tables.some(x => v % x === 0 && v / x <= 10)));
      const good = shuffle(productsOf(t)).slice(0, 3);
      const bad = [];
      while (bad.length < 6 - good.length) {
        const x = R(2, 9), y = R(2, 9), e = `${x} × ${y}`;
        if (x * y !== t && !bad.includes(e)) bad.push(e);
      }
      return findAllQ(t, good, bad);
    }
    const input = mixer && chance(0.5) ? 'pad' : 'choice';
    if (lvl === 2 && chance(0.35)) {
      return numQ(`${a} × ? = ${a * b}`, b, [b + 1, b - 1, a, b + 2], { visual: array(a, b), input });
    }
    const [x, y] = chance(0.5) ? [b, a] : [a, b];
    return numQ(`${x} × ${y} = ?`, a * b, timesNear(a, b), { visual: array(x, y), input });
  };
}

// Puzzle stops: out-of-the-box questions. withTimes adds × puzzles.
const OPS = { '+': (a, b) => a + b, '−': (a, b) => a - b, '×': (a, b) => a * b };
function genPuzzle(withTimes) {
  return lvl => {
    const kinds = ['sign', 'pyramid', 'pairs', 'balance', 'same'];
    if (lvl >= 1) kinds.push('sign2', 'pyramid');
    const kind = pick(kinds);
    const ops = withTimes ? ['+', '−', '×'] : ['+', '−'];
    if (kind === 'sign') {
      for (;;) {
        const op = pick(ops);
        const a = R(2, withTimes ? 9 : 15), b = R(1, withTimes ? 9 : 9);
        const c = OPS[op](a, b);
        if (c < 0) continue;
        if (ops.filter(o => OPS[o](a, b) === c).length > 1) continue;
        return { eq: `${a} ◯ ${b} = ${c}`, answer: op, input: 'choice', layout: 'row', visual: null, show: false, choices: ops.map(o => ({ value: o, html: o })) };
      }
    }
    if (kind === 'sign2') {
      const combos = [['+', '+'], ['+', '−'], ['−', '+'], ['−', '−']];
      for (;;) {
        const a = R(5, 15), b = R(1, 9), c = R(1, 9);
        const [o1, o2] = pick(combos);
        const d = OPS[o2](OPS[o1](a, b), c);
        if (d < 0) continue;
        const matches = combos.filter(([x, y]) => OPS[y](OPS[x](a, b), c) === d);
        if (matches.length > 1) continue;
        return {
          eq: `${a} ◯ ${b} ◯ ${c} = ${d}`, answer: o1 + o2, input: 'choice', layout: 'grid', visual: null, show: false,
          choices: combos.map(([x, y]) => ({ value: x + y, html: `${x} ${y}`, fill: [x, y] })),
        };
      }
    }
    if (kind === 'pyramid') {
      const wide = lvl === 2 && chance(0.5);
      const base = Array.from({ length: wide ? 4 : 3 }, () => R(1, withTimes ? 12 : 8));
      const rows = [base];
      while (rows[0].length > 1) rows.unshift(rows[0].slice(1).map((v, i) => v + rows[0][i]));
      // Hide a brick: the top at level 0, anywhere later (bottom bricks mean working downwards).
      const r = lvl === 0 ? R(0, rows.length - 2) : R(0, rows.length - 1);
      const c = R(0, rows[r].length - 1);
      const ans = rows[r][c];
      const shown = rows.map((rw, i) => rw.map((v, j) => (i === r && j === c ? '❓' : v)));
      return numQ('', ans, [ans + 1, ans - 1, ans + 2, ans - 2, ans + 10], { visual: pyramid(shown), show: true, input: lvl === 2 && ans > 9 ? 'pad' : 'choice' });
    }
    if (kind === 'pairs') {
      if (withTimes) {
        const t = pick([12, 18, 24, 36]);
        const all = shuffle(productsOf(t).map(e => e.split(' × ').map(Number)).filter(([x, y]) => x <= y && x > 1)).slice(0, 3);
        return pairsQ(t, '×', all, [R(2, 9), R(2, 9)]);
      }
      const t = pick([10, 12, 15, 20]);
      const all = [];
      while (all.length < 3) { const x = R(1, t - 1); if (!all.some(([y]) => y === x || y === t - x)) all.push([x, t - x]); }
      return pairsQ(t, '+', all, [R(1, t - 1), R(1, t - 1)]);
    }
    if (kind === 'balance') {
      // Both sides must be equal: 7 + ? = 4 + 9
      if (withTimes && chance(0.5)) {
        const t = pick([12, 18, 20, 24, 30, 36]);
        const f = productsOf(t).map(e => e.split(' × ').map(Number)).filter(([x, y]) => x > 1 && y > 1);
        if (f.length >= 2) {
          const [[a, b], [c, d]] = shuffle(f).slice(0, 2);
          return numQ(`${a} × ${b} = ${c} × ?`, d, [d + 1, d - 1, a, b]);
        }
      }
      const a = R(2, 9), b = R(2, 9), c = R(2, 9), d = a + b - c;
      if (d < 1) return genPuzzle(withTimes)(lvl);
      return numQ(`${a} + ${b} = ${c} + ?`, d, [a + b, d + 1, d - 1, a + b + c]);
    }
    // same: which expression equals this one?
    const op = withTimes && chance(0.5) ? '×' : '+';
    const a = R(2, op === '×' ? 6 : 9), b = R(2, op === '×' ? 6 : 9), v = OPS[op](a, b);
    const good = op === '×' ? productsOf(v).filter(e => e !== `${a} × ${b}` && e !== `${b} × ${a}` && !e.startsWith('1 ') && !e.endsWith(' 1')) : [];
    let right;
    if (good.length) right = pick(good);
    else {
    if (op === '×') return genPuzzle(withTimes)(lvl);
    let x;
    do x = R(1, v - 1); while (x === a || x === b);
    right = `${x} + ${v - x}`;
  }
    const wrong = new Set();
    while (wrong.size < 3) {
      const x = R(2, 9), y = R(1, 9), e = `${x} ${op} ${y}`;
      if (OPS[op](x, y) !== v) wrong.add(e);
    }
    return {
      eq: `${a} ${op} ${b} = ?`, answer: right, input: 'choice', layout: 'grid', visual: null, show: false, small: true,
      choices: shuffle([right, ...wrong]).map(e => ({ value: e, html: e })),
    };
  };
}

// Shapes: count corners, find every triangle (or square), odd shape counts.
function genShapes(lvl) {
  const kind = pick(lvl === 0 ? ['sides', 'sides', 'findall'] : ['sides', 'findall', 'findall']);
  if (kind === 'sides') {
    const n = R(3, lvl === 0 ? 6 : 8);
    return numQ('?', n, [n - 1, n + 1, n + 2, n - 2].filter(v => v >= 3), { visual: polygon(n, { size: 170, dots: lvl === 0, jitter: lvl ? 0.3 : 0.12 }), show: true });
  }
  const target = lvl === 2 ? pick([3, 4, 5]) : pick([3, 4]);
  const nGood = R(2, 4);
  const items = [];
  for (let i = 0; i < nGood; i++) items.push({ html: polygon(target, { size: 64, jitter: lvl ? 0.35 : 0.15, scale: 0.7 + Math.random() * 0.3 }), ok: true });
  const others = [3, 4, 5, 6].filter(n => n !== target);
  while (items.length < 9) {
    items.push({ html: chance(0.2) ? circle({ size: 64, oval: chance(0.5) }) : polygon(pick(others), { size: 64, jitter: lvl ? 0.35 : 0.15, scale: 0.7 + Math.random() * 0.3 }), ok: false });
  }
  return { eq: '', input: 'multi', target: polygon(target, { size: 56, jitter: 0, color: '#ffffff' }), items: shuffle(items), visual: null, show: false, grid3: true };
}

// Mirror halves, counting triangles, 3D solids.
const SOLID_THINGS = { sphere: ['⚽', '🏀', '🌍', '🍊', '🔮'], cube: ['🎲', '🧊', '📦'], cylinder: ['🥫', '🔋', '🪵', '🥁'], cone: ['🍦', '🎉'] };
function genMirror(lvl) {
  const kind = pick(lvl === 0 ? ['mirror', 'solid', 'tri'] : ['mirror', 'mirror', 'solid', 'tri']);
  if (kind === 'mirror') {
    for (;;) {
      const cells = [];
      for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) if (chance(lvl === 0 ? 0.4 : 0.5)) cells.push([r, c]);
      if (cells.length < 2) continue;
      const key = cs => cs.map(([r, c]) => r + ',' + c).sort().join(' ');
      const mirror = cells.map(([r, c]) => [r, 1 - c]);
      const copy = cells;
      const flip = cells.map(([r, c]) => [3 - r, 1 - c]);
      const upside = cells.map(([r, c]) => [3 - r, c]);
      const keys = [key(mirror), key(copy), key(flip), key(upside)];
      if (new Set(keys).size < 4) continue;
      const opts = lvl === 0 ? [mirror, copy, flip] : [mirror, copy, flip, upside];
      return {
        eq: '', answer: keys[0], input: 'choice', layout: 'row', visual: mirrorVis(cells), show: true,
        choices: shuffle(opts.map(cs => ({ value: key(cs), html: half(cs, 88) }))),
      };
    }
  }
  if (kind === 'solid') {
    const name = pick(SOLID_NAMES);
    return {
      eq: `${pick(SOLID_THINGS[name])} = ?`, answer: name, input: 'choice', layout: 'grid', visual: null, show: false,
      choices: shuffle(SOLID_NAMES.slice()).map(n => ({ value: n, html: solid(n, 70) })),
    };
  }
  if (lvl === 2 && chance(0.4)) return numQ('?', 8, [4, 6, 7, 9], { visual: squareX(), show: true });
  const k = lvl === 0 ? 1 : pick([1, 2, 2, 3]);
  const ans = ((k + 1) * (k + 2)) / 2;
  return numQ('?', ans, [k + 1, ans - 1, ans + 1, ans + 2], { visual: triangleFan(k), show: true });
}

// kind: 'learn' stages are part of placement; 'puzzle' stops are extra challenge on the path.
export const STAGES = [
  { id: 'count', icon: '🔢', gen: genCount },
  { id: 'pattern', icon: '🔁', gen: genPattern },
  { id: 'add20', icon: '🍎', gen: genAdd20 },
  { id: 'make10', icon: '🔟', gen: genMake10 },
  { id: 'tens', icon: '🧱', gen: genTens },
  { id: 'measure', icon: '📏', gen: genMeasure, added: true },
  { id: 'add100', icon: '➕', gen: genAdd100 },
  { id: 'shop', icon: '🛒', gen: genShop, added: true },
  { id: 'carry', icon: '🔄', gen: genCarry },
  { id: 'story1', icon: '🎬', gen: genStory1, added: true },
  { id: 'puzzle1', icon: '🧩', gen: genPuzzle(false), puzzle: true },
  { id: 'x2', icon: '×2', gen: genTables([1, 2, 10]) },
  { id: 'x5', icon: '×5', gen: genTables([5]) },
  { id: 'x34', icon: '×3', gen: genTables([3, 4]) },
  { id: 'x67', icon: '×7', gen: genTables([6, 7]) },
  { id: 'x89', icon: '×9', gen: genTables([8, 9]) },
  { id: 'mix', icon: '✖️', gen: genTables([], true) },
  { id: 'shapes', icon: '🔷', gen: genShapes },
  { id: 'mirror', icon: '🦋', gen: genMirror },
  { id: 'puzzle2', icon: '🧩', gen: genPuzzle(true), puzzle: true },
];
export const LEARN = STAGES.filter(s => !s.puzzle);

export const STICKERS = ['🌻', '🐞', '🦋', '🍄', '🌈', '🐝', '🌷', '🐌', '🍓', '🐢', '🦔', '🌳', '🐇', '🪺', '☘️', '🌼'];
export const HATS = ['🎩', '👑', '🎀', '🧢', '🕶️', '🎓'];
export const AVATARS = ['🦊', '🐼', '🐯', '🐸', '🐵', '🦁', '🐰', '🐨'];

// Shared with the other worlds' stage files.
export { R, pick, chance, shuffle, numQ, tfQ, findAllQ, pairsQ, cmpQ, SYMBOLS, OPS, productsOf };
