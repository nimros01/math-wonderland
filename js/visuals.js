// Picture aids: ten-frames, tens-and-ones blocks, arrays, tile rows, shapes and puzzles.
// Each returns an HTML string.

const INK = '#1e2650';
const R = (a, b) => a + Math.random() * (b - a);

// cells: list of 'a' (red dot), 'b' (blue dot), 'x' (crossed-out dot), 'e' (empty).
export function frames(cells) {
  const n = Math.max(10, Math.ceil(cells.length / 10) * 10);
  const all = cells.concat(Array(n - cells.length).fill('e'));
  let h = '<div class="frames">';
  for (let f = 0; f < n / 10; f++) {
    h += '<div class="tf">' + all.slice(f * 10, f * 10 + 10).map(c => `<i class="c-${c}"></i>`).join('') + '</div>';
  }
  return h + '</div>';
}

export const fill = (n, c = 'a') => Array(Math.max(0, n)).fill(c);

// A number as tens bars and ones cubes. xt / xo cross out that many from the end.
export function blocks(n, cls = 'a', xt = 0, xo = 0) {
  const t = Math.floor(n / 10), o = n % 10;
  let h = `<div class="blocks ${cls}">`;
  for (let i = 0; i < t; i++) h += `<span class="bar${i >= t - xt ? ' x' : ''}"></span>`;
  if (o) {
    h += '<span class="ones">';
    for (let i = 0; i < o; i++) h += `<i class="${i >= o - xo ? 'x' : ''}"></i>`;
    h += '</span>';
  }
  return h + '</div>';
}

export const pair = (a, op, b) => `<div class="pairvis">${a}<b class="op">${op}</b>${b}</div>`;

// An r × c array of dots. The longer side always runs across, and dots shrink to fit.
export function array(r, c) {
  const rows = Math.min(r, c), cols = Math.max(r, c);
  const s = Math.max(8, Math.min(24, Math.floor(230 / cols), Math.floor(150 / rows)));
  let h = `<div class="arr" style="--s:${s}px;grid-template-columns:repeat(${cols},${s}px)">`;
  for (let i = 0; i < rows * cols; i++) h += `<i class="${Math.floor(i / cols) % 2 ? 'alt' : ''}"></i>`;
  return h + '</div>';
}

// A train of tiles. '❓' becomes the yellow slot the child fills in.
export const row = items => `<div class="seq" style="--n:${items.length}">` +
  items.map(x => (x === '❓' ? `<span class="slot${typeof items.find(i => i !== '❓') === 'number' ? ' num' : ''}">?</span>` : `<span${typeof x === 'number' ? ` class="num${x >= 100 ? ' n3' : ''}"` : ''}>${x}</span>`)).join('') + '</div>';

// Number pyramid: rows from the top down, '❓' marks the hidden brick.
export function pyramid(rows) {
  return '<div class="pyr">' + rows.map(r => '<div>' + r.map(x =>
    x === '❓' ? '<span class="slot num">?</span>' : `<span class="num${x >= 100 ? ' n3' : ''}">${x}</span>`).join('') + '</div>').join('') + '</div>';
}

// ---------- shapes ----------
const COLORS = ['#3e9be0', '#ef5b52', '#2fb383', '#ffc23d', '#8a5cd6'];
const pickColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

// A polygon with n corners. jitter makes it less regular so kids count corners, not recognise a picture.
export function polygon(n, { size = 120, jitter = 0.22, dots = false, color = pickColor(), scale = 1 } = {}) {
  const c = 60, r = 48 * scale, rot = R(0, Math.PI * 2);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = rot + (i * 2 * Math.PI) / n + R(-0.15, 0.15) * jitter;
    const rr = r * (1 - R(0, jitter));
    pts.push([c + rr * Math.cos(a), c + rr * Math.sin(a)]);
  }
  const p = pts.map(q => q.map(v => v.toFixed(1)).join(',')).join(' ');
  const d = dots ? pts.map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" fill="${INK}"/>`).join('') : '';
  return `<svg class="shape" viewBox="0 0 120 120" width="${size}" height="${size}"><polygon points="${p}" fill="${color}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>${d}</svg>`;
}

export function circle({ size = 120, color = pickColor(), oval = false } = {}) {
  return `<svg class="shape" viewBox="0 0 120 120" width="${size}" height="${size}"><ellipse cx="60" cy="60" rx="${oval ? 50 : 42}" ry="${oval ? 30 : 42}" fill="${color}" stroke="${INK}" stroke-width="4"/></svg>`;
}

// Triangles to count: a triangle split by k lines from the top, or a square with both diagonals.
export function triangleFan(k) {
  let lines = '';
  for (let i = 1; i <= k; i++) {
    const x = 10 + (100 * i) / (k + 1);
    lines += `<line x1="60" y1="10" x2="${x.toFixed(1)}" y2="108" stroke="${INK}" stroke-width="4"/>`;
  }
  return `<svg class="shape" viewBox="0 0 120 120" width="150" height="150"><polygon points="60,10 10,108 110,108" fill="#ffd978" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>${lines}</svg>`;
}
export const squareX = () => `<svg class="shape" viewBox="0 0 120 120" width="150" height="150"><rect x="12" y="12" width="96" height="96" fill="#ffd978" stroke="${INK}" stroke-width="4"/><line x1="12" y1="12" x2="108" y2="108" stroke="${INK}" stroke-width="4"/><line x1="108" y1="12" x2="12" y2="108" stroke="${INK}" stroke-width="4"/></svg>`;

// Half of a 4 × 2 grid picture, for the mirror puzzle. cells: list of [row, col].
export function half(cells, size = 64) {
  const set = new Set(cells.map(([r, c]) => r + ',' + c));
  let h = `<svg class="half" viewBox="0 0 50 100" width="${size / 2}" height="${size}">`;
  for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) {
    h += `<rect x="${c * 25 + 1}" y="${r * 25 + 1}" width="23" height="23" rx="3" fill="${set.has(r + ',' + c) ? '#ef5b52' : '#eef1f7'}" stroke="#b9c1d6" stroke-width="1"/>`;
  }
  return h + '</svg>';
}
export const mirrorVis = left => `<div class="mirror">${half(left, 128)}<span class="mline"></span><span class="slot mslot">?</span></div>`;

// 3D solids.
const SOLIDS = {
  sphere: `<circle cx="60" cy="60" r="44" fill="#3e9be0" stroke="${INK}" stroke-width="4"/><ellipse cx="60" cy="60" rx="44" ry="13" fill="none" stroke="${INK}" stroke-width="2" stroke-dasharray="5 5"/><circle cx="44" cy="42" r="9" fill="#fff" opacity=".5"/>`,
  cube: `<polygon points="30,40 70,40 70,100 30,100" fill="#ef5b52" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><polygon points="30,40 50,22 90,22 70,40" fill="#f48a82" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><polygon points="70,40 90,22 90,82 70,100" fill="#c0433c" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`,
  cylinder: `<path d="M28 30 V92 A32 11 0 0 0 92 92 V30" fill="#2fb383" stroke="${INK}" stroke-width="4"/><ellipse cx="60" cy="30" rx="32" ry="11" fill="#6fd3a8" stroke="${INK}" stroke-width="4"/>`,
  cone: `<path d="M60 12 L24 92 A36 12 0 0 0 96 92 Z" fill="#ffc23d" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M24 92 A36 12 0 0 1 96 92" fill="none" stroke="${INK}" stroke-width="2" stroke-dasharray="5 5"/>`,
};
export const SOLID_NAMES = Object.keys(SOLIDS);
export const solid = (name, size = 80) => `<svg class="shape" viewBox="0 0 120 120" width="${size}" height="${size}">${SOLIDS[name]}</svg>`;
