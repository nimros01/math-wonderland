// Screens: players, map, stage popup, results, pet and sticker book, parent corner.
import * as P from './progress.js';
import { sfx, unlockAudio } from './audio.js';
import { STAGES, STICKERS, HATS, AVATARS } from './skills.js';
import { startRound } from './play.js';

const app = document.getElementById('app');
const pick = a => a[Math.floor(Math.random() * a.length)];
const starsHTML = n => [1, 2, 3].map(i => `<i class="${i <= n ? 'on' : ''}">★</i>`).join('');

document.addEventListener('pointerdown', unlockAudio, { capture: true });

function petHTML(p, cls = '') {
  return `<span class="pet ${cls} s${p.pet.stage}">${P.petEmoji(p)}${p.pet.hat ? `<span class="hat">${p.pet.hat}</span>` : ''}</span>`;
}

// Players
function home() {
  const ps = P.state.profiles;
  app.innerHTML = `
    <div class="home">
      <h1 class="logo">Math<br>Wonderland</h1>
      <div class="logo-art">🌻 ➕ 🌈 ✖️ 🦋</div>
      <div class="players">
        ${ps.map(p => `<button class="player" data-id="${p.id}"><span class="av">${p.avatar}</span><span class="pg">💎 ${p.gems}</span></button>`).join('')}
        ${ps.length < 4 ? '<button class="player add" id="add" aria-label="New player"><span class="av">＋</span></button>' : ''}
      </div>
    </div>`;
  app.querySelectorAll('.player[data-id]').forEach(b => {
    b.onclick = () => { sfx.tap(); P.state.current = b.dataset.id; P.save(); map(); };
  });
  const add = app.querySelector('#add');
  if (add) add.onclick = () => { sfx.tap(); newPlayer(); };
}

function newPlayer() {
  app.innerHTML = `
    <div class="home">
      <button class="icon-btn back" id="back" aria-label="Back">⬅</button>
      <div class="big-q">🙂 ❓</div>
      <div class="avatars">${AVATARS.map(a => `<button class="avatar" data-a="${a}">${a}</button>`).join('')}</div>
    </div>`;
  app.querySelector('#back').onclick = () => { sfx.tap(); home(); };
  app.querySelectorAll('.avatar').forEach(b => {
    b.onclick = () => { sfx.ok(); P.addProfile(b.dataset.a); startChoice(); };
  });
}

// Start from the beginning, or take the placement quest to skip what you know.
function startChoice() {
  const p = P.me();
  app.innerHTML = `
    <div class="home">
      <div class="big-q">${p.avatar}</div>
      <div class="start-choice">
        <button class="bigbtn green" id="begin"><span>🌱</span><small>1 → </small></button>
        <button class="bigbtn gold" id="quest"><span>🚀</span><small>⭐ ⭐ ⭐</small></button>
      </div>
    </div>`;
  app.querySelector('#begin').onclick = () => { sfx.tap(); map(); };
  app.querySelector('#quest').onclick = () => {
    sfx.tap();
    startRound(app, { mode: 'placement', onQuit: map, onDone: placementDone });
  };
}

function placementDone(r) {
  const p = P.me();
  for (let i = 0; i < r.placedAt; i++) {
    const rec = P.stageRec(p, STAGES[i].id);
    rec.stars = Math.max(rec.stars, 2);
    rec.demo = true;
  }
  P.hatch(p);
  P.save();
  const at = STAGES[Math.min(r.placedAt, STAGES.length - 1)];
  sfx.chest();
  app.innerHTML = `
    <div class="result">
      <div class="res-top">🚀</div>
      <div class="placed"><span>${p.avatar}</span><b>→</b><span class="stage-ic">${at.icon}</span></div>
      <div class="res-gems">💎 +${r.gems}</div>
      <button class="bigbtn green" id="go" aria-label="Go to map">▶</button>
    </div>`;
  app.querySelector('#go').onclick = () => { sfx.tap(); map(at.id); };
}

// The world map
function map(focusId) {
  const p = P.me();
  if (!p) return home();
  const n = STAGES.length;
  const STEP = 116;
  const xs = STAGES.map((_, i) => 50 + Math.sin(i * 1.05) * 26);
  const firstOpen = STAGES.findIndex((s, i) => P.isUnlocked(p, STAGES, i) && !(p.stages[s.id]?.stars > 0));
  const focus = focusId ? STAGES.findIndex(s => s.id === focusId) : firstOpen;
  const height = (n + 1) * STEP + 90;
  const pts = [...xs, 50].map((x, i) => `${x},${i * STEP + 70}`).join(' ');

  app.innerHTML = `
    <div class="map">
      <div class="topbar">
        <button class="avatar-btn" id="who" aria-label="Change player">${p.avatar}</button>
        <div class="gem-count"><span>💎</span><b>${p.gems}</b></div>
        <button class="pet-btn" id="petbtn" aria-label="Pet and stickers">${petHTML(p)}</button>
      </div>
      <div class="scroller" id="scroller">
        <div class="world-banner">🌻 <b>1</b></div>
        <div class="path" style="height:${height}px">
          <svg class="trail" viewBox="0 0 100 ${height}" preserveAspectRatio="none" aria-hidden="true">
            <polyline points="${pts}" fill="none" stroke-width="5" stroke-dasharray="2 12" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
          </svg>
          ${STAGES.map((s, i) => {
            const open = P.isUnlocked(p, STAGES, i);
            const stars = p.stages[s.id]?.stars || 0;
            const cls = ['node', open ? 'open' : 'locked', i === firstOpen ? 'current' : '', stars ? 'done' : '', s.icon.startsWith('×') ? 'txt' : ''].join(' ');
            return `<div class="node-wrap" style="left:${xs[i]}%;top:${i * STEP + 70}px">
              <button class="${cls}" data-i="${i}" aria-label="Stage ${i + 1}">${open ? s.icon : '🔒'}</button>
              <div class="stars">${starsHTML(stars)}</div></div>`;
          }).join('')}
          <div class="node-wrap" style="left:50%;top:${n * STEP + 70}px">
            <button class="node locked boss" aria-label="Boss, coming soon">🐲</button><div class="stars soon">🚧</div>
          </div>
        </div>
      </div>
      <button class="gear" id="gear" aria-label="Parent corner, press and hold"><span>⚙️</span><i id="gearfill"></i></button>
    </div>`;

  app.querySelector('#who').onclick = () => { sfx.tap(); home(); };
  app.querySelector('#petbtn').onclick = () => { sfx.tap(); petScreen(); };
  app.querySelectorAll('.node[data-i]').forEach(b => {
    const i = +b.dataset.i;
    b.onclick = () => {
      if (!P.isUnlocked(p, STAGES, i)) { sfx.bad(); b.classList.add('wobble'); setTimeout(() => b.classList.remove('wobble'), 500); return; }
      sfx.tap();
      stagePopup(i);
    };
  });
  holdToOpen(app.querySelector('#gear'), app.querySelector('#gearfill'), parentCorner);

  const sc = app.querySelector('#scroller');
  if (focus >= 0) sc.scrollTop = Math.max(0, focus * STEP + 70 - sc.clientHeight / 2 + 60);
}

function stagePopup(i) {
  const p = P.me();
  const s = STAGES[i];
  const rec = P.stageRec(p, s.id);
  const ov = document.createElement('div');
  ov.className = 'overlay';
  ov.innerHTML = `
    <div class="popup">
      <button class="icon-btn close" aria-label="Close">✖</button>
      <div class="pop-icon ${s.icon.startsWith('×') ? 'txt' : ''}">${s.icon}</div>
      <div class="stars big">${starsHTML(rec.stars)}</div>
      <div class="pop-btns">
        <button class="bigbtn green" id="play" aria-label="Play">▶</button>
        ${rec.stars < 3 ? `<button class="bigbtn gold" id="gate" aria-label="Skip test"><span>⚡</span><small>★★★</small></button>` : ''}
      </div>
    </div>`;
  app.appendChild(ov);
  const close = () => ov.remove();
  ov.querySelector('.close').onclick = () => { sfx.tap(); close(); };
  ov.onclick = e => { if (e.target === ov) close(); };
  ov.querySelector('#play').onclick = () => { sfx.tap(); play(i, 'normal'); };
  const g = ov.querySelector('#gate');
  if (g) g.onclick = () => { sfx.tap(); play(i, 'gate'); };
}

function play(i, mode) {
  const s = STAGES[i];
  startRound(app, { mode, stage: s, onQuit: () => map(s.id), onDone: r => result(i, r) });
}

// After a round: stars, gems and a surprise chest.
function result(i, r) {
  const p = P.me();
  const s = STAGES[i];
  const rec = P.stageRec(p, s.id);
  const before = rec.stars;
  rec.stars = Math.max(rec.stars, r.stars);
  rec.plays++;
  const hatched = r.stars > 0 && P.hatch(p);
  P.save();
  const nextOpen = i + 1 < STAGES.length && before === 0 && r.stars > 0;

  app.innerHTML = `
    <div class="result">
      <div class="res-top">${r.mode === 'gate' ? '⚡' : s.icon}</div>
      <div class="stars huge">${[1, 2, 3].map(k => `<i class="${k <= r.stars ? 'on' : ''}" style="animation-delay:${k * 0.35}s">★</i>`).join('')}</div>
      <div class="res-gems">💎 +${r.gems}${r.best >= 5 ? ` <span class="res-streak">🔥${r.best}</span>` : ''}</div>
      ${hatched ? `<div class="hatch">🥚 → ${petHTML(p, 'bounce')}</div>` : ''}
      ${r.stars > 0 ? '<button class="chest" id="chest" aria-label="Open chest">🎁</button>' : '<div class="retry-face">💪</div>'}
      <div class="reward" id="reward" hidden></div>
      <div class="res-btns">
        <button class="bigbtn" id="again" aria-label="Play again">🔁</button>
        <button class="bigbtn green" id="map" aria-label="Map">${nextOpen ? '▶' : '🗺️'}</button>
      </div>
    </div>`;
  [1, 2, 3].forEach(k => { if (k <= r.stars) setTimeout(sfx.star, k * 350 + 150); });
  if (r.stars === 0) sfx.fail();

  const chest = app.querySelector('#chest');
  if (chest) {
    chest.onclick = () => {
      chest.disabled = true;
      chest.classList.add('open');
      sfx.chest();
      setTimeout(() => {
        chest.remove();
        const box = app.querySelector('#reward');
        box.hidden = false;
        box.innerHTML = openChest(p);
        P.save();
      }, 500);
    };
  }
  app.querySelector('#again').onclick = () => { sfx.tap(); play(i, r.mode === 'gate' ? 'gate' : 'normal'); };
  app.querySelector('#map').onclick = () => { sfx.tap(); map(nextOpen ? STAGES[i + 1].id : s.id); };
}

function openChest(p) {
  const roll = Math.random();
  const hatsLeft = HATS.filter(h => !p.hats.includes(h));
  if (roll < 0.2 && hatsLeft.length) {
    const h = pick(hatsLeft);
    p.hats.push(h);
    p.pet.hat = h;
    return `<div class="rw-item">${h}</div><div class="rw-sub">${petHTML(p, 'bounce')}</div>`;
  }
  if (roll < 0.6) {
    const st = pick(STICKERS);
    if (p.stickers.includes(st)) {
      p.gems += 15;
      return `<div class="rw-item dup">${st}</div><div class="rw-sub">→ 💎 +15</div>`;
    }
    p.stickers.push(st);
    return `<div class="rw-item">${st}</div><div class="rw-sub">📒 ${p.stickers.length} / ${STICKERS.length}</div>`;
  }
  const g = pick([20, 25, 30, 40, 50]);
  p.gems += g;
  return `<div class="rw-item">💎</div><div class="rw-sub">+${g}</div>`;
}

// Pet and sticker book
function petScreen() {
  const p = P.me();
  const canFeed = p.pet.stage > 0 && p.pet.stage < 3 && p.gems >= P.FEED_COST;
  app.innerHTML = `
    <div class="petscreen">
      <div class="topbar">
        <button class="icon-btn" id="back" aria-label="Back to map">⬅</button>
        <div class="gem-count"><span>💎</span><b id="pg">${p.gems}</b></div>
        <span></span>
      </div>
      <div class="pet-stage">${petHTML(p, 'huge')}</div>
      ${p.pet.stage === 0 ? '<div class="pet-hint">▶ ⭐ → 🐣</div>' : p.pet.stage < 3 ? `
        <div class="growbar"><i style="width:${Math.round(P.feedProgress(p) * 100)}%"></i></div>
        <button class="bigbtn green feed" id="feed" ${canFeed ? '' : 'disabled'}><span>🍎</span><small>💎 ${P.FEED_COST}</small></button>` : '<div class="pet-hint">🏆</div>'}
      <div class="hats">
        <button class="hatbtn ${p.pet.hat ? '' : 'on'}" data-h="" aria-label="No hat">∅</button>
        ${HATS.map(h => `<button class="hatbtn ${p.pet.hat === h ? 'on' : ''}" data-h="${h}" ${p.hats.includes(h) ? '' : 'disabled'}>${p.hats.includes(h) ? h : '❔'}</button>`).join('')}
      </div>
      <div class="book">
        <div class="book-head">📒 ${p.stickers.length} / ${STICKERS.length}</div>
        <div class="book-grid">${STICKERS.map(s => `<span class="${p.stickers.includes(s) ? 'got' : ''}">${p.stickers.includes(s) ? s : '❔'}</span>`).join('')}</div>
      </div>
    </div>`;
  app.querySelector('#back').onclick = () => { sfx.tap(); map(); };
  const feedBtn = app.querySelector('#feed');
  if (feedBtn) feedBtn.onclick = () => {
    const grew = P.feed(p);
    P.save();
    grew ? sfx.grow() : sfx.ok();
    petScreen();
    const pet = app.querySelector('.pet-stage .pet');
    pet.classList.add(grew ? 'grow' : 'munch');
  };
  app.querySelectorAll('.hatbtn').forEach(b => {
    b.onclick = () => { sfx.tap(); p.pet.hat = b.dataset.h || null; P.save(); petScreen(); };
  });
}

// Parent corner: press and hold the gear so kids don't open it by accident.
function holdToOpen(btn, fillEl, fn) {
  let t = null;
  const start = e => {
    e.preventDefault();
    fillEl.style.transition = 'height 1.5s linear';
    fillEl.style.height = '100%';
    t = setTimeout(() => { cancel(); fn(); }, 1500);
  };
  const cancel = () => {
    clearTimeout(t);
    fillEl.style.transition = 'height .2s';
    fillEl.style.height = '0';
  };
  btn.addEventListener('pointerdown', start);
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => btn.addEventListener(ev, cancel));
  btn.addEventListener('contextmenu', e => e.preventDefault());
}

function parentCorner() {
  const p = P.me();
  const done = STAGES.filter(s => p.stages[s.id]?.stars > 0).length;
  const ov = document.createElement('div');
  ov.className = 'overlay';
  ov.innerHTML = `
    <div class="popup parent">
      <h2>Parent corner</h2>
      <p class="pc-sum">${p.avatar} has cleared <b>${done} of ${STAGES.length}</b> Meadow stages and holds <b>${p.gems}</b> gems.</p>
      <table class="pc-table">
        ${STAGES.map(s => { const r = p.stages[s.id]; return `<tr><td>${s.icon}</td><td><span class="stars">${starsHTML(r?.stars || 0)}</span></td><td>${r?.plays || 0} plays</td></tr>`; }).join('')}
      </table>
      <label class="pc-row"><input type="checkbox" id="pc-unlock" ${p.unlockAll ? 'checked' : ''}> Open all stages</label>
      <label class="pc-row"><input type="checkbox" id="pc-sound" ${P.state.muted ? '' : 'checked'}> Sound effects</label>
      <div class="pc-btns">
        <button class="pc-btn danger" id="pc-del">Delete this player</button>
        <button class="pc-btn" id="pc-close">Close</button>
      </div>
      <p class="pc-note">Progress is saved in this browser on this device only.</p>
    </div>`;
  app.appendChild(ov);
  ov.querySelector('#pc-unlock').onchange = e => { p.unlockAll = e.target.checked; P.save(); };
  ov.querySelector('#pc-sound').onchange = e => { P.state.muted = !e.target.checked; P.save(); };
  ov.querySelector('#pc-close').onclick = () => { ov.remove(); map(); };
  const del = ov.querySelector('#pc-del');
  del.onclick = () => {
    if (del.dataset.sure) { P.removeProfile(p.id); ov.remove(); home(); return; }
    del.dataset.sure = '1';
    del.textContent = 'Tap again to delete for good';
  };
}

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

P.me() ? map() : home();
