// Volcano (world 5): numbers below zero, order of operations, powers, one-unknown equations on a balance
// scale (the mystery box, then x), inequalities, number and shape puzzles and two dice.
import { R, pick, chance, shuffle, numQ, cmpQ } from './skills.js';
import { pyramid } from './visuals.js';
import { frac } from './ocean.js';
import { cuboid } from './desert.js';

const BOXC = '#c68a4e', INK = '#1e2650', LAVA = '#ef5b52', GOLD = '#ffc23d', ASH = '#e4e7ee', SKY = '#3e9be0', ROCK = '#8a6f5c';
const svg = (w, h, body, size = '') => `<svg class="shape" viewBox="0 0 ${w} ${h}" ${size || `width="${w}" height="${h}"`}>${body}</svg>`;
const txt = (x, y, t, s = 14, extra = '') => `<text x="${x}" y="${y}" font-size="${s}" font-weight="800" fill="${INK}" text-anchor="middle" dominant-baseline="central" ${extra}>${t}</text>`;

// A number with a real minus sign.
const M = n => (n < 0 ? `−${-n}` : String(n));
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const sup = n => String(n).split('').map(d => SUP[d]).join('');
// The mystery box outside the answer slot (a '?' in eq always becomes the slot), and the letter x.
const BOX = '<span class="mbox"></span>';
const X = '<i class="vx">x</i>';
const ex = s => `<span class="ex">${s}</span>`;

// Answer bubbles that may be below zero.
function intChoices(ans, near = [], neg = true) {
  const set = new Set(), ok = c => c !== ans && (neg || c >= 0);
  for (const c of shuffle(near.slice())) if (set.size < 3 && Number.isInteger(c) && ok(c)) set.add(c);
  for (let d = 1; set.size < 3; d++) for (const c of shuffle([ans + d, ans - d])) if (set.size < 3 && ok(c)) set.add(c);
  return shuffle([ans, ...set]).map(v => ({ value: v, html: M(v) }));
}
function intQ(eq, ans, near, extra = {}) {
  const q = { eq, answer: ans, input: 'choice', choices: intChoices(ans, near, extra.neg !== false), visual: null, show: false, ...extra };
  // The number keys have no minus and take three digits, so these stay as bubbles.
  if ((ans < 0 || ans > 999) && !q.layout) q.layout = 'grid';
  return q;
}
const tfOwn = (eq, truth, extra = {}) => ({
  eq, answer: truth ? 'y' : 'n', input: 'choice', layout: 'row', visual: null, show: false,
  choices: [{ value: 'y', html: '✓' }, { value: 'n', html: '✗' }], tf: true, own: true, ...extra,
});

// ---------- the balance scale ----------
// Items on a pan: 'b' a mystery box, 'x' an x block, or a number (a weight). tilt > 0 tips the left side down.
function panItems(items, cx, py) {
  const size = it => (typeof it === 'number' ? [18 + 11 * String(it).length, 30] : [32, 32]);
  const rows = [[]];
  let w = 0;
  for (const it of items) {
    const [iw] = size(it);
    if (w + iw > 116 && rows[rows.length - 1].length) { rows.push([]); w = 0; }
    rows[rows.length - 1].push(it); w += iw + 3;
  }
  let out = '', y = py - 1;
  for (const r of rows) {
    const tw = r.reduce((s, it) => s + size(it)[0] + 3, -3);
    let x = cx - tw / 2;
    const rh = Math.max(...r.map(it => size(it)[1]));
    for (const it of r) {
      const [iw, ih] = size(it), top = y - ih;
      if (it === 'b') out += `<rect x="${x}" y="${top}" width="${iw}" height="${ih}" rx="4" fill="${BOXC}" stroke="#6b4420" stroke-width="2.5"/><line x1="${x + 2}" y1="${top + 8}" x2="${x + iw - 2}" y2="${top + 8}" stroke="#6b4420" stroke-width="1.5"/>${txt(x + iw / 2, top + ih / 2 + 3, '?', 20, 'fill="#fff"')}`;
      else if (it === 'x') out += `<rect x="${x}" y="${top}" width="${iw}" height="${ih}" rx="5" fill="${LAVA}" stroke="${INK}" stroke-width="2"/>${txt(x + iw / 2, top + ih / 2, 'x', 24, 'fill="#fff" font-style="italic" font-family="Georgia,serif"')}`;
      else out += `<path d="M${x + 3} ${top} h${iw - 6} l3 ${ih} h${-iw} z" fill="${ASH}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>${txt(x + iw / 2, top + ih / 2 + 1, it, 19)}`;
      x += iw + 3;
    }
    y -= rh + 3;
  }
  return out;
}
function scale(left, right, { tilt = 0, take = null } = {}) {
  const by = 34, L = 64, Rt = 216;
  const pan = (cx, y, items) => {
    const py = y + 116;
    return `<line x1="${cx}" y1="${y}" x2="${cx - 54}" y2="${py}" stroke="${INK}" stroke-width="1.5"/><line x1="${cx}" y1="${y}" x2="${cx + 54}" y2="${py}" stroke="${INK}" stroke-width="1.5"/>` +
      `<path d="M${cx - 60} ${py} Q${cx} ${py + 18} ${cx + 60} ${py} Z" fill="#c9ced8" stroke="${INK}" stroke-width="2"/>` + panItems(items, cx, py);
  };
  let body = `<line x1="140" y1="${by}" x2="140" y2="184" stroke="${INK}" stroke-width="6"/><rect x="104" y="180" width="72" height="9" rx="4" fill="${ROCK}" stroke="${INK}" stroke-width="2"/>`;
  body += pan(L, by + tilt, left) + pan(Rt, by - tilt, right);
  body += `<line x1="${L}" y1="${by + tilt}" x2="${Rt}" y2="${by - tilt}" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><circle cx="140" cy="${by}" r="7" fill="${GOLD}" stroke="${INK}" stroke-width="2"/>`;
  // A take-off mark: '−5' or '÷3' as text, or a number of boxes ({ boxes: 2 } draws −2 and a small box).
  const mark = (x, y, t) => (typeof t === 'object'
    ? txt(x - 12, y, `−${t.boxes > 1 ? t.boxes : ''}`, 22, `fill="${LAVA}"`) + `<rect x="${x + (t.boxes > 1 ? 4 : -2)}" y="${y - 10}" width="20" height="20" rx="4" fill="${BOXC}" stroke="#6b4420" stroke-width="2"/>` + txt(x + (t.boxes > 1 ? 14 : 8), y + 1, '?', 13, 'fill="#fff"')
    : txt(x, y, t, 22, `fill="${LAVA}"`));
  if (take) body += mark(L, by + tilt - 20, take[0]) + mark(Rt, by - tilt - 20, take[1]);
  return svg(280, 192, body, 'width="250" height="171"');
}
const bal = (l, r, eqHtml, o) => `<div class="vbal">${scale(l, r, o)}${eqHtml ? `<div class="veq">${eqHtml}</div>` : ''}</div>`;
const veq = h => `<div class="vbal"><div class="veq">${h}</div></div>`;
const boxes = (k, it = 'b') => Array(k).fill(it);
const kb = k => (k === 1 ? BOX : `${k}${BOX}`);
const kx = k => (k === 1 ? X : `${k}${X}`);

// ---------- 1. Below zero: thermometer and the volcano lift ----------
function thermo(marks, lo, hi, step, lab) {
  const top = 14, bot = 196, x = 46;
  const y = t => bot - ((t - lo) * (bot - top)) / (hi - lo);
  let body = `<rect x="${x - 9}" y="${top - 8}" width="18" height="${bot - top + 20}" rx="9" fill="#fff" stroke="${INK}" stroke-width="3"/>`;
  body += `<rect x="${x - 4.5}" y="${y(marks[0]).toFixed(1)}" width="9" height="${(bot + 10 - y(marks[0])).toFixed(1)}" fill="${LAVA}"/><circle cx="${x}" cy="${bot + 18}" r="14" fill="${LAVA}" stroke="${INK}" stroke-width="3"/>`;
  for (let t = lo; t <= hi; t += step) {
    const long = t % lab === 0, yy = y(t).toFixed(1);
    body += `<line x1="${x + 9}" y1="${yy}" x2="${x + (long ? 24 : 16)}" y2="${yy}" stroke="${INK}" stroke-width="${long ? 2.5 : 1.3}"/>`;
    if (long) body += txt(x + 48, yy, M(t), 17, t === 0 ? `fill="${SKY}"` : '');
  }
  body += `<line x1="${x - 24}" y1="${y(0)}" x2="${x - 9}" y2="${y(0)}" stroke="${SKY}" stroke-width="3"/><text x="${x - 30}" y="${y(0)}" font-size="14" text-anchor="middle" dominant-baseline="central">❄️</text>`;
  if (marks.length > 1) {
    const yy = y(marks[1]).toFixed(1);
    body += `<line x1="${x - 22}" y1="${yy}" x2="${x - 9}" y2="${yy}" stroke="${INK}" stroke-width="3"/><circle cx="${x - 24}" cy="${yy}" r="4" fill="${INK}"/>`;
  }
  return svg(124, 236, body, 'width="118" height="224"');
}
function shaft(a, lo, hi) {
  const n = hi - lo + 1, fh = Math.min(18, Math.floor(200 / n)), H = n * fh + 30;
  let body = `<text x="72" y="12" font-size="18" text-anchor="middle" dominant-baseline="central">🌋</text>`;
  for (let f = hi; f >= lo; f--) {
    const yy = 24 + (hi - f) * fh;
    body += `<rect x="50" y="${yy}" width="44" height="${fh}" fill="${f > 0 ? '#fde6c8' : f === 0 ? '#bfe6c9' : f < -5 ? '#f08a6e' : '#f6b7a0'}" stroke="${INK}" stroke-width="1"/>`;
    if (n <= 13 || f % 5 === 0) body += txt(26, yy + fh / 2, M(f), fh < 14 ? 11 : 13, f === 0 ? `fill="${SKY}"` : '');
    if (f === a) body += `<rect x="56" y="${yy + 1.5}" width="32" height="${fh - 3}" rx="3" fill="${GOLD}" stroke="${INK}" stroke-width="2"/><line x1="72" y1="${yy + 3}" x2="72" y2="${yy + fh - 3}" stroke="${INK}" stroke-width="1.5"/>`;
  }
  return svg(110, H, body, `width="${Math.round(110 * Math.min(1, 220 / H))}" height="${Math.min(H, 220)}"`);
}
function genNeg(lvl) {
  const kind = pick([['thermo', 'thermo', 'lift', 'lift', 'cmp'], ['thermo', 'lift', 'cmp', 'coldest', 'calc'], ['calc', 'calc', 'minus', 'coldest', 'cmp', 'drop']][lvl]);
  if (kind === 'thermo') {
    const [lo, hi, step, lab] = lvl ? [-20, 20, 2, 10] : [-10, 10, 1, 5];
    let v = R(lo / step + 1, hi / step - 1) * step;
    if (v === 0 || v % lab === 0) v -= step;
    return intQ('🌡️ = ?', v, [-v, v + step, v - step, v + lab, -v - step], { visual: thermo([v], lo, hi, step, lab), show: true, thermo: true, layout: 'grid' });
  }
  if (kind === 'lift') {
    const [lo, hi] = lvl ? [-10, 10] : [-5, 5];
    const a = R(lo + 1, hi - 1), up = a < 0 ? chance(0.6) : chance(0.3);
    const b = up ? R(1, hi - a) : R(1, a - lo), t = up ? a + b : a - b;
    if ((a >= 0) === (t >= 0) && chance(0.6)) return genNeg(lvl); // most trips cross the ground floor
    return intQ(`🛗 ${M(a)} ${up ? '⬆️' : '⬇️'} ${b} = ?`, t, [up ? a - b : a + b, -t, t + 1, t - 1], { visual: shaft(a, lo, hi), show: !lvl, lift: true, layout: 'grid' });
  }
  if (kind === 'cmp') {
    const a = -R(1, lvl ? 20 : 9), b = chance(0.3) && !lvl ? R(1, 9) : -R(1, lvl ? 20 : 9);
    const c = chance(0.15) ? a : b;
    return cmpQ(M(a), M(c), a, c);
  }
  if (kind === 'coldest') {
    const vals = new Set();
    while (vals.size < 4) vals.add(R(-15, 12));
    const v = [...vals], ans = Math.min(...v);
    return { eq: '🥶 ?', answer: ans, input: 'choice', layout: 'grid', visual: null, show: false, choices: shuffle(v).map(x => ({ value: x, html: M(x) })), coldest: true };
  }
  if (kind === 'drop') {
    const a = R(1, 12), b = -R(1, 12), d = a - b;
    return numQ(`${M(a)} ➜ ${M(b)} = ⬇️ ?`, d, [a + b, -b, a, d + 1, d - 2].filter(x => x > 0), { visual: thermo([a, b], -20, 20, 2, 10), show: false, drop: true, layout: 'grid' });
  }
  if (kind === 'minus') {
    const a = R(-9, 12), b = R(1, 12), ans = a + b;
    return intQ(`${M(a)} − (−${b}) = ?`, ans, [a - b, -ans, b - a], { layout: 'grid' });
  }
  const a = R(-12, 12), b = R(1, 12), plus = chance(0.5), ans = plus ? a + b : a - b;
  if (a >= 0 && ans >= 0) return genNeg(lvl);
  return intQ(`${M(a)} ${plus ? '+' : '−'} ${b} = ?`, ans, [plus ? a - b : a + b, -ans, Math.abs(a) + b, ans + 1], { layout: 'grid' });
}

// ---------- 2. Do me first: order of operations ----------
const ev = s => Function(`return (${s.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/²/g, '**2').replace(/³/g, '**3')})`)();
// Left to right, ignoring brackets and the × first rule: the classic mistake.
function ltr(s) {
  const t = s.replace(/[()]/g, '').replace(/(\d+)²/g, (_, n) => n * n).split(' ');
  let v = +t[0];
  for (let i = 1; i < t.length; i += 2) {
    const n = +t[i + 1], o = t[i];
    v = o === '+' ? v + n : o === '−' ? v - n : o === '×' ? v * n : v / n;
  }
  return v;
}
const okVal = v => Number.isInteger(v) && v >= 0 && v < 1000;
function orderExpr(lvl, brk) {
  const a = R(2, 9), b = R(2, 6), c = R(2, 6), d = R(1, 9);
  const forms = brk
    ? [[`(${a} + ${b}) × ${c}`], [`${c} × (${a} + ${b})`], [`(${a + b + c} − ${b}) × ${c}`], lvl > 1 && [`(${a} + ${b}) × (${c} + ${d})`], lvl > 1 && [`(${a} + ${b})²`], lvl && [`${a * c + 10} − (${a} + ${b})`]]
    : [[`${a} + ${b} × ${c}`], [`${b * c + a} − ${b} × ${c}`], lvl && [`${a} + ${b * c} ÷ ${c}`], lvl && [`${a} × ${b} + ${c} × ${d}`], lvl > 1 && [`${a} + ${b} × ${c} − ${d}`], lvl > 1 && [`${d + 10} − ${b}²`], lvl > 1 && [`${a} + ${b}²`]];
  const [s] = pick(forms.filter(Boolean));
  const v = ev(s);
  return okVal(v) && ltr(s) !== v ? s : orderExpr(lvl, brk);
}
function bracketVariants(nums, ops) {
  const k = nums.length, out = new Set([nums.map((n, i) => (i ? ` ${ops[i - 1]} ` : '') + n).join('')]);
  for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) {
    if (i === 0 && j === k - 1) continue;
    out.add(nums.map((n, m) => (m ? ` ${ops[m - 1]} ` : '') + (m === i ? '(' : '') + n + (m === j ? ')' : '')).join(''));
  }
  if (k === 4) out.add(`(${nums[0]} ${ops[0]} ${nums[1]}) ${ops[1]} (${nums[2]} ${ops[2]} ${nums[3]})`);
  return [...out];
}
function genOrder(lvl) {
  const kind = pick([['mix', 'mix', 'brk', 'first'], ['mix', 'brk', 'first', 'robot', 'place'], ['mix', 'brk', 'robot', 'place', 'place', 'first']][lvl]);
  if (kind === 'mix' || kind === 'brk') {
    const s = orderExpr(lvl, kind === 'brk'), v = ev(s);
    return numQ(`${s} = ?`, v, [ltr(s), v + 1, v - 1, ev(s.replace(/[()]/g, ''))].filter(x => okVal(x) && x !== v), { layout: v > 999 ? 'grid' : undefined });
  }
  if (kind === 'first') {
    const n = lvl ? 4 : 3, nums = Array.from({ length: n }, () => R(2, 9)), opsAll = ['+', '−', '×', '+'];
    const ops = Array.from({ length: n - 1 }, () => pick(opsAll));
    if (!ops.some(o => o === '×') && !(lvl && chance(0.4))) ops[R(0, n - 2)] = '×';
    let br = -1;
    if (lvl && chance(0.45)) br = R(0, n - 2);
    const expr = nums.map((x, i) => (i ? ` ${ops[i - 1]} ` : '') + (br >= 0 && i === br ? '(' : '') + x + (br >= 0 && i === br + 1 ? ')' : '')).join('');
    if (!okVal(ev(expr))) return genOrder(lvl);
    const parts = ops.map((o, i) => `${nums[i]} ${o} ${nums[i + 1]}`);
    // Every part that may honestly be worked out first. Keep only questions where exactly one part may.
    const mults = ops.map((o, i) => (o === '×' ? i : -1)).filter(i => i >= 0);
    const valid = br >= 0 ? [br, ...mults.filter(i => i !== br && Math.abs(i - br) > 1)] : mults;
    if (valid.length !== 1 || new Set(parts).size < parts.length || parts.some(p => ev(p) < 0)) return genOrder(lvl);
    const first = valid[0];
    return { eq: '1️⃣ ?', answer: `p${first}`, input: 'choice', layout: 'row', visual: veq(expr), show: true, first: true,
      choices: parts.map((p, i) => ({ value: `p${i}`, html: ex(p) })) };
  }
  if (kind === 'robot') {
    const s = orderExpr(lvl, chance(0.3)), v = ev(s), w = ltr(s), truth = chance(0.5);
    if (!okVal(w)) return genOrder(lvl);
    return { eq: `🤖 ${s} = ${truth ? v : w}`, answer: truth ? 'y' : 'n', input: 'choice', layout: 'row', visual: null, show: false,
      choices: [{ value: 'y', html: '✓' }, { value: 'n', html: '✗' }], tf: true };
  }
  // Where do the brackets go to make this number?
  const n = lvl > 1 && chance(0.5) ? 4 : 3;
  const nums = Array.from({ length: n }, () => R(2, 9)), ops = Array.from({ length: n - 1 }, () => pick(['+', '×', '−']));
  if (!ops.includes('×')) ops[0] = '×';
  const seen = new Map();
  for (const s of shuffle(bracketVariants(nums, ops))) {
    const v = ev(s);
    if (okVal(v) && !seen.has(v)) seen.set(v, s);
  }
  if (seen.size < 2) return genOrder(lvl);
  const opts = [...seen.entries()].slice(0, 4), [tv, ts] = pick(opts);
  return { eq: `? = ${tv}`, answer: ts, input: 'choice', layout: 'col', visual: null, show: false, place: true,
    choices: shuffle(opts.map(([, s]) => ({ value: s, html: ex(s) }))) };
}

// ---------- 3. Power towers ----------
function tiles(n) {
  const u = Math.min(24, Math.floor(150 / n));
  let body = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) body += `<rect x="${3 + c * u}" y="${3 + r * u}" width="${u}" height="${u}" fill="${(r + c) % 2 ? '#ffd27a' : '#ffb35c'}" stroke="${INK}" stroke-width="1.3"/>`;
  return svg(n * u + 6, n * u + 6, body);
}
function tower(k, base = 2) {
  const fh = Math.min(30, Math.floor(190 / k));
  let body = '';
  for (let i = 1; i <= k; i++) {
    const y = (k - i) * fh + 4, w = 60 + i * 10, x = (140 - w) / 2;
    body += `<rect x="${x}" y="${y}" width="${w}" height="${fh - 3}" rx="4" fill="${i === k ? '#fff4cc' : i % 2 ? '#f5a25d' : '#ef7b52'}" stroke="${i === k ? '#d99a00' : INK}" stroke-width="2" ${i === k ? 'stroke-dasharray="5 3"' : ''}/>`;
    body += txt(70, y + (fh - 3) / 2, i === k ? '?' : base ** i, Math.min(16, fh - 8), i === k ? 'fill="#d99a00"' : '');
    body += `<text x="${x - 6}" y="${y + (fh - 3) / 2}" font-size="13" font-weight="800" fill="${INK}" text-anchor="end" dominant-baseline="central">${base}${sup(i)}</text>`;
  }
  return svg(140, k * fh + 8, body);
}
function genPow(lvl) {
  const kind = pick([['sq', 'sq', 'cube', 'double', 'cmp', 'ten'], ['sq', 'cube', 'double', 'root', 'cmp', 'ten'], ['root', 'pow', 'cmp', 'ten', 'exp', 'pow']][lvl]);
  if (kind === 'sq') {
    const n = R(2, lvl ? 9 : 8), v = n * n;
    return numQ(`${n}² = ?`, v, [2 * n, n + 2, v + n, v - 1, (n + 1) * (n + 1)].filter(x => x !== v), { visual: tiles(n), show: !lvl });
  }
  if (kind === 'cube') {
    const n = R(2, lvl ? 5 : 4), v = n ** 3;
    return numQ(`${n}³ = ?`, v, [3 * n, n * n, n + 3, v + n * n].filter(x => x !== v), { visual: cuboid(n, n, n, 150), show: !lvl });
  }
  if (kind === 'double') {
    const k = R(3, lvl ? 7 : 6), v = 2 ** k;
    return numQ(`2${sup(k)} = ?`, v, [2 * k, v - 2, v / 2, v + 2, 3 * v / 2].filter(x => x !== v), { visual: tower(k), show: true, tower: true });
  }
  if (kind === 'root') {
    const n = R(3, lvl > 1 ? 12 : 9), v = n * n;
    return numQ(`?² = ${v}`, n, [v / 2, n + 1, n - 1, n * 2].filter(x => Number.isInteger(x)), { visual: tiles(Math.min(n, 12)), show: false, root: true, layout: 'grid' });
  }
  if (kind === 'cmp') {
    // Two powers that are close in size, so they must be worked out, not guessed.
    const top = [100, 300, 1000][lvl], all = [];
    for (let b = 2; b <= 10; b++) for (let e = 2; e <= (lvl ? 6 : 4); e++) if (b ** e <= top) all.push([b, e]);
    let x, y;
    do { x = pick(all); y = pick(all); } while (x[0] === y[0] || x[1] === y[1] || Math.max(x[0] ** x[1], y[0] ** y[1]) > 2 * Math.min(x[0] ** x[1], y[0] ** y[1]));
    return cmpQ(`${x[0]}${sup(x[1])}`, `${y[0]}${sup(y[1])}`, x[0] ** x[1], y[0] ** y[1]);
  }
  if (kind === 'ten') {
    const k = R(2, lvl > 1 ? 4 : 3), v = 10 ** k;
    return numQ(`10${sup(k)} = ?`, v, [10 * k, v * 10, v / 10, 10 + k].filter(x => x !== v), { layout: 'grid' });
  }
  if (kind === 'exp') {
    const b = pick([2, 2, 3, 5]), k = R(3, b === 2 ? 5 : 4), v = b ** k;
    return numQ(`${Array(k).fill(b).join(' × ')} = ${b}<sup class="psup">?</sup>`, k, [k + 1, k - 1, v / b, b * k].filter(x => x > 1 && x < 50), { exp: true, layout: 'grid' });
  }
  let b, k;
  do { b = R(2, 9); k = R(2, 6); } while (b ** k > 999 || b ** k < 20);
  const v = b ** k;
  return numQ(`${b}${sup(k)} = ?`, v, [b * k, b ** (k - 1), v + b, v - b, k ** b].filter(x => x !== v && x < 1000), { layout: v > 999 ? 'grid' : undefined });
}

// ---------- 4. Mystery box ----------
function genBox(lvl) {
  const kind = pick([['add', 'add', 'addL', 'check'], ['add', 'addL', 'twice', 'minus', 'check'], ['twice', 'minus', 'div', 'add', 'check']][lvl]);
  const b = R(lvl ? 3 : 1, lvl ? 15 : 9);
  // The equation is written under the scale; from level 2 only the equation is shown.
  const pic = (l, r, e) => (lvl < 2 ? bal(l, r, e) : veq(e));
  if (kind === 'add' || kind === 'addL') {
    const a = R(2, lvl ? 15 : 9), c = a + b, left = kind === 'add';
    return numQ(`${BOX} = ?`, b, [c, a, b + 1, b - 1, c + a], { visual: pic(left ? ['b', a] : [a, 'b'], [c], left ? `${BOX} + ${a} = ${c}` : `${a} + ${BOX} = ${c}`), show: true });
  }
  if (kind === 'twice') {
    const k = lvl === 1 ? 2 : R(2, 4), v = R(2, 9), c = k * v;
    return numQ(`${BOX} = ?`, v, [c - k, c / 2, v + 1, c + k, v - 1].filter(x => Number.isInteger(x) && x > 0 && x !== v), { visual: pic(boxes(k), [c], k === 2 ? `${BOX} + ${BOX} = ${c}` : `${k} × ${BOX} = ${c}`), show: true });
  }
  if (kind === 'minus') {
    // No weight can pull a pan up, so this one has no scale.
    const a = R(2, 9), c = R(2, 12), v = a + c;
    return numQ(`${BOX} = ?`, v, [c - a, c, v + a, v - 1].filter(x => x > 0), { visual: veq(`${BOX} − ${a} = ${c}`), show: true, minus: true });
  }
  if (kind === 'div') {
    const k = R(2, 4), c = R(2, 9), v = k * c;
    return numQ(`${BOX} = ?`, v, [c + k, c - k, v + c, k * (c + 1)].filter(x => x > 0), { visual: veq(`${BOX} ÷ ${k} = ${c}`), show: true, div: true });
  }
  // Try a number: does the scale balance?
  const a = R(2, 9), c = a + b, g = chance(0.5) ? b : b + pick([-2, -1, 1, 2, a]);
  if (g < 0) return genBox(lvl);
  return tfOwn(`${BOX} = ${g}`, g === b, { visual: bal(['b', a], [c], `${BOX} + ${a} = ${c}`), show: true, check: true });
}

// ---------- 5. Keep it balanced: do the same to both sides ----------
// Which move, done to both sides, leaves the box on its own? The equation shows a slot after each side,
// and the chosen move fills both slots, so the child sees it done to the left and to the right.
function moveQ(eqHtml, right, wrongs, visual) {
  const opts = [right, ...wrongs.filter(w => w !== right)].slice(0, 4);
  const [l, r] = eqHtml.split(' = ');
  return { eq: `${l} ? = ${r} ?`, answer: right, input: 'choice', layout: 'grid', visual, show: !!visual, move: true,
    choices: shuffle(opts.map(o => { const [a, b] = o.split('|'); return { value: o, html: `<span class="mvs"><span class="mv">${a}</span><span class="mv">${b}</span></span>`, fill: [a, b] }; })) };
}
function genKeep(lvl) {
  const kind = pick([['move', 'move', 'take', 'take'], ['move', 'take', 'minus', 'split'], ['move', 'minus', 'split', 'robot', 'splitmove']][lvl]);
  if (kind === 'move') {
    const a = R(2, 9), v = R(2, lvl ? 15 : 9), c = a + v;
    return moveQ(`${BOX} + ${a} = ${c}`, `−${a}|−${a}`, shuffle([`+${a}|+${a}`, `+${a}|−${a}`, `−${c}|−${c}`, `−${a}|+${a}`]), bal(['b', a], [c]));
  }
  if (kind === 'take') {
    const a = R(2, 9), v = R(1, lvl ? 15 : 9), c = a + v;
    return numQ(`${BOX} = ?`, v, [c, c + a, v + 1, v - 1], { visual: bal(['b', a], [c], `${BOX} + ${a} = ${c}`, { take: [`−${a}`, `−${a}`] }), show: true });
  }
  if (kind === 'minus') {
    const a = R(2, 9), c = R(2, 12);
    return moveQ(`${BOX} − ${a} = ${c}`, `+${a}|+${a}`, shuffle([`−${a}|−${a}`, `+${a}|−${a}`, `−${a}|+${a}`]), null);
  }
  if (kind === 'split') {
    const k = R(2, lvl > 1 ? 5 : 3), v = R(2, 9), c = k * v;
    return numQ(`${BOX} = ?`, v, [c - k, c, v + 1, v - 1, c + k].filter(x => x > 0), { visual: bal(boxes(k), [c], `${kb(k)} = ${c}`, { take: [`÷${k}`, `÷${k}`] }), show: true });
  }
  if (kind === 'splitmove') {
    const k = R(2, 5), c = k * R(2, 9);
    return moveQ(`${kb(k)} = ${c}`, `÷${k}|÷${k}`, shuffle([`−${k}|−${k}`, `÷${k}|−${k}`, `×${k}|×${k}`, `−${k}|÷${k}`]), null);
  }
  // The robot moved weights. Is its answer right?
  const a = R(2, 9), v = R(2, 12), c = a + v, truth = chance(0.5), w = truth ? v : pick([c + a, c, v + 1]);
  return { eq: `🤖 ${BOX} + ${a} = ${c} ➜ ${BOX} = ${w}`, answer: truth ? 'y' : 'n', input: 'choice', layout: 'row', visual: null, show: false,
    choices: [{ value: 'y', html: '✓' }, { value: 'n', html: '✗' }], tf: true };
}

// ---------- 6. Two steps ----------
function genTwo(lvl) {
  const kind = pick([['solve', 'solve', 'step'], ['solve', 'step', 'minus', 'check'], ['solve', 'minus', 'div', 'check']][lvl]);
  const k = R(2, lvl ? 4 : 3), v = R(1, lvl ? 12 : 8), a = R(1, 9);
  if (kind === 'solve' || kind === 'step') {
    const c = k * v + a, step = kind === 'step';
    return numQ(step ? `${kb(k)} = ?` : `${BOX} = ?`, step ? k * v : v,
      (step ? [c, c + a, k * v + k, v] : [c - a, (c - a) / k + 1, (c + a) / k, v + a, c / k]).filter(x => Number.isInteger(x) && x > 0),
      { visual: bal([...boxes(k), a], [c], `${kb(k)} + ${a} = ${c}`, step ? { take: [`−${a}`, `−${a}`] } : undefined), show: true, step });
  }
  if (kind === 'minus') {
    const c = k * v - a;
    if (c <= 0) return genTwo(lvl);
    return numQ(`${BOX} = ?`, v, [(c - a) / k, c + a, v + 1, (c + a) / k + 1].filter(x => Number.isInteger(x) && x > 0 && x !== v), { visual: veq(`${kb(k)} − ${a} = ${c}`), show: true, minus: true });
  }
  if (kind === 'div') {
    const w = R(2, 9), n = k * w, c = w + a;
    return numQ(`${BOX} = ?`, n, [c * k - a, w, c * k, n + k].filter(x => x > 0 && x !== n), { visual: veq(`${BOX} ÷ ${k} + ${a} = ${c}`), show: true, div: true });
  }
  const c = k * v + a, g = chance(0.5) ? v : v + pick([-1, 1, 2]);
  if (g < 0) return genTwo(lvl);
  return tfOwn(`${BOX} = ${g}`, g === v, { visual: bal([...boxes(k), a], [c], `${kb(k)} + ${a} = ${c}`), show: true, check: true });
}

// ---------- 7. Boxes on both sides ----------
function genBoth(lvl) {
  const kind = pick([['solve', 'solve', 'take'], ['solve', 'take', 'check'], ['solve', 'solve', 'take', 'check']][lvl]);
  const c = lvl > 1 ? R(1, 3) : lvl ? R(1, 2) : 1, a = c + R(1, lvl > 1 ? 3 : 2), v = R(1, lvl ? 9 : 6);
  const b = lvl > 1 && chance(0.3) ? 0 : R(1, 8), d = (a - c) * v + b;
  const L = [...boxes(a), ...(b ? [b] : [])], Rr = [...boxes(c), d];
  const eqH = `${kb(a)}${b ? ` + ${b}` : ''} = ${kb(c)} + ${d}`;
  if (kind === 'take') {
    const right = `${kb(a - c)}${b ? ` + ${b}` : ''} = ${d}`;
    const wrongs = [`${kb(a + c)}${b ? ` + ${b}` : ''} = ${d}`, `${kb(a - c)}${b ? ` + ${b}` : ''} = ${d - c}`, `${kb(a)}${b ? ` + ${b}` : ''} = ${d}`, `${kb(a - c)} = ${d + c}`];
    // Values stay plain words: the equations hold HTML, which can't go into a button's data attribute.
    const opts = [right, ...wrongs.filter(w => w !== right)].slice(0, 4);
    return { eq: '⚖️ ?', answer: 'e0', input: 'choice', layout: 'grid', visual: bal(L, Rr, eqH, { take: [{ boxes: c }, { boxes: c }] }), show: true, take: true,
      choices: shuffle(opts.map((o, i) => ({ value: `e${i}`, html: `<span class="ex exs">${o}</span>` }))) };
  }
  if (kind === 'check') {
    const g = chance(0.5) ? v : v + pick([-1, 1, 2]);
    if (g < 0) return genBoth(lvl);
    return tfOwn(`${BOX} = ${g}`, g === v, { visual: bal(L, Rr, eqH), show: true, check: true });
  }
  return numQ(`${BOX} = ?`, v, [d, d - b, (d - b) / a, v + 1, v + c].filter(x => Number.isInteger(x) && x > 0 && x !== v), { visual: bal(L, Rr, eqH), show: true });
}

// ---------- 8. Hello, x ----------
function genX(lvl) {
  const kind = pick([['morph', 'morph', 'one', 'two'], ['one', 'two', 'both', 'check', 'neg'], ['two', 'both', 'div', 'neg', 'check', 'two']][lvl]);
  const v = R(1, lvl ? 12 : 9), a = R(1, 9);
  const ask = (eqHtml, ans, near, vis) => intQ(`${X} = ?`, ans, near.filter(x => x !== ans && (ans < 0 || x >= 0)), { visual: vis || veq(eqHtml), show: true, neg: ans < 0 });
  if (kind === 'morph') {
    const k = R(1, 3), c = k * v + a;
    return ask(null, v, [c - a, c, v + 1, (c + a) / k | 0], bal([...boxes(k, 'x'), a], [c], `${kx(k)} + ${a} = ${c}`));
  }
  if (kind === 'one') {
    const t = pick(['+', '−', '×', '÷']);
    if (t === '+') return ask(`${X} + ${a} = ${a + v}`, v, [a + v + a, a, v + 1]);
    if (t === '−') return ask(`${X} − ${a} = ${v}`, v + a, [v - a, v, v + a + 1]);
    const k = R(2, 6);
    if (t === '×') return ask(`${k}${X} = ${k * v}`, v, [k * v - k, k * v + k, v + 1, k * v]);
    return ask(`${X} ÷ ${k} = ${v}`, k * v, [v + k, k * v + k, v]);
  }
  if (kind === 'two') {
    const k = R(2, 5), minus = lvl && chance(0.4), c = minus ? k * v - a : k * v + a;
    if (c <= 0) return genX(lvl);
    return ask(`${kx(k)} ${minus ? '−' : '+'} ${a} = ${c}`, v, [c - a, (c + a) / k | 0, (c - a) / k | 0, v + 1, v - 1]);
  }
  if (kind === 'both') {
    const c = R(1, 3), k = c + R(1, 3), d = (k - c) * v + a;
    return ask(`${kx(k)} + ${a} = ${kx(c)} + ${d}`, v, [d - a, (d - a) / k | 0, v + 1, v + c]);
  }
  if (kind === 'div') {
    const k = R(2, 5), w = R(2, 9), c = w + a;
    return ask(`${X} ÷ ${k} + ${a} = ${c}`, k * w, [w, c * k, k * w + a, k * (w + 1)]);
  }
  if (kind === 'neg') {
    // Now x can be below zero, just like the volcano lift.
    const w = -R(1, 9), k = lvl > 1 ? R(1, 3) : 1, c = k * w + a + (k > 1 ? 10 : 0), aa = a + (k > 1 ? 10 : 0);
    return ask(`${kx(k)} + ${aa} = ${M(c)}`, w, [-w, c - aa + 1, w - 1, w + 1]);
  }
  const k = R(2, 4), c = k * v + a, g = chance(0.5) ? v : v + pick([-1, 1, 2]);
  if (g < 0) return genX(lvl);
  return tfOwn(`${X} = ${g}`, g === v, { visual: veq(`${kx(k)} + ${a} = ${c}`), show: true, check: true });
}

// ---------- 9. Tipping scale: inequalities ----------
const REL = { '>': (x, t) => x > t, '<': (x, t) => x < t, '≥': (x, t) => x >= t, '≤': (x, t) => x <= t };
const HTML = { '>': '&gt;', '<': '&lt;', '≥': '≥', '≤': '≤' };
function numberLine(t, rel, lo = 0, hi = 10) {
  const W = 160, u = (W - 24) / (hi - lo), X0 = 12, y = 18, px = v => X0 + (v - lo) * u;
  let body = `<line x1="${X0 - 6}" y1="${y}" x2="${W - 4}" y2="${y}" stroke="${INK}" stroke-width="2"/>`;
  for (let v = lo; v <= hi; v++) body += `<line x1="${px(v)}" y1="${y - 4}" x2="${px(v)}" y2="${y + 4}" stroke="${INK}" stroke-width="1.5"/>` + (v % 2 === 0 ? txt(px(v), y + 20, v, 15) : '');
  const right = rel === '>' || rel === '≥', fillDot = rel === '≥' || rel === '≤';
  body += `<line x1="${px(t)}" y1="${y}" x2="${right ? W - 2 : 2}" y2="${y}" stroke="${LAVA}" stroke-width="5"/><path d="${right ? `M${W - 2} ${y} l-9 -6 v12 z` : `M2 ${y} l9 -6 v12 z`}" fill="${LAVA}"/>`;
  body += `<circle cx="${px(t)}" cy="${y}" r="6" fill="${fillDot ? LAVA : '#fff'}" stroke="${LAVA}" stroke-width="3"/>`;
  return svg(W, 48, body, 'width="160" height="48"');
}
function genIneq(lvl) {
  const kind = pick([['multi', 'multi', 'check', 'pick'], ['multi', 'line', 'pick', 'check'], ['line', 'line', 'multi', 'pick', 'check']][lvl]);
  const rel = pick(lvl > 1 ? ['>', '<', '≥', '≤'] : ['>', '<']);
  const k = lvl && chance(0.5) ? R(2, 3) : 1, t = R(1, 7), a = R(1, 9);
  // k·x + a  rel  k·t + a, so the answers are x rel t.
  const c = k * t + a, left = `${kx(k)} + ${a}`, ineq = `${left} ${HTML[rel]} ${c}`;
  const heavyLeft = rel === '>' || rel === '≥';
  const vis = bal([...boxes(k, 'x'), a], [c], ineq, { tilt: heavyLeft ? 12 : -12 });
  if (kind === 'multi') {
    const lo = Math.max(0, t - R(2, 3)), nums = Array.from({ length: 6 }, (_, i) => lo + i);
    return { eq: '', input: 'multi', target: ineq, visual: vis, show: false, grid3: true,
      items: nums.map(n => ({ html: String(n), ok: REL[rel](n, t) })) };
  }
  if (kind === 'line') {
    const flip = { '>': '<', '<': '>', '≥': '≤', '≤': '≥' }, open = { '>': '≥', '≥': '>', '<': '≤', '≤': '<' };
    const opts = [[t, rel], [t, flip[rel]], [t + (heavyLeft ? 1 : -1), rel], lvl > 1 ? [t, open[rel]] : [t - (heavyLeft ? 1 : -1), rel]];
    return { eq: ineq, answer: `${t}${rel}`, input: 'choice', layout: 'col', visual: null, show: false, line: true,
      choices: shuffle(opts.map(([tt, r]) => ({ value: `${tt}${r}`, html: numberLine(tt, r) }))) };
  }
  if (kind === 'pick') {
    // Exactly one bubble keeps the scale tipped; the others are close by but tip it the other way (or level it).
    const near = [...Array(13).keys()].filter(x => Math.abs(x - t) <= 4);
    const yes = shuffle(near.filter(x => REL[rel](x, t))), no = shuffle(near.filter(x => !REL[rel](x, t)));
    if (!yes.length || no.length < 3) return genIneq(lvl);
    const ans = yes[0];
    return { eq: `${X} = ?`, answer: ans, input: 'choice', layout: 'grid', visual: vis, show: true, pick: true,
      choices: shuffle([ans, ...no.slice(0, 3)]).map(v => ({ value: v, html: String(v) })) };
  }
  const g = Math.max(0, t + pick([-2, -1, 0, 1, 2]));
  return tfOwn(`${X} = ${g}`, REL[rel](g, t), { visual: vis, show: true, check: true });
}

// ---------- 10. Number puzzles (a puzzle stop) ----------
const LO_SHU = [[2, 7, 6], [9, 5, 1], [4, 3, 8]];
function magicGrid(cells) {
  return `<div class="magic">${cells.map(v => (v === '?' ? '<span class="slot num">?</span>' : v === '' ? '<span class="blank"></span>' : `<span class="num">${v}</span>`)).join('')}</div>`;
}
function digitChoices(d) {
  const set = new Set([d]);
  for (const c of shuffle([d + 1, d - 1, 9 - d, (d + 5) % 10, d + 2, d - 2])) if (set.size < 4 && c >= 0 && c <= 9) set.add(c);
  for (let c = 0; set.size < 4; c++) set.add(c);
  return shuffle([...set]).map(v => ({ value: v, html: String(v) }));
}
function genNumPuz(lvl) {
  const kind = pick([['pyr', 'pyr', 'magic', 'digit'], ['pyr', 'magic', 'digit', 'pyrx'], ['pyrx', 'magic', 'digit', 'pyr4']][lvl]);
  if (kind === 'pyr' || kind === 'pyrx' || kind === 'pyr4') {
    if (kind === 'pyr4') {
      const b = Array.from({ length: 4 }, () => R(1, 9));
      const r3 = [b[0] + b[1], b[1] + b[2], b[2] + b[3]], r2 = [r3[0] + r3[1], r3[1] + r3[2]], top = r2[0] + r2[1];
      // The top is hidden and one brick in each row above the bottom is blank.
      return numQ('', top, [top + 1, top - 1, r2[0] + r3[2], top + b[1]], { visual: pyramid([['❓'], [r2[0], ''], ['', r3[1], ''], b]), show: true, layout: top > 999 ? 'grid' : undefined });
    }
    const [a, b, c] = [R(1, lvl ? 15 : 9), R(1, lvl ? 15 : 9), R(1, lvl ? 15 : 9)], m1 = a + b, m2 = b + c, top = m1 + m2;
    if (kind === 'pyrx') {
      return numQ('', b, [top - a - c, b + 1, b - 1, (top - a - c) / 2 + 2].filter(x => Number.isInteger(x) && x > 0 && x !== b), { visual: pyramid([[top], ['', ''], [a, '❓', c]]), show: true, pyrx: true });
    }
    const hide = pick(lvl ? ['top', 'mid', 'corner', 'corner'] : ['top', 'mid', 'mid']);
    const rows = [[top], [m1, m2], [a, b, c]];
    let ans;
    if (hide === 'top') { ans = top; rows[0][0] = '❓'; if (lvl) rows[1][pick([0, 1])] = ''; }
    else if (hide === 'mid') { ans = m1; rows[1][0] = '❓'; }
    else { ans = a; rows[2][0] = '❓'; }
    return numQ('', ans, [ans + 1, ans - 1, ans + 2, m2, ans + b].filter(x => x !== ans), { visual: pyramid(rows), show: true });
  }
  if (kind === 'magic') {
    let g = LO_SHU.map(r => r.slice());
    for (let i = R(0, 3); i > 0; i--) g = g[0].map((_, c) => g.map(r => r[c]).reverse());
    if (chance(0.5)) g = g.map(r => r.reverse());
    const add = lvl ? R(1, 12) : R(0, 5), cells = g.flat().map(v => v + add);
    const qi = R(0, 8), ans = cells[qi], shown = cells.map(String);
    shown[qi] = '?';
    if (lvl > 1) {
      const others = [...Array(9).keys()].filter(i => Math.floor(i / 3) !== Math.floor(qi / 3) && i % 3 !== qi % 3);
      shown[pick(others)] = '';
    }
    return numQ('', ans, [ans + 1, ans - 1, 15 + 3 * add - ans, ans + 3].filter(x => x > 0 && x !== ans), { visual: magicGrid(shown), show: true, magic: true });
  }
  // One hidden digit.
  const op = pick(lvl ? ['+', '−', '×'] : ['+', '+', '−']);
  let a, b, c;
  if (op === '+') { a = R(lvl > 1 ? 100 : 10, lvl > 1 ? 899 : 89); b = R(lvl > 1 ? 100 : 10, lvl > 1 ? 899 : 89); c = a + b; }
  else if (op === '−') { c = R(lvl > 1 ? 100 : 10, lvl > 1 ? 499 : 49); b = R(lvl > 1 ? 100 : 10, lvl > 1 ? 499 : 49); a = b + c; }
  else { a = R(12, lvl > 1 ? 99 : 29); b = R(3, 9); c = a * b; }
  const as = String(a), i = R(0, as.length - 1), d = +as[i];
  if (i === 0 && d === 0) return genNumPuz(lvl);
  const eq = `${as.slice(0, i)}?${as.slice(i + 1)} ${op} ${b} = ${c}`;
  return { eq, answer: d, input: 'choice', layout: 'grid', choices: digitChoices(d), visual: null, show: false, digit: true };
}

// ---------- 11. Shape puzzles ----------
const qmark = (x, y) => `<circle cx="${x}" cy="${y}" r="12" fill="#fff4cc" stroke="#d99a00" stroke-width="3" stroke-dasharray="5 4"/>${txt(x, y + 1, '?', 16, 'fill="#d99a00"')}`;
const lab = (x, y, t) => (t === '?' ? qmark(x, y) : txt(x, y, t, 15));
function rectPic(w, h, { top = '', left = '', mid = '', grid = false, fill = '#ffcf8a' } = {}) {
  const u = Math.min(22, Math.floor(170 / w), Math.floor(120 / h)), W = w * u, H = h * u, ox = 34, oy = 26;
  let body = `<rect x="${ox}" y="${oy}" width="${W}" height="${H}" fill="${fill}" stroke="${INK}" stroke-width="3"/>`;
  if (grid) for (let i = 1; i < w; i++) body += `<line x1="${ox + i * u}" y1="${oy}" x2="${ox + i * u}" y2="${oy + H}" stroke="${INK}" stroke-opacity=".25"/>`;
  if (grid) for (let j = 1; j < h; j++) body += `<line x1="${ox}" y1="${oy + j * u}" x2="${ox + W}" y2="${oy + j * u}" stroke="${INK}" stroke-opacity=".25"/>`;
  if (top) body += lab(ox + W / 2, oy - 13, top);
  if (left) body += lab(ox - 16, oy + H / 2, left);
  if (mid) body += `<rect x="${ox + W / 2 - 22}" y="${oy + H / 2 - 13}" width="44" height="26" rx="6" fill="#fff" stroke="${INK}" stroke-width="1.5"/>` + txt(ox + W / 2, oy + H / 2 + 1, mid, 16);
  return svg(W + ox + 12, H + oy + 12, body);
}
// An L: a W×H rectangle with a w×h corner cut from its top right.
function lPic(W, H, w, h, labels, fence = false) {
  const u = Math.min(Math.floor(180 / W), Math.floor(130 / H)), ox = 34, oy = 26;
  const P = (x, y) => `${ox + x * u},${oy + y * u}`;
  let body = `<polygon points="${[P(0, 0), P(W - w, 0), P(W - w, h), P(W, h), P(W, H), P(0, H)].join(' ')}" fill="#ffcf8a" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
  if (fence) body += `<polygon points="${[P(0, 0), P(W - w, 0), P(W - w, h), P(W, h), P(W, H), P(0, H)].join(' ')}" fill="none" stroke="${LAVA}" stroke-width="6" stroke-dasharray="10 5" stroke-linejoin="round"/>`;
  const at = {
    bottom: [ox + (W * u) / 2, oy + H * u + 14], left: [ox - 16, oy + (H * u) / 2], top: [ox + ((W - w) * u) / 2, oy - 13],
    notchV: [ox + (W - w) * u - 14, oy + (h * u) / 2 + 2], notchH: [ox + (W - w / 2) * u, oy + h * u - 13], right: [ox + W * u + 16, oy + h * u + ((H - h) * u) / 2],
  };
  for (const [k, t] of Object.entries(labels)) body += lab(...at[k], t);
  return svg(W * u + ox + 34, H * u + oy + 30, body);
}
function genShape(lvl) {
  const kind = pick([['side', 'side', 'twosq', 'sqside'], ['side', 'larea', 'lper', 'sqside'], ['larea', 'lper', 'lmiss', 'frame']][lvl]);
  if (kind === 'side') {
    const w = R(2, lvl ? 12 : 8), h = R(2, lvl ? 9 : 6), A = w * h;
    return numQ(`${A} = ${h} × ?`, w, [A - h, A / 2, w + 1, h, w - 1].filter(x => Number.isInteger(x) && x > 0 && x !== w), { visual: rectPic(w, h, { top: '?', left: h, mid: A, grid: !lvl }), show: true, side: true });
  }
  if (kind === 'sqside') {
    const s = R(3, lvl ? 12 : 8), A = s * s;
    return numQ(`?² = ${A}`, s, [A / 4, A / 2, s + 1, s - 1].filter(x => Number.isInteger(x) && x > 0), { visual: rectPic(s, s, { top: '?', mid: A, fill: '#ffb35c' }), show: true, sqside: true, layout: 'grid' });
  }
  if (kind === 'twosq') {
    const a = R(2, 5), b = R(2, 5), A = a * a + b * b;
    const u = Math.min(20, Math.floor(180 / (a + b))), ox = 20, oy = 12, H = Math.max(a, b) * u;
    const body = `<rect x="${ox}" y="${oy + H - a * u}" width="${a * u}" height="${a * u}" fill="#ffcf8a" stroke="${INK}" stroke-width="3"/><rect x="${ox + a * u}" y="${oy + H - b * u}" width="${b * u}" height="${b * u}" fill="#ffb35c" stroke="${INK}" stroke-width="3"/>` +
      txt(ox + (a * u) / 2, oy + H + 14, a, 15) + txt(ox + a * u + (b * u) / 2, oy + H + 14, b, 15);
    return numQ('🟧 = ?', A, [(a + b) * (a + b), 4 * (a + b), a * b * 2, A + 1].filter(x => x !== A), { visual: svg((a + b) * u + 40, H + oy + 30, body), show: true, twosq: true });
  }
  const W = R(5, 10), H = R(4, 8), w = R(2, W - 2), h = R(1, H - 2);
  if (kind === 'larea') {
    const A = W * H - w * h;
    return numQ('🟧 = ?', A, [W * H, W * H - w - h, 2 * (W + H), A + w, A - h].filter(x => x > 0 && x !== A), { visual: lPic(W, H, w, h, { bottom: W, left: H, notchH: w, notchV: h }), show: true, larea: true });
  }
  if (kind === 'lper') {
    const P = 2 * (W + H);
    return numQ('🧱 = ?', P, [P - w - h, P + 2 * w, W * H - w * h, W + H + w + h].filter(x => x > 0 && x !== P), { visual: lPic(W, H, w, h, { bottom: W, left: H, notchH: w, notchV: h }, true), show: true, lper: true });
  }
  if (kind === 'lmiss') {
    const ans = H - h;
    return numQ('📏 = ?', ans, [H + h, h, H, ans + 1, W - w].filter(x => x > 0 && x !== ans), { visual: lPic(W, H, w, h, { bottom: W, left: H, notchV: h, notchH: w, right: '?' }), show: true, lmiss: true });
  }
  // A square frame: the big square with a smaller one cut out of the middle.
  const s = R(6, 11), t = s - 2 * R(1, 2), A = s * s - t * t;
  const u = Math.floor(150 / s), off = ((s - t) / 2) * u, ox = 30, oy = 26;
  const body = `<rect x="${ox}" y="${oy}" width="${s * u}" height="${s * u}" fill="#ffb35c" stroke="${INK}" stroke-width="3"/><rect x="${ox + off}" y="${oy + off}" width="${t * u}" height="${t * u}" fill="#fff" stroke="${INK}" stroke-width="2"/>` +
    txt(ox + (s * u) / 2, oy - 13, s, 15) + txt(ox + (s * u) / 2, oy + off + 14, t, 14);
  return numQ('🖼️ = ?', A, [s * s, (s - t) * (s - t), 4 * s, A + t].filter(x => x > 0 && x !== A), { visual: svg(s * u + ox + 12, s * u + oy + 12, body), show: true, frame: true });
}

// ---------- 12. Two dice ----------
const PIPS = { 1: [[.5, .5]], 2: [[.27, .27], [.73, .73]], 3: [[.25, .25], [.5, .5], [.75, .75]], 4: [[.27, .27], [.73, .27], [.27, .73], [.73, .73]], 5: [[.25, .25], [.75, .25], [.5, .5], [.25, .75], [.75, .75]], 6: [[.27, .23], [.73, .23], [.27, .5], [.73, .5], [.27, .77], [.73, .77]] };
const die = (n, x, y, s, fill = '#fff') => `<rect x="${x + 1}" y="${y + 1}" width="${s - 2}" height="${s - 2}" rx="4" fill="${fill}" stroke="${INK}" stroke-width="1.5"/>` + PIPS[n].map(([px, py]) => `<circle cx="${(x + px * s).toFixed(1)}" cy="${(y + py * s).toFixed(1)}" r="${(s * 0.09).toFixed(1)}" fill="${INK}"/>`).join('');
const OPF = { '+': (a, b) => a + b, '−': (a, b) => Math.abs(a - b), '×': (a, b) => a * b };
function diceGrid(op = '+', hi = null, vals = true) {
  const c = 26, o = 30;
  let body = die(1, 2, 2, 26, LAVA).replace(/<circle[^>]*>/g, '') + txt(15, 15, op, 16, 'fill="#fff"');
  for (let i = 1; i <= 6; i++) body += die(i, o + (i - 1) * c, 2, c, '#fde6c8') + die(i, 2, o + (i - 1) * c, c, '#fde6c8');
  for (let r = 1; r <= 6; r++) for (let k = 1; k <= 6; k++) {
    const v = OPF[op](r, k), x = o + (k - 1) * c, y = o + (r - 1) * c;
    body += `<rect x="${x}" y="${y}" width="${c}" height="${c}" fill="${hi !== null && v === hi ? GOLD : '#fff'}" stroke="${INK}" stroke-width="1"/>`;
    if (vals) body += txt(x + c / 2, y + c / 2 + 1, v, 15);
  }
  return svg(o + 6 * c + 4, o + 6 * c + 4, body, 'width="220" height="220"');
}
const waysOf = (t, op = '+') => { let n = 0; for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (OPF[op](a, b) === t) n++; return n; };
function genDice(lvl) {
  const kind = pick([['most', 'ways', 'ways', 'least'], ['ways', 'most', 'cmp', 'prob', 'least'], ['prob', 'prob', 'cmp', 'other', 'most']][lvl]);
  if (kind === 'most' || kind === 'least') {
    const most = kind === 'most';
    for (;;) {
      const ts = shuffle([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]).slice(0, 4);
      const w = ts.map(t => waysOf(t)), best = most ? Math.max(...w) : Math.min(...w);
      if (w.filter(x => x === best).length > 1) continue;
      const ans = ts[w.indexOf(best)];
      return { eq: `🎲 + 🎲 ${most ? '🏆' : '🐢'} ?`, answer: ans, input: 'choice', layout: 'grid', visual: diceGrid(), show: lvl < 2, most, least: !most,
        choices: shuffle(ts).map(t => ({ value: t, html: String(t) })) };
    }
  }
  if (kind === 'ways') {
    const t = R(2, 12), n = waysOf(t);
    return numQ(`🎲 + 🎲 = ${t} ➜ 🔢 ?`, n, [n + 1, n - 1, t, 6, 36 - n].filter(x => x > 0 && x !== n && x < 40), { visual: diceGrid('+', lvl ? null : t), show: true, ways: true, small: true });
  }
  if (kind === 'cmp') {
    let a = R(2, 12), b = R(2, 12);
    if (a === b || (waysOf(a) === waysOf(b) && chance(0.6))) return genDice(lvl);
    const pa = waysOf(a), pb = waysOf(b);
    return { ...cmpQ(`🎲🎲=${a}`, `🎲🎲=${b}`, pa, pb, lvl > 1 ? null : diceGrid()), show: lvl < 2, visual: diceGrid(), likely: true, small: true };
  }
  if (kind === 'prob') {
    const t = R(2, 12), n = waysOf(t);
    const opts = [n, n + 1, n - 1, n + 2, 12 - n].filter((x, i, s) => x > 0 && x <= 36 && s.indexOf(x) === i).slice(0, 4);
    return { eq: `🎲 + 🎲 = ${t} ➜ ?`, answer: `${n}/36`, input: 'choice', layout: 'grid', visual: diceGrid(), show: lvl < 2, prob: true, small: true,
      choices: shuffle(opts.map(x => ({ value: `${x}/36`, html: frac(x, 36) }))) };
  }
  // Take away or multiply instead of add: the grid changes and so do the chances.
  const op = pick(['−', '×']), t = op === '−' ? R(0, 5) : pick([4, 6, 12, 2, 3, 8, 10, 18]), n = waysOf(t, op);
  return numQ(`🎲 ${op} 🎲 = ${t} ➜ 🔢 ?`, n, [n + 1, n - 1, n + 2, 6].filter(x => x > 0 && x !== n), { visual: diceGrid(op), show: true, ways: true, other: true, small: true });
}

export const VOLCANO = [
  { id: 'v-neg', icon: '🌡️', gen: genNeg },
  { id: 'v-order', icon: '🫧', gen: genOrder },
  { id: 'v-pow', icon: '🗼', gen: genPow },
  { id: 'v-box', icon: '📦', gen: genBox },
  { id: 'v-keep', icon: '⚖️', gen: genKeep },
  { id: 'v-two', icon: '🪜', gen: genTwo },
  { id: 'v-both', icon: '🎁', gen: genBoth },
  { id: 'v-x', icon: '🔤', gen: genX },
  { id: 'v-ineq', icon: '🎢', gen: genIneq },
  { id: 'v-npuz', icon: '🧩', gen: genNumPuz, puzzle: true },
  { id: 'v-shape', icon: '🟧', gen: genShape },
  { id: 'v-dice', icon: '🎲', gen: genDice },
];
