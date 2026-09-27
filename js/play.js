// One round of questions: a normal stage round, a golden-gate skip test, the placement quest or the boss.
import * as P from './progress.js';
import { sfx } from './audio.js';
import { LEARN } from './skills.js';
import { WORLDS, learnOf } from './worlds.js';
import { helpFor } from './help.js';

const wait = ms => new Promise(r => setTimeout(r, ms));
const pick = a => a[Math.floor(Math.random() * a.length)];
const ROUND = 10, GATE = 8, GATE_PASS = 7, BOSS_HP = 15, BOSS_HEARTS = 3;

// Stars for a 10-question round: 7 right opens the next stage.
export const starsFor = correct => (correct >= 10 ? 3 : correct >= 9 ? 2 : correct >= 7 ? 1 : 0);

// Turn a tap-a-bubble number question into a typed one (used to make skip tests harder).
function toPad(q) {
  if (q.input === 'choice' && typeof q.answer === 'number' && !q.layout && /\?/.test(q.eq)) q.input = 'pad';
  return q;
}

// opts: { mode: 'normal' | 'gate' | 'placement' | 'boss', stage, world (for the boss), onQuit, onDone(result) }
export function startRound(app, opts) {
  const { mode, stage } = opts;
  const world = opts.world || WORLDS[0];
  const bossPool = learnOf(world);
  const p = P.me();
  const total = mode === 'gate' ? GATE : ROUND;
  const startLvl = mode === 'normal' ? Math.max(0, (P.stageRec(p, stage.id).stars || 0) - 1) : 2;
  const st = {
    i: 0, correct: 0, streak: 0, best: 0, lvl: startLvl, gems: 0, redo: [], busy: true, demo: false, lastKey: '',
    goldenUsed: false, hp: BOSS_HP, hearts: BOSS_HEARTS,
  };
  const pl = { si: 0, right: 0, miss: 0 }; // placement: current stage index and its score
  let q = null;
  let typed = '';
  let sel = null; // selected card in a pairs question
  let over = false;

  app.innerHTML = `
    <div class="play ${mode}">
      <div class="topbar">
        <button class="icon-btn" id="quit" aria-label="Back to map">✖</button>
        <div class="prog"><i id="progfill"></i></div>
        <button class="icon-btn info" id="info" aria-label="What to do">i</button>
        <div class="gem-count"><span>💎</span><b id="gems">${p.gems}</b></div>
      </div>
      ${mode === 'boss' ? `<div class="bossbar"><span class="boss" id="boss">${world.boss}</span><div class="hp"><i id="hpfill"></i></div><span class="hearts" id="hearts"></span></div>` : ''}
      <div class="streak" id="streak" aria-live="polite"></div>
      <div class="card" id="card">
        ${mode === 'gate' ? '<div class="modebadge">⚡</div>' : mode === 'placement' ? '<div class="modebadge">🚀</div>' : ''}
        <div class="eq" id="eq"></div>
        <div class="vis" id="vis"></div>
        <button class="bug" id="bug" hidden aria-label="Catch the bug">🐞</button>
      </div>
      <div class="answers" id="answers"></div>
      <div class="bottombar">
        <button class="icon-btn" id="hint" aria-label="Hint">💡</button>
        <div class="pet-mini" id="petmini">${P.petEmoji(p)}${p.pet.hat ? `<span class="hat">${p.pet.hat}</span>` : ''}</div>
        <button class="icon-btn" id="showme" aria-label="Show me how">👀</button>
      </div>
    </div>`;

  const $ = id => app.querySelector('#' + id);
  const eqEl = $('eq'), visEl = $('vis'), ansEl = $('answers'), hintBtn = $('hint'), cardEl = $('card');

  $('quit').onclick = () => { over = true; document.querySelector('.infopop')?.parentNode.remove(); sfx.tap(); opts.onQuit(); };
  hintBtn.onclick = () => {
    if (!q || st.busy || !q.visual || q.show) return;
    q.show = true; q.hinted = true;
    visEl.innerHTML = q.visual;
    visEl.classList.add('pop');
    hintBtn.disabled = true;
    sfx.tap();
  };
  // ⓘ: what this question asks, in words, for parents and kids who read. Free, and it doesn't pause scoring.
  $('info').onclick = () => {
    if (!q || over || document.querySelector('.overlay')) return;
    sfx.tap();
    const ov = document.createElement('div');
    ov.className = 'overlay infoov';
    ov.innerHTML = `<div class="popup infopop" role="dialog" aria-label="What to do"><span class="infoicon">i</span><p></p><button class="icon-btn close" aria-label="Close">✖</button></div>`;
    ov.querySelector('p').textContent = helpFor(q, mode === 'normal' || mode === 'gate' ? stage.id : undefined);
    ov.onclick = () => ov.remove();
    document.body.appendChild(ov);
  };
  $('showme').onclick = () => {
    if (st.busy || over) return;
    const current = q;
    demo(currentGen(), () => { render(current); st.busy = false; });
  };

  // ---------- small helpers ----------
  const currentGen = () => (mode === 'placement' ? LEARN[Math.min(pl.si, LEARN.length - 1)].gen
    : mode === 'boss' ? (q?.gen || bossPool[0].gen) : stage.gen);

  function setProgress() {
    const f = mode === 'placement' ? pl.si / LEARN.length : mode === 'boss' ? 1 - st.hp / BOSS_HP : st.i / total;
    $('progfill').style.width = Math.round(Math.max(0, Math.min(1, f)) * 100) + '%';
  }

  function bossUI() {
    if (mode !== 'boss') return;
    $('hpfill').style.width = Math.max(0, (st.hp / BOSS_HP) * 100) + '%';
    $('hearts').textContent = '❤️'.repeat(st.hearts) + '🤍'.repeat(BOSS_HEARTS - st.hearts);
  }

  const slots = () => [...cardEl.querySelectorAll('.slot:not(.mini)')];

  function fillSlot(parts, fix = false) {
    slots().forEach((s, i) => {
      if (i >= parts.length) return;
      s.innerHTML = parts[i];
      s.classList.remove('typing');
      s.classList.add(fix ? 'fixed' : 'filled');
    });
  }
  const rightParts = () => {
    if (q.input === 'pad') return [String(q.answer)];
    const c = q.choices.find(x => String(x.value) === String(q.answer));
    return c.fill || [c.html];
  };

  function floatGems(n) {
    const g = document.createElement('div');
    g.className = 'floater';
    g.textContent = '+' + n;
    cardEl.appendChild(g);
    setTimeout(() => g.remove(), 900);
  }

  function addGems(n) {
    st.gems += n; p.gems += n;
    $('gems').textContent = p.gems;
    floatGems(n);
  }

  function pet(cls) {
    const el = $('petmini');
    el.classList.remove('hop', 'sad', 'dance');
    void el.offsetWidth;
    el.classList.add(cls);
  }

  function showStreak() {
    const s = st.streak;
    const el = $('streak');
    el.innerHTML = s >= 3 ? `🔥 ${s}${s >= 10 ? ' <b>×3</b>' : s >= 5 ? ' <b>×2</b>' : ''}` : '';
    el.classList.toggle('hot', s >= 5);
  }

  // A ladybug sometimes walks across the card. Catch it for gems.
  function maybeBug() {
    const bug = $('bug');
    bug.hidden = true;
    bug.classList.remove('crawl');
    if (mode !== 'normal' || Math.random() > 0.1) return;
    bug.style.top = 20 + Math.random() * 60 + '%';
    bug.hidden = false;
    void bug.offsetWidth;
    bug.classList.add('crawl');
    bug.onclick = () => { bug.hidden = true; sfx.star(); addGems(10); };
    bug.onanimationend = () => { bug.hidden = true; };
  }

  // ---------- drawing a question ----------
  function render(question) {
    q = question;
    window.__mwq = q; // lets automated tests read the current question
    if (q.show0 === undefined) q.show0 = q.show;
    q.misses = 0;
    typed = '';
    sel = null;
    cardEl.classList.toggle('golden', !!q.golden);
    cardEl.classList.toggle('small', !!q.small);
    if (q.input === 'multi') {
      const n = q.items.filter(x => x.ok).length;
      eqEl.innerHTML = `<div class="target">${q.target}</div><div class="counter">${'<span class="slot mini"></span>'.repeat(n)}</div>`;
    } else if (q.input === 'pairs') {
      eqEl.innerHTML = `<div><span class="slot">?</span> ${q.op} <span class="slot">?</span> = ${q.target}</div><div class="counter">${'<span class="slot mini"></span>'.repeat(q.need)}</div>`;
    } else {
      eqEl.innerHTML = q.eq.split('?').join('<span class="slot">?</span>').split('◯').join('<span class="slot"></span>');
    }
    eqEl.hidden = !eqEl.innerHTML;
    fitEq();
    eqEl.classList.toggle('tfq', !!q.tf);
    visEl.classList.remove('pop');
    visEl.innerHTML = q.show && q.visual ? q.visual : '';
    hintBtn.disabled = !q.visual || q.show || mode === 'gate' || mode === 'boss';
    const layout = q.input === 'pad' ? 'pad' : q.input === 'multi' ? (q.grid3 ? 'multi g3' : 'multi') : q.input === 'pairs' ? 'multi g4' : q.layout || 'grid';
    ansEl.className = 'answers ' + layout + (q.small ? ' small' : '');
    if (q.input === 'pad') {
      if (!slots().length) eqEl.insertAdjacentHTML('beforeend', ' <span class="slot">?</span>');
      ansEl.innerHTML = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => `<button class="key" data-k="${d}">${d}</button>`).join('') +
        `<button class="key del" data-k="del" aria-label="Delete">⌫</button><button class="key" data-k="0">0</button><button class="key go" data-k="ok" aria-label="Check">✔</button>`;
      ansEl.querySelectorAll('.key').forEach(b => { b.onclick = () => padKey(b.dataset.k); });
      fitEq();
    } else if (q.input === 'multi') {
      ansEl.innerHTML = q.items.map((it, i) => `<button class="choice item" data-i="${i}" data-ok="${it.ok ? 1 : 0}">${it.html}</button>`).join('');
      ansEl.querySelectorAll('.item').forEach(b => { b.onclick = () => multiTap(+b.dataset.i, b); });
    } else if (q.input === 'pairs') {
      ansEl.innerHTML = q.cards.map((c, i) => `<button class="choice item" data-i="${i}">${c.v}</button>`).join('');
      ansEl.querySelectorAll('.item').forEach(b => { b.onclick = () => pairTap(+b.dataset.i, b); });
    } else {
      ansEl.innerHTML = q.choices.map(c => `<button class="choice" data-v="${c.value}">${c.html}</button>`).join('');
      ansEl.querySelectorAll('.choice').forEach(b => { b.onclick = () => answer(b.dataset.v, b); });
    }
    setProgress();
  }

  const blocked = () => (st.busy && !st.demo) || over;

  // Typed digits go straight into the yellow slot.
  function padKey(k) {
    if (blocked()) return;
    const slot = slots()[0];
    if (k === 'del') typed = typed.slice(0, -1);
    else if (k === 'ok') { if (typed) answer(typed, slot); return; }
    else if (typed.length < 3) typed += k;
    sfx.tap();
    slot.textContent = typed || '?';
    slot.classList.toggle('typing', !!typed);
  }

  function answer(v, el) {
    if (blocked()) return;
    resolve(String(v) === String(q.answer), el);
  }

  function multiTap(i, btn) {
    if (blocked()) return;
    const it = q.items[i];
    if (it.done) return;
    if (it.ok) {
      it.done = true;
      btn.classList.add('ok');
      btn.disabled = true;
      sfx.tap();
      const slot = cardEl.querySelector('.slot.mini:not(.filled)');
      if (slot) { slot.textContent = '✓'; slot.classList.add('filled'); }
      if (q.items.every(x => !x.ok || x.done)) resolve(q.misses === 0, null);
    } else {
      q.misses++;
      btn.classList.add('bad');
      sfx.bad();
      setTimeout(() => btn.classList.remove('bad'), 450);
      if (q.misses >= 3) {
        ansEl.querySelectorAll('.item[data-ok="1"]:not(.ok)').forEach(b => b.classList.add('right'));
        resolve(false, null);
      }
    }
  }

  // Long puzzle equations shrink to fit the card instead of running off its edges.
  function fitEq() {
    eqEl.style.fontSize = '';
    eqEl.style.width = 'max-content';
    const max = cardEl.clientWidth - 28, w = eqEl.getBoundingClientRect().width;
    eqEl.style.width = '';
    if (w > max) eqEl.style.fontSize = Math.floor(parseFloat(getComputedStyle(eqEl).fontSize) * max / w) + 'px';
  }

  function pairTap(i, btn) {
    if (blocked()) return;
    const card = q.cards[i];
    if (card.done) return;
    const [s1, s2] = slots();
    if (sel === null) {
      sel = i; btn.classList.add('sel'); s1.textContent = card.v; sfx.tap();
      return;
    }
    const first = ansEl.querySelector(`.item[data-i="${sel}"]`);
    if (sel === i) { sel = null; btn.classList.remove('sel'); s1.textContent = '?'; return; }
    s2.textContent = card.v;
    const a = q.cards[sel].v, b = card.v;
    const ok = (q.op === '×' ? a * b : a + b) === q.target;
    sel = null;
    first.classList.remove('sel');
    if (ok) {
      q.cards[+first.dataset.i].done = card.done = true;
      [first, btn].forEach(b2 => { b2.classList.add('ok'); b2.disabled = true; });
      sfx.tap();
      const slot = cardEl.querySelector('.slot.mini:not(.filled)');
      if (slot) { slot.textContent = `${a}${q.op}${b}`; slot.classList.add('filled'); }
      setTimeout(() => { s1.textContent = '?'; s2.textContent = '?'; }, 400);
      if (cardEl.querySelectorAll('.slot.mini.filled').length >= q.need) resolve(q.misses === 0, null);
    } else {
      q.misses++;
      sfx.bad();
      [first, btn].forEach(b2 => b2.classList.add('bad'));
      setTimeout(() => { [first, btn].forEach(b2 => b2.classList.remove('bad')); s1.textContent = '?'; s2.textContent = '?'; }, 450);
      if (q.misses >= 3) resolve(false, null);
    }
  }

  // One place that scores every question type.
  function resolve(ok, el) {
    st.busy = true;
    if (st.demo) {
      if (el) el.classList.add('ok');
      if (q.input === 'choice' || q.input === 'pad') fillSlot(rightParts());
      sfx.ok();
      return;
    }
    if (ok) {
      sfx.ok();
      if (el) el.classList.add('ok');
      if (q.input === 'choice' || q.input === 'pad') fillSlot(rightParts());
      st.streak++;
      st.best = Math.max(st.best, st.streak);
      if (st.streak === 5 || st.streak === 10) setTimeout(sfx.streak, 150);
      const mult = st.streak >= 10 ? 3 : st.streak >= 5 ? 2 : 1;
      const gain = q.redo ? 1 : (q.hinted ? 2 : 5) * mult * (q.golden ? 5 : 1);
      addGems(gain);
      if (q.golden) setTimeout(sfx.chest, 200);
      if (!q.redo) st.correct++;
      if (mode === 'normal' && st.streak % 3 === 0 && st.lvl < 2) st.lvl++;
      pet(st.streak >= 5 ? 'dance' : 'hop');
      if (mode === 'boss') {
        st.hp -= st.streak >= 3 ? 2 : 1;
        const b = $('boss'); b.classList.remove('hit'); void b.offsetWidth; b.classList.add('hit');
      }
    } else {
      sfx.bad();
      if (el) el.classList.add('bad');
      st.streak = 0;
      if (mode === 'normal') st.lvl = Math.max(0, st.lvl - 1);
      if (q.input === 'pad') {
        setTimeout(() => fillSlot(rightParts(), true), 450);
      } else if (q.input === 'choice') {
        ansEl.querySelector(`[data-v="${CSS.escape(String(q.answer))}"]`)?.classList.add('right');
        setTimeout(() => fillSlot(rightParts(), true), 450);
      }
      if (q.visual && !q.show) { visEl.innerHTML = q.visual; visEl.classList.add('pop'); }
      // A missed question comes back later, with its picture if it needs one.
      if (mode === 'normal' && !q.redo) {
        const again = JSON.parse(JSON.stringify(q));
        (again.items || again.cards || []).forEach(x => { x.done = false; });
        st.redo.push({ ...again, gen: q.gen, redo: true, show: q.show0, hinted: false, golden: false });
      }
      pet('sad');
      if (mode === 'boss') {
        st.hearts--;
        const b = $('boss'); b.classList.remove('laugh'); void b.offsetWidth; b.classList.add('laugh');
      }
    }
    showStreak();
    bossUI();
    if (!q.redo) st.i++;
    if (mode === 'placement') {
      ok ? pl.right++ : pl.miss++;
      if (pl.right >= 2) { pl.si++; pl.right = 0; pl.miss = 0; }
    }
    P.save();
    setProgress();
    setTimeout(next, ok ? 800 : 2200);
  }

  function fresh(gen, lvl) {
    let nq;
    for (let k = 0; k < 6; k++) {
      nq = gen(lvl);
      const key = nq.eq + (nq.visual || '') + nq.answer + (nq.target || '');
      if (key !== st.lastKey) { st.lastKey = key; break; }
    }
    nq.gen = gen;
    return nq;
  }

  function next() {
    if (over) return;
    let nq;
    if (mode === 'placement') {
      if (pl.miss >= 2 || pl.si >= LEARN.length) return finish();
      nq = fresh(LEARN[pl.si].gen, 2);
    } else if (mode === 'boss') {
      if (st.hp <= 0 || st.hearts <= 0) return finish();
      nq = fresh(pick(bossPool).gen, Math.random() < 0.6 ? 2 : 1);
    } else if (st.i < total) {
      nq = fresh(stage.gen, st.lvl);
      if (mode === 'gate' && Math.random() < 0.6) toPad(nq);
      if (mode === 'normal' && !st.goldenUsed && st.i >= 2 && Math.random() < 0.15) { nq.golden = true; st.goldenUsed = true; }
    } else if (st.redo.length) {
      nq = st.redo.shift();
    } else {
      return finish();
    }
    render(nq);
    maybeBug();
    st.busy = false;
  }

  function finish() {
    over = true;
    document.querySelector('.infopop')?.parentNode.remove();
    const r = { mode, gems: st.gems, correct: st.correct, total, best: st.best };
    if (mode === 'normal') r.stars = starsFor(st.correct);
    else if (mode === 'gate') r.stars = st.correct >= GATE_PASS ? 3 : 0;
    else if (mode === 'boss') r.win = st.hp <= 0;
    else r.placedAt = pl.si;
    opts.onDone(r);
  }

  // Watch-then-try: a hand answers one question. Plays the first time a stage opens and on 👀.
  async function demo(gen, then) {
    const dq = gen(0);
    dq.gen = gen;
    dq.show = !!dq.visual;
    render(dq);
    st.busy = true;
    st.demo = true;
    const hand = document.getElementById('hand');
    let targets;
    if (dq.input === 'pad') {
      targets = [...String(dq.answer)].map(d => ansEl.querySelector(`[data-k="${d}"]`)).concat(ansEl.querySelector('[data-k="ok"]'));
    } else if (dq.input === 'multi') {
      targets = [...ansEl.querySelectorAll('.item[data-ok="1"]')];
    } else if (dq.input === 'pairs') {
      targets = [];
      const used = new Set();
      dq.cards.forEach((c, i) => {
        if (used.has(i)) return;
        const j = dq.cards.findIndex((d, k) => k !== i && !used.has(k) && (dq.op === '×' ? c.v * d.v : c.v + d.v) === dq.target);
        if (j >= 0 && targets.length / 2 < dq.need) { used.add(i); used.add(j); targets.push(ansEl.querySelector(`.item[data-i="${i}"]`), ansEl.querySelector(`.item[data-i="${j}"]`)); }
      });
    } else {
      targets = [ansEl.querySelector(`[data-v="${CSS.escape(String(dq.answer))}"]`)];
    }
    hand.style.transition = 'none';
    hand.style.left = '50%'; hand.style.top = '110%';
    hand.hidden = false;
    await wait(600);
    hand.style.transition = '';
    for (const t of targets) {
      if (over || !t) break;
      const r = t.getBoundingClientRect();
      hand.style.left = r.left + r.width / 2 + 'px';
      hand.style.top = r.top + r.height / 2 + 'px';
      await wait(900);
      if (over) break;
      hand.classList.add('tap'); t.classList.add('pressed');
      t.click();
      await wait(300);
      hand.classList.remove('tap'); t.classList.remove('pressed');
    }
    if (!over) await wait(1400);
    hand.hidden = true;
    st.demo = false;
    if (!over) then();
  }

  bossUI();
  if (mode === 'normal' && !P.stageRec(p, stage.id).demo) {
    demo(stage.gen, () => { P.stageRec(p, stage.id).demo = true; P.save(); next(); });
  } else next();
}
