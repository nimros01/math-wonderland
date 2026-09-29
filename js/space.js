// Space (world 6): the four-quarter star map, picture equations and pairs of equations (swap it in,
// stack and cancel, x and y), rule machines, picture stories, logic grids and a fast mixed round.
import { R, pick, chance, shuffle, numQ } from './skills.js';
import { M, X, intQ, tfOwn } from './volcano.js';

const INK = '#1e2650', SKY = '#3e9be0', RED = '#ef5b52', GOLD = '#ffc23d', VIOLET = '#8a5cf6', GREEN = '#2fb383';
const svg = (w, h, body, size = '') => `<svg class="shape" viewBox="0 0 ${w} ${h}" ${size || `width="${w}" height="${h}"`}>${body}</svg>`;
const txt = (x, y, t, s = 14, extra = '') => `<text x="${x}" y="${y}" font-size="${s}" font-weight="800" fill="${INK}" text-anchor="middle" dominant-baseline="central" ${extra}>${t}</text>`;
const Y = '<i class="vx vy">y</i>';
const SLOT = '<span class="slot">?</span>';
const pair = (x, y) => `(${M(x)}, ${M(y)})`;

// Bubbles with text values (points, rules): the answer plus up to three different wrong ones.
function textQ(eq, ans, wrongs, extra = {}) {
  const vals = [String(ans)];
  for (const w of shuffle(wrongs.map(String))) if (vals.length < 4 && !vals.includes(w)) vals.push(w);
  // Points go four in a row, which leaves the star map as much room as possible on small phones.
  const pts = String(ans).startsWith('(');
  return { eq, answer: String(ans), input: 'choice', layout: pts ? 'row pts' : 'grid', visual: null, show: false, ...extra,
    choices: shuffle(vals).map(v => ({ value: v, html: v.startsWith('(') ? `<span class="pt">${v.replace(', ', ',&#8201;')}</span>` : v })) };
}
// A few equations stacked, one per line; each line is HTML.
const sys = (rows, cls = '') => `<div class="sys ${cls}">${rows.map(r => `<div>${r}</div>`).join('')}</div>`;
// Picture numbers: each picture stands for a secret number.
const PICS = ['☀️', '🚀', '⭐', '🌙', '🛸', '👽'];
const pics = k => shuffle(PICS.slice()).slice(0, k);
const rep = (a, k, op = '+') => Array(k).fill(a).join(` ${op} `);
const times = (k, a) => (k === 1 ? a : `${k}${a}`);
// Two different secret numbers, the bigger one first, spread evenly over all pairs up to top.
function bigSmall(top) {
  for (;;) { const a = R(2, top), b = R(1, top - 1); if (b < a) return [a, b]; }
}

// ---------- 1. The four-quarter star map ----------
// A coordinate plane from −n to n both ways. marks: [x, y, emoji]. lines: [[m, c, colour]] for y = m·x + c.
function plane(n, marks, { mirror = null, lines = [] } = {}) {
  // The numbers sit along the bottom and left edges, clear of the axes and of each other.
  const u = Math.floor(220 / (2 * n)), P = 30, S = 2 * n * u, W = S + P + 14;
  const px = x => P + (x + n) * u, py = y => 13 + (n - y) * u;
  const T = 13, L = P;
  let body = `<rect x="${L}" y="${T}" width="${S}" height="${S}" fill="#eef0ff" rx="4"/>`;
  for (let i = -n; i <= n; i++) {
    body += `<line x1="${px(i)}" y1="${T}" x2="${px(i)}" y2="${T + S}" stroke="#c9cdf0" stroke-width="1"/><line x1="${L}" y1="${py(i)}" x2="${L + S}" y2="${py(i)}" stroke="#c9cdf0" stroke-width="1"/>`;
    body += txt(px(i), T + S + 11, M(i), 15, 'letter-spacing="-1"') + txt(L - 13, py(i), M(i), 15, 'letter-spacing="-1"');
  }
  const axis = (x1, y1, x2, y2, red) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${red ? RED : INK}" stroke-width="${red ? 5 : 2.5}" ${red ? 'stroke-dasharray="8 5"' : ''}/>`;
  body += axis(L, py(0), L + S, py(0), mirror === 'x') + axis(px(0), T, px(0), T + S, mirror === 'y');
  for (const [m, c, col] of lines) {
    // Clip y = m·x + c to the square.
    let xs = [-n, n];
    if (m) xs = [Math.max(-n, Math.min((-n - c) / m, (n - c) / m)), Math.min(n, Math.max((-n - c) / m, (n - c) / m))];
    body += `<line x1="${px(xs[0]).toFixed(1)}" y1="${py(m * xs[0] + c).toFixed(1)}" x2="${px(xs[1]).toFixed(1)}" y2="${py(m * xs[1] + c).toFixed(1)}" stroke="${col}" stroke-width="4" stroke-linecap="round"/>`;
  }
  for (const [x, y, t] of marks) body += `<text x="${px(x)}" y="${py(y)}" font-size="${Math.min(22, u + 2)}" text-anchor="middle" dominant-baseline="central">${t}</text>`;
  const Ht = S + T + 24, k = 290 / W;
  return svg(W, Ht, body, `width="290" height="${Math.round(Ht * k)}" style="max-width:100%;height:auto"`);
}
const THINGS = ['🛰️', '🚀', '⭐', '🌙', '🛸', '👽', '☄️', '🌍'];
function genGrid(lvl) {
  const n = lvl ? 5 : 4, lim = n - 1;
  const kind = pick([['read', 'find', 'move', 'find'], ['read', 'find', 'move', 'dist', 'mirror'], ['move', 'dist', 'mirror', 'read', 'find']][lvl]);
  const nz = () => (chance(0.5) ? -1 : 1) * R(1, lim);
  let x = nz(), y = nz();
  if (Math.abs(x) === Math.abs(y) || (x > 0 && y > 0)) return genGrid(lvl);
  const th = shuffle(THINGS.slice()).slice(0, 4);
  if (kind === 'read') {
    return textQ(`${th[0]} = ?`, pair(x, y), [pair(y, x), pair(-x, y), pair(x, -y), pair(-x, -y)], { visual: plane(n, [[x, y, th[0]]]), show: true, read: true, sol: { t: 'sGrid', ask: 'read', n, x, y, e: th[0] } });
  }
  if (kind === 'find') {
    // The decoys sit where a swapped or flipped pair would put them.
    const spots = [[x, y], ...shuffle([[-x, y], [x, -y], [y, x], [-y, -x]]).slice(0, 3)];
    const marks = spots.map(([a, b], i) => [a, b, th[i]]);
    return { eq: `${pair(x, y)} = ?`, answer: th[0], input: 'choice', layout: 'row', visual: plane(n, marks), show: true,
      choices: shuffle(th.map(t => ({ value: t, html: t }))), find: true, sol: { t: 'sGrid', ask: 'find', n, x, y, marks } };
  }
  if (kind === 'move') {
    const dx = nz() % 4 || 1, dy = nz() % 4 || 1, ex = x + dx, ey = y + dy;
    if (Math.abs(ex) > lim || Math.abs(ey) > lim || (!ex && !ey)) return genGrid(lvl);
    const arrows = `${Math.abs(dx)} ${dx > 0 ? '➡️' : '⬅️'} ${Math.abs(dy)} ${dy > 0 ? '⬆️' : '⬇️'}`;
    return textQ(`👽 ➜ ${arrows} = ?`, pair(ex, ey), [pair(x - dx, y + dy), pair(x + dx, y - dy), pair(x + dy, y + dx), pair(dx, dy), pair(ex, -ey)],
      { visual: plane(n, [[x, y, '👽']]), show: true, move: true, sol: { t: 'sGrid', ask: 'move', n, x, y, dx, dy } });
  }
  if (kind === 'dist') {
    // Two things on one line across the middle: how many steps apart?
    const a = -R(1, lim), b = R(1, lim), k = nz(), across = chance(0.5);
    const [p1, p2] = across ? [[a, k], [b, k]] : [[k, a], [k, b]];
    const d = b - a;
    return numQ(`${th[0]} ↔ ${th[1]} = ?`, d, [b + a, Math.abs(b + a), d + 1, d - 1, -a].filter(v => v > 0 && v !== d),
      { visual: plane(n, [[...p1, th[0]], [...p2, th[1]]]), show: true, dist: true, sol: { t: 'sGrid', ask: 'dist', n, p1, p2, e: th[0], e2: th[1] } });
  }
  // Mirror in the red axis.
  const ax = pick(['x', 'y']), mx = ax === 'y' ? -x : x, my = ax === 'x' ? -y : y;
  return textQ(`${th[0]} <span class="mirr"></span> = ?`, pair(mx, my), [pair(x, y), pair(-x, -y), pair(ax === 'y' ? x : -x, ax === 'x' ? y : -y), pair(y, x)],
    { visual: plane(n, [[x, y, th[0]]], { mirror: ax }), show: true, mirror: true, sol: { t: 'sGrid', ask: 'mirror', n, x, y, ax, e: th[0] } });
}

// ---------- 2. Picture pairs: each picture is a number ----------
function genPair(lvl) {
  const kind = pick([['dbl', 'pair', 'pair'], ['pair', 'chain', 'tri', 'pair'], ['chain', 'tri', 'chainx', 'sum3']][lvl]);
  const top = lvl ? 12 : 10, [A, B, C] = pics(3);
  const a = R(1, top), b = R(1, top), c = R(1, top);
  if (new Set([a, b, c]).size < 3) return genPair(lvl);
  if (kind === 'dbl') {
    const k = R(2, 4);
    return numQ(`${A} = ?`, a, [k * a, a + 1, a - 1, a + k], { visual: sys([`${rep(A, k)} = ${k * a}`]), show: true, pics: true, sol: { t: 'sPair', ask: 'dbl', P: [A, B, C], a, b, c, k } });
  }
  if (kind === 'pair') {
    return numQ(`${B} = ?`, b, [a + b, a, b + 1, 2 * a], { visual: sys([`${A} + ${A} = ${2 * a}`, `${A} + ${B} = ${a + b}`]), show: true, pics: true, sol: { t: 'sPair', ask: 'pair', P: [A, B, C], a, b, c } });
  }
  if (kind === 'tri') {
    return numQ(`${C} = ?`, c, [b + c, b, a, c + 1, c - 1], { visual: sys([`${rep(A, 3)} = ${3 * a}`, `${A} + ${B} = ${a + b}`, `${B} + ${C} = ${b + c}`]), show: true, pics: true, sol: { t: 'sPair', ask: 'tri', P: [A, B, C], a, b, c } });
  }
  if (kind === 'chain') {
    if (b <= c) return genPair(lvl);
    return numQ(`${C} = ?`, c, [b - c, b + c, b, c + 1, a], { visual: sys([`${A} + ${A} = ${2 * a}`, `${A} + ${B} = ${a + b}`, `${B} − ${C} = ${b - c}`]), show: true, pics: true, sol: { t: 'sPair', ask: 'chain', P: [A, B, C], a, b, c } });
  }
  if (kind === 'chainx') {
    if (a > 9 || b > 9) return genPair(lvl);
    return numQ(`${C} = ?`, c, [b + c, b, a * b, c + 1, c - 1], { visual: sys([`${A} + ${A} = ${2 * a}`, `${A} × ${B} = ${a * b}`, `${B} + ${C} = ${b + c}`]), show: true, pics: true, sol: { t: 'sPair', ask: 'chainx', P: [A, B, C], a, b, c } });
  }
  const s = a + b + c;
  return numQ(`${A} + ${B} + ${C} = ?`, s, [a + b, b + c, s + 1, s - 1, a + 2 * b + c], { visual: sys([`${A} + ${A} = ${2 * a}`, `${A} + ${B} = ${a + b}`, `${B} + ${C} = ${b + c}`]), show: true, pics: true, sol: { t: 'sPair', ask: 'sum3', P: [A, B, C], a, b, c } });
}

// ---------- 3. Picture systems: two pictures, two clues ----------
function genSys(lvl) {
  const kind = pick([['sumdiff', 'sumdiff', 'double'], ['sumdiff', 'twoA', 'double', 'twoA'], ['twoA', 'threeA', 'double', 'sumdiff']][lvl]);
  const [A, B] = pics(2), [a, b] = bigSmall(lvl ? 12 : 10);
  const askA = chance(0.5), ans = askA ? a : b, P = askA ? A : B;
  const near = [a, b, a + b, a - b, ans + 1, ans - 1].filter(v => v !== ans);
  if (kind === 'sumdiff') return numQ(`${P} = ?`, ans, near, { visual: sys([`${A} + ${B} = ${a + b}`, `${A} − ${B} = ${a - b}`]), show: true, pics: true, sol: { t: 'sSum', P: [A, B], s: a + b, d: a - b, ask: askA ? 'A' : 'B' } });
  if (kind === 'twoA') return numQ(`${P} = ?`, ans, near.concat(2 * a + b - (a + b)), { visual: sys([`${A} + ${A} + ${B} = ${2 * a + b}`, `${A} + ${B} = ${a + b}`]), show: true, pics: true, sol: { t: 'sTake', P: [A, B], c: [2, 1], u: [2 * a + b, a + b], ask: askA ? 'A' : 'B' } });
  if (kind === 'threeA') {
    // 3 of one and 1 or 2 of the other: never 3 and 3, which would only say the same clue again.
    const k = R(1, 2);
    return numQ(`${P} = ?`, ans, near.concat(k * a), { visual: sys([`${times(3, A)} + ${times(k, B)} = ${3 * a + k * b}`, `${A} + ${B} = ${a + b}`]), show: true, pics: true, times: true, sol: { t: 'sTake', P: [A, B], c: [3, k], u: [3 * a + k * b, a + b], ask: askA ? 'A' : 'B' } });
  }
  // 🪐 is worth two 🚀.
  const d = R(1, lvl ? 9 : 6), k = lvl < 2 ? 2 : R(2, 3);
  return numQ(`${B} = ?`, d, [k * d, (k + 1) * d, d + 1, d - 1].filter(v => v !== d), { visual: sys([`${A} = ${rep(B, k)}`, `${A} + ${B} = ${(k + 1) * d}`]), show: true, pics: true, double: true, sol: { t: 'sSwap', sm: B, bg: A, k, c: 0, u: (k + 1) * d, ask: 'sm' } });
}

// ---------- 4. Swap it in: substitution ----------
const swp = s => `<span class="swp">${s}</span>`;
function genSwap(lvl) {
  const kind = pick([['solve', 'which', 'solve'], ['solve', 'which', 'solveB', 'dbl'], ['solve', 'solveB', 'dbl', 'which', 'mul']][lvl]);
  const xy = lvl === 2 && chance(0.6);
  const [A, B] = xy ? [X, Y] : pics(2);
  const a = R(1, lvl ? 12 : 10), k = R(1, lvl ? 9 : 6);
  if (kind === 'which') {
    // Which line is the second clue with 🚀 swapped for 🪐 + k?
    const s = 2 * a + k;
    const opts = [`${A} + ${A} + ${k} = ${s}`, `${A} + ${k} = ${s}`, `${A} + ${A} = ${s} + ${k}`, `${A} + ${B} + ${k} = ${s}`];
    const choices = shuffle(opts.map((h, i) => ({ value: `e${i}`, html: `<span class="ex exs">${h}</span>`, fill: [`<span class="fillx">${h}</span>`] })));
    return { eq: '🔁 ?', answer: 'e0', input: 'choice', layout: 'col', choices, visual: sys([`${swp(B)} = ${swp(`${A} + ${k}`)}`, `${A} + ${swp(B)} = ${s}`]), show: true, which: true, sol: { t: 'sWhich', P: [A, B], k, s } };
  }
  if (kind === 'dbl' || kind === 'mul') {
    // 🚀 = 🪐 + 🪐 (or three of them), and they add up to s.
    const m = kind === 'dbl' ? 2 : 3, s = a + m * a;
    const askB = chance(0.4), ans = askB ? m * a : a;
    return numQ(`${askB ? B : A} = ?`, ans, [s, s / 2 | 0, a + m, ans + 1, ans - 1, m * a, a].filter(v => v !== ans),
      { visual: sys([`${swp(B)} = ${swp(m === 2 ? `${A} + ${A}` : times(3, A))}`, `${A} + ${swp(B)} = ${s}`]), show: true, dbl: true, sol: { t: 'sSwap', sm: A, bg: B, k: m, c: 0, u: s, ask: askB ? 'bg' : 'sm' } });
  }
  const s = 2 * a + k, ans = kind === 'solveB' ? a + k : a;
  return numQ(`${kind === 'solveB' ? B : A} = ?`, ans, [s - k, (s - k) / 2 + k === ans ? a : a + k, s, ans + 1, ans - 1, s / 2 | 0].filter(v => v !== ans),
    { visual: sys([`${swp(B)} = ${swp(`${A} + ${k}`)}`, `${A} + ${swp(B)} = ${s}`]), show: true, solveB: kind === 'solveB', sol: { t: 'sSwap', sm: A, bg: B, k: 1, c: k, u: s, ask: kind === 'solveB' ? 'bg' : 'sm' } });
}

// ---------- 5. Stack and cancel: add or take away the two clues ----------
const gone = s => `<span class="gone">${s}</span>`;
// Two clues, one under the other, with the sign that joins them and the line under them.
const stack = (r1, r2, op, res = '') => `<div class="stk"><div><b class="op"></b><span>${r1}</span></div><div><b class="op">${op}</b><span>${r2}</span></div><hr>${res ? `<div><b class="op"></b><span>${res}</span></div>` : ''}</div>`;
function genStack(lvl) {
  const kind = pick([['add', 'add', 'solve'], ['add', 'solve', 'sub', 'solve'], ['solve', 'sub', 'scale', 'askB']][lvl]);
  const xy = lvl === 2 && chance(0.6);
  const [A, B] = xy ? [X, Y] : pics(2), [a, b] = bigSmall(lvl ? 12 : 10);
  if (kind === 'add' || kind === 'solve' || kind === 'askB') {
    const vis = stack(`${A} + ${gone(B)} = ${a + b}`, `${A} − ${gone(B)} = ${a - b}`, '➕', kind === 'add' ? '' : `${A} + ${A} = ${2 * a}`);
    if (kind === 'add') return numQ(`${A} + ${A} = ?`, 2 * a, [a, a + b, a - b, 2 * a + 2 * b, 2 * a - 1, 2 * a + 1], { visual: vis, show: true, add: true, sol: { t: 'sSum', P: [A, B], s: a + b, d: a - b, ask: 'AA' } });
    if (kind === 'solve') return numQ(`${A} = ?`, a, [2 * a, b, a + b, a + 1, a - 1], { visual: vis, show: true, sol: { t: 'sSum', P: [A, B], s: a + b, d: a - b, ask: 'A' } });
    return numQ(`${B} = ?`, b, [a, 2 * b, a - b, a + b, b + 1], { visual: vis, show: true, askB: true, sol: { t: 'sSum', P: [A, B], s: a + b, d: a - b, ask: 'B' } });
  }
  if (kind === 'sub') {
    const vis = stack(`${A} + ${gone(A)} + ${gone(B)} = ${2 * a + b}`, `${gone(A)} + ${gone(B)} = ${a + b}`, '➖', `${A} = …`);
    return numQ(`${A} = ?`, a, [2 * a, b, a + b, 3 * a + 2 * b, a + 1].filter(v => v !== a), { visual: vis, show: true, sub: true, sol: { t: 'sTake', P: [A, B], c: [2, 1], u: [2 * a + b, a + b], ask: 'A' } });
  }
  // A + 2B and A + B: taking away leaves one B; then find A.
  const vis = stack(`${gone(A)} + ${gone(B)} + ${B} = ${a + 2 * b}`, `${gone(A)} + ${gone(B)} = ${a + b}`, '➖', `${B} = …`);
  return numQ(`${A} = ?`, a, [b, a + b, 2 * b, a + 1, a - 1], { visual: vis, show: true, scale: true, sol: { t: 'sTake', P: [A, B], c: [1, 2], u: [a + 2 * b, a + b], ask: 'A' } });
}

// ---------- 6. The rule machine: x goes in, y comes out ----------
const RULES = [
  [0, 'plus'], [0, 'times'], [1, 'times'], [1, 'minus'], [1, 'tpl'], [2, 'tpl'], [2, 'tmi'], [2, 'sq'], [1, 'from'],
];
function makeRule(type) {
  const k = R(2, type === 'times' ? 9 : 5), c = R(1, 9);
  if (type === 'plus') return { f: x => x + c, html: `+ ${c}` };
  if (type === 'minus') return { f: x => x - c, html: `− ${c}`, min: c };
  if (type === 'times') return { f: x => x * k, html: `× ${k}` };
  if (type === 'tpl') return { f: x => x * k + c, html: `× ${k} + ${c}` };
  if (type === 'tmi') return { f: x => x * k - c, html: `× ${k} − ${c}`, min: Math.ceil(c / k) };
  if (type === 'from') return { f: x => 20 - x, html: `20 − ${X}`, lead: true, max: 19 };
  return { f: x => x * x, html: `× ${X}` };
}
const table = (xs, ys) => `<table class="rtab"><tr><th>${X}</th>${xs.map(v => `<td>${v}</td>`).join('')}</tr><tr><th>${Y}</th>${ys.map(v => `<td>${v}</td>`).join('')}</tr></table>`;
const ruleHtml = r => (r.lead ? r.html : `${X} ${r.html}`);
function genRule(lvl) {
  const types = RULES.filter(([l]) => l <= lvl).map(([, t]) => t);
  const r = makeRule(pick(types));
  const lo = r.min || 1, hi = Math.min(r.max || 12, lvl ? 12 : 9);
  const xs = new Set();
  while (xs.size < 4) xs.add(R(lo, hi));
  const [x1, x2, x3, xq] = [...xs], ex = [x1, x2, x3].sort((p, q) => p - q), ys = ex.map(r.f), yq = r.f(xq);
  const kind = pick([['next', 'next', 'rule'], ['next', 'rule', 'next'], ['next', 'rule', 'back']][lvl]);
  const vis = table(ex, ys);
  if (kind === 'next') return numQ(`${X} = ${xq} ➜ ${Y} = ?`, yq, [yq + 1, yq - 1, xq + ys[0] - ex[0], ys[2] + (ys[2] - ys[1])].filter(v => v !== yq), { visual: vis, show: true, next: true, sol: { t: 'sRule', ask: 'next', rule: ruleHtml(r).replace(/<[^>]*>/g, ''), xs: ex, ys, xq } });
  if (kind === 'back') {
    if (r.html === `× ${X}` || r.lead) return genRule(lvl);
    return numQ(`${Y} = ${yq} ➜ ${X} = ?`, xq, [yq, xq + 1, xq - 1, yq - xq].filter(v => v > 0 && v !== xq), { visual: vis, show: true, back: true, sol: { t: 'sRule', ask: 'back', rule: ruleHtml(r).replace(/<[^>]*>/g, ''), xs: ex, ys, yq } });
  }
  // Which rule fits every pair? Wrong rules must miss at least one of them.
  const cands = shuffle(types.map(makeRule)).concat([makeRule('plus'), makeRule('times'), makeRule('tpl')]);
  const wrong = [];
  for (let t = 0; wrong.length < 3 && t < 50; t++) cands.push(makeRule(pick(['plus', 'times', 'tpl', 'minus'])));
  for (const w of cands) if (wrong.length < 3 && ex.some((x, i) => w.f(x) !== ys[i]) && ![ruleHtml(r), ...wrong.map(ruleHtml)].includes(ruleHtml(w))) wrong.push(w);
  const choices = shuffle([r, ...wrong].map((w, i) => ({ value: `r${i}`, html: `<span class="ex rsz">${ruleHtml(w)}</span>` })));
  return { eq: `${X} ➜ ⚙️ ➜ ${Y}`, answer: 'r0', input: 'choice', layout: 'grid', choices, visual: vis, show: true, rule: true, sol: { t: 'sRule', ask: 'rule', xs: ex, ys } };
}

// ---------- 7. Hello x and y ----------
function genXY(lvl) {
  const kind = pick([['solve', 'solve', 'check', 'cross'], ['solve', 'sub', 'check', 'cross'], ['neg', 'sub', 'cross', 'check', 'solve']][lvl]);
  if (kind === 'cross') {
    // Two paths cross at one star-map point.
    const n = 5, a = R(lvl < 2 ? 1 : -3, 3), b = R(lvl < 2 ? 1 : -3, 3);
    const ms = shuffle([1, -1, 2, -2, 0]).slice(0, 2);
    if (a === b || (ms[0] * ms[1] === 0 && chance(0.3))) return genXY(lvl);
    const lines = ms.map((m, i) => [m, b - m * a, i ? SKY : RED]);
    return textQ(`(${X}, ${Y}) = ?`, pair(a, b), [pair(b, a), pair(a + 1, b), pair(a, b + 1), pair(a - 1, b - ms[0]), pair(-a, b), pair(b + 1, a)],
      { visual: plane(n, [], { lines }), show: true, cross: true, sol: { t: 'sCross', n, lines } });
  }
  const [x, y] = bigSmall(lvl ? 12 : 10);
  if (kind === 'check') {
    const good = chance(0.5), gx = good ? x : x + pick([1, -1]), gy = good ? y : y + pick([1, -1]);
    if (!good && gx + gy !== x + y && gx - gy !== x - y && chance(0.5)) return genXY(lvl);
    return tfOwn(`${X} = ${gx} , ${Y} = ${gy}`, good, { visual: sys([`${X} + ${Y} = ${x + y}`, `${X} − ${Y} = ${x - y}`]), show: true, check: true, sol: { t: 'sCheck', gx, gy, s: x + y, d: x - y } });
  }
  if (kind === 'sub') {
    const k = R(2, 3), v = R(1, lvl > 1 ? 9 : 6), askY = chance(0.4);
    return numQ(`${askY ? Y : X} = ?`, askY ? k * v : v, [v, k * v, (k + 1) * v, v + 1, k * v + 1].filter(q => q !== (askY ? k * v : v)),
      { visual: sys([`${Y} = ${k}${X}`, `${X} + ${Y} = ${(k + 1) * v}`]), show: true, sub: true, sol: { t: 'sSwap', sm: X, bg: Y, k, c: 0, u: (k + 1) * v, ask: askY ? 'bg' : 'sm' } });
  }
  if (kind === 'neg') {
    // The same two clues, but now y is below zero.
    const yy = -R(1, 6), xx = R(1, 9);
    const askY = chance(0.5), ans = askY ? yy : xx;
    return intQ(`${askY ? Y : X} = ?`, ans, [-ans, xx + yy, xx - yy, ans + 1, ans - 1], { visual: sys([`${X} + ${Y} = ${M(xx + yy)}`, `${X} − ${Y} = ${xx - yy}`]), show: true, neg: ans < 0, sneg: true, sol: { t: 'sSum', P: [X, Y], s: xx + yy, d: xx - yy, ask: askY ? 'B' : 'A' } });
  }
  const askY = chance(0.5), ans = askY ? y : x;
  return numQ(`${askY ? Y : X} = ?`, ans, [x + y, x - y, askY ? x : y, ans + 1, ans - 1].filter(v => v !== ans), { visual: sys([`${X} + ${Y} = ${x + y}`, `${X} − ${Y} = ${x - y}`]), show: true, sol: { t: 'sSum', P: [X, Y], s: x + y, d: x - y, ask: askY ? 'B' : 'A' } });
}

// ---------- 8. Picture stories: cats and dogs, legs and prices ----------
const panel = inner => `<div class="panel">${inner}</div>`;
const story = (...ps) => `<div class="story sstory">${ps.map(panel).join('<b class="arrow">▶</b>')}</div>`;
const num = s => `<span class="num">${s}</span>`;
function genStory(lvl) {
  const kind = pick([['more', 'double', 'more'], ['legs', 'price', 'more', 'double'], ['legs', 'price', 'legs', 'more3']][lvl]);
  if (kind === 'legs') {
    // Chickens and rabbits: how many animals, how many legs, how many rabbits?
    const n = R(3, lvl > 1 ? 12 : 8), r = R(1, n - 1), legs = 2 * n + 2 * r;
    return numQ('', r, [n - r, legs / 4 | 0, n, r + 1, r - 1].filter(v => v > 0 && v !== r),
      { visual: story(`<span>🐔+🐰</span>${num(`= ${n}`)}`, `<span>🦵</span>${num(`= ${legs}`)}`, `<span>🐰</span>${num(SLOT)}`), show: true, legs: true, sol: { t: 'sLegs', n, legs } });
  }
  if (kind === 'price') {
    const i = R(2, 6), d = R(1, 6), k = R(2, 3);
    return numQ('', i, [d, i + d, k * i + d, i + 1, i - 1].filter(v => v > 0 && v !== i),
      { visual: story(`<span>${'🍦'.repeat(k)}🍩</span>${num(`${k * i + d} 🪙`)}`, `<span>🍦🍩</span>${num(`${i + d} 🪙`)}`, `<span>🍦</span>${num(`${SLOT} 🪙`)}`), show: true, price: true, sol: { t: 'sTake', P: ['🍦', '🍩'], c: [k, 1], u: [k * i + d, i + d], ask: 'A', unit: '🪙' } });
  }
  if (kind === 'double') {
    // There are twice as many dogs as cats.
    const c = R(2, lvl ? 9 : 8);
    return numQ('', c, [2 * c, 3 * c, c + 1, c - 1].filter(v => v > 0 && v !== c),
      { visual: story(`<span>🐱+🐶</span>${num(`= ${3 * c}`)}`, `<span>🐶 = 🐱+🐱</span>`, `<span>🐱</span>${num(SLOT)}`), show: true, double: true, sol: { t: 'sSwap', sm: '🐱', bg: '🐶', k: 2, c: 0, u: 3 * c, ask: 'sm' } });
  }
  // More dogs than cats: together t, dogs d more.
  const c = R(2, lvl ? 12 : 9), d = R(1, lvl ? 6 : 5), m3 = kind === 'more3';
  const t = m3 ? 3 * c + 3 * d : 2 * c + d;
  if (m3) {
    // Cats, dogs and birds: each kind has d more than the one before.
    return numQ('', c, [t / 3, c + d, c + 1, c - 1, t - c].filter(v => Number.isInteger(v) && v > 0 && v !== c),
      { visual: story(`<span class="tight">🐱+🐶+🐦</span>${num(`= ${t}`)}`, `<span>🐶 = 🐱+${d}</span><span>🐦 = 🐶+${d}</span>`, `<span>🐱</span>${num(SLOT)}`), show: true, more3: true, sol: { t: 'sMore3', d, u: t } });
  }
  const askDog = chance(0.5), ans = askDog ? c + d : c;
  return numQ('', ans, [t - d, (t / 2) | 0, c, c + d, ans + 1, ans - 1].filter(v => v > 0 && v !== ans),
    { visual: story(`<span>🐱+🐶</span>${num(`= ${t}`)}`, `<span>🐶 = 🐱+${d}</span>`, `<span>${askDog ? '🐶' : '🐱'}</span>${num(SLOT)}`), show: true, more: true, sol: { t: 'sSwap', sm: '🐱', bg: '🐶', k: 1, c: d, u: t, ask: askDog ? 'bg' : 'sm' } });
}

// ---------- 9. Challenge mix (puzzle stop): logic grids, picture grids, number trails ----------
function latins(n) {
  const out = [], g = [];
  const ok = (r, c, v) => g.slice(0, r).every(row => row[c] !== v);
  const rows = []; const perm = (a, p = []) => (a.length ? a.forEach((v, i) => perm(a.filter((_, j) => j !== i), [...p, v])) : rows.push(p));
  perm(Array.from({ length: n }, (_, i) => i + 1));
  const build = r => {
    if (r === n) { out.push(g.map(row => row.slice())); return; }
    for (const row of rows) if (row.every((v, c) => ok(r, c, v))) { g[r] = row; build(r + 1); }
  };
  build(0);
  return out;
}
const LAT = { 3: null, 4: null };
// Cut the grid into small connected cages.
function cages(n, maxSize) {
  const id = Array.from({ length: n }, () => Array(n).fill(-1)), list = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (id[r][c] >= 0) continue;
    const cells = [[r, c]]; id[r][c] = list.length;
    const size = R(1, maxSize);
    while (cells.length < size) {
      const opts = [];
      for (const [cr, cc] of cells) for (const [dr, dc] of [[0, 1], [1, 0], [0, -1]]) {
        const nr = cr + dr, nc = cc + dc;
        if (nr < n && nc >= 0 && nc < n && id[nr][nc] < 0) opts.push([nr, nc]);
      }
      if (!opts.length) break;
      const [nr, nc] = pick(opts); id[nr][nc] = list.length; cells.push([nr, nc]);
    }
    list.push(cells);
  }
  return { id, list };
}
function cageRule(vals) {
  if (vals.length === 1) return { op: '', t: vals[0] };
  if (vals.length === 2) {
    const [p, q] = [Math.max(...vals), Math.min(...vals)];
    const ops = ['+', '×', '−'].concat(p % q === 0 && q > 1 ? ['÷'] : []);
    const op = pick(ops);
    return { op, t: op === '+' ? p + q : op === '×' ? p * q : op === '−' ? p - q : p / q };
  }
  const op = pick(['+', '×']);
  return { op, t: op === '+' ? vals.reduce((s, v) => s + v, 0) : vals.reduce((s, v) => s * v, 1) };
}
const fits = (rule, vals) => {
  if (!rule.op) return vals[0] === rule.t;
  const [p, q] = [Math.max(...vals), Math.min(...vals)];
  if (rule.op === '+') return vals.reduce((s, v) => s + v, 0) === rule.t;
  if (rule.op === '×') return vals.reduce((s, v) => s * v, 1) === rule.t;
  if (rule.op === '−') return p - q === rule.t;
  return p === q * rule.t;
};
function kenken(lvl) {
  const n = lvl === 2 ? 4 : 3;
  LAT[n] ||= latins(n);
  for (let tries = 0; tries < 200; tries++) {
    const sol = pick(LAT[n]), { id, list } = cages(n, lvl ? 3 : 2);
    const rules = list.map(cells => cageRule(cells.map(([r, c]) => sol[r][c])));
    const [qr, qc] = [R(0, n - 1), R(0, n - 1)];
    if (!rules[id[qr][qc]].op) continue;
    const all = LAT[n].filter(g => list.every((cells, k) => fits(rules[k], cells.map(([r, c]) => g[r][c]))));
    if (new Set(all.map(g => g[qr][qc])).size !== 1) continue;
    const u = n === 3 ? 64 : 54, P = 4, S = n * u;
    let body = `<rect x="${P}" y="${P}" width="${S}" height="${S}" fill="#fff"/>`;
    for (let i = 1; i < n; i++) body += `<line x1="${P + i * u}" y1="${P}" x2="${P + i * u}" y2="${P + S}" stroke="#c9cdf0" stroke-width="1.5"/><line x1="${P}" y1="${P + i * u}" x2="${P + S}" y2="${P + i * u}" stroke="#c9cdf0" stroke-width="1.5"/>`;
    // Thick walls between cages.
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      if (c < n - 1 && id[r][c] !== id[r][c + 1]) body += `<line x1="${P + (c + 1) * u}" y1="${P + r * u}" x2="${P + (c + 1) * u}" y2="${P + (r + 1) * u}" stroke="${INK}" stroke-width="4"/>`;
      if (r < n - 1 && id[r][c] !== id[r + 1][c]) body += `<line x1="${P + c * u}" y1="${P + (r + 1) * u}" x2="${P + (c + 1) * u}" y2="${P + (r + 1) * u}" stroke="${INK}" stroke-width="4"/>`;
    }
    list.forEach((cells, k) => {
      const [r, c] = cells.reduce((m, p) => (p[0] < m[0] || (p[0] === m[0] && p[1] < m[1]) ? p : m));
      const rl = rules[k];
      if (rl.op) body += `<text x="${P + c * u + 5}" y="${P + r * u + 16}" font-size="17" font-weight="800" fill="${VIOLET}">${rl.t}${rl.op}</text>`;
      else body += txt(P + c * u + u / 2, P + r * u + u / 2 + 2, rl.t, 28);
    });
    body += `<circle cx="${P + qc * u + u / 2}" cy="${P + qr * u + u / 2 + 5}" r="16" fill="#fff4cc" stroke="#d99a00" stroke-width="3" stroke-dasharray="5 4"/>${txt(P + qc * u + u / 2, P + qr * u + u / 2 + 6, '?', 18, 'fill="#d99a00"')}`;
    body += `<rect x="${P}" y="${P}" width="${S}" height="${S}" fill="none" stroke="${INK}" stroke-width="5" rx="3"/>`;
    const ans = sol[qr][qc];
    return { eq: '🧩 = ?', answer: ans, input: 'choice', layout: 'row', visual: svg(S + 2 * P, S + 2 * P, body), show: true, kenken: true, n, sol: { t: 'sKen', n, cages: list, rules: rules.map(rl => [rl.op, rl.t]), q: [qr, qc] },
      choices: Array.from({ length: n }, (_, i) => ({ value: i + 1, html: String(i + 1) })) };
  }
  return trail(lvl);
}
// Each picture is a number; the rows add up to the numbers on the right.
function picGrid(lvl) {
  const [A, B, C] = pics(3), top = lvl ? 12 : 8;
  const v = { [A]: R(1, top), [B]: R(1, top), [C]: R(1, top) };
  if (new Set(Object.values(v)).size < 3) return picGrid(lvl);
  const rows = shuffle([[A, A, A], shuffle([A, A, B]), shuffle([A, B, C])]);
  const sum = r => r.reduce((s, p) => s + v[p], 0);
  const ask = lvl === 2 && chance(0.5) ? 'all' : C;
  const html = `<table class="pgrid">${rows.map(r => `<tr>${r.map(p => `<td>${p}</td>`).join('')}<th>${sum(r)}</th></tr>`).join('')}</table>`;
  if (ask === 'all') {
    const s = v[A] + v[B] + v[C];
    return numQ(`${A} + ${B} + ${C} = ?`, s, [s + 1, s - 1, v[A] + v[B], 3 * v[A]], { visual: html, show: true, pgrid: true, all: true, sol: { t: 'sPGrid', rows, sums: rows.map(sum), ask: 'all' } });
  }
  return numQ(`${C} = ?`, v[C], [v[A], v[B], v[C] + 1, v[C] - 1, sum([A, B, C])].filter(x => x !== v[C]), { visual: html, show: true, pgrid: true, sol: { t: 'sPGrid', rows, sums: rows.map(sum), ask: 'one', pic: C } });
}
// A number trail: start, do each step in turn.
function trail(lvl) {
  const steps = lvl ? 4 : 3;
  for (;;) {
    let v = R(2, 12);
    const start = v, parts = [];
    for (let i = 0; i < steps; i++) {
      const op = pick(['+', '−', '×', '÷']), k = op === '×' ? R(2, 4) : op === '÷' ? R(2, 5) : R(1, 15);
      if (op === '÷' && v % k) { i--; continue; }
      if (op === '−' && v - k < 1) { i--; continue; }
      if (op === '×' && v * k > 99) { i--; continue; }
      v = op === '+' ? v + k : op === '−' ? v - k : op === '×' ? v * k : v / k;
      parts.push(`${op}${k}`);
    }
    if (v > 999) continue;
    // The trail wraps onto a second line on small phones; the flag at its end is the answer.
    const vis = `<div class="ntrail"><b>${start}</b>${parts.map(p => `<i>➜</i><span>${p}</span>`).join('')}<i>➜</i><b>🏁</b></div>`;
    return numQ('🏁 = ?', v, [v + 1, v - 1, v + 2, v * 2].filter(x => x !== v), { visual: vis, show: true, trail: true, sol: { t: 'sTrail', start, ops: parts } });
  }
}
function genMix(lvl) {
  const kind = pick([['kenken', 'pgrid', 'trail'], ['kenken', 'pgrid', 'trail', 'kenken'], ['kenken', 'pgrid', 'kenken', 'trail']][lvl]);
  return kind === 'kenken' ? kenken(lvl) : kind === 'pgrid' ? picGrid(lvl) : trail(lvl);
}

// ---------- 10. Speed galaxy: quick sums from every world ----------
function genSpeed(lvl) {
  const kind = pick([['times', 'add', 'sub', 'half', 'div', 'sq'], ['times', 'add', 'sub', 'sq', 'x', 'neg', 'div', 'half'], ['times', 'sub', 'sq', 'x', 'neg', 'pct', 'div', 'add']][lvl]);
  const top = [9, 12, 15][lvl];
  if (kind === 'times') { const a = R(lvl ? 4 : 2, top), b = R(lvl ? 4 : 2, 9); return numQ(`${a} × ${b} = ?`, a * b, [a * b + a, a * b - b, a * (b + 1), a + b], { speed: true, times: true, sol: { t: 'mul', a, b } }); }
  if (kind === 'add') { const m = [40, 150, 450][lvl], a = R(12, m), b = R(12, m); return numQ(`${a} + ${b} = ?`, a + b, [a + b + 10, a + b - 10, a + b + 1], { speed: true, add: true, sol: a < 100 && b < 100 ? { t: 'add', a, b } : { t: 'col', a, b, op: '+' } }); }
  if (kind === 'sub') { const a = R(30, [60, 200, 900][lvl]), b = R(11, a - 5); return numQ(`${a} − ${b} = ?`, a - b, [a - b + 10, a - b - 10, a - b + 1].filter(v => v >= 0), { speed: true, sub: true, sol: a < 100 ? { t: 'sub', a, b } : { t: 'col', a, b, op: '−' } }); }
  if (kind === 'sq') { const a = R(lvl ? 4 : 2, top + (lvl > 1 ? 5 : 0)); return numQ(`${a}² = ?`, a * a, [2 * a, a * a + a, (a - 1) * (a - 1), a * a + 1], { speed: true, sq: true, sol: { t: 'sSq', a } }); }
  if (kind === 'half') { const a = 2 * R(6, [30, 60, 200][lvl]); return numQ(`½ × ${a} = ?`, a / 2, [a / 2 + 1, a / 4 | 0, a, a / 2 - 2], { speed: true, half: true, sol: { t: 'sHalf', a } }); }
  if (kind === 'x') { const k = R(2, lvl > 1 ? 9 : 6), v = R(1, top), c = R(1, 20); return numQ(`${X} = ?`, v, [v + 1, v - 1, k * v, (k * v + c) / k | 0], { visual: sys([`${k}${X} + ${c} = ${k * v + c}`]), show: true, speed: true, x: true, sol: { t: 'sLin', k, c, u: k * v + c } }); }
  if (kind === 'neg') { const a = R(1, top), b = R(a + 1, top + 10); return intQ(`${M(-b)} + ${a} = ?`, a - b, [b - a, -(a + b), a - b + 1, a - b - 1], { speed: true, neg: true, sol: { t: 'sNeg', a, b } }); }
  if (kind === 'pct') { const p = pick([10, 20, 25, 50, 75]), t = pick([20, 40, 60, 80, 100, 120, 200, 400]); return numQ(`${p}% × ${t} = ?`, p * t / 100, [p, t / 2, p * t / 100 + 10, t - p].filter(v => v > 0), { speed: true, pct: true, sol: { t: 'pctOf', p, n: t } }); }
  const b = R(lvl ? 3 : 2, 9), q = R(2, top); return numQ(`${b * q} ÷ ${b} = ?`, q, [q + 1, q - 1, b, b * q - b], { speed: true, div: true, sol: { t: 'div', n: b * q, k: b, q } });
}

export const SPACE = [
  { id: 's-grid', icon: '🧭', gen: genGrid },
  { id: 's-pair', icon: '🌠', gen: genPair },
  { id: 's-sys', icon: '🛸', gen: genSys },
  { id: 's-swap', icon: '🔁', gen: genSwap },
  { id: 's-stack', icon: '🥞', gen: genStack },
  { id: 's-rule', icon: '⚙️', gen: genRule },
  { id: 's-xy', icon: '📈', gen: genXY },
  { id: 's-story', icon: '🐾', gen: genStory },
  { id: 's-mix', icon: '🧩', gen: genMix, puzzle: true },
  { id: 's-speed', icon: '☄️', gen: genSpeed },
];
