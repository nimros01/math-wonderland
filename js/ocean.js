// Ocean (world 2): numbers to 10,000, big sums, bigger ×, division, fractions, time, angles,
// area and perimeter, turns and nets, and first probability. Same question format as Meadow.
import { R, pick, chance, shuffle, numQ, tfQ, findAllQ, pairsQ, cmpQ, SYMBOLS, numChoices } from './skills.js';
import { blocks, row, pair } from './visuals.js';

const INK = '#1e2650';
const COL = { red: '#ef5b52', blue: '#3e9be0', green: '#2fb383', yellow: '#ffc23d', purple: '#8a5cd6' };
const svg = (w, h, body, cls = 'shape', size = '') => `<svg class="${cls}" viewBox="0 0 ${w} ${h}" ${size}>${body}</svg>`;
const txt = (x, y, t, s = 14, extra = '') => `<text x="${x}" y="${y}" font-size="${s}" font-weight="800" fill="${INK}" text-anchor="middle" dominant-baseline="central" ${extra}>${t}</text>`;
const near = (n, ds) => ds.map(d => n + d);
const dot = c => `<span class="cdot" style="background:${COL[c]}"></span>`;
export const frac = (n, d) => `<span class="frac"><b>${n}</b><b>${d}</b></span>`;

// ---------- pictures ----------
// Hundreds flats, tens bars and ones cubes.
function place(n) {
  const h = Math.floor(n / 100);
  return `<div class="place"><div class="flats">${'<span class="flat"></span>'.repeat(h)}</div>${n % 100 ? blocks(n % 100) : ''}</div>`;
}

// Coins of 1000, 100, 10 and 1, each value in its own stack.
function coins(n) {
  const parts = [[1000, Math.floor(n / 1000)], [100, Math.floor(n / 100) % 10], [10, Math.floor(n / 10) % 10], [1, n % 10]];
  return '<div class="coins">' + parts.filter(([, k]) => k).map(([v, k]) =>
    `<div class="stack">${`<span class="coin k${v}">${v}</span>`.repeat(k)}</div>`).join('') + '</div>';
}

// A number line from a to b with the number n marked.
function numberLine(a, b, n) {
  const x = v => 20 + ((v - a) / (b - a)) * 220;
  let ticks = '';
  for (let i = 0; i <= 10; i++) { const tx = 20 + i * 22; ticks += `<line x1="${tx}" y1="${i % 5 ? 44 : 38}" x2="${tx}" y2="56" stroke="${INK}" stroke-width="2"/>`; }
  return svg(260, 90, `<line x1="20" y1="50" x2="240" y2="50" stroke="${INK}" stroke-width="3"/>${ticks}
    ${txt(20, 74, a)}${txt(240, 74, b)}<path d="M${x(n)} 36 l-7 -12 h14z" fill="${COL.red}"/>${txt(x(n), 14, n, 14, `fill="${COL.red}"`)}`, 'shape nl', 'width="260" height="90"');
}

// 23 × 4 as a rectangle split into 20 × 4 and 3 × 4.
function areaModel(a, b) {
  const parts = a >= 100 ? [Math.floor(a / 100) * 100, Math.floor(a / 10) % 10 * 10, a % 10] : [Math.floor(a / 10) * 10, a % 10];
  const ps = parts.filter(Boolean);
  const total = ps.reduce((s, v) => s + Math.sqrt(v), 0);
  let x = 30, body = '';
  ps.forEach((v, i) => {
    const w = Math.max(40, (Math.sqrt(v) / total) * 200);
    body += `<rect x="${x}" y="30" width="${w}" height="70" fill="${[COL.blue, COL.yellow, COL.green][i]}" stroke="${INK}" stroke-width="3"/>${txt(x + w / 2, 16, v)}${txt(x + w / 2, 65, `${v}×${b}`, 13)}`;
    x += w;
  });
  return svg(x + 10, 110, body + txt(15, 65, b), 'shape', `width="${Math.min(280, x + 10)}" height="110"`);
}

// Fish shared into nets. With show, each net holds its share and leftovers wait outside.
function shareVis(n, k, show) {
  const each = Math.floor(n / k), left = n - each * k;
  if (!show) return `<div class="share"><div class="fishrow">${'🐟'.repeat(n)}</div><div class="nets">${'<span class="net"></span>'.repeat(k)}</div></div>`;
  return `<div class="share"><div class="nets">${`<span class="net">${'🐟'.repeat(each)}</span>`.repeat(k)}</div>${left ? `<div class="fishrow left">${'🐟'.repeat(left)}</div>` : ''}</div>`;
}

// Fact triangle: the product on top, the two factors below. One corner is '?'.
function factTri(top, a, b) {
  const c = v => (v === '?' ? `<circle r="17" fill="#fff4cc" stroke="#d99a00" stroke-width="3" stroke-dasharray="5 4"/>${txt(0, 0, '?', 18, 'fill="#d99a00"')}` : txt(0, 0, v, 22));
  return svg(200, 170, `<polygon points="100,12 12,158 188,158" fill="#ffe8a3" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <text x="100" y="98" font-size="22" font-weight="800" fill="${INK}" text-anchor="middle">×</text>
    <g transform="translate(100,48)">${c(top)}</g><g transform="translate(46,134)">${c(a)}</g><g transform="translate(154,134)">${c(b)}</g>`, 'shape', 'width="200" height="170"');
}

// A pizza cut into k equal slices with s shaded, or a chocolate bar of k squares.
function pizza(k, s, size = 130) {
  let body = `<circle cx="60" cy="60" r="52" fill="#fff4e0" stroke="${INK}" stroke-width="4"/>`;
  for (let i = 0; i < k; i++) {
    const a0 = (i / k) * 2 * Math.PI - Math.PI / 2, a1 = ((i + 1) / k) * 2 * Math.PI - Math.PI / 2;
    const p = (a, r = 52) => `${(60 + r * Math.cos(a)).toFixed(1)} ${(60 + r * Math.sin(a)).toFixed(1)}`;
    body += `<path d="M60 60 L${p(a0)} A52 52 0 ${k === 1 ? 1 : 0} 1 ${p(a1)} Z" fill="${i < s ? COL.yellow : 'none'}" stroke="${INK}" stroke-width="3"/>`;
    if (i < s) body += `<circle cx="${p((a0 + a1) / 2, 32).split(' ')[0]}" cy="${p((a0 + a1) / 2, 32).split(' ')[1]}" r="5" fill="${COL.red}"/>`;
  }
  return svg(120, 120, body, 'shape', `width="${size}" height="${size}"`);
}
function chocolate(k, s, w = 150) {
  const cw = 130 / k;
  let body = '';
  for (let i = 0; i < k; i++) body += `<rect x="${10 + i * cw}" y="10" width="${cw}" height="40" fill="${i < s ? '#8b5a3c' : '#f3e6d8'}" stroke="${INK}" stroke-width="3"/>`;
  return svg(150, 60, body, 'shape', `width="${w}" height="${w * 0.4}"`);
}

// An angle of deg degrees, turned by rot degrees, with arms of lengths l1 and l2.
function angleVis(deg, { rot = 0, l1 = 70, l2 = 70, size = 150, mark = true, color = INK } = {}) {
  const r = a => ((a - rot) * Math.PI) / 180;
  const cx = 75, cy = 75;
  const e = (a, l) => `${(cx + l * Math.cos(r(a))).toFixed(1)} ${(cy - l * Math.sin(r(a))).toFixed(1)}`;
  let arc = '';
  if (mark && deg === 90) {
    const s = 14;
    arc = `<path d="M${e(0, s)} L${(cx + s * Math.cos(r(0)) + s * Math.cos(r(90))).toFixed(1)} ${(cy - s * Math.sin(r(0)) - s * Math.sin(r(90))).toFixed(1)} L${e(90, s)}" fill="none" stroke="${COL.red}" stroke-width="3"/>`;
  } else if (mark) {
    arc = `<path d="M${e(0, 20)} A20 20 0 ${deg > 180 ? 1 : 0} 0 ${e(deg, 20)}" fill="none" stroke="${COL.red}" stroke-width="3"/>`;
  }
  return svg(150, 150, `<line x1="${cx}" y1="${cy}" x2="${e(0, l1).replace(' ', '" y2="')}" stroke="${color}" stroke-width="6" stroke-linecap="round"/>
    <line x1="${cx}" y1="${cy}" x2="${e(deg, l2).replace(' ', '" y2="')}" stroke="${color}" stroke-width="6" stroke-linecap="round"/>${arc}<circle cx="${cx}" cy="${cy}" r="5" fill="${INK}"/>`, 'shape', `width="${size}" height="${size}"`);
}

// A clock face.
function clock(h, m, size = 150) {
  let body = `<circle cx="60" cy="60" r="54" fill="#fff" stroke="${INK}" stroke-width="4"/>`;
  for (let i = 0; i < 12; i++) {
    const a = (i * 30 * Math.PI) / 180;
    body += `<line x1="${60 + 46 * Math.sin(a)}" y1="${60 - 46 * Math.cos(a)}" x2="${60 + 51 * Math.sin(a)}" y2="${60 - 51 * Math.cos(a)}" stroke="${INK}" stroke-width="${i % 3 ? 2 : 4}"/>`;
    if (i % 3 === 0) body += txt(60 + 36 * Math.sin(a), 60 - 36 * Math.cos(a), i || 12, 13);
  }
  const hand = (deg, len, w, c) => { const a = (deg * Math.PI) / 180; return `<line x1="60" y1="60" x2="${(60 + len * Math.sin(a)).toFixed(1)}" y2="${(60 - len * Math.cos(a)).toFixed(1)}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`; };
  body += hand(((h % 12) + m / 60) * 30, 28, 7, INK) + hand(m * 6, 44, 4, COL.red) + `<circle cx="60" cy="60" r="4" fill="${INK}"/>`;
  return svg(120, 120, body, 'shape', `width="${size}" height="${size}"`);
}
const hm = (h, m) => `${h}:${String(m).padStart(2, '0')}`;

// Tiles on a grid: cells is a list of [x, y]. Optional side labels, a crab on the fence, grid lines.
function tiles(cells, { grid = true, labels = null, crab = false, size = 170, fill = COL.blue } = {}) {
  const w = Math.max(...cells.map(c => c[0])) + 1, h = Math.max(...cells.map(c => c[1])) + 1;
  const u = Math.min(26, Math.floor(150 / Math.max(w, h)));
  const ox = 24, oy = 24, W = w * u + 48, H = h * u + 48;
  const set = new Set(cells.map(c => c.join(',')));
  let body = '';
  for (const [x, y] of cells) body += `<rect x="${ox + x * u}" y="${oy + y * u}" width="${u}" height="${u}" fill="${fill}" ${grid ? `stroke="#ffffff" stroke-width="1.5"` : ''}/>`;
  // outline: every tile edge that borders empty space
  let edges = '';
  for (const [x, y] of cells) {
    const X = ox + x * u, Y = oy + y * u;
    if (!set.has(`${x},${y - 1}`)) edges += `M${X} ${Y}h${u}`;
    if (!set.has(`${x},${y + 1}`)) edges += `M${X} ${Y + u}h${u}`;
    if (!set.has(`${x - 1},${y}`)) edges += `M${X} ${Y}v${u}`;
    if (!set.has(`${x + 1},${y}`)) edges += `M${X + u} ${Y}v${u}`;
  }
  body += `<path d="${edges}" stroke="${crab ? COL.red : INK}" stroke-width="4" ${crab ? 'stroke-dasharray="7 5"' : ''} fill="none" stroke-linecap="round"/>`;
  if (labels) body += txt(ox + (w * u) / 2, oy - 12, labels[0], 15) + txt(ox - 13, oy + (h * u) / 2, labels[1], 15);
  if (crab) body += `<text x="${ox - 4}" y="${oy + 4}" font-size="20" text-anchor="middle" dominant-baseline="central">🦀</text>`;
  const m = Math.max(W, H), sz = Math.min(size, m * 1.4);
  return svg(W, H, body, 'shape', `width="${Math.round(sz * W / m)}" height="${Math.round(sz * H / m)}"`);
}
const rect = (w, h) => { const c = []; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) c.push([x, y]); return c; };

// Polyomino helpers for turns and nets.
const norm = cs => { const mx = Math.min(...cs.map(c => c[0])), my = Math.min(...cs.map(c => c[1])); return cs.map(([x, y]) => [x - mx, y - my]); };
const keyOf = cs => norm(cs).map(c => c.join(',')).sort().join(' ');
const rot90 = cs => norm(cs.map(([x, y]) => [-y, x]));
const flipX = cs => norm(cs.map(([x, y]) => [-x, y]));
const rotations = cs => { const out = [norm(cs)]; for (let i = 0; i < 3; i++) out.push(rot90(out[out.length - 1])); return out; };
function cellsSvg(cs, size = 70, color = COL.green) {
  const n = norm(cs), w = Math.max(...n.map(c => c[0])) + 1, h = Math.max(...n.map(c => c[1])) + 1, m = Math.max(w, h);
  const u = 100 / m;
  const ox = (100 - w * u) / 2, oy = (100 - h * u) / 2;
  return svg(100, 100, n.map(([x, y]) => `<rect x="${ox + x * u + 1}" y="${oy + y * u + 1}" width="${u - 2}" height="${u - 2}" rx="2" fill="${color}" stroke="${INK}" stroke-width="2.5"/>`).join(''), 'shape', `width="${size}" height="${size}"`);
}

// Does a net of six squares fold into a cube? Roll a die across it: each square must meet a new face.
export function foldsToCube(cs) {
  if (cs.length !== 6) return false;
  const set = new Map(cs.map(c => [c.join(','), c]));
  const start = cs[0];
  const seen = new Map([[start.join(','), { top: 't', bottom: 'b', n: 'n', s: 's', e: 'e', w: 'w' }]]);
  const queue = [start];
  const roll = (d, dx, dy) => {
    if (dy === -1) return { ...d, bottom: d.n, s: d.bottom, top: d.s, n: d.top };
    if (dy === 1) return { ...d, bottom: d.s, n: d.bottom, top: d.n, s: d.top };
    if (dx === 1) return { ...d, bottom: d.e, w: d.bottom, top: d.w, e: d.top };
    return { ...d, bottom: d.w, e: d.bottom, top: d.e, w: d.top };
  };
  while (queue.length) {
    const [x, y] = queue.shift();
    const d = seen.get(`${x},${y}`);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const k = `${x + dx},${y + dy}`;
      if (set.has(k) && !seen.has(k)) { seen.set(k, roll(d, dx, dy)); queue.push([x + dx, y + dy]); }
    }
  }
  if (seen.size !== 6) return false;
  return new Set([...seen.values()].map(d => d.bottom)).size === 6;
}
function randomPoly(n) {
  const cs = [[0, 0]], set = new Set(['0,0']);
  while (cs.length < n) {
    const [x, y] = pick(cs), [dx, dy] = pick([[1, 0], [-1, 0], [0, 1], [0, -1]]);
    const k = `${x + dx},${y + dy}`;
    if (!set.has(k)) { set.add(k); cs.push([x + dx, y + dy]); }
  }
  return norm(cs);
}

// A bag of marbles.
function bag(counts, size = 150) {
  const balls = shuffle(Object.entries(counts).flatMap(([c, k]) => Array(k).fill(c)));
  const cols = Math.ceil(Math.sqrt(balls.length * 1.3));
  const r = Math.min(9, 60 / cols);
  let body = `<path d="M30 40 Q10 120 60 128 Q110 120 90 40 Z" fill="#f3e6d8" stroke="${INK}" stroke-width="4"/><path d="M36 40 L84 40" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`;
  balls.forEach((c, i) => {
    const row = Math.floor(i / cols), col = i % cols;
    body += `<circle cx="${60 - ((cols - 1) * r * 2.1) / 2 + col * r * 2.1}" cy="${118 - row * r * 2.1}" r="${r}" fill="${COL[c]}" stroke="${INK}" stroke-width="1.5"/>`;
  });
  return svg(120, 135, body, 'shape', `width="${size}" height="${size * 1.1}"`);
}

// A spinner: sectors are [color, parts] out of total parts.
function spinner(sectors, size = 150) {
  const total = sectors.reduce((s, x) => s + x[1], 0);
  let a = -Math.PI / 2, body = '';
  for (const [c, k] of sectors) {
    for (let j = 0; j < k; j++) {
      const a1 = a + (2 * Math.PI) / total;
      const p = t => `${(60 + 52 * Math.cos(t)).toFixed(1)} ${(60 + 52 * Math.sin(t)).toFixed(1)}`;
      body += `<path d="M60 60 L${p(a)} A52 52 0 0 1 ${p(a1)} Z" fill="${COL[c]}" stroke="#fff" stroke-width="2"/>`;
      a = a1;
    }
  }
  body += `<circle cx="60" cy="60" r="54" fill="none" stroke="${INK}" stroke-width="4"/><path d="M60 60 L88 30" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><circle cx="60" cy="60" r="6" fill="${INK}"/>`;
  return svg(120, 120, body, 'shape', `width="${size}" height="${size}"`);
}

// A bar chart: labels are emoji or die faces, values are counts.
function barChart(labels, values, max = null) {
  const top = max || Math.ceil(Math.max(...values) / 2) * 2;
  const H = 120, bw = 34, gap = 14, ox = 30;
  let body = '';
  for (let v = 0; v <= top; v += top > 12 ? 5 : top > 6 ? 2 : 1) {
    const y = 10 + H - (v / top) * H;
    body += `<line x1="${ox - 4}" y1="${y}" x2="${ox + labels.length * (bw + gap)}" y2="${y}" stroke="#d6dbe8" stroke-width="1"/>${txt(ox - 14, y, v, 11)}`;
  }
  labels.forEach((l, i) => {
    const h = (values[i] / top) * H, x = ox + gap / 2 + i * (bw + gap);
    body += `<rect x="${x}" y="${10 + H - h}" width="${bw}" height="${h}" fill="${[COL.blue, COL.yellow, COL.green, COL.red, COL.purple, '#f48a82'][i]}" stroke="${INK}" stroke-width="2"/>`;
    body += `<text x="${x + bw / 2}" y="${H + 30}" font-size="20" text-anchor="middle" dominant-baseline="central">${l}</text>`;
  });
  body += `<line x1="${ox}" y1="10" x2="${ox}" y2="${H + 10}" stroke="${INK}" stroke-width="3"/><line x1="${ox}" y1="${H + 10}" x2="${ox + labels.length * (bw + gap)}" y2="${H + 10}" stroke="${INK}" stroke-width="3"/>`;
  const W = ox + labels.length * (bw + gap) + 10;
  const sw = Math.min(240, W * 1.15);
  return svg(W, H + 46, body, 'shape chart', `width="${Math.round(sw)}" height="${Math.round((sw * (H + 46)) / W)}"`);
}

const colorChoices = cs => shuffle(cs.slice()).map(c => ({ value: c, html: dot(c) }));

// ---------- 1. Numbers to 1,000 ----------
function genN1000(lvl) {
  const kind = pick([['blocks', 'blocks', 'cmp', 'track'], ['blocks', 'cmp', 'track', 'round'], ['cmp', 'track', 'round', 'round']][lvl]);
  const n = lvl === 0 ? R(101, 499) : R(101, 999);
  if (kind === 'blocks') {
    const h = Math.floor(n / 100), t = Math.floor(n / 10) % 10, o = n % 10;
    return numQ('?', n, [h * 100 + o * 10 + t, t * 100 + h * 10 + o, n + 10, n - 10, n + 100].filter(v => v > 0 && v < 1000), { visual: place(n), show: true });
  }
  if (kind === 'cmp') {
    const m = pick([n + pick([1, -1, 10, -10, 9, -9]), Number(String(n).split('').reverse().join('')), n + 100 * pick([1, -1])].filter(v => v >= 100 && v <= 999));
    const y = chance(0.1) ? n : m;
    return cmpQ(String(n), String(y), n, y);
  }
  if (kind === 'track') {
    const step = lvl === 0 ? pick([10, 100]) : lvl === 1 ? pick([10, 100, 5, 50]) : pick([25, 50, 20, 100, -10, -100, -50]);
    const len = 5, start = step > 0 ? R(100, 999 - step * (len - 1)) : R(100 - step * (len - 1), 999);
    const items = Array.from({ length: len }, (_, i) => start + i * step);
    const hole = R(1, len - 1), ans = items[hole];
    items[hole] = '❓';
    return { eq: '', ...numQ('', ans, [ans + 1, ans - 1, ans + Math.abs(step), ans - Math.abs(step), ans + 10, ans - 10]), visual: row(items), show: true };
  }
  // round to the nearer ten (or hundred)
  const unit = lvl === 2 && chance(0.6) ? 100 : 10;
  let v = n;
  while (v % unit === unit / 2 || v % unit === 0) v = R(101, 999);
  const lo = Math.floor(v / unit) * unit, hi = lo + unit, ans = v - lo < hi - v ? lo : hi;
  return {
    eq: `${v} ≈ ?`, answer: ans, input: 'choice', visual: numberLine(lo, hi, v), show: lvl < 2,
    choices: shuffle([lo, hi, lo - unit, hi + unit]).map(x => ({ value: x, html: String(x) })),
  };
}

// ---------- 2. Numbers to 10,000 ----------
function genN10k(lvl) {
  const kind = pick([['coins', 'coins', 'cmp', 'track'], ['coins', 'digit', 'cmp', 'track'], ['digit', 'cmp', 'track', 'track']][lvl]);
  const n = R(1001, 9999);
  if (kind === 'coins') {
    const lim = lvl === 0 ? 4 : 9;
    const v = R(1, lim) * 1000 + R(0, lim) * 100 + R(0, lim) * 10 + R(0, lim);
    return numQ('?', v, [v + 1000, v - 100, v + 10, v + 100, v - 1000].filter(x => x > 0), { visual: coins(v), show: true });
  }
  if (kind === 'digit') {
    const s = String(n);
    let i = R(0, 3);
    while (s[i] === '0') i = R(0, 3);
    const d = +s[i], val = d * 10 ** (3 - i);
    const html = s.split('').map((c, j) => (j === i ? `<u class="hl">${c}</u>` : c)).join('');
    return { eq: `${html} → ?`, answer: val, input: 'choice', visual: null, show: false, choices: shuffle([d, d * 10, d * 100, d * 1000]).map(v => ({ value: v, html: String(v) })) };
  }
  if (kind === 'cmp') {
    const s = String(n);
    const swapped = +(s[0] + s[2] + s[1] + s[3]);
    const m = pick([n + pick([1, -1, 10, -10, 100, -100]), swapped, n + pick([990, -990, 1000, -1000])].filter(v => v >= 1000 && v <= 9999));
    const y = chance(0.1) ? n : m;
    return cmpQ(String(n), String(y), n, y);
  }
  const step = lvl === 0 ? pick([1000, 100]) : lvl === 1 ? pick([1000, 100, 500, -100]) : pick([250, 500, -1000, -250, 1100]);
  const len = 4, start = step > 0 ? R(1000, 9999 - step * (len - 1)) : R(1000 - step * (len - 1), 9999);
  const items = Array.from({ length: len }, (_, i) => start + i * step);
  const hole = R(1, len - 1), ans = items[hole];
  items[hole] = '❓';
  return { ...numQ('', ans, [ans + 10, ans - 10, ans + 100, ans - 100, ans + Math.abs(step)]), eq: '', visual: row(items), show: true };
}

// ---------- 3. Big + and − ----------
function column(a, op, b) {
  const w = Math.max(String(a).length, String(b).length) + 1;
  const pad = (s, c = ' ') => String(s).padStart(w, c);
  return `<div class="column"><div>${pad(a).replace(/ /g, '&nbsp;')}</div><div>${(op + String(b).padStart(w - 1)).replace(/ /g, '&nbsp;')}</div><div class="colline"></div></div>`;
}
function noCarry(a, b) { while (a || b) { if ((a % 10) + (b % 10) > 9) return false; a = Math.floor(a / 10); b = Math.floor(b / 10); } return true; }
function noBorrow(a, b) { while (b) { if (a % 10 < b % 10) return false; a = Math.floor(a / 10); b = Math.floor(b / 10); } return true; }
function addNoCarryWrong(a, b) { let r = 0, p = 1; while (a || b) { r += (((a % 10) + (b % 10)) % 10) * p; a = Math.floor(a / 10); b = Math.floor(b / 10); p *= 10; } return r; }
function genBigAdd(lvl) {
  const big = lvl === 2 && chance(0.5);
  const lo = big ? 1000 : 100, hi = big ? 9999 : 999;
  const plus = chance(0.55);
  let a, b;
  for (let k = 0; k < 200; k++) {
    a = R(lo, hi); b = R(lvl ? 100 : 101, big ? R(100, a) : Math.min(hi, 999));
    if (plus) {
      if (a + b > (big ? 9999 : 999 + (lvl ? 1000 : 0))) continue;
      if (lvl === 0 ? noCarry(a, b) : !noCarry(a, b)) break;
    } else {
      if (b >= a) continue;
      if (lvl === 0 ? noBorrow(a, b) : !noBorrow(a, b)) break;
    }
  }
  if (plus && a + b > 9999) b = 9999 - a;
  const c = plus ? a + b : a - b;
  if (lvl === 2 && chance(0.35)) {
    // missing number
    return numQ(plus ? `? + ${b} = ${c}` : `${a} − ? = ${c}`, plus ? a : b, near(plus ? a : b, [10, -10, 100, -100, 1]), { visual: column(plus ? c : a, '−', plus ? b : c), show: false });
  }
  if (chance(0.15)) {
    const wrong = plus ? addNoCarryWrong(a, b) : c + 10;
    const truth = chance(0.5) || wrong === c;
    return tfQ(`${a} ${plus ? '+' : '−'} ${b}`, truth ? c : wrong, truth);
  }
  const mistakes = plus ? [addNoCarryWrong(a, b), c + 10, c - 10, c + 100] : [c + 10, c - 10, c + 100, c - 100];
  return numQ(`${a} ${plus ? '+' : '−'} ${b} = ?`, c, mistakes.filter(v => v !== c && v > 0), { visual: column(a, plus ? '+' : '−', b), show: false });
}

// ---------- 4. Bigger × ----------
function genBigMul(lvl) {
  const kind = pick([['tens', 'tens', 'split'], ['split', 'split', 'tens'], ['split', 'split', 'three', 'missing']][lvl]);
  if (kind === 'tens') {
    const a = R(2, lvl ? 99 : 20), m = pick(lvl ? [10, 100, 20, 30, 50] : [10, 100]);
    const c = a * m;
    return numQ(`${a} × ${m} = ?`, c, [c * 10, c / 10, a * (m + 10), a + m].filter(Number.isInteger));
  }
  const a = kind === 'three' ? R(101, 399) : R(lvl ? 12 : 11, lvl ? 99 : 25), b = R(2, kind === 'three' ? 5 : 9);
  const c = a * b;
  const t = Math.floor(a / 10) * 10, o = a % 10;
  const wrong = [t * b + o, Math.floor(a / 10) * b * 10 + o * b + 10, c + b, c - b, c + 10].filter(v => v !== c);
  if (kind === 'missing') return numQ(`? × ${b} = ${c}`, a, [a + 1, a - 1, a + 10, a - 10], { visual: areaModel(a, b), show: false });
  return numQ(`${a} × ${b} = ?`, c, wrong, { visual: areaModel(a, b), show: false });
}

// ---------- 5. Division as sharing ----------
function genShare(lvl) {
  const k = lvl === 0 ? R(2, 4) : R(2, 9), q = lvl === 0 ? R(2, 5) : R(2, 10), n = k * q;
  if (lvl === 0) return numQ(`${n} ÷ ${k} = ?`, q, [q + 1, q - 1, k, n - k], { visual: shareVis(n, k, false), show: true });
  if (lvl === 2 && chance(0.5)) {
    return chance(0.5)
      ? numQ(`? ÷ ${k} = ${q}`, n, [n + k, n - k, k + q, n + 1])
      : numQ(`${n} ÷ ? = ${q}`, k, [k + 1, k - 1, q, n - q]);
  }
  return numQ(`${n} ÷ ${k} = ?`, q, [q + 1, q - 1, k, q + 2], { visual: shareVis(n, k, true), show: false });
}

// ---------- 6. ÷ and × are partners ----------
function genDivX(lvl) {
  const kind = pick([['tri', 'tri', 'family'], ['tri', 'family', 'rem'], ['rem', 'rem', 'family', 'tri']][lvl]);
  const a = R(2, 9), b = R(2, 9), c = a * b;
  if (kind === 'tri') {
    const hole = pick(lvl === 0 ? ['top', 'a'] : ['top', 'a', 'b']);
    const ans = hole === 'top' ? c : hole === 'a' ? a : b;
    return numQ('?', ans, hole === 'top' ? [a + b, c + a, c - b] : [ans + 1, ans - 1, c - ans], {
      visual: factTri(hole === 'top' ? '?' : c, hole === 'a' ? '?' : a, hole === 'b' ? '?' : b), show: true,
    });
  }
  if (kind === 'family') {
    return numQ(`${a} × ${b} = ${c}<br>${c} ÷ ${a} = ?`, b, [a, b + 1, b - 1, c - a], { small: true });
  }
  const r = R(1, a - 1 || 1), n = c + (a > 1 ? r : 0);
  const rr = n - Math.floor(n / a) * a;
  if (lvl === 2 && chance(0.4)) return numQ(`? ÷ ${a} = ${Math.floor(n / a)} <small>r</small> ${rr}`, n, [n + 1, n - 1, c, n + a]);
  return numQ(`${n} ÷ ${a} = ${Math.floor(n / a)} <small>r</small> ?`, rr, [rr + 1, rr - 1, a - rr, rr + a].filter(v => v >= 0), { visual: shareVis(n, a, true), show: false });
}

// ---------- 7. Parts of a whole ----------
function genFrac(lvl) {
  const kind = pick([['name', 'name', 'cmp'], ['name', 'cmp', 'of', 'cmp'], ['cmp', 'of', 'equal', 'of']][lvl]);
  if (kind === 'name') {
    const k = pick(lvl ? [3, 4, 5, 6, 8] : [2, 3, 4]), s = R(1, k - 1);
    const vis = chance(0.6) ? pizza(k, s, 140) : chocolate(k, s, 200);
    // wrong answers count the empty slices, miscount the slices, or flip the fraction; none equals the answer
    const wrong = [[k - s, k], [s, k + 1], [s + 1, k], [s, k - 1], [s - 1, k], [k, s], [s, k + 2]]
      .filter(([n, d]) => n > 0 && d > 1 && n * k !== s * d);
    const uniq = [[s, k], ...[...new Map(wrong.map(o => [o.join('/'), o])).values()].slice(0, 3)];
    return { eq: '?', answer: `${s}/${k}`, input: 'choice', visual: vis, show: true, choices: shuffle(uniq.map(([n, d]) => ({ value: `${n}/${d}`, html: frac(n, d) }))) };
  }
  if (kind === 'cmp') {
    let n1, d1, n2, d2;
    if (lvl === 0) { d1 = d2 = pick([3, 4, 5, 6, 8]); n1 = R(1, d1 - 1); n2 = R(1, d2 - 1); }
    else if (lvl === 1) { n1 = n2 = R(1, 3); d1 = R(n1 + 1, 9); d2 = R(n2 + 1, 9); }
    else { d1 = pick([2, 3, 4, 6]); d2 = pick([4, 6, 8, 12].filter(d => d !== d1)); n1 = R(1, d1 - 1); n2 = R(1, d2 - 1); }
    return { ...cmpQ(frac(n1, d1), frac(n2, d2), n1 / d1, n2 / d2, pair(pizza(d1, n1, 90), '', pizza(d2, n2, 90))), show: lvl === 0 };
  }
  if (kind === 'of') {
    const d = pick([2, 3, 4, 5]), k = R(2, lvl === 2 ? 10 : 6), n = lvl === 2 ? R(1, d - 1) : 1, whole = d * k;
    return numQ(`${frac(n, d)} × ${whole} = ?`, n * k, [k, whole - n * k, n * k + 1, whole / n].filter(v => Number.isInteger(v)));
  }
  const good = shuffle([[1, 2], [2, 4], [3, 6], [4, 8], [5, 10]]).slice(0, R(2, 3));
  const bad = shuffle([[1, 3], [2, 3], [3, 4], [2, 5], [3, 5], [1, 4], [4, 6]]).slice(0, 6 - good.length);
  return findAllQ(frac(1, 2), good.map(([n, d]) => frac(n, d)), bad.map(([n, d]) => frac(n, d)));
}

// ---------- 8. Clock ----------
function genClock(lvl) {
  const h = R(1, 12);
  const m = lvl === 0 ? pick([0, 30]) : lvl === 1 ? pick([0, 15, 30, 45, 5, 10, 20, 25, 35, 40, 50, 55]) : R(0, 11) * 5;
  const wrongs = [hm(h, (m + 30) % 60), hm((h % 12) + 1, m), hm(m / 5 || 12, h * 5 % 60), hm(h === 1 ? 12 : h - 1, m), hm(h, (m + 15) % 60)];
  if (lvl === 2 && chance(0.4)) {
    const add = pick([15, 20, 25, 30, 40, 45]);
    const t = h * 60 + m + add, h2 = ((Math.floor(t / 60) - 1) % 12) + 1, m2 = t % 60;
    const ans = hm(h2, m2);
    const opts = [...new Set([ans, hm(h, (m + add) % 60), hm((h2 % 12) + 1, m2), hm(h2, (m2 + 10) % 60), hm(h2, Math.abs(m2 - 10))])].slice(0, 4);
    return { eq: `+${add} = ?`, answer: ans, input: 'choice', visual: clock(h, m), show: true, choices: shuffle(opts.map(v => ({ value: v, html: v }))) };
  }
  const ans = hm(h, m);
  const opts = [...new Set([ans, ...shuffle(wrongs)])].slice(0, 4);
  if (lvl === 2 && chance(0.5)) {
    // digital to analog
    return { eq: `${ans} = ?`, answer: ans, input: 'choice', visual: null, show: false, choices: shuffle(opts.map(v => { const [hh, mm] = v.split(':').map(Number); return { value: v, html: clock(hh, mm, 78) }; })) };
  }
  return { eq: '?', answer: ans, input: 'choice', visual: clock(h, m), show: true, choices: shuffle(opts.map(v => ({ value: v, html: v }))) };
}

// ---------- 9. Angles ----------
function genAngle(lvl) {
  const kind = pick([['right', 'bigger'], ['right', 'bigger', 'deg'], ['deg', 'bigger', 'straight', 'right']][lvl]);
  if (kind === 'right') {
    const nGood = R(2, 3), items = [];
    for (let i = 0; i < nGood; i++) items.push(angleVis(90, { rot: R(0, 11) * 30, size: 70, mark: lvl === 0 }));
    const bad = [];
    while (bad.length < 6 - nGood) bad.push(angleVis(pick(lvl === 0 ? [40, 60, 130, 150] : [40, 60, 120, 140, 70, 110]), { rot: R(0, 11) * 30, size: 70, mark: lvl === 0 }));
    return { eq: '', input: 'multi', target: angleVis(90, { size: 60 }), items: shuffle([...items.map(html => ({ html, ok: true })), ...bad.map(html => ({ html, ok: false }))]), visual: null, show: false, grid3: true };
  }
  if (kind === 'bigger') {
    const d1 = R(3, 15) * 10;
    let d2 = chance(0.12) ? d1 : d1 + pick([-1, 1]) * (lvl === 2 ? 20 : 40);
    if (d2 < 20 || d2 > 170) d2 = d1 > 90 ? d1 - 40 : d1 + 40;
    // the smaller angle gets the longer arms, so kids look at the opening, not the lines
    const la = d1 > d2 ? 38 : 66, lb = d1 > d2 ? 66 : 38;
    const vis = pair(angleVis(d1, { rot: R(0, 3) * 20, l1: la, l2: la, size: 120, mark: false, color: COL.red }), '', angleVis(d2, { rot: R(0, 3) * 20, l1: lb, l2: lb, size: 120, mark: false, color: COL.blue }));
    return { ...cmpQ(dot('red'), dot('blue'), d1, d2, vis), show: true };
  }
  if (kind === 'deg') {
    const d = pick([30, 45, 60, 90, 120, 135, 150, 180]);
    const opts = shuffle([...new Set([d, 180 - d || 90, d + 30, Math.abs(d - 30) || 15, d * 2 > 360 ? 60 : d * 2])].filter(v => v > 0).slice(0, 4));
    if (!opts.includes(d)) opts[0] = d;
    return { eq: '?°', answer: d, input: 'choice', visual: angleVis(d, { rot: R(0, 5) * 15 }), show: true, choices: shuffle(opts).map(v => ({ value: v, html: v + '°' })) };
  }
  const a = R(3, 15) * 10;
  return numQ(`${a}° + ?° = 180°`, 180 - a, [360 - a, 90 - a, a, 190 - a].filter(v => v > 0), { visual: angleVis(180, { mark: true }), show: true });
}

// ---------- 10. Perimeter and area ----------
function lShape(w, h, cw, ch) { return rect(w, h).filter(([x, y]) => !(x >= w - cw && y < ch)); }
function genArea(lvl) {
  const kind = pick([['area', 'perim'], ['area', 'perim', 'area', 'perim'], ['area', 'perim', 'build', 'perim']][lvl]);
  const w = R(2, lvl ? 7 : 5), h = R(2, lvl ? 5 : 4);
  if (kind === 'build') {
    const target = pick([12, 18, 20, 24, 16]);
    const good = productsOf12(target);
    const [gw, gh] = pick(good);
    const bads = [];
    while (bads.length < 3) {
      const bw = R(2, 7), bh = R(2, 5);
      if (bw * bh !== target && !bads.some(([x, y]) => x === bw && y === bh)) bads.push([bw, bh]);
    }
    const opts = shuffle([[gw, gh], ...bads]);
    return {
      eq: `${target} = ?`, answer: `${gw}x${gh}`, input: 'choice', visual: null, show: false,
      choices: opts.map(([x, y]) => ({ value: `${x}x${y}`, html: tiles(rect(x, y), { grid: false, labels: [x, y], size: 90, fill: COL.yellow }) })),
    };
  }
  const L = lvl >= 1 && chance(0.5);
  const cw = L ? R(1, w - 1) : 0, ch = L ? R(1, h - 1) : 0;
  const cells = L ? lShape(w, h, cw, ch) : rect(w, h);
  const labelled = lvl === 2 && !L;
  if (kind === 'area') {
    return numQ('🟦 = ?', cells.length, [cells.length + 1, cells.length - 1, 2 * (w + h), w + h], { visual: tiles(cells, { grid: !labelled, labels: labelled ? [w, h] : null }), show: true });
  }
  const per = 2 * (w + h); // an L-shape has the same fence as its full rectangle
  return numQ('🦀 = ?', per, [cells.length, per - 2, w + h, per + 2], { visual: tiles(cells, { grid: !labelled && lvl < 2, labels: lvl === 2 ? [w, h] : null, crab: true, fill: '#bfe3f7' }), show: true });
}
function productsOf12(t) { const out = []; for (let a = 2; a <= 7; a++) if (t % a === 0 && t / a >= 2 && t / a <= 6) out.push([a, t / a]); return out.length ? out : [[2, t / 2]]; }

// ---------- 11. Turns and nets ----------
const CHIRAL = [[[0, 0], [1, 0], [2, 0], [2, 1]], [[0, 0], [1, 0], [1, 1], [2, 1]], [[0, 0], [0, 1], [1, 1], [1, 2], [2, 1]], [[0, 0], [1, 0], [2, 0], [3, 0], [3, 1]], [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1]]];
function genTurn(lvl) {
  const kind = pick([['turn', 'turn', 'net'], ['turn', 'net'], ['net', 'net', 'turn']][lvl]);
  if (kind === 'turn') {
    const base = pick(CHIRAL);
    const rots = rotations(base);
    const mirrors = rotations(flipX(base));
    const ans = pick(rots.slice(1).filter(r => keyOf(r) !== keyOf(rots[0])));
    const rk = new Set(rots.map(keyOf));
    const pool = shuffle([...new Map(mirrors.filter(m => !rk.has(keyOf(m))).map(m => [keyOf(m), m])).values()]);
    const opts = [ans, ...pool.slice(0, lvl === 0 ? 2 : 3)];
    return {
      eq: '?', answer: keyOf(ans), input: 'choice', layout: opts.length < 4 ? 'row' : 'grid', visual: cellsSvg(rots[0], 110, COL.blue), show: true,
      choices: shuffle(opts.map(cs => ({ value: keyOf(cs), html: cellsSvg(cs, 66, COL.blue) }))),
    };
  }
  let good;
  do good = randomPoly(6); while (!foldsToCube(good));
  const bad = [], keys = new Set();
  while (bad.length < 3) {
    const cs = randomPoly(6);
    if (!foldsToCube(cs) && !keys.has(keyOf(cs))) { keys.add(keyOf(cs)); bad.push(cs); }
  }
  return {
    eq: '? = 🧊', answer: keyOf(good), input: 'choice', visual: null, show: false,
    choices: shuffle([good, ...bad].map(cs => ({ value: keyOf(cs), html: cellsSvg(cs, 78, COL.yellow) }))),
  };
}

// ---------- 12. Likely or unlikely ----------
function genLikely(lvl) {
  const kind = pick([['most', 'most'], ['most', 'count', 'count'], ['count', 'better', 'better']][lvl]);
  const colors = shuffle(['red', 'blue', 'green', 'yellow']).slice(0, lvl === 0 ? 2 : 3);
  if (kind === 'most') {
    const counts = {};
    const nums = shuffle(lvl === 0 ? [R(6, 9), R(1, 3)] : [R(5, 8), R(2, 4), R(1, 2)]);
    colors.forEach((c, i) => { counts[c] = nums[i]; });
    const best = colors.reduce((a, b) => (counts[a] > counts[b] ? a : b));
    const choices = colorChoices(lvl === 0 ? [...colors, pick(['green', 'purple'].filter(c => !colors.includes(c)))] : colors);
    return { eq: '✋ = ?', answer: best, input: 'choice', layout: 'row', visual: bag(counts), show: true, choices };
  }
  if (kind === 'count') {
    const counts = {};
    colors.forEach(c => { counts[c] = R(1, 5); });
    const c = pick(colors), total = colors.reduce((s, x) => s + counts[x], 0);
    return { ...numQ(`${dot(c)} = ${frac('?', total)}`, counts[c], [total - counts[c], counts[c] + 1, total]), visual: bag(counts), show: true, small: true };
  }
  // which bag makes red more likely? The bag with more reds is not always the better one.
  for (;;) {
    const r1 = R(1, 5), o1 = R(1, 6), r2 = R(1, 5), o2 = R(1, 6);
    const p1 = r1 / (r1 + o1), p2 = r2 / (r2 + o2);
    if (Math.abs(p1 - p2) < 0.12) continue;
    if (lvl === 2 && (r1 > r2) === (p1 > p2) && chance(0.7)) continue; // prefer the tricky ones
    return {
      eq: `${dot('red')} ✋ ?`, answer: p1 > p2 ? 'a' : 'b', input: 'choice', layout: 'pair', visual: null, show: false,
      choices: [{ value: 'a', html: bag({ red: r1, blue: o1 }, 110) }, { value: 'b', html: bag({ red: r2, blue: o2 }, 110) }],
    };
  }
}

// ---------- 13. Try it and see: spinners, charts and an unfair die ----------
const SEA = ['🐟', '🐠', '🐡', '🦀', '🐙'];
const DIE = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
function genSpin(lvl) {
  const kind = pick([['spin', 'chartTop'], ['spin', 'chartRead', 'chartTop'], ['chartMore', 'die', 'spin', 'chartRead']][lvl]);
  if (kind === 'spin') {
    const cs = shuffle(['red', 'blue', 'green', 'yellow']).slice(0, 3);
    const parts = shuffle(lvl === 0 ? [5, 2, 1] : [4, 3, 1]);
    const sectors = shuffle(cs.map((c, i) => [c, parts[i]]));
    const best = sectors.reduce((a, b) => (a[1] > b[1] ? a : b))[0];
    // on harder levels the biggest colour is split into two pieces, so it doesn't look biggest at a glance
    const others = sectors.filter(([c]) => c !== best), bk = sectors.find(([c]) => c === best)[1];
    const drawn = lvl ? [[best, Math.ceil(bk / 2)], others[0], [best, Math.floor(bk / 2)], others[1]] : sectors;
    return { eq: '? ', answer: best, input: 'choice', layout: 'row', visual: spinner(drawn), show: true, choices: colorChoices(cs) };
  }
  const labels = shuffle(SEA.slice()).slice(0, 4);
  let vals;
  do vals = labels.map(() => R(1, lvl === 0 ? 8 : 12)); while (new Set(vals).size < 4);
  if (kind === 'chartTop') {
    const best = labels[vals.indexOf(Math.max(...vals))];
    return { eq: '? ⬆', answer: best, input: 'choice', layout: 'row', visual: barChart(labels, vals), show: true, choices: shuffle(labels.map(l => ({ value: l, html: l }))) };
  }
  if (kind === 'chartRead') {
    const i = R(0, 3);
    return numQ(`${labels[i]} = ?`, vals[i], [vals[i] + 1, vals[i] - 1, vals[(i + 1) % 4]].filter(v => v >= 0), { visual: barChart(labels, vals), show: true });
  }
  if (kind === 'chartMore') {
    const [i, j] = shuffle([0, 1, 2, 3]);
    const a = Math.max(vals[i], vals[j]) === vals[i] ? i : j, b = a === i ? j : i;
    return numQ(`${labels[a]} − ${labels[b]} = ?`, vals[a] - vals[b], [vals[a] + vals[b], vals[a], vals[b], vals[a] - vals[b] + 1], { visual: barChart(labels, vals), show: true });
  }
  // an unfair die: one face comes up much more often in 60 rolls
  const loaded = R(0, 5);
  const counts = DIE.map((_, i) => (i === loaded ? R(20, 26) : R(5, 10)));
  return { eq: '🎲 ?', answer: DIE[loaded], input: 'choice', visual: barChart(DIE, counts), show: true, choices: shuffle(shuffle(DIE.slice()).filter(d => d !== DIE[loaded]).slice(0, 3).concat(DIE[loaded])).map(d => ({ value: d, html: `<span class="die">${d}</span>` })) };
}

// ---------- Puzzle stops ----------
function missingDigitSum(lvl) {
  for (;;) {
    const a = R(100, 899), b = R(100, 999 - a), c = a + b;
    const plus = chance(0.6);
    const [x, y, z] = plus ? [a, b, c] : [c, b, a]; // x ± y = z
    const which = pick([0, 1]);
    const s = String(which ? y : x), pos = R(0, 2);
    const d = +s[pos];
    if (pos === 0 && d === 0) continue;
    const shown = s.slice(0, pos) + '?' + s.slice(pos + 1);
    // make sure only one digit works
    let count = 0;
    for (let t = pos === 0 ? 1 : 0; t <= 9; t++) {
      const v = +(s.slice(0, pos) + t + s.slice(pos + 1));
      const ok = plus ? (which ? x + v : v + y) === z : (which ? x - v : v - y) === z;
      if (ok) count++;
    }
    if (count !== 1) continue;
    const eq = which ? `${x} ${plus ? '+' : '−'} ${shown} = ${z}` : `${shown} ${plus ? '+' : '−'} ${y} = ${z}`;
    return numQ(eq, d, [d + 1, d - 1, 9 - d, (d + 5) % 10].filter(v => v >= 0 && v <= 9), { small: lvl < 2 });
  }
}
const DIVOPS = { '+': (a, b) => a + b, '−': (a, b) => a - b, '×': (a, b) => a * b, '÷': (a, b) => (b && a % b === 0 ? a / b : NaN) };
function signDiv() {
  for (;;) {
    const op = pick(['÷', '÷', '×', '+', '−']);
    const b = R(2, 9), a = op === '÷' ? b * R(2, 9) : R(2, 30);
    const c = DIVOPS[op](a, b);
    if (!Number.isInteger(c) || c < 0) continue;
    if (Object.keys(DIVOPS).filter(o => DIVOPS[o](a, b) === c).length !== 1) continue;
    return { eq: `${a} ◯ ${b} = ${c}`, answer: op, input: 'choice', layout: 'grid', visual: null, show: false, choices: Object.keys(DIVOPS).map(o => ({ value: o, html: o })) };
  }
}
function machine(lvl) {
  const x = R(2, 12), m = R(2, lvl ? 9 : 5), a = R(1, 20);
  const plus = chance(0.6), out = plus ? x * m + a : x * m - a;
  if (out < 0) return machine(lvl);
  return numQ(`? <span class="mach">×${m}</span> <span class="mach">${plus ? '+' : '−'}${a}</span> ${out}`, x, [x + 1, x - 1, Math.round(out / m), out - a].filter(v => v > 0), { small: true });
}
function countSquares() {
  const n = pick([2, 3]);
  const ans = n === 2 ? 5 : 14;
  return numQ('? □', ans, n === 2 ? [4, 6, 8] : [9, 10, 13, 16], { visual: tiles(rect(n, n), { grid: true, fill: '#ffe8a3' }), show: true });
}
function stairsPerimeter() {
  // a staircase: its fence is as long as the fence of the full rectangle
  const w = R(3, 5), h = R(3, 4);
  const cells = rect(w, h).filter(([x, y]) => x < Math.max(1, Math.round((w * (y + 1)) / h)));
  const per = 2 * (w + h);
  return numQ('🦀 = ?', per, [per - 2, per + 2, cells.length], { visual: tiles(cells, { crab: true, grid: true, fill: '#bfe3f7' }), show: true });
}
function fracChain() {
  const k = pick([2, 4]), whole = pick([16, 24, 32, 40, 48]);
  const v = whole / 2 / (k === 2 ? 2 : 4);
  return numQ(`${frac(1, 2)} × ${frac(1, k)} × ${whole} = ?`, v, [whole / 2, whole / k, v * 2, v + 1], { small: true });
}
function genOPuzzle(mixed) {
  return lvl => {
    const kinds = mixed ? ['squares', 'stairs', 'fracChain', 'machine', 'sign'] : ['digit', 'digit', 'sign', 'machine'];
    const k = pick(kinds);
    if (k === 'digit') return missingDigitSum(lvl);
    if (k === 'sign') return signDiv();
    if (k === 'machine') return machine(lvl);
    if (k === 'squares') return countSquares();
    if (k === 'stairs') return stairsPerimeter();
    return fracChain();
  };
}

export const OCEAN = [
  { id: 'o-1000', icon: '💯', gen: genN1000 },
  { id: 'o-10k', icon: '🪙', gen: genN10k },
  { id: 'o-add', icon: '🫧', gen: genBigAdd },
  { id: 'o-mul', icon: '🟧', gen: genBigMul },
  { id: 'o-share', icon: '🐟', gen: genShare },
  { id: 'o-divx', icon: '🔺', gen: genDivX },
  { id: 'o-puz1', icon: '🧩', gen: genOPuzzle(false), puzzle: true },
  { id: 'o-frac', icon: '🍕', gen: genFrac },
  { id: 'o-clock', icon: '🕒', gen: genClock },
  { id: 'o-angle', icon: '📐', gen: genAngle },
  { id: 'o-area', icon: '🦀', gen: genArea },
  { id: 'o-turn', icon: '🧊', gen: genTurn },
  { id: 'o-likely', icon: '🎱', gen: genLikely },
  { id: 'o-spin', icon: '🎡', gen: genSpin },
  { id: 'o-puz2', icon: '🧩', gen: genOPuzzle(true), puzzle: true },
];
