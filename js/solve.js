// The 🔍 solution sheet: after a question is answered, show how to solve it in a few picture steps.
// Free to open, and it never changes scores, gems or saves. Questions whose generator gives no
// q.sol yet get a simple sheet: the question solved, its 💡 picture and the ⓘ sentence.
import { SOLVERS } from './sol-basic.js';
import { helpFor } from './help.js';
import { sfx } from './audio.js';

const STEP_MS = 2600;

// The given answer as the player gave it: bubble values and typed digits arrive as text.
const norm = v => (v === undefined || v === null || v === '' ? undefined : typeof v === 'string' && v.trim() !== '' && !isNaN(v) ? Number(v) : v);

export function solutionFor(q, given, sid) {
  const g = norm(given);
  const t = q.sol?.t || (q.input === 'pairs' ? 'pairs' : q.input === 'multi' && !q.sol ? 'findall' : null);
  const solver = t && SOLVERS[t];
  if (solver) {
    try {
      const s = solver(q.sol || {}, q, g);
      if (s && s.steps?.length) return s;
    } catch (e) { console.warn('solution', t, e); }
  }
  return { fallback: true, steps: [{ pic: q.visual || '', math: '', say: helpFor(q, sid) }] };
}

// The question with its right answer filled in, and the player's answer crossed out when it was wrong.
function recap(q, given, ok) {
  const g = norm(given);
  let right = '', mine = '';
  if (q.input === 'multi') {
    right = `<div class="target">${q.target}</div><div class="solitems">${q.items.filter(x => x.ok).map(x => `<span>${x.html}</span>`).join('')}</div>`;
    return `<div class="solq multi">${right}</div>`;
  }
  if (q.input === 'pairs') return `<div class="solq"><div class="eq">${q.op === '×' ? '? × ?' : '? + ?'} = ${q.target}</div></div>`;
  const choice = q.choices?.find(c => String(c.value) === String(q.answer));
  const parts = q.input === 'pad' || !choice ? [String(q.answer)] : choice.fill || [choice.html];
  if (!ok && g !== undefined) {
    const mc = q.choices?.find(c => String(c.value) === String(given));
    mine = `<s class="solmine">${mc ? mc.html : given}</s>`;
  }
  if (q.eq && /\?|◯/.test(q.eq)) {
    let k = 0;
    const eq = q.eq.replace(/\?|◯/g, () => `<span class="slot filled">${parts[k++] ?? ''}</span>`);
    return `<div class="solq"><div class="eq">${eq}</div>${mine}</div>`;
  }
  return `<div class="solq">${q.eq ? `<div class="eq">${q.eq}</div>` : ''}<span class="solright">${parts.join(' ')}</span>${mine}</div>`;
}

// entry: { q, given, ok, sid }. onClose runs once when the sheet is closed.
export function openSolution(entry, onClose = () => {}) {
  document.querySelector('.solov')?.remove();
  const { q, given, ok, sid } = entry;
  const sol = solutionFor(q, given, sid);
  const steps = sol.oops && !ok ? [...sol.steps, sol.oops] : sol.steps;
  const ov = document.createElement('div');
  ov.className = 'overlay solov';
  ov.innerHTML = `
    <div class="popup solpop" role="dialog" aria-label="Solution">
      <button class="icon-btn close" id="solx" aria-label="Close">✖</button>
      ${recap(q, given, ok)}
      <div class="soldots">${steps.map((s, i) => `<i class="${s.oops ? 'oops' : ''}" data-i="${i}"></i>`).join('')}</div>
      <div class="solstep" aria-live="polite"><div class="solpic"></div><div class="solmath"></div><p class="solsay"></p></div>
      <div class="solnav">
        <button class="icon-btn" id="solprev" aria-label="Back">◀</button>
        <button class="icon-btn" id="solagain" aria-label="Play again">↻</button>
        <button class="icon-btn" id="solnext" aria-label="Next step">▶</button>
      </div>
    </div>`;
  document.body.appendChild(ov);
  const $ = s => ov.querySelector(s);
  let i = 0, timer = null, closed = false;
  const stepEl = $('.solstep');

  function show(k) {
    i = Math.max(0, Math.min(steps.length - 1, k));
    const s = steps[i];
    stepEl.classList.toggle('oops', !!s.oops);
    $('.solpic').innerHTML = s.pic ? `<div class="solfit">${s.pic}</div>` : '';
    $('.solpic').hidden = !s.pic;
    $('.solmath').innerHTML = s.math || '';
    $('.solmath').hidden = !s.math;
    $('.solsay').textContent = s.say || '';
    ov.querySelectorAll('.soldots i').forEach((d, j) => d.classList.toggle('on', j === i));
    $('#solprev').disabled = i === 0;
    $('#solnext').disabled = i === steps.length - 1;
    stepEl.classList.remove('in'); void stepEl.offsetWidth; stepEl.classList.add('in');
    fit();
  }
  // A picture that is too big for the sheet shrinks to fit. Layout sizes, so the sheet's pop-in doesn't matter.
  function fit() {
    const box = $('.solpic'), el = box.firstElementChild;
    if (!el) return;
    el.style.transform = ''; el.style.margin = '';
    const w = el.offsetWidth, h = el.offsetHeight;
    const k = Math.min(1, box.clientWidth / w, box.clientHeight / h);
    if (k < 1) {
      el.style.transform = `scale(${k.toFixed(3)})`;
      el.style.margin = `${(-(1 - k) * h) / 2}px ${(-(1 - k) * w) / 2}px`;
    }
  }
  const stop = () => { clearInterval(timer); timer = null; };
  function play() {
    stop();
    show(0);
    if (steps.length > 1) timer = setInterval(() => { if (i >= steps.length - 1) return stop(); show(i + 1); }, STEP_MS);
  }
  function close() {
    if (closed) return;
    closed = true;
    stop();
    sfx.tap();
    ov.remove();
    onClose();
  }
  $('#solx').onclick = close;
  ov.onclick = e => { if (e.target === ov) close(); };
  $('#solprev').onclick = () => { stop(); sfx.tap(); show(i - 1); };
  $('#solnext').onclick = () => { stop(); sfx.tap(); show(i + 1); };
  $('#solagain').onclick = () => { sfx.tap(); play(); };
  ov.querySelectorAll('.soldots i').forEach(d => { d.onclick = () => { stop(); show(+d.dataset.i); }; });
  play();
  return close;
}

// Tiles for every question of a round, shown on the results screen. Tap one to see its solution.
export function lookBackHTML(log) {
  if (!log?.length) return '';
  return `<div class="lookback" aria-label="Solutions for this round"><span class="lbicon">🔍</span><div class="lbtiles">${
    log.map((e, i) => `<button class="lbtile ${e.ok ? 'ok' : 'no'}" data-i="${i}" aria-label="Question ${i + 1}">${i + 1}<b>${e.ok ? '✓' : '✗'}</b></button>`).join('')}</div></div>`;
}
export function bindLookBack(root, log) {
  root.querySelectorAll('.lbtile').forEach(b => { b.onclick = () => { sfx.tap(); openSolution(log[+b.dataset.i]); }; });
}
