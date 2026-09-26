// One round of questions: a normal stage round, a golden-gate skip test, or the placement quest.
import * as P from './progress.js';
import { sfx } from './audio.js';
import { STAGES } from './skills.js';

const wait = ms => new Promise(r => setTimeout(r, ms));
const ROUND = 10, GATE = 8, GATE_PASS = 7;

// opts: { mode: 'normal' | 'gate' | 'placement', stage, onQuit, onDone(result) }
export function startRound(app, opts) {
  const { mode, stage } = opts;
  const p = P.me();
  const total = mode === 'gate' ? GATE : ROUND;
  const st = { i: 0, correct: 0, streak: 0, best: 0, lvl: mode === 'gate' ? 2 : mode === 'placement' ? 1 : 0, gems: 0, redo: [], busy: true, lastEq: '' };
  const pl = { si: 0, right: 0, miss: 0 }; // placement: current stage index and its score
  let q = null;
  let typed = '';
  let over = false;

  app.innerHTML = `
    <div class="play ${mode}">
      <div class="topbar">
        <button class="icon-btn" id="quit" aria-label="Back to map">✖</button>
        <div class="prog"><i id="progfill"></i></div>
        <div class="gem-count"><span>💎</span><b id="gems">${p.gems}</b></div>
      </div>
      <div class="streak" id="streak" aria-live="polite"></div>
      <div class="card" id="card">
        ${mode === 'gate' ? '<div class="modebadge">⚡</div>' : mode === 'placement' ? '<div class="modebadge">🚀</div>' : ''}
        <div class="eq" id="eq"></div>
        <div class="vis" id="vis"></div>
      </div>
      <div class="answers" id="answers"></div>
      <div class="bottombar">
        <button class="icon-btn" id="hint" aria-label="Hint">💡</button>
        <div class="pet-mini" id="petmini">${P.petEmoji(p)}${p.pet.hat ? `<span class="hat">${p.pet.hat}</span>` : ''}</div>
        ${mode === 'gate' ? `<div class="stage-mini">${stage.icon}</div>` : '<button class="icon-btn" id="showme" aria-label="Show me how">👀</button>'}
      </div>
    </div>`;

  const $ = id => app.querySelector('#' + id);
  const eqEl = $('eq'), visEl = $('vis'), ansEl = $('answers'), hintBtn = $('hint');

  $('quit').onclick = () => { over = true; sfx.tap(); opts.onQuit(); };
  hintBtn.onclick = () => {
    if (!q || st.busy || !q.visual || q.show) return;
    q.show = true; q.hinted = true;
    visEl.innerHTML = q.visual;
    visEl.classList.add('pop');
    hintBtn.disabled = true;
    sfx.tap();
  };

  const showBtn = $('showme');
  if (showBtn) showBtn.onclick = () => {
    if (st.busy || over) return;
    const current = q;
    const gen = mode === 'placement' ? STAGES[Math.min(pl.si, STAGES.length - 1)].gen : stage.gen;
    demo(gen, () => { render(current); st.busy = false; });
  };

  function setProgress() {
    const f = mode === 'placement' ? pl.si / STAGES.length : st.i / total;
    $('progfill').style.width = Math.round(f * 100) + '%';
  }

  function render(question) {
    q = question;
    window.__mwq = q; // lets automated tests read the current question
    typed = '';
    eqEl.textContent = q.eq;
    eqEl.hidden = !q.eq;
    visEl.classList.remove('pop');
    visEl.innerHTML = q.show && q.visual ? q.visual : '';
    hintBtn.disabled = !q.visual || q.show || mode === 'gate';
    ansEl.className = 'answers ' + (q.input === 'pad' ? 'pad' : q.layout || 'grid');
    if (q.input === 'pad') {
      ansEl.innerHTML = `<div class="padshow" id="padshow"></div>` +
        [1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => `<button class="key" data-k="${d}">${d}</button>`).join('') +
        `<button class="key del" data-k="del" aria-label="Delete">⌫</button><button class="key" data-k="0">0</button><button class="key go" data-k="ok" aria-label="Check">✔</button>`;
      ansEl.querySelectorAll('.key').forEach(b => { b.onclick = () => padKey(b.dataset.k); });
    } else {
      ansEl.innerHTML = q.choices.map(c => `<button class="choice" data-v="${c.value}">${c.html}</button>`).join('');
      ansEl.querySelectorAll('.choice').forEach(b => { b.onclick = () => answer(b.dataset.v, b); });
    }
    setProgress();
  }

  function padKey(k) {
    if (st.busy) return;
    const show = ansEl.querySelector('#padshow');
    if (k === 'del') typed = typed.slice(0, -1);
    else if (k === 'ok') { if (typed) answer(typed, show); return; }
    else if (typed.length < 3) typed += k;
    sfx.tap();
    show.textContent = typed;
  }

  function floatGems(n) {
    const g = document.createElement('div');
    g.className = 'floater';
    g.textContent = '+' + n;
    $('card').appendChild(g);
    setTimeout(() => g.remove(), 900);
  }

  function showStreak() {
    const s = st.streak;
    const el = $('streak');
    el.innerHTML = s >= 3 ? `🔥 ${s}${s >= 10 ? ' <b>×3</b>' : s >= 5 ? ' <b>×2</b>' : ''}` : '';
    el.classList.toggle('hot', s >= 5);
  }

  function answer(v, el) {
    if (st.busy || over) return;
    st.busy = true;
    const ok = String(v) === String(q.answer);
    if (ok) {
      sfx.ok();
      el.classList.add('ok');
      st.streak++;
      st.best = Math.max(st.best, st.streak);
      if (st.streak === 5 || st.streak === 10) setTimeout(sfx.streak, 150);
      const mult = st.streak >= 10 ? 3 : st.streak >= 5 ? 2 : 1;
      const gain = q.redo ? 1 : (q.hinted ? 2 : 5) * mult;
      st.gems += gain; p.gems += gain;
      $('gems').textContent = p.gems;
      floatGems(gain);
      if (!q.redo) st.correct++;
      if (mode === 'normal' && st.streak % 3 === 0 && st.lvl < 2) st.lvl++;
    } else {
      sfx.bad();
      el.classList.add('bad');
      st.streak = 0;
      if (mode === 'normal') st.lvl = Math.max(0, st.lvl - 1);
      if (q.input === 'pad') {
        setTimeout(() => { el.textContent = q.answer; el.classList.remove('bad'); el.classList.add('ok'); }, 450);
      } else {
        ansEl.querySelector(`[data-v="${q.answer}"]`)?.classList.add('right');
      }
      if (q.visual && !q.show) { visEl.innerHTML = q.visual; visEl.classList.add('pop'); }
      if (mode === 'normal' && !q.redo) st.redo.push({ ...q, redo: true, show: false, hinted: false });
    }
    showStreak();
    if (!q.redo) st.i++;
    if (mode === 'placement') {
      ok ? pl.right++ : pl.miss++;
      if (pl.right >= 3) { pl.si++; pl.right = 0; pl.miss = 0; }
    }
    P.save();
    setProgress();
    setTimeout(next, ok ? 750 : 2000);
  }

  function fresh(gen, lvl) {
    let nq;
    for (let k = 0; k < 6; k++) {
      nq = gen(lvl);
      const key = nq.eq + (nq.visual || '') + nq.answer;
      if (key !== st.lastEq) { st.lastEq = key; break; }
    }
    return nq;
  }

  function next() {
    if (over) return;
    if (mode === 'placement') {
      if (pl.miss >= 2 || pl.si >= STAGES.length) return finish();
      render(fresh(STAGES[pl.si].gen, 1));
    } else if (st.i < total) {
      render(fresh(stage.gen, st.lvl));
    } else if (st.redo.length) {
      render(st.redo.shift());
    } else {
      return finish();
    }
    st.busy = false;
  }

  function finish() {
    over = true;
    const r = { mode, gems: st.gems, correct: st.correct, total, best: st.best };
    if (mode === 'normal') {
      const acc = st.correct / total;
      r.stars = acc >= 0.9 ? 3 : acc >= 0.7 ? 2 : acc >= 0.5 ? 1 : 0;
    } else if (mode === 'gate') {
      r.stars = st.correct >= GATE_PASS ? 3 : 0;
    } else {
      r.placedAt = pl.si;
    }
    opts.onDone(r);
  }

  // Watch-then-try: a hand shows how to answer. Plays the first time a stage opens and on 👀.
  async function demo(gen, then) {
    const dq = gen(0);
    dq.show = !!dq.visual;
    render(dq);
    st.busy = true;
    const hand = document.getElementById('hand');
    const targets = dq.input === 'pad'
      ? [...String(dq.answer)].map(d => ansEl.querySelector(`[data-k="${d}"]`)).concat(ansEl.querySelector('[data-k="ok"]'))
      : [ansEl.querySelector(`[data-v="${dq.answer}"]`)];
    hand.style.transition = 'none';
    hand.style.left = '50%'; hand.style.top = '110%';
    hand.hidden = false;
    await wait(600);
    hand.style.transition = '';
    let shown = '';
    for (const t of targets) {
      if (over) break;
      const r = t.getBoundingClientRect();
      hand.style.left = r.left + r.width / 2 + 'px';
      hand.style.top = r.top + r.height / 2 + 'px';
      await wait(1000);
      if (over) break;
      hand.classList.add('tap'); t.classList.add('pressed');
      sfx.tap();
      if (dq.input === 'pad' && t.dataset.k !== 'ok') { shown += t.dataset.k; ansEl.querySelector('#padshow').textContent = shown; }
      await wait(300);
      hand.classList.remove('tap'); t.classList.remove('pressed');
    }
    if (!over) {
      (dq.input === 'pad' ? ansEl.querySelector('#padshow') : targets[0]).classList.add('ok');
      sfx.ok();
      await wait(1500);
    }
    hand.hidden = true;
    if (!over) then();
  }

  if (mode === 'normal' && !P.stageRec(p, stage.id).demo) {
    demo(stage.gen, () => { P.stageRec(p, stage.id).demo = true; P.save(); next(); });
  } else next();
}
