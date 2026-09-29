// Pictures for the solution sheet: number lines, tiles with jumps, base-ten blocks, dot arrays,
// pyramids, a balance, shapes. Each returns an SVG or HTML string drawn in the game's colours.

const INK = '#1e2650', RED = '#ef5b52', BLUE = '#3e9be0', MINT = '#2fb383', SUN = '#ffc23d', PALE = '#d7f5e6', GREY = '#b9c1d6';
const svg = (w, h, body, label = '') => `<svg class="solsvg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"${label ? ` role="img" aria-label="${label}"` : ''}>${body}</svg>`;
const txt = (x, y, s, { size = 16, fill = INK, anchor = 'middle', weight = 800 } = {}) =>
  `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${s}</text>`;
const fmt = v => String(v).replace('-', '−');

// A number line from `from` to `to`. jumps: [[x0, x1, label, colour]], marks: [[x, colour, label]].
export function nline(from, to, { jumps = [], marks = [], labels = [] } = {}) {
  const W = 300, L = 20, Rr = W - 20, y = 78;
  const X = v => L + ((v - from) / Math.max(1, to - from)) * (Rr - L);
  const r = to - from, tick = r <= 20 ? 1 : r <= 60 ? 5 : r <= 200 ? 10 : [50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000].find(t => r / t <= 20) || 10 ** Math.ceil(Math.log10(r / 10));
  let b = `<line x1="${L - 8}" y1="${y}" x2="${Rr + 8}" y2="${y}" stroke="${INK}" stroke-width="3"/>`;
  for (let v = Math.ceil(from / tick) * tick; v <= to; v += tick) {
    const big = v % (tick * 5) === 0 || tick >= 10;
    b += `<line x1="${X(v)}" y1="${y - (big ? 7 : 4)}" x2="${X(v)}" y2="${y + (big ? 7 : 4)}" stroke="${INK}" stroke-width="2"/>`;
  }
  // endpoints first, then jump ends and marks, skipping any label that would touch one already placed
  const want = [from, to, ...labels, ...jumps.flatMap(([a, c]) => [a, c]), ...marks.map(([v]) => v)];
  const placed = [], apart = Math.max(24, 9 * Math.max(...want.map(v => fmt(v).length)) + 4);
  want.forEach(v => {
    const x = X(v);
    if (placed.some(p => Math.abs(p - x) < apart)) return;
    placed.push(x);
    b += txt(x, y + 24, fmt(v), { size: 14 });
  });
  jumps.forEach(([a, c, label, col = MINT]) => {
    const x0 = X(a), x1 = X(c), h = Math.min(46, 14 + Math.abs(x1 - x0) * 0.35);
    b += `<path d="M${x0} ${y - 4} Q${(x0 + x1) / 2} ${y - 4 - h * 2} ${x1} ${y - 4}" fill="none" stroke="${col}" stroke-width="3"/>`;
    b += `<path d="M${x1} ${y - 4} l${x1 > x0 ? -7 : 7} -6 l0 8z" fill="${col}"/>`;
    if (label) b += txt((x0 + x1) / 2, y - 8 - h, label, { size: 14, fill: col });
  });
  marks.forEach(([v, col = RED, label]) => {
    b += `<circle cx="${X(v)}" cy="${y}" r="8" fill="${col}" stroke="${INK}" stroke-width="2"/>`;
    if (label) b += txt(X(v), y - 16, label, { size: 15, fill: col });
  });
  return svg(W, 112, b);
}

// A row of tiles. items: numbers or emoji; null is the yellow ? tile, { v, hi } marks a tile.
// arcs[i] labels the jump from tile i to tile i+1.
export function tiles(items, { arcs = [], boxes = [] } = {}) {
  const longest = Math.max(...items.map(it => String(it && typeof it === 'object' ? it.v ?? '' : it ?? '').length));
  const S = Math.max(40, longest * 10 + 8), T = 40, G = 6, n = items.length, W = n * (S + G) - G + 8, y = 44;
  let b = '';
  boxes.forEach(([i, k]) => { b += `<rect x="${4 + i * (S + G) - 3}" y="${y - 4}" width="${k * (S + G) - G + 6}" height="${T + 8}" rx="9" fill="none" stroke="${MINT}" stroke-width="3" stroke-dasharray="6 4"/>`; });
  items.forEach((it, i) => {
    const x = 4 + i * (S + G);
    const o = it && typeof it === 'object' ? it : { v: it };
    const empty = o.v === null || o.v === undefined;
    b += `<rect x="${x}" y="${y}" width="${S}" height="${T}" rx="8" fill="${empty ? '#fff8e0' : o.hi ? PALE : '#fff'}" stroke="${empty ? SUN : o.hi ? MINT : INK}" stroke-width="${empty ? 3 : 2.5}"${empty ? ' stroke-dasharray="5 3"' : ''}/>`;
    const s = empty ? '?' : fmt(o.v);
    b += txt(x + S / 2, y + T / 2 + 7, s, { size: S > 40 ? 15 : s.length > 3 ? 13 : s.length > 2 ? 16 : 20 });
  });
  arcs.forEach((label, i) => {
    if (!label) return;
    const x0 = 4 + i * (S + G) + S / 2, x1 = x0 + S + G;
    b += `<path d="M${x0} ${y - 4} Q${(x0 + x1) / 2} ${y - 24} ${x1} ${y - 4}" fill="none" stroke="${MINT}" stroke-width="2.5"/>`;
    b += txt((x0 + x1) / 2, y - 22, label, { size: 13, fill: MINT });
  });
  return svg(Math.max(W, 60), 92, b);
}

// Base-ten blocks. groups: [{ t, o, col, fadeT, fadeO, ring, newRod }], drawn left to right.
export function b10(groups, { labels = true } = {}) {
  let x = 6, b = '';
  const H = 80, top = 8, C = 10;
  groups.forEach((g, gi) => {
    if (g.op) { b += txt(x + 10, top + H / 2 + 8, g.op, { size: 26 }); x += 26; return; }
    const col = g.col || RED, start = x;
    for (let i = 0; i < (g.t || 0); i++) {
      const fade = i >= g.t - (g.fadeT || 0);
      const isNew = g.newRod && i === g.t - 1;
      b += `<rect x="${x}" y="${top}" width="${C}" height="${H}" fill="${isNew ? MINT : col}" stroke="${INK}" stroke-width="1.5" opacity="${fade ? 0.22 : 1}"/>`;
      x += C + 3;
    }
    const o = g.o || 0;
    if (o) {
      const colsN = Math.ceil(o / 5);
      for (let i = 0; i < o; i++) {
        const cx = x + 2 + Math.floor(i / 5) * (C + 2), cy = top + H - (i % 5 + 1) * (C + 2) + 2;
        const fade = i >= o - (g.fadeO || 0);
        b += `<rect x="${cx}" y="${cy}" width="${C}" height="${C}" fill="${SUN}" stroke="${INK}" stroke-width="1.5" opacity="${fade ? 0.22 : 1}"/>`;
      }
      if (g.ring) b += `<rect x="${x - 1}" y="${top + H - 5 * (C + 2) - 2}" width="${2 * (C + 2) + 4}" height="${5 * (C + 2) + 4}" rx="4" fill="none" stroke="${MINT}" stroke-width="2.5" stroke-dasharray="5 3"/>`;
      x += colsN * (C + 2) + 4;
    }
    if (labels && g.label !== undefined) {
      const lw = String(g.label).length * 9;
      if (x - start < lw) { const pad = (lw - (x - start)) / 2; x += pad * 2; }
      b += txt((start + x - 3) / 2, top + H + 22, g.label, { size: 16 });
    }
    x += gi < groups.length - 1 ? 10 : 0;
  });
  return svg(Math.max(x + 6, 60), labels ? 116 : 96, b);
}

// An r × c dot array, rows across. split draws a line under that many rows and colours the rest blue.
export function dots(r, c, { split = 0, tint = 0 } = {}) {
  const s = Math.max(9, Math.min(24, Math.floor(260 / c), Math.floor(170 / r))), g = Math.round(s * 0.3);
  const W = c * (s + g) + g, H = r * (s + g) + g + (split ? 8 : 0);
  let b = '';
  for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) {
    const low = split && i >= split, dy = low ? 8 : 0;
    const fill = low ? BLUE : tint && i < tint ? MINT : SUN;
    b += `<circle cx="${g + j * (s + g) + s / 2}" cy="${g + i * (s + g) + s / 2 + dy}" r="${s / 2 - 1}" fill="${fill}" stroke="${INK}" stroke-width="1.5"/>`;
  }
  if (split) b += `<line x1="0" y1="${g + split * (s + g) + 2}" x2="${W}" y2="${g + split * (s + g) + 2}" stroke="${RED}" stroke-width="3" stroke-dasharray="6 4"/>`;
  return svg(W, H, b);
}

// A list of worked-out lines, each marked right or wrong.
export const checks = rows => `<div class="solchecks">${rows.map(([html, ok]) => `<div class="${ok ? 'ok' : 'no'}"><span>${html}</span><b>${ok ? '✓' : '✗'}</b></div>`).join('')}</div>`;

// A number pyramid. rows from the top; hi: bricks to light up; hole: [r, c] shows val (or ?).
export function pyr(rows, { hi = [], hole = null, val = null } = {}) {
  const BW = 46, BH = 32, n = rows[rows.length - 1].length, W = n * BW + 8;
  let b = '';
  rows.forEach((row, r) => {
    const off = 4 + ((n - row.length) * BW) / 2;
    row.forEach((v, c) => {
      const isHole = hole && hole[0] === r && hole[1] === c, isHi = hi.some(([a, d]) => a === r && d === c);
      const x = off + c * BW, y = 4 + r * BH;
      b += `<rect x="${x}" y="${y}" width="${BW - 3}" height="${BH - 3}" rx="5" fill="${isHole ? (val === null ? '#fff8e0' : PALE) : isHi ? '#ffe39a' : '#fff'}" stroke="${isHole ? (val === null ? SUN : MINT) : INK}" stroke-width="2.5"/>`;
      b += txt(x + (BW - 3) / 2, y + BH / 2 + 5, isHole ? (val === null ? '?' : val) : v, { size: 16 });
    });
  });
  return svg(W, rows.length * BH + 8, b);
}

// A level balance with text on each pan.
export function balance(left, right) {
  let b = `<path d="M150 30 V92 M112 94 h76" stroke="${INK}" stroke-width="4" fill="none"/><path d="M28 30 h244" stroke="${INK}" stroke-width="5"/><path d="M142 94 l8 -12 l8 12z" fill="${INK}"/>`;
  b += `<rect x="20" y="0" width="112" height="28" rx="6" fill="#fff" stroke="${INK}" stroke-width="2.5"/>` + txt(76, 20, left, { size: 17 });
  b += `<rect x="168" y="0" width="112" height="28" rx="6" fill="#fff" stroke="${INK}" stroke-width="2.5"/>` + txt(224, 20, right, { size: 17 });
  return svg(300, 100, b);
}

// A polygon from the question picture, with its corners numbered.
export function corners(points) {
  let b = `<polygon points="${points.map(p => p.join(',')).join(' ')}" fill="#ffe39a" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`;
  points.forEach(([x, y], i) => {
    b += `<circle cx="${x}" cy="${y}" r="9" fill="${MINT}" stroke="${INK}" stroke-width="2"/>` + txt(x, y + 4.5, i + 1, { size: 11, fill: '#fff' });
  });
  return `<svg class="solsvg" viewBox="-6 -6 132 132" width="170" height="170">${b}</svg>`;
}
export const polyPoints = html => {
  const m = /points="([^"]+)"/.exec(html || '');
  return m ? m[1].trim().split(/\s+/).map(p => p.split(',').map(Number)) : null;
};

// The big triangle cut by k lines from the top; fill lights up the triangle between lines i and j.
export function fan(k, [i, j] = [-1, -1], size = 64) {
  const xs = [10, ...Array.from({ length: k }, (_, m) => 10 + (100 * (m + 1)) / (k + 1)), 110];
  let b = `<polygon points="60,10 10,108 110,108" fill="#fff" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`;
  if (i >= 0) b += `<polygon points="60,10 ${xs[i]},108 ${xs[j]},108" fill="${SUN}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`;
  xs.slice(1, -1).forEach(x => { b += `<line x1="60" y1="10" x2="${x}" y2="108" stroke="${INK}" stroke-width="4"/>`; });
  return `<svg class="solsvg" viewBox="0 0 120 120" width="${size}" height="${size}">${b}</svg>`;
}
// The square with both diagonals; tri lights up one triangle: 0-3 the small ones, 4-7 the halves.
export function sqx(tri, size = 64) {
  const P = [[12, 12], [108, 12], [108, 108], [12, 108]], C = [60, 60];
  const t = tri < 4 ? [P[tri], P[(tri + 1) % 4], C] : [P[tri - 4], P[(tri - 3) % 4], P[(tri - 2) % 4]];
  const b = `<rect x="12" y="12" width="96" height="96" fill="#fff" stroke="${INK}" stroke-width="4"/>` +
    `<polygon points="${t.map(p => p.join(',')).join(' ')}" fill="${SUN}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>` +
    `<line x1="12" y1="12" x2="108" y2="108" stroke="${INK}" stroke-width="4"/><line x1="108" y1="12" x2="12" y2="108" stroke="${INK}" stroke-width="4"/>`;
  return `<svg class="solsvg" viewBox="0 0 120 120" width="${size}" height="${size}">${b}</svg>`;
}
export const gallery = (items, cls = '') => `<div class="solgal ${cls}">${items.join('')}</div>`;

// The whole mirror picture: the given half, the fold line and the mirrored half, with arrows in each row.
export function mirror(cells) {
  const S = 26, set = new Set(cells.map(([r, c]) => r + ',' + c));
  let b = '';
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
    const on = c < 2 ? set.has(r + ',' + c) : set.has(r + ',' + (3 - c));
    const x = 4 + c * S + (c >= 2 ? 12 : 0);
    b += `<rect x="${x}" y="${4 + r * S}" width="${S - 3}" height="${S - 3}" rx="3" fill="${on ? (c < 2 ? RED : '#f7a39d') : '#eef1f7'}" stroke="${GREY}" stroke-width="1"/>`;
  }
  b += `<line x1="${4 + 2 * S + 4.5}" y1="0" x2="${4 + 2 * S + 4.5}" y2="${4 * S + 8}" stroke="${INK}" stroke-width="3" stroke-dasharray="6 4"/>`;
  cells.forEach(([r, c]) => {
    const x0 = 4 + c * S + S / 2, x1 = 4 + (3 - c) * S + 12 + S / 2, y = 4 + r * S + S / 2;
    b += `<path d="M${x0} ${y} Q${(x0 + x1) / 2} ${y - 16} ${x1 - 3} ${y - 2}" fill="none" stroke="${MINT}" stroke-width="2.5"/>`;
  });
  return svg(4 * S + 20, 4 * S + 10, b);
}

// A snake measured with copies of the small square.
export function unitSnake(len, u) {
  const s = Math.max(6, Math.min(u, Math.floor(270 / len)));
  let b = `<rect x="8" y="8" width="${len * s}" height="14" rx="7" fill="${MINT}" stroke="${INK}" stroke-width="2.5"/>`;
  for (let i = 0; i < len; i++) {
    b += `<rect x="${8 + i * s}" y="30" width="${s}" height="${s}" fill="${i % 2 ? '#ffe8a3' : '#ffd36b'}" stroke="${INK}" stroke-width="1.2"/>`;
    if ((i + 1) % 5 === 0 || i === len - 1) b += txt(8 + i * s + s / 2, 30 + s + 16, i + 1, { size: 13 });
  }
  return svg(len * s + 16, 30 + s + 24, b);
}

// Emoji in a crowd; faded ones are the ones that left.
export const crowd = (e, n, faded = 0) => `<div class="solcrowd">${Array.from({ length: n }, (_, i) => `<span${i >= n - faded ? ' class="gone"' : ''}>${e}</span>`).join('')}</div>`;
export const row = (...parts) => `<div class="solrow">${parts.join('')}</div>`;
export const big = s => `<b class="solbig">${s}</b>`;
