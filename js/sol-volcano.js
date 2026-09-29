// Solutions for the Volcano world: numbers below zero on a thermometer, order of operations step by step,
// powers as chains of ×, equations on a balance scale (do the same to both sides), inequalities on a
// number line, number and shape puzzles and two dice. Same shape as sol-basic.js: each solver works the
// answer out itself from q.sol and returns { ans, steps, oops }.
import { S, OOPS, m, plain } from './sol-basic.js';
import { nline, tiles, dots, checks, gallery, big } from './sol-pics.js';
import { digitRows, gridPic, segBar } from './sol-pics2.js';
import { frac } from './ocean.js';

const INK = '#1e2650', RED = '#ef5b52', BLUE = '#3e9be0', MINT = '#2fb383', SUN = '#ffc23d', PALE = '#d7f5e6', GREY = '#b9c1d6';
const BOXC = '#c68a4e', BOXD = '#6b4420', ASH = '#e4e7ee', ROCK = '#8a6f5c';
const svg = (w, h, body, dw = w, dh = h) => `<svg class="solsvg" viewBox="0 0 ${w} ${h}" width="${dw}" height="${dh}">${body}</svg>`;
const txt = (x, y, s, { size = 16, fill = INK, anchor = 'middle', extra = '' } = {}) =>
  `<text x="${x}" y="${y}" font-size="${size}" font-weight="800" fill="${fill}" text-anchor="${anchor}" dominant-baseline="central" ${extra}>${s}</text>`;
const SYM = (x, y) => (x > y ? '>' : x < y ? '<' : '=');
const esc = s => s.replace('<', '&lt;').replace('>', '&gt;');
const SUPS = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const sup = n => String(n).split('').map(d => SUPS[d]).join('');
const pw = (b, e) => `${b}${sup(e)}`;
const BOX = '<span class="mbox"></span>', X = '<i class="vx">x</i>';
const V = v => (v === 'x' ? X : BOX);
const kv = (k, v) => (k === 1 ? V(v) : `${k}${V(v)}`);
const HL = 'background:#ffe39a;border-radius:8px;padding:0 4px;box-shadow:0 0 0 2px #ffc23d';
const NEWV = 'background:#d7f5e6;border-radius:8px;padding:0 4px;box-shadow:0 0 0 2px #2fb383';
const col = (...lines) => `<div style="display:flex;flex-direction:column;align-items:center;gap:2px;font-size:26px;font-weight:800;white-space:nowrap">${lines.map(l => `<div>${l}</div>`).join('')}</div>`;
const DOWN = '<span style="color:#2fb383;font-size:20px">⬇</span>';

// ---------- pictures ----------
// A vertical number line like a thermometer (or the volcano lift). level fills it red up to a value;
// marks: [[v, colour]]; jumps: [[from, to, label, colour]] drawn as arrows on the right.
function vline(lo, hi, { level = null, marks = [], jumps = [], tick = 0, lab = 0 } = {}) {
  const n = hi - lo, u = Math.min(24, 190 / n), top = 12, X0 = 58;
  const y = v => +(top + (hi - v) * u).toFixed(1);
  const H = top + n * u + (level !== null ? 36 : 14);
  let b = `<rect x="${X0 - 7}" y="${top - 6}" width="14" height="${n * u + 12 + (level !== null ? 8 : 0)}" rx="7" fill="#fff" stroke="${INK}" stroke-width="2.5"/>`;
  if (level !== null) b += `<rect x="${X0 - 3.5}" y="${y(level)}" width="7" height="${(y(lo) + 12 - y(level)).toFixed(1)}" fill="${RED}"/><circle cx="${X0}" cy="${y(lo) + 20}" r="11" fill="${RED}" stroke="${INK}" stroke-width="2.5"/>`;
  const ts = tick || (u >= 4 ? 1 : 2);
  for (let v = Math.ceil(lo / ts) * ts; v <= hi; v += ts) {
    const long = v % 5 === 0;
    b += `<line x1="${X0 + 7}" y1="${y(v)}" x2="${X0 + (long ? 16 : 12)}" y2="${y(v)}" stroke="${INK}" stroke-width="${long ? 2.2 : 1.2}"/>`;
  }
  if (lo <= 0 && hi >= 0) b += `<line x1="${X0 - 16}" y1="${y(0)}" x2="${X0 + 16}" y2="${y(0)}" stroke="${BLUE}" stroke-width="3"/>`;
  const LS = lab || [1, 2, 5, 10].find(s => s * u >= 15) || 10, placed = [];
  const want = [...marks.map(k => k[0]), ...jumps.flatMap(j => [j[0], j[1]]), ...(level !== null ? [level] : []), 0];
  for (let v = Math.ceil(lo / LS) * LS; v <= hi; v += LS) want.push(v);
  for (const v of want) {
    if (v < lo || v > hi || placed.some(p => Math.abs(p - y(v)) < 15)) continue;
    placed.push(y(v));
    b += txt(X0 - 14, y(v), m(v), { size: 15, anchor: 'end', fill: v === 0 ? BLUE : INK });
  }
  marks.forEach(([v, c = RED]) => { b += `<circle cx="${X0}" cy="${y(v)}" r="7" fill="${c}" stroke="${INK}" stroke-width="2"/>`; });
  jumps.forEach(([a, c, label, jc = MINT]) => {
    const x0 = X0 + 10, ya = y(a), yc = y(c), bu = Math.min(64, 18 + Math.abs(ya - yc) * 0.45), cx = x0 + bu * 1.6, my = (ya + yc) / 2;
    b += `<path d="M${x0} ${ya} Q${cx} ${my} ${x0 + 2} ${yc}" fill="none" stroke="${jc}" stroke-width="3"/>`;
    const dx = x0 + 2 - cx, dy = yc - my, l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l;
    b += `<path d="M${x0 + 2} ${yc} L${(x0 + 2 - ux * 9 - uy * 5).toFixed(1)} ${(yc - uy * 9 + ux * 5).toFixed(1)} L${(x0 + 2 - ux * 9 + uy * 5).toFixed(1)} ${(yc - uy * 9 - ux * 5).toFixed(1)}z" fill="${jc}"/>`;
    if (label) b += txt(x0 + bu * 0.8 + 6, my, label, { size: 15, fill: jc, anchor: 'start' });
  });
  return svg(170, Math.round(H), b);
}

// The balance scale from the game. Items: 'b' a box, 'x' an x block, or a number (a weight).
// tilt > 0 tips the left side down; take puts a red mark over each pan ('−5', '÷3' or { boxes: 2, it: 'b' }).
const isz = it => (typeof it === 'number' ? [18 + 11 * m(it).length, 30] : [32, 32]);
function panItems(items, cx, py) {
  const rows = [[]];
  let w = 0;
  for (const it of items) {
    const [iw] = isz(it);
    if (w + iw > 116 && rows[rows.length - 1].length) { rows.push([]); w = 0; }
    rows[rows.length - 1].push(it); w += iw + 3;
  }
  let out = '', y = py - 1;
  for (const r of rows) {
    let x = cx - r.reduce((s, it) => s + isz(it)[0] + 3, -3) / 2;
    const rh = Math.max(...r.map(it => isz(it)[1]));
    for (const it of r) {
      const [iw, ih] = isz(it), top = y - ih;
      if (it === 'b') out += `<rect x="${x}" y="${top}" width="${iw}" height="${ih}" rx="4" fill="${BOXC}" stroke="${BOXD}" stroke-width="2.5"/><line x1="${x + 2}" y1="${top + 8}" x2="${x + iw - 2}" y2="${top + 8}" stroke="${BOXD}" stroke-width="1.5"/>${txt(x + iw / 2, top + ih / 2 + 3, '?', { size: 20, fill: '#fff' })}`;
      else if (it === 'x') out += `<rect x="${x}" y="${top}" width="${iw}" height="${ih}" rx="5" fill="${RED}" stroke="${INK}" stroke-width="2"/>${txt(x + iw / 2, top + ih / 2, 'x', { size: 24, fill: '#fff', extra: 'font-style="italic" font-family="Georgia,serif"' })}`;
      else out += `<path d="M${x + 3} ${top} h${iw - 6} l3 ${ih} h${-iw} z" fill="${ASH}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>${txt(x + iw / 2, top + ih / 2 + 1, m(it), { size: 19 })}`;
      x += iw + 3;
    }
    y -= rh + 3;
  }
  return out;
}
function scale(left, right, { tilt = 0, take = null } = {}) {
  const by = 34, L = 64, Rt = 216;
  const pan = (cx, yy, items) => {
    const py = yy + 116;
    return `<line x1="${cx}" y1="${yy}" x2="${cx - 54}" y2="${py}" stroke="${INK}" stroke-width="1.5"/><line x1="${cx}" y1="${yy}" x2="${cx + 54}" y2="${py}" stroke="${INK}" stroke-width="1.5"/>` +
      `<path d="M${cx - 60} ${py} Q${cx} ${py + 18} ${cx + 60} ${py} Z" fill="#c9ced8" stroke="${INK}" stroke-width="2"/>` + panItems(items, cx, py);
  };
  let b = `<line x1="140" y1="${by}" x2="140" y2="184" stroke="${INK}" stroke-width="6"/><rect x="104" y="180" width="72" height="9" rx="4" fill="${ROCK}" stroke="${INK}" stroke-width="2"/>`;
  b += pan(L, by + tilt, left) + pan(Rt, by - tilt, right);
  b += `<line x1="${L}" y1="${by + tilt}" x2="${Rt}" y2="${by - tilt}" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><circle cx="140" cy="${by}" r="7" fill="${SUN}" stroke="${INK}" stroke-width="2"/>`;
  const mark = (x, yy, t) => {
    if (!t) return '';
    if (typeof t !== 'object') return txt(x, yy, t, { size: 22, fill: RED });
    const n = t.boxes > 1, bx = x + (n ? 4 : -2);
    const blk = t.it === 'x'
      ? `<rect x="${bx}" y="${yy - 10}" width="20" height="20" rx="4" fill="${RED}" stroke="${INK}" stroke-width="2"/>` + txt(bx + 10, yy, 'x', { size: 15, fill: '#fff', extra: 'font-style="italic" font-family="Georgia,serif"' })
      : `<rect x="${bx}" y="${yy - 10}" width="20" height="20" rx="4" fill="${BOXC}" stroke="${BOXD}" stroke-width="2"/>` + txt(bx + 10, yy + 1, '?', { size: 13, fill: '#fff' });
    return txt(x - 12, yy, `−${n ? t.boxes : ''}`, { size: 22, fill: RED }) + blk;
  };
  if (take) b += mark(L, by + tilt - 20, take[0]) + mark(Rt, by - tilt - 20, take[1]);
  return `<svg class="solsvg" viewBox="0 -18 280 210" width="250" height="188">${b}</svg>`;
}
const many = (k, it) => Array(k).fill(it);

// Both sides of an equation, one row under another, with what is done to both sides in red between.
// rows: { l, r, hi } or { op: [left, right] }.
function sides(rows) {
  const c = (h, st = '') => `<span style="${st}">${h}</span>`;
  const OP = 'color:#ef5b52;font-size:20px', FIN = 'background:#d7f5e6;border-radius:8px;padding:0 6px';
  const body = rows.map(r => (r.op ? c(r.op[0], OP) + c('') + c(r.op[1], OP) : c(r.l, r.hi ? FIN : '') + c('=') + c(r.r, r.hi ? FIN : ''))).join('');
  return `<div style="display:grid;grid-template-columns:auto auto auto;align-items:center;justify-items:center;gap:2px 10px;font-size:26px;font-weight:800;white-space:nowrap;line-height:1.3">${body}</div>`;
}

// A number line from lo to hi with a red ray for x > t (or <, ≥, ≤). marks: [[v, ok]] light up numbers below.
function rayLine(t, rel, lo, hi, marks = []) {
  const W = 300, L = 18, Rr = W - 18, y = 30, u = (Rr - L) / (hi - lo), px = v => L + (v - lo) * u;
  let b = `<line x1="${L - 10}" y1="${y}" x2="${Rr + 10}" y2="${y}" stroke="${INK}" stroke-width="2.5"/>`;
  for (let v = lo; v <= hi; v++) {
    const mk = marks.find(k => k[0] === v);
    b += `<line x1="${px(v)}" y1="${y - 5}" x2="${px(v)}" y2="${y + 5}" stroke="${INK}" stroke-width="1.5"/>`;
    if (mk) b += `<circle cx="${px(v)}" cy="${y + 24}" r="11" fill="${mk[1] ? PALE : '#fff'}" stroke="${mk[1] ? MINT : GREY}" stroke-width="2.5"/>`;
    b += txt(px(v), y + 24, v, { size: 14, fill: mk ? (mk[1] ? INK : GREY) : '#56608a' });
  }
  const right = rel === '>' || rel === '≥', full = rel === '≥' || rel === '≤', end = right ? Rr + 10 : L - 10;
  b += `<line x1="${px(t)}" y1="${y}" x2="${end}" y2="${y}" stroke="${RED}" stroke-width="6"/><path d="${right ? `M${end} ${y} l-10 -7 v14 z` : `M${end} ${y} l10 -7 v14 z`}" fill="${RED}"/>`;
  b += `<circle cx="${px(t)}" cy="${y}" r="7" fill="${full ? RED : '#fff'}" stroke="${RED}" stroke-width="3"/>`;
  return svg(W, 66, b);
}

// A number pyramid: rows of numbers, null for an empty brick. hole shows ?, hi bricks yellow, fresh bricks green.
function pyrV(rows, { hole = null, hi = [], fresh = [] } = {}) {
  const BW = 48, BH = 34, n = rows[rows.length - 1].length, has = (list, r, c) => list.some(([a, d]) => a === r && d === c);
  let b = '';
  rows.forEach((row, r) => row.forEach((v, c) => {
    const x = 4 + ((n - row.length) * BW) / 2 + c * BW, y = 4 + r * BH, isHole = hole && hole[0] === r && hole[1] === c && v === null;
    const fill = has(fresh, r, c) ? PALE : has(hi, r, c) ? '#ffe39a' : isHole ? '#fff8e0' : v === null ? '#eceae6' : '#fff';
    b += `<rect x="${x}" y="${y}" width="${BW - 3}" height="${BH - 3}" rx="5" fill="${fill}" stroke="${has(fresh, r, c) ? MINT : isHole ? SUN : INK}" stroke-width="2.5"${isHole ? ' stroke-dasharray="5 3"' : ''}/>`;
    b += txt(x + (BW - 3) / 2, y + (BH - 3) / 2 + 1, isHole ? '?' : v === null ? '' : v, { size: 16 });
  }));
  return svg(n * BW + 8, rows.length * BH + 8, b);
}

// The 3 × 3 magic square. cells: numbers or null; hi lights up a line; hole shows ? (or val).
function magicPic(cells, { hi = [], hole = -1, val = null } = {}) {
  const C = 54;
  let b = '';
  cells.forEach((v, i) => {
    const x = 3 + (i % 3) * C, y = 3 + Math.floor(i / 3) * C, isH = i === hole;
    const fill = isH ? (val === null ? '#fff8e0' : PALE) : hi.includes(i) ? '#ffe39a' : v === null ? '#e9e2da' : '#fff4e6';
    b += `<rect x="${x}" y="${y}" width="${C - 4}" height="${C - 4}" rx="9" fill="${fill}" stroke="${isH ? (val === null ? SUN : MINT) : INK}" stroke-width="3"${isH && val === null ? ' stroke-dasharray="5 3"' : ''}/>`;
    b += txt(x + (C - 4) / 2, y + (C - 4) / 2 + 1, isH ? (val === null ? '?' : val) : v === null ? '' : v, { size: 22 });
  });
  return svg(3 * C + 2, 3 * C + 2, b);
}

// ---------- 1. below zero ----------
// From a, go b up (plus) or down; through 0 when it crosses.
function hops(a, b, plus) {
  const t = plus ? a + b : a - b, lo = Math.min(a, t, 0) - 1, hi = Math.max(a, t, 0) + 1, op = plus ? '+' : '−';
  const steps = [];
  if ((a > 0 && t < 0) || (a < 0 && t > 0)) {
    const p = Math.abs(a), rest = b - p, j1 = [a, 0, op + p];
    steps.push(S(vline(lo, hi, { marks: [[a, SUN]], jumps: [j1] }), `${m(a)} ${op} ${p} = 0`, 'vToZero', { a: p }));
    steps.push(S(vline(lo, hi, { marks: [[a, SUN], [t, MINT]], jumps: [j1, [0, t, op + rest]] }), `0 ${op} ${rest} = ${m(t)}`, 'vPastZero', { a: rest }));
  } else {
    steps.push(S(vline(lo, hi, { marks: [[a, SUN], [t, MINT]], jumps: [[a, t, op + b]] }), `${m(a)} ${op} ${b} = ${m(t)}`, plus ? 'vGoUp' : 'vGoDown', { a: b }));
  }
  return { t, steps, lo, hi };
}
function vtherm({ v, lo, hi, step, lab }, q, given) {
  const L = Math.round(v / lab) * lab, d = v - L;
  const steps = [
    S(vline(lo, hi, { level: v, tick: step, lab }), '0 = ❄️', 'vThermZero'),
    S(vline(lo, hi, { level: v, tick: step, lab, jumps: [[L, v, `${d > 0 ? '+' : '−'}${Math.abs(d)}`]] }), `${m(L)} ${d > 0 ? '+' : '−'} ${Math.abs(d)} = ${m(v)}`, step === 1 ? 'vThermCount1' : 'vThermCount2', { a: m(L) }),
  ];
  const oops = given !== undefined && given === -v ? OOPS(`${m(v)} ≠ ${m(given)}`, v < 0 ? 'vOopsBelow' : 'vOopsAbove') : null;
  return { ans: v, steps, oops };
}
function vlift({ a, b, up }, q, given) {
  const h = hops(a, b, up);
  const steps = [S(vline(h.lo, h.hi, { marks: [[a, SUN]] }), `🛗 ${m(a)}`, 'vLiftStart', { a: m(a) }), ...h.steps];
  let oops = null;
  if (given !== undefined && given !== h.t) {
    if (given === (up ? a - b : a + b)) oops = OOPS(`${up ? '⬆️' : '⬇️'} ${b} = ${up ? '+' : '−'} ${b}`, 'vOopsLiftWay');
    else if (given === -h.t) oops = OOPS(`${m(h.t)} ≠ ${m(given)}`, 'vOopsSign');
  }
  return { ans: h.t, steps, oops };
}
function vcalc({ a, b, plus }, q, given) {
  const h = hops(a, b, plus);
  const steps = [S(vline(h.lo, h.hi, { marks: [[a, SUN]] }), `${m(a)} ${plus ? '+' : '−'} ${b}`, 'vCalcStart', { a: m(a) }), ...h.steps];
  let oops = null;
  if (given !== undefined && given !== h.t) {
    if (given === (plus ? a - b : a + b)) oops = OOPS(`${plus ? '+' : '−'} ${b} = ${plus ? '⬆️' : '⬇️'} ${b}`, 'vOopsPlusMinus');
    else if (given === -h.t) oops = OOPS(`${m(h.t)} ≠ ${m(given)}`, 'vOopsSign');
    else if (a < 0 && given === (plus ? -a + b : -a - b)) oops = OOPS(`${m(a)} ≠ ${-a}`, 'vOopsLostMinus', { a: m(a) });
  }
  return { ans: h.t, steps, oops };
}
function vminus({ a, b }, q, given) {
  const h = hops(a, b, true);
  const steps = [S(big('− (−) = +'), `${m(a)} − (−${b}) = ${m(a)} + ${b}`, 'vMinusMinus'), ...h.steps];
  let oops = null;
  if (given !== undefined && given !== h.t) {
    if (given === a - b) oops = OOPS(`− (−${b}) = + ${b}`, 'vOopsMinusMinus');
    else if (given === -h.t) oops = OOPS(`${m(h.t)} ≠ ${m(given)}`, 'vOopsSign');
  }
  return { ans: h.t, steps, oops };
}
function vdrop({ a, b }, q, given) {
  const d = a - b, lo = b - 1, hi = a + 1, j1 = [a, 0, `${a}`, RED], j2 = [0, b, `${-b}`, BLUE];
  const steps = [
    S(vline(lo, hi, { marks: [[a, RED], [b, BLUE]] }), `${m(a)} ➜ ${m(b)}`, 'vDropBoth'),
    S(vline(lo, hi, { marks: [[a, RED], [b, BLUE]], jumps: [j1] }), `${a} ➜ 0 = ⬇️ ${a}`, 'vDropToZero', { a }),
    S(vline(lo, hi, { marks: [[a, RED], [b, BLUE]], jumps: [j1, j2] }), `${a} + ${-b} = ${d}`, 'vDropPast', { a: -b }),
  ];
  const oops = given !== undefined && given !== d && (given === a + b || given === a || given === -b) ? OOPS(`${a} + ${-b} = ${d}`, 'vOopsDropZero') : null;
  return { ans: d, steps, oops };
}
function vcmp({ x, y }, q, given) {
  const sym = SYM(x, y), lo = Math.min(x, y, 0) - 1, hi = Math.max(x, y, 0) + 1;
  const pic = vline(lo, hi, { marks: x === y ? [[x, MINT]] : [[x, RED], [y, BLUE]] });
  const steps = [S(pic, `${m(x)}, ${m(y)}`, 'vFindBoth'), S(pic, `${m(x)} ${esc(sym)} ${m(y)}`, x === y ? 'cmpSame' : 'vHigherBigger')];
  const oops = given && given !== sym && x < 0 && y < 0 && given === SYM(-x, -y) ? OOPS(`${m(x)} ${esc(sym)} ${m(y)}`, 'vOopsColder') : null;
  return { ans: sym, steps, oops };
}
function vcold({ vals }, q, given) {
  const lo = Math.min(...vals, 0) - 1, hi = Math.max(...vals, 0) + 1, ans = Math.min(...vals), cs = [RED, BLUE, SUN, '#8a5cd6'];
  const steps = [
    S(vline(lo, hi, { marks: vals.map((v, i) => [v, cs[i]]) }), vals.map(m).join(', '), 'vPutAll'),
    S(vline(lo, hi, { marks: vals.map(v => [v, v === ans ? MINT : GREY]) }), `🥶 ${m(ans)}`, 'vLowest'),
  ];
  const oops = given !== undefined && given < 0 && given > ans ? OOPS(`${m(ans)} < ${m(given)}`, 'vOopsColder') : null;
  return { ans, steps, oops };
}

// ---------- 2. order of operations ----------
const tok = s => (plain(s).match(/\d+|[()+−×÷²³-]/g) || []).map(x => (/\d/.test(x) ? +x : x === '-' ? '−' : x));
const OPF = { '+': (x, y) => x + y, '−': (x, y) => x - y, '×': (x, y) => x * y, '÷': (x, y) => x / y };
// The next part to work out: brackets, then squares, then × and ÷, then + and −, each from the left.
function nextOp(T) {
  const close = T.indexOf(')');
  let lo = 0, hi = T.length - 1;
  const br = close >= 0;
  if (br) { lo = T.lastIndexOf('(', close) + 1; hi = close - 1; }
  if (!br) {
    const j = T.findIndex(x => x === '²' || x === '³');
    if (j > 0) { const n = T[j - 1], e = T[j] === '²' ? 2 : 3, v = n ** e; return { from: j - 1, to: j, val: v, kind: 'sq', math: `${Array(e).fill(n).join(' × ')} = ${v}` }; }
  }
  let j = -1;
  for (let i = lo; i <= hi; i++) if (T[i] === '×' || T[i] === '÷') { j = i; break; }
  const mul = j >= 0;
  if (!mul) for (let i = lo; i <= hi; i++) if (T[i] === '+' || T[i] === '−') { j = i; break; }
  const x = T[j - 1], o = T[j], y = T[j + 1], val = OPF[o](x, y);
  const whole = br && hi - lo === 2;
  return { from: whole ? lo - 1 : j - 1, to: whole ? hi + 1 : j + 1, val, kind: br ? 'br' : mul ? 'mul' : 'add', part: `${x} ${o} ${y}`, math: `${x} ${o} ${y} = ${val}` };
}
function showT(T, hl = null, st = HL) {
  const pieces = T.map((x, i) => [i > 0 && T[i - 1] !== '(' && x !== ')' && x !== '²' && x !== '³' ? ' ' : '', typeof x === 'number' ? m(x) : x]);
  if (!hl) return pieces.map(p => p.join('')).join('');
  let out = '';
  pieces.forEach(([sp, s], i) => {
    if (i === hl[0]) out += `${sp}<span style="${st}">`; else out += sp;
    out += s;
    if (i === hl[1]) out += '</span>';
  });
  return out;
}
function reduceAll(s) {
  let T = tok(s);
  const red = [];
  for (let g = 0; T.length > 1 && g < 12; g++) {
    const o = nextOp(T), T2 = [...T.slice(0, o.from), o.val, ...T.slice(o.to + 1)];
    red.push({ T, o, T2 });
    T = T2;
  }
  return { val: T[0], red };
}
const RED_KEY = { br: 'vBrFirst', sq: 'vSqFirst', mul: 'vTimesFirst', add: 'vPlusLast' };
const redSteps = red => red.map(({ T, o, T2 }) => S(col(showT(T, [o.from, o.to]), DOWN, showT(T2, [o.from, o.from], NEWV)), o.math, RED_KEY[o.kind]));
// Left to right, ignoring brackets and the × first rule: the classic mistake.
function ltr(s) {
  const t = tok(s).filter(x => x !== '(' && x !== ')');
  const u = [];
  t.forEach(x => { if (x === '²') u.push(u.pop() ** 2); else if (x === '³') u.push(u.pop() ** 3); else u.push(x); });
  let v = u[0];
  for (let i = 1; i < u.length; i += 2) v = OPF[u[i]](v, u[i + 1]);
  return v;
}
function orderOops(s, v, given) {
  if (given === undefined || given === v) return null;
  const T = tok(s);
  if (given === ltr(s)) return OOPS(`${plain(s)} ≠ ${given}`, T.includes('(') ? 'vOopsNoBrackets' : 'vOopsLeftToRight');
  if (T.includes('(') && given === reduceAll(T.filter(x => x !== '(' && x !== ')').map(String).join(' ')).val) return OOPS(`${plain(s)} ≠ ${given}`, 'vOopsNoBrackets');
  const j = T.indexOf('²');
  if (j > 0 && typeof T[j - 1] === 'number' && given === reduceAll([...T.slice(0, j), '×', 2, ...T.slice(j + 1)].map(String).join(' ')).val) return OOPS(`${T[j - 1]}² = ${T[j - 1]} × ${T[j - 1]}`, 'vOopsSq2', { a: T[j - 1] });
  return null;
}
function vorder({ s }, q, given) {
  const { val, red } = reduceAll(s);
  return { ans: val, steps: redSteps(red), oops: orderOops(s, val, given) };
}
function vfirst({ s }, q, given) {
  const { red } = reduceAll(s), o = red[0].o;
  const txtOf = c => plain(c.html);
  const right = q.choices.find(c => txtOf(c) === o.part);
  const steps = [S(checks(q.choices.map(c => [txtOf(c), c === right])), `1️⃣ ${o.part}`, RED_KEY[o.kind]), ...redSteps(red).slice(1)];
  let oops = null;
  if (given !== undefined && right && given !== right.value) {
    const g = q.choices.find(c => String(c.value) === String(given));
    if (g && o.kind === 'br' && txtOf(g).includes('×')) oops = OOPS(`( ) ➜ × ➜ + −`, 'vOopsBrBeforeTimes');
    else if (g && g === q.choices.find(c => c.value === 'p0')) oops = OOPS(`× ➜ + −`, 'vOopsLeftFirst');
  }
  return { ans: right?.value, steps, oops };
}
function vorderTf({ s, shown }, q) {
  const { val, red } = reduceAll(s), ok = val === shown;
  const steps = [...redSteps(red), S(big(ok ? '✓' : '✗'), `${val} ${ok ? '=' : '≠'} ${shown}`, ok ? 'tfYes' : shown === ltr(s) ? 'vRobotLtr' : 'tfNo')];
  return { ans: ok ? 'y' : 'n', steps };
}
function vplace({ goal }, q, given) {
  const rows = q.choices.map(c => { const e = plain(c.html); return { c, e, v: reduceAll(e).val }; });
  const right = rows.find(r => r.v === goal);
  const steps = [S(checks(rows.map(r => [`${r.e} = ${r.v}`, r === right])), `= ${goal}`, 'vTryEach')];
  if (right) steps.push(...redSteps(reduceAll(right.e).red).slice(0, 3));
  return { ans: right?.c.value, steps };
}

// ---------- 3. powers ----------
function chain(b, e) {
  const items = Array.from({ length: e }, (_, i) => m(b ** (i + 1)));
  return tiles(items.map((v, i) => (i === e - 1 ? { v, hi: true } : v)), { arcs: items.map((_, i) => (i < e - 1 ? `×${b}` : '')) });
}
function powOops(b, e, v, given) {
  if (given === undefined || given === v) return null;
  if (given === b * e) return OOPS(`${pw(b, e)} ≠ ${b} × ${e}`, 'vOopsPowTimes', { a: b, b: e });
  if (given === b + e) return OOPS(`${pw(b, e)} ≠ ${b} + ${e}`, 'vOopsPowPlus', { a: b, b: e });
  if (given === e ** b && e !== b) return OOPS(`${pw(b, e)} ≠ ${pw(e, b)}`, 'vOopsPowSwap', { a: b, b: e });
  if (e > 2 && given === b ** (e - 1)) return OOPS(`${pw(b, e)} ≠ ${pw(b, e - 1)}`, 'vOopsPowCount', { a: b, b: e });
  return null;
}
function vpow({ b, e }, q, given) {
  const v = b ** e;
  let steps;
  if (e === 2 && b <= 12) {
    steps = [S(big(`${pw(b, 2)} = ${b} × ${b}`), '', 'vSquare'), S(dots(b, b), `${b} × ${b} = ${v}`, 'vSquareDots', { a: b })];
  } else {
    const arcs = Array(e).fill('×');
    arcs[e - 1] = '';
    steps = [S(tiles(Array(e).fill(b), { arcs }), e <= 4 && b < 10 ? `${pw(b, e)} = ${Array(e).fill(b).join(' × ')}` : pw(b, e), 'vPowMeans', { a: b, b: e }),
      S(chain(b, e), `${pw(b, e)} = ${m(v)}`, b === 10 ? 'vPowTen' : 'vPowChain', { a: b })];
  }
  return { ans: v, steps, oops: powOops(b, e, v, given) };
}
function vroot({ v, sq }, q, given) {
  const n = Math.round(Math.sqrt(v));
  const rows = [n - 1, n, n + 1].filter(k => k > 0).map(k => [`${k} × ${k} = ${k * k}`, k * k === v]);
  const steps = [S(checks(rows), `?² = ${v}`, 'vRootTry', { a: v }),
    S(sq ? gridPic(n, n, { labels: true }) : dots(n, n), `${n} × ${n} = ${v}`, 'vRootSquare', { a: n })];
  let oops = null;
  if (given !== undefined && given !== n) {
    if (given * 2 === v) oops = OOPS(`${given} × ${given} ≠ ${v}`, 'vOopsHalf');
    else if (sq && given * 4 === v) oops = OOPS(`${given} × ${given} ≠ ${v}`, 'vOopsQuarter');
  }
  return { ans: n, steps, oops };
}
function vpowCmp({ b1, e1, b2, e2 }, q, given) {
  const x = b1 ** e1, y = b2 ** e2, sym = SYM(x, y), lo = Math.min(x, y), hi = Math.max(x, y), pad = Math.max(2, Math.round((hi - lo) * 0.3));
  const steps = [S(chain(b1, e1), `${pw(b1, e1)} = ${x}`, 'vPowChain', { a: b1 }), S(chain(b2, e2), `${pw(b2, e2)} = ${y}`, 'vPowChain', { a: b2 }),
    S(big(`${x} ${esc(sym)} ${y}`), `${pw(b1, e1)} ${esc(sym)} ${pw(b2, e2)}`, x === y ? 'cmpSame' : 'vBiggerWins')];
  const oops = given && given !== sym && given === SYM(b1 * e1, b2 * e2) ? OOPS(`${pw(b1, e1)} ≠ ${b1} × ${e1}`, 'vOopsPowTimes', { a: b1, b: e1 }) : null;
  return { ans: sym, steps, oops };
}
function vexp({ b, k }, q, given) {
  const arcs = Array(k).fill('×');
  arcs[k - 1] = '';
  const steps = [S(tiles(Array.from({ length: k }, (_, i) => (i === k - 1 ? { v: b, hi: true } : b)), { arcs }), pw(b, k), 'vCountFactors', { a: b, b: k }),
    S(chain(b, k), `${pw(b, k)} = ${b ** k}`, 'vPowChain', { a: b })];
  const oops = given === k - 1 ? OOPS(`${Array(k).fill(b).join(' ')}`, 'vOopsCountSigns', { a: b }) : null;
  return { ans: k, steps, oops };
}

// ---------- 4–8. equations: do the same to both sides ----------
// k·V + a = c·V + d (op '+'), k·V − a = d (op '−') or V ÷ k + a = d (op '÷'). V is the box ('b') or x.
// ask: 'v' the value of V, 'kv' the value of k·V, 'check' is V = g right?, 'robot' is the robot's V = g right?
function eqText({ v, k, a = 0, c = 0, d, op = '+', rev }) {
  let L;
  if (op === '÷') L = `${V(v)} ÷ ${k}${a ? ` + ${a}` : ''}`;
  else if (op === '−') L = `${kv(k, v)} − ${a}`;
  else L = a ? (rev ? `${a} + ${kv(k, v)}` : `${kv(k, v)} + ${a}`) : kv(k, v);
  return [L, c ? `${kv(c, v)} + ${m(d)}` : m(d)];
}
const XK = new Set(['vTakeBoxes', 'vOopsAddNotTake', 'vOopsTakeNotAdd', 'vOopsNoSplit', 'vOopsMinusNotDiv', 'vOopsNoTimes', 'vOopsBoxesRight']);
const key = (k, v) => (v === 'x' && XK.has(k) ? k + 'X' : k);
function solveSteps(sol, val) {
  const { v = 'b', k, a = 0, c = 0, d, op = '+', rev, ask = 'v' } = sol, it = v === 'x' ? 'x' : 'b';
  const [L, R] = eqText(sol), steps = [];
  const phys = op === '+' && d > 0 && val > 0;
  let kk = k, L1 = L;
  if (op === '+') {
    if (c) {
      kk = k - c;
      L1 = a ? `${kv(kk, v)} + ${a}` : kv(kk, v);
      const pic = phys ? scale([...many(k, it), ...(a ? [a] : [])], [...many(c, it), d], { take: [{ boxes: c, it }, { boxes: c, it }] })
        : sides([{ l: L, r: R }, { op: [`− ${kv(c, v)}`, `− ${kv(c, v)}`] }, { l: L1, r: m(d), hi: 1 }]);
      steps.push(S(pic, `${L1} = ${m(d)}`, key('vTakeBoxes', v), { a: c }));
    }
    if (a) {
      const lft = rev && !c ? [a, ...many(kk, it)] : [...many(kk, it), a];
      const pic = phys ? scale(lft, [d], { take: [`−${a}`, `−${a}`] }) : sides([{ l: L1, r: m(d) }, { op: [`− ${a}`, `− ${a}`] }, { l: kv(kk, v), r: `${m(d)} − ${a}`, hi: 1 }]);
      steps.push(S(pic, phys ? `${kv(kk, v)} = ${m(d)} − ${a} = ${m(d - a)}` : `${kv(kk, v)} = ${m(d)} − ${a}`, 'vTakeNum', { a }));
      if (!phys) steps.push(S(nline(Math.min(d - a, 0) - 2, Math.max(d, 0) + 2, { jumps: [[d, d - a, `−${a}`]], labels: [0] }), `${m(d)} − ${a} = ${m(d - a)}`, 'vLineDown', { a, b: m(d) }));
    }
    if (kk > 1 && ask !== 'kv') {
      const tot = d - a;
      const pic = tot > 0 ? scale(many(kk, it), many(kk, val), { take: [`÷${kk}`, `÷${kk}`] })
        : nline(tot - 1, 1, { jumps: Array.from({ length: kk }, (_, i) => [i * val, (i + 1) * val, m(val)]), labels: [0] });
      steps.push(S(pic, `${V(v)} = ${m(tot)} ÷ ${kk} = ${m(val)}`, tot > 0 ? 'vSplit' : 'vSplitNeg', { a: kk }));
    }
    if (ask === 'kv') steps.push(S(scale(many(kk, it), [d - a]), `${kv(kk, v)} = ${d - a}`, 'vKvDone', { a: kk, b: d - a }));
  } else if (op === '−') {
    steps.push(S(sides([{ l: L, r: m(d) }, { op: [`+ ${a}`, `+ ${a}`] }, { l: kv(k, v), r: `${d} + ${a}`, hi: 1 }]), `${kv(k, v)} = ${d} + ${a} = ${d + a}`, 'vAddBoth', { a }));
    if (k > 1) steps.push(S(scale(many(k, it), many(k, val), { take: [`÷${k}`, `÷${k}`] }), `${V(v)} = ${d + a} ÷ ${k} = ${val}`, 'vSplit', { a: k }));
  } else {
    if (a) steps.push(S(sides([{ l: L, r: m(d) }, { op: [`− ${a}`, `− ${a}`] }, { l: `${V(v)} ÷ ${k}`, r: `${d} − ${a}`, hi: 1 }]), `${V(v)} ÷ ${k} = ${d} − ${a} = ${d - a}`, 'vTakeNum', { a }));
    steps.push(S(sides([{ l: `${V(v)} ÷ ${k}`, r: d - a }, { op: [`× ${k}`, `× ${k}`] }, { l: V(v), r: `${d - a} × ${k}`, hi: 1 }]), `${V(v)} = ${d - a} × ${k} = ${val}`, 'vTimesBoth', { a: k }));
  }
  return steps;
}
function checkStep(sol, val) {
  const { k, a = 0, c = 0, d, op = '+' } = sol;
  const tk = x => (x > 1 ? `${x} × ${m(val)}` : m(val));
  if (op === '+') {
    const lv = k * val + a, rv = c * val + d;
    const math = `${tk(k)}${a ? ` + ${a}` : ''} = ${m(lv)}${c ? `<br>${tk(c)} + ${m(d)} = ${m(rv)}` : ''}`;
    const pic = d > 0 && val > 0 ? scale([...many(k, val), ...(a ? [a] : [])], [...many(c, val), d])
      : !c && a ? nline(Math.min(k * val, d, 0) - 2, Math.max(k * val, d, 0) + 2, { jumps: [[k * val, d, `+${a}`]], labels: [0] }) : big('✓');
    return S(pic, math, 'vCheck', { a: m(val) });
  }
  if (op === '−') return S(nline(d - 2, k * val + 2, { jumps: [[k * val, d, `−${a}`]] }), `${tk(k)} − ${a} = ${d}`, 'vCheck', { a: val });
  return S(dots(k, d - a), `${val} ÷ ${k}${a ? ` + ${a}` : ''} = ${d}`, 'vCheckDiv', { a: val, b: k });
}
function solveOops(sol, val, given) {
  const { v = 'b', k, a = 0, c = 0, d, op = '+' } = sol, kk = k - c;
  if (given === undefined || given === val || typeof given !== 'number') return null;
  const no = `${V(v)} ≠ ${m(given)}`;
  const it = v === 'x' ? 'x' : 'b';
  if (val < 0 && given === -val) return OOPS(no, 'vOopsSign');
  if (op === '+') {
    if (a && given === (d + a) / kk) return OOPS(no, key('vOopsAddNotTake', v), { a });
    if (c && given === (d - a) / k) return OOPS(no, key('vOopsBoxesRight', v));
    if (a && given === d / kk) {
      const pic = !c && d > 0 && val > 0 ? scale(many(k, it), [d], { tilt: -12, take: [`−${a}`, ''] }) : '';
      return OOPS(no, 'vOopsOneSide', {}, pic);
    }
    if (kk > 1 && a && given === d - a) return OOPS(no, key('vOopsNoSplit', v), { a: kk });
    if (kk > 1 && !a && !c && given === d - kk) return OOPS(`${kv(kk, v)} = ${kk} × ${V(v)}`, key('vOopsMinusNotDiv', v), { a: kk });
  } else if (op === '−') {
    if (given === (d - a) / k) return OOPS(no, key('vOopsTakeNotAdd', v), { a });
    if (k === 1 && given === d) return OOPS(no, 'vOopsOneSide');
    if (k > 1 && given === d + a) return OOPS(no, key('vOopsNoSplit', v), { a: k });
  } else {
    if (given === d - a) return OOPS(no, key('vOopsNoTimes', v), { a: k });
    if (given === (d - a) / k) return OOPS(no, 'vOopsDivNotTimes', { a: k });
    if (a && given === d * k - a) return OOPS(no, 'vOopsUndoOrder', { a });
  }
  return null;
}
function vsolve(sol, q, given) {
  const { v = 'b', k, a = 0, c = 0, d, op = '+', ask = 'v', g } = sol, it = v === 'x' ? 'x' : 'b';
  const val = op === '÷' ? (d - a) * k : op === '−' ? (d + a) / k : (d - a) / (k - c);
  if (ask === 'check') {
    const lv = k * g + a, rv = c * g + d, ok = lv === rv, tk = x => (x > 1 ? `${x} × ${g}` : `${g}`);
    const pic = scale([...many(k, g), ...(a ? [a] : [])], [...many(c, g), d], { tilt: ok ? 0 : lv > rv ? 12 : -12 });
    return {
      ans: val === g ? 'y' : 'n',
      steps: [S(pic, `${tk(k)}${a ? ` + ${a}` : ''} = ${lv}${c ? `<br>${tk(c)} + ${d} = ${rv}` : ''}`, 'vPutIn', { a: g }),
        S(big(ok ? '✓' : '✗'), `${lv} ${ok ? '=' : '≠'} ${rv}`, ok ? 'vLevel' : 'vTips')],
    };
  }
  if (ask === 'robot') {
    const ok = val === g;
    const steps = solveSteps(sol, val);
    steps.push(S(big(ok ? '✓' : '✗'), `🤖 ${g} ${ok ? '=' : '≠'} ${val}`, ok ? 'tfYes' : g === d + a ? 'vRobotAdded' : 'tfNo', { a }));
    return { ans: ok ? 'y' : 'n', steps };
  }
  const steps = solveSteps(sol, val);
  if (ask === 'kv') {
    const kvv = k * val;
    let oops = null;
    if (given !== undefined && given !== kvv) {
      if (given === d + a) oops = OOPS(`${kv(k, v)} ≠ ${given}`, 'vOopsAddNotTake', { a });
      else if (given === d) oops = OOPS(`${kv(k, v)} ≠ ${given}`, 'vOopsOneSide', {}, scale(many(k, it), [d], { tilt: -12, take: [`−${a}`, ''] }));
      else if (given === val) oops = OOPS(`${kv(k, v)} = ${k} × ${val}`, 'vOopsKv', { a: k });
    }
    return { ans: kvv, steps, oops };
  }
  if (steps.length < 3) steps.push(checkStep(sol, val));
  return { ans: val, steps, oops: solveOops(sol, val, given) };
}

// Pick the equation that says the same thing: the choice whose equation is `h`.
const inner = html => { const s = String(html), p = '<span class="ex exs">'; return s.startsWith(p) && s.endsWith('</span>') ? s.slice(p.length, -7) : s; };
const choiceOf = (q, h) => q.choices.find(c => inner(c.html) === h);
function vmove({ op, a, c }, q, given) {
  const right = op === '+' ? `${BOX} = ${c} − ${a}` : op === '−' ? `${BOX} = ${c} + ${a}` : `${BOX} = ${c} ÷ ${a}`;
  const same = op === '+' ? `${BOX} = ${c} + ${a}` : op === '−' ? `${BOX} = ${c} − ${a}` : `${BOX} = ${c} × ${a}`;
  const L = op === '+' ? `${BOX} + ${a}` : op === '−' ? `${BOX} − ${a}` : kv(a, 'b');
  const inv = op === '+' ? '−' : op === '−' ? '+' : '÷';
  const pic = op === '+' ? scale(['b', a], [c], { take: [`−${a}`, `−${a}`] }) : op === '×' ? scale(many(a, 'b'), [c], { take: [`÷${a}`, `÷${a}`] })
    : sides([{ l: L, r: c }, { op: [`+ ${a}`, `+ ${a}`] }, { l: BOX, r: `${c} + ${a}`, hi: 1 }]);
  const r = choiceOf(q, right);
  const steps = [S(pic, right, op === '+' ? 'vTakeNum' : op === '−' ? 'vAddBoth' : 'vSplit', { a }),
    S(checks(q.choices.map(ch => [inner(ch.html), ch === r])), `${op} ${a} ➜ ${inv} ${a}`, 'vOpposite')];
  const g = given !== undefined && q.choices.find(ch => String(ch.value) === String(given));
  const oops = g && g !== r && inner(g.html) === same ? OOPS(`+ ↔ −<br>× ↔ ÷`, 'vOopsFlipSign') : null;
  return { ans: r?.value, steps, oops };
}
function vtake({ k, a, c, d }, q, given) {
  const tail = a ? ` + ${a}` : '', right = `${kv(k - c, 'b')}${tail} = ${d}`;
  const r = choiceOf(q, right);
  const steps = [S(scale([...many(k, 'b'), ...(a ? [a] : [])], [...many(c, 'b'), d], { take: [{ boxes: c }, { boxes: c }] }), `${kv(k, 'b')} − ${kv(c, 'b')} = ${kv(k - c, 'b')}`, 'vTakeBoxes', { a: c }),
    S(scale([...many(k - c, 'b'), ...(a ? [a] : [])], [d]), right, 'vStillLevel')];
  let oops = null;
  const g = given !== undefined && q.choices.find(ch => String(ch.value) === String(given));
  if (g && g !== r) {
    const h = inner(g.html);
    if (h === `${kv(k + c, 'b')}${tail} = ${d}`) oops = OOPS(`${kv(k, 'b')} − ${kv(c, 'b')}`, 'vOopsAddBoxes');
    else if (h === `${kv(k, 'b')}${tail} = ${d}`) oops = OOPS(`− ${kv(c, 'b')} &nbsp; − ${kv(c, 'b')}`, 'vOopsOneSide');
    else if (h === `${kv(k - c, 'b')}${tail} = ${d - c}`) oops = OOPS(`${BOX} ≠ 1`, 'vOopsBoxNotOne', { a: c });
  }
  return { ans: r?.value, steps, oops };
}

// ---------- 9. inequalities ----------
const REL = { '>': (x, t) => x > t, '<': (x, t) => x < t, '≥': (x, t) => x >= t, '≤': (x, t) => x <= t };
const RH = { '>': '&gt;', '<': '&lt;', '≥': '≥', '≤': '≤' };
const REL_KEY = { '>': 'vIneqMore', '<': 'vIneqLess', '≥': 'vIneqMoreEq', '≤': 'vIneqLessEq' };
function vineq({ k, a, rel, c, ask, g }, q, given) {
  const t = (c - a) / k, right = rel === '>' || rel === '≥';
  const levelStep = S(scale([...many(k, 'x'), a], [c]), `${kv(k, 'x')} + ${a} = ${c}<br>${X} = ${t}`, 'vIneqLevel', { a: t });
  const range = vals => [Math.max(0, Math.min(t, ...vals) - 2), Math.max(t, ...vals) + 2];
  if (ask === 'multi') {
    const nums = q.items.map(it => +plain(it.html)), [lo, hi] = range(nums);
    return {
      ans: nums.map(n => (REL[rel](n, t) ? 1 : 0)).join(''),
      steps: [levelStep, S(rayLine(t, rel, lo, hi, nums.map(n => [n, REL[rel](n, t)])), `${X} ${RH[rel]} ${t}`, REL_KEY[rel], { a: t })],
    };
  }
  if (ask === 'line') {
    const [lo, hi] = range([]);
    let oops = null;
    const gm = /^(\d+)(.)$/.exec(String(given ?? ''));
    if (gm && given !== `${t}${rel}`) {
      const [gt, gr] = [+gm[1], gm[2]];
      const flip = { '>': '<', '<': '>', '≥': '≤', '≤': '≥' };
      if (gt === t && gr === flip[rel]) oops = OOPS(`${X} ${RH[rel]} ${t}`, right ? 'vOopsGoRight' : 'vOopsGoLeft');
      else if (gt === t) oops = OOPS(`${X} ${RH[rel]} ${t}`, rel === '≥' || rel === '≤' ? 'vOopsDotFull' : 'vOopsDotEmpty', { a: t });
      else if (gr === rel) oops = OOPS(`${X} ${RH[rel]} ${t}`, 'vOopsIneqStart', { a: t });
    }
    return { ans: `${t}${rel}`, steps: [levelStep, S(rayLine(t, rel, lo, hi), `${X} ${RH[rel]} ${t}`, REL_KEY[rel], { a: t })], oops };
  }
  if (ask === 'pick') {
    const vals = q.choices.map(ch => Number(ch.value)), [lo, hi] = range(vals), ans = vals.find(x => REL[rel](x, t));
    let oops = null;
    if (given !== undefined && given !== ans) oops = given === t ? OOPS(`${X} = ${t} ➜ ⚖️`, 'vOopsLevel', { a: t }) : OOPS(`${X} ${RH[rel]} ${t}`, right ? 'vOopsGoRight' : 'vOopsGoLeft');
    return { ans, steps: [levelStep, S(rayLine(t, rel, lo, hi, vals.map(x => [x, REL[rel](x, t)])), `${X} ${RH[rel]} ${t}`, REL_KEY[rel], { a: t })], oops };
  }
  // check: put g in place of x
  const lv = k * g + a, ok = REL[rel](lv, c), [lo, hi] = range([g]);
  return {
    ans: REL[rel](g, t) ? 'y' : 'n',
    steps: [S(scale([...many(k, g), a], [c], { tilt: lv > c ? 12 : lv < c ? -12 : 0 }), `${k > 1 ? `${k} × ${g}` : g} + ${a} = ${lv}`, 'vPutIn', { a: g }),
      S(rayLine(t, rel, lo, hi, [[g, ok]]), `${lv} ${RH[rel]} ${c} ${ok ? '✓' : '✗'}`, ok ? 'vIneqYes' : 'vIneqNo')],
  };
}

// ---------- 10. number puzzles ----------
function vpyr({ rows, hole }, q, given) {
  const K = rows.map(r => r.slice()), n = K.length, steps = [S(pyrV(K, { hole }), '', 'pyrRule')];
  for (let pass = 0; pass < 6 && K[hole[0]][hole[1]] === null; pass++) {
    const found = [];
    K.forEach((row, r) => row.forEach((v, c) => {
      if (v !== null) return;
      if (r < n - 1 && K[r + 1][c] !== null && K[r + 1][c + 1] !== null) found.push([r, c, K[r + 1][c] + K[r + 1][c + 1], [[r + 1, c], [r + 1, c + 1]], `${K[r + 1][c]} + ${K[r + 1][c + 1]}`, 'vPyrAdd']);
      else if (r > 0 && c < row.length - 1 && K[r - 1][c] !== null && K[r][c + 1] !== null) found.push([r, c, K[r - 1][c] - K[r][c + 1], [[r - 1, c], [r, c + 1]], `${K[r - 1][c]} − ${K[r][c + 1]}`, 'pyrDown']);
      else if (r > 0 && c > 0 && K[r - 1][c - 1] !== null && K[r][c - 1] !== null) found.push([r, c, K[r - 1][c - 1] - K[r][c - 1], [[r - 1, c - 1], [r, c - 1]], `${K[r - 1][c - 1]} − ${K[r][c - 1]}`, 'pyrDown']);
    }));
    if (!found.length) break;
    found.forEach(([r, c, v]) => { K[r][c] = v; });
    steps.push(S(pyrV(K, { hole, hi: found.flatMap(f => f[3]), fresh: found.map(f => [f[0], f[1]]) }), found.map(f => `${f[4]} = ${f[2]}`).join('<br>'), found[0][5]));
  }
  let oops = null;
  if (K[hole[0]][hole[1]] === null && n === 3) {
    // Only the top and the two bottom corners: the middle brick goes up both ways, so it counts twice.
    const T = K[0][0], a = K[2][0], c = K[2][2], two = T - a - c, b = two / 2;
    steps.push(S(pyrV(K, { hole, hi: [[2, 0], [2, 2], [0, 0]] }), `${a} + ? + ? + ${c} = ${T}`, 'vPyrTwice'));
    steps.push(S('', `? + ? = ${T} − ${a} − ${c}<br>? + ? = ${two}`, 'vPyrTakeKnown'));
    K[2][1] = b; K[1][0] = a + b; K[1][1] = b + c;
    steps.push(S(pyrV(K, { fresh: [[2, 1], [1, 0], [1, 1]] }), `? = ${two} ÷ 2 = ${b}`, 'vPyrHalf'));
    if (given !== undefined && given === two && two !== b) oops = OOPS(`${two} ÷ 2 = ${b}`, 'vOopsPyrHalf');
  }
  return { ans: K[hole[0]][hole[1]], steps, oops };
}
const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
function vmagic({ cells, hole }, q) {
  const full = LINES.find(l => l.every(i => cells[i] !== null));
  const sum = full.reduce((s, i) => s + cells[i], 0);
  const line = LINES.find(l => l.includes(hole) && l.every(i => i === hole || cells[i] !== null));
  const others = line.filter(i => i !== hole).map(i => cells[i]), ans = sum - others[0] - others[1];
  return {
    ans,
    steps: [S(magicPic(cells, { hi: full, hole }), `${full.map(i => cells[i]).join(' + ')} = ${sum}`, 'vMagicSum', { a: sum }),
      S(magicPic(cells, { hi: line.filter(i => i !== hole), hole, val: ans }), `${sum} − ${others[0]} − ${others[1]} = ${ans}`, 'vMagicMiss', { a: sum })],
  };
}
function vdigit({ shown, op, b, c }, q) {
  const a = op === '+' ? c - b : op === '−' ? c + b : c / b, i = shown.indexOf('?'), s = String(a), colR = s.length - 1 - i, d = +s[i];
  const inv = op === '+' ? '−' : op === '−' ? '+' : '÷';
  return {
    ans: d,
    steps: [S(digitRows([{ s: shown }, { s: String(b) }, { s: String(c) }], { op, line: 2, gap: 6 }), `${c} ${inv} ${b} = ${a}`, 'vDigitBack'),
      S(digitRows([{ s: shown, hi: [colR] }, { s, hi: [colR] }], { band: colR }), `? = ${d}`, 'vDigitSpot')],
  };
}

// ---------- 11. shapes ----------
function vside({ A, h }, q, given) {
  const w = A / h;
  return {
    ans: w,
    steps: [S(q.visual || '', `${h} × ? = ${A}`, 'vAreaRows', { a: h }), S(gridPic(w, h, { labels: true, rowsHi: true }), `${A} ÷ ${h} = ${w}`, 'vAreaDiv', { a: h })],
    oops: given === A - h ? OOPS(`${h} × ? ➜ ÷ ${h}`, 'vOopsAreaMinus') : null,
  };
}
function vtwosq({ a, b }, q, given) {
  const A = a * a + b * b;
  return {
    ans: A,
    steps: [S(gridPic(a, a, { labels: true }), `${a} × ${a} = ${a * a}`, 'vSqOne'), S(gridPic(b, b, { labels: true }), `${b} × ${b} = ${b * b}`, 'vSqOne'),
      S(q.visual || '', `${a * a} + ${b * b} = ${A}`, 'vSqBoth')],
    oops: given === (a + b) * (a + b) ? OOPS(`${a * a} + ${b * b} = ${A}`, 'vOopsBigSquare') : null,
  };
}
function vlarea({ W, H, w, h }, q, given) {
  const A = W * H - w * h;
  return {
    ans: A,
    steps: [S(gridPic(W, H, { labels: true }), `${W} × ${H} = ${W * H}`, 'vLBig'), S(gridPic(W, H, { cut: [w, h] }), `${w} × ${h} = ${w * h}`, 'vLCut'),
      S(q.visual || '', `${W * H} − ${w * h} = ${A}`, 'vLTake')],
    oops: given === W * H ? OOPS(`${W * H} − ${w * h}`, 'vOopsLCorner') : given === 2 * (W + H) ? OOPS(`${W} × ${H} − ${w} × ${h}`, 'vOopsPerimNotArea') : null,
  };
}
function vlper({ W, H, w, h }, q, given) {
  const P = 2 * (W + H);
  return {
    ans: P,
    steps: [S(gridPic(W, H, { cut: [w, h], fence: true, push: true }), '', 'vLPush'),
      S(gridPic(W, H, { fence: true, labels: true }), `${W} + ${H} + ${W} + ${H} = ${P}`, 'vLFence')],
    oops: given === P - w - h ? OOPS(`${w} + ${h}`, 'vOopsLNotch') : given === W * H - w * h ? OOPS('🧱 ≠ 🟧', 'vOopsAreaNotPerim') : null,
  };
}
function stack(H, h) {
  const u = Math.min(20, Math.floor(170 / H)), top = 8, x1 = 40, x2 = 130, bw = 40;
  let b = `<rect x="${x1}" y="${top}" width="${bw}" height="${H * u}" fill="#ffcf8a" stroke="${INK}" stroke-width="2.5"/>` + txt(x1 - 14, top + (H * u) / 2, H, { size: 16 });
  b += `<rect x="${x2}" y="${top}" width="${bw}" height="${h * u}" fill="#eceae6" stroke="${INK}" stroke-width="2.5"/>` + txt(x2 + bw + 16, top + (h * u) / 2, h, { size: 16 });
  b += `<rect x="${x2}" y="${top + h * u}" width="${bw}" height="${(H - h) * u}" fill="${PALE}" stroke="${MINT}" stroke-width="2.5"/>` + txt(x2 + bw + 16, top + h * u + ((H - h) * u) / 2, H - h, { size: 16, fill: MINT });
  b += `<line x1="${x1 + bw + 6}" y1="${top}" x2="${x2 - 6}" y2="${top}" stroke="${GREY}" stroke-dasharray="4 3"/><line x1="${x1 + bw + 6}" y1="${top + H * u}" x2="${x2 - 6}" y2="${top + H * u}" stroke="${GREY}" stroke-dasharray="4 3"/>`;
  return svg(200, H * u + 16, b);
}
function vlmiss({ H, h }, q, given) {
  const ans = H - h;
  return {
    ans,
    steps: [S(q.visual || '', `${h} + ? = ${H}`, 'vLRight'), S(stack(H, h), `${H} − ${h} = ${ans}`, 'vLRightDiff')],
    oops: given === H + h ? OOPS(`${H} − ${h}`, 'vOopsLAdd') : null,
  };
}
function framePic(s, i, mode) {
  const u = Math.floor(150 / s), off = ((s - i) / 2) * u, o = 26;
  let b = `<rect x="${o}" y="${o}" width="${s * u}" height="${s * u}" fill="${mode === 'hole' ? '#ffb35c' : SUN}" stroke="${INK}" stroke-width="3"/>`;
  if (mode !== 'big') b += `<rect x="${o + off}" y="${o + off}" width="${i * u}" height="${i * u}" fill="${mode === 'hole' ? '#ffe39a' : '#fff'}" stroke="${RED}" stroke-width="3" stroke-dasharray="${mode === 'hole' ? '6 4' : '0'}"/>` + txt(o + (s * u) / 2, o + (s * u) / 2, i, { size: 16 });
  b += txt(o + (s * u) / 2, o - 13, s, { size: 16 });
  return svg(s * u + 2 * o, s * u + 2 * o, b);
}
function vframe({ big: s, small: i }, q, given) {
  const A = s * s - i * i;
  return {
    ans: A,
    steps: [S(framePic(s, i, 'big'), `${s} × ${s} = ${s * s}`, 'vFrameBig'), S(framePic(s, i, 'hole'), `${i} × ${i} = ${i * i}`, 'vFrameHole'),
      S(framePic(s, i, 'frame'), `${s * s} − ${i * i} = ${A}`, 'vLTake')],
    oops: given === s * s ? OOPS(`${s * s} − ${i * i}`, 'vOopsHole') : null,
  };
}

// ---------- 12. two dice ----------
const PIPS = { 1: [[.5, .5]], 2: [[.27, .27], [.73, .73]], 3: [[.25, .25], [.5, .5], [.75, .75]], 4: [[.27, .27], [.73, .27], [.27, .73], [.73, .73]], 5: [[.25, .25], [.75, .25], [.5, .5], [.25, .75], [.75, .75]], 6: [[.27, .23], [.73, .23], [.27, .5], [.73, .5], [.27, .77], [.73, .77]] };
const die = (n, x, y, s, fill = '#fff') => `<rect x="${x + 1}" y="${y + 1}" width="${s - 2}" height="${s - 2}" rx="4" fill="${fill}" stroke="${INK}" stroke-width="1.5"/>` + PIPS[n].map(([px, py]) => `<circle cx="${(x + px * s).toFixed(1)}" cy="${(y + py * s).toFixed(1)}" r="${(s * 0.09).toFixed(1)}" fill="${INK}"/>`).join('');
const DF = { '+': (a, b) => a + b, '−': (a, b) => Math.abs(a - b), '×': (a, b) => a * b };
const waysOf = (t, op = '+') => { let n = 0; for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (DF[op](a, b) === t) n++; return n; };
// The 6 × 6 grid of both dice. hl: { value: colour } lights up squares.
function diceGrid(op = '+', hl = {}) {
  const c = 26, o = 30;
  let b = `<rect x="3" y="3" width="24" height="24" rx="4" fill="${RED}" stroke="${INK}" stroke-width="1.5"/>` + txt(15, 15, op, { size: 16, fill: '#fff' });
  for (let i = 1; i <= 6; i++) b += die(i, o + (i - 1) * c, 2, c, '#cfe6fa') + die(i, 2, o + (i - 1) * c, c, '#ffd6d2');
  for (let r = 1; r <= 6; r++) for (let k = 1; k <= 6; k++) {
    const v = DF[op](r, k), x = o + (k - 1) * c, y = o + (r - 1) * c, f = hl[v];
    b += `<rect x="${x}" y="${y}" width="${c}" height="${c}" fill="${f || '#fff'}" stroke="${INK}" stroke-width="1"/>` + txt(x + c / 2, y + c / 2 + 1, v, { size: 14, fill: f || !Object.keys(hl).length ? INK : GREY });
  }
  return svg(o + 6 * c + 4, o + 6 * c + 4, b, 210, 210);
}
const pairPic = (r, k) => svg(52, 26, die(r, 0, 0, 26, '#ffd6d2') + die(k, 26, 0, 26, '#cfe6fa'));
function vdiceWays({ sum, op = '+' }, q, given) {
  const pairs = [];
  for (let r = 1; r <= 6; r++) for (let k = 1; k <= 6; k++) if (DF[op](r, k) === sum) pairs.push([r, k]);
  const n = pairs.length, unordered = pairs.filter(([r, k]) => r <= k).length;
  return {
    ans: n,
    steps: [S(diceGrid(op, { [sum]: SUN }), `🎲 ${op} 🎲 = ${sum}`, 'vDiceFind', { a: sum }), S(gallery(pairs.map(([r, k]) => pairPic(r, k))), `${n}`, 'vDiceCount', { a: n })],
    oops: given !== undefined && given !== n && given === unordered ? OOPS(`${pairs.length > 1 ? `${pairs[0].join(op)} ≠ ${pairs[0].slice().reverse().join(op)}` : n}`, 'vOopsDiceOrder') : null,
  };
}
function vdiceProb({ sum }, q) {
  const n = waysOf(sum);
  return { ans: `${n}/36`, steps: [S(diceGrid('+', { [sum]: SUN }), `${n}`, 'vDiceFind', { a: sum }), S(segBar(36, [[n, SUN]]), frac(n, 36), 'vDiceOutOf', { a: n })] };
}
function vdiceCmp({ x, y }, q, given) {
  const px = waysOf(x), py = waysOf(y), sym = SYM(px, py);
  return {
    ans: sym,
    steps: [S(diceGrid('+', { [x]: SUN, [y]: '#8fcdf0' }), `${x} ➜ ${px}<br>${y} ➜ ${py}`, 'vDiceBoth'), S(big(`${px} ${esc(sym)} ${py}`), `🎲🎲=${x} ${esc(sym)} 🎲🎲=${y}`, 'vDiceMoreWays')],
    oops: given && given !== sym && given === SYM(x, y) ? OOPS(`${px} ${esc(sym)} ${py}`, 'vOopsBigNotLikely') : null,
  };
}
function vdiceMost({ ts, most }, q, given) {
  const w = ts.map(t => waysOf(t)), best = most ? Math.max(...w) : Math.min(...w), ans = ts[w.indexOf(best)];
  return {
    ans,
    steps: [S(diceGrid(), '🎲 + 🎲', 'vDiceGrid'), S(checks(ts.map((t, i) => [`${t} ➜ ${w[i]}`, t === ans])), `${ans} ➜ ${best}`, most ? 'vDiceMost' : 'vDiceLeast'),
      S(diceGrid('+', { [ans]: SUN }), `${ans} ➜ ${best}`, 'vDiceCount', { a: best })],
    oops: most && given !== undefined && given !== ans && given === Math.max(...ts) ? OOPS(`${given} ➜ ${waysOf(given)}`, 'vOopsBigNotLikely') : null,
  };
}

export const VOLCANO_SOLVERS = {
  vtherm, vlift, vcalc, vminus, vdrop, vcmp, vcold, vorder, vfirst, vorderTf, vplace, vpow, vroot, vpowCmp, vexp,
  vsolve, vmove, vtake, vineq, vpyr, vmagic, vdigit, vside, vtwosq, vlarea, vlper, vlmiss, vframe,
  vdiceWays, vdiceProb, vdiceCmp, vdiceMost,
};
