// Solutions for the Space world: the star map (walk across, then up), picture numbers, pairs of clues
// (swap one in, or stack two rows so one kind cancels), rule machines, picture stories, logic grids and
// quick sums. Same shape as sol-basic.js: each solver works the answer out itself and returns { ans, steps, oops }.
import { S, OOPS, m, plain } from './sol-basic.js';
import { tiles, dots, checks, balance, nline, big } from './sol-pics.js';
import { valueBar } from './sol-pics2.js';

const INK = '#1e2650', RED = '#ef5b52', BLUE = '#3e9be0', MINT = '#2fb383', SUN = '#ffc23d', PALE = '#d7f5e6', VIOLET = '#8a5cf6';
const svg = (w, h, body) => `<svg class="solsvg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`;
const txt = (x, y, s, size = 16, fill = INK, extra = '') =>
  `<text x="${x}" y="${y}" font-size="${size}" font-weight="800" fill="${fill}" text-anchor="middle" dominant-baseline="central"${extra}>${s}</text>`;
const halo = ' stroke="#fff" stroke-width="4" paint-order="stroke"';
const X = '<i class="vx">x</i>', Y = '<i class="vx vy">y</i>';
// A picture name as plain text ('x', 'y' or the emoji), and as it is written in a math line.
const nm = p => plain(p);
const hv = p => { const s = plain(p); return s === 'x' ? X : s === 'y' ? Y : s; };
const pr = (x, y) => `(${m(x)}, ${m(y)})`;
const same = (g, s) => g !== undefined && String(g) === String(s);

// ---------- rows of picture sums ----------
const SIGNS = new Set(['+', '−', '×', '÷', '=', '→']);
function tokW(v) {
  if (v === '(' || v === ')') return 12;
  if (SIGNS.has(v)) return 19;
  if (v === 'x' || v === 'y') return 18;
  if (v === '?') return 30;
  if (/^[−\d.…]+(🪙)?$/u.test(v)) return 12 * v.replace('🪙', '').length + (v.includes('🪙') ? 30 : 10);
  return 29;
}
// Rows lined up on their = signs. A row is an array of cells or { c, op, line, hl }: op is a sign in the
// left margin, line a rule above the row, hl lights the row up. A cell is a string or
// { v, sub (small number under it), gone (crossed out), sw (swapped in), hi (lit up) }.
function eqs(rows) {
  const R = rows.map(r => (Array.isArray(r) ? { c: r } : r)).map(r => ({ ...r, c: r.c.map(c => (c && typeof c === 'object' ? { ...c, v: String(c.v) } : { v: String(c) })) }));
  const gut = R.some(r => r.op) ? 28 : 6;
  const eqAt = r => r.c.findIndex(c => c.v === '=');
  const wOf = cs => cs.reduce((s, c) => s + tokW(c.v), 0);
  const pre = r => (eqAt(r) < 0 ? 0 : wOf(r.c.slice(0, eqAt(r))));
  const P = Math.max(...R.map(pre)), Q = Math.max(...R.map(r => wOf(r.c) - pre(r)));
  const W = gut + P + Q + 8;
  let y = 4, b = '';
  R.forEach(r => {
    if (r.line) { b += `<line x1="${gut - 4}" y1="${y + 1}" x2="${W - 4}" y2="${y + 1}" stroke="${INK}" stroke-width="3"/>`; y += 7; }
    const subs = r.c.some(c => c.sub !== undefined && c.sub !== null);
    const h = 34 + (subs ? 16 : 0), cy = y + 17;
    let x = eqAt(r) < 0 ? gut + (P + Q - wOf(r.c)) / 2 : gut + P - pre(r);
    if (r.hl) b += `<rect x="${x - 4}" y="${y - 1}" width="${wOf(r.c) + 8}" height="${h + 1}" rx="10" fill="#fff3c4"/>`;
    if (r.op) b += txt(13, cy, r.op, 22);
    r.c.forEach(c => {
      const w = tokW(c.v), cx = x + w / 2, v = c.v;
      if (c.hi || c.sw) b += `<rect x="${x + 1}" y="${y + 1}" width="${w - 2}" height="32" rx="7" fill="${c.sw ? '#ffe39a' : PALE}" stroke="${c.sw ? SUN : MINT}" stroke-width="2"/>`;
      let t;
      if (v === '?') t = `<rect x="${x + 3}" y="${y + 3}" width="${w - 6}" height="28" rx="6" fill="#fff8e0" stroke="${SUN}" stroke-width="2.5" stroke-dasharray="4 3"/>` + txt(cx, cy + 1, '?', 18, '#d99a00');
      else if (v === 'x' || v === 'y') t = txt(cx, cy, v, 24, v === 'x' ? '#c2362d' : '#2f6fd0', ' font-family="Georgia, serif" font-style="italic"');
      else if (tokW(v) === 29) t = txt(cx, cy + 1, v, 22);
      else t = txt(cx, cy + 1, v, SIGNS.has(v) ? 20 : 20, c.col || INK);
      b += c.gone ? `<g opacity=".3">${t}</g><line x1="${x + 4}" y1="${y + 29}" x2="${x + w - 4}" y2="${y + 5}" stroke="${RED}" stroke-width="3"/>` : t;
      if (subs && c.sub !== undefined && c.sub !== null) b += txt(cx, y + 42, c.sub, 15, MINT);
      x += w;
    });
    y += h + 2;
  });
  return svg(W, y + 2, b);
}
// k copies of a picture joined by +, each cell built by f.
const plus = (list) => list.flatMap((c, i) => (i ? ['+', c] : [c]));
const copies = (k, cell) => plus(Array.from({ length: k }, () => (typeof cell === 'function' ? cell() : cell)));

// ---------- the star map ----------
// n: the map goes from −n to n. arrows: [x0, y0, x1, y1, colour, label]; marks and ghosts: [x, y, emoji];
// rings circle a point; lines: [m, c, colour] for y = m·x + c; mirror: the axis drawn red and dashed.
function starMap(n, { marks = [], ghosts = [], arrows = [], rings = [], lines = [], mirror = null } = {}) {
  const u = n > 4 ? 19 : 23, L = 24, T = 8, Z = 2 * n * u;
  const px = x => L + (x + n) * u, py = y => T + (n - y) * u;
  let b = `<rect x="${L}" y="${T}" width="${Z}" height="${Z}" fill="#eef0ff" rx="4"/>`;
  for (let i = -n; i <= n; i++) {
    b += `<line x1="${px(i)}" y1="${T}" x2="${px(i)}" y2="${T + Z}" stroke="#c9cdf0"/><line x1="${L}" y1="${py(i)}" x2="${L + Z}" y2="${py(i)}" stroke="#c9cdf0"/>`;
    b += txt(px(i), T + Z + 11, m(i), 11, INK, ' letter-spacing="-1"') + txt(L - 11, py(i), m(i), 11, INK, ' letter-spacing="-1"');
  }
  const axis = (x1, y1, x2, y2, red) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${red ? RED : INK}" stroke-width="${red ? 4 : 2.5}"${red ? ' stroke-dasharray="7 4"' : ''}/>`;
  b += axis(L, py(0), L + Z, py(0), mirror === 'x') + axis(px(0), T, px(0), T + Z, mirror === 'y');
  for (const [k, c, col] of lines) {
    let xs = [-n, n];
    if (k) xs = [Math.max(-n, Math.min((-n - c) / k, (n - c) / k)), Math.min(n, Math.max((-n - c) / k, (n - c) / k))];
    b += `<line x1="${px(xs[0]).toFixed(1)}" y1="${py(k * xs[0] + c).toFixed(1)}" x2="${px(xs[1]).toFixed(1)}" y2="${py(k * xs[1] + c).toFixed(1)}" stroke="${col}" stroke-width="4" stroke-linecap="round" opacity=".85"/>`;
  }
  for (const [x, y] of rings) b += `<circle cx="${px(x)}" cy="${py(y)}" r="${u * 0.62}" fill="none" stroke="${MINT}" stroke-width="3"/>`;
  for (const [x0, y0, x1, y1, col, label] of arrows) {
    const X0 = px(x0), Y0 = py(y0), X1 = px(x1), Y1 = py(y1), len = Math.hypot(X1 - X0, Y1 - Y0) || 1, ux = (X1 - X0) / len, uy = (Y1 - Y0) / len;
    const at = (x, y) => [...marks, ...ghosts].some(k => k[0] === x && k[1] === y), cut = len > 1.5 * u ? 0.4 * u : 0;
    const s0 = at(x0, y0) ? cut : 0, s1 = at(x1, y1) ? cut : 0;
    const ex = X1 - ux * (5 + s1), ey = Y1 - uy * (5 + s1);
    b += `<line x1="${X0 + ux * s0}" y1="${Y0 + uy * s0}" x2="${ex - ux * 6}" y2="${ey - uy * 6}" stroke="${col}" stroke-width="4" stroke-linecap="round"/>`;
    b += `<path d="M${ex} ${ey} L${ex - ux * 11 - uy * 6} ${ey - uy * 11 + ux * 6} L${ex - ux * 11 + uy * 6} ${ey - uy * 11 - ux * 6}Z" fill="${col}"/>`;
    if (label !== undefined) b += txt((X0 + X1) / 2 + (uy ? 11 : 0), (Y0 + Y1) / 2 - (uy ? 0 : 11), label, 16, col, halo);
  }
  for (const [x, y, e] of ghosts) b += `<text x="${px(x)}" y="${py(y)}" font-size="${u}" text-anchor="middle" dominant-baseline="central" opacity=".5">${e}</text>`;
  for (const [x, y, e] of marks) b += `<text x="${px(x)}" y="${py(y)}" font-size="${u}" text-anchor="middle" dominant-baseline="central">${e}</text>`;
  if (!marks.length && !ghosts.length) for (const [x, y] of rings) b += `<circle cx="${px(x)}" cy="${py(y)}" r="4" fill="${INK}"/>`;
  return svg(L + Z + 8, T + Z + 22, b);
}
// Walk from (x0, y0) across to x, then up or down to y.
const walk = (x0, y0, x, y, upToo = true) => [
  ...(x !== x0 ? [[x0, y0, x, y0, RED, Math.abs(x - x0)]] : []),
  ...(upToo && y !== y0 ? [[x, y0, x, y, BLUE, Math.abs(y - y0)]] : []),
];

function sGrid(sol, q, given) {
  const { ask, n } = sol;
  if (ask === 'read' || ask === 'find') {
    const { x, y } = sol, marks = ask === 'find' ? sol.marks : [[x, y, sol.e]];
    const ans = ask === 'find' ? marks.find(([a, b]) => a === x && b === y)[2] : pr(x, y);
    const steps = [
      S(starMap(n, { marks, arrows: walk(0, 0, x, y, false) }), `(${m(x)}, ?)`, x > 0 ? 'spRight' : 'spLeft', { a: Math.abs(x) }),
      S(starMap(n, { marks, arrows: walk(0, 0, x, y), rings: [[x, y]] }), ask === 'find' ? `${pr(x, y)} = ${ans}` : pr(x, y), y > 0 ? 'spUp' : 'spDown', { a: Math.abs(y) }),
    ];
    let spot = null;
    if (ask === 'find') { const g = marks.find(k => k[2] === given); spot = g && g[2] !== ans ? [g[0], g[1]] : null; }
    else if (typeof given === 'string' && given !== ans) spot = given.replace(/[()\s]/g, '').replace(/−/g, '-').split(',').map(Number);
    let oops = null;
    if (spot && spot[0] === y && spot[1] === x) oops = OOPS(pr(x, y), 'spOopsSwap', {}, starMap(n, { marks, arrows: walk(0, 0, x, y), rings: [[x, y]] }));
    else if (spot && Math.abs(spot[0]) === Math.abs(x) && Math.abs(spot[1]) === Math.abs(y)) oops = OOPS(pr(x, y), 'spOopsSign', {}, starMap(n, { marks, arrows: walk(0, 0, x, y), rings: [[x, y]] }));
    return { ans, steps, oops };
  }
  if (ask === 'move') {
    const { x, y, dx, dy } = sol, ex = x + dx, ey = y + dy, ans = pr(ex, ey);
    const e = [[x, y, '👽']], sg = v => (v > 0 ? '+' : '−');
    const steps = [
      S(starMap(n, { marks: e, arrows: walk(x, y, ex, ey, false) }), `${m(x)} ${sg(dx)} ${Math.abs(dx)} = ${m(ex)}`, 'spMoveX', { a: Math.abs(dx) }),
      S(starMap(n, { marks: e, ghosts: [[ex, ey, '👽']], arrows: walk(x, y, ex, ey) }), `${m(y)} ${sg(dy)} ${Math.abs(dy)} = ${m(ey)}<br>${ans}`, 'spMoveY', { a: Math.abs(dy) }),
    ];
    let oops = null;
    if (same(given, pr(x - dx, y + dy)) || same(given, pr(x + dx, y - dy))) oops = OOPS('➡️ ⬆️ +<br>⬅️ ⬇️ −', 'spOopsWay');
    else if (same(given, pr(dx, dy))) oops = OOPS(ans, 'spOopsStart');
    else if (same(given, pr(x + dy, y + dx))) oops = OOPS(ans, 'spOopsMoveSwap');
    return { ans, steps, oops };
  }
  if (ask === 'dist') {
    const { p1, p2 } = sol, across = p1[1] === p2[1], k = across ? 0 : 1, a = p1[k], b = p2[k], ans = Math.abs(b - a);
    const mid = across ? [0, p1[1]] : [p1[0], 0];
    const marks = [[...p1, sol.e], [...p2, sol.e2]];
    const steps = [
      S(starMap(n, { marks, arrows: [[...p1, ...mid, RED, Math.abs(a)]] }), `${Math.abs(a)}`, 'spDist1', { a: sol.e, b: Math.abs(a) }),
      S(starMap(n, { marks, arrows: [[...p1, ...mid, RED, Math.abs(a)], [...mid, ...p2, BLUE, Math.abs(b)]] }), `${Math.abs(a)} + ${Math.abs(b)} = ${ans}`, 'spDist2', { a: sol.e2, b: Math.abs(b) }),
    ];
    const oops = given !== undefined && given !== ans && [Math.abs(a), Math.abs(b), Math.abs(a + b)].includes(given) ? OOPS(`${Math.abs(a)} + ${Math.abs(b)} = ${ans}`, 'spOopsDist') : null;
    return { ans, steps, oops };
  }
  // mirror in the red axis
  const { x, y, ax, e } = sol, mx = ax === 'y' ? -x : x, my = ax === 'x' ? -y : y, ans = pr(mx, my);
  const foot = ax === 'x' ? [x, 0] : [0, y], d = ax === 'x' ? Math.abs(y) : Math.abs(x);
  const steps = [
    S(starMap(n, { marks: [[x, y, e]], mirror: ax, arrows: [[x, y, ...foot, VIOLET, d]] }), `${d}`, 'spMirror1', { a: e, b: d }),
    S(starMap(n, { marks: [[x, y, e]], ghosts: [[mx, my, e]], mirror: ax, arrows: [[x, y, ...foot, VIOLET, d], [...foot, mx, my, VIOLET, d]] }), `${pr(x, y)} → ${ans}`, 'spMirror2', { a: d }),
  ];
  let oops = null;
  if (same(given, pr(-x, -y))) oops = OOPS(`${pr(x, y)} → ${ans}`, 'spOopsBoth');
  else if (same(given, pr(ax === 'y' ? x : -x, ax === 'x' ? y : -y))) oops = OOPS(`${pr(x, y)} → ${ans}`, 'spOopsAxis');
  else if (same(given, pr(y, x))) oops = OOPS(ans, 'spOopsSwap');
  return { ans, steps, oops };
}

// Two paths on the star map cross at one point.
function sCross({ n, lines }, q, given) {
  const [[m1, c1], [m2, c2]] = lines, x = (c2 - c1) / (m1 - m2), y = m1 * x + c1, ans = pr(x, y);
  const steps = [
    S(starMap(n, { lines, rings: [[x, y]] }), '', 'spCrossMeet'),
    S(starMap(n, { lines, rings: [[x, y]], arrows: walk(0, 0, x, y) }), ans, 'spWalk'),
  ];
  return { ans, steps, oops: same(given, pr(y, x)) && x !== y ? OOPS(ans, 'spOopsSwap') : null };
}

// ---------- picture numbers ----------
// The rows of a picture puzzle with the numbers found so far under their pictures.
const cell = (p, known, hi) => ({ v: nm(p), sub: known[nm(p)] !== undefined ? m(known[nm(p)]) : null, hi: hi === nm(p) });
function sPair(sol, q, given) {
  const { ask, P, a, b, c, k } = sol, [A, B, C] = P, val = { [nm(A)]: a, [nm(B)]: b, [nm(C)]: c };
  const known = {};
  // Each row: its cells (pictures and signs) and its total.
  let rows;
  if (ask === 'dbl') rows = [[Array(k).fill(A), '+', k * a]];
  else if (ask === 'pair') rows = [[[A, A], '+', 2 * a], [[A, B], '+', a + b]];
  else if (ask === 'tri') rows = [[[A, A, A], '+', 3 * a], [[A, B], '+', a + b], [[B, C], '+', b + c]];
  else if (ask === 'chain') rows = [[[A, A], '+', 2 * a], [[A, B], '+', a + b], [[B, C], '−', b - c]];
  else if (ask === 'chainx') rows = [[[A, A], '+', 2 * a], [[A, B], '×', a * b], [[B, C], '+', b + c]];
  else rows = [[[A, A], '+', 2 * a], [[A, B], '+', a + b], [[B, C], '+', b + c]];
  const draw = (hl, hi) => eqs(rows.map(([ps, op, tot], i) => ({ hl: i === hl, c: [...ps.flatMap((p, j) => (j ? [op, cell(p, known, hi)] : [cell(p, known, hi)])), '=', m(tot)] })));
  const steps = [];
  rows.forEach(([ps, op, tot], i) => {
    const kinds = [...new Set(ps.map(nm))], newP = ps.find(p => known[nm(p)] === undefined);
    if (!newP) return;
    const np = nm(newP);
    let v, math, key, vars;
    if (kinds.length === 1) {
      v = tot / ps.length; math = `${hv(newP)} = ${tot} ÷ ${ps.length} = ${v}`; key = 'spShare'; vars = { a: ps.length, b: tot };
    } else {
      const old = ps.find(p => nm(p) !== np), ov = known[nm(old)];
      if (op === '+') { v = tot - ov; math = `${hv(newP)} = ${tot} − ${ov} = ${v}`; key = 'spFillBack'; }
      else if (op === '−') { v = ov - tot; math = `${hv(newP)} = ${ov} − ${tot} = ${v}`; key = 'spMinus'; }
      else { v = tot / ov; math = `${hv(newP)} = ${tot} ÷ ${ov} = ${v}`; key = 'spDivRow'; }
      vars = { a: nm(old), b: m(ov), c: np, d: tot };
    }
    known[np] = v;
    steps.push(S(draw(i, np), math, key, vars));
  });
  let ans = known[nm(ask === 'dbl' ? A : ask === 'pair' ? B : C)];
  if (ask === 'sum3') {
    ans = known[nm(A)] + known[nm(B)] + known[nm(C)];
    steps.push(S(eqs([[cell(A, known), '+', cell(B, known), '+', cell(C, known), '=', m(ans)]]), `${known[nm(A)]} + ${known[nm(B)]} + ${known[nm(C)]} = ${ans}`, 'spAddAll'));
  }
  if (ask === 'dbl') steps.push(S(eqs([copies(k, () => cell(A, known)).concat(['=', k * a])]), `${k} × ${known[nm(A)]} = ${k * a}`, 'spCheck'));
  let oops = null;
  if (given !== undefined && given !== ans) {
    if (ask === 'dbl' && given === k * a) oops = OOPS(`${hv(A)} = ${k * a} ÷ ${k}`, 'spOopsAll');
    else if (ask === 'pair' && given === a) oops = OOPS(`${hv(A)} = ${a}`, 'spOopsOther', { a: nm(A), b: nm(B) });
    else if (ask === 'pair' && given === a + b) oops = OOPS(`${hv(A)} + ${hv(B)} = ${a + b}`, 'spOopsTotal', { a: nm(B) });
    else if (ask === 'sum3' && (given === a + b || given === b + c)) oops = OOPS(`${hv(A)} + ${hv(B)} + ${hv(C)}`, 'spOopsAll3');
    else if (ask !== 'sum3' && ask !== 'dbl' && given === val[nm(B)]) oops = OOPS(`${hv(B)} = ${b}`, 'spOopsOther', { a: nm(B), b: nm(C) });
  }
  return { ans, steps, oops };
}

// Each row adds up to its number; find the pictures one at a time, starting with the row of one kind.
function sPGrid({ rows, sums, ask, pic }, q, given) {
  const known = {}, steps = [], left = rows.map((r, i) => i);
  const draw = (hl, hi) => eqs(rows.map((r, i) => ({ hl: i === hl, c: [...plus(r.map(p => cell(p, known, hi))), '=', sums[i]] })));
  while (left.length) {
    const i = left.find(j => new Set(rows[j].filter(p => known[p] === undefined)).size === 1);
    if (i === undefined) return null;
    left.splice(left.indexOf(i), 1);
    const r = rows[i], p = r.find(x => known[x] === undefined), cnt = r.filter(x => x === p).length;
    const have = r.filter(x => x !== p).reduce((s, x) => s + known[x], 0), v = (sums[i] - have) / cnt;
    const lines = [have ? `${sums[i]} − ${have} = ${sums[i] - have}` : '', cnt > 1 ? `${hv(p)} = ${sums[i] - have} ÷ ${cnt} = ${v}` : `${hv(p)} = ${v}`].filter(Boolean);
    known[p] = v;
    steps.push(S(draw(i, p), lines.join('<br>'), have ? (cnt > 1 ? 'spTakeKnownShare' : 'spTakeKnown') : 'spShare', { a: cnt, b: sums[i], c: p }));
  }
  const ps = Object.keys(known);
  let ans;
  if (ask === 'all') {
    ans = ps.reduce((s, p) => s + known[p], 0);
    steps.push(S(eqs([[...plus(ps.map(p => cell(p, known))), '=', ans]]), `${ps.map(p => known[p]).join(' + ')} = ${ans}`, 'spAddAll'));
  } else ans = known[pic];
  const other = ask !== 'all' && ps.some(p => p !== pic && known[p] === given && given !== ans);
  return { ans, steps, oops: other ? OOPS(`${hv(pic)} = ${ans}`, 'spOopsOtherPic', { a: pic }) : null };
}

// ---------- two clues, two pictures ----------
// A + B = s and A − B = d: add the rows, the B's cancel.
function sSum({ P, s, d, ask }, q, given) {
  const [A, B] = P.map(nm), a = (s + d) / 2, b = s - a, n = { [A]: a, [B]: b };
  const ans = ask === 'AA' ? 2 * a : ask === 'A' ? a : b;
  const sub = p => ({ v: p, sub: m(n[p]) });
  const steps = [
    S(eqs([[A, '+', { v: B, gone: true }, '=', m(s)], { op: '+', c: [A, '−', { v: B, gone: true }, '=', m(d)] }, { line: true, c: [A, '+', A, '=', m(s + d)] }]),
      `${m(s)} + ${m(d)} = ${m(s + d)}`, 'spAddRows', { a: B }),
  ];
  if (ask !== 'AA') steps.push(S(eqs([[sub(A), '+', sub(A), '=', m(2 * a)]]), `${hv(A)} = ${m(2 * a)} ÷ 2 = ${m(a)}`, 'spShare', { a: 2, b: m(2 * a) }));
  if (ask === 'B') steps.push(S(eqs([{ hl: true, c: [sub(A), '+', { v: B, hi: true, sub: m(b) }, '=', m(s)] }]), `${hv(B)} = ${m(s)} − ${m(a)} = ${m(b)}`, 'spFillBack', { a: A, b: m(a), c: B }));
  if (ask === 'AA') steps.push(S(eqs([[sub(A), '+', sub(A), '=', m(2 * a)]]), `${hv(A)} + ${hv(A)} = ${m(2 * a)}`, 'spTwoOf', { a: A }));
  let oops = null;
  if (given !== undefined && given !== ans) {
    const askP = ask === 'B' ? B : A, other = ask === 'B' ? A : B;
    if (ask === 'AA' && given === a) oops = OOPS(`${hv(A)} + ${hv(A)} = ${m(2 * a)}`, 'spOopsTwo', { a: A });
    else if (ask !== 'AA' && given === n[other]) oops = OOPS(`${hv(askP)} = ${m(ans)}`, 'spOopsOther', { a: other, b: askP });
    else if (ask !== 'AA' && given === 2 * ans) oops = OOPS(`${hv(askP)} = ${m(2 * ans)} ÷ 2`, 'spOopsHalf', { a: 2, b: askP });
    else if (ask !== 'AA' && given === s) oops = OOPS(`${hv(A)} + ${hv(B)} = ${m(s)}`, 'spOopsTotal', { a: askP });
  }
  return { ans, steps, oops };
}

// p of A and q of B make u[0]; one A and one B make u[1]. Take the second row away as often as fits.
function sTake({ P, c: [p, qq], u: [t1, t2], ask, unit = '' }, q, given) {
  const [A, B] = P.map(nm), r = Math.min(p, qq), lc = Math.abs(p - qq), Lp = p > qq ? A : B, Op = Lp === A ? B : A;
  const lv = (t1 - r * t2) / lc, ov = t2 - lv, n = { [Lp]: lv, [Op]: ov };
  const ans = ask === 'A' ? n[A] : n[B], asked = ask === 'A' ? A : B;
  const T = v => m(v) + unit;
  // The top row with the pictures that cancel crossed out: the first r of each kind.
  const top = (gone) => plus([...Array.from({ length: p }, (_, i) => ({ v: A, gone: gone && i < r })), ...Array.from({ length: qq }, (_, i) => ({ v: B, gone: gone && i < r }))]).concat(['=', T(t1)]);
  const low = k => ({ op: '−', c: plus([...Array(k).fill(0).map(() => ({ v: A, gone: true })), ...Array(k).fill(0).map(() => ({ v: B, gone: true }))]).concat(['=', T(k * t2)]) });
  const rest = { line: true, c: copies(lc, Lp).concat(['=', T(lc * lv)]) };
  const steps = [];
  if (r > 1) steps.push(S(eqs([top(false), { op: '×' + r, c: plus([...Array(r).fill(A), ...Array(r).fill(B)]).concat(['=', T(r * t2)]) }]), `${r} × ${t2} = ${r * t2}`, 'spRowTwice', { a: r }));
  steps.push(S(eqs([top(true), low(r), rest]), `${t1} − ${r * t2} = ${lc * lv}`, 'spTakeRows', { a: Lp }));
  if (lc > 1) steps.push(S(eqs([copies(lc, { v: Lp, sub: T(lv) }).concat(['=', T(lc * lv)])]), `${hv(Lp)} = ${lc * lv} ÷ ${lc} = ${lv}`, 'spShare', { a: lc, b: lc * lv }));
  if (asked === Op) steps.push(S(eqs([{ hl: true, c: [{ v: A, sub: A === Lp ? T(lv) : null, hi: A === Op }, '+', { v: B, sub: B === Lp ? T(lv) : null, hi: B === Op }, '=', T(t2)] }]), `${hv(Op)} = ${t2} − ${lv} = ${ov}`, 'spFillBack', { a: Lp, b: lv, c: Op }));
  if (steps.length < 2) steps.push(S(eqs([[{ v: A, sub: T(n[A]) }, '+', { v: B, sub: T(n[B]) }, '=', T(t2)]]), `${n[A]} + ${n[B]} = ${t2}`, 'spCheckRow'));
  let oops = null;
  if (given !== undefined && given !== ans) {
    const other = asked === A ? B : A;
    if (given === t1 + t2) oops = OOPS(`${t1} − ${t2}`, 'spOopsAdded');
    else if (given === n[other]) oops = OOPS(`${hv(asked)} = ${ans}`, 'spOopsOther', { a: other, b: asked });
    else if (asked === Lp && lc > 1 && given === lc * lv) oops = OOPS(`${hv(Lp)} = ${lc * lv} ÷ ${lc}`, 'spOopsHalf', { a: lc, b: Lp });
  }
  return { ans, steps, oops };
}

// bg = k × sm + c, and sm + bg = u: swap bg for what it is worth, so only sm is left.
function sSwap({ sm, bg, k, c, u, ask }, q, given) {
  const Sm = nm(sm), Bg = nm(bg), v = (u - c) / (k + 1), w = k * v + c, ans = ask === 'bg' ? w : v;
  const worth = (sub, sw = true) => [...copies(k, { v: Sm, sw, sub }), ...(c ? ['+', { v: String(c), sw }] : [])];
  const worthHtml = (x = hv(sm)) => `${k > 1 && x === hv(sm) ? Array(k).fill(x).join(' + ') : k > 1 ? `${k} × ${x}` : x}${c ? ` + ${c}` : ''}`;
  const steps = [
    S(eqs([[Bg, '=', ...worth(null, false)], [Sm, '+', ...worth(null), '=', u]]), `${hv(bg)} → ${worthHtml()}`, 'spSwapIn', { a: Bg, b: Sm }),
  ];
  if (c) steps.push(S(eqs([copies(k + 1, Sm).concat(['=', u - c])]), `${u} − ${c} = ${u - c}`, 'spTakeNum', { a: c }));
  steps.push(S(eqs([copies(k + 1, { v: Sm, sub: v }).concat(['=', u - c])]), `${hv(sm)} = ${u - c} ÷ ${k + 1} = ${v}`, 'spShare', { a: k + 1, b: u - c }));
  if (ask === 'bg') steps.push(S(eqs([{ hl: true, c: [{ v: Bg, hi: true, sub: w }, '=', ...worth(v, false)] }]), `${hv(bg)} = ${worthHtml(String(v))} = ${w}`, 'spBigBack', { a: Bg }));
  let oops = null;
  if (given !== undefined && given !== ans) {
    const [askP, other, ov] = ask === 'bg' ? [Bg, Sm, v] : [Sm, Bg, w];
    if (given === ov) oops = OOPS(`${hv(ask === 'bg' ? bg : sm)} = ${ans}`, 'spOopsOther', { a: other, b: askP });
    else if (given === u) oops = OOPS(`${hv(sm)} + ${hv(bg)} = ${u}`, 'spOopsTotal', { a: askP });
    else if (ask !== 'bg' && given === u - c && k + 1 > 1) oops = OOPS(`${hv(sm)} = ${u - c} ÷ ${k + 1}`, 'spOopsHalf', { a: k + 1, b: Sm });
  }
  return { ans, steps, oops };
}

// Which line do you get by swapping B = A + k into A + B = s?
function sWhich({ P, k, s }, q, given) {
  const [A, B] = P.map(nm), want = `${A} + ${A} + ${k} = ${s}`;
  const ans = q.choices.find(ch => plain(ch.html) === want)?.value;
  const steps = [
    S(eqs([[{ v: B, hi: true }, '=', { v: A, sw: true }, '+', { v: String(k), sw: true }], [A, '+', { v: B, hi: true }, '=', s]]), '', 'spWhichSwap', { a: B, b: A, c: k }),
    S(eqs([[A, '+', { v: A, sw: true }, '+', { v: String(k), sw: true }, '=', s]]), `${hv(P[0])} + ${hv(P[0])} + ${k} = ${s}`, 'spWhichGot', { a: A }),
  ];
  const g = q.choices.find(ch => ch.value === given), gp = g ? plain(g.html) : '';
  let oops = null;
  if (g && given !== ans) {
    if (gp === `${A} + ${k} = ${s}`) oops = OOPS(`${hv(P[0])} + ${hv(P[1])} → ${hv(P[0])} + ${hv(P[0])} + ${k}`, 'spOopsKeep', { a: A, b: B });
    else if (gp === `${A} + ${B} + ${k} = ${s}`) oops = OOPS(`${hv(P[1])} → ${hv(P[0])} + ${k}`, 'spOopsGone', { a: B });
    else if (gp === `${A} + ${A} = ${s} + ${k}`) oops = OOPS(`${hv(P[0])} + ${hv(P[0])} + ${k} = ${s}`, 'spOopsSide', { a: k });
  }
  return { ans, steps, oops };
}

// ---------- the rule machine ----------
// A rule like "x × 3 + 2" or "20 − x", worked out from left to right.
const ruleF = rule => x => {
  const t = rule.split(' ').map(s => (s === 'x' ? x : s));
  let v = +t[0];
  for (let i = 1; i < t.length; i += 2) { const b = +t[i + 1]; v = t[i] === '+' ? v + b : t[i] === '−' ? v - b : t[i] === '×' ? v * b : v / b; }
  return v;
};
const ruleOn = (rule, x) => rule.split(' ').map(s => (s === 'x' ? x : s)).join(' ');
const ruleHtml = rule => rule.split(' ').map(s => (s === 'x' ? X : s)).join(' ');
function rtab(xs, ys, extra = null) {
  const cellX = (v, st = '') => `<td${st}>${v}</td>`;
  const hi = ' style="background:#d7f5e6"', hole = ' style="background:#fff8e0"';
  const ex = extra ? [cellX(extra[0], extra[0] === '?' ? hole : hi), cellX(extra[1], extra[1] === '?' ? hole : hi)] : ['', ''];
  return `<table class="rtab"><tr><th>${X}</th>${xs.map(v => cellX(v)).join('')}${ex[0]}</tr><tr><th>${Y}</th>${ys.map(v => cellX(v)).join('')}${ex[1]}</tr></table>`;
}
function sRule({ ask, rule, xs, ys, xq, yq }, q, given) {
  if (ask === 'rule') {
    const rows = q.choices.map(ch => {
      const r = plain(ch.html), f = ruleF(r), miss = xs.findIndex((x, i) => f(x) !== ys[i]);
      return [miss < 0 ? `${ruleHtml(r)}` : `${ruleHtml(r)}: ${xs[miss]} → ${m(f(xs[miss]))} ≠ ${ys[miss]}`, miss < 0, ch.value];
    });
    const ok = rows.find(r => r[1]);
    return { ans: ok?.[2], steps: [S(rtab(xs, ys), '', 'spRuleTry'), S(checks(rows.map(([h, o]) => [h, o])), '', 'spRuleEvery')] };
  }
  const f = ruleF(rule);
  const first = S(checks(xs.map((x, i) => [`${ruleOn(rule, x)} = ${m(f(x))}`, f(x) === ys[i]])), `${Y} = ${ruleHtml(rule)}`, 'spRuleFind');
  if (ask === 'next') {
    const ans = f(xq);
    let oops = null;
    if (given !== undefined && given !== ans) {
      if (given === xq + ys[0] - xs[0]) oops = OOPS(`${Y} = ${ruleHtml(rule)}`, 'spOopsRuleOne');
      else if (given === ys[2] + (ys[2] - ys[1])) oops = OOPS(`${ruleOn(rule, xq)} = ${m(ans)}`, 'spOopsRuleRow', { a: xq });
    }
    return { ans, steps: [first, S(rtab(xs, ys, [xq, m(ans)]), `${ruleOn(rule, xq)} = ${m(ans)}`, 'spRuleUse', { a: xq })], oops };
  }
  // back: undo the steps of the rule in the other order
  const t = rule.split(' '), undo = { '+': '−', '−': '+', '×': '÷', '÷': '×' };
  let v = yq;
  const lines = [];
  for (let i = t.length - 2; i >= 1; i -= 2) {
    const k = +t[i + 1], nv = ruleF(`${v} ${undo[t[i]]} ${k}`)(0);
    lines.push(`${v} ${undo[t[i]]} ${k} = ${nv}`);
    v = nv;
  }
  const ans = v;
  return {
    ans,
    steps: [first, S(rtab(xs, ys, [m(ans), yq]), lines.join('<br>'), 'spRuleBack', { a: yq })],
    oops: given === yq ? OOPS(`${ruleOn(rule, ans)} = ${yq}`, 'spOopsBack') : null,
  };
}

// ---------- x and y ----------
function sCheck({ gx, gy, s, d }, q) {
  const s1 = gx + gy, d1 = gx - gy, ok1 = s1 === s, ok2 = d1 === d, ok = ok1 && ok2;
  const r1 = [`${m(gx)} + ${m(gy)} = ${m(s1)}`, ok1], r2 = [`${m(gx)} − ${m(gy)} = ${m(d1)}`, ok2];
  return {
    ans: ok ? 'y' : 'n',
    steps: [S(checks([r1]), `${m(s1)} ${ok1 ? '=' : '≠'} ${m(s)}`, 'spPlugIn', { a: m(gx), b: m(gy) }),
      S(checks([r1, r2]), `${m(d1)} ${ok2 ? '=' : '≠'} ${m(d)}`, 'spPlugIn2'),
      S(big(ok ? '✓' : '✗'), '', ok ? 'spBothOk' : 'spNotBoth')],
  };
}

// ---------- stories ----------
// Emoji in rows of up to 6, each with a small number under it.
function critters(list) {
  const per = 6, W = 44, H = 50, rows = Math.ceil(list.length / per);
  let b = '';
  list.forEach(([e, sub, hi], i) => {
    const x = 4 + (i % per) * W, y = 4 + Math.floor(i / per) * H;
    if (hi) b += `<rect x="${x + 1}" y="${y}" width="${W - 4}" height="${H - 4}" rx="8" fill="${PALE}" stroke="${MINT}" stroke-width="2"/>`;
    b += `<text x="${x + W / 2 - 2}" y="${y + 17}" font-size="24" text-anchor="middle" dominant-baseline="central">${e}</text>`;
    if (sub !== undefined) b += txt(x + W / 2 - 2, y + 38, sub, 13, hi ? MINT : '#56608a');
  });
  return svg(Math.min(list.length, per) * W + 8, rows * H + 6, b);
}
function sLegs({ n, legs }, q, given) {
  const e = legs - 2 * n, r = e / 2;
  const hens = critters(Array.from({ length: n }, () => ['🐔', '2']));
  const turned = critters(Array.from({ length: n }, (_, i) => (i < r ? ['🐰', '+2', true] : ['🐔', '2'])));
  const steps = [
    S(hens, `${n} × 2 = ${2 * n}`, 'spLegsAll2', { a: n }),
    S(turned, `${legs} − ${2 * n} = ${e}<br>${e} ÷ 2 = ${r}`, 'spLegsExtra', { a: e }),
    S(critters(Array.from({ length: n }, (_, i) => (i < r ? ['🐰', '4', true] : ['🐔', '2']))), `${r} × 4 + ${n - r} × 2 = ${legs}`, 'spLegsCheck', { a: r }),
  ];
  return { ans: r, steps, oops: given === n - r && n - r !== r ? OOPS(`🐰 = ${r}`, 'spOopsChickens') : null };
}
// Cats, dogs and birds: each kind has d more than the one before, u in all.
function sMore3({ d, u }, q, given) {
  const c = (u - 3 * d) / 3;
  const steps = [
    S(eqs([['🐶', '=', '🐱', '+', d], ['🐦', '=', '🐱', '+', 2 * d], ['🐱', '+', { v: '🐱', sw: true }, '+', { v: String(d), sw: true }, '+', { v: '🐱', sw: true }, '+', { v: String(2 * d), sw: true }, '=', u]]), `🐦 = 🐱 + ${2 * d}`, 'spSwapIn3'),
    S(eqs([['🐱', '+', '🐱', '+', '🐱', '=', 3 * c]]), `${u} − ${d} − ${2 * d} = ${3 * c}`, 'spTakeNum', { a: d + 2 * d }),
    S(eqs([copies(3, { v: '🐱', sub: c }).concat(['=', 3 * c])]), `🐱 = ${3 * c} ÷ 3 = ${c}`, 'spShare', { a: 3, b: 3 * c }),
  ];
  return { ans: c, steps, oops: given === c + d ? OOPS(`🐶 = 🐱 + ${d}`, 'spOopsMiddle', { a: d }) : null };
}

// ---------- logic grid, number trail ----------
function latins(n) {
  const out = [], rows = [], g = [];
  const perm = (a, p = []) => (a.length ? a.forEach((v, i) => perm(a.filter((_, j) => j !== i), [...p, v])) : rows.push(p));
  perm(Array.from({ length: n }, (_, i) => i + 1));
  const build = r => {
    if (r === n) { out.push(g.map(x => x.slice())); return; }
    for (const row of rows) if (row.every((v, c) => g.slice(0, r).every(x => x[c] !== v))) { g[r] = row; build(r + 1); }
  };
  build(0);
  return out;
}
const LAT = {};
const cageOk = ([op, tg], vals) => {
  const hi = Math.max(...vals), lo = Math.min(...vals);
  if (!op) return vals[0] === tg;
  if (op === '+') return vals.reduce((s, v) => s + v, 0) === tg;
  if (op === '×') return vals.reduce((s, v) => s * v, 1) === tg;
  if (op === '−') return hi - lo === tg;
  return hi === lo * tg;
};
function kenPic(n, cages, rules, grid, { show = null, hiCage = -1, qc }) {
  const u = n === 3 ? 58 : 48, P = 4, Z = n * u, id = [];
  cages.forEach((cs, k) => cs.forEach(([r, c]) => { (id[r] ||= [])[c] = k; }));
  let b = `<rect x="${P}" y="${P}" width="${Z}" height="${Z}" fill="#fff"/>`;
  if (hiCage >= 0) for (const [r, c] of cages[hiCage]) b += `<rect x="${P + c * u}" y="${P + r * u}" width="${u}" height="${u}" fill="#fff3c4"/>`;
  b += `<rect x="${P + qc[1] * u + 3}" y="${P + qc[0] * u + 3}" width="${u - 6}" height="${u - 6}" rx="6" fill="${PALE}" stroke="${MINT}" stroke-width="3"/>`;
  for (let i = 1; i < n; i++) b += `<line x1="${P + i * u}" y1="${P}" x2="${P + i * u}" y2="${P + Z}" stroke="#c9cdf0" stroke-width="1.5"/><line x1="${P}" y1="${P + i * u}" x2="${P + Z}" y2="${P + i * u}" stroke="#c9cdf0" stroke-width="1.5"/>`;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (c < n - 1 && id[r][c] !== id[r][c + 1]) b += `<line x1="${P + (c + 1) * u}" y1="${P + r * u}" x2="${P + (c + 1) * u}" y2="${P + (r + 1) * u}" stroke="${INK}" stroke-width="4"/>`;
    if (r < n - 1 && id[r][c] !== id[r + 1][c]) b += `<line x1="${P + c * u}" y1="${P + (r + 1) * u}" x2="${P + (c + 1) * u}" y2="${P + (r + 1) * u}" stroke="${INK}" stroke-width="4"/>`;
    if (!show || show(r, c)) b += txt(P + c * u + u / 2, P + r * u + u / 2 + 5, grid[r][c], 24, r === qc[0] && c === qc[1] ? MINT : INK);
  }
  cages.forEach((cs, k) => {
    const [r, c] = cs.reduce((a, p) => (p[0] < a[0] || (p[0] === a[0] && p[1] < a[1]) ? p : a));
    if (rules[k][0]) b += `<text x="${P + c * u + 4}" y="${P + r * u + 14}" font-size="13" font-weight="800" fill="${VIOLET}">${rules[k][1]}${rules[k][0]}</text>`;
  });
  b += `<rect x="${P}" y="${P}" width="${Z}" height="${Z}" fill="none" stroke="${INK}" stroke-width="5" rx="3"/>`;
  return svg(Z + 2 * P, Z + 2 * P, b);
}
function sKen({ n, cages, rules, q: qc }, q) {
  LAT[n] ||= latins(n);
  const all = LAT[n].filter(g => cages.every((cs, k) => cageOk(rules[k], cs.map(([r, c]) => g[r][c]))));
  if (!all.length || new Set(all.map(g => g[qc[0]][qc[1]])).size !== 1) return null;
  const grid = all[0], ans = grid[qc[0]][qc[1]];
  const k = cages.findIndex(cs => cs.some(([r, c]) => r === qc[0] && c === qc[1])), [op, tg] = rules[k];
  const vals = cages[k].map(([r, c]) => grid[r][c]).sort((a, b) => b - a);
  const inCage = (r, c) => cages[k].some(([a, b]) => a === r && b === c);
  const single = (r, c) => !rules[cages.findIndex(cs => cs.some(([a, b]) => a === r && b === c))][0];
  const row = grid[qc[0]], col = grid.map(r => r[qc[1]]);
  return {
    ans,
    steps: [
      S(kenPic(n, cages, rules, grid, { show: (r, c) => inCage(r, c) || single(r, c), hiCage: k, qc }), `${vals.join(` ${op} `)} = ${tg}`, 'spKenCage', { a: `${tg}${op}` }),
      S(kenPic(n, cages, rules, grid, { hiCage: k, qc }), `↔ ${row.join(' ')}<br>↕ ${col.join(' ')}`, 'spKenRows', { a: n }),
    ],
  };
}
function sTrail({ start, ops }, q) {
  const vals = [start];
  for (const o of ops) {
    const op = o[0], k = +o.slice(1), v = vals[vals.length - 1];
    vals.push(op === '+' ? v + k : op === '−' ? v - k : op === '×' ? v * k : v / k);
  }
  const ans = vals[vals.length - 1], cut = Math.ceil(ops.length / 2), steps = [];
  const line = i => `${vals[i]} ${ops[i][0]} ${ops[i].slice(1)} = ${vals[i + 1]}`;
  [[0, cut], [cut, ops.length]].forEach(([from, to], j) => {
    const shown = vals.map((v, i) => (i <= to ? (i === to ? { v, hi: true } : v) : null));
    steps.push(S(tiles(shown, { arcs: ops }), Array.from({ length: to - from }, (_, i) => line(from + i)).join('<br>'), j ? 'spTrailEnd' : 'spTrail'));
  });
  return { ans, steps };
}

// ---------- quick sums ----------
function sSq({ a }, q, given) {
  const v = a * a, steps = [S(dots(a, a, a > 10 ? { split: 10 } : {}), `${a}² = ${a} × ${a}`, 'spSquare', { a })];
  if (a > 10) steps.push(S(dots(a, a, { split: 10 }), `10 × ${a} = ${10 * a}<br>${a - 10} × ${a} = ${(a - 10) * a}<br>${10 * a} + ${(a - 10) * a} = ${v}`, 'spSquareSplit', { a: a - 10 }));
  else steps.push(S(dots(a, a), `${a} × ${a} = ${v}`, 'spSquareRows', { a }));
  return { ans: v, steps, oops: given === 2 * a ? OOPS(`${a}² = ${a} × ${a}`, 'spOopsSq2', { a }) : null };
}
// One bar of a cut into two parts, each with its number.
function splitBar(parts, w = 250) {
  const tot = parts.reduce((s, v) => s + v, 0);
  let b = '', x = 4;
  parts.forEach((v, i) => {
    const pw = Math.max(40, (w * v) / tot);
    b += `<rect x="${x}" y="4" width="${pw}" height="34" fill="${i ? '#bfe3f7' : '#ffe39a'}" stroke="${INK}" stroke-width="2"/>` + txt(x + pw / 2, 22, v, 15);
    x += pw;
  });
  return svg(x + 4, 42, b);
}
function sHalf({ a }, q, given) {
  const h = a / 2, p1 = a >= 100 ? Math.floor(a / 100) * 100 : Math.floor(a / 20) * 20, p2 = a - p1;
  const steps = [];
  if (p1 && p2) {
    steps.push(S(splitBar([p1, p2]), `${a} = ${p1} + ${p2}`, 'spHalfSplit'));
    steps.push(S(valueBar(a, 2, 1), `${p1} ÷ 2 = ${p1 / 2}<br>${p2} ÷ 2 = ${p2 / 2}<br>${p1 / 2} + ${p2 / 2} = ${h}`, 'spHalfEach'));
  } else {
    steps.push(S(valueBar(a, 1, 0), `½ × ${a} = ${a} ÷ 2`, 'spHalf'));
    steps.push(S(valueBar(a, 2, 1), `${a} ÷ 2 = ${h}`, 'spHalfDone'));
  }
  return { ans: h, steps, oops: given === a ? OOPS(`${a} ÷ 2 = ${h}`, 'spOopsHalfAll') : null };
}
function sLin({ k, c, u }, q, given) {
  const v = (u - c) / k;
  const steps = [
    S(balance(`${k}x + ${c}`, `${u}`), `${k}${X} = ${u} − ${c} = ${u - c}`, 'spTakeBoth', { a: c }),
    S(balance(`${k}x`, `${u - c}`), `${X} = ${u - c} ÷ ${k} = ${v}`, 'spShareX', { a: k, b: u - c }),
  ];
  let oops = null;
  if (given !== undefined && given !== v) {
    if (given === Math.floor(u / k)) oops = OOPS(`${u} − ${c} = ${u - c}`, 'spOopsOrder', { a: c });
    else if (given === k * v) oops = OOPS(`${X} = ${k * v} ÷ ${k}`, 'spOopsHalf', { a: k, b: 'x' });
  }
  return { ans: v, steps, oops };
}
function sNeg({ a, b }, q, given) {
  const v = a - b, from = -b - 1, to = Math.max(1, v + 2);
  const steps = [
    S(nline(from, to, { marks: [[-b, RED, '']], labels: [0] }), m(-b), 'spNegStart', { a: m(-b) }),
    S(nline(from, to, { jumps: [[-b, v, '+' + a]], labels: [0] }), `${m(-b)} + ${a} = ${m(v)}`, 'spNegUp', { a }),
  ];
  let oops = null;
  if (given === -v) oops = OOPS(`${m(-b)} + ${a} = ${m(v)}`, 'spOopsNegSign');
  else if (given === -(a + b)) oops = OOPS(`${m(-b)} + ${a} = ${m(v)}`, 'spOopsNegWay');
  return { ans: v, steps, oops };
}

export const SPACE_SOLVERS = {
  sGrid, sCross, sPair, sPGrid, sSum, sTake, sSwap, sWhich, sRule, sCheck, sLegs, sMore3, sKen, sTrail, sSq, sHalf, sLin, sNeg,
};
