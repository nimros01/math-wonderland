// Solutions for the Ocean question kinds: big numbers and place value, column sums, bigger ×, sharing and
// long division, fractions, clocks, angles, area and fences, shapes, turns and nets, chances and charts.
// Same shape as sol-basic.js: each solver works the answer out itself and returns { ans, steps, oops }.
import { S, OOPS, m, plain } from './sol-basic.js';
import { nline, tiles, dots, checks, gallery, row, big, polyPoints } from './sol-pics.js';
import {
  digitRows, column, fbars, clockPic, angleFan, angleOverlay, gridPic, cellsPic, sqGrid, colorRows, chests,
  shapeFacts, parallelPairs, rightCorners, allSidesEqual, COLORS,
} from './sol-pics2.js';
import { frac } from './ocean.js';

const RED = '#ef5b52', GREY = '#b9c1d6', MINT = '#2fb383';
const SYM = (x, y) => (x > y ? '>' : x < y ? '<' : '=');
const esc = s => s.replace('<', '&lt;').replace('>', '&gt;');
const hm = (h, mm) => `${h}:${String(mm).padStart(2, '0')}`;
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const lcm = (a, b) => (a * b) / gcd(a, b);
const dotOf = c => `<span class="cdot" style="background:${COLORS[c]}"></span>`;
const pow10 = k => 10 ** k;
const headFor = len => Array.from({ length: len }, (_, i) => m(pow10(i)));
const isPow10 = v => /^10*$/.test(String(v));

// ---------- place value ----------
// Read a number from blocks or coin stacks: each kind of block, then all together.
function placeval({ n }, q, given) {
  const s = String(n), L = s.length;
  const terms = [...s].map((d, k) => [+d, pow10(L - 1 - k)]).filter(([d]) => d);
  const steps = [
    S(q.visual, terms.map(([d, p]) => `${d} × ${m(p)}`).join(' + '), 'placeCount'),
    S(digitRows([{ s }], { head: headFor(L) }), `${terms.map(([d, p]) => m(d * p)).join(' + ')} = ${m(n)}`, 'placeJoin'),
  ];
  let oops = null;
  if (given !== undefined && given !== n) {
    const same = [...String(given)].sort().join('') === [...s].sort().join('');
    oops = OOPS(`${m(n)} ≠ ${m(given)}`, same ? 'oopsPlaces' : 'oopsCountAgain');
  }
  return { ans: n, steps, oops };
}

// What is the underlined digit worth?
function digitval({ n, i }, q, given) {
  const s = String(n), L = s.length, p = L - 1 - i, d = +s[i], val = d * pow10(p);
  const parts = [...s].map((c, k) => [+c * pow10(L - 1 - k), k]).filter(([v]) => v);
  const steps = [
    S(digitRows([{ s, hi: [p] }], { head: headFor(L), band: p }), `${d} × ${m(pow10(p))} = ${m(val)}`, 'digitPlace', { a: d, b: m(pow10(p)), c: m(val) }),
    S('', parts.map(([v, k]) => (k === i ? `<u class="hl">${m(v)}</u>` : m(v))).join(' + ') + ` = ${m(n)}`, 'digitSum'),
  ].slice(0, parts.length > 4 ? 1 : 2);
  let oops = null;
  if (given === d && val !== d) oops = OOPS(`${d} → ${m(val)}`, 'oopsFace');
  else if (given !== undefined && given !== val) oops = OOPS(`${d} × ${m(pow10(p))} = ${m(val)}`, 'oopsPlaceOff');
  return { ans: val, steps, oops };
}

// 1 → 10 → 100 …: every step is × 10.
function zoom({ from, len, hole }, q, given) {
  const items = Array.from({ length: len }, (_, i) => pow10(from + i)), ans = items[hole], prev = items[hole - 1];
  const steps = [
    S(tiles(items.map((v, k) => (k === hole ? null : m(v))), { arcs: items.slice(1).map(() => '×10') }), `${m(prev)} × 10 = ${m(ans)}`, 'times10Row'),
    S(digitRows([{ s: String(prev) }, { s: String(ans), hi: [0] }]), '', 'oneMoreZero'),
  ];
  return { ans, steps, oops: given !== undefined && given !== ans ? OOPS(`${m(prev)} × 10 = ${m(ans)}`, 'oopsZeros') : null };
}

// × or ÷ by 10, 100, 1000, or by 20, 30, 50 (× 2 and then × 10).
function zeros({ a, m: k, div }, q, given) {
  const c = div ? a / k : a * k, steps = [];
  if (isPow10(k)) {
    const z = String(k).length - 1, zs = Array.from({ length: z }, (_, i) => i);
    const rows = div ? [{ s: String(a), strike: zs }, { s: String(c) }] : [{ s: String(a) }, { s: String(c), hi: zs }];
    steps.push(S(digitRows(rows), `${m(a)} ${div ? '÷' : '×'} ${m(k)} = ${m(c)}`, (div ? 'divZeros' : 'timesZeros') + (z === 1 ? '1' : ''), { a: m(k), b: z }));
  } else {
    const t = k / 10, mid = a * t;
    steps.push(S('', `${m(a)} × ${t} = ${m(mid)}`, 'timesTens', { a: k, b: t }));
    steps.push(S(digitRows([{ s: String(mid) }, { s: String(c), hi: [0] }]), `${m(mid)} × 10 = ${m(c)}`, 'oneMoreZero'));
  }
  const off = given !== undefined && given !== c && (given === c * 10 || given * 10 === c);
  return { ans: c, steps, oops: off ? OOPS(`${m(c)} ≠ ${m(given)}`, 'oopsZeros') : null };
}

// Round to the nearer ten or hundred: which end of the gap is closer?
function roundSol({ v, unit }, q, given) {
  const lo = Math.floor(v / unit) * unit, hi = lo + unit, d1 = v - lo, d2 = hi - v, ans = d1 < d2 ? lo : hi;
  const steps = [
    S(nline(lo, hi, { marks: [[v, RED, '']], labels: [v] }), `${lo} < ${v} < ${hi}`, 'roundBetween', { a: lo, b: hi }),
    S(nline(lo, hi, { jumps: [[v, lo, '−' + d1, d1 < d2 ? MINT : GREY], [v, hi, '+' + d2, d2 < d1 ? MINT : GREY]], marks: [[v, RED, '']] }), `${v} ≈ ${ans}`, 'roundNear', { a: v, b: ans, c: Math.min(d1, d2) }),
  ];
  return { ans, steps, oops: given === (ans === lo ? hi : lo) ? OOPS(`${d1} ${esc(SYM(d1, d2))} ${d2}`, 'oopsFar') : null };
}

// ---------- column sums ----------
const digit = (n, i) => Math.floor(n / pow10(i)) % 10;
// The column steps for a + b or a − b, one column at a time from the ones.
function columnSteps(a, op, b) {
  const A = String(a), B = String(b), L = Math.max(A.length, B.length), steps = [];
  let res = '';
  if (op === '+') {
    let carry = 0;
    const carries = {};
    for (let i = 0; i < L; i++) {
      const da = digit(a, i), db = digit(b, i), s = da + db + carry;
      res = (i === L - 1 ? s : s % 10) + res;
      const math = `${da} + ${db}${carry ? ' + 1' : ''} = ${s}`;
      carry = s >= 10 && i < L - 1 ? 1 : 0;
      if (carry) carries[i + 1] = '1';
      steps.push(S(column(A, '+', B, { res, carry: { ...carries }, band: i }), math, i === 0 ? (carry ? 'colFirstCarry' : 'colFirst') : carry ? 'colCarry' : 'colNext', { a: s % 10 }));
    }
    return steps;
  }
  const top = [...A].reverse().map(Number), tops = {}, strike = [];
  for (let i = 0; i < L; i++) {
    const db = digit(b, i);
    let key = i === 0 ? 'colFirstSub' : 'colNextSub', vars = {};
    if (top[i] < db) {
      let k = i + 1;
      while (top[k] === 0) { top[k] = 9; tops[k] = '9'; strike.push(k); k++; }
      top[k]--; tops[k] = String(top[k]); strike.push(k);
      vars = { a: top[i], b: db, c: top[i] + 10 };
      top[i] += 10; tops[i] = String(top[i]); strike.push(i);
      key = 'colBorrow';
    }
    res = (top[i] - db) + res;
    const shown = i === L - 1 ? res.replace(/^0+(?=\d)/, '') : res;
    steps.push(S(column(A, '−', B, { res: shown.padStart(res.length, ' '), carry: { ...tops }, strike: [...strike], band: i }), `${top[i]} − ${db} = ${top[i] - db}`, key, vars));
  }
  return steps;
}
function colOops(ans, op, given, a, b) {
  if (given === undefined || given === ans) return null;
  const d = Math.abs(given - ans);
  if (op === '+' && given === noCarry(a, b) && noCarry(a, b) !== ans) return OOPS(`${m(a)} + ${m(b)} = ${m(ans)}`, 'oopsCarry');
  // a carry or a borrow only explains the slip when the sum has one
  const moved = op === '+' ? noCarry(a, b) !== ans : [...String(b)].reverse().some((x, i) => digit(a, i) < +x);
  if (isPow10(d) && d > 1) return OOPS(`${m(a)} ${op} ${m(b)} = ${m(ans)}`, !moved ? 'oopsColumnOff' : op === '+' ? 'oopsCarry' : 'oopsBorrowCol');
  return null;
}
function noCarry(a, b) { let r = 0, p = 1; while (a || b) { r += (((a % 10) + (b % 10)) % 10) * p; a = Math.floor(a / 10); b = Math.floor(b / 10); p *= 10; } return r; }
function colSol({ a, b, op }, q, given) {
  const ans = op === '+' ? a + b : a - b;
  const steps = [S(column(String(a), op, String(b), { res: null }), '', 'colLine'), ...columnSteps(a, op, b)];
  return { ans, steps, oops: colOops(ans, op, given, a, b) };
}
// Is this big sum right? Work it out in columns, then compare.
function tfCol({ a, b, op, shown }, q) {
  const v = op === '+' ? a + b : a - b, ok = v === shown;
  return { ans: ok ? 'y' : 'n', steps: [...columnSteps(a, op, b), S(big(ok ? '✓' : '✗'), `${m(v)} ${ok ? '=' : '≠'} ${m(shown)}`, ok ? 'tfYes' : 'tfNo')] };
}
// ? + b = c, or a − ? = c: undo it with a take-away.
function colMissing({ a, b, c, plus }, q, given) {
  const [x, y] = plus ? [c, b] : [a, c], ans = x - y;
  return {
    ans,
    steps: [S('', `? = ${m(x)} − ${m(y)}`, plus ? 'undoAdd' : 'undoSub', { a: m(x), b: m(y) }), ...columnSteps(x, '−', y)],
    oops: colOops(ans, '−', given, x, y),
  };
}
// a ± b ≈ ?: work it out, then find the nearest hundred.
function estimate({ a, b, plus }, q, given) {
  const c = plus ? a + b : a - b, lo = Math.floor(c / 100) * 100, ans = Math.round(c / 100) * 100;
  const d1 = c - lo, d2 = lo + 100 - c;
  return {
    ans,
    steps: [S('', `${a} ${plus ? '+' : '−'} ${b} = ${c}`, 'estWork'),
      S(nline(lo, lo + 100, { jumps: [[c, lo, '−' + d1, d1 < d2 ? MINT : GREY], [c, lo + 100, '+' + d2, d2 < d1 ? MINT : GREY]], marks: [[c, RED, '']] }), `${c} ≈ ${ans}`, 'roundNear', { a: c, b: ans, c: Math.min(d1, d2) })],
    oops: given !== undefined && given !== ans && Math.abs(given - ans) === 100 ? OOPS(`${c} ≈ ${ans}`, 'oopsFar') : null,
  };
}

// ---------- bigger × ----------
const partsOf = a => [...String(a)].map((d, k, s) => +d * pow10(s.length - 1 - k)).filter(Boolean);
// 23 × 4 = 20 × 4 + 3 × 4, drawn as the rectangle in the question.
function mulSplit({ a, b }, q, given) {
  const ps = partsOf(a), prods = ps.map(p => p * b), c = a * b;
  const steps = [
    S(q.visual, `${a} = ${ps.join(' + ')}`, 'mulSplit'),
    S(q.visual, ps.map((p, i) => `${p} × ${b} = ${prods[i]}`).join('<br>'), 'mulEach', { a: b }),
    S('', `${prods.join(' + ')} = ${c}`, 'addParts'),
  ];
  const lost = ps.length > 1 && given !== undefined && given !== c && prods.some(p => given === c - p + p / b);
  return { ans: c, steps, oops: lost ? OOPS(`${ps.join(' + ')} → × ${b}`, 'oopsPartMul', { a: b }) : null };
}
// ? × b = c: undo with ÷, taking out a big chunk of tens first.
function mulBack({ a, b }, q, given) {
  const c = a * b, t = Math.floor(a / 10) * 10, o = a - t;
  const steps = [S('', `? = ${c} ÷ ${b}`, 'undoTimes', { a: b })];
  if (t && o) steps.push(S('', `${b} × ${t} = ${b * t}<br>${c} − ${b * t} = ${c - b * t}<br>${b} × ${o} = ${o * b}`, 'chunks'), S(q.visual, `? = ${t} + ${o} = ${a}`, 'checkTimes', { a, b, c }));
  else steps.push(S(q.visual, `${b} × ${a} = ${c}`, 'checkTimes', { a, b, c }));
  return { ans: a, steps, oops: given !== undefined && Math.abs(given - a) === 1 ? OOPS(`${given} × ${b} = ${given * b}`, 'oopsOne') : null };
}
// 2-digit × 2-digit: four parts of the rectangle.
function mul2x2({ a, b }, q, given) {
  const [at, ao, bt, bo] = [a - (a % 10), a % 10, b - (b % 10), b % 10], c = a * b;
  const ps = [[at, bt], [ao, bt], [at, bo], [ao, bo]];
  const forgot = at * bt + ao * bo;
  return {
    ans: c,
    steps: [S(q.visual, `${a} = ${at} + ${ao}<br>${b} = ${bt} + ${bo}`, 'cut4'),
      S(q.visual, ps.map(([x, y]) => `${x} × ${y} = ${x * y}`).join('<br>'), 'mulEachPart'),
      S('', `${ps.map(([x, y]) => x * y).join(' + ')} = ${c}`, 'addParts')],
    oops: given === forgot ? OOPS(`${at * bt} + ${ao * bt} + ${at * bo} + ${ao * bo}`, 'oopsFour') : null,
  };
}
// Split a × b into tens and ones when it is too big to draw.
const mulLines = (a, b) => { const ps = partsOf(a); return ps.length > 1 ? `${ps.map(p => `${p} × ${b} = ${p * b}`).join('<br>')}<br>${ps.map(p => p * b).join(' + ')} = ${a * b}` : `${a} × ${b} = ${a * b}`; };

// ---------- sharing and dividing ----------
// n ÷ k = q with one of the three hidden. Small ones are drawn as k rows of q.
function div({ n, k, q: each, hole = 'q' }, q, given) {
  const pic = n <= 60 ? dots(k, each) : '';
  let ans, steps;
  if (hole === 'q') {
    ans = each;
    steps = [S(pic, `${n} ÷ ${k} = ?`, 'shareRows', { a: n, b: k }), S(pic, `${k} × ${each} = ${n}`, 'divCheck', { a: k, b: each, c: n })];
  } else if (hole === 'n') {
    ans = n;
    steps = [S(pic, n <= 100 ? `${k} × ${each} = ${n}` : mulLines(each, k), 'divWhole', { a: k, b: each })];
  } else {
    ans = k;
    steps = [S(pic, `${each} × ? = ${n}<br>${n} ÷ ${each} = ${k}`, 'divGroups', { a: each, b: n })];
  }
  return { ans, steps, oops: given !== undefined && Math.abs(given - ans) === 1 ? OOPS(`${n} ÷ ${k} = ${each}`, 'oopsOne') : null };
}
// n ÷ k with fish left over.
function rem({ n, k, hole = 'r' }, q, given) {
  const each = Math.floor(n / k), r = n - each * k;
  const pic = n <= 60 && each ? row(dots(k, each), big('+'), dots(1, r || 1)) : '';
  if (hole === 'n') return { ans: n, steps: [S(pic, `${k} × ${each} + ${r} = ${n}`, 'remBack', { a: r })] };
  return {
    ans: r,
    steps: [S(pic, `${k} × ${each} = ${k * each}`, 'remFit', { a: k, b: each }), S(pic, `${n} − ${k * each} = ${r}`, 'remLeft', { a: r })],
    oops: given !== undefined && given >= k ? OOPS(`${given} ≥ ${k}`, 'oopsRemBig', { a: k }) : null,
  };
}
// Long division as dealing: the biggest blocks first, leftovers broken into the next size.
function longdiv({ n, k, digit: di = null }, q, given) {
  const s = String(n), qv = n / k, steps = [];
  let left = 0, got = 0, started = false;
  for (let i = 0; i < s.length; i++) {
    const p = s.length - 1 - i, have = left * 10 + +s[i], each = Math.floor(have / k);
    left = have - each * k;
    got += each * pow10(p);
    if (!started && !each) continue;
    const math = `${m(have * pow10(p))} ÷ ${k} = ${m(each * pow10(p))}${left ? `<br>${m(left * pow10(p))} 🐟` : ''}`;
    steps.push(S(chests(k, m(got)), math, !started ? 'dealFirst' : 'dealNext', { a: m(left * pow10(p)) }));
    if (left && p) steps[steps.length - 1].say += ' ' + S('', '', 'dealBreak').say;
    started = true;
  }
  steps.push(S(chests(k, m(qv)), `${k} × ${qv} = ${n}`, 'divCheck', { a: k, b: qv, c: n }));
  const ans = di === null ? qv : +String(qv)[di];
  const naive = +[...s].map(d => Math.floor(+d / k)).join('');
  return { ans, steps, oops: di === null && given === naive && naive !== qv ? OOPS(`${n} ÷ ${k} = ${qv}`, 'oopsDealLeft') : null };
}

// ---------- puzzles ----------
// One digit is hidden: find the whole missing number first.
function mdigit({ x, y, z, plus, which, pos }, q) {
  const v = plus ? (which ? z - x : z - y) : which ? x - z : z + y;
  const expr = plus ? `${z} − ${which ? x : y}` : which ? `${x} − ${z}` : `${z} + ${y}`;
  const s = String(v), shown = s.slice(0, pos) + '?' + s.slice(pos + 1), col = s.length - 1 - pos;
  return {
    ans: +s[pos],
    steps: [S('', `${shown} = ${expr} = ${v}`, 'mdWhole'), S(digitRows([{ s: shown, hi: [col] }, { s, hi: [col] }], { band: col }), `? = ${s[pos]}`, 'mdDigit')],
  };
}
// ? → × m → ± a → out: run the machine backwards.
function machine({ m: k, a, plus, out }, q, given) {
  const v = plus ? out - a : out + a, x = v / k, arcs = ['×' + k, (plus ? '+' : '−') + a];
  return {
    ans: x,
    steps: [S(tiles([null, null, out], { arcs }), '', 'machineBack'),
      S(tiles([null, v, out], { arcs }), `${out} ${plus ? '−' : '+'} ${a} = ${v}`, 'undoLast', { a: (plus ? '+' : '−') + a }),
      S(tiles([{ v: x, hi: true }, v, out], { arcs }), `${v} ÷ ${k} = ${x}`, 'undoFirst', { a: '×' + k })],
    oops: given !== undefined && given !== x && given === Math.round(out / k) ? OOPS(`${out} ${plus ? '−' : '+'} ${a} = ${v}`, 'oopsOrder') : null,
  };
}
// How many squares hide in the grid? Every size in turn.
function squares({ n }, q) {
  const steps = [], counts = [];
  for (let s = 1; s <= n; s++) {
    const pics = [];
    for (let y = 0; y + s <= n; y++) for (let x = 0; x + s <= n; x++) pics.push(sqGrid(n, s, x, y, n === 2 ? 58 : 46));
    counts.push(pics.length);
    steps.push(S(gallery(pics), `${pics.length}`, 'sqSize', { a: s, b: pics.length }));
  }
  const ans = counts.reduce((x, y) => x + y, 0);
  steps.push(S('', `${counts.join(' + ')} = ${ans}`, 'sqTotal'));
  return { ans, steps };
}
// A staircase has the same fence as its whole rectangle.
function stairs({ w, h }, q, given) {
  const per = 2 * (w + h);
  return {
    ans: per,
    steps: [S(q.visual, '', 'stairsPush'), S(gridPic(w, h, { labels: true, fence: true }), `${w} + ${h} + ${w} + ${h} = ${per}`, 'perimWalk')],
    oops: given !== undefined && given !== per && given < per - 2 ? OOPS(`${per}`, 'oopsArea') : null,
  };
}
// ½ × 1/k × whole: half first, then the k parts.
function fracChain({ k, whole }, q) {
  const h = whole / 2, v = h / k;
  return {
    ans: v,
    steps: [S(tiles([whole, { v: h, hi: true }, null], { arcs: ['÷2', '÷' + k] }), `${frac(1, 2)} × ${whole} = ${h}`, 'halfOf', { a: whole, b: h }),
      S(tiles([whole, h, { v, hi: true }], { arcs: ['÷2', '÷' + k] }), `${frac(1, k)} × ${h} = ${v}`, 'thenPart', { a: k })],
  };
}

// ---------- fractions ----------
const parseFrac = v => { const x = /^(\d+)\/(\d+)$/.exec(String(v)); return x ? [+x[1], +x[2]] : null; };
function fracName({ s, k }, q, given) {
  const g = parseFrac(given);
  let oops = null;
  if (g && (g[0] !== s || g[1] !== k)) {
    oops = g[0] === k - s && g[1] === k ? OOPS(frac(k - s, k), 'oopsEmpty')
      : g[0] === k && g[1] === s ? OOPS(frac(k, s), 'oopsFlip')
      : g[1] !== k ? OOPS(`${k}`, 'oopsCountPieces') : null;
  }
  return { ans: `${s}/${k}`, steps: [S(q.visual, frac(s, k), 'fracName', { a: k, b: s })], oops };
}
// Compare two fractions: same pieces, same count, or cut them the same.
function fracCmp({ n1, d1, n2, d2 }, q, given) {
  const sym = SYM(n1 * d2, n2 * d1), line = `${frac(n1, d1)} ${esc(sym)} ${frac(n2, d2)}`, steps = [];
  if (d1 === d2) steps.push(S(fbars([[d1, n1], [d2, n2]]), line, 'fracSameBottom'));
  else if (n1 === n2) steps.push(S(fbars([[d1, n1], [d2, n2]]), line, 'fracSameTop'));
  else {
    const L = lcm(d1, d2);
    steps.push(S(fbars([[d1, n1], [d2, n2]]), '', 'fracLook'));
    if (L <= 24) steps.push(S(fbars([[L, (n1 * L) / d1], [L, (n2 * L) / d2]]), `${frac((n1 * L) / d1, L)} ${esc(sym)} ${frac((n2 * L) / d2, L)}`, 'fracSameCut'));
    steps.push(S('', line, ''));
  }
  const bigBottom = n1 === n2 && d1 !== d2;
  return { ans: sym, steps, oops: given && given !== sym ? OOPS(line, bigBottom ? 'oopsFracBottom' : 'oopsSym') : null };
}
// n/d of a whole: cut into d groups, take n of them.
function fracOf({ n, d, whole }, q, given) {
  const k = whole / d, ans = n * k, pic = d <= 10 && k <= 12 ? dots(d, k) : '';
  const steps = [S(pic, `${whole} ÷ ${d} = ${k}`, 'fracOf1', { a: whole, b: d, c: k })];
  if (n > 1) steps.push(S(pic && dots(d, k, { tint: n }), `${n} × ${k} = ${ans}`, 'fracOfN', { a: n }));
  let oops = null;
  if (given !== undefined && given !== ans) {
    if (given === k && n > 1) oops = OOPS(`${n} × ${k} = ${ans}`, 'oopsOnePart', { a: n });
    else if (given === whole - ans) oops = OOPS(`${whole} − ${given} = ${ans}`, 'oopsRest');
  }
  return { ans, steps, oops };
}
// Tap every fraction worth the same: the same number times the top and the bottom.
function fracAll({ a, b }, q) {
  const items = q.items.map(it => parseFrac(plain(it.html).replace(' ', '/')));
  if (items.some(x => !x)) return null;
  const same = ([n, d]) => n * b === d * a;
  const good = items.filter(same);
  const rows = items.map(([n, d]) => {
    const k = n / a;
    return [same([n, d]) ? `${frac(n, d)} = ${frac(`${a}×${k}`, `${b}×${k}`)}` : `${frac(n, d)} ≠ ${frac(a, b)}`, same([n, d])];
  });
  const bars = [[b, a], ...good.map(([n, d]) => [d, n])].slice(0, 4);
  return {
    ans: items.map(x => (same(x) ? 1 : 0)).join(''),
    steps: [S(fbars(bars), '', 'fracSameAmount'), S(checks(rows), `= ${frac(a, b)}`, 'fracTimesBoth')],
  };
}

// ---------- time ----------
function clockSol({ h, m: mm }, q, given) {
  const ans = hm(h, mm);
  const steps = [
    S(clockPic(h, mm, { hi: 'h' }), `${h}`, mm ? 'clockPast' : 'clockHour', { a: h }),
    S(clockPic(h, mm, { hi: 'm', fives: true }), mm ? `${mm / 5} × 5 = ${mm}` : ':00', 'clockMin'),
    S('', ans, ''),
  ];
  let oops = null;
  if (given && given !== ans) {
    const [gh, gm] = String(given).split(':').map(Number);
    if (gm === mm && mm && Math.abs(gh - h) % 10 === 1) oops = OOPS(`${h}`, 'oopsHourHand');
    else if (gh === (mm / 5 || 12)) oops = OOPS(ans, 'oopsHands');
  }
  return { ans, steps, oops };
}
function clockAdd({ h, m: mm, add }, q, given) {
  const t = h * 60 + mm + add, h2 = ((Math.floor(t / 60) - 1) % 12) + 1, m2 = t % 60, ans = hm(h2, m2), start = hm(h, mm);
  const steps = [S(clockPic(h, mm), start, 'clockStart', { a: start })];
  if (mm + add >= 60) {
    const first = 60 - mm, next = hm((h % 12) + 1, 0);
    steps.push(S(tiles([start, next, { v: ans, hi: true }], { arcs: ['+' + first, '+' + (add - first)] }), `${start} + ${add} = ${ans}`, 'toHour', { a: first, b: add - first }));
  } else steps.push(S(tiles([start, { v: ans, hi: true }], { arcs: ['+' + add] }), `${start} + ${add} = ${ans}`, 'addMin', { a: add }));
  return { ans, steps, oops: given && given === hm(h, (mm + add) % 60) && mm + add >= 60 ? OOPS(ans, 'oopsNextHour') : null };
}

// ---------- angles ----------
function angleCmp({ d1, d2 }, q, given) {
  const sym = SYM(d1, d2);
  return {
    ans: sym,
    steps: [S(angleOverlay(d1, d2), `${dotOf('red')} ${esc(sym)} ${dotOf('blue')}`, d1 === d2 ? 'angleSame' : 'angleOverlay'), S('', `${d1}° ${esc(sym)} ${d2}°`, '')],
    oops: given && given !== sym ? OOPS(`${d1}° ${esc(sym)} ${d2}°`, 'oopsArms') : null,
  };
}
function angleDeg({ d }, q, given) {
  const unit = d <= 60 ? 15 : d % 30 === 0 ? 30 : 45;
  const key = d < 90 ? 'angleLess90' : d === 90 ? 'angle90' : d < 180 ? 'angleMore90' : 'angle180';
  return {
    ans: d,
    steps: [S(angleFan(d, unit), `${d / unit} × ${unit}° = ${d}°`, 'angleSlices', { a: unit }), S(d === 90 || d === 180 ? '' : angleOverlay(d, 90), `${d}° ${esc(SYM(d, 90))} 90°`, key)],
    oops: given === 180 - d && d !== 90 ? OOPS(`180° − ${d}° = ${180 - d}°`, 'oopsOther') : null,
  };
}
function straight({ a }, q, given) {
  return {
    ans: 180 - a,
    steps: [S(q.visual, `180° − ${a}° = ${180 - a}°`, 'straight180')],
    oops: given === 360 - a || given === 90 - a ? OOPS(`180°`, 'oops180') : null,
  };
}
// Tap every one that is right: the items know which are; the sheet shows them and why.
function marked({ key, lead }, q) {
  const pics = q.items.map(it => `<div class="${it.ok ? 'ok' : 'no'}">${it.html}<b>${it.ok ? '✓' : '✗'}</b></div>`);
  const steps = [S(gallery(pics, 'shapes'), '', key)];
  if (lead) steps.unshift(S(q.target, '90°', lead));
  return { ans: q.items.map(it => (it.ok ? 1 : 0)).join(''), steps };
}

// ---------- area and fences ----------
function area({ w, h, cut }, q, given) {
  const whole = w * h, ans = cut ? whole - cut[0] * cut[1] : whole;
  const steps = cut
    ? [S(gridPic(w, h, { cut }), `${w} × ${h} = ${whole}`, 'areaWhole'), S(gridPic(w, h, { cut }), `${cut[0]} × ${cut[1]} = ${cut[0] * cut[1]}<br>${whole} − ${cut[0] * cut[1]} = ${ans}`, 'areaCut')]
    : [S(gridPic(w, h, { rowsHi: true }), `${h} × ${w} = ${ans}`, 'areaRows', { a: h, b: w })];
  return { ans, steps, oops: given === 2 * (w + h) ? OOPS(`${ans}`, 'oopsFence') : null };
}
function perim({ w, h, cut }, q, given) {
  const per = 2 * (w + h), steps = [];
  if (cut) steps.push(S(gridPic(w, h, { cut, fence: true, push: true }), '', 'perimL'));
  steps.push(S(gridPic(w, h, { labels: true, fence: true }), `${w} + ${h} + ${w} + ${h} = ${per}`, 'perimWalk'));
  const cells = cut ? w * h - cut[0] * cut[1] : w * h;
  let oops = null;
  if (given === cells && cells !== per) oops = OOPS(`${per}`, 'oopsArea');
  else if (given === per - 2 || given === per + 2 || given === w + h) oops = OOPS(`${w} + ${h} + ${w} + ${h}`, 'oopsSide');
  return { ans: per, steps, oops };
}
// Which rectangle has this many squares? Rows × columns for each.
function build({ target }, q) {
  const rows = q.choices.map(c => { const [x, y] = String(c.value).split('x').map(Number); return [`${x} × ${y} = ${x * y}`, x * y === target, c.value]; });
  return { ans: rows.find(r => r[1])?.[2], steps: [S(checks(rows), `= ${target}`, 'buildCheck')] };
}

// ---------- shapes ----------
const ptsOf = html => polyPoints(html);
function parallel(sol, q) {
  const pts = ptsOf(q.visual), n = parallelPairs(pts).length;
  return { ans: n, steps: [S(shapeFacts(pts, { par: true }), `${n}`, n ? 'parSides' : 'parNone')] };
}
function oddPar(sol, q) {
  const counts = q.choices.map(c => parallelPairs(ptsOf(c.html)).length);
  const odd = counts.findIndex(c => c < 2);
  const pics = q.choices.map((c, i) => `<div class="${i === odd ? 'ok' : 'no'}">${shapeFacts(ptsOf(c.html), { par: true, size: 62 })}<b>${counts[i]}</b></div>`);
  return { ans: q.choices[odd]?.value, steps: [S(gallery(pics, 'shapes'), '', 'oddPar')] };
}
const TESTS = { right: pts => rightCorners(pts).length > 0, par: pts => parallelPairs(pts).length > 0, eq: allSidesEqual };
function shapeProp({ prop }, q) {
  const ok = q.items.map(it => TESTS[prop](ptsOf(it.html)));
  const pics = q.items.map((it, i) => {
    const pts = ptsOf(it.html);
    return `<div class="${ok[i] ? 'ok' : 'no'}">${shapeFacts(pts, { [prop]: prop !== 'eq' || ok[i], size: 62 })}<b>${ok[i] ? '✓' : '✗'}</b></div>`;
  });
  return { ans: ok.map(x => (x ? 1 : 0)).join(''), steps: [S(q.target, '', { right: 'propRight', par: 'propPar', eq: 'propEq' }[prop]), S(gallery(pics, 'shapes'), '', 'propCheck')] };
}

// ---------- turns and nets ----------
const normC = cs => { const mx = Math.min(...cs.map(c => c[0])), my = Math.min(...cs.map(c => c[1])); return cs.map(([x, y]) => [x - mx, y - my]); };
const keyOf = cs => normC(cs).map(c => c.join(',')).sort().join(' ');
const cellsOf = key => String(key).split(' ').map(p => p.split(',').map(Number));
function turn({ base }, q) {
  const rots = [normC(base)];
  for (let i = 0; i < 3; i++) rots.push(normC(rots[i].map(([x, y]) => [-y, x])));
  const keys = new Set(rots.map(keyOf));
  const hit = q.choices.find(c => keys.has(String(c.value)));
  const pics = q.choices.map(c => `<div class="${c === hit ? 'ok' : 'no'}">${cellsPic(cellsOf(c.value), { size: 62 })}<b>${c === hit ? '✓' : '✗'}</b></div>`);
  return {
    ans: hit?.value,
    steps: [S(gallery(rots.map(r => cellsPic(r, { size: 58, hi: keyOf(r) === hit?.value }))), '↻ ↻ ↻', 'turnAll'), S(gallery(pics, 'shapes'), '', 'turnFlip')],
  };
}
// Roll a die over the net: which face does each square land on? Two squares on one face means no cube.
function faces(cs) {
  const at = new Map(cs.map((c, i) => [c.join(','), i])), out = Array(cs.length).fill(null);
  const roll = (d, dx, dy) => (dy === -1 ? { ...d, b: d.n, s: d.b, t: d.s, n: d.t } : dy === 1 ? { ...d, b: d.s, n: d.b, t: d.n, s: d.t }
    : dx === 1 ? { ...d, b: d.e, w: d.b, t: d.w, e: d.t } : { ...d, b: d.w, e: d.b, t: d.e, w: d.t });
  const seen = new Map([[0, { t: 't', b: 'b', n: 'n', s: 's', e: 'e', w: 'w' }]]), queue = [0];
  out[0] = 'b';
  while (queue.length) {
    const i = queue.shift(), [x, y] = cs[i], d = seen.get(i);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const j = at.get(`${x + dx},${y + dy}`);
      if (j !== undefined && !seen.has(j)) { const nd = roll(d, dx, dy); seen.set(j, nd); out[j] = nd.b; queue.push(j); }
    }
  }
  return out;
}
function net(sol, q) {
  const info = q.choices.map(c => {
    const cs = cellsOf(c.value), f = faces(cs), taken = new Set(), bad = [];
    f.forEach((x, i) => { if (taken.has(x)) bad.push(i); taken.add(x); });
    return { c, cs, f, bad, ok: cs.length === 6 && !bad.length };
  });
  const good = info.find(x => x.ok);
  const num = { b: 1, t: 6, n: 2, s: 5, e: 3, w: 4 };
  const pics = info.map(x => `<div class="${x.ok ? 'ok' : 'no'}">${cellsPic(x.cs, { size: 62, color: '#ffc23d', bad: x.bad })}<b>${x.ok ? '✓' : '✗'}</b></div>`);
  const steps = [];
  if (good) steps.push(S(cellsPic(good.cs, { size: 150, color: '#ffc23d', faces: good.f.map(x => num[x]) }), '1 2 3 4 5 6', 'netFaces'));
  steps.push(S(gallery(pics, 'shapes'), '', 'netBad'));
  return { ans: good?.c.value, steps };
}

// ---------- chances and charts ----------
// Count each colour; the most is the most likely. counts: { colour: n } or spinner pieces [[colour, n], …].
function most({ counts, sectors }, q, given) {
  const tally = {};
  (sectors || Object.entries(counts)).forEach(([c, k]) => { tally[c] = (tally[c] || 0) + k; });
  const list = Object.entries(tally), best = list.reduce((x, y) => (y[1] > x[1] ? y : x))[0];
  const steps = [S(colorRows(list, { mark: best }), list.map(([c, k]) => `${dotOf(c)} ${k}`).join('&nbsp; '), sectors ? 'spinParts' : 'mostCount')];
  if (sectors) steps.unshift(S(q.visual, '', 'spinLook'));
  return { ans: best, steps, oops: given && given !== best && tally[given] !== undefined ? OOPS(`${tally[given]} < ${tally[best]}`, 'oopsFewer') : null };
}
function bagCount({ counts, c }, q, given) {
  const list = Object.entries(counts), total = list.reduce((s, x) => s + x[1], 0), k = counts[c];
  let oops = null;
  if (given === total - k) oops = OOPS(`${total} − ${k} = ${total - k}`, 'oopsOtherColours');
  else if (given === total) oops = OOPS(`${total}`, 'oopsAll');
  return { ans: k, steps: [S(colorRows(list, { mark: c }), `${dotOf(c)} = ${frac(k, total)}`, 'bagOf', { a: k, b: total })], oops };
}
function bags({ r1, o1, r2, o2 }, q, given) {
  const t1 = r1 + o1, t2 = r2 + o2, sym = SYM(r1 * t2, r2 * t1), ans = sym === '>' ? 'a' : 'b';
  const steps = [S(fbars([[t1, r1], [t2, r2]], { cols: [RED, RED] }), `${frac(r1, t1)} ${esc(sym)} ${frac(r2, t2)}`, 'bagsPart')];
  const moreRed = (r1 > r2) !== (sym === '>');
  return { ans, steps, oops: given && given !== ans && moreRed ? OOPS(`${frac(r1, t1)} ${esc(sym)} ${frac(r2, t2)}`, 'oopsMoreRed') : null };
}
function chart({ labels, vals, ask, i, j }, q, given) {
  if (ask === 'top') {
    const k = vals.indexOf(Math.max(...vals));
    return { ans: labels[k], steps: [S(q.visual, `${labels[k]} ${vals[k]}`, 'chartTallest')] };
  }
  if (ask === 'read') return { ans: vals[i], steps: [S(q.visual, `${labels[i]} = ${vals[i]}`, 'chartRead')] };
  const d = vals[i] - vals[j];
  return {
    ans: d,
    steps: [S(q.visual, `${labels[i]} = ${vals[i]}<br>${labels[j]} = ${vals[j]}`, 'chartRead'), S('', `${vals[i]} − ${vals[j]} = ${d}`, 'chartDiff')],
    oops: given === vals[i] + vals[j] ? OOPS(`${vals[i]} − ${vals[j]} = ${d}`, 'oopsAdded') : null,
  };
}
function die({ counts }, q) {
  const k = counts.indexOf(Math.max(...counts)) + 1;
  return { ans: k, steps: [S(q.visual, `🎲 ${k} → ${counts[k - 1]}`, 'dieFair', { a: k })] };
}

// ---------- picture stories ----------
// Evaluate "k × b + c", "n ÷ k − c" or "pay − k × p": × and ÷ first.
const OP = { '+': (x, y) => x + y, '−': (x, y) => x - y, '×': (x, y) => x * y, '÷': (x, y) => x / y };
function story2({ expr }, q, given) {
  const [x, o1, y, o2, z] = expr.split(' ').map((t, i) => (i % 2 ? t : +t));
  const firstLeft = o1 === '×' || o1 === '÷' || !(o2 === '×' || o2 === '÷');
  const mid = firstLeft ? OP[o1](x, y) : OP[o2](y, z), v = firstLeft ? OP[o2](mid, z) : OP[o1](x, mid);
  const ans = q.input === 'choice' && typeof q.answer === 'string' && isNaN(q.answer) ? expr : v;
  return {
    ans,
    steps: [S(q.visual, expr, 'storyPlan'),
      S('', firstLeft ? `${x} ${o1} ${y} = ${mid}` : `${y} ${o2} ${z} = ${mid}`, 'firstTimes'),
      S('', firstLeft ? `${mid} ${o2} ${z} = ${v}` : `${x} ${o1} ${mid} = ${v}`, 'storyFinish', { a: v })],
  };
}

export const OCEAN_SOLVERS = {
  placeval, digitval, zoom, zeros, round: roundSol, col: colSol, tfCol, colMissing, estimate, mulSplit, mulBack, mul2x2,
  div, rem, longdiv, mdigit, machine, squares, stairs, fracChain, fracName, fracCmp, fracOf, fracAll,
  clock: clockSol, clockAdd, angleCmp, angleDeg, straight, marked, area, perim, build, parallel, oddPar, shapeProp,
  turn, net, most, bagCount, bags, chart, die, story2,
};
