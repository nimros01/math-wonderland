// More pictures for the solution sheet, for Ocean and the worlds after it: digit rows, column sums,
// fraction bars, clocks, angles, grids, polyominoes and nets, colour counts and shapes with their marks.
// Each returns an SVG or HTML string, drawn in the same colours as sol-pics.js.

const INK = '#1e2650', RED = '#ef5b52', BLUE = '#3e9be0', MINT = '#2fb383', SUN = '#ffc23d', PALE = '#d7f5e6', GREY = '#b9c1d6', PINK = '#f28dbb', CHOC = '#8b5a3c', CREAM = '#f3e6d8';
export const COLORS = { red: RED, blue: BLUE, green: MINT, yellow: SUN, purple: '#8a5cd6' };
const svg = (w, h, body) => `<svg class="solsvg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`;
const txt = (x, y, s, { size = 16, fill = INK, anchor = 'middle', weight = 800 } = {}) =>
  `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${s}</text>`;

// Rows of digit boxes lined up on the right (or on the dot, when a row has one).
// rows: [{ s, hi: [col from the right], tint: { col: colour }, strike: [cols], tops: { col: text }, label }]
// head: labels over the columns from the right; band: a column (from the right) lit up in every row.
export function digitRows(rows, { head = null, band = null, op = null, line = -1, gap = 0 } = {}) {
  const cells = rows.map(r => String(r.s).split(''));
  const n = Math.max(...cells.map(c => c.length), head ? head.length : 0);
  const S = head && head.some(h => String(h).length > 4) ? 46 : 30, G = 3, L = op ? 26 : 6, top = (head ? 22 : 4) + (rows.some(r => r.tops) ? 16 : 0);
  const W = L + n * (S + G) + 6;
  let b = '', y = top;
  const X = i => L + (n - 1 - i) * (S + G); // i counts from the right
  if (band !== null) b += `<rect x="${X(band) - 2}" y="${top - 4}" width="${S + 4}" height="${rows.length * (S + 8) + 6 + gap}" rx="7" fill="#fff3c4" stroke="${SUN}" stroke-width="2.5"/>`;
  if (head) head.forEach((h, i) => { b += txt(X(i) + S / 2, 16, h, { size: String(h).length > 4 ? 10 : 11, fill: '#56608a' }); });
  rows.forEach((r, ri) => {
    const cs = cells[ri];
    if (ri === line) { b += `<line x1="${L - 20}" y1="${y - 5}" x2="${W - 4}" y2="${y - 5}" stroke="${INK}" stroke-width="3"/>`; y += gap; }
    cs.forEach((ch, k) => {
      const i = cs.length - 1 - k, x = X(i);
      if (ch === ' ') return;
      const tint = r.tint?.[i], hi = r.hi?.includes(i);
      if (ch === '.' || ch === ',') { b += txt(x + S / 2, y + S - 4, ch, { size: 26 }); return; }
      b += `<rect x="${x}" y="${y}" width="${S}" height="${S}" rx="6" fill="${ch === '?' ? '#fff8e0' : tint || (hi ? PALE : '#fff')}" stroke="${ch === '?' ? SUN : hi ? MINT : INK}" stroke-width="${hi ? 3 : 2}"${ch === '?' ? ' stroke-dasharray="4 3"' : ''}/>`;
      b += txt(x + S / 2, y + S / 2 + 7, ch, { size: 20, fill: r.strike?.includes(i) ? GREY : INK });
      if (r.strike?.includes(i)) b += `<line x1="${x + 6}" y1="${y + S - 6}" x2="${x + S - 6}" y2="${y + 6}" stroke="${RED}" stroke-width="3"/>`;
      if (r.tops?.[i] !== undefined) b += txt(x + S / 2, y - 4, r.tops[i], { size: 13, fill: RED });
    });
    if (r.label) b += txt(L - 12, y + S / 2 + 7, r.label, { size: 20 });
    y += S + 8 + (r.tops ? 0 : 0);
  });
  if (op) b += txt(12, top + (S + 8) + S / 2 + 7, op, { size: 22 });
  return svg(W, y + 2, b);
}

// A column sum or take-away: a over b, a line, and the answer so far (digits from the right).
// carry: { col: '1' } small numbers over the top row; strike: top-row columns that were broken.
export function column(a, op, b, { res = '', carry = {}, strike = [], band = null } = {}) {
  const rows = [{ s: a, tops: carry, strike }, { s: b }];
  if (res !== null) rows.push({ s: res === '' ? ' ' : res });
  return digitRows(rows, { op, line: 2, band, gap: 6 });
}

// Fraction bars of the same length, one under another: [[pieces, coloured], ...]. colour per bar optional.
export function fbars(list, { w = 220, cols = [] } = {}) {
  const h = 30, gap = 8;
  let b = '';
  list.forEach(([k, s], j) => {
    const cw = w / k, y = 4 + j * (h + gap), col = cols[j] || CHOC;
    for (let i = 0; i < k; i++) b += `<rect x="${4 + i * cw}" y="${y}" width="${cw}" height="${h}" fill="${i < s ? col : CREAM}" stroke="${INK}" stroke-width="${k > 24 ? 1 : 2}"/>`;
  });
  return svg(w + 8, list.length * (h + gap), b);
}
// One bar of `total` parts in coloured runs: segs [[count, colour]], the rest pale; hole lights up the rest.
export function segBar(total, segs, { w = 240, hole = false } = {}) {
  const cw = w / total, h = 34;
  let b = '', i = 0;
  segs.forEach(([k, col]) => { for (let j = 0; j < k; j++, i++) b += `<rect x="${4 + i * cw}" y="4" width="${cw}" height="${h}" fill="${col}" stroke="${INK}" stroke-width="1.5"/>`; });
  for (; i < total; i++) b += `<rect x="${4 + i * cw}" y="4" width="${cw}" height="${h}" fill="${hole ? '#fff8e0' : CREAM}" stroke="${hole ? SUN : INK}" stroke-width="1.5"/>`;
  return svg(w + 8, h + 8, b + `<rect x="4" y="4" width="${w}" height="${h}" fill="none" stroke="${INK}" stroke-width="3"/>`);
}
// A bar worth `whole`, cut into `parts` equal parts with the value of each part written in it; `shaded` parts filled.
export function valueBar(whole, parts, shaded, { w = 250 } = {}) {
  const cw = w / parts, each = whole / parts;
  let b = '';
  for (let i = 0; i < parts; i++) {
    b += `<rect x="${4 + i * cw}" y="20" width="${cw}" height="34" fill="${i < shaded ? SUN : '#fff'}" stroke="${INK}" stroke-width="2"/>`;
    if (parts <= 10) b += txt(4 + i * cw + cw / 2, 43, each, { size: cw < 30 ? 11 : 14 });
  }
  b += txt(4 + w / 2, 14, whole, { size: 14 });
  return svg(w + 8, 60, b);
}

// A clock with the hour hand or the minute hand lit up; fives labels the minutes by fives.
export function clockPic(h, m, { hi = '', fives = false } = {}) {
  let b = `<circle cx="80" cy="80" r="62" fill="#fff" stroke="${INK}" stroke-width="4"/>`;
  for (let i = 0; i < 12; i++) {
    const a = (i * 30 * Math.PI) / 180, s = Math.sin(a), c = Math.cos(a);
    b += `<line x1="${80 + 53 * s}" y1="${80 - 53 * c}" x2="${80 + 59 * s}" y2="${80 - 59 * c}" stroke="${INK}" stroke-width="${i % 3 ? 2 : 4}"/>`;
    b += txt(80 + 43 * s, 80 - 43 * c + 5, i || 12, { size: 13 });
    if (fives) b += txt(80 + 73 * s, 80 - 73 * c + 4, i * 5, { size: 10, fill: RED });
  }
  const hand = (deg, len, w, col) => { const a = (deg * Math.PI) / 180; return `<line x1="80" y1="80" x2="${(80 + len * Math.sin(a)).toFixed(1)}" y2="${(80 - len * Math.cos(a)).toFixed(1)}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`; };
  if (fives && m) {
    const a1 = (m * 6 * Math.PI) / 180, big = m > 30 ? 1 : 0;
    b += `<path d="M80 80 L80 30 A50 50 0 ${big} 1 ${(80 + 50 * Math.sin(a1)).toFixed(1)} ${(80 - 50 * Math.cos(a1)).toFixed(1)} Z" fill="${RED}" opacity=".15"/>`;
  }
  b += hand(((h % 12) + m / 60) * 30, 32, hi === 'h' ? 9 : 7, hi === 'h' ? BLUE : hi ? GREY : INK);
  b += hand(m * 6, 50, hi === 'm' ? 6 : 4, hi === 'h' ? GREY : RED) + `<circle cx="80" cy="80" r="5" fill="${INK}"/>`;
  return svg(160, 160, b);
}

const pt = (cx, cy, a, l) => [(cx + l * Math.cos((a * Math.PI) / 180)).toFixed(1), (cy - l * Math.sin((a * Math.PI) / 180)).toFixed(1)];
// An angle cut into slices of `unit` degrees, numbered, with a square corner drawn when it is 90.
export function angleFan(d, unit) {
  const cx = 110, cy = 110, R = 90, k = Math.round(d / unit);
  let b = '';
  for (let i = 0; i < k; i++) {
    const [x0, y0] = pt(cx, cy, i * unit, R), [x1, y1] = pt(cx, cy, (i + 1) * unit, R);
    b += `<path d="M${cx} ${cy} L${x0} ${y0} A${R} ${R} 0 0 0 ${x1} ${y1} Z" fill="${i % 2 ? '#ffe39a' : '#bfe3f7'}" stroke="${INK}" stroke-width="1.5"/>`;
    const [tx, ty] = pt(cx, cy, (i + 0.5) * unit, R * 0.72);
    b += txt(tx, +ty + 5, i + 1, { size: 13 });
  }
  const [ex, ey] = pt(cx, cy, d, R + 8);
  b += `<line x1="${cx}" y1="${cy}" x2="${cx + R + 8}" y2="${cy}" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><line x1="${cx}" y1="${cy}" x2="${ex}" y2="${ey}" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`;
  return svg(220, d > 180 ? 220 : 124, b);
}
// Two angles from the same arm, one on top of the other: the wider opening shows.
export function angleOverlay(d1, d2) {
  const cx = 70, cy = 120, R = 100;
  let b = '';
  [[Math.max(d1, d2), d1 >= d2 ? RED : BLUE], [Math.min(d1, d2), d1 >= d2 ? BLUE : RED]].forEach(([d, col]) => {
    const [x1, y1] = pt(cx, cy, d, R);
    b += `<path d="M${cx} ${cy} L${cx + R} ${cy} A${R} ${R} 0 0 0 ${x1} ${y1} Z" fill="${col}" opacity=".28"/>`;
    b += `<line x1="${cx}" y1="${cy}" x2="${x1}" y2="${y1}" stroke="${col}" stroke-width="6" stroke-linecap="round"/>`;
  });
  b += `<line x1="${cx}" y1="${cy}" x2="${cx + R}" y2="${cy}" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="5" fill="${INK}"/>`;
  const wide = Math.max(d1, d2) > 90;
  return `<svg class="solsvg" viewBox="${wide ? -40 : 0} 0 ${wide ? 220 : 180} 130" width="${wide ? 220 : 180}" height="130">${b}</svg>`;
}

// A w × h grid of squares. cut: [cw, ch] leaves the top-right corner out (drawn dashed);
// labels writes the side lengths; fence draws the edge in red; rowsHi colours the rows in turn.
export function gridPic(w, h, { cut = null, labels = false, fence = false, rowsHi = false, push = false } = {}) {
  const u = Math.min(28, Math.floor(200 / Math.max(w, h))), ox = 26, oy = 24;
  let b = '';
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const out = cut && x >= w - cut[0] && y < cut[1];
    b += `<rect x="${ox + x * u}" y="${oy + y * u}" width="${u}" height="${u}" fill="${out ? 'none' : rowsHi ? (y % 2 ? '#8fcdf0' : BLUE) : '#bfe3f7'}" stroke="${out ? GREY : '#fff'}" stroke-width="${out ? 1.5 : 1.5}"${out ? ' stroke-dasharray="4 3"' : ''}/>`;
  }
  const W = w * u, H = h * u;
  if (cut) {
    const cx = ox + (w - cut[0]) * u, cy = oy + cut[1] * u;
    b += `<path d="M${ox} ${oy} H${cx} V${cy} H${ox + W} V${oy + H} H${ox} Z" fill="none" stroke="${fence ? RED : INK}" stroke-width="4" stroke-linejoin="round"/>`;
    if (push) b += `<path d="M${cx} ${oy} H${ox + W} V${cy}" fill="none" stroke="${MINT}" stroke-width="4" stroke-dasharray="7 5"/>`;
  } else b += `<rect x="${ox}" y="${oy}" width="${W}" height="${H}" fill="none" stroke="${fence ? RED : INK}" stroke-width="4"/>`;
  if (labels) b += txt(ox + W / 2, oy - 8, w, { size: 15 }) + txt(ox - 12, oy + H / 2 + 5, h, { size: 15 }) + (fence ? txt(ox + W / 2, oy + H + 18, w, { size: 15 }) + txt(ox + W + 12, oy + H / 2 + 5, h, { size: 15 }) : '');
  return svg(W + 2 * ox, H + oy + 24, b);
}

// A shape made of squares ([x, y] cells). faces: a label per cell; bad: cells drawn red.
export function cellsPic(cells, { size = 76, color = BLUE, faces = null, bad = [], hi = false } = {}) {
  const mx = Math.min(...cells.map(c => c[0])), my = Math.min(...cells.map(c => c[1]));
  const n = cells.map(([x, y]) => [x - mx, y - my]);
  const w = Math.max(...n.map(c => c[0])) + 1, h = Math.max(...n.map(c => c[1])) + 1, u = 100 / Math.max(w, h, 3);
  const ox = (100 - w * u) / 2, oy = (100 - h * u) / 2;
  let b = hi ? `<rect x="1" y="1" width="98" height="98" rx="10" fill="${PALE}" stroke="${MINT}" stroke-width="3"/>` : '';
  n.forEach(([x, y], i) => {
    b += `<rect x="${ox + x * u + 1}" y="${oy + y * u + 1}" width="${u - 2}" height="${u - 2}" rx="2" fill="${bad.includes(i) ? RED : color}" stroke="${INK}" stroke-width="2.5"/>`;
    if (faces) b += txt(ox + x * u + u / 2, oy + y * u + u / 2 + 5, faces[i], { size: Math.round(u * 0.45) });
  });
  return `<svg class="solsvg" viewBox="0 0 100 100" width="${size}" height="${size}">${b}</svg>`;
}

// An n × n grid with one s × s square lit up at (x, y).
export function sqGrid(n, s, x, y, size = 64) {
  const u = 100 / n;
  let b = '';
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) b += `<rect x="${i * u}" y="${j * u}" width="${u}" height="${u}" fill="#ffe8a3" stroke="${INK}" stroke-width="2"/>`;
  b += `<rect x="${x * u + 3}" y="${y * u + 3}" width="${s * u - 6}" height="${s * u - 6}" fill="${RED}" opacity=".45" stroke="${RED}" stroke-width="5"/>`;
  return `<svg class="solsvg" viewBox="-3 -3 106 106" width="${size}" height="${size}">${b}</svg>`;
}

// One row of marbles per colour, lined up so the longest row shows at once: [[colour, count]].
export function colorRows(list, { mark = null } = {}) {
  const r = 11, D = 25, maxN = Math.max(...list.map(x => x[1]));
  let b = '';
  list.forEach(([c, k], j) => {
    const y = 16 + j * 32;
    if (c === mark) b += `<rect x="2" y="${y - 15}" width="${maxN * D + 46}" height="30" rx="15" fill="${PALE}" stroke="${MINT}" stroke-width="2.5"/>`;
    for (let i = 0; i < k; i++) b += `<circle cx="${16 + i * D}" cy="${y}" r="${r}" fill="${COLORS[c] || c}" stroke="${INK}" stroke-width="1.5"/>`;
    b += txt(16 + k * D + 6, y + 6, k, { size: 17, anchor: 'start' });
  });
  return svg(maxN * D + 52, list.length * 32 + 2, b);
}

// k treasure chests, each with a number under it.
export const chests = (k, label) => `<div class="solchests">${Array.from({ length: k }, () => `<span><i>🧰</i><b>${label}</b></span>`).join('')}</div>`;

// A tray cut into b columns and d rows: a columns yellow, c rows pink, the overlap dark pink.
export function trayPic(b, a, d, c, size = 170) {
  const u = Math.floor(Math.min(size / b, 130 / d)), W = b * u, H = d * u;
  let s = '';
  for (let y = 0; y < d; y++) for (let x = 0; x < b; x++) {
    const inA = x < a, inC = y < c;
    s += `<rect x="${6 + x * u}" y="${6 + y * u}" width="${u}" height="${u}" fill="${inA && inC ? '#e0457b' : inA ? '#ffd24a' : inC ? '#f9c6dc' : '#fff'}" stroke="${INK}" stroke-width="1.5"/>`;
  }
  return svg(W + 12, H + 12, s + `<rect x="6" y="6" width="${W}" height="${H}" fill="none" stroke="${INK}" stroke-width="3.5"/>`);
}

// A polygon from a question picture with its facts marked: sides in a parallel pair share a colour,
// square corners get a red square, and equal sides a tick. points are in a 100 × 100 box.
export function shapeFacts(points, { par = false, right = false, eq = false, size = 150 } = {}) {
  const n = points.length, side = i => [points[(i + 1) % n][0] - points[i][0], points[(i + 1) % n][1] - points[i][1]];
  const len = i => Math.hypot(...side(i));
  let b = `<polygon points="${points.map(p => p.join(',')).join(' ')}" fill="#bfe3f7" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
  if (par) {
    const pairs = parallelPairs(points), cols = [RED, BLUE];
    pairs.forEach(([i, j], k) => [i, j].forEach(s => {
      const [x0, y0] = points[s], [x1, y1] = points[(s + 1) % n];
      b += `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="${cols[k]}" stroke-width="6" stroke-linecap="round"/>`;
      const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, ux = (x1 - x0) / len(s), uy = (y1 - y0) / len(s);
      b += `<path d="M${mx - ux * 5 - uy * 5} ${my - uy * 5 + ux * 5} L${mx + ux * 3} ${my + uy * 3} L${mx - ux * 5 + uy * 5} ${my - uy * 5 - ux * 5}" fill="none" stroke="${INK}" stroke-width="2.5"/>`;
    }));
  }
  if (right) rightCorners(points).forEach(i => {
    const v = points[i], p = points[(i + n - 1) % n], q = points[(i + 1) % n];
    const u1 = [p[0] - v[0], p[1] - v[1]], u2 = [q[0] - v[0], q[1] - v[1]], l1 = Math.hypot(...u1), l2 = Math.hypot(...u2), e = 10;
    const a = [v[0] + (u1[0] / l1) * e, v[1] + (u1[1] / l1) * e], c = [v[0] + (u2[0] / l2) * e, v[1] + (u2[1] / l2) * e];
    b += `<path d="M${a} L${a[0] + (u2[0] / l2) * e},${a[1] + (u2[1] / l2) * e} L${c}" fill="none" stroke="${RED}" stroke-width="3"/>`;
  });
  if (eq) for (let i = 0; i < n; i++) {
    const [x0, y0] = points[i], [x1, y1] = points[(i + 1) % n], mx = (x0 + x1) / 2, my = (y0 + y1) / 2, l = len(i), nx = -(y1 - y0) / l, ny = (x1 - x0) / l;
    b += `<line x1="${mx - nx * 6}" y1="${my - ny * 6}" x2="${mx + nx * 6}" y2="${my + ny * 6}" stroke="${RED}" stroke-width="3"/>`;
  }
  return `<svg class="solsvg" viewBox="0 0 100 100" width="${size}" height="${size}">${b}</svg>`;
}
const sides = pts => pts.map((p, i) => [pts[(i + 1) % pts.length][0] - p[0], pts[(i + 1) % pts.length][1] - p[1]]);
// Pairs of opposite sides that point the same way (four-sided shapes only).
export function parallelPairs(pts) {
  if (pts.length !== 4) return [];
  const s = sides(pts), out = [];
  for (const i of [0, 1]) {
    const [a, b] = [s[i], s[i + 2]];
    if (Math.abs(a[0] * b[1] - a[1] * b[0]) / (Math.hypot(...a) * Math.hypot(...b)) < 1e-6) out.push([i, i + 2]);
  }
  return out;
}
export function rightCorners(pts) {
  const s = sides(pts), n = pts.length, out = [];
  for (let i = 0; i < n; i++) {
    const a = s[(i + n - 1) % n], b = s[i];
    if (Math.abs(a[0] * b[0] + a[1] * b[1]) / (Math.hypot(...a) * Math.hypot(...b)) < 1e-6) out.push(i);
  }
  return out;
}
export const allSidesEqual = pts => { const l = sides(pts).map(v => Math.hypot(...v)); return l.every(x => Math.abs(x - l[0]) < 1e-6 * l[0]); };
