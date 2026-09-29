// Solutions for the Meadow question kinds. Many of them (add, sub, mul, compare, rows, pyramids)
// are general, so later worlds can reuse them.
// A generator puts the numbers a solution needs in q.sol = { t: kind, ... }. Each solver here returns
// { ans, steps, oops }: ans is the answer the solution works out on its own (tests check it equals
// q.answer), steps are [{ pic, math, say }], and oops is an extra step when the player's answer
// matches a typical mistake.
import { say } from './sol-words.js';
import { frames, fill, blocks, pair, solid } from './visuals.js';
import { nline, tiles, b10, dots, checks, pyr, balance, corners, polyPoints, fan, sqx, gallery, mirror, unitSnake, crowd, row, big } from './sol-pics.js';
import { money, country } from './country.js';

const RED = '#ef5b52', BLUE_ = '#3e9be0';
const S = (pic, math, key, vars) => ({ pic, math, say: key ? say(key, vars) : '' });
const OOPS = (math, key, vars, pic = '') => ({ pic, math, say: say(key, vars), oops: true });
const m = v => String(v).replace(/^-/, '−');
const plain = s => String(s ?? '').replace(/<[^>]*>/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();

// Work out a small expression like "3 + 9", "4 × 6" or "12 − 5", left to right.
export function evalExpr(s) {
  if (!/^\d/.test(plain(s))) return NaN;
  const t = plain(s).split(' ');
  if (!t.length || t.length % 2 === 0) return NaN;
  let v = +t[0];
  for (let i = 1; i < t.length; i += 2) {
    const b = +t[i + 1];
    v = t[i] === '+' ? v + b : t[i] === '−' || t[i] === '-' ? v - b : t[i] === '×' ? v * b : t[i] === '÷' ? v / b : NaN;
  }
  return v;
}

// ---------- adding ----------
function add({ a, b }, q, given) {
  const s = a + b, steps = [];
  let oops = null;
  if (s <= 20) {
    if (a === b) {
      steps.push(S(frames([...fill(a), ...fill(10 - a, 'e'), ...fill(b, 'b')]), `${a} + ${a} = ${s}`, 'double'));
    } else if (Math.abs(a - b) === 1) {
      const lo = Math.min(a, b);
      steps.push(S(frames([...fill(a), ...fill(b, 'b')]), `${a} + ${b} = ${lo} + ${lo} + 1`, 'nearDouble', { a: lo, b: lo + 1 }));
      steps.push(S(nline(2 * lo - 2, s + 1, { jumps: [[2 * lo, s, '+1']] }), `${2 * lo} + 1 = ${s}`, ''));
    } else if (a < 10 && s > 10) {
      const need = 10 - a, rest = b - need;
      steps.push(S(frames([...fill(a), ...fill(b, 'b')]), `${a} + ${b}`, 'frames'));
      steps.push(S(nline(a - 1, s + 1, { jumps: [[a, 10, '+' + need]] }), `${a} + ${need} = 10`, 'fill10', { a: need }));
      steps.push(S(nline(a - 1, s + 1, { jumps: [[a, 10, '+' + need], [10, s, '+' + rest]] }), `10 + ${rest} = ${s}`, 'ten+', { a: rest, b: s }));
    } else {
      steps.push(S(frames([...fill(a), ...fill(b, 'b')]), `${a} + ${b}`, 'frames'));
      steps.push(S(nline(Math.max(0, a - 2), s + 2, { jumps: Array.from({ length: b }, (_, i) => [a + i, a + i + 1, b <= 6 ? '+1' : '']) }), `${a} + ${b} = ${s}`, 'hops', { a, b }));
    }
    if (given === Math.abs(a - b)) oops = OOPS(`${a} + ${b} ≠ ${given}`, 'oopsTookAway');
  } else if (b % 10 === 0) {
    const jumps = Array.from({ length: b / 10 }, (_, i) => [a + i * 10, a + i * 10 + 10, '+10']);
    steps.push(S(pair(blocks(a), '+', blocks(b, 'b')), `${a} + ${b}`, 'place'));
    steps.push(S(nline(a - 5, s + 5, { jumps }), `${a} + ${b} = ${s}`, 'tensJump'));
  } else if (b < 10 && (a % 10) + b < 10) {
    steps.push(S(nline(a - 2, s + 2, { jumps: Array.from({ length: b }, (_, i) => [a + i, a + i + 1, '']) }), `${a} + ${b} = ${s}`, 'hops', { a, b }));
  } else if (b < 10) {
    // bridge through the next ten: 47 + 5 = 47 + 3 + 2
    const up = 10 - (a % 10), next = a + up, rest = b - up;
    steps.push(S(nline(a - 2, s + 2, { jumps: [[a, next, '+' + up]] }), `${a} + ${up} = ${next}`, 'toTen', { a: up, b: next }));
    steps.push(S(nline(a - 2, s + 2, { jumps: [[a, next, '+' + up], [next, s, '+' + rest]] }), `${next} + ${rest} = ${s}`, 'tenMore', { a: rest, b: next, c: s }));
    if (given === s - 10) oops = OOPS(`${a} + ${b} ≠ ${given}`, 'oopsNewTen');
  } else {
    const t1 = Math.floor(a / 10), o1 = a % 10, t2 = Math.floor(b / 10), o2 = b % 10, T = (t1 + t2) * 10, O = o1 + o2;
    steps.push(S(b10([{ t: t1, o: o1, col: RED, label: a }, { op: '+' }, { t: t2, o: o2, col: BLUE_, label: b }]), [[a, t1, o1], [b, t2, o2]].filter(([, , o]) => o).map(([v, t, o]) => `${v} = ${t * 10} + ${o}`).join('<br>'), 'split'));
    if (O >= 10) {
      steps.push(S(b10([{ t: 0, o: O, ring: true, label: `${o1} + ${o2} = ${O}` }]), `${o1} + ${o2} = ${O} = 10 + ${O - 10}`, 'newTen', { a: O - 10 }));
      steps.push(S(b10([{ t: t1 + t2 + 1, o: O - 10, col: BLUE_, newRod: true, label: s }]), `${T} + 10 + ${O - 10} = ${s}`, 'together'));
      if (given === s - 10) oops = OOPS(`${a} + ${b} ≠ ${given}`, 'oopsNewTen', {}, b10([{ t: t1 + t2 + 1, o: O - 10, col: BLUE_, newRod: true, fadeT: 1, label: given }]));
    } else {
      steps.push(S(b10([{ t: t1 + t2, o: 0, col: BLUE_, label: T }]), `${t1 * 10} + ${t2 * 10} = ${T}`, 'tens'));
      steps.push(S(b10([{ t: t1 + t2, o: O, col: BLUE_, label: s }]), `${o1} + ${o2} = ${O}<br>${T} + ${O} = ${s}`, 'together'));
    }
  }
  if (!oops && given === s + 10) oops = OOPS(`${a} + ${b} ≠ ${given}`, 'oopsExtraTen');
  if (!oops && (given === s + 1 || given === s - 1)) oops = OOPS(`${a} + ${b} ≠ ${given}`, 'oopsOne');
  return { ans: s, steps, oops };
}

// ---------- taking away ----------
function sub({ a, b, up }, q, given) {
  const d = a - b, steps = [];
  let oops = null;
  if (up) {
    // count up from the smaller number: to the next ten, then on
    const nt = Math.min(a, Math.ceil((b + 1) / 10) * 10), j = [[b, nt, '+' + (nt - b)]];
    if (nt < a) j.push([nt, a, '+' + (a - nt)]);
    steps.push(S(nline(b - 1, a + 1, { jumps: j }), `${b} + ? = ${a}`, 'countUp', { a: b, b: a }));
    steps.push(S(nline(b - 1, a + 1, { jumps: [[b, a, '+' + d]] }), j.length > 1 ? `${j.map(x => x[2].slice(1)).join(' + ')} = ${d}` : `${a} − ${b} = ${d}`, ''));
  } else if (a <= 20) {
    if (a > 10 && b > a - 10) {
      const first = a - 10, rest = b - first;
      steps.push(S(frames([...fill(d), ...fill(b, 'x')]), `${a} − ${b}`, 'crossOut', { a: b }));
      steps.push(S(nline(d - 1, a + 1, { jumps: [[a, 10, '−' + first]] }), `${a} − ${first} = 10`, 'backTo10', { a: first }));
      steps.push(S(nline(d - 1, a + 1, { jumps: [[a, 10, '−' + first], [10, d, '−' + rest]] }), `10 − ${rest} = ${d}`, 'thenRest', { a: rest }));
    } else {
      steps.push(S(frames([...fill(d), ...fill(b, 'x')]), `${a} − ${b} = ${d}`, 'crossOut', { a: b }));
    }
  } else if (b % 10 === 0) {
    steps.push(S(blocks(a, 'a', b / 10, 0), `${a} − ${b}`, 'subTens'));
    steps.push(S(nline(d - 5, a + 5, { jumps: Array.from({ length: b / 10 }, (_, i) => [a - i * 10, a - i * 10 - 10, '−10']) }), `${a} − ${b} = ${d}`, 'tensJump'));
  } else if (b < 10) {
    const o = a % 10;
    if (o >= b) {
      steps.push(S(blocks(a, 'a', 0, b), `${a} − ${b} = ${d}`, 'crossOut', { a: b }));
    } else {
      const t = a - o, rest = b - o;
      steps.push(S(nline(d - 2, a + 2, { jumps: [[a, t, '−' + o]] }), `${a} − ${o} = ${t}`, 'downToTen', { a: o, b: t }));
      steps.push(S(nline(d - 2, a + 2, { jumps: [[a, t, '−' + o], [t, d, '−' + rest]] }), `${t} − ${rest} = ${d}`, 'thenRest', { a: rest }));
      if (given === d + 10) oops = OOPS(`${a} − ${b} ≠ ${given}`, 'oopsBorrow');
    }
  } else {
    const t1 = Math.floor(a / 10), o1 = a % 10, t2 = Math.floor(b / 10), o2 = b % 10;
    steps.push(S(b10([{ t: t1, o: o1, label: a }]), `${a} − ${b}`, 'split'));
    if (o1 < o2) {
      steps.push(S(b10([{ t: t1 - 1, o: o1 + 10, ring: true, label: `${(t1 - 1) * 10} + ${o1 + 10}` }]), `${a} = ${(t1 - 1) * 10} + ${o1 + 10}`, 'breakTen'));
      steps.push(S(b10([{ t: t1 - 1, o: o1 + 10, fadeO: o2, label: `${o1 + 10} − ${o2} = ${o1 + 10 - o2}` }]), `${o1 + 10} − ${o2} = ${o1 + 10 - o2}`, 'subOnes'));
      steps.push(S(b10([{ t: t1 - 1, o: o1 + 10 - o2, fadeT: t2, label: d }]), `${(t1 - 1) * 10} − ${t2 * 10} = ${(t1 - 1 - t2) * 10}<br>${(t1 - 1 - t2) * 10} + ${o1 + 10 - o2} = ${d}`, 'subTens'));
      if (given === d + 10) oops = OOPS(`${a} − ${b} ≠ ${given}`, 'oopsBorrow');
    } else {
      steps.push(S(b10([{ t: t1, o: o1, fadeO: o2, label: `${o1} − ${o2} = ${o1 - o2}` }]), `${o1} − ${o2} = ${o1 - o2}`, 'subOnes'));
      steps.push(S(b10([{ t: t1, o: o1 - o2, fadeT: t2, label: d }]), `${t1 * 10} − ${t2 * 10} = ${(t1 - t2) * 10}<br>${(t1 - t2) * 10} + ${o1 - o2} = ${d}`, 'subTens'));
    }
  }
  if (!oops && given === a + b) oops = OOPS(`${a} − ${b} ≠ ${given}`, 'oopsAdded');
  if (!oops && (given === d + 1 || given === d - 1)) oops = OOPS(`${a} − ${b} ≠ ${given}`, 'oopsOne');
  return { ans: d, steps, oops };
}

// a + ? = c
function missing({ a, c }, q, given) {
  const v = c - a;
  const steps = [S(frames([...fill(a), ...fill(c - a, 'e')]), `${a} + ? = ${c}`, 'missingAdd', { a: c }),
    S(frames([...fill(a), ...fill(v, 'b')]), `${c} − ${a} = ${v}`, '')];
  return { ans: v, steps, oops: given === a ? OOPS(`${a} + ${a} ≠ ${c}`, 'oopsHave') : null };
}

// Count dots in ten-frames: full frames first.
function count({ n }, q) {
  const f = Math.floor(n / 10), rest = n % 10;
  return { ans: n, steps: [S(frames(fill(n)), f ? `${Array(f).fill(10).join(' + ')}${rest ? ' + ' + rest : ''} = ${n}` : `${n}`, f ? 'fullFrames' : 'countDots')] };
}

// Read the blocks: tens and ones.
function place({ n }, q, given) {
  const t = Math.floor(n / 10), o = n % 10;
  const steps = [S(blocks(n), `${t} × 10 = ${t * 10}`, 'place'), S(blocks(n), `${t * 10} + ${o} = ${n}`, 'placeSum', { a: t, b: o })];
  return { ans: n, steps, oops: given === o * 10 + t && o !== t ? OOPS(`${n} ≠ ${given}`, 'oopsSwap') : null };
}

// ---------- comparing ----------
const SYM = (x, y) => (x > y ? '>' : x < y ? '<' : '=');
const esc = s => s.replace('<', '&lt;').replace('>', '&gt;');
function cmp({ x, y, lx, ly }, q, given) {
  if (!Number.isInteger(x) || !Number.isInteger(y)) return null;
  const sym = SYM(x, y), steps = [];
  const L = lx ?? x, Rt = ly ?? y;
  const side = (lab, v) => (String(lab) === String(v) ? `${v}` : String(lab).includes('<') ? `${lab} ${v}` : `${lab} = ${v}`);
  if (String(L) !== String(x) || String(Rt) !== String(y)) {
    steps.push(S(`<div class="solchecks"><div><span>${side(L, x)}</span></div><div><span>${side(Rt, y)}</span></div></div>`, '', 'cmpWork'));
  } else if (x >= 10 && y >= 10 && x < 100 && y < 100 && x !== y) {
    const tx = Math.floor(x / 10), ty = Math.floor(y / 10);
    steps.push(S(pair(blocks(x), '', blocks(y, 'b')), tx !== ty ? `${tx} ${esc(SYM(tx, ty))} ${ty}` : `${x % 10} ${esc(SYM(x % 10, y % 10))} ${y % 10}`, tx !== ty ? 'cmpTens' : 'cmpOnes'));
  }
  const lo = Math.min(x, y), hi = Math.max(x, y), pad = Math.max(2, Math.round((hi - lo) * 0.3));
  steps.push(S(nline(lo >= 0 ? Math.max(0, lo - pad) : lo - pad, hi + pad, { marks: x === y ? [[x, '#2fb383', '=']] : [[x, '#ef5b52', ''], [y, '#3e9be0', '']] }),
    `${String(L).includes('span') ? L : m(x)} ${esc(sym)} ${String(Rt).includes('span') ? Rt : m(y)}`, x === y ? 'cmpSame' : 'cmpLine'));
  return { ans: sym, steps, oops: given && given !== sym ? OOPS(`${m(x)} ${esc(sym)} ${m(y)}`, 'oopsSym') : null };
}

// ---------- rows and patterns ----------
function track({ seq, miss, step }, q, given) {
  const ans = seq[0] + miss * step;
  const sign = step > 0 ? '+' : '−', st = sign + Math.abs(step);
  const arcs = seq.map((v, i) => (i < seq.length - 1 ? st : ''));
  const i = seq.findIndex((v, k) => k < seq.length - 1 && k !== miss && k + 1 !== miss);
  const steps = [S(tiles(seq.map((v, k) => (k === miss ? null : v)), { arcs }), `${m(seq[i])} ${sign} ${Math.abs(step)} = ${m(seq[i + 1])}`, 'step', { a: st }),
    S(tiles(seq.map((v, k) => (k === miss ? { v, hi: true } : v)), { arcs }), `${m(seq[miss - 1])} ${sign} ${Math.abs(step)} = ${m(ans)}`, '')];
  const g = Number(given);
  const oops = given !== undefined && g !== ans && Math.abs(g - ans) < Math.abs(step) * 3 ? OOPS(st, 'oopsStep') : null;
  return { ans, steps, oops };
}
function grow({ seq }, q, given) {
  const d = seq.slice(1).map((v, i) => v - seq[i]), next = d[d.length - 1] + 1, ans = seq[seq.length - 1] + next;
  const steps = [S(tiles([...seq, null], { arcs: d.map(x => '+' + x) }), d.map(x => '+' + x).join(' '), 'grow'),
    S(tiles([...seq, { v: ans, hi: true }], { arcs: [...d, next].map(x => '+' + x) }), `${seq[seq.length - 1]} + ${next} = ${ans}`, 'nextJump', { a: '+' + next })];
  return { ans, steps, oops: given !== undefined && Number(given) !== ans ? OOPS(`+${next}`, 'oopsStep') : null };
}
function repeat({ seq, k }, q) {
  const n = seq.length - 1, ans = seq[n];
  const boxes = [];
  for (let i = 0; i + k <= n; i += k) boxes.push([i, k]);
  const steps = [S(tiles([...seq.slice(0, n), null], { boxes: boxes.slice(0, 1) }), '', 'repeat'),
    S(tiles([...seq.slice(0, n), { v: ans, hi: true }], { boxes }), `${ans}`, 'repeatNext')];
  return { ans, steps };
}

// ---------- true or false, find all, pairs ----------
function tf({ op, a, b, shown }, q) {
  const v = op === '+' ? a + b : op === '−' ? a - b : a * b, ok = v === shown;
  const pic = op === '×' ? dots(Math.min(a, b), Math.max(a, b)) : op === '+' && v <= 20 ? frames([...fill(a), ...fill(b, 'b')]) : '';
  return {
    ans: ok ? 'y' : 'n',
    steps: [S(pic, `${a} ${op} ${b} = ${v}`, 'workOut'), S(big(ok ? '✓' : '✗'), `${v} ${ok ? '=' : '≠'} ${shown}`, ok ? 'tfYes' : 'tfNo')],
  };
}
function findall(sol, q) {
  const tt = plain(q.target).replace('=', '').trim();
  if (!/^\d+$/.test(tt)) return null;
  const target = +tt;
  const vals = q.items.map(it => evalExpr(it.html));
  if (vals.some(Number.isNaN)) return null;
  return {
    ans: vals.map(v => (v === target ? 1 : 0)).join(''),
    steps: [S(checks(q.items.map((it, i) => [`${plain(it.html)} = ${vals[i]}`, vals[i] === target])), `= ${target}`, 'checkEach', { a: target })],
  };
}
function pairs(sol, q) {
  const used = new Set(), found = [];
  const f = (x, y) => (q.op === '×' ? x * y : x + y);
  q.cards.forEach((c, i) => {
    if (used.has(i)) return;
    const j = q.cards.findIndex((d, k) => k !== i && !used.has(k) && f(c.v, d.v) === q.target);
    if (j >= 0 && found.length < q.need) { used.add(i); used.add(j); found.push([c.v, q.cards[j].v]); }
  });
  return {
    ans: found.length,
    steps: [S(checks(found.map(([x, y]) => [`${x} ${q.op} ${y} = ${q.target}`, true])), `${q.target}`, 'pairsFind', { a: q.target })],
  };
}

// ---------- times ----------
function mul({ a, b }, q, given) {
  const v = a * b, r = Math.min(a, b), c = Math.max(a, b), steps = [];
  if (r > 1) steps.push(S(dots(r, c), a === r ? `${a} × ${b}` : `${a} × ${b} = ${r} × ${c}`, 'rows', { a: r, b: c }));
  if (r === 1) steps.push(S(dots(1, c), `1 × ${c} = ${c}`, 'times1', { a: c }));
  else if (c === 10) steps.push(S(dots(r, 10), `${r} × 10 = ${v}`, 'times10'));
  else if (r <= 5) steps.push(S(dots(r, c, { tint: r }), Array.from({ length: r }, (_, i) => c * (i + 1)).join(', '), 'skip', { a: c }));
  else if (r === 9) steps.push(S(dots(10, c, { split: 9 }), `10 × ${c} − ${c} = ${10 * c} − ${c} = ${v}`, 'times9'));
  else steps.push(S(dots(r, c, { split: 5 }), `5 × ${c} + ${r - 5} × ${c} = ${5 * c} + ${(r - 5) * c} = ${v}`, 'split5', { a: r - 5 }));
  let oops = null;
  if (given === a + b) oops = OOPS(`${a} × ${b} ≠ ${a} + ${b}`, 'oopsPlus');
  else if (given === v + c || given === v - c || given === v + r || given === v - r) oops = OOPS(`${a} × ${b} ≠ ${given}`, 'oopsRow');
  else if (given === v + 1 || given === v - 1) oops = OOPS(`${a} × ${b} ≠ ${given}`, 'oopsOne');
  return { ans: v, steps, oops };
}
function mulmiss({ a, b }, q) {
  const v = a * b;
  const jumps = Array.from({ length: b }, (_, i) => [i * a, i * a + a, b <= 6 ? '+' + a : '']);
  return {
    ans: b,
    steps: [S(nline(0, v, { jumps, labels: [v] }), `${Array.from({ length: b }, (_, i) => a * (i + 1)).join(', ')}`, 'mulMiss', { a, b: v }),
      S(dots(Math.min(a, b), Math.max(a, b)), `${v} ÷ ${a} = ${b}`, '')],
  };
}

// ---------- puzzles ----------
const OPS = { '+': (x, y) => x + y, '−': (x, y) => x - y, '×': (x, y) => x * y };
function sign({ a, b, c, ops }, q) {
  const ok = ops.find(o => OPS[o](a, b) === c);
  return { ans: ok, steps: [S(checks(ops.map(o => [`${a} ${o} ${b} = ${m(OPS[o](a, b))}`, OPS[o](a, b) === c])), `${a} ${ok} ${b} = ${c}`, 'trySigns')] };
}
function sign2({ a, b, c, d }, q) {
  const combos = [['+', '+'], ['+', '−'], ['−', '+'], ['−', '−']];
  const val = ([x, y]) => OPS[y](OPS[x](a, b), c);
  const ok = combos.find(k => val(k) === d);
  return {
    ans: ok.join(''),
    steps: [S(checks(combos.map(k => [`${a} ${k[0]} ${b} ${k[1]} ${c} = ${m(val(k))}`, val(k) === d])), `${a} ${ok[0]} ${b} ${ok[1]} ${c} = ${d}`, 'leftToRight')],
  };
}
function pyramid({ rows, r, c }, q) {
  const n = rows.length, steps = [];
  let ans, hi, math, key;
  if (r < n - 1) {
    const x = rows[r + 1][c], y = rows[r + 1][c + 1];
    ans = x + y; hi = [[r + 1, c], [r + 1, c + 1]]; math = `${x} + ${y} = ${ans}`; key = 'pyrRule';
  } else if (c > 0) {
    const top = rows[r - 1][c - 1], nb = rows[r][c - 1];
    ans = top - nb; hi = [[r - 1, c - 1], [r, c - 1]]; math = `${top} − ${nb} = ${ans}`; key = 'pyrDown';
  } else {
    const top = rows[r - 1][c], nb = rows[r][c + 1];
    ans = top - nb; hi = [[r - 1, c], [r, c + 1]]; math = `${top} − ${nb} = ${ans}`; key = 'pyrDown';
  }
  steps.push(S(pyr(rows, { hi, hole: [r, c] }), '', 'pyrRule'));
  steps.push(S(pyr(rows, { hi, hole: [r, c], val: ans }), math, key === 'pyrRule' ? '' : key));
  return { ans, steps };
}
function bal({ l, r, op }, q, given) {
  const v = OPS[op](l[0], l[1]), ans = op === '+' ? v - r : v / r;
  const inv = op === '+' ? '−' : '÷';
  return {
    ans,
    steps: [S(balance(`${l[0]} ${op} ${l[1]}`, `${r} ${op} ?`), `${l[0]} ${op} ${l[1]} = ${v}`, 'balLeft'),
      S(balance(`${v}`, `${r} ${op} ${ans}`), `${r} ${op} ? = ${v}<br>? = ${v} ${inv} ${r} = ${ans}`, 'balRight')],
    oops: given === v ? OOPS(`? ≠ ${v}`, 'oopsWhole') : null,
  };
}
function same({ a, b, op }, q) {
  const v = OPS[op](a, b);
  const rows = q.choices.map(ch => [`${plain(ch.html)} = ${evalExpr(ch.html)}`, evalExpr(ch.html) === v]);
  return { ans: q.choices.find(ch => evalExpr(ch.html) === v)?.value, steps: [S(checks(rows), `${a} ${op} ${b} = ${v}`, 'sameValue')] };
}

// ---------- shapes ----------
function cornersSol({ n }, q) {
  const pts = polyPoints(q.visual);
  return { ans: pts ? pts.length : n, steps: [S(pts ? corners(pts) : q.visual, `${n}`, 'corners')] };
}
function findshape({ n }, q) {
  const sides = it => (/<ellipse/.test(it.html) ? 0 : polyPoints(it.html)?.length ?? -1);
  const pics = q.items.map(it => `<div class="${sides(it) === n ? 'ok' : 'no'}">${it.html}<b>${sides(it) || '○'}</b></div>`);
  return {
    ans: q.items.map(it => (sides(it) === n ? 1 : 0)).join(''),
    steps: [S(q.target, `${n}`, 'sidesTarget', { a: n }), S(gallery(pics, 'shapes'), `${n}`, 'sidesMatch', { a: n })],
  };
}
function mirrorSol({ cells }, q) {
  const key = cells.map(([r, c]) => r + ',' + (1 - c)).sort().join(' ');
  return { ans: key, steps: [S(mirror(cells), '', 'mirror'), S(mirror(cells), '', 'mirrorWrong')] };
}
function solidSol({ name, thing }, q) {
  return { ans: name, steps: [S(row(big(thing), big('='), solid(name, 90)), '', name)] };
}
function tris({ k }, q) {
  const steps = [], parts = [];
  for (let s = 1; s <= k + 1; s++) {
    const list = [];
    for (let i = 0; i + s <= k + 1; i++) list.push(fan(k, [i, i + s], 58));
    parts.push(list.length);
    steps.push(S(gallery(list), `${list.length}`, s === 1 ? 'triSmall' : 'triSize', { a: s }));
  }
  const ans = parts.reduce((x, y) => x + y, 0);
  steps.push(S(fan(k, [0, k + 1], 120), `${parts.join(' + ')} = ${ans}`, 'triTotal'));
  return { ans, steps };
}
function sqxSol() {
  return {
    ans: 8,
    steps: [S(gallery([0, 1, 2, 3].map(i => sqx(i, 58))), '4', 'sqxSmall'), S(gallery([4, 5, 6, 7].map(i => sqx(i, 58))), '4 + 4 = 8', 'sqxBig')],
  };
}

// ---------- measuring and money ----------
function ruler({ start, end }, q, given) {
  const len = end - start;
  return {
    ans: len,
    steps: [S(q.visual, `${start} → ${end}`, 'ruler', { a: start, b: end }),
      S(nline(Math.max(0, start - 1), end + 1, { jumps: [[start, end, '+' + len]] }), `${end} − ${start} = ${len}`, 'rulerDiff', { a: start, b: end })],
    oops: given === end && start > 0 ? OOPS(`${end} − ${start} = ${len}`, 'oopsRuler') : null,
  };
}
function clips({ n }, q) {
  return { ans: n, steps: [S(q.visual, Array.from({ length: n }, (_, i) => i + 1).join(' '), 'clips')] };
}
function guess({ len, u }, q) {
  return { ans: len, steps: [S(unitSnake(len, u), `≈ ${len}`, 'guess')] };
}
const coinHTML = v => `<span class="mcoin ${country().toLowerCase()} v${v}">${v}</span>`;
function coins({ list }, q) {
  const sorted = list.slice().sort((a, b) => b - a);
  let run = 0;
  const cells = sorted.map(v => { run += v; return `<div>${coinHTML(v)}<b>${run}</b></div>`; });
  return { ans: run, steps: [S(`<div class="solcoins">${cells.join('')}</div>`, `${sorted.join(' + ')} = ${money().fmt(run)}`, 'coinsSort')] };
}
function pay({ price, sums }, q) {
  const rows = q.choices.map((ch, i) => [`${ch.html} = ${sums[i]}`, sums[i] === price]);
  return { ans: sums.indexOf(price), steps: [S(checks(rows), money().fmt(price), 'payCheck', { a: price })] };
}
function fewest({ price, best }, q) {
  let left = price;
  const cells = best.map(v => { left -= v; return `<div>${coinHTML(v)}<b>${left}</b></div>`; });
  return { ans: q.answer, steps: [S(`<div class="solcoins">${cells.join('')}</div>`, `${price} = ${best.join(' + ')}`, 'fewest')] };
}

// ---------- stories ----------
function story({ n, c, away, e, miss }, q, given) {
  const left = away ? n - c : n + c, op = away ? '−' : '+';
  const steps = [S(crowd(e, n), `${n}`, 'storyStart', { a: n })];
  if (miss) {
    steps.push(S(crowd(e, n, c), `${n} − ? = ${left}`, 'storyMissing'));
    steps.push(S(nline(left - 1, n + 1, { jumps: [[n, left, '−' + c]] }), `${n} − ${left} = ${c}`, ''));
  } else {
    steps.push(S(away ? crowd(e, n, c) : crowd(e, n + c), `${op} ${c}`, away ? 'storyAway' : 'storyMore', { a: c }));
    steps.push(S(crowd(e, left), `${n} ${op} ${c} = ${left}`, 'storyEnd', { a: left }));
  }
  const ans = q.input === 'choice' && typeof q.answer === 'string' ? `${n} ${op} ${c}` : miss ? c : left;
  const wrongWay = given !== undefined && (Number(given) === (away ? n + c : n - c) || given === `${n} ${away ? '+' : '−'} ${c}`);
  return { ans, steps, oops: wrongWay ? OOPS(`${n} ${op} ${c}`, 'oopsStory') : null };
}

export const SOLVERS = {
  add, sub, missing, count, place, cmp, track, grow, repeat, tf, findall, pairs, mul, mulmiss, sign, sign2, pyramid, bal, same,
  corners: cornersSol, findshape, mirror: mirrorSol, solid: solidSol, tris, sqx: sqxSol, ruler, clips, guess, coins, pay, fewest, story,
};
