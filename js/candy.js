// Candy Factory (world 3): factors and primes, divisibility, fractions (equal, mixed, adding, of, dividing),
// decimals, percent and ratio. Same question format as Meadow and Ocean.
import { R, pick, chance, shuffle, numQ, tfQ, findAllQ, cmpQ } from './skills.js';
import { frac } from './ocean.js';

const INK = '#1e2650';
const CHOC = '#8b5a3c', CREAM = '#f3e6d8', PINK = '#f28dbb', LEMON = '#ffd24a', MINT = '#7fd8b0';
const svg = (w, h, body, size = '') => `<svg class="shape" viewBox="0 0 ${w} ${h}" ${size || `width="${w}" height="${h}"`}>${body}</svg>`;
const txt = (x, y, t, s = 14, extra = '') => `<text x="${x}" y="${y}" font-size="${s}" font-weight="800" fill="${INK}" text-anchor="middle" dominant-baseline="central" ${extra}>${t}</text>`;
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const lcm = (a, b) => (a * b) / gcd(a, b);
const mixed = (w, n, d) => `<span class="mixn">${w}</span>${frac(n, d)}`;

// ---------- answer bubbles that are not whole numbers ----------
// Fractions: value 'n/d', shown as a stacked fraction. Wrong ones never equal the answer in value.
function fracChoices([n, d], wrongs) {
  const seen = new Set([n / d]), out = [{ value: `${n}/${d}`, html: frac(n, d) }];
  for (const [a, b] of shuffle(wrongs.slice())) {
    if (out.length === 4 || !(a > 0 && b > 0) || !Number.isInteger(a) || !Number.isInteger(b) || seen.has(a / b)) continue;
    seen.add(a / b); out.push({ value: `${a}/${b}`, html: frac(a, b) });
  }
  for (let k = 1; out.length < 4; k++) if (!seen.has((n + k) / d)) { seen.add((n + k) / d); out.push({ value: `${n + k}/${d}`, html: frac(n + k, d) }); }
  return shuffle(out);
}
const fracQ = (eq, ans, wrongs, extra = {}) =>
  ({ eq, answer: `${ans[0]}/${ans[1]}`, input: 'choice', layout: 'grid', choices: fracChoices(ans, wrongs), visual: null, show: false, ...extra });

// Decimals are worked out in hundredths, so there are no rounding surprises. dec(135) is '1.35'.
const dec = h => { const s = (h / 100).toFixed(2); return s.replace(/0$/, '').replace(/\.0$/, ''); };
function decQ(eq, ansH, wrongsH, extra = {}) {
  const seen = new Set([ansH]), vals = [ansH];
  for (const w of shuffle(wrongsH.slice())) if (vals.length < 4 && w >= 0 && Number.isInteger(w) && !seen.has(w)) { seen.add(w); vals.push(w); }
  for (let k = 1; vals.length < 4; k++) for (const w of [ansH + k * 10, ansH - k * 10]) if (vals.length < 4 && w >= 0 && !seen.has(w)) { seen.add(w); vals.push(w); }
  return { eq, answer: dec(ansH), input: 'choice', layout: 'grid', visual: null, show: false, ...extra,
    choices: shuffle(vals).map(v => ({ value: dec(v), html: (extra.unit || '') + dec(v) + (extra.after || '') })) };
}

// ---------- pictures ----------
// A box of candies, r rows of c.
function candyBox(r, c, size = 150) {
  const u = Math.min(26, Math.floor(size / Math.max(r, c)));
  let body = `<rect x="4" y="4" width="${c * u + 8}" height="${r * u + 8}" rx="8" fill="#ffe3ef" stroke="${INK}" stroke-width="3"/>`;
  for (let y = 0; y < r; y++) for (let x = 0; x < c; x++) body += `<circle cx="${8 + x * u + u / 2}" cy="${8 + y * u + u / 2}" r="${u * 0.36}" fill="${PINK}" stroke="${INK}" stroke-width="1.5"/>`;
  return svg(c * u + 12, r * u + 12, body);
}

// Chocolate bars of the same length, one under the other: each is [pieces, dark pieces].
function bars(list, w = 220) {
  const h = 34, gap = 10;
  let body = '';
  list.forEach(([k, s], j) => {
    const cw = w / k, y = 4 + j * (h + gap);
    for (let i = 0; i < k; i++) body += `<rect x="${4 + i * cw}" y="${y}" width="${cw}" height="${h}" fill="${i < s ? CHOC : CREAM}" stroke="${INK}" stroke-width="2.5"/>`;
  });
  return svg(w + 8, list.length * (h + gap) + 2, body);
}

// Round cakes cut into k slices; the first `total` slices are pink. Shows as many cakes as needed.
function cakes(k, total, count = Math.max(1, Math.ceil(total / k)), size = count > 3 ? 56 : 78) {
  let out = '';
  for (let c = 0; c < count; c++) {
    let body = `<circle cx="40" cy="40" r="35" fill="#fff4e0" stroke="${INK}" stroke-width="3"/>`;
    for (let i = 0; i < k; i++) {
      const a0 = (i / k) * 2 * Math.PI - Math.PI / 2, a1 = ((i + 1) / k) * 2 * Math.PI - Math.PI / 2;
      const p = a => `${(40 + 35 * Math.cos(a)).toFixed(1)} ${(40 + 35 * Math.sin(a)).toFixed(1)}`;
      const on = c * k + i < total;
      body += k === 1 ? `<circle cx="40" cy="40" r="35" fill="${on ? PINK : '#fff4e0'}" stroke="${INK}" stroke-width="3"/>`
        : `<path d="M40 40 L${p(a0)} A35 35 0 0 1 ${p(a1)} Z" fill="${on ? PINK : '#fff4e0'}" stroke="${INK}" stroke-width="2.5"/>`;
    }
    out += svg(80, 80, body, `width="${size}" height="${size}"`);
  }
  return `<div class="cakes">${out}</div>`;
}

// A tray folded one way (a of b columns, yellow) and then the other (c of d rows, pink stripes).
function tray(b, a, d, c, size = 170) {
  const u = Math.floor(Math.min(size / b, 120 / d)), W = b * u, H = d * u;
  let body = '';
  for (let y = 0; y < d; y++) for (let x = 0; x < b; x++) {
    const inA = x < a, inC = y < c;
    body += `<rect x="${6 + x * u}" y="${6 + y * u}" width="${u}" height="${u}" fill="${inA && inC ? '#e0457b' : inA ? LEMON : inC ? '#f9c6dc' : '#fff'}" stroke="${INK}" stroke-width="1.5"/>`;
  }
  body += `<rect x="6" y="6" width="${W}" height="${H}" fill="none" stroke="${INK}" stroke-width="3.5"/>`;
  return svg(W + 12, H + 12, body);
}

// n candies on a tray in b equal groups.
function groups(n, b) {
  const m = n / b;
  return `<div class="cgroups${n > 30 ? ' many' : ''}">${`<span class="cgroup">${'🍬'.repeat(m)}</span>`.repeat(b)}</div>`;
}

// A 10 × 10 chocolate grid with the first n squares dark (whole rows first, so tenths are rows).
function grid100(n, size = 150) {
  const u = size / 10;
  let body = '';
  for (let i = 0; i < 100; i++) body += `<rect x="${3 + (i % 10) * u}" y="${3 + Math.floor(i / 10) * u}" width="${u}" height="${u}" fill="${i < n ? CHOC : CREAM}" stroke="${INK}" stroke-width="1"/>`;
  return svg(size + 6, size + 6, body + `<rect x="3" y="3" width="${size}" height="${size}" fill="none" stroke="${INK}" stroke-width="3"/>`);
}

// A number line from a to a + 1 in tenths, with an arrow at a + t/10.
function decLine(a, t) {
  const x = v => 20 + v * 22;
  let body = `<line x1="20" y1="50" x2="240" y2="50" stroke="${INK}" stroke-width="3"/>`;
  for (let i = 0; i <= 10; i++) body += `<line x1="${x(i)}" y1="${i % 5 ? 43 : 37}" x2="${x(i)}" y2="57" stroke="${INK}" stroke-width="2"/>`;
  body += txt(20, 74, a, 15) + txt(240, 74, a + 1, 15) + `<path d="M${x(t)} 36 l-7 -13 h14z" fill="#ef5b52"/>`;
  return svg(260, 88, body);
}

// A battery with 10 bars, the first `full` of them green.
function battery(full) {
  let body = `<rect x="4" y="4" width="200" height="56" rx="8" fill="#fff" stroke="${INK}" stroke-width="4"/><rect x="204" y="20" width="12" height="24" rx="3" fill="${INK}"/>`;
  for (let i = 0; i < 10; i++) body += `<rect x="${10 + i * 19.2}" y="10" width="16" height="44" rx="3" fill="${i < full ? MINT : '#eef0f5'}"/>`;
  return svg(220, 64, body);
}

// A price tag with a sale sticker.
const saleTag = (price, pct) => `<div class="saletag"><span class="tagp">${price}</span><span class="tagoff">−${pct}%</span></div>`;

// Cups of flour split into scoops of 1/k.
function cups(n, k) {
  let out = '';
  for (let c = 0; c < n; c++) {
    let body = `<path d="M8 8 h54 l-6 62 h-42 z" fill="#fff" stroke="${INK}" stroke-width="3"/>`;
    for (let i = 1; i < k; i++) { const y = 8 + (62 * i) / k; body += `<line x1="${8 + (6 * (y - 8)) / 62}" y1="${y}" x2="${62 - (6 * (y - 8)) / 62}" y2="${y}" stroke="${INK}" stroke-width="2" stroke-dasharray="4 3"/>`; }
    out += svg(70, 76, body, 'width="56" height="61"');
  }
  return `<div class="cakes">${out}</div>`;
}

// A drink mix: a strawberries and b lemons.
const mixVis = (a, b) => `<div class="mixrow"><span>${'🍓'.repeat(a)}</span><span>${'🍋'.repeat(b)}</span></div>`;
const mixHTML = (a, b) => `<span class="mixc"><b>${a}🍓</b> <b>${b}🍋</b></span>`;

// ---------- 1. Rectangle factory: factors and primes ----------
const pairsOf = n => { const out = []; for (let r = 1; r * r <= n; r++) if (n % r === 0) out.push([r, n / r]); return out; };
const isPrime = n => n > 1 && pairsOf(n).length === 1;
// Only one long row fits, never a box with two or more rows.
const ONE_ROW = `<span class="onebox"><span class="rowbox">${'<i></i>'.repeat(6)}</span><b class="okmark">✓</b><span class="rowbox two">${'<i></i>'.repeat(6)}</span><b class="nomark">✗</b></span>`;
function genRect(lvl) {
  const kind = pick([['side', 'side', 'whichbox', 'whichbox'], ['side', 'shapes', 'shapes', 'prime'], ['shapes', 'prime', 'allboxes', 'allboxes']][lvl]);
  if (kind === 'side') {
    const r = R(2, lvl ? 6 : 4), c = R(2, lvl ? 9 : 6), n = r * c;
    return numQ(`${r} × ? = ${n}`, c, [c + 1, c - 1, n - r, r], { visual: candyBox(r, c), show: lvl === 0 });
  }
  if (kind === 'whichbox') {
    const n = R(6, 12);
    const boxOf = m => { const ps = pairsOf(m).filter(p => p[0] > 1); const [r, c] = ps.length ? pick(ps) : [1, m]; return candyBox(r, c, 110); };
    const counts = shuffle([n - 2, n - 1, n + 1, n + 2, n + 3].filter(m => m > 2)).slice(0, 3);
    const choices = shuffle([n, ...counts].map((m, i) => ({ value: m === n ? 'yes' : 'no' + i, html: boxOf(m) })));
    return { eq: `🍬 ${n}`, answer: 'yes', input: 'choice', layout: 'grid', choices, visual: null, show: false, boxes: true };
  }
  if (kind === 'shapes') {
    const n = pick(lvl < 2 ? [6, 8, 10, 12, 14, 15, 16, 18, 20, 21] : [12, 16, 18, 20, 24, 28, 30, 32, 36]);
    const ps = pairsOf(n);
    const [r0, c0] = pick(ps.filter(x => x[0] > 1));
    const hint = `<div class="boxset">${candyBox(r0, c0, 110)}<b class="okmark">✓</b></div>`;
    const divisors = ps.reduce((s, [r, c]) => s + (r === c ? 1 : 2), 0);
    return numQ(`🍬 ${n} ➜ ? 📦`, ps.length, [ps.length + 1, ps.length - 1, divisors, ps.length - 1 || 4], { visual: hint, show: false, shapes: true, layout: 'grid' });
  }
  if (kind === 'prime') {
    const hi = lvl < 2 ? 30 : 60;
    for (;;) {
      const nums = new Set();
      while (nums.size < 6) nums.add(R(2, hi));
      const good = [...nums].filter(isPrime), bad = [...nums].filter(n => !isPrime(n));
      if (good.length < 1 || good.length > 3) continue;
      // Hint: a prime that is not on the cards fits one row only; a number that is not on the cards fits a real box.
      const p = pick([2, 3, 5, 7, 11].filter(x => !nums.has(x))), c = pick([4, 6, 8, 9, 10, 12].filter(x => !nums.has(x)));
      const hint = p && c ? `<div class="boxset">${candyBox(1, p, 100)}<b class="okmark">✓</b>${candyBox(...pick(pairsOf(c).filter(x => x[0] > 1)), 70)}<b class="nomark">✗</b></div>` : null;
      return { eq: '', input: 'multi', target: ONE_ROW, visual: hint, show: false, prime: true,
        items: shuffle([...good.map(n => ({ html: String(n), ok: true })), ...bad.map(n => ({ html: String(n), ok: false }))]) };
    }
  }
  const n = pick([12, 16, 18, 20, 24, 30, 36]);
  const good = pairsOf(n).map(([r, c]) => `${r} × ${c}`);
  const bad = new Set();
  while (bad.size < 6 - Math.min(4, good.length)) {
    const r = R(2, 7), c = R(2, 9);
    if (r * c !== n && r <= c) bad.add(`${r} × ${c}`);
  }
  return findAllQ(n, shuffle(good).slice(0, 4), [...bad]);
}

// ---------- 2. Divisibility detectives ----------
function genDivis(lvl) {
  const kind = pick([['belt', 'belt', 'which'], ['belt', 'which', 'digit'], ['belt', 'which', 'digit', 'digit']][lvl]);
  if (kind === 'belt') {
    const k = pick([[2, 5, 10], [3, 9, 2, 5], [3, 4, 6, 9]][lvl]);
    const lo = lvl ? 100 : 10, hi = lvl ? 999 : 99;
    for (;;) {
      const nums = new Set();
      const want = R(2, 3);
      while ([...nums].filter(n => n % k === 0).length < want) nums.add(k * R(Math.ceil(lo / k), Math.floor(hi / k)));
      while (nums.size < 6) { const n = R(lo, hi); if (n % k) nums.add(n); }
      const all = [...nums];
      if (all.filter(n => n % k === 0).length !== want) continue;
      return { eq: '', input: 'multi', target: `<span class="mach">÷${k}</span> ✓`, divisor: k, visual: null, show: false,
        items: shuffle(all.map(n => ({ html: String(n), ok: n % k === 0 }))) };
    }
  }
  if (kind === 'which') {
    const set = pick([[[2, 3, 5]], [[2, 3, 5], [3, 4, 5]], [[4, 5, 7, 9], [3, 4, 5, 7]]][lvl]);
    for (;;) {
      const n = R(lvl ? 100 : 10, lvl ? 999 : 99);
      const ok = set.filter(k => n % k === 0);
      if (ok.length !== 1) continue;
      return { eq: `${n} ➜ <span class="mach">÷ ?</span> ✓`, answer: ok[0], input: 'choice', layout: set.length > 3 ? 'grid' : 'row', visual: null, show: false,
        choices: set.map(k => ({ value: k, html: `÷${k}`, fill: [String(k)] })) };
    }
  }
  // One hidden digit makes the number pass the ÷9 machine (its digits add up to a multiple of 9).
  for (;;) {
    if (lvl === 1) {
      const c = R(0, 9), t = (9 - (c % 9)) % 9 || 9;
      return numQ(`?${c} ➜ <span class="mach">÷9</span> ✓`, t, [t + 1, t - 1, 9 - c, (t + 3) % 10].filter(v => v >= 1 && v <= 9), { small: true, digit9: true });
    }
    const a = R(1, 9), c = R(0, 9), d = (9 - ((a + c) % 9)) % 9;
    if (d === 0) continue;
    return numQ(`${a}?${c} ➜ <span class="mach">÷9</span> ✓`, d, [d + 1, d - 1, 9 - d, (d + 3) % 10].filter(v => v >= 0 && v <= 9), { small: true, digit9: true });
  }
}

// ---------- 3. Same amount, new cuts: equivalent fractions ----------
function genEquiv(lvl) {
  const kind = pick([['scale', 'scale', 'simplify'], ['scale', 'simplify', 'all'], ['simplify', 'all', 'cmp', 'cmp']][lvl]);
  const b = pick(lvl ? [2, 3, 4, 5, 6] : [2, 3, 4]), a = R(1, b - 1);
  if (gcd(a, b) > 1) return genEquiv(lvl);
  const k = pick(lvl ? [2, 3, 4] : [2, 2, 3]);
  if (b * k > 16) return genEquiv(lvl);
  if (kind === 'scale') {
    return numQ(`${frac(a, b)} = ${frac('?', b * k)}`, a * k, [a, a + k, a * k + 1, b * k - a * k, a * k - 1],
      { visual: bars([[b, a], [b * k, a * k]]), show: lvl === 0 });
  }
  if (kind === 'simplify') {
    const topHidden = chance(0.5);
    const eq = topHidden ? `${frac(a * k, b * k)} = ${frac('?', b)}` : `${frac(a * k, b * k)} = ${frac(a, '?')}`;
    const ans = topHidden ? a : b;
    return numQ(eq, ans, topHidden ? [a * k, a + 1, b - a, k] : [b * k, b + 1, b - 1, b + k], { visual: bars([[b * k, a * k], [b, a]]), show: false });
  }
  if (kind === 'all') {
    const good = new Set(), bad = new Set();
    for (const m of shuffle([2, 3, 4, 5])) if (good.size < R(2, 3)) good.add(frac(a * m, b * m));
    const tries = [[a + 1, b + 1], [a * 2, b * 2 + 1], [a, b * 2], [a * 2, b], [b - a, b], [a + 2, b + 2], [a * 3, b * 3 - 1]];
    for (const [x, y] of shuffle(tries)) if (bad.size < 6 - good.size && x > 0 && x * b !== y * a) bad.add(frac(x, y));
    const q = findAllQ(frac(a, b), [...good], [...bad]);
    return { ...q, visual: bars([[b, a]]), show: false, equiv: true, grid3: true };
  }
  // Compare two fractions with different cuts; sometimes they are equal.
  let c, d;
  if (chance(0.25)) { d = b * k; c = a * k; } else { d = pick([3, 4, 5, 6, 8].filter(x => x !== b)); c = R(1, d - 1); if (c * b === a * d) return genEquiv(lvl); }
  const q = cmpQ(frac(a, b), frac(c, d), a * d, c * b, bars([[b, a], [d, c]]));
  q.show = false;
  return q;
}

// ---------- 4. More than one cake: mixed numbers ----------
function genMixed(lvl) {
  const kind = pick([['count', 'count', 'whole'], ['count', 'toMixed', 'toImproper'], ['toMixed', 'toImproper', 'cmp']][lvl]);
  const k = pick(lvl ? [3, 4, 5, 6, 8] : [2, 3, 4]);
  const w = R(1, lvl === 2 ? 4 : 2), r = R(1, k - 1), t = w * k + r;
  if (kind === 'count') return numQ(frac('?', k), t, [t - 1, t + 1, r, w + r, t - k], { visual: cakes(k, t), show: true });
  if (kind === 'whole') {
    const tt = w * k;
    return numQ(`${frac(tt, k)} = ?`, w, [w + 1, tt, k, w - 1], { visual: cakes(k, tt), show: true });
  }
  if (kind === 'toMixed') {
    return chance(0.5)
      ? numQ(`${frac(t, k)} = ${mixed('?', r, k)}`, w, [w + 1, w - 1, t, r, k].filter(v => v > 0), { visual: cakes(k, t), show: false })
      : numQ(`${frac(t, k)} = ${mixed(w, '?', k)}`, r, [r + 1, r - 1, t - k, k - r, t].filter(v => v > 0), { visual: cakes(k, t), show: false });
  }
  if (kind === 'toImproper') return numQ(`${mixed(w, r, k)} = ${frac('?', k)}`, t, [w + r, w * r + k, t - 1, t + k, w * k], { visual: cakes(k, t), show: false });
  const n = R(1, 4), top = n * k + pick([-2, -1, 0, 1, 2]);
  if (top <= 0) return genMixed(lvl);
  const q = cmpQ(frac(top, k), n, top, n * k, cakes(k, top, Math.max(n, Math.ceil(top / k)), 64));
  q.show = false;
  return q;
}

// ---------- 5. Add and take slices ----------
function genAddF(lvl) {
  if (chance(0.2)) {
    // The silly robot adds the tops and the bottoms. Is it right?
    const d = pick([3, 4, 5, 6, 8]), a = R(1, d - 2), b = R(1, d - 1 - a);
    const wrong = chance(0.6);
    return tfQ(`🤖 ${frac(a, d)} + ${frac(b, d)}`, wrong ? frac(a + b, d + d) : frac(a + b, d), !wrong);
  }
  const minus = chance(lvl ? 0.45 : 0.35);
  if (lvl === 0) {
    const d = pick([3, 4, 5, 6, 8, 10]);
    const a = R(1, d - 1), b = R(1, minus ? a : d - a);
    if (minus && a === b) return genAddF(lvl);
    const ans = minus ? a - b : a + b;
    return numQ(`${frac(a, d)} ${minus ? '−' : '+'} ${frac(b, d)} = ${frac('?', d)}`, ans, [minus ? a + b : Math.abs(a - b), ans + 1, ans - 1, d],
      { visual: bars([[d, a], [d, b]]), show: false });
  }
  const pairs = lvl === 1 ? [[2, 4], [2, 6], [3, 6], [2, 8], [4, 8], [3, 9], [5, 10], [2, 10]] : [[2, 3], [3, 4], [2, 5], [4, 6], [3, 5], [6, 8], [4, 10], [3, 8]];
  let [d1, d2] = pick(pairs);
  if (chance(0.5)) [d1, d2] = [d2, d1];
  const L = lcm(d1, d2), a = R(1, d1 - 1), b = R(1, d2 - 1);
  if (gcd(a, d1) > 1 && chance(0.7)) return genAddF(lvl);
  const x = a * (L / d1), y = b * (L / d2);
  if (minus && x <= y) return genAddF(lvl);
  const ans = minus ? x - y : x + y;
  return numQ(`${frac(a, d1)} ${minus ? '−' : '+'} ${frac(b, d2)} = ${frac('?', L)}`, ans, [minus ? a - b : a + b, ans + 1, ans - 1, minus ? x + y : Math.abs(x - y)].filter(v => v >= 0),
    { visual: bars([[d1, a], [d2, b], [L, 0]]), show: false });
}

// ---------- 6. Fraction of a tray ----------
function genOf(lvl) {
  const kind = pick([['ofN', 'ofN', 'ofN', 'unit'], ['ofN', 'unit', 'times'], ['ofN', 'times', 'times']][lvl]);
  if (kind === 'ofN') {
    const b = pick(lvl ? [2, 3, 4, 5, 6, 8] : [2, 3, 4]), a = R(1, b - 1), m = R(2, lvl ? 9 : 5), n = b * m;
    return numQ(`${frac(a, b)} × ${n} = ?`, a * m, [m, n - a * m, a * m + m, n * a, a * m - 1].filter(v => v > 0),
      { visual: groups(n, b), show: lvl === 0 });
  }
  const b = pick([2, 3, 4, 5]), d = pick([2, 3, 4]);
  if (kind === 'unit') return numQ(`${frac(1, b)} × ${frac(1, d)} = ${frac(1, '?')}`, b * d, [b + d, b * d + 1, Math.max(b, d), b * d - 1], { visual: tray(b, 1, d, 1), show: false });
  const a = R(1, b - 1), c = R(1, d - 1);
  if (a === 1 && c === 1 && chance(0.5)) return genOf(lvl);
  return numQ(`${frac(a, b)} × ${frac(c, d)} = ${frac('?', b * d)}`, a * c, [a + c, a * c + 1, a * d + b * c, a * c - 1].filter(v => v > 0), { visual: tray(b, a, d, c), show: false });
}

// ---------- 7. How many scoops? Dividing by a fraction ----------
function genScoop(lvl) {
  if (lvl === 0 || (lvl === 1 && chance(0.4))) {
    const n = R(1, lvl ? 5 : 4), k = pick([2, 3, 4, 5]);
    return numQ(`${n} ÷ ${frac(1, k)} = ?`, n * k, [n + k, n * k + 1, k, n * k - 1].filter(v => v > 0), { visual: cups(n, k), show: lvl === 0 });
  }
  if (lvl === 1) {
    const k = pick([3, 4, 5, 6]), a = R(2, k - 1), n = pick([1, 2, 3, 4, 5, 6].filter(x => (x * k) % a === 0));
    if (!n) return genScoop(lvl);
    const ans = (n * k) / a;
    return numQ(`${n} ÷ ${frac(a, k)} = ?`, ans, [n * k, ans + 1, ans - 1, n * a].filter(v => v > 0), { visual: cups(n, k), show: false });
  }
  if (chance(0.6)) {
    // a/b ÷ c/d with a whole-number answer, e.g. 3/4 ÷ 3/8 = 2.
    for (;;) {
      const b = R(2, 6), d = R(2, 12), a = R(1, b - 1), c = R(1, d - 1);
      const top = a * d, bot = b * c;
      if (top % bot || top / bot < 2 || top / bot > 12 || gcd(a, b) > 1 || gcd(c, d) > 1) continue;
      const ans = top / bot;
      return numQ(`${frac(a, b)} ÷ ${frac(c, d)} = ?`, ans, [a * c, ans + 1, ans - 1, d / b | 0, top].filter(v => v > 0 && v !== ans), { visual: bars([[b, a], [d, c]]), show: false });
    }
  }
  const b = pick([2, 3, 4]), a = R(1, b - 1), k = b * pick([2, 3]);
  const ans = (a * k) / b;
  return chance(0.5)
    ? numQ(`${frac(a, b)} ÷ ${frac(1, k)} = ?`, ans, [a * k, ans + 1, k, ans - 1].filter(v => v > 0), { visual: bars([[b, a], [k, ans]]), show: false })
    : (w => numQ(`? ÷ ${frac(1, k)} = ${k * w}`, w, [k * k * w, k, w + 1, k * w - k].filter(v => v > 0 && v !== w), {}))(R(2, 5));
}

// ---------- 8. Tenths and hundredths ----------
function genDec(lvl) {
  const kind = pick([['grid', 'grid', 'line', 'hund'], ['grid', 'cmp', 'hund', 'line'], ['cmp', 'cmp', 'hund', 'line']][lvl]);
  if (kind === 'grid') {
    const n = lvl ? R(1, 99) : 10 * R(1, 9);
    const t = Math.floor(n / 10), o = n % 10;
    return decQ('?', n, [n * 10, n / 10, o * 10 + t, n + 1, n + 10, t, 1000 + n].filter(v => v !== n), { visual: grid100(n), show: true });
  }
  if (kind === 'line') {
    const a = lvl < 2 ? 0 : R(1, 4), t = R(1, 9);
    return decQ('?', a * 100 + t * 10, [a * 100 + t, a * 100 + (10 - t) * 10, (a + 1) * 100 + t * 10, a * 100 + t * 10 + 10, a * 100 + t * 10 - 10], { visual: decLine(a, t), show: true });
  }
  if (kind === 'hund') {
    const n = lvl ? R(1, 99) : 10 * R(1, 9);
    const asTenths = n % 10 === 0 && chance(0.5);
    return asTenths
      ? numQ(`${dec(n)} = ${frac('?', 10)}`, n / 10, [n, n / 10 + 1, 10 - n / 10], { visual: grid100(n), show: false })
      : numQ(`${dec(n)} = ${frac('?', 100)}`, n, [n / 10 | 0 || 2, n * 10 > 999 ? n + 10 : n * 10, n + 1, 100 - n], { visual: grid100(n), show: false });
  }
  // 0.3 is more than 0.25, even though 25 is more than 3. Sometimes 0.3 and 0.30 are the same.
  if (chance(0.15)) {
    const t = R(1, 9), [l, r] = shuffle([`0.${t}`, `0.${t}0`]);
    const q = cmpQ(l, r, t, t, `<div class="pairvis">${grid100(t * 10, 100)}<b class="op"></b>${grid100(t * 10, 100)}</div>`);
    q.show = false;
    return q;
  }
  const a = R(1, 9), b = R(10, 99);
  if (b % 10 === 0) return genDec(lvl);
  const [x, y] = chance(0.5) ? [a * 10, b] : [b, a * 10];
  const q = cmpQ(dec(x), dec(y), x, y, `<div class="pairvis">${grid100(x, 100)}<b class="op"></b>${grid100(y, 100)}</div>`);
  q.show = false;
  return q;
}

// ---------- 9. Decimal register ----------
const wrongAlign = (a, b) => {
  // The mistake of lining up the last digits instead of the dots: 2.5 + 1.25 becomes 0.25 + 1.25 style.
  const da = a % 10 ? 2 : 1, db = b % 10 ? 2 : 1;
  if (da === db) return -1;
  return da === 1 ? a / 10 + b : a + b / 10;
};
function genReg(lvl) {
  const kind = pick([['add', 'add', 'times'], ['add', 'sub', 'shift', 'times'], ['sub', 'shift', 'times', 'add']][lvl]);
  if (kind === 'add' || kind === 'sub') {
    const one = () => R(1, lvl ? 9 : 5) * 100 + (lvl && chance(0.6) ? R(1, 99) : 10 * R(1, 9));
    let a = one(), b = one();
    if (kind === 'sub' && a < b) [a, b] = [b, a];
    if (a === b) return genReg(lvl);
    const ans = kind === 'add' ? a + b : a - b;
    const mis = wrongAlign(a, b);
    return decQ(`<span class="ptag">${dec(a)}</span> ${kind === 'add' ? '+' : '−'} <span class="ptag">${dec(b)}</span> = ?`, ans,
      [mis > 0 && kind === 'add' ? Math.round(mis) : -1, ans + 10, ans - 10, ans + 100, ans - 1, ans + 1], { small: true });
  }
  if (kind === 'shift') {
    const v = R(101, 999), [op, f] = pick([['× 10', 10], ['× 100', 100], ['÷ 10', 0.1]]);
    const ans = Math.round(v * f);
    if (f === 0.1 && v % 10) return genReg(lvl);
    return decQ(`${dec(v)} ${op} = ?`, ans, [Math.round(v * (f === 10 ? 100 : 10)), Math.round(v / 10), v + f * 100, ans + 1000, Math.round(v / 100)].filter(x => x !== ans && Number.isInteger(x)), { small: true });
  }
  const t = R(2, 9), m = R(2, lvl ? 9 : 5), ans = t * m * 10;
  return decQ(`${dec(t * 10)} × ${m} = ?`, ans, [t * m, t * m * 100, ans + 10, (t + m) * 10], { small: true });
}

// ---------- 10. Percent bars ----------
function pctChoices(ans, wrongs) {
  const vals = [ans];
  for (const w of wrongs) if (vals.length < 4 && w > 0 && w <= 100 && !vals.includes(w)) vals.push(w);
  return shuffle(vals).map(v => ({ value: `${v}%`, html: `${v}%` }));
}
function genPct(lvl) {
  const kind = pick([['battery', 'battery', 'of'], ['battery', 'of', 'grid', 'sale'], ['of', 'of', 'sale', 'grid']][lvl]);
  if (kind === 'battery') {
    const f = R(1, 9);
    return { eq: '?', answer: `${f * 10}%`, input: 'choice', layout: 'grid', visual: battery(f), show: true,
      choices: pctChoices(f * 10, [f, (10 - f) * 10, f * 10 + 10, f * 10 - 10, f * 100]) };
  }
  if (kind === 'grid') {
    const n = pick([5, 15, 25, 35, 45, 55, 65, 75, 85, 95, 12, 48, 72]);
    return { eq: '?', answer: `${n}%`, input: 'choice', layout: 'grid', visual: grid100(n), show: true,
      choices: pctChoices(n, [100 - n, n + 10, Math.round(n / 10), n - 10, n + 1]) };
  }
  const [p, base] = pick([
    [[50, 10], [10, 10], [100, 10], [50, 2]],
    [[25, 4], [20, 5], [75, 4], [10, 10], [50, 2]],
    [[5, 20], [15, 20], [30, 10], [40, 5], [60, 5], [75, 4], [20, 5]],
  ][lvl]);
  const n = base * R(lvl ? 2 : 1, lvl === 2 ? 12 : 9) * (lvl === 0 ? 1 : 1);
  if (n < 10 || n > 400) return genPct(lvl);
  const ans = (p * n) / 100;
  if (!Number.isInteger(ans)) return genPct(lvl);
  if (kind === 'sale') return numQ('?', n - ans, [ans, n - ans + 10, n - p, n + ans].filter(v => v > 0 && v !== n - ans), { visual: saleTag(n, p), show: true, sale: true });
  return numQ(`${p}% × ${n} = ?`, ans, [n - ans, ans * 10, p, ans + 10, n / p | 0].filter(v => v > 0), { visual: grid100(p), show: false });
}

// ---------- 11. Recipe mixer: ratio and rate ----------
function genRatio(lvl) {
  const kind = pick([['double', 'double', 'same'], ['double', 'scale', 'same', 'rate'], ['scale', 'same', 'rate', 'rate']][lvl]);
  const a = R(1, lvl ? 5 : 3), b = R(1, lvl ? 5 : 3);
  if (a === b) return genRatio(lvl);
  if (kind === 'double' || kind === 'scale') {
    const k = kind === 'double' ? 2 : R(3, 5);
    const leftHidden = lvl && chance(0.4);
    const eq = leftHidden ? `${a}🍓 : ${b}🍋 = ?🍓 : ${b * k}🍋` : `${a}🍓 : ${b}🍋 = ${a * k}🍓 : ?🍋`;
    const ans = leftHidden ? a * k : b * k;
    const add = leftHidden ? a + (b * k - b) : b + (a * k - a);
    return numQ(eq, ans, [add, ans + 1, ans - 1, ans + k].filter(v => v > 0), { visual: `<div class="mixes">${mixVis(a, b)}${mixVis(a * k, b * k)}</div>`, show: lvl === 0 && k === 2, ratio: true });
  }
  if (kind === 'same') {
    const k = R(2, 3);
    const opts = [[a * k, b * k], [a + k, b + k], [b * k, a * k], [a * k, b * k + 1], [a * k + 1, b * k]];
    const seen = new Set(), choices = [];
    for (const [x, y] of opts) { const key = `${x}:${y}`; if (!seen.has(key) && (choices.length === 0 || x * b !== y * a)) { seen.add(key); choices.push({ value: key, html: mixHTML(x, y) }); } }
    return { eq: `${a}🍓 ${b}🍋 = ?`, answer: `${a * k}:${b * k}`, input: 'choice', layout: 'grid', visual: mixVis(a, b), show: true, choices: shuffle(choices.slice(0, 4)), ratio: true };
  }
  const n = R(2, 5), unit = R(2, lvl === 2 ? 9 : 5), m = R(2, 7);
  if (m === n) return genRatio(lvl);
  return numQ(`${m}🍬 = ?🪙`, m * unit, [n * unit + (m - n), m * unit + unit, unit, (m - 1) * unit].filter(v => v > 0), { visual: `<div class="ratecard"><span>${'🍬'.repeat(n)}</span><b>=</b><span>${n * unit}🪙</span></div>`, show: true, rate: true });
}

// ---------- 12. Fraction puzzles ----------
// Every a/b = 1/x + 1/y with small numbers, and every 1/x + 1/y + 1/z (+ 1/w) = 1.
const UNIT_SPLITS = [];
for (let x = 2; x <= 12; x++) for (let y = x; y <= 24; y++) {
  const t = x + y, u = x * y, g = gcd(t, u);
  if (t / g < u / g && u / g <= 30) UNIT_SPLITS.push([t / g, u / g, x, y]);
}
const TO_ONE = [];
for (let x = 2; x <= 6; x++) for (let y = x; y <= 12; y++) for (let z = y; z <= 24; z++) {
  if (y * z + x * z + x * y === x * y * z) TO_ONE.push([x, y, z]);
  for (let w = z; w <= 24; w++) if (y * z * w + x * z * w + x * y * w + x * y * z === x * y * z * w) TO_ONE.push([x, y, z, w]);
}
function genCPuz(lvl) {
  const kind = pick(['unit', 'toOne', 'left', 'share']);
  if (kind === 'unit') {
    const [a, b, x0, y0] = pick(UNIT_SPLITS.filter(u => (lvl < 2 ? u[1] <= 12 : true)));
    const [x, y] = chance(0.5) ? [x0, y0] : [y0, x0];
    return numQ(`${frac(a, b)} = ${frac(1, x)} + ${frac(1, '?')}`, y, [y + 1, y - 1, b, b - x, x].filter(v => v > 1 && v !== y), { small: true });
  }
  if (kind === 'toOne') {
    const set = shuffle(pick(TO_ONE.filter(t => (lvl < 2 ? t.length === 3 || t[3] <= 12 : t.length === 4))).slice());
    const z = set.pop();
    return numQ(`${set.map(x => frac(1, x)).join(' + ')} + ${frac(1, '?')} = 1`, z, [z + 1, z - 1, set[0] + set[1], set[0] * set[1]].filter(v => v > 1 && v !== z), { small: true });
  }
  if (kind === 'left') {
    // Eat a fraction of what is left, box after box.
    const steps = lvl === 0 ? pick([[2, 2], [2, 3], [3, 2], [4, 2]]) : lvl === 1 ? pick([[2, 3], [3, 2], [2, 4], [4, 3], [3, 4], [2, 2, 2]]) : pick([[2, 3, 4], [4, 3, 2], [2, 2, 3], [3, 3, 2], [5, 4, 2], [2, 5, 3]]);
    let n = steps.reduce((s, k) => s * k, 1) * R(1, lvl < 2 ? 4 : 3);
    if (n < 6) n *= 2;
    let left = n;
    for (const k of steps) left -= left / k;
    const naive = n / steps.reduce((s, k) => s * k, 1);
    return numQ(`${n}🍬 ${steps.map(k => `➜<span class="mach">×${frac(k - 1, k)}</span>`).join('')}➜ ?`, left, [naive, left + 1, n - n / steps[0], left - 1, left * 2].filter(v => v > 0 && v !== left), { small: true, eatLeft: true });
  }
  const k = R(3, 8), c = R(1, k - 1);
  if (gcd(c, k) > 1) return genCPuz(lvl);
  return fracQ(`${c}🎂 ÷ ${k}🧒 = ?`, [c, k], [[k, c], [1, k], [c, k + c], [1, c], [c + 1, k]], { share: true });
}

export const CANDY = [
  { id: 'c-rect', icon: '📦', gen: genRect },
  { id: 'c-divis', icon: '🔍', gen: genDivis },
  { id: 'c-equiv', icon: '🍫', gen: genEquiv },
  { id: 'c-mixed', icon: '🎂', gen: genMixed },
  { id: 'c-addf', icon: '🍰', gen: genAddF },
  { id: 'c-of', icon: '🍪', gen: genOf },
  { id: 'c-scoop', icon: '🥄', gen: genScoop },
  { id: 'c-dec', icon: '🔟', gen: genDec },
  { id: 'c-reg', icon: '🧾', gen: genReg },
  { id: 'c-pct', icon: '🔋', gen: genPct },
  { id: 'c-ratio', icon: '🧃', gen: genRatio },
  { id: 'c-puz', icon: '🧩', gen: genCPuz, puzzle: true },
];
