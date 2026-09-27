// Pyramid Desert (world 4): units, the protractor, angles in a triangle, areas of parallelograms,
// triangles, trapezoids and circles, volume, coordinates, mean and median, fence puzzles and travel stories.
import { R, pick, chance, shuffle, numQ, cmpQ } from './skills.js';

const INK = '#1e2650', SAND = '#f3d58f', SANDD = '#d9a33a', SKY = '#3e9be0', RED = '#ef5b52', GREEN = '#2fb383';
const svg = (w, h, body, size = '') => `<svg class="shape" viewBox="0 0 ${w} ${h}" ${size || `width="${w}" height="${h}"`}>${body}</svg>`;
const txt = (x, y, t, s = 14, extra = '') => `<text x="${x}" y="${y}" font-size="${s}" font-weight="800" fill="${INK}" text-anchor="middle" dominant-baseline="central" ${extra}>${t}</text>`;
const f1 = v => +v.toFixed(1);

// Bubbles with text values (units, coordinates, decimals): the answer plus up to three different wrong ones.
function textQ(eq, ans, wrongs, extra = {}) {
  const vals = [String(ans)];
  for (const w of shuffle(wrongs.map(String))) if (vals.length < 4 && !vals.includes(w)) vals.push(w);
  return { eq, answer: String(ans), input: 'choice', layout: 'grid', visual: null, show: false, ...extra,
    choices: shuffle(vals).map(v => ({ value: v, html: v })) };
}

// ---------- 1. Measuring camp: units ----------
const UNITS = [
  // [big, small, how many small in one big, icon]
  ['m', 'cm', 100, '📏'], ['cm', 'mm', 10, '📏'], ['km', 'm', 1000, '🐫'], ['kg', 'g', 1000, '⚖️'], ['l', 'ml', 1000, '🥛'],
];
function genUnits(lvl) {
  const kind = pick([['down', 'down', 'up'], ['down', 'up', 'mixed', 'cmp'], ['mixed', 'half', 'cmp', 'up']][lvl]);
  const [big, small, k, icon] = pick(lvl ? UNITS : UNITS.slice(0, 2).concat([UNITS[3]]));
  if (kind === 'down') {
    const n = R(2, lvl ? 9 : 5), ans = n * k;
    return numQ(`${icon} ${n} ${big} = ? ${small}`, ans, [n * 10, n * 100, n * 1000, n + k, ans * 10].filter(v => v !== ans), { layout: ans > 999 ? 'grid' : undefined, units: true });
  }
  if (kind === 'up') {
    const n = R(2, 9), v = n * k;
    return numQ(`${icon} ${v} ${small} = ? ${big}`, n, [n * 10, v / 10, n + 1, v / 100].filter(x => Number.isInteger(x) && x > 0 && x !== n), { units: true });
  }
  if (kind === 'mixed') {
    // 2 m 35 cm = 235 cm, 1 kg 250 g = 1250 g
    const n = R(1, 4), part = k === 10 ? R(1, 9) : k === 100 ? R(5, 95) : 50 * R(1, 19), ans = n * k + part;
    return numQ(`${n} ${big} ${part} ${small} = ? ${small}`, ans, [n + part, n * 10 + part, n * 100 + part, n * 1000 + part, ans + k].filter(v => v !== ans && v > 0), { layout: 'grid', units: true });
  }
  if (kind === 'half') {
    // Half, a quarter or three quarters of a big unit
    const [nm, dn, sym] = pick([[1, 2, '½'], [1, 4, '¼'], [3, 4, '¾']]);
    if ((k * nm) % dn) return genUnits(lvl);
    const ans = (k * nm) / dn;
    return numQ(`${icon} ${sym} ${big} = ? ${small}`, ans, [k / 2, k / 4, k * 3 / 4, 12, 25, 50, 75, 5].filter(v => Number.isInteger(v) && v !== ans), { layout: ans > 999 ? 'grid' : 'grid', units: true });
  }
  // Compare amounts written in two units: 1 m 5 cm ◯ 150 cm
  const a = R(1, 3), p = k === 10 ? R(1, 9) : k === 100 ? R(1, 9) * pick([1, 10]) : R(1, 9) * pick([10, 100]);
  const left = a * k + p;
  const right = chance(0.25) ? left : left + pick([-1, 1]) * pick([k === 10 ? 1 : 5, k === 10 ? 3 : 40, k === 10 ? 5 : 90]);
  if (right <= 0) return genUnits(lvl);
  return cmpQ(`${a} ${big} ${p} ${small}`, `${right} ${small}`, left, right);
}

// ---------- 2. Protractor ----------
function protractor(deg, { size = 250, label = true } = {}) {
  const cx = 130, cy = 120, r = 104;
  const pt = (a, rr) => [cx + rr * Math.cos((a * Math.PI) / 180), cy - rr * Math.sin((a * Math.PI) / 180)];
  let body = `<path d="M${cx - r} ${cy} A${r} ${r} 0 0 1 ${cx + r} ${cy} Z" fill="#fff8e0" stroke="${INK}" stroke-width="3"/>`;
  for (let a = 0; a <= 180; a += 5) {
    const [x1, y1] = pt(a, r), [x2, y2] = pt(a, r - (a % 30 === 0 ? 16 : a % 10 === 0 ? 11 : 6));
    body += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${INK}" stroke-width="${a % 10 ? 1 : 2}"/>`;
    if (a % 30 === 0) { const [tx, ty] = pt(a, r - 28); body += txt(tx.toFixed(1), ty.toFixed(1), a, 14); }
  }
  const [ax, ay] = pt(deg, r + 12);
  body += `<line x1="${cx}" y1="${cy}" x2="${cx + r + 12}" y2="${cy}" stroke="${RED}" stroke-width="5" stroke-linecap="round"/>`;
  body += `<line x1="${cx}" y1="${cy}" x2="${ax.toFixed(1)}" y2="${ay.toFixed(1)}" stroke="${RED}" stroke-width="5" stroke-linecap="round"/>`;
  const [a1x, a1y] = pt(0, 24), [a2x, a2y] = pt(deg, 24);
  body += `<path d="M${a1x} ${a1y} A24 24 0 0 0 ${a2x.toFixed(1)} ${a2y.toFixed(1)}" fill="none" stroke="${SKY}" stroke-width="3"/><circle cx="${cx}" cy="${cy}" r="4" fill="${INK}"/>`;
  return svg(260, 132, body, `width="${size}" height="${Math.round(size * 132 / 260)}"`);
}
// An angle with no protractor, for guessing.
function bareAngle(deg, rot) {
  const cx = 70, cy = 70, r = 60;
  const e = a => [cx + r * Math.cos(((a + rot) * Math.PI) / 180), cy - r * Math.sin(((a + rot) * Math.PI) / 180)];
  const [x1, y1] = e(0), [x2, y2] = e(deg);
  return svg(140, 140, `<line x1="${cx}" y1="${cy}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="${RED}" stroke-width="6" stroke-linecap="round"/><line x1="${cx}" y1="${cy}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${RED}" stroke-width="6" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="5" fill="${INK}"/>`);
}
function genProtractor(lvl) {
  if (chance([0.25, 0.3, 0.4][lvl])) {
    // Guess without the protractor: which is closest?
    const d = pick([20, 45, 70, 100, 120, 135, 150, 160]);
    const opts = shuffle([30, 60, 90, 120, 150, 180].filter(x => Math.abs(x - d) >= 25)).slice(0, 3);
    const ans = [30, 60, 90, 120, 150].reduce((b, x) => (Math.abs(x - d) < Math.abs(b - d) ? x : b), 30);
    if (opts.includes(ans) || Math.abs(ans - d) > 12) return genProtractor(lvl);
    return textQ(`≈ ?°`, `${ans}°`, opts.map(x => `${x}°`), { visual: bareAngle(d, R(0, 60)), show: true, guess: true });
  }
  const step = lvl === 0 ? 10 : 5;
  const deg = step * R(Math.ceil(15 / step), Math.floor(170 / step));
  if (deg === 90 && chance(0.6)) return genProtractor(lvl);
  const near = [180 - deg, deg + 10, deg - 10, deg + 5, deg - 5].filter(v => v > 0 && v < 180 && v !== deg);
  return numQ('?°', deg, near, { visual: protractor(deg), show: true, layout: 'grid' });
}

// ---------- 3. Corners of a triangle ----------
function triangle(A, B, labels, size = 220, equal = false) {
  // Base on the bottom, angles A (left) and B (right) in degrees.
  const base = 200, rad = d => (d * Math.PI) / 180, C = 180 - A - B;
  const side = (base * Math.sin(rad(B))) / Math.sin(rad(C));
  let px = side * Math.cos(rad(A)), py = side * Math.sin(rad(A));
  const h = Math.max(py, 1), scale = Math.min(1, 150 / h);
  const pts = [[0, 0], [base, 0], [px, py]].map(([x, y]) => [x * scale, y * scale]);
  const minx = Math.min(...pts.map(p => p[0])), maxx = Math.max(...pts.map(p => p[0]));
  const W = maxx - minx + 60, H = h * scale + 60;
  const P = pts.map(([x, y]) => [x - minx + 30, H - 30 - y]);
  const cen = [(P[0][0] + P[1][0] + P[2][0]) / 3, (P[0][1] + P[1][1] + P[2][1]) / 3];
  let body = `<polygon points="${P.map(p => p.map(v => v.toFixed(1)).join(',')).join(' ')}" fill="${SAND}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>`;
  if (equal) {
    // Matching red arcs mark the two equal corners.
    for (const [i, j, k] of [[0, 1, 2], [1, 0, 2]]) {
      const a1 = Math.atan2(P[j][1] - P[i][1], P[j][0] - P[i][0]), a2 = Math.atan2(P[k][1] - P[i][1], P[k][0] - P[i][0]);
      for (const r of [16, 22]) {
        const e = a => `${(P[i][0] + r * Math.cos(a)).toFixed(1)} ${(P[i][1] + r * Math.sin(a)).toFixed(1)}`;
        const sweep = ((a2 - a1 + 2 * Math.PI) % (2 * Math.PI)) < Math.PI ? 1 : 0;
        body += `<path d="M${e(a1)} A${r} ${r} 0 0 ${sweep} ${e(a2)}" fill="none" stroke="${RED}" stroke-width="2.5"/>`;
      }
    }
  }
  P.forEach((p, i) => {
    const t = labels[i];
    if (t === null || t === '=') return;
    const lx = p[0] + (cen[0] - p[0]) * 0.36, ly = p[1] + (cen[1] - p[1]) * 0.36;
    body += t === '?' ? `<circle cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="13" fill="#fff4cc" stroke="#d99a00" stroke-width="2.5" stroke-dasharray="4 3"/>${txt(lx.toFixed(1), ly.toFixed(1), '?', 15, 'fill="#d99a00"')}`
      : txt(lx.toFixed(1), ly.toFixed(1), t, 16);
  });
  const w = Math.min(size, W * 1.2);
  return svg(W.toFixed(0), H.toFixed(0), body, `width="${w.toFixed(0)}" height="${(w * H / W).toFixed(0)}"`);
}
function genTriangle(lvl) {
  const kind = pick([['two', 'two', 'right'], ['two', 'right', 'iso', 'line'], ['iso', 'isoTop', 'line', 'two']][lvl]);
  if (kind === 'two' || kind === 'right') {
    const A = kind === 'right' ? 90 : (lvl ? 5 : 10) * R(3, lvl ? 22 : 11), B = (lvl ? 5 : 10) * R(2, Math.floor((175 - A) / (lvl ? 5 : 10)));
    const C = 180 - A - B;
    if (C < 20 || B < 20 || A < 20) return genTriangle(lvl);
    const lab = a => (a === 90 ? '90°' : `${a}°`);
    const order = shuffle([0, 1, 2]), angs = [A, B, C], hide = order[0];
    const labels = angs.map((a, i) => (i === hide ? '?' : lab(a)));
    const shown = angs.filter((_, i) => i !== hide);
    return numQ('?°', angs[hide], [180 - shown[0], 180 - shown[1], 360 - shown[0] - shown[1], angs[hide] + 10, 90].filter(v => v > 0 && v !== angs[hide]),
      { visual: triangle(A, B, labels), show: true, tri: true });
  }
  if (kind === 'iso' || kind === 'isoTop') {
    // Two equal corners at the bottom.
    const base = 5 * R(5, 16), top = 180 - 2 * base;
    if (kind === 'iso') return numQ('?°', base, [top, 180 - top, base + 10, 90 - base / 2 | 0].filter(v => v > 0 && v !== base), { visual: triangle(base, base, ['?', '=', `${top}°`], 220, true), show: true, iso: true });
    return numQ('?°', top, [base, 180 - base, 90 - base, top + 10].filter(v => v > 0 && v !== top), { visual: triangle(base, base, [`${base}°`, '=', '?'], 220, true), show: true, iso: true });
  }
  // Angles on a straight line add up to 180°.
  const a = 5 * R(4, 32);
  const r = 70, rad = (a * Math.PI) / 180, qr = Math.min(95, Math.max(40, 17 / Math.sin((Math.PI - rad) / 2)));
  const body = `<line x1="4" y1="80" x2="236" y2="80" stroke="${INK}" stroke-width="4"/><line x1="120" y1="80" x2="${(120 + r * Math.cos(rad)).toFixed(1)}" y2="${(80 - r * Math.sin(rad)).toFixed(1)}" stroke="${INK}" stroke-width="4"/>`
    + txt((120 + 44 * Math.cos(rad / 2)).toFixed(1), (80 - 44 * Math.sin(rad / 2)).toFixed(1), `${a}°`, 15)
    + `<circle cx="${(120 + qr * Math.cos((rad + Math.PI) / 2)).toFixed(1)}" cy="${(80 - qr * Math.sin((rad + Math.PI) / 2)).toFixed(1)}" r="13" fill="#fff4cc" stroke="#d99a00" stroke-width="2.5" stroke-dasharray="4 3"/>`
    + txt((120 + qr * Math.cos((rad + Math.PI) / 2)).toFixed(1), (80 - qr * Math.sin((rad + Math.PI) / 2)).toFixed(1), '?', 15, 'fill="#d99a00"');
  return numQ('?°', 180 - a, [a, 360 - a, 90 - a, 190 - a].filter(v => v > 0 && v !== 180 - a), { visual: svg(240, 96, body), show: true, line: true });
}

// ---------- 4 and 5. Areas: parallelogram, triangle, trapezoid ----------
function shapeOnGrid(pts, { h = null, b = null, u = 22, fill = SAND, labels = [] } = {}) {
  const W = Math.max(...pts.map(p => p[0])), H = Math.max(...pts.map(p => p[1]));
  const ox = 18, oy = 18, w = W * u + 36, hh = H * u + 36;
  let body = '';
  for (let x = 0; x <= W; x++) body += `<line x1="${ox + x * u}" y1="${oy}" x2="${ox + x * u}" y2="${oy + H * u}" stroke="#e3dcc6" stroke-width="1"/>`;
  for (let y = 0; y <= H; y++) body += `<line x1="${ox}" y1="${oy + y * u}" x2="${ox + W * u}" y2="${oy + y * u}" stroke="#e3dcc6" stroke-width="1"/>`;
  body += `<polygon points="${pts.map(([x, y]) => `${ox + x * u},${oy + (H - y) * u}`).join(' ')}" fill="${fill}" fill-opacity=".85" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
  if (h) body += `<line x1="${ox + h[0] * u}" y1="${oy + H * u}" x2="${ox + h[0] * u}" y2="${oy + (H - h[1]) * u}" stroke="${RED}" stroke-width="3" stroke-dasharray="6 4"/>`;
  for (const [x, y, t, c] of labels) body += txt(ox + x * u, oy + (H - y) * u, t, 17, `fill="${c || INK}" paint-order="stroke" stroke="#fff" stroke-width="4"`);
  const scale = Math.min(1.5, 270 / w, 170 / hh);
  return svg(w, hh, body, `width="${Math.round(w * scale)}" height="${Math.round(hh * scale)}"`);
}
function genArea(lvl) {
  const kind = pick([['para', 'para', 'rtri'], ['para', 'tri', 'rtri', 'tri'], ['tri', 'para', 'side', 'tri']][lvl]);
  const b = R(3, lvl ? 9 : 6), h = R(2, lvl ? 6 : 4), s = R(1, 3);
  if (kind === 'para') {
    const pts = [[0, 0], [b, 0], [b + s, h], [s, h]];
    const slant = Math.round(Math.hypot(s, h) * 10) / 10;
    return numQ('▱ = ?', b * h, [2 * (b + h), b * h / 2 | 0, (b + s) * h, b * h + h, b + h].filter(v => v > 0 && v !== b * h),
      { visual: shapeOnGrid(pts, { h: [s, h], labels: [[b / 2, -0.45, b], [s + 0.45, h / 2, h, RED]] }), show: true, shape: 'para', slant });
  }
  if (kind === 'rtri' || kind === 'tri') {
    if ((b * h) % 2) return genArea(lvl);
    const top = kind === 'rtri' ? 0 : R(1, b - 1);
    const pts = [[0, 0], [b, 0], [top, h]];
    return numQ('◺ = ?', (b * h) / 2, [b * h, b + h, (b * h) / 2 + b, 2 * (b + h)].filter(v => v !== (b * h) / 2),
      { visual: shapeOnGrid(pts, { h: [top, h], labels: [[b / 2, -0.45, b], [top + (top < b / 2 ? 0.45 : -0.45), h / 2, h, RED]] }), show: true, shape: 'tri' });
  }
  // Area known, find the base: a parallelogram of area 24 and height 4.
  const area = b * h;
  return numQ(`▱ = ${area}`, b, [area - h, h, b + 1, area / 2 | 0].filter(v => v > 0 && v !== b),
    { visual: shapeOnGrid([[0, 0], [b, 0], [b + s, h], [s, h]], { h: [s, h], labels: [[b / 2, -0.45, '?', '#d99a00'], [s + 0.45, h / 2, h, RED]] }), show: true, shape: 'side' });
}
function genTrap(lvl) {
  for (;;) {
    const a = R(2, lvl ? 8 : 5), b = a + R(1, lvl ? 6 : 4), h = R(2, lvl ? 6 : 4), s = R(0, b - a);
    if (((a + b) * h) % 2) continue;
    const area = ((a + b) * h) / 2;
    const pts = [[0, 0], [b, 0], [s + a, h], [s, h]];
    return numQ('⏢ = ?', area, [(a + b) * h, a * h, b * h, a + b + h, area + h].filter(v => v !== area),
      { visual: shapeOnGrid(pts, { h: [s, h], labels: [[s + a / 2, h + 0.45, a], [b / 2, -0.45, b], [s + 0.45, h / 2, h, RED]] }), show: true });
  }
}

// ---------- 6. Rolling wheel: π, circumference and area ----------
function wheel(d, { area = false } = {}) {
  const R0 = 46;
  let body = `<circle cx="60" cy="60" r="${R0}" fill="${area ? SAND : '#fff'}" stroke="${INK}" stroke-width="4"/>`;
  if (!area) for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4; body += `<line x1="60" y1="60" x2="${(60 + R0 * Math.cos(a)).toFixed(1)}" y2="${(60 + R0 * Math.sin(a)).toFixed(1)}" stroke="${INK}" stroke-width="2"/>`; }
  body += area ? `<line x1="60" y1="60" x2="${60 + R0}" y2="60" stroke="${RED}" stroke-width="4"/>${txt(60 + R0 / 2, 46, d, 18, `fill="${RED}" paint-order="stroke" stroke="#fff" stroke-width="5"`)}`
    : `<line x1="${60 - R0}" y1="60" x2="${60 + R0}" y2="60" stroke="${RED}" stroke-width="4"/>${txt(60, 44, d, 18, `fill="${RED}" paint-order="stroke" stroke="#fff" stroke-width="5"`)}`;
  return svg(120, 120, body, 'width="120" height="120"');
}
// One turn: the red rim unrolls flat along the ground, from where the wheel starts to where it stops.
const slotC = (x, y) => `<circle cx="${x}" cy="${y}" r="13" fill="#fff4cc" stroke="#d99a00" stroke-width="2.5" stroke-dasharray="4 3"/>${txt(x, y, '?', 15, 'fill="#d99a00"')}`;
function roll(d, c) {
  const r = 32, x0 = 38, cy = 58, g = cy + r, x1 = x0 + Math.PI * 2 * r;
  let body = `<line x1="4" y1="${g}" x2="276" y2="${g}" stroke="#c9c2b0" stroke-width="3"/>`;
  body += `<circle cx="${x1.toFixed(1)}" cy="${cy}" r="${r}" fill="none" stroke="${INK}" stroke-width="2" stroke-dasharray="5 4" opacity=".45"/>`;
  body += `<line x1="${x0}" y1="${g}" x2="${x1.toFixed(1)}" y2="${g}" stroke="${RED}" stroke-width="7" stroke-linecap="round"/>`;
  body += `<circle cx="${x0}" cy="${cy}" r="${r}" fill="#fff" stroke="${RED}" stroke-width="7"/><circle cx="${x0}" cy="${cy}" r="4" fill="${INK}"/>`;
  body += `<line x1="${x0 - r + 5}" y1="${cy}" x2="${x0 + r - 5}" y2="${cy}" stroke="${SKY}" stroke-width="4"/>`;
  body += d === '?' ? slotC(x0, cy - 14) : txt(x0, cy - 14, d, 17, `fill="${SKY}" paint-order="stroke" stroke="#fff" stroke-width="5"`);
  body += `<path d="M${x0 + 14} ${cy - r - 6} Q${(x0 + x1) / 2} ${cy - r - 20} ${(x1 - 14).toFixed(1)} ${cy - r - 6}" fill="none" stroke="${INK}" stroke-width="2.5" stroke-dasharray="6 4"/><path d="M${(x1 - 22).toFixed(1)} ${cy - r - 12} l9 6 -9 5" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>`;
  const mx = ((x0 + x1) / 2).toFixed(1);
  body += `<path d="M${x0} ${g + 12} v8 H${x1.toFixed(1)} v-8" fill="none" stroke="${RED}" stroke-width="2.5"/>`;
  body += c === '?' ? slotC(mx, g + 34) : txt(mx, g + 34, '≈ ' + c, 18, `fill="${RED}"`);
  return `<div class="rollpic">${svg(280, g + 50, body, 'width="280" height="' + (g + 50) + '"')}</div>`;
}
// The track one turn covers, marked off in wheel widths: three and a bit.
function rollWidths() {
  const u = 58;
  let body = `<circle cx="22" cy="22" r="18" fill="#fff" stroke="${INK}" stroke-width="3"/><line x1="4" y1="22" x2="40" y2="22" stroke="${SKY}" stroke-width="3"/>`;
  body += `<line x1="4" y1="56" x2="${4 + 3.14 * u}" y2="56" stroke="${INK}" stroke-width="4"/>`;
  for (let i = 0; i < 3; i++) body += `<line x1="${4 + i * u + 2}" y1="66" x2="${4 + (i + 1) * u - 2}" y2="66" stroke="${SKY}" stroke-width="4"/>`;
  for (let i = 0; i <= 3; i++) body += `<line x1="${4 + i * u}" y1="48" x2="${4 + i * u}" y2="64" stroke="${INK}" stroke-width="2"/>`;
  body += `<line x1="${4 + 3.14 * u}" y1="44" x2="${4 + 3.14 * u}" y2="64" stroke="${INK}" stroke-width="3"/>`;
  return svg(200, 76, body);
}
function genCircle(lvl) {
  const kind = pick([['times', 'around', 'around'], ['around', 'around', 'area', 'back'], ['around', 'area', 'area', 'back']][lvl]);
  if (kind === 'times') {
    // One turn of the wheel goes a bit more than 3 of its widths.
    return textQ('🛞 ➜ ? ×', '≈ 3', ['≈ 2', '≈ 4', '≈ 6', '≈ 1'], { visual: rollWidths(), show: false, pi3: true });
  }
  if (kind === 'around') {
    const d = lvl === 0 ? R(1, 10) : lvl === 1 ? R(2, 20) : pick([R(6, 30), 40, 50, 100]);
    const c = f1(3.14 * d);
    return textQ('🛞 ➜ ≈ ?', String(c), [String(d), String(2 * d), String(f1(3.14 * d * d)), String(f1(3.14 * d / 2)), String(4 * d)], { visual: roll(d, '?'), show: true, around: true });
  }
  if (kind === 'area') {
    const r = lvl < 2 ? R(1, 10) : R(2, 12);
    const a = f1(3.14 * r * r);
    return textQ('● ≈ ?', String(a), [String(f1(3.14 * 2 * r)), String(f1(3.14 * r)), String(r * r), String(f1(3.14 * 4 * r * r))], { visual: wheel(r, { area: true }), show: true, carea: true });
  }
  // The wheel went about 31.4 in one turn: how wide is it?
  const d = pick([2, 3, 4, 5, 6, 8, 10, 20, 50]);
  return textQ(`🛞 ➜ ≈ ${f1(3.14 * d)}`, String(d), [String(f1(d / 2)), String(2 * d), String(3 * d), String(d * d)], { visual: roll('?', f1(3.14 * d)), show: true, back: true });
}

// ---------- 7. Pyramid builder: volume and surface ----------
export function cuboid(l, w, h, size = 190) {
  // Isometric stack of unit cubes, l along x, w along depth, h up.
  const u = Math.min(22, Math.floor(150 / (l + w * 0.6 + 1)), Math.floor(130 / (h + w * 0.5 + 1)));
  const dx = u * 0.6, dy = u * 0.5;
  const W = l * u + w * dx + 8, H = h * u + w * dy + 8;
  let body = '';
  const face = (x, y, pts, fill) => `<polygon points="${pts.map(([a, b]) => `${(x + a).toFixed(1)},${(y + b).toFixed(1)}`).join(' ')}" fill="${fill}" stroke="${INK}" stroke-width="1.3"/>`;
  for (let z = w - 1; z >= 0; z--) for (let y = 0; y < h; y++) for (let x = 0; x < l; x++) {
    const bx = 4 + x * u + z * dx, by = H - 4 - (y + 1) * u - z * dy;
    if (z === 0) body += face(bx, by, [[0, 0], [u, 0], [u, u], [0, u]], '#f6c35e');
    if (y === h - 1) body += face(bx, by, [[0, 0], [dx, -dy], [u + dx, -dy], [u, 0]], '#fbe3a5');
    if (x === l - 1) body += face(bx, by, [[u, 0], [u + dx, -dy], [u + dx, u - dy], [u, u]], '#d99a3a');
  }
  const s = Math.min(1, size / W);
  return svg(W.toFixed(0), H.toFixed(0), body, `width="${(W * s).toFixed(0)}" height="${(H * s).toFixed(0)}"`);
}
function genVolume(lvl) {
  const kind = pick([['count', 'count', 'layer'], ['count', 'layer', 'formula', 'missing'], ['formula', 'missing', 'surface', 'surface']][lvl]);
  const l = R(2, lvl ? 5 : 4), w = R(1, lvl ? 4 : 3), h = R(1, lvl ? 4 : 3), v = l * w * h;
  if (kind === 'count') return numQ('🧊 = ?', v, [l * h, l * w + h, v + l, l + w + h, 2 * v].filter(x => x !== v), { visual: cuboid(l, w, h), show: true, vol: true });
  if (kind === 'layer') {
    // One layer is shown with its cube count; how many in the whole stack?
    return numQ(`${l * w}🧊 × ${h} = ?`, v, [l * w + h, v + h, l * w * (h + 1), v - l].filter(x => x > 0 && x !== v), { visual: cuboid(l, w, h), show: true, vol: true });
  }
  if (kind === 'formula') return numQ(`${l} × ${w} × ${h} = ?`, v, [l + w + h, l * w + h, v + l * w, 2 * (l * w + w * h + l * h)].filter(x => x !== v), { visual: cuboid(l, w, h), show: false, vol: true });
  if (kind === 'missing') return numQ(`🧊 ${v} = ${l} × ${w} × ?`, h, [h + 1, v - l * w, l * w, h + 2].filter(x => x > 0 && x !== h), { visual: cuboid(l, w, h), show: false, vol: true });
  const sa = 2 * (l * w + w * h + l * h);
  if (sa > 150) return genVolume(lvl);
  return numQ('🎨 = ?', sa, [v, l * w + w * h + l * h, sa + 2, 6 * l * w].filter(x => x !== sa), { visual: cuboid(l, w, h), show: true, surface: true });
}

// ---------- 8. Treasure map: coordinates ----------
const THINGS = ['💎', '🐫', '🌴', '🏺', '🦂', '⛺', '🐍', '🗝️'];
function mapGrid(n, marks, { size = 210, route = null } = {}) {
  const u = Math.floor(200 / n), o = 26, T = 14, W = n * u + o + 14;
  let body = '';
  for (let i = 0; i <= n; i++) {
    body += `<line x1="${o + i * u}" y1="${T}" x2="${o + i * u}" y2="${T + n * u}" stroke="#e0cf9c" stroke-width="${i ? 1 : 3}" ${i ? '' : `stroke="${INK}"`}/>`;
    body += `<line x1="${o}" y1="${T + i * u}" x2="${o + n * u}" y2="${T + i * u}" stroke="#e0cf9c" stroke-width="1"/>`;
    body += txt(o + i * u, T + n * u + 12, i, 13) + txt(o - 12, T + (n - i) * u, i, 13);
  }
  body += `<line x1="${o}" y1="${T + n * u}" x2="${o + n * u}" y2="${T + n * u}" stroke="${INK}" stroke-width="3"/><line x1="${o}" y1="${T}" x2="${o}" y2="${T + n * u}" stroke="${INK}" stroke-width="3"/>`;
  if (route) body += `<polyline points="${route.map(([x, y]) => `${o + x * u},${T + (n - y) * u}`).join(' ')}" fill="none" stroke="${RED}" stroke-width="3" stroke-dasharray="6 4"/>`;
  for (const [x, y, t] of marks) body += `<text x="${o + x * u}" y="${T + (n - y) * u}" font-size="${Math.min(20, u)}" text-anchor="middle" dominant-baseline="central">${t}</text>`;
  const H = n * u + T + 22;
  return svg(W, H, `<rect x="${o}" y="${T}" width="${n * u}" height="${n * u}" fill="#fbf1d2"/>` + body, `width="${Math.min(size, W)}" height="${Math.round(Math.min(size, W) * H / W)}"`);
}
function genCoords(lvl) {
  const n = lvl ? 8 : 6;
  const kind = pick([['read', 'find'], ['read', 'find', 'find', 'rect'], ['rect', 'move', 'read', 'find']][lvl]);
  const pts = [];
  while (pts.length < 4) { const p = [R(1, n), R(1, n)]; if (!pts.some(q => q[0] === p[0] && q[1] === p[1]) && (p[0] || p[1])) pts.push(p); }
  const things = shuffle(THINGS.slice()).slice(0, 4);
  if (kind === 'read') {
    const [x, y] = pts[0];
    if (x === y) return genCoords(lvl);
    const wrong = [`(${y}, ${x})`, `(${x}, ${Math.max(0, y - 1)})`, `(${x + 1}, ${y})`, `(${x}, ${y + 1})`];
    return textQ(`${things[0]} = ?`, `(${x}, ${y})`, wrong, { visual: mapGrid(n, [[x, y, things[0]]]), show: true, read: true });
  }
  if (kind === 'find') {
    // Which thing is at (x, y)? The swapped point holds a decoy.
    let [x, y] = pts[0];
    if (x === y) return genCoords(lvl);
    const marks = pts.map((p, i) => [p[0], p[1], things[i]]);
    if (!pts.some(p => p[0] === y && p[1] === x)) marks[1] = [y, x, things[1]];
    const choices = shuffle(things.map(t => ({ value: t, html: t })));
    return { eq: `(${x}, ${y}) = ?`, answer: things[0], input: 'choice', layout: 'row', visual: mapGrid(n, marks), show: true, choices, find: true };
  }
  if (kind === 'move') {
    // Walk from the camel: 3 right and 2 up. Where do you end?
    const [x, y] = [R(0, n - 3), R(0, n - 3)], dx = R(1, 3), dy = R(1, 3);
    return textQ(`🐫 ➜ ${dx} ➡️ ${dy} ⬆️ = ?`, `(${x + dx}, ${y + dy})`, [`(${x + dy}, ${y + dx})`, `(${x + dx}, ${y - dy < 0 ? y + dy + 1 : y - dy})`, `(${dx}, ${dy})`, `(${x + dx + 1}, ${y + dy})`],
      { visual: mapGrid(n, [[x, y, '🐫']]), show: true, move: true });
  }
  // Three corners of a rectangle; where is the fourth?
  const x1 = R(1, n - 3), y1 = R(1, n - 3), x2 = x1 + R(2, n - x1), y2 = y1 + R(2, n - y1);
  const ring = [[x1, y1], [x2, y1], [x2, y2], [x1, y2]], m = R(0, 3);
  const [mx, my] = ring[m];
  const corners = [ring[(m + 1) % 4], ring[(m + 2) % 4], ring[(m + 3) % 4]];
  return textQ('🌴🌴🌴 ▭ ➜ ?', `(${mx}, ${my})`, [`(${my}, ${mx})`, `(${mx + 1}, ${my})`, `(${mx}, ${my + 1})`, `(${x2 - x1}, ${y2 - y1})`],
    { visual: mapGrid(n, corners.map(([x, y]) => [x, y, '🌴']), { route: corners }), show: true, rect: true });
}

// Uneven towers made level: the mean. The middle of a row: the median.
const LEVEL = '<span class="lvlicon"><i style="height:1em"></i><i style="height:.35em"></i><i style="height:.65em"></i><b>➜</b><i style="height:.65em"></i><i style="height:.65em"></i><i style="height:.65em"></i></span>';
const MIDDLE = '<span class="midicon"><i></i><i></i>?<i></i><i></i></span>';
// Number cards in a row, one may be a '?'.
const cards = vals => `<div class="numcards">${vals.map(v => (v === '?' ? '<b><span class="slot">?</span></b>' : `<b>${v}</b>`)).join('')}</div>`;

// ---------- 9. Level the towers: the mean ----------
function towers(hs, { color = SANDD, max = Math.max(...hs), mean = null } = {}) {
  const u = Math.min(18, Math.floor(130 / max)), bw = Math.min(34, Math.floor(230 / hs.length) - 8);
  const W = hs.length * (bw + 8) + 10, H = max * u + 12;
  let body = '';
  hs.forEach((h, i) => { for (let k = 0; k < h; k++) body += `<rect x="${6 + i * (bw + 8)}" y="${H - 6 - (k + 1) * u}" width="${bw}" height="${u}" fill="${color}" stroke="${INK}" stroke-width="1.5"/>`; });
  if (mean !== null) body += `<line x1="0" y1="${H - 6 - mean * u}" x2="${W}" y2="${H - 6 - mean * u}" stroke="${RED}" stroke-width="3" stroke-dasharray="6 4"/>`;
  return svg(W, H, body);
}
function genMean(lvl) {
  const kind = pick([['level', 'level', 'level'], ['level', 'nums', 'nums'], ['nums', 'missing', 'missing', 'nums']][lvl]);
  const k = lvl ? R(3, 5) : 3, m = R(2, lvl ? 9 : 5);
  // k numbers around m that add up to k*m
  const hs = Array(k).fill(m);
  for (let t = 0; t < k * 2; t++) { const i = R(0, k - 1), j = R(0, k - 1), d = R(1, 2); if (i !== j && hs[j] - d >= 1 && hs[i] + d <= (lvl ? 12 : 8)) { hs[i] += d; hs[j] -= d; } }
  if (hs.every(h => h === m)) return genMean(lvl);
  const sum = k * m;
  if (kind === 'level') return numQ(`${LEVEL} ?`, m, [m + 1, m - 1, Math.max(...hs), sum].filter(v => v > 0 && v !== m), { visual: towers(hs), show: true, mean: true });
  if (kind === 'nums') return numQ(`${LEVEL} ?`, m, [sum, m + 1, m - 1, [...hs].sort((a, b) => a - b)[k >> 1] === m ? m + 2 : [...hs].sort((a, b) => a - b)[k >> 1]].filter(v => v > 0 && v !== m), { visual: cards(hs), show: true, mean: true, nums: true });
  const miss = R(0, k - 1), shown = hs.map((h, i) => (i === miss ? '?' : h));
  return numQ(`${LEVEL} ${m}`, hs[miss], [m, sum - m, hs[miss] + 1, hs[miss] - 1].filter(v => v > 0 && v !== hs[miss]), { visual: cards(shown), show: true, mean: true, missing: true });
}

// ---------- 10. The middle camel: median and the most common ----------
function dotPlot(vals, lo, hi) {
  const u = Math.floor(230 / (hi - lo + 1));
  const count = {}; vals.forEach(v => (count[v] = (count[v] || 0) + 1));
  const H = Math.max(...Object.values(count)) * 18 + 34, W = (hi - lo + 1) * u + 10;
  let body = `<line x1="4" y1="${H - 24}" x2="${W - 4}" y2="${H - 24}" stroke="${INK}" stroke-width="2.5"/>`;
  for (let v = lo; v <= hi; v++) {
    const x = 5 + (v - lo) * u + u / 2;
    body += txt(x, H - 6, v, 14);
    for (let k = 0; k < (count[v] || 0); k++) body += `<circle cx="${x}" cy="${H - 34 - k * 18}" r="7" fill="${SANDD}" stroke="${INK}" stroke-width="1.5"/>`;
  }
  return svg(W, H, body);
}
// Sign for "which number has the most dots": a tiny plot whose tallest pile wears a crown, with a yellow box under it (no '?' here: the eq turns every '?' into a slot).
const TALLEST = `<svg class="tallest" viewBox="0 0 64 64" width="64" height="64" style="vertical-align:middle">`
  + [[12, 1, '#b9b4a6'], [32, 3, SANDD], [52, 2, '#b9b4a6']].map(([x, n, f]) => Array.from({ length: n }, (_, k) => `<circle cx="${x}" cy="${40 - k * 11}" r="5" fill="${f}" stroke="${INK}" stroke-width="1.5"/>`).join('')).join('')
  + `<path d="M24 12 l2 -9 5 5 3 -6 3 6 5 -5 2 9 z" fill="#ffc53d" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>`
  + `<line x1="2" y1="48" x2="62" y2="48" stroke="${INK}" stroke-width="2.5"/>`
  + `<rect x="25" y="51" width="14" height="12" rx="3" fill="#fff4cc" stroke="#d99a00" stroke-width="2" stroke-dasharray="3 2"/></svg>`;
function genMedian(lvl) {
  const kind = pick([['camels', 'camels', 'nums'], ['nums', 'camels', 'mode', 'even'], ['even', 'mode', 'nums', 'even']][lvl]);
  if (kind === 'camels') {
    const k = pick([3, 5]), hs = new Set();
    while (hs.size < k) hs.add(R(2, 9));
    const arr = [...hs], sorted = [...arr].sort((a, b) => a - b), med = sorted[k >> 1];
    const pics = `<div class="camels">${arr.map(h => `<span class="camel" style="font-size:${14 + h * 4}px">🐪<b>${h}</b></span>`).join('')}</div>`;
    return numQ(MIDDLE, med, [arr[k >> 1], sorted[0], sorted[k - 1], Math.round(arr.reduce((s, v) => s + v, 0) / k)].filter(v => v !== med), { visual: pics, show: true, median: true });
  }
  if (kind === 'nums' || kind === 'even') {
    const k = kind === 'even' ? pick([4, 6]) : pick([5, 7]);
    for (;;) {
      const arr = Array.from({ length: k }, () => R(1, lvl ? 30 : 12));
      const s = [...arr].sort((a, b) => a - b);
      const med = k % 2 ? s[k >> 1] : (s[k / 2 - 1] + s[k / 2]) / 2;
      if (!Number.isInteger(med) || new Set(arr).size < k - 1) continue;
      if (arr[k >> 1] === med) continue;
      return numQ(MIDDLE, med, [arr[k >> 1], s[k >> 1] === med ? s[(k >> 1) - 1] : s[k >> 1], Math.round(arr.reduce((a, b) => a + b, 0) / k), s[k - 1] - s[0]].filter(v => v > 0 && v !== med), { visual: cards(arr), show: true, median: true, even: kind === 'even' });
    }
  }
  // The most common value on a dot plot.
  const lo = R(1, 5), hi = lo + R(5, 7), n = R(8, 12);
  const vals = Array.from({ length: n }, () => R(lo, hi));
  const top = R(lo, hi); vals.push(top, top, top);
  const count = {}; vals.forEach(v => (count[v] = (count[v] || 0) + 1));
  const best = Math.max(...Object.values(count)), modes = Object.keys(count).filter(v => count[v] === best);
  if (modes.length !== 1) return genMedian(lvl);
  const mode = +modes[0];
  return numQ(`${TALLEST} ➜ ?`, mode, [mode + 1, mode - 1, mode + 2, mode - 2, lo, hi].filter(v => v > 0 && v !== mode && v !== best), { visual: dotPlot(vals, lo, hi), show: true, mode: true });
}

// ---------- 11. Same fence, new shape (puzzle stop) ----------
function tilesSvg(cells, size = 120, fill = SAND, unit = 0) {
  const w = Math.max(...cells.map(c => c[0])) + 1, h = Math.max(...cells.map(c => c[1])) + 1;
  const u = unit || Math.min(22, Math.floor(size / Math.max(w, h)));
  const set = new Set(cells.map(c => c.join(',')));
  let body = '', edges = '';
  for (const [x, y] of cells) {
    body += `<rect x="${4 + x * u}" y="${4 + y * u}" width="${u}" height="${u}" fill="${fill}" stroke="#fff" stroke-width="1.5"/>`;
    const X = 4 + x * u, Y = 4 + y * u;
    if (!set.has(`${x},${y - 1}`)) edges += `M${X} ${Y}h${u}`;
    if (!set.has(`${x},${y + 1}`)) edges += `M${X} ${Y + u}h${u}`;
    if (!set.has(`${x - 1},${y}`)) edges += `M${X} ${Y}v${u}`;
    if (!set.has(`${x + 1},${y}`)) edges += `M${X + u} ${Y}v${u}`;
  }
  body += `<path d="${edges}" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
  return svg(w * u + 8, h * u + 8, body);
}
const rectCells = (w, h) => { const c = []; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) c.push([x, y]); return c; };
function perimeterOf(cells) {
  const set = new Set(cells.map(c => c.join(',')));
  let p = 0;
  for (const [x, y] of cells) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!set.has(`${x + dx},${y + dy}`)) p++;
  return p;
}
function genFence(lvl) {
  const kind = pick(['most', 'most', 'lshape', 'square', 'same']);
  if (kind === 'most') {
    // Every pen uses the same fence; which gives the camels the most room?
    const P = pick([16, 18, 20]), half = P / 2;
    const rects = [];
    for (let w = 1; w <= half / 2; w++) rects.push([half - w, w]);
    const pickR = shuffle(rects.slice()).slice(0, 4);
    const best = pickR.reduce((b, r) => (r[0] * r[1] > b[0] * b[1] ? r : b));
    const u = Math.floor(100 / Math.max(...pickR.map(r => r[0])));
    const choices = shuffle(pickR.map(([w, h]) => ({ value: `${w}x${h}`, html: tilesSvg(rectCells(w, h), 96, SAND, u) })));
    return { eq: `🧱 ${P} ➜ 🐫🐫🐫 ?`, answer: `${best[0]}x${best[1]}`, input: 'choice', layout: 'grid', choices, visual: null, show: false, most: true };
  }
  if (kind === 'lshape') {
    const w = R(3, 5), h = R(3, 5), cw = R(1, w - 1), ch = R(1, h - 1);
    const cells = rectCells(w, h).filter(([x, y]) => !(x >= w - cw && y < ch));
    const p = perimeterOf(cells);
    return numQ('🧱 = ?', p, [cells.length, p - 2, p + 2, 2 * (w + h) + 2].filter(v => v !== p), { visual: tilesSvg(cells, 140), show: true, lshape: true });
  }
  if (kind === 'square') {
    // A square pen with this much fence: how much room inside?
    const s = R(2, 9), P = 4 * s;
    const pen = svg(150, 150, `<rect x="25" y="25" width="100" height="100" fill="${SAND}" stroke="${SANDD}" stroke-width="8" stroke-dasharray="10 5"/>${txt(75, 12, `🧱 ${P}`, 16)}<circle cx="75" cy="75" r="18" fill="#fff4cc" stroke="#d99a00" stroke-width="3" stroke-dasharray="5 4"/>${txt(75, 75, '?', 20, 'fill="#d99a00"')}`);
    return numQ('🟨 = ?', s * s, [P, s, P / 2, s * s + s].filter(v => v !== s * s), { visual: pen, show: true, square: true });
  }
  // Two different rectangles with the same room: which fence is longer?
  const A = pick([12, 16, 18, 24, 36]);
  const ps = []; for (let w = 1; w * w <= A; w++) if (A % w === 0 && A / w <= 12) ps.push([A / w, w]);
  if (ps.length < 2) return genFence(lvl);
  const [a, b] = shuffle(ps).slice(0, 2);
  const u = Math.floor(110 / Math.max(a[0], b[0]));
  const pa = 2 * (a[0] + a[1]), pb = 2 * (b[0] + b[1]);
  const q = cmpQ('🧱', '🧱', pa, pb, `<div class="pairvis">${tilesSvg(rectCells(...a), 100, SAND, u)}<b class="op"></b>${tilesSvg(rectCells(...b), 100, SAND, u)}</div>`);
  return { ...q, fenceCmp: true };
}

// ---------- 12. Picture stories 3: speed, time and prices ----------
const panel = inner => `<div class="panel">${inner}</div>`;
function genStory3(lvl) {
  const kind = pick([['far', 'far', 'price'], ['far', 'time', 'price', 'far'], ['time', 'price', 'meet', 'far']][lvl]);
  if (kind === 'far') {
    const v = pick(lvl ? [4, 5, 6, 8, 12, 15] : [2, 3, 4, 5]), t = R(2, lvl ? 6 : 4), ans = v * t;
    return { ...numQ('', ans, [v + t, ans + v, ans - v, v * (t + 1)].filter(x => x > 0 && x !== ans)), visual: `<div class="story">${panel(`🐫<span class="num">🕐 1</span><span class="num">${v} km</span>`)}<b class="arrow">▶</b>${panel(`🐫<span class="num">🕐 ${t}</span><span class="num"><span class="slot">?</span> km</span>`)}</div>`, show: true, far: true };
  }
  if (kind === 'time') {
    const v = pick([3, 4, 5, 6, 8, 10]), t = R(2, 6), d = v * t;
    return { ...numQ('', t, [d - v, t + 1, v, d / 2 | 0].filter(x => x > 0 && x !== t)), visual: `<div class="story">${panel(`🐫<span class="num">🕐 1</span><span class="num">${v} km</span>`)}<b class="arrow">▶</b>${panel(`🐫<span class="num">🕐 <span class="slot">?</span></span><span class="num">${d} km</span>`)}</div>`, show: true, time: true };
  }
  if (kind === 'price') {
    const n = R(2, 5), p = R(2, lvl ? 9 : 5), m = R(2, 8);
    if (m === n) return genStory3(lvl);
    const ans = m * p;
    return { ...numQ('', ans, [n * p + (m - n), ans + p, p, n * p].filter(x => x > 0 && x !== ans)), visual: `<div class="story">${panel(`<span>${'🥥'.repeat(n)}</span><span class="num">${n * p}🪙</span>`)}<b class="arrow">▶</b>${panel(`<span>${'🥥'.repeat(m)}</span><span class="num"><span class="slot">?</span>🪙</span>`)}</div>`, show: true, price: true };
  }
  // Two camels walk toward each other: when do they meet?
  const a = R(2, 5), b = R(2, 5), t = R(2, 5), d = (a + b) * t;
  return { ...numQ('', t, [d / a | 0, t + 1, d / (a + b) + 1, a + b].filter(x => x > 0 && x !== t)), visual: `<div class="story">${panel(`<span class="num">🕐 1</span><span>🐫➡️ ${a} km</span><span>${b} km ⬅️🐪</span><span class="num">↔ ${d} km</span>`)}<b class="arrow">▶</b>${panel(`<span>🐫🐪</span><span class="num">🕐 <span class="slot">?</span></span>`)}</div>`, show: true, meet: true };
}

export const DESERT = [
  { id: 'd-units', icon: '📏', gen: genUnits },
  { id: 'd-protr', icon: '📐', gen: genProtractor },
  { id: 'd-tri', icon: '🔺', gen: genTriangle },
  { id: 'd-area', icon: '🟨', gen: genArea },
  { id: 'd-trap', icon: '🏔️', gen: genTrap },
  { id: 'd-circle', icon: '🛞', gen: genCircle },
  { id: 'd-vol', icon: '🧊', gen: genVolume },
  { id: 'd-map', icon: '🗺️', gen: genCoords },
  { id: 'd-mean', icon: '🧱', gen: genMean },
  { id: 'd-median', icon: '🐪', gen: genMedian },
  { id: 'd-fence', icon: '🧩', gen: genFence, puzzle: true },
  { id: 'd-story', icon: '🎬', gen: genStory3 },
];
