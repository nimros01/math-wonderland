// Solutions for the Desert world: units, the protractor, angles in a triangle, areas of parallelograms,
// triangles, trapezoids and circles, volume and surface, coordinates, mean, median and mode, fences and travel stories.
import { S, OOPS, m } from './sol-basic.js';
import { nline, checks, gallery, row } from './sol-pics.js';
import { valueBar, angleOverlay, gridPic } from './sol-pics2.js';
import { cuboid } from './desert.js';

const INK = '#1e2650', RED = '#ef5b52', BLUE = '#3e9be0', MINT = '#2fb383', SUN = '#ffc23d', PALE = '#d7f5e6', SAND = '#f3d58f', SANDD = '#d9a33a', SLOT = '#d99a00';
const svg = (w, h, body) => `<svg class="solsvg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`;
const txt = (x, y, s, { size = 16, fill = INK, halo = false } = {}) =>
  `<text x="${x}" y="${y}" font-size="${size}" font-weight="800" fill="${fill}" text-anchor="middle" dominant-baseline="central"${halo ? ' paint-order="stroke" stroke="#fff" stroke-width="4"' : ''}>${s}</text>`;
const SYM = (x, y) => (x > y ? '>' : x < y ? '<' : '=');
const esc = s => s.replace('<', '&lt;').replace('>', '&gt;');
const f1 = v => +v.toFixed(1);
const f2 = v => +v.toFixed(2);
// A sum written out; long ones lose their spaces so the line does not wrap on a phone.
const sumLine = (parts, total) => { const sp = parts.join(' + '); return `${sp.length + String(total).length > 15 ? parts.join('+') : sp} = ${total}`; };
const num = v => (v === undefined || v === null || v === '' || isNaN(v) ? NaN : Number(v));

// ---------- pictures ----------
// n big units side by side, each worth k small ones; part adds a smaller green piece at the end.
function unitBar(n, big, k, part = 0, { small = '', total = '' } = {}) {
  const cnt = n + (part ? 1 : 0), sw = Math.min(64, Math.floor(276 / cnt));
  const fs = v => Math.min(14, Math.floor((sw - 6) / (String(m(v)).length * 0.66)));
  let b = '';
  for (let i = 0; i < n; i++) {
    const x = 4 + i * sw;
    b += `<rect x="${x}" y="20" width="${sw}" height="34" fill="${i % 2 ? '#ffe39a' : SUN}" stroke="${INK}" stroke-width="2"/>`;
    b += txt(x + sw / 2, 11, `1 ${big}`, { size: sw < 40 ? 10 : 13 }) + txt(x + sw / 2, 37, m(k), { size: fs(k) });
  }
  if (part) {
    const x = 4 + n * sw;
    b += `<rect x="${x}" y="20" width="${sw}" height="34" fill="${PALE}" stroke="${MINT}" stroke-width="2.5"/>` + txt(x + sw / 2, 37, part, { size: fs(part) });
    if (small) b += txt(x + sw / 2, 11, small, { size: sw < 40 ? 10 : 13, fill: MINT });
  }
  if (total !== '') b += `<path d="M4 60 v6 H${cnt * sw + 4} v-6" fill="none" stroke="${INK}" stroke-width="2"/>` + txt(cnt * sw / 2 + 4, 80, total, { size: 16 });
  return svg(cnt * sw + 8, total !== '' ? 90 : 58, b);
}

// The protractor from the question, with the reading circled.
function protPic(deg) {
  const cx = 130, cy = 120, r = 104;
  const pt = (a, rr) => [cx + rr * Math.cos((a * Math.PI) / 180), cy - rr * Math.sin((a * Math.PI) / 180)];
  let b = `<path d="M${cx - r} ${cy} A${r} ${r} 0 0 1 ${cx + r} ${cy} Z" fill="#fff8e0" stroke="${INK}" stroke-width="3"/>`;
  for (let a = 0; a <= 180; a += 5) {
    const [x1, y1] = pt(a, r), [x2, y2] = pt(a, r - (a % 30 === 0 ? 16 : a % 10 === 0 ? 11 : 6));
    b += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${INK}" stroke-width="${a % 10 ? 1 : 2}"/>`;
    if (a % 30 === 0 && Math.abs(a - deg) > 14) { const [tx, ty] = pt(a, r - 28); b += txt(tx.toFixed(1), ty.toFixed(1), a, { size: 14 }); }
  }
  const [ax, ay] = pt(deg, r + 12);
  b += `<line x1="${cx}" y1="${cy}" x2="${cx + r + 12}" y2="${cy}" stroke="${RED}" stroke-width="5" stroke-linecap="round"/>`;
  b += `<line x1="${cx}" y1="${cy}" x2="${ax.toFixed(1)}" y2="${ay.toFixed(1)}" stroke="${RED}" stroke-width="5" stroke-linecap="round"/>`;
  const [mx, my] = pt(deg, r - 30);
  b += `<circle cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" r="17" fill="${MINT}" stroke="${INK}" stroke-width="2"/>` + txt(mx.toFixed(1), my.toFixed(1), deg, { size: 14, fill: '#fff' });
  b += `<circle cx="${cx}" cy="${cy}" r="4" fill="${INK}"/>`;
  return svg(260, 132, b);
}

// Corners torn off and laid side by side on a straight line: parts in degrees, hole shows its value in green.
function lineFan(parts, holes = []) {
  const isH = i => holes.includes(i);
  const cx = 130, cy = 116, R = 100, cols = ['#f6c35e', '#bfe3f7', '#f9c6dc'];
  const pt = (a, rr) => [(cx + rr * Math.cos((a * Math.PI) / 180)).toFixed(1), (cy - rr * Math.sin((a * Math.PI) / 180)).toFixed(1)];
  let b = '', from = 180;
  parts.forEach((d, i) => {
    const to = from - d, [x0, y0] = pt(from, R), [x1, y1] = pt(to, R);
    b += `<path d="M${cx} ${cy} L${x0} ${y0} A${R} ${R} 0 0 1 ${x1} ${y1} Z" fill="${isH(i) ? PALE : cols[i % 3]}" stroke="${isH(i) ? MINT : INK}" stroke-width="${isH(i) ? 3 : 2}"/>`;
    from = to;
  });
  from = 180;
  parts.forEach((d, i) => {
    const [tx, ty] = pt(from - d / 2, d < 30 ? 82 : 66);
    b += txt(tx, ty, `${d}°`, { size: d < 30 ? 13 : 16, fill: isH(i) ? '#1d7d5b' : INK, halo: d < 30 });
    from -= d;
  });
  b += `<line x1="14" y1="${cy}" x2="246" y2="${cy}" stroke="${INK}" stroke-width="4" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="4" fill="${INK}"/>`;
  return svg(260, 124, b);
}

// Shapes on squared paper. polys: [{ pts, fill, op, dash, stroke }]; hl: [x, h] a red dashed height;
// labels: [x, y, text, colour]; arrows: [[x0, y0, x1, y1]] all in grid units.
function gridShapes(W, H, polys, { hl = null, labels = [], arrows = [] } = {}) {
  const u = Math.max(8, Math.min(24, Math.floor(260 / W), Math.floor(140 / H))), ox = 18, oy = 18;
  const X = x => (ox + x * u).toFixed(1), Y = y => (oy + (H - y) * u).toFixed(1);
  let b = '';
  for (let x = 0; x <= W; x++) b += `<line x1="${X(x)}" y1="${Y(0)}" x2="${X(x)}" y2="${Y(H)}" stroke="#e3dcc6" stroke-width="1"/>`;
  for (let y = 0; y <= H; y++) b += `<line x1="${X(0)}" y1="${Y(y)}" x2="${X(W)}" y2="${Y(y)}" stroke="#e3dcc6" stroke-width="1"/>`;
  for (const p of polys) {
    b += `<polygon points="${p.pts.map(([x, y]) => `${X(x)},${Y(y)}`).join(' ')}" fill="${p.fill || SAND}" fill-opacity="${p.op ?? 0.85}" stroke="${p.stroke || INK}" stroke-width="3" stroke-linejoin="round"${p.dash ? ' stroke-dasharray="6 4"' : ''}/>`;
  }
  if (hl) b += `<line x1="${X(hl[0])}" y1="${Y(0)}" x2="${X(hl[0])}" y2="${Y(hl[1])}" stroke="${RED}" stroke-width="3" stroke-dasharray="6 4"/>`;
  for (const [x0, y0, x1, y1] of arrows) {
    const a = Math.atan2(+Y(y1) - +Y(y0), +X(x1) - +X(x0)), ex = +X(x1), ey = +Y(y1);
    b += `<line x1="${X(x0)}" y1="${Y(y0)}" x2="${ex}" y2="${ey}" stroke="${RED}" stroke-width="3"/>`;
    b += `<path d="M${ex} ${ey} L${(ex - 10 * Math.cos(a - 0.5)).toFixed(1)} ${(ey - 10 * Math.sin(a - 0.5)).toFixed(1)} L${(ex - 10 * Math.cos(a + 0.5)).toFixed(1)} ${(ey - 10 * Math.sin(a + 0.5)).toFixed(1)}Z" fill="${RED}"/>`;
  }
  for (const [x, y, t, c] of labels) b += txt(X(x), Y(y), t, { size: 16, fill: c || INK, halo: true });
  return svg(W * u + 36, H * u + 36, b);
}

// One turn of a wheel: the red rim unrolls flat. d and c are labels ('?' for a yellow slot).
const slot = (x, y) => `<circle cx="${x}" cy="${y}" r="13" fill="#fff4cc" stroke="${SLOT}" stroke-width="2.5" stroke-dasharray="4 3"/>${txt(x, y, '?', { size: 15, fill: SLOT })}`;
function rollPic(d, c) {
  const r = 32, x0 = 38, cy = 50, g = cy + r, x1 = x0 + Math.PI * 2 * r;
  let b = `<line x1="4" y1="${g}" x2="276" y2="${g}" stroke="#c9c2b0" stroke-width="3"/>`;
  b += `<circle cx="${x1.toFixed(1)}" cy="${cy}" r="${r}" fill="none" stroke="${INK}" stroke-width="2" stroke-dasharray="5 4" opacity=".45"/>`;
  b += `<line x1="${x0}" y1="${g}" x2="${x1.toFixed(1)}" y2="${g}" stroke="${RED}" stroke-width="7" stroke-linecap="round"/>`;
  b += `<circle cx="${x0}" cy="${cy}" r="${r}" fill="#fff" stroke="${RED}" stroke-width="7"/><circle cx="${x0}" cy="${cy}" r="4" fill="${INK}"/>`;
  b += `<line x1="${x0 - r + 5}" y1="${cy}" x2="${x0 + r - 5}" y2="${cy}" stroke="${BLUE}" stroke-width="4"/>`;
  b += d === '?' ? slot(x0, cy - 14) : txt(x0, cy - 14, d, { size: 16, fill: BLUE, halo: true });
  const mx = ((x0 + x1) / 2).toFixed(1);
  b += `<path d="M${x0} ${g + 10} v8 H${x1.toFixed(1)} v-8" fill="none" stroke="${RED}" stroke-width="2.5"/>`;
  b += c === '?' ? slot(mx, g + 32) : txt(mx, g + 32, c, { size: 18, fill: RED });
  return svg(280, g + 48, b);
}
// A circle with a square on its radius: about 3.14 of those squares fill the circle.
function circSq(r) {
  const c = 70, R = 58;
  let b = `<circle cx="${c}" cy="${c}" r="${R}" fill="${SAND}" stroke="${INK}" stroke-width="3.5"/>`;
  b += `<rect x="${c}" y="${c - R}" width="${R}" height="${R}" fill="${SUN}" fill-opacity=".55" stroke="${INK}" stroke-width="2.5"/>`;
  b += `<line x1="${c}" y1="${c}" x2="${c + R}" y2="${c}" stroke="${RED}" stroke-width="4"/>` + txt(c + R / 2, c + 13, r, { size: 17, fill: RED, halo: true });
  b += txt(c + R + 14, c - R / 2, r, { size: 17, fill: RED });
  return svg(150, 140, b);
}

// The six faces of a box in twin pairs, coloured like the cube picture: front, top, side.
function facesPic(l, w, h) {
  const u = Math.min(12, Math.floor(72 / Math.max(l, w, h)), Math.floor(84 / Math.max(h, w) / 2));
  const face = (x, y, a, bb, col) => {
    let s = '';
    for (let i = 0; i < a; i++) for (let j = 0; j < bb; j++) s += `<rect x="${x + i * u}" y="${y + j * u}" width="${u}" height="${u}" fill="${col}" stroke="${INK}" stroke-width="1"/>`;
    return s;
  };
  const pairs = [[l, h, '#f6c35e'], [l, w, '#fbe3a5'], [w, h, '#d99a3a']];
  let b = '';
  pairs.forEach(([a, bb, col], i) => {
    const cx = 48 + i * 96, x = cx - (a * u) / 2;
    b += face(x, 4, a, bb, col) + face(x, 10 + bb * u, a, bb, col);
    b += txt(cx, 4 + (bb * u) / 2, a * bb, { size: 15, halo: true }) + txt(cx, 10 + 1.5 * bb * u, a * bb, { size: 15, halo: true });
  });
  const H = 14 + 2 * Math.max(h, w) * u;
  return svg(288, H, b);
}

// The treasure map. segs: [[x0, y0, x1, y1, colour]] drawn as arrows; ring: [x, y] circles a spot.
function mapPic(n, marks, { segs = [], ring = null, hx = null, hy = null } = {}) {
  const u = Math.floor(200 / n), o = 26, T = 14, W = n * u + o + 14, H = n * u + T + 22;
  const X = x => o + x * u, Y = y => T + (n - y) * u;
  let b = `<rect x="${o}" y="${T}" width="${n * u}" height="${n * u}" fill="#fbf1d2"/>`;
  for (let i = 0; i <= n; i++) {
    b += `<line x1="${X(i)}" y1="${T}" x2="${X(i)}" y2="${Y(0)}" stroke="#e0cf9c" stroke-width="1"/><line x1="${o}" y1="${Y(i)}" x2="${X(n)}" y2="${Y(i)}" stroke="#e0cf9c" stroke-width="1"/>`;
    if (i === hx) b += `<circle cx="${X(i)}" cy="${Y(0) + 12}" r="10" fill="${PALE}" stroke="${MINT}" stroke-width="2"/>`;
    if (i === hy) b += `<circle cx="${o - 12}" cy="${Y(i)}" r="10" fill="${PALE}" stroke="${MINT}" stroke-width="2"/>`;
    b += txt(X(i), Y(0) + 12, i, { size: 13 }) + txt(o - 12, Y(i), i, { size: 13 });
  }
  b += `<line x1="${o}" y1="${Y(0)}" x2="${X(n)}" y2="${Y(0)}" stroke="${INK}" stroke-width="3"/><line x1="${o}" y1="${T}" x2="${o}" y2="${Y(0)}" stroke="${INK}" stroke-width="3"/>`;
  for (const [x0, y0, x1, y1, col = RED] of segs) {
    if (x0 === x1 && y0 === y1) continue;
    const ex = X(x1), ey = Y(y1), a = Math.atan2(ey - Y(y0), ex - X(x0));
    b += `<line x1="${X(x0)}" y1="${Y(y0)}" x2="${ex}" y2="${ey}" stroke="${col}" stroke-width="6" stroke-linecap="round"/>`;
    b += `<path d="M${ex} ${ey} L${(ex - 11 * Math.cos(a - 0.5)).toFixed(1)} ${(ey - 11 * Math.sin(a - 0.5)).toFixed(1)} L${(ex - 11 * Math.cos(a + 0.5)).toFixed(1)} ${(ey - 11 * Math.sin(a + 0.5)).toFixed(1)}Z" fill="${col}"/>`;
  }
  if (ring) b += `<circle cx="${X(ring[0])}" cy="${Y(ring[1])}" r="${Math.min(14, u * 0.6)}" fill="${PALE}" stroke="${MINT}" stroke-width="3"/>`;
  for (const [x, y, t] of marks) b += `<text x="${X(x)}" y="${Y(y)}" font-size="${Math.min(20, u)}" text-anchor="middle" dominant-baseline="central">${t}</text>`;
  return svg(W, H, b);
}

// Towers of blocks with their heights under them. level draws the mean line: blocks above it red, gaps below it dashed.
function towersPic(hs, { level = null, hi = -1, qi = -1 } = {}) {
  const max = Math.max(...hs, level || 0), k = hs.length;
  const u = Math.min(18, Math.floor(130 / max)), bw = Math.min(34, Math.floor(230 / k) - 8);
  const W = k * (bw + 8) + 10, top = max * u + 8;
  let b = '';
  hs.forEach((h, i) => {
    const x = 6 + i * (bw + 8);
    for (let j = 0; j < h; j++) b += `<rect x="${x}" y="${top - (j + 1) * u}" width="${bw}" height="${u}" fill="${level !== null && j >= level ? RED : i === hi ? MINT : SANDD}" stroke="${INK}" stroke-width="1.5"/>`;
    if (level !== null) for (let j = h; j < level; j++) b += `<rect x="${x + 1}" y="${top - (j + 1) * u + 1}" width="${bw - 2}" height="${u - 2}" fill="#fff8e0" stroke="${SUN}" stroke-width="2" stroke-dasharray="4 3"/>`;
    b += i === qi ? `<rect x="${x + 2}" y="${top - 2 * u}" width="${bw - 4}" height="${2 * u}" rx="4" fill="#fff8e0" stroke="${SUN}" stroke-width="2.5" stroke-dasharray="4 3"/>` + txt(x + bw / 2, top + 13, '?', { size: 15, fill: SLOT })
      : txt(x + bw / 2, top + 13, h, { size: 15, fill: i === hi ? MINT : INK });
  });
  if (level !== null) b += `<line x1="0" y1="${top - level * u}" x2="${W}" y2="${top - level * u}" stroke="${BLUE}" stroke-width="3" stroke-dasharray="6 4"/>`;
  return svg(W, top + 24, b);
}

// Number cards in a row: mid lights up, fade crosses out; '?' is the yellow slot.
function cardRow(vals, { mid = [], fade = [] } = {}) {
  const Sz = 36, G = 6, W = vals.length * (Sz + G) - G + 8;
  let b = '';
  vals.forEach((v, i) => {
    const x = 4 + i * (Sz + G), q = v === '?' || v === null, on = mid.includes(i), off = fade.includes(i);
    b += `<g opacity="${off ? 0.35 : 1}"><rect x="${x}" y="4" width="${Sz}" height="${Sz}" rx="7" fill="${q ? '#fff8e0' : on ? PALE : '#fff4d6'}" stroke="${q ? SUN : on ? MINT : INK}" stroke-width="${on ? 3.5 : 2.5}"${q ? ' stroke-dasharray="4 3"' : ''}/>`;
    b += txt(x + Sz / 2, 4 + Sz / 2 + 1, q ? '?' : v, { size: String(v).length > 2 ? 14 : 18, fill: q ? SLOT : INK }) + '</g>';
    if (off) b += `<line x1="${x + 5}" y1="${4 + Sz - 5}" x2="${x + Sz - 5}" y2="9" stroke="${RED}" stroke-width="3"/>`;
  });
  return svg(W, Sz + 8, b);
}

// A dot plot with how many dots each pile has written on top; mode lights up that column.
function plotPic(vals, lo, hi, { counts = false, mode = null } = {}) {
  const u = Math.floor(230 / (hi - lo + 1)), cnt = {};
  vals.forEach(v => (cnt[v] = (cnt[v] || 0) + 1));
  const top = Math.max(...Object.values(cnt)), H = top * 18 + 34 + (counts ? 20 : 0), W = (hi - lo + 1) * u + 10;
  let b = '';
  for (let v = lo; v <= hi; v++) {
    const x = 5 + (v - lo) * u + u / 2, c = cnt[v] || 0;
    if (v === mode) b += `<rect x="${x - u / 2 + 2}" y="${H - 42 - c * 18 - (counts ? 4 : 0)}" width="${u - 4}" height="${c * 18 + 42 + (counts ? 4 : 0)}" rx="8" fill="${PALE}" stroke="${MINT}" stroke-width="2.5"/>`;
    for (let k = 0; k < c; k++) b += `<circle cx="${x}" cy="${H - 34 - k * 18}" r="7" fill="${v === mode ? MINT : SANDD}" stroke="${INK}" stroke-width="1.5"/>`;
    if (counts && c) b += txt(x, H - 34 - c * 18 + 2, c, { size: 14, fill: v === mode ? '#1d7d5b' : '#56608a' });
    b += txt(x, H - 11, v, { size: 14 });
  }
  b += `<line x1="4" y1="${H - 24}" x2="${W - 4}" y2="${H - 24}" stroke="${INK}" stroke-width="2.5"/>`;
  return svg(W, H, b);
}

// A pen of w × h squares with a red fence around it and its sides written on.
function penPic(w, h, u, { labels = true } = {}) {
  const ox = labels ? 20 : 4, oy = labels ? 20 : 4;
  let b = '';
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) b += `<rect x="${ox + x * u}" y="${oy + y * u}" width="${u}" height="${u}" fill="${SAND}" stroke="#fff" stroke-width="1.5"/>`;
  b += `<rect x="${ox}" y="${oy}" width="${w * u}" height="${h * u}" fill="none" stroke="${RED}" stroke-width="3.5"/>`;
  if (labels) b += txt(ox + (w * u) / 2, 10, w, { size: 14 }) + txt(9, oy + (h * u) / 2, h, { size: 14 });
  return svg(w * u + ox + 6, h * u + oy + 6, b);
}

const nuts = (k, label) => `<div class="solchests">${Array.from({ length: k }, () => `<span><i>🥥</i><b>${label}</b></span>`).join('')}</div>`;

// ---------- 1. units ----------
function dUnit({ ask, n, k, big, small, part = 0, v, nm, dn }, q, given) {
  const g = num(given), is = `1 ${big} = ${m(k)} ${small}`, isV = { a: big, b: m(k), c: small };
  let ans, steps, oops = null;
  const zeros = x => [10, 100, 1000].map(f => x * f);
  if (ask === 'down') {
    ans = n * k;
    steps = [S(unitBar(n, big, k), is, 'dUnitIs', isV), S(unitBar(n, big, k, 0, { total: `${m(ans)} ${small}` }), `${n} × ${m(k)} = ${m(ans)}`, 'dUnitMany', { a: n, b: m(ans), c: small })];
    if (g === n + k) oops = OOPS(`${n} × ${m(k)}`, 'dOopsUnitPlus', isV);
    else if (zeros(n).concat(ans * 10).includes(g)) oops = OOPS(is, 'dOopsUnitK', isV);
  } else if (ask === 'up') {
    ans = v / k;
    steps = [S(unitBar(ans, big, k, 0, { total: `${m(v)} ${small}` }), is, 'dUnitIs', isV), S(unitBar(ans, big, k, 0, { total: `${m(v)} ${small}` }), `${m(v)} ÷ ${m(k)} = ${ans}`, 'dUnitGroups', { a: m(k), b: small, c: m(v) })];
    if ([ans * 10, v / 10, v / 100].includes(g)) oops = OOPS(is, 'dOopsUnitK', isV);
  } else if (ask === 'mixed') {
    ans = n * k + part;
    steps = [S(unitBar(n, big, k, part, { small }), `${n} × ${m(k)} = ${m(n * k)}`, 'dUnitBigFirst', { a: big, b: small }),
      S(unitBar(n, big, k, part, { small, total: `${m(ans)} ${small}` }), `${m(n * k)} + ${part} = ${m(ans)}`, 'dUnitAddRest', { a: part, b: small })];
    if (g === n + part) oops = OOPS(`${n} ${big} = ${m(n * k)} ${small}`, 'dOopsMixedUnit', { a: big, b: small });
    else if (zeros(n).map(x => x + part).includes(g)) oops = OOPS(is, 'dOopsUnitK', isV);
  } else {
    const each = k / dn;
    ans = each * nm;
    steps = [S(valueBar(k, dn, nm), is, 'dUnitIs', isV),
      S(valueBar(k, dn, nm), `${m(k)} ÷ ${dn} = ${m(each)}${nm > 1 ? `<br>${nm} × ${m(each)} = ${m(ans)}` : ''}`, 'dUnitPart', { a: m(k), b: dn, c: nm })];
    if ([k / 2, k / 4, (3 * k) / 4].includes(g) && g !== ans) oops = OOPS(`${nm} × ${m(each)} = ${m(ans)}`, 'dOopsFracUnit', { a: nm, b: dn });
  }
  return { ans, steps, oops };
}
function dUnitCmp({ a, p, k, big, small, r }, q, given) {
  const left = a * k + p, sym = SYM(left, r);
  const lo = Math.min(left, r), hi = Math.max(left, r), pad = Math.max(2, Math.round((hi - lo) * 0.3));
  return {
    ans: sym,
    steps: [S(unitBar(a, big, k, p, { small, total: `${m(left)} ${small}` }), `${a} ${big} = ${m(a * k)} ${small}<br>${m(a * k)} + ${p} = ${m(left)}`, 'dUnitSame', { a: small }),
      S(nline(Math.max(0, lo - pad), hi + pad, { marks: left === r ? [[left, MINT, '=']] : [[left, RED, ''], [r, BLUE, '']] }), `${m(left)} ${esc(sym)} ${m(r)}`, left === r ? 'dCmpSame' : 'dCmpNow')],
    oops: given && given !== sym ? OOPS(`${a} ${big} = ${m(a * k)} ${small}`, 'dOopsUnitCmp') : null,
  };
}

// ---------- 2. protractor ----------
const vs90 = d => (d < 90 ? 'dLess90' : d > 90 ? 'dMore90' : 'dIs90');
function dProtr({ d }, q, given) {
  return {
    ans: d,
    steps: [S(protPic(d), `0° ➜ ${d}°`, 'dProtrRead'), S(d === 90 ? '' : angleOverlay(d, 90), `${d}° ${esc(SYM(d, 90))} 90°`, vs90(d))],
    oops: given === 180 - d && d !== 90 ? OOPS(`180° − ${d}° = ${180 - d}°`, 'dOopsOtherEnd') : null,
  };
}
function dGuess({ d }, q) {
  const best = [30, 60, 90, 120, 150].reduce((b, x) => (Math.abs(x - d) < Math.abs(b - d) ? x : b), 30);
  return {
    ans: `${best}°`,
    steps: [S(angleOverlay(d, 90), `? ${d < 90 ? '&lt;' : '&gt;'} 90°`, d < 90 ? 'dLess90' : 'dMore90'), S(angleOverlay(d, best), `≈ ${best}°`, 'dGuessNear', { a: best })],
  };
}

// ---------- 3. corners of a triangle ----------
function dTri({ x, y }, q, given) {
  const s = x + y, ans = 180 - s;
  let oops = null;
  if (given === 360 - s) oops = OOPS(`180° − ${s}° = ${ans}°`, 'dOops360');
  else if ((given === 180 - x || given === 180 - y) && given !== ans) oops = OOPS(`180° − ${x}° − ${y}°`, 'dOopsOneCorner');
  return { ans, steps: [S(q.visual, `${x}° + ${y}° = ${s}°`, 'dTriAdd'), S(lineFan([x, y, ans], [2]), `180° − ${s}° = ${ans}°`, 'dTri180')], oops };
}
function dIso({ ask, top, base }, q, given) {
  if (ask === 'base') {
    const rest = 180 - top, ans = rest / 2;
    return {
      ans,
      steps: [S(q.visual, `180° − ${top}° = ${rest}°`, 'dIsoRest'), S(lineFan([ans, top, ans], [0, 2]), `${rest}° ÷ 2 = ${ans}°`, 'dIsoHalf')],
      oops: given === rest ? OOPS(`${rest}° ÷ 2`, 'dOopsHalve') : null,
    };
  }
  const two = 2 * base, ans = 180 - two;
  return {
    ans,
    steps: [S(q.visual, `${base}° + ${base}° = ${two}°`, 'dIsoTwice'), S(lineFan([base, ans, base], [1]), `180° − ${two}° = ${ans}°`, 'dTri180')],
    oops: given === 180 - base ? OOPS(`180° − ${base}° − ${base}°`, 'dOopsTwice') : null,
  };
}

// ---------- 4. areas ----------
const fenceOops = (g, per, ans) => (g === per && per !== ans ? OOPS(`${ans}`, 'dOopsFenceArea') : null);
function dPara({ b, h, s }, q, given) {
  const ans = b * h, W = b + s;
  const para = [[0, 0], [b, 0], [b + s, h], [s, h]], rect = [[s, 0], [b + s, 0], [b + s, h], [s, h]];
  const cut = gridShapes(W, h, [{ pts: para }, { pts: [[0, 0], [s, 0], [s, h]], fill: RED, op: 0.45 }, { pts: [[b, 0], [b + s, 0], [b + s, h]], fill: 'none', dash: true, stroke: RED }],
    { hl: [s, h], arrows: [[s * 0.66, h * 0.3, b + s * 0.5, h * 0.3]], labels: [[b / 2, -0.5, b], [s + 0.5, h * 0.65, h, RED]] });
  const box = gridShapes(W, h, [{ pts: rect }], { labels: [[s + b / 2, -0.5, b], [s - 0.5, h / 2, h, RED]] });
  let oops = fenceOops(given, 2 * (b + h), ans);
  if (!oops && given !== ans) {
    if (given === (ans / 2 | 0)) oops = OOPS(`${b} × ${h} = ${ans}`, 'dOopsNoHalf');
    else if (given === b + h) oops = OOPS(`${b} × ${h}`, 'dOopsAddSides');
    else if (given === (b + s) * h) oops = OOPS(`${b} × ${h}`, 'dOopsWidth');
  }
  return { ans, steps: [S(cut, '▱ ➜ ▭', 'dParaCut'), S(box, `${b} × ${h} = ${ans}`, 'dParaRect')], oops };
}
function dTriArea({ b, h, top }, q, given) {
  const whole = b * h, ans = whole / 2, W = b + top, tri = [[0, 0], [b, 0], [top, h]];
  const two = gridShapes(W, h, [{ pts: tri }, { pts: [[b, 0], [b + top, h], [top, h]], fill: '#bfe3f7', op: 0.7, dash: true }], { hl: [top, h], labels: [[b / 2, -0.5, b], [top + (top < W / 2 ? 0.5 : -0.5), h / 2, h, RED]] });
  const one = gridShapes(W, h, [{ pts: tri }, { pts: [[b, 0], [b + top, h], [top, h]], fill: 'none', op: 0, dash: true, stroke: '#b9c1d6' }], { labels: [[b / 3 + top / 3, h / 3, ans]] });
  let oops = fenceOops(given, 2 * (b + h), ans);
  if (!oops && given === whole) oops = OOPS(`${whole} ÷ 2 = ${ans}`, 'dOopsNoHalve');
  else if (!oops && given === b + h && given !== ans) oops = OOPS(`${b} × ${h} ÷ 2`, 'dOopsAddSides');
  return { ans, steps: [S(two, `${b} × ${h} = ${whole}`, 'dTriTwo'), S(one, `${whole} ÷ 2 = ${ans}`, 'dTriHalf')], oops };
}
function dParaBase({ area, h, s }, q, given) {
  const b = area / h, W = b + s;
  const para = gridShapes(W, h, [{ pts: [[0, 0], [b, 0], [b + s, h], [s, h]] }], { hl: [s, h], labels: [[b / 2, -0.5, '?', SLOT], [s + 0.5, h / 2, h, RED]] });
  const box = gridShapes(W, h, [{ pts: [[s, 0], [b + s, 0], [b + s, h], [s, h]] }], { labels: [[s + b / 2, -0.5, b, MINT], [s - 0.5, h / 2, h, RED]] });
  return {
    ans: b,
    steps: [S(para, `? × ${h} = ${area}`, 'dAreaRule'), S(box, `${area} ÷ ${h} = ${b}`, 'dAreaUndo', { a: h })],
    oops: given === area - h ? OOPS(`? × ${h} = ${area}`, 'dOopsMinusArea') : null,
  };
}
function dTrap({ a, b, h, s }, q, given) {
  const base = a + b, whole = base * h, ans = whole / 2, W = base + s;
  const trap = [[0, 0], [b, 0], [s + a, h], [s, h]], copy = [[b, 0], [b + a, 0], [b + s + a, h], [s + a, h]];
  const both = gridShapes(W, h, [{ pts: trap }, { pts: copy, fill: '#bfe3f7', op: 0.8, dash: true }], { hl: [s, h], labels: [[b / 2, -0.5, b], [b + a / 2, -0.5, a, BLUE], [s + a / 2, h + 0.5, a], [s + 0.5, h / 2, h, RED]] });
  const one = gridShapes(W, h, [{ pts: trap }, { pts: copy, fill: 'none', op: 0, dash: true, stroke: '#b9c1d6' }], { labels: [[s / 2 + b / 2 - 0.2, h / 2, ans]] });
  let oops = null;
  if (given === whole) oops = OOPS(`${whole} ÷ 2 = ${ans}`, 'dOopsNoHalve');
  else if ((given === a * h || given === b * h) && given !== ans) oops = OOPS(`${a} + ${b} = ${base}`, 'dOopsOneSide');
  return {
    ans,
    steps: [S(both, `${b} + ${a} = ${base}`, 'dTrapCopy'), S(both, `${base} × ${h} = ${whole}`, 'dTrapRect'), S(one, `${whole} ÷ 2 = ${ans}`, 'dTrapHalf')],
    oops,
  };
}

// ---------- 5. circles ----------
function dPi3(sol, q) {
  return { ans: '≈ 3', steps: [S(rollPic('1', '3.14'), '🛞 1 ➜ 3.14', 'dPiRoll'), S(q.visual, '3.14 ≈ 3', 'dPiThree')] };
}
function dCirc({ d }, q, given) {
  const full = f2(3.14 * d), c = f1(3.14 * d), g = num(given);
  let oops = null;
  if (g === f1(3.14 * d * d) && g !== c) oops = OOPS(`3.14 × ${d}`, 'dOopsCircArea');
  else if (g === f1((3.14 * d) / 2) && g !== c) oops = OOPS(`3.14 × ${d}`, 'dOopsHalfWidth');
  return {
    ans: String(c),
    steps: [S(rollPic(d, '?'), `3.14 × ${d}`, 'dCircTimes'),
      S(rollPic(d, `≈ ${c}`), `3 × ${d} = ${3 * d}<br>3.14 × ${d} ${full !== c ? '≈' : '='} ${c}`, 'dCircWork')],
    oops,
  };
}
function dCircArea({ r }, q, given) {
  const sq = r * r, full = f2(3.14 * sq), a = f1(3.14 * sq), g = num(given);
  let oops = null;
  if (g !== a) {
    if (g === f1(3.14 * 2 * r) || g === f1(3.14 * r)) oops = OOPS(`3.14 × ${r} × ${r}`, 'dOopsCircum');
    else if (g === sq) oops = OOPS(`3.14 × ${sq}`, 'dOopsNoPi');
  }
  return {
    ans: String(a),
    steps: [S(circSq(r), `${r} × ${r} = ${sq}`, 'dCircSquare', { a: r }), S(circSq(r), `3.14 × ${sq} ${full !== a ? '≈' : '='} ${a}`, 'dCircAbout')],
    oops,
  };
}
function dCircBack({ d }, q, given) {
  const c = f1(3.14 * d), w = Math.round(c / 3.14), g = num(given);
  return {
    ans: String(w),
    steps: [S(rollPic('?', `≈ ${c}`), `? × 3.14 ≈ ${c}`, 'dCircBack'), S(rollPic(w, `≈ ${c}`), `${c} ÷ 3.14 ≈ ${w}<br>3.14 × ${w} = ${f2(3.14 * w)}`, 'dCircDiv')],
    oops: g === f1(w / 2) && g !== w ? OOPS(`${c} ÷ 3.14 ≈ ${w}`, 'dOopsRadius') : null,
  };
}

// ---------- 6. volume and surface ----------
function dVol({ ask, l, w, h }, q, given) {
  const lw = l * w, v = lw * h;
  if (ask === 'missing') {
    return {
      ans: v / lw,
      steps: [S(cuboid(l, w, 1), `${l} × ${w} = ${lw}`, w > 1 ? 'dVolLayer' : 'dVolRow', { a: w, b: l }), S(cuboid(l, w, v / lw), `${v} ÷ ${lw} = ${v / lw}`, 'dVolMiss', { a: lw, b: v })],
      oops: given === v - lw && v - lw !== v / lw ? OOPS(`${v} ÷ ${lw}`, 'dOopsMinusVol') : null,
    };
  }
  let oops = null;
  if (given !== v) {
    if (given === l + w + h || given === lw + h) oops = OOPS(`${l} × ${w} × ${h}`, 'dOopsPlusVol');
    else if (given === l * h && ask === 'count') oops = OOPS(`${l} × ${w} × ${h}`, 'dOopsFront');
    else if (given === 2 * (lw + w * h + l * h)) oops = OOPS(`${l} × ${w} × ${h}`, 'dOopsSurfVol');
  }
  return {
    ans: v,
    steps: [S(cuboid(l, w, 1), `${l} × ${w} = ${lw}`, w > 1 ? 'dVolLayer' : 'dVolRow', { a: w, b: l }), S(cuboid(l, w, h), `${lw} × ${h} = ${v}`, h > 1 ? 'dVolLayers' : 'dVolOne', { a: h })],
    oops,
  };
}
function dSurf({ l, w, h }, q, given) {
  const A = l * h, B = l * w, C = w * h, sa = 2 * (A + B + C);
  let oops = null;
  if (given === l * w * h && given !== sa) oops = OOPS(`2 × ${A} + 2 × ${B} + 2 × ${C}`, 'dOopsSurfCubes');
  else if (given === A + B + C) oops = OOPS(`2 × (${A} + ${B} + ${C})`, 'dOopsSurfHalf');
  return {
    ans: sa,
    steps: [S(cuboid(l, w, h), '6 ▢', 'dSurfBox'), S(facesPic(l, w, h), `${A} + ${B} + ${C} = ${A + B + C}`, 'dSurfPairs'),
      S(facesPic(l, w, h), `2 × ${A + B + C} = ${sa}`, 'dSurfSum')],
    oops,
  };
}

// ---------- 7. treasure map ----------
const pt = (x, y) => `(${x}, ${y})`;
function dMapRead({ n, x, y, e }, q, given) {
  return {
    ans: pt(x, y),
    steps: [S(mapPic(n, [[x, y, e]], { segs: [[0, 0, x, 0]], hx: x }), `➡️ ${x}`, 'dMapRight', { a: x }),
      S(mapPic(n, [[x, y, e]], { segs: [[0, 0, x, 0], [x, 0, x, y, MINT]], hx: x, hy: y }), `⬆️ ${y}<br>${pt(x, y)}`, 'dMapUp', { a: y })],
    oops: given === pt(y, x) ? OOPS(`➡️ ${x} ⬆️ ${y}`, 'dOopsXY') : null,
  };
}
function dMapFind({ n, x, y, marks }, q, given) {
  const at = (a, b) => marks.find(k => k[0] === a && k[1] === b)?.[2];
  const ans = at(x, y), swap = at(y, x);
  return {
    ans,
    steps: [S(mapPic(n, marks, { segs: [[0, 0, x, 0]], hx: x }), `➡️ ${x}`, 'dMapRight', { a: x }),
      S(mapPic(n, marks, { segs: [[0, 0, x, 0], [x, 0, x, y, MINT]], ring: [x, y], hx: x, hy: y }), `⬆️ ${y}<br>${pt(x, y)} = ${ans}`, 'dMapUp', { a: y })],
    oops: given && swap && given === swap && swap !== ans ? OOPS(`➡️ ${x} ⬆️ ${y}`, 'dOopsXY') : null,
  };
}
function dMapMove({ n, x, y, dx, dy }, q, given) {
  const X1 = x + dx, Y1 = y + dy, cam = [[x, y, '🐫']];
  let oops = null;
  if (given === pt(x + dy, y + dx) && dx !== dy) oops = OOPS(`➡️ ${dx} ⬆️ ${dy}`, 'dOopsMoveSwap');
  else if (given === pt(dx, dy) && (x || y)) oops = OOPS(pt(x, y), 'dOopsFrom0');
  return {
    ans: pt(X1, Y1),
    steps: [S(mapPic(n, cam, { segs: [[x, y, X1, y]], hx: X1 }), `${x} + ${dx} = ${X1}`, 'dMoveRight', { a: dx }),
      S(mapPic(n, cam, { segs: [[x, y, X1, y], [X1, y, X1, Y1, MINT]], ring: [X1, Y1], hx: X1, hy: Y1 }), `${y} + ${dy} = ${Y1}<br>${pt(X1, Y1)}`, 'dMoveUp', { a: dy })],
    oops,
  };
}
function dMapRect({ n, corners }, q, given) {
  const once = vals => vals.find(v => vals.filter(w => w === v).length === 1);
  const X = once(corners.map(c => c[0])), Y = once(corners.map(c => c[1]));
  const byX = corners.find(c => c[0] === X), byY = corners.find(c => c[1] === Y);
  const palms = corners.map(([a, b]) => [a, b, '🌴']);
  return {
    ans: pt(X, Y),
    steps: [S(mapPic(n, palms, { segs: [[byX[0], byX[1], X, Y, MINT]], hx: X }), `➡️ ${X}`, 'dRectX', { a: X }),
      S(mapPic(n, palms, { segs: [[byX[0], byX[1], X, Y, MINT], [byY[0], byY[1], X, Y, MINT]], ring: [X, Y], hx: X, hy: Y }), `⬆️ ${Y}<br>${pt(X, Y)}`, 'dRectY', { a: Y })],
    oops: given === pt(Y, X) && X !== Y ? OOPS(`➡️ ${X} ⬆️ ${Y}`, 'dOopsXY') : null,
  };
}

// ---------- 8. mean ----------
function dMean({ ask, hs }, q, given) {
  const k = hs.length, sum = hs.reduce((a, b) => a + b, 0), ans = sum / k;
  const sorted = [...hs].sort((a, b) => a - b), med = k % 2 ? sorted[k >> 1] : null;
  let oops = null;
  if (given === sum) oops = OOPS(`${sum} ÷ ${k} = ${ans}`, 'dOopsNoShare', { a: k });
  else if (given === Math.max(...hs) && given !== ans) oops = OOPS(`${sum} ÷ ${k} = ${ans}`, 'dOopsTallest');
  else if (given === med && med !== ans) oops = OOPS(`${sum} ÷ ${k} = ${ans}`, 'dOopsMedianMean');
  const first = ask === 'nums' ? cardRow(hs) : towersPic(hs, { level: ans });
  return {
    ans,
    steps: [S(first, sumLine(hs, sum), ask === 'nums' ? 'dMeanAdd' : 'dMeanAll', { a: sum }), S(towersPic(Array(k).fill(ans), { level: ans }), `${sum} ÷ ${k} = ${ans}`, 'dMeanShare', { a: k })],
    oops,
  };
}
function dMeanMiss({ shown, mean }, q, given) {
  const k = shown.length, tot = k * mean, known = shown.filter(v => v !== null), ks = known.reduce((a, b) => a + b, 0), ans = tot - ks;
  const i = shown.indexOf(null), full = shown.map(v => (v === null ? ans : v));
  return {
    ans,
    steps: [S(towersPic(Array(k).fill(mean), { level: mean }), `${k} × ${mean} = ${tot}`, 'dMeanTotal', { a: k, b: mean }),
      S(towersPic(shown.map(v => v ?? 0), { qi: i }), sumLine(known, ks), 'dMeanKnown', { a: ks }),
      S(towersPic(full, { hi: i }), `${tot} − ${ks} = ${ans}`, 'dMeanRest')],
    oops: given === mean && mean !== ans ? OOPS(`${tot} − ${ks} = ${ans}`, 'dOopsMeanGiven') : null,
  };
}

// ---------- 9. median and mode ----------
function dMedian({ ask, vals }, q, given) {
  const k = vals.length, s = [...vals].sort((a, b) => a - b), odd = k % 2 === 1;
  const mids = odd ? [k >> 1] : [k / 2 - 1, k / 2], ans = odd ? s[k >> 1] : (s[k / 2 - 1] + s[k / 2]) / 2;
  const fade = s.map((_, i) => i).filter(i => !mids.includes(i));
  const first = ask === 'camels'
    ? `<div class="camels">${s.map(h => `<span class="camel" style="font-size:${14 + h * 4}px">🐪<b>${h}</b></span>`).join('')}</div>`
    : cardRow(s);
  const steps = [S(first, s.join(', '), 'dMedSort'), S(cardRow(s, { mid: mids, fade }), odd ? `${ans}` : `${s[mids[0]]}, ${s[mids[1]]}`, 'dMedCross')];
  if (!odd) steps.push(S(cardRow(s, { mid: mids, fade }), `(${s[mids[0]]} + ${s[mids[1]]}) ÷ 2 = ${ans}`, 'dMedTwo'));
  const mean = Math.round(vals.reduce((a, b) => a + b, 0) / k);
  let oops = null;
  if (given !== ans && given === vals[k >> 1]) oops = OOPS(s.join(', '), 'dOopsUnsorted');
  else if (given !== ans && given === mean) oops = OOPS(s.join(', '), 'dOopsMeanMed');
  return { ans, steps, oops };
}
function dMode({ vals, lo, hi }, q, given) {
  const cnt = {};
  vals.forEach(v => (cnt[v] = (cnt[v] || 0) + 1));
  const top = Math.max(...Object.values(cnt)), ans = +Object.keys(cnt).find(v => cnt[v] === top);
  const rest = Math.max(0, ...Object.entries(cnt).filter(([v]) => +v !== ans).map(([, c]) => c));
  return {
    ans,
    steps: [S(plotPic(vals, lo, hi, { counts: true }), `${top} &gt; ${rest}`, 'dModeCount'), S(plotPic(vals, lo, hi, { counts: true, mode: ans }), `${ans}`, 'dModeTop', { a: ans })],
    oops: (given === ans + 1 || given === ans - 1) ? OOPS(`${ans}`, 'dOopsColumn') : null,
  };
}

// ---------- 10. fences ----------
function dFenceMost({ P }, q, given) {
  const rects = q.choices.map(c => String(c.value).split('x').map(Number));
  const best = rects.reduce((b, r) => (r[0] * r[1] > b[0] * b[1] ? r : b));
  const u = Math.floor(100 / Math.max(...rects.map(r => r[0])));
  const long = rects.reduce((b, r) => (r[0] > b[0] ? r : b));
  return {
    ans: `${best[0]}x${best[1]}`,
    steps: [S(gallery(rects.map(([w, h]) => penPic(w, h, u))), `🧱 ${P}`, 'dFenceSame', { a: P }),
      S(checks(rects.map(([w, h]) => [`${w} × ${h} = ${w * h}`, w === best[0] && h === best[1]])), `${best[0]} × ${best[1]} = ${best[0] * best[1]}`, 'dFenceRoom')],
    oops: given === `${long[0]}x${long[1]}` && long !== best ? OOPS(`${long[0]} × ${long[1]} = ${long[0] * long[1]}`, 'dOopsThin') : null,
  };
}
function dFenceSq({ P }, q, given) {
  const s = P / 4, ans = s * s;
  let oops = null;
  if (given === P && P !== ans) oops = OOPS(`${s} × ${s} = ${ans}`, 'dOopsSqFence');
  else if (given === s) oops = OOPS(`${s} × ${s} = ${ans}`, 'dOopsSqSide');
  return {
    ans,
    steps: [S(gridPic(s, s, { labels: true, fence: true }), `${P} ÷ 4 = ${s}`, 'dSqSide'), S(gridPic(s, s, { rowsHi: true }), `${s} × ${s} = ${ans}`, 'dSqRoom', { a: s })],
    oops,
  };
}
function dFenceCmp({ a, b }, q, given) {
  const pa = 2 * (a[0] + a[1]), pb = 2 * (b[0] + b[1]), sym = SYM(pa, pb);
  const u = Math.min(22, Math.floor(110 / Math.max(a[0], b[0])));
  const pic = row(penPic(a[0], a[1], u), penPic(b[0], b[1], u));
  return {
    ans: sym,
    steps: [S(pic, `${a[0]} × ${a[1]} = ${a[0] * a[1]}<br>${b[0]} × ${b[1]} = ${b[0] * b[1]}`, 'dFcRoom', { a: a[0] * a[1] }),
      S(pic, `${sumLine([a[0], a[1], a[0], a[1]], pa)}<br>${sumLine([b[0], b[1], b[0], b[1]], pb)}`, 'dFcWalk'),
      S(pic, `${pa} ${esc(sym)} ${pb}`, 'dFcThin')],
    oops: given === '=' && sym !== '=' ? OOPS(`${pa} ${esc(sym)} ${pb}`, 'dOopsSameFence') : null,
  };
}

// ---------- 11. travel stories ----------
const hops = (n, step, lab = true) => Array.from({ length: n }, (_, i) => [i * step, (i + 1) * step, lab ? '+' + step : '']);
function dFar({ v, hrs }, q, given) {
  const ans = v * hrs, lab = hrs <= 6;
  let oops = null;
  if (given === v + hrs) oops = OOPS(`${hrs} × ${v}`, 'dOopsPlusTimes', { a: v });
  else if (given === v * (hrs + 1)) oops = OOPS(`${hrs} × ${v}`, 'dOopsHourCount', { a: hrs });
  return {
    ans,
    steps: [S(nline(0, ans, { jumps: hops(1, v) }), `🕐 1 ➜ ${v} km`, 'dFarHour', { a: v }), S(nline(0, ans, { jumps: hops(hrs, v, lab) }), `${hrs} × ${v} = ${ans}`, 'dFarHours', { a: hrs, b: v })],
    oops,
  };
}
function dTime({ v, dist }, q, given) {
  const ans = dist / v;
  return {
    ans,
    steps: [S(nline(0, dist, { jumps: hops(1, v) }), `🕐 1 ➜ ${v} km`, 'dFarHour', { a: v }), S(nline(0, dist, { jumps: hops(ans, v, ans <= 6) }), `${dist} ÷ ${v} = ${ans}`, 'dTimeJumps', { a: v, b: dist })],
    oops: given === v && v !== ans ? OOPS(`${dist} ÷ ${v} = ${ans}`, 'dOopsSpeedHrs') : null,
  };
}
function dPrice({ n, p, k }, q, given) {
  const tot = n * p, one = tot / n, ans = k * one;
  let oops = null;
  if (given === tot + (k - n)) oops = OOPS(`🥥 1 = ${one}🪙`, 'dOopsPriceAdd', { a: one });
  else if (given === tot && tot !== ans) oops = OOPS(`${k} × ${one}`, 'dOopsSamePrice');
  return {
    ans,
    steps: [S(nuts(n, one), `${tot} ÷ ${n} = ${one}`, 'dPriceOne'), S(nuts(k, one), `${k} × ${one} = ${ans}`, 'dPriceMany', { a: k })],
    oops,
  };
}
function dMeet({ a, b, dist }, q, given) {
  const sp = a + b, ans = dist / sp;
  return {
    ans,
    steps: [S(nline(0, dist, { jumps: [[0, a, '🐫'], [dist, dist - b, '🐪', BLUE]] }), `${a} + ${b} = ${sp}`, 'dMeetCloser', { a: sp }),
      S(nline(0, dist, { jumps: hops(ans, sp) }), `${dist} ÷ ${sp} = ${ans}`, 'dMeetJumps', { a: dist })],
    oops: (given === (dist / a | 0) || given === (dist / b | 0)) && given !== ans ? OOPS(`${a} + ${b} = ${sp}`, 'dOopsOneCamel') : null,
  };
}

export const DESERT_SOLVERS = {
  dUnit, dUnitCmp, dProtr, dGuess, dTri, dIso, dPara, dTriArea, dParaBase, dTrap, dPi3, dCirc, dCircArea, dCircBack,
  dVol, dSurf, dMapRead, dMapFind, dMapMove, dMapRect, dMean, dMeanMiss, dMedian, dMode, dFenceMost, dFenceSq, dFenceCmp,
  dFar, dTime, dPrice, dMeet,
};
