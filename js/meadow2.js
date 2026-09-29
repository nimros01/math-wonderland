// Meadow stages added after launch: measuring, the coin shop and picture stories.
// They get new stage ids, so every saved star stays where it was.
import { R, pick, chance, shuffle, numQ, cmpQ } from './skills.js';
import { money, country } from './country.js';

const INK = '#1e2650';
const COL = { red: '#ef5b52', blue: '#3e9be0', green: '#2fb383', yellow: '#ffc23d' };
const dot = c => `<span class="cdot" style="background:${COL[c]}"></span>`;

// ---------- Longer and shorter ----------
const U = 20; // one centimetre (or one paper clip) in picture units
function snake(x, y, len, color, unit = U) {
  const w = len * unit;
  return `<rect x="${x}" y="${y}" width="${w}" height="14" rx="7" fill="${color}" stroke="${INK}" stroke-width="2.5"/>` +
    `<circle cx="${x + w - 6}" cy="${y + 5}" r="2.2" fill="${INK}"/>`;
}
function clipsRow(x, y, n) {
  let out = '';
  for (let i = 0; i < n; i++) out += `<rect x="${x + i * U + 1.5}" y="${y}" width="${U - 3}" height="9" rx="4.5" fill="none" stroke="#7d8597" stroke-width="2.5"/><rect x="${x + i * U + 5}" y="${y + 2.5}" width="${U - 10}" height="4" rx="2" fill="none" stroke="#7d8597" stroke-width="1.8"/>`;
  return out;
}
function ruler(x, y, n) {
  let out = `<rect x="${x - 9}" y="${y}" width="${n * U + 18}" height="30" rx="4" fill="#ffe8a3" stroke="${INK}" stroke-width="2.5"/>`;
  for (let i = 0; i <= n; i++) {
    out += `<line x1="${x + i * U}" y1="${y}" x2="${x + i * U}" y2="${y + 11}" stroke="${INK}" stroke-width="2"/>`;
    if (i <= 10 || i % 2 === 0) out += `<text x="${x + i * U}" y="${y + 23}" font-size="15" font-weight="800" fill="${INK}" text-anchor="middle">${i}</text>`;
  }
  return out;
}
// A ruler with steps of u picture units.
function rulerU(x, y, n, u) {
  let out = `<rect x="${x - 8}" y="${y}" width="${n * u + 16}" height="27" rx="4" fill="#ffe8a3" stroke="${INK}" stroke-width="2"/>`;
  for (let i = 0; i <= n; i++) {
    out += `<line x1="${x + i * u}" y1="${y}" x2="${x + i * u}" y2="${y + 9}" stroke="${INK}" stroke-width="2"/>`;
    if (u >= 20 || i % 2 === 0) out += `<text x="${x + i * u}" y="${y + 21}" font-size="14" font-weight="800" fill="${INK}" text-anchor="middle">${i}</text>`;
  }
  return out;
}
const pic = (w, h, body) => `<svg class="shape" viewBox="0 0 ${w} ${h}" width="${Math.min(300, w)}" height="${Math.round(h * Math.min(300, w) / w)}">${body}</svg>`;

function genMeasure(lvl) {
  const kind = pick([['clips', 'clips', 'ruler0', 'longer'], ['ruler0', 'ruler', 'longer', 'guess'], ['ruler', 'diff', 'guess', 'longer']][lvl]);
  if (kind === 'clips') {
    const n = R(3, 8);
    return numQ('? 📎', n, [n + 1, n - 1, n + 2], { visual: pic(n * U + 20, 50, snake(10, 6, n, COL.green) + clipsRow(10, 30, n)), show: true, sol: { t: 'clips', n } });
  }
  if (kind === 'ruler0' || kind === 'ruler') {
    const start = kind === 'ruler' ? R(1, 5) : 0, len = R(2, kind === 'ruler' ? 8 : 12), end = start + len, n = Math.max(12, end + 1);
    return numQ('?', len, [end, start, len + 1, len - 1].filter(v => v > 0), { visual: pic(n * U + 20, 60, snake(10 + start * U, 8, len, COL.green) + ruler(10, 26, n)), show: true, sol: { t: 'ruler', start, end } });
  }
  if (kind === 'longer' && lvl === 2) {
    // the longer snake is drawn with smaller steps, so it can look shorter: read the rulers
    let a, b;
    do { a = R(3, 11); b = R(3, 11); } while (Math.abs(a - b) < 1 || Math.abs(a - b) > 3);
    const ua = a > b ? 14 : 24, ub = a > b ? 24 : 14;
    const rowPic = (len, u, color, y) => snake(10, y, len, color, u) + rulerU(10, y + 18, Math.ceil(12 * 20 / u), u);
    return { ...cmpQ(dot('red'), dot('blue'), a, b), visual: pic(12 * U + 44, 116, rowPic(a, ua, COL.red, 4) + rowPic(b, ub, COL.blue, 60)), show: true };
  }
  if (kind === 'longer') {
    const a = R(3, 10), b = chance(0.12) ? a : Math.max(2, Math.min(11, a + pick([-3, -2, -1, 1, 2, 3])));
    // level 0 lines both snakes up at the left; later they start at different places on a ruler
    const sa = lvl ? R(0, 12 - a) : 0, sb = lvl ? R(0, 12 - b) : 0;
    const body = snake(10 + sa * U, 6, a, COL.red) + snake(10 + sb * U, 30, b, COL.blue) + (lvl ? ruler(10, 52, 12) : '');
    return { ...cmpQ(dot('red'), dot('blue'), a, b), visual: pic(12 * U + 20, lvl ? 86 : 52, body), show: true };
  }
  if (kind === 'diff') {
    const a = R(5, 12), b = R(2, a - 1);
    return numQ(`${dot('red')} − ${dot('blue')} = ?`, a - b, [a, b, a + b, a - b + 1], { visual: pic(12 * U + 20, 86, snake(10, 6, a, COL.red) + snake(10, 30, b, COL.blue) + ruler(10, 52, 12)), show: true, sol: { t: 'sub', a, b, up: true } });
  }
  // guess first: one unit square is shown, and its size changes, so the answers range from 2 to about 30
  const len = R(2, 30), u = pick([8, 10, 12, 15, 20, 25, 32, 40].filter(k => k * len <= 262));
  const opts = [len];
  for (const f of shuffle([0.5, 0.6, 1.5, 2, 2.5])) {
    const v = Math.max(1, Math.round(len * f));
    if (opts.length < 4 && opts.every(o => Math.abs(o - v) >= Math.max(2, Math.round(len * 0.3)))) opts.push(v);
  }
  for (let d = 3; opts.length < 4; d += 2) if (opts.every(o => Math.abs(o - (len + d)) >= 2)) opts.push(len + d);
  return {
    sol: { t: 'guess', len, u }, eq: '≈ ?', answer: len, input: 'choice', layout: 'grid', visual: pic(14 * U + 20, 32 + Math.max(u, 18) + 6, snake(10, 6, len, COL.green, u) + `<rect x="10" y="32" width="${u}" height="${u}" fill="#ffe8a3" stroke="${INK}" stroke-width="2"/><text x="${10 + u + 6}" y="${32 + u / 2 + 5}" font-size="15" font-weight="800" fill="${INK}">1</text>`), show: true,
    choices: shuffle(opts).map(v => ({ value: v, html: String(v) })),
  };
}

// ---------- Coin shop ----------
const TOYS = ['🧸', '🎈', '🪁', '⚽', '🍦', '🖍️', '🚗', '🦖'];
const coin = v => `<span class="mcoin ${country().toLowerCase()} v${v}">${v}</span>`;
const coinsHTML = list => `<span class="mcoins">${list.map(coin).join('')}</span>`;
const sum = list => list.reduce((a, b) => a + b, 0);
function greedy(v, coins) { const out = []; for (const c of coins) while (v >= c) { out.push(c); v -= c; } return out; }
function randomCoins(k, coins, cap) {
  for (;;) {
    const list = Array.from({ length: k }, () => pick(coins)).sort((a, b) => b - a);
    if (sum(list) <= cap) return list;
  }
}
const tag = (toy, price) => `<span class="pricetag"><i>${toy}</i><b>${money().fmt(price)}</b></span>`;

function genShop(lvl) {
  const M = money(), small = M.coins.slice(lvl ? 0 : 1); // level 0 leaves out the biggest coin
  const kind = pick([['count', 'count', 'pay'], ['count', 'pay', 'fewest'], ['pay', 'fewest', 'change', 'count']][lvl]);
  if (kind === 'count') {
    const list = randomCoins(R(2, lvl ? 6 : 4), small, M.max);
    const shown = lvl === 2 ? shuffle(list.slice()) : list;
    const v = sum(list);
    return numQ(M.fmt('?'), v, [v + list[0], v - list[list.length - 1], v + 1, v - 1].filter(x => x > 0), { visual: coinsHTML(shown), show: true, sol: { t: 'coins', list } });
  }
  if (kind === 'fewest') {
    // every handful pays the price exactly; the right one uses the fewest coins
    const price = R(8, M.max), best = greedy(price, M.coins);
    const hands = [best], counts = new Set([best.length]);
    let cur = best;
    for (let t = 0; hands.length < 4 && t < 60; t++) {
      // break one coin that isn't the smallest into smaller coins
      const big = cur.filter(c => c > M.coins[M.coins.length - 1]);
      if (!big.length) break;
      const c = pick(big), i = cur.indexOf(c);
      const smaller = M.coins.filter(x => x < c);
      const next = [...cur.slice(0, i), ...cur.slice(i + 1), ...greedy(c, chance(0.5) ? smaller : smaller.slice(1).length ? smaller.slice(1) : smaller)].sort((a, b) => b - a);
      if (sum(next) !== price || next.length > 9) continue;
      cur = next;
      if (!counts.has(next.length)) { counts.add(next.length); hands.push(next); }
    }
    if (hands.length < 4) return genShop(lvl);
    const order = shuffle([0, 1, 2, 3]);
    return { sol: { t: 'fewest', price, best }, eq: '<span class="fewest">🪙<b>⬇</b></span>', answer: order.indexOf(0), input: 'choice', layout: 'grid', fewest: true, visual: tag(pick(TOYS), price), show: true, choices: order.map((k, i) => ({ value: i, html: coinsHTML(lvl === 2 ? shuffle(hands[k].slice()) : hands[k]) })) };
  }
  if (kind === 'change') {
    const pay = pick(M.pay), price = R(Math.ceil(pay / 4), pay - 1);
    return numQ(`${M.fmt(pay)} − ${M.fmt(price)} = ?`, pay - price, [pay - price + 1, pay - price - 1, price, pay - price + 10], { visual: tag(pick(TOYS), price), show: true, small: true, sol: { t: 'sub', a: pay, b: price, up: true } });
  }
  // pay: which handful of coins is exactly the price?
  const right = randomCoins(R(2, lvl ? 5 : 3), small, M.max), price = sum(right);
  const sets = [right], seen = new Set([price]);
  for (let t = 0; sets.length < 4 && t < 200; t++) {
    const w = right.slice();
    const i = R(0, w.length - 1);
    if (chance(0.5)) w[i] = pick(small); else if (chance(0.5) && w.length > 1) w.splice(i, 1); else w.push(pick(small));
    w.sort((a, b) => b - a);
    const v = sum(w);
    if (!seen.has(v) && v > 0) { seen.add(v); sets.push(w); }
  }
  if (sets.length < 4) return genShop(lvl);
  const order = shuffle([0, 1, 2, 3]);
  return { sol: { t: 'pay', price, sums: order.map(k => sum(sets[k])) }, eq: '', answer: order.indexOf(0), input: 'choice', layout: 'grid', visual: tag(pick(TOYS), price), show: true, choices: order.map((k, i) => ({ value: i, html: coinsHTML(lvl === 2 ? shuffle(sets[k].slice()) : sets[k]) })) };
}

// ---------- Picture stories: a three-picture comic with no words ----------
const panel = html => `<div class="panel">${html}</div>`;
const many = (e, n) => `<span class="crowd">${e.repeat(n)}</span>`;
const branch = html => `<div class="perch">${html}</div><i class="branch"></i>`;
function genStory1(lvl) {
  const kind = pick([['away', 'more'], ['away', 'more', 'expr'], ['missing', 'expr', 'away', 'more']][lvl]);
  const top = lvl ? 18 : 10;
  const n = R(4, top), c = R(1, n - 2);
  const away = kind === 'more' ? false : kind === 'away' || kind === 'missing' ? true : chance(0.5);
  const [e, box] = away ? [pick(['🐦', '🦋', '🐝', '🐞']), ''] : [pick(['🍎', '🍓', '🌰', '🥚']), '🧺'];
  const left = away ? n - c : n + c;
  if (kind === 'missing') {
    // the middle picture is the question: how many flew away?
    const vis = `<div class="story">${[panel(branch(many(e, n))), panel(branch(`<span class="slot">?</span><span class="puff">💨</span>`)), panel(branch(many(e, left)))].join('<b class="arrow">▶</b>')}</div>`;
    return numQ('', c, [n, left, c + 1, c - 1].filter(v => v > 0), { visual: vis, show: true, sol: { t: 'story', n, c, away, e, miss: true } });
  }
  // The middle picture moves: the birds lift off the branch and fly out, or the fruit drops into the basket.
  // A small arrow stands in for the movement when the phone asks for reduced motion.
  const pics = away
    ? [panel(branch(many(e, n))), panel(branch(`<span class="crowd leave">${e.repeat(c)}</span><b class="still">↗</b>`)), panel(branch('<span class="slot">?</span>'))]
    : [panel(`${many(e, n)}<i class="box">${box}</i>`), panel(`<b class="still">⬇</b><span class="crowd enter">${e.repeat(c)}</span><i class="box">${box}</i>`), panel(`<span class="slot">?</span><i class="box">${box}</i>`)];
  const vis = `<div class="story">${pics.join('<b class="arrow">▶</b>')}</div>`;
  if (kind === 'expr') {
    const right = `${n} ${away ? '−' : '+'} ${c}`;
    // the other choices use the wrong sign or a wrong number, and every choice has a different value
    const val = x => { const [a, o, b] = x.split(' '); return o === '+' ? +a + +b : +a - +b; };
    const opts = [right], seen = new Set([val(right)]);
    for (const x of [`${n} ${away ? '+' : '−'} ${c}`, `${n} ${away ? '−' : '+'} ${c + 1}`, `${n + 1} ${away ? '−' : '+'} ${c}`, `${n} ${away ? '−' : '+'} ${c - 1}`, `${c} ${away ? '−' : '+'} ${c}`, `${n} ${away ? '+' : '−'} ${c + 1}`]) {
      if (opts.length < 4 && val(x) >= 0 && !seen.has(val(x))) { opts.push(x); seen.add(val(x)); }
    }
    shuffle(opts);
    return { sol: { t: 'story', n, c, away, e }, eq: '', answer: right, input: 'choice', layout: 'grid', visual: vis, show: true, choices: opts.map(x => ({ value: x, html: `<span class="ex">${x}</span>` })) };
  }
  return numQ('', left, [away ? n + c : n - c, n, c, left + 1, left - 1].filter(v => v >= 0), { visual: vis, show: true, sol: { t: 'story', n, c, away, e } });
}

export { genMeasure, genShop, genStory1 };
