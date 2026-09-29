// Solutions for the Candy Factory: factors and primes, divisibility rules, equal fractions, mixed numbers,
// adding and taking fractions, fractions of a tray, dividing by fractions, decimals, percent and ratio.
import { S, OOPS, m, plain } from './sol-basic.js';
import { tiles, dots, checks, gallery, big } from './sol-pics.js';
import { digitRows, column, fbars, segBar, valueBar, trayPic } from './sol-pics2.js';
import { frac } from './ocean.js';

const PINK = '#f28dbb', BLUE = '#3e9be0', MINT = '#2fb383', SUN = '#ffc23d', RED = '#ef5b52';
const SYM = (x, y) => (x > y ? '>' : x < y ? '<' : '=');
const esc = s => s.replace('<', '&lt;').replace('>', '&gt;');
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const lcm = (a, b) => (a * b) / gcd(a, b);
const dec = h => { const s = (h / 100).toFixed(2); return s.replace(/0$/, '').replace(/\.0$/, ''); };
const toH = v => Math.round(Number(v) * 100);
const parseFrac = v => { const x = /^(\d+)\/(\d+)$/.exec(String(v)); return x ? [+x[1], +x[2]] : null; };

// ---------- factors and primes ----------
// Which box holds exactly n candies? Count each box.
function boxCount({ n }, q) {
  const counts = q.choices.map(c => (c.html.match(/<circle/g) || []).length);
  const pics = q.choices.map((c, i) => `<div class="${counts[i] === n ? 'ok' : 'no'}">${c.html}<b>${counts[i]}</b></div>`);
  return { ans: q.choices.find((c, i) => counts[i] === n)?.value, steps: [S(gallery(pics, 'shapes boxes'), `🍬 ${n}`, 'boxCount')] };
}
// How many different boxes can n candies fill? Try 1, 2, 3 … rows.
function factorPairs({ n }, q, given) {
  const rows = [];
  for (let r = 1; r * r <= n; r++) rows.push(n % r ? [`${n} ÷ ${r} = ${Math.floor(n / r)} 🐟 ${n % r}`, false] : [`${r} × ${n / r}`, true]);
  const ans = rows.filter(r => r[1]).length;
  return { ans, steps: [S(checks(rows), `${ans}`, 'pairsUp')], oops: given !== undefined && given !== ans && (given === 2 * ans || (Number.isInteger(Math.sqrt(n)) && given === 2 * ans - 1)) ? OOPS(`${ans}`, 'oopsTurned') : null };
}
const smallest = n => { for (let f = 2; f * f <= n; f++) if (n % f === 0) return f; return 0; };
function primeAll(sol, q) {
  const nums = q.items.map(it => +plain(it.html));
  const rows = nums.map(n => { const f = smallest(n); return [f ? `${n} = ${f} × ${n / f}` : `${n} = 1 × ${n}`, !f]; });
  return { ans: nums.map(n => (smallest(n) ? 0 : 1)).join(''), steps: [S(checks(rows), '', 'primeOnly')] };
}

// ---------- divisibility ----------
const digs = n => [...String(n)].map(Number);
// One line showing the rule for ÷k at work on n.
function ruleLine(n, k) {
  const d = digs(n), last = d[d.length - 1], sum = d.reduce((x, y) => x + y, 0);
  if (k === 2 || k === 5 || k === 10) return `${String(n).slice(0, -1)}<u class="hl">${last}</u>`;
  if (k === 3 || k === 9) return `${d.join(' + ')} = ${sum}`;
  if (k === 4) return `${String(n).slice(0, -2)}<u class="hl">${String(n).slice(-2)}</u>${n % 100 % 4 ? '' : ` → ${n % 100} = 4 × ${(n % 100) / 4}`}`;
  if (k === 6) return `${n % 2 ? '✗' : '✓'} ÷2, ${d.join('+')} = ${sum}`;
  return `${n} ÷ ${k} = ${Math.floor(n / k)}${n % k ? ` 🐟 ${n % k}` : ''}`;
}
const RULE = { 2: 'rule2', 3: 'rule3', 4: 'rule4', 5: 'rule5', 6: 'rule6', 9: 'rule9', 10: 'rule10' };
function divisAll({ k }, q) {
  const nums = q.items.map(it => +plain(it.html));
  return { ans: nums.map(n => (n % k ? 0 : 1)).join(''), steps: [S(checks(nums.map(n => [ruleLine(n, k), n % k === 0])), `÷${k}`, RULE[k])] };
}
function divisWhich({ n }, q) {
  const ks = q.choices.map(c => Number(c.value));
  const rows = ks.map(k => [`${n} ÷ ${k} = ${Math.floor(n / k)}${n % k ? ` 🐟 ${n % k}` : ''}`, n % k === 0]);
  return { ans: ks.find(k => n % k === 0), steps: [S(checks(rows), '', 'tryEach')] };
}
// The hidden digit that makes the digits add up to 9, 18 …
function digit9({ a = null, c }, q) {
  const known = (a ?? 0) + c;
  let d = 1;
  while ((known + d) % 9) d++;
  const parts = a === null ? `? + ${c}` : `${a} + ? + ${c}`;
  return {
    ans: d,
    steps: [S('', `${parts} = 9, 18 …`, 'rule9'), S('', `${parts} = ${known + d}<br>? = ${known + d} − ${known} = ${d}`, 'next9', { a: known + d })],
  };
}

// ---------- equal fractions ----------
// a/b = ?/(b×k) going up, or (a×k)/(b×k) = a/b going down; hide says which number is the ?.
function fracScale({ a, b, k, down, hide }, q, given) {
  if (!down) {
    return {
      ans: a * k,
      steps: [S(fbars([[b, a], [b * k, a * k]]), `${b} × ${k} = ${b * k}`, 'cutMore', { a: k }),
        S(fbars([[b, a], [b * k, a * k]]), `${frac(a, b)} = ${frac(`${a}×${k}`, `${b}×${k}`)} = ${frac(a * k, b * k)}`, 'timesBoth', { a: k })],
      oops: given !== undefined && given !== a * k && (given === a || given === a + k) ? OOPS(`× ${k}`, 'oopsTimesBoth') : null,
    };
  }
  const find = hide === 'top' ? `${b} × ${k} = ${b * k}` : `${a} × ${k} = ${a * k}`;
  return {
    ans: hide === 'top' ? a : b,
    steps: [S(fbars([[b * k, a * k], [b, a]]), find, 'joinPieces', { a: k }),
      S(fbars([[b * k, a * k], [b, a]]), `${frac(a * k, b * k)} = ${frac(`${a * k}÷${k}`, `${b * k}÷${k}`)} = ${frac(a, b)}`, 'divBoth', { a: k })],
  };
}

// ---------- mixed numbers ----------
// w whole cakes and r slices of k: t = w × k + r slices. hole: 't', 'w', 'r' or 'whole'.
function mixed({ w, r, k, hole }, q, given) {
  const t = w * k + r;
  let steps, ans;
  if (hole === 't') { ans = t; steps = [S(q.visual, `${w} × ${k} + ${r} = ${t}`, 'wholeCakes', { a: k })]; }
  else if (hole === 'whole') { ans = w; steps = [S(q.visual, `${t} ÷ ${k} = ${w}`, 'cakesOfSlices', { a: k })]; }
  else { ans = hole === 'w' ? w : r; steps = [S(q.visual, `${t} ÷ ${k} = ${w} 🐟 ${r}`, 'mixSplit', { a: k, b: w, c: r })]; }
  const oops = hole === 't' && given === w + r ? OOPS(`${w} × ${k} + ${r} = ${t}`, 'oopsMixAdd', { a: k }) : null;
  return { ans, steps, oops };
}
function mixCmp({ top, k, n }, q, given) {
  const sym = SYM(top, n * k);
  return {
    ans: sym,
    steps: [S(q.visual, `${n} = ${frac(n * k, k)}`, 'wholeAsSlices', { a: n, b: n * k, c: k }), S('', `${frac(top, k)} ${esc(sym)} ${frac(n * k, k)}`, 'fracSameBottom')],
    oops: given && given !== sym ? OOPS(`${n} = ${frac(n * k, k)}`, 'oopsWhole1', { a: k }) : null,
  };
}

// ---------- adding and taking fractions ----------
function robot({ a, b, d, sn, sd }, q) {
  const ok = sn * d === sd * (a + b);
  return {
    ans: ok ? 'y' : 'n',
    steps: [S(fbars([[d, a], [d, b], [d, a + b]], { cols: [PINK, BLUE, MINT] }), `${frac(a, d)} + ${frac(b, d)} = ${frac(a + b, d)}`, 'sameCuts', { a: d }),
      S(big(ok ? '✓' : '✗'), `${frac(a + b, d)} ${ok ? '=' : '≠'} ${frac(sn, sd)}`, ok ? 'tfYes' : 'robotWrong')],
  };
}
function addSame({ a, b, d, minus }, q, given) {
  const ans = minus ? a - b : a + b, op = minus ? '−' : '+';
  return {
    ans,
    steps: [S(fbars([[d, a], [d, b]], { cols: [PINK, BLUE] }), `${a} ${op} ${b} = ${ans}`, minus ? 'takeTops' : 'addTops', { a: d }),
      S(fbars([[d, ans]], { cols: [MINT] }), `${frac(a, d)} ${op} ${frac(b, d)} = ${frac(ans, d)}`, '')],
    oops: given === (minus ? a + b : Math.abs(a - b)) ? OOPS(`${a} ${op} ${b} = ${ans}`, minus ? 'oopsAdded' : 'oopsTookAway') : null,
  };
}
function addDiff({ a, d1, b, d2, minus }, q, given) {
  const L = lcm(d1, d2), x = a * (L / d1), y = b * (L / d2), ans = minus ? x - y : x + y, op = minus ? '−' : '+';
  return {
    ans,
    steps: [S(fbars([[d1, a], [d2, b]], { cols: [PINK, BLUE] }), [d1, d2].filter(d => d !== L).map(d => `${d} × ${L / d} = ${L}`).join('<br>'), 'commonCut', { a: L }),
      S(fbars([[L, x], [L, y]], { cols: [PINK, BLUE] }), `${frac(a, d1)} = ${frac(x, L)}<br>${frac(b, d2)} = ${frac(y, L)}`, 'timesBothShort'),
      S(fbars([[L, ans]], { cols: [MINT] }), `${frac(x, L)} ${op} ${frac(y, L)} = ${frac(ans, L)}`, minus ? 'takeTops' : 'addTops', { a: L })],
    oops: given !== ans && given === (minus ? a - b : a + b) ? OOPS(`${frac(x, L)} ${op} ${frac(y, L)}`, 'oopsTops') : null,
  };
}

// ---------- fractions of a tray, and dividing by a fraction ----------
function fracTimes({ a, b, c, d, hole }, q, given) {
  const pic = trayPic(b, a, d, c), steps = [S(pic, `${b} × ${d} = ${b * d}`, 'trayCut', { a: b, b: d, c: b * d })];
  if (hole === 'top') steps.push(S(pic, `${a} × ${c} = ${a * c}`, 'trayBoth', { a, b: c }));
  const ans = hole === 'top' ? a * c : b * d;
  return { ans, steps, oops: given !== ans && given === (hole === 'top' ? a + c : b + d) ? OOPS(`${hole === 'top' ? a : b} × ${hole === 'top' ? c : d}`, 'oopsTimesAdd') : null };
}
// a/b ÷ c/d with a whole answer. A whole n comes as n/1: n × d scoops first.
function fdiv({ a, b = 1, c, d }, q, given) {
  const ans = (a * d) / (b * c), steps = [];
  if (b === 1) {
    steps.push(S(q.visual || fbars(Array.from({ length: Math.min(a, 6) }, () => [d, d])), `${a} × ${d} = ${a * d}`, 'scoopCount', { a: d }));
    if (c > 1) steps.push(S('', `${a * d} ÷ ${c} = ${ans}`, 'scoopGroup', { a: c }));
  } else {
    const L = lcm(b, d), A = (a * L) / b, C = (c * L) / d;
    steps.push(S(fbars([[L, A], [L, C]], { cols: [PINK, BLUE] }), `${frac(a, b)} = ${frac(A, L)}<br>${frac(c, d)} = ${frac(C, L)}`, 'sameCutDiv'));
    steps.push(S(fbars([[L, A], [L, C]], { cols: [PINK, BLUE] }), `${A} ÷ ${C} = ${ans}`, 'fitsTimes', { a: C, b: A }));
  }
  return { ans, steps, oops: given !== ans && b === 1 && given === a + d ? OOPS(`${a} × ${d}`, 'oopsScoopAdd', { a: d }) : null };
}
function scoopBack({ k, w }, q) {
  return { ans: w, steps: [S('', `${k * w} ÷ ${k} = ${w}`, 'scoopBack', { a: k, b: k * w, c: w })] };
}

// ---------- decimals (all in hundredths) ----------
function decGrid({ n }, q, given) {
  const t = Math.floor(n / 10), o = n % 10;
  const math = [t && `${t} × 0.1`, o && `${o} × 0.01`].filter(Boolean).join(' + ') + ` = ${dec(n)}`;
  const g = given === undefined ? null : toH(given);
  return { ans: dec(n), steps: [S(q.visual, math, 'gridRows')], oops: g !== null && g !== n && (g === n * 10 || g * 10 === n || g === o * 10 + t) ? OOPS(`${dec(n)}`, g === o * 10 + t ? 'oopsSwapDec' : 'oopsDecPlace') : null };
}
function decLine({ a, s: t }, q, given) {
  const ans = dec(a * 100 + t * 10);
  return {
    ans,
    steps: [S(q.visual, `${a ? `${a} + ` : ''}${t} × 0.1 = ${ans}`, 'lineTenths', { a, b: a + 1 })],
    oops: given !== undefined && toH(given) === a * 100 + (10 - t) * 10 ? OOPS(`${a} + ${t} × 0.1`, 'oopsLineFrom', { a }) : null,
  };
}
function decFrac({ n, den }, q) {
  return den === 10
    ? { ans: n / 10, steps: [S(q.visual, `${dec(n)} = ${n / 10} × 0.1 = ${frac(n / 10, 10)}`, 'tenthsAre', { a: n / 10 })] }
    : { ans: n, steps: [S(q.visual, `${dec(n)} = ${n} × 0.01 = ${frac(n, 100)}`, 'hundredthsAre', { a: n })] };
}
function decCmp({ x, y }, q, given) {
  const sym = SYM(x, y), p = v => (v / 100).toFixed(2);
  return {
    ans: sym,
    steps: [S(q.visual, `${plain(q.eq.split('◯')[0])} = ${p(x)}<br>${plain(q.eq.split('◯')[1])} = ${p(y)}`, 'decSameLen'),
      S(digitRows([{ s: p(x) }, { s: p(y) }]), `${p(x)} ${esc(sym)} ${p(y)}`, x === y ? 'cmpSame' : 'decCompare')],
    oops: given && given !== sym ? OOPS(`${p(x)} ${esc(sym)} ${p(y)}`, (() => { const [lx, ly] = q.eq.split('◯').map(h => plain(h).replace(/\D/g, '').length); return lx !== ly && given === SYM(lx, ly) ? 'oopsDecLen' : 'oopsSym'; })()) : null,
  };
}
// Line the numbers up on their dots, like whole numbers.
function decAdd({ a, b, minus }, q, given) {
  const ans = minus ? a - b : a + b, op = minus ? '−' : '+';
  const A = (a / 100).toFixed(2), B = (b / 100).toFixed(2), Rs = (ans / 100).toFixed(2);
  const pads = [[a, A], [b, B]].filter(([v, s]) => dec(v) !== s).map(([v, s]) => `${dec(v)} = ${s}`);
  const wrong = (() => { const da = a % 10 ? 2 : 1, db = b % 10 ? 2 : 1; return da === db ? -1 : Math.round(da === 1 ? a / 10 + b : a + b / 10); })();
  return {
    ans: dec(ans),
    steps: [S(column(A, op, B, { res: null }), pads.join('<br>'), 'lineDots'),
      S(column(A, op, B, { res: Rs }), `${A} ${op} ${B} = ${Rs}`, 'likeWhole')],
    oops: !minus && given !== undefined && toH(given) === wrong ? OOPS(`${A} + ${B}`, 'oopsDots') : null,
  };
}
// × 10, × 100 or ÷ 10: the digits move and the dot stays.
function decShift({ v, f }, q, given) {
  const ans = Math.round(v * f), A = dec(v), Z = dec(ans);
  const split = s => { const [i, d = ''] = s.split('.'); return [i, d]; };
  const [ai, ad] = split(A), [zi, zd] = split(Z), I = Math.max(ai.length, zi.length), D = Math.max(ad.length, zd.length);
  const lay = (i, d) => i.padStart(I, ' ') + (D ? (d ? '.' + d.padEnd(D, ' ') : ' '.repeat(D + 1)) : '');
  const op = f === 10 ? '× 10' : f === 100 ? '× 100' : '÷ 10';
  // column names from the right: hundredths, tenths, the dot, ones, tens …
  const head = Array.from({ length: I + (D ? D + 1 : 0) }, (_, i) => (i < D ? (10 ** (i - D)).toFixed(D - i) : i === D && D ? '' : String(10 ** (i - (D ? D + 1 : 0)))));
  return {
    ans: Z,
    steps: [S(digitRows([{ s: lay(ai, ad) }, { s: lay(zi, zd) }], { head }), `${A} ${op} = ${Z}`, f < 1 ? 'shiftRight' : f === 100 ? 'shiftLeft2' : 'shiftLeft')],
    oops: (() => { if (given === undefined) return null; const g = toH(given); if (g === ans) return null; if (f >= 10 && g === v + f * 100) return OOPS(`${A} ${op} = ${Z}`, 'oopsAddTen', { a: f }); return [ans * 10, ans / 10, v / f, v * f * f].includes(g) ? OOPS(`${A} ${op} = ${Z}`, 'oopsShift') : null; })(),
  };
}
function decTimes({ n: t, m: k }, q, given) {
  const ans = t * k * 10;
  return {
    ans: dec(ans),
    steps: [S(dots(k, t), `${k} × ${t} = ${t * k}`, 'tenthsTimes', { a: t, b: k }), S('', `${t * k} × 0.1 = ${dec(ans)}`, 'tenthsBack', { a: t * k })],
    oops: given !== undefined && toH(given) === t * k ? OOPS(`${t * k} × 0.1 = ${dec(ans)}`, 'oopsDecPlace') : null,
  };
}

// ---------- percent ----------
function pctBars({ f }, q, given) {
  return { ans: `${f * 10}%`, steps: [S(q.visual, `${f} × 10% = ${f * 10}%`, 'pct10')], oops: given === `${f}%` ? OOPS('10%', 'oopsPctBar') : null };
}
function pctGrid({ n }, q, given) {
  return { ans: `${n}%`, steps: [S(q.visual, `${n} / 100 = ${n}%`, 'pct100', { a: n })], oops: given === `${100 - n}%` ? OOPS(`${n}%`, 'oopsEmpty') : null };
}
// p% of n: through a simple fraction when there is one, otherwise through 10%.
function pctOf({ p, n, sale }, q, given) {
  const v = (p * n) / 100, steps = [];
  if (p === 100) {
    steps.push(S(valueBar(n, 1, 1), `100% = ${n}`, 'pctAll'));
  } else if (100 % p === 0) {
    const k = 100 / p;
    steps.push(S(valueBar(n, k, 1), `${p}% = ${frac(1, k)}<br>${n} ÷ ${k} = ${v}`, 'pctFrac', { a: p, b: k }));
  } else if (p === 75) {
    steps.push(S(valueBar(n, 4, 3), `25% = ${frac(1, 4)}, ${n} ÷ 4 = ${n / 4}<br>3 × ${n / 4} = ${v}`, 'pctQuarters'));
  } else if (p % 10 === 0) {
    steps.push(S(valueBar(n, 10, p / 10), `10% = ${n / 10}<br>${p / 10} × ${n / 10} = ${v}`, 'pctTens', { a: p / 10 }));
  } else {
    // 15%: 10% and then half of that again
    steps.push(S(valueBar(n, 20, p / 5), `10% = ${n / 10}<br>5% = ${n / 20}${p === 15 ? `<br>${n / 10} + ${n / 20} = ${v}` : ''}`, p === 5 ? 'pctFive' : 'pctFifteen'));
  }
  if (!sale) return { ans: v, steps, oops: given === n - v ? OOPS(`${p}% × ${n} = ${v}`, 'oopsRest') : null };
  steps.push(S('', `${n} − ${v} = ${n - v}`, 'saleLeft', { a: v }));
  return { ans: n - v, steps, oops: given === v ? OOPS(`${n} − ${v}`, 'oopsSaleOff') : null };
}

// ---------- ratio and rate ----------
function ratio({ a, b, k, left }, q, given) {
  const ans = left ? a * k : b * k;
  return {
    ans,
    steps: [S(q.visual, left ? `${b * k}🍋 ÷ ${b}🍋 = ${k}` : `${a * k}🍓 ÷ ${a}🍓 = ${k}`, 'ratioTimes', { a: k }),
      S('', left ? `${a} × ${k} = ${a * k}🍓` : `${b} × ${k} = ${b * k}🍋`, 'ratioBoth', { a: k })],
    oops: given !== ans && given === (left ? a + (b * k - b) : b + (a * k - a)) ? OOPS(`× ${k}`, 'oopsRatioAdd') : null,
  };
}
function ratioSame({ a, b }, q) {
  const rows = q.choices.map(c => {
    const [x, y] = String(c.value).split(':').map(Number), ok = x * b === y * a;
    return [ok ? `${x}🍓 ${y}🍋 = ${a}🍓 ${b}🍋 × ${x / a}` : `${x}🍓 ${y}🍋`, ok, c.value];
  });
  return { ans: rows.find(r => r[1])?.[2], steps: [S(q.visual, `${a}🍓 ${b}🍋`, 'ratioCheck'), S(checks(rows), '', 'ratioSameTimes')] };
}
function unitRate({ n, unit, k }, q, given) {
  return {
    ans: k * unit,
    steps: [S(q.visual, `${n * unit} ÷ ${n} = ${unit}`, 'unitRate'), S('', `${k} × ${unit} = ${k * unit}`, 'unitTimes', { a: k })],
    oops: given !== k * unit && given === n * unit + (k - n) ? OOPS(`1🍬 = ${unit}🪙`, 'oopsRateAdd') : null,
  };
}

// ---------- fraction puzzles ----------
const COLS = [PINK, BLUE, SUN, '#8a5cd6'];
function unitFrac({ a, b, x }, q) {
  const L = lcm(b, x), top = (a * L) / b - L / x, y = L / top;
  const pic = L <= 48 ? segBar(L, [[L / x, PINK], [top, SUN]]) : '';
  return {
    ans: y,
    steps: [S(pic, `${frac(1, '?')} = ${frac(a, b)} − ${frac(1, x)}`, 'takeKnown'),
      S(pic, `${frac((a * L) / b, L)} − ${frac(L / x, L)} = ${frac(top, L)}${top > 1 ? ` = ${frac(1, y)}` : ''}`, b === x ? 'sameBottomSub' : 'sameCutSub')],
  };
}
function toOne({ set }, q) {
  const L = set.reduce((s, v) => lcm(s, v), 1), used = set.reduce((s, v) => s + L / v, 0), rest = L - used, z = L / rest;
  const pic = L <= 48 ? segBar(L, set.map((v, i) => [L / v, COLS[i]]), { hole: true }) : '';
  return {
    ans: z,
    steps: [S(pic, `${set.map(v => frac(L / v, L)).join(' + ')} = ${frac(used, L)}`, 'sameCutAll', { a: L }),
      S(pic, `${frac(L, L)} − ${frac(used, L)} = ${frac(rest, L)}${rest > 1 ? ` = ${frac(1, z)}` : ''}`, 'fillOne')],
  };
}
function eatLeft({ n, ks }, q, given) {
  const vals = [n], steps = [];
  const arcs = ks.map(k => `×${k - 1}/${k}`);
  for (const k of ks) {
    const left = vals[vals.length - 1], eat = left / k;
    vals.push(left - eat);
    const shown = [...vals, ...Array(ks.length + 1 - vals.length).fill(null)];
    shown[vals.length - 1] = { v: left - eat, hi: true };
    steps.push(S(tiles(shown, { arcs }), `${left} ÷ ${k} = ${eat}<br>${left} − ${eat} = ${left - eat}`, 'eatEach', { a: k }));
  }
  const ans = vals[vals.length - 1], naive = n / ks.reduce((s, k) => s * k, 1);
  return { ans, steps, oops: given === naive && naive !== ans ? OOPS(`${vals.join(' → ')}`, 'oopsNaive') : null };
}
function shareCake({ c, k }, q, given) {
  const g = parseFrac(given);
  return {
    ans: `${c}/${k}`,
    steps: [S(fbars(Array.from({ length: c }, () => [k, 1]), { cols: Array(c).fill(PINK) }), `${c} × ${frac(1, k)} = ${frac(c, k)}`, c === 1 ? 'shareCakes1' : 'shareCakes', { a: k, b: c })],
    oops: g && g[0] === k && g[1] === c ? OOPS(frac(c, k), 'oopsFlip') : null,
  };
}

export const CANDY_SOLVERS = {
  boxCount, factorPairs, primeAll, divisAll, divisWhich, digit9, fracScale, mixed, mixCmp, robot, addSame, addDiff,
  fracTimes, fdiv, scoopBack, decGrid, decLine, decFrac, decCmp, decAdd, decShift, decTimes, pctBars, pctGrid, pctOf,
  ratio, ratioSame, unitRate, unitFrac, toOne, eatLeft, shareCake,
};
