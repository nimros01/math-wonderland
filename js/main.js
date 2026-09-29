// Screens: players, map, stage popup, results, pet and sticker book, parent corner.
import * as P from './progress.js';
import { sfx, unlockAudio } from './audio.js';
import { LEARN, STICKERS, HATS, AVATARS } from './skills.js';
import { lookBackHTML, bindLookBack } from './solve.js';
import { startRound } from './play.js';
import { WORLDS, learnOf, bossBeaten, setBossBeaten, worldOpen, worldOfStage } from './worlds.js';
import * as C from './cloud.js';
import { country, setCountry } from './country.js';

const app = document.getElementById('app');
const esc = t => String(t).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
const pick = a => a[Math.floor(Math.random() * a.length)];
const starsHTML = n => [1, 2, 3].map(i => `<i class="${i <= n ? 'on' : ''}">★</i>`).join('');

document.addEventListener('pointerdown', unlockAudio, { capture: true });

// A stage added in an update that this child has already moved past: no stars yet, and a later stage has stars.
const isFresh = (p, stages, i) => !!stages[i].added && !(p.stages[stages[i].id]?.stars > 0) && stages.slice(i + 1).some(s => p.stages[s.id]?.stars > 0);
const worldHasFresh = (p, w) => w.stages.some((_, i) => isFresh(p, w.stages, i));

// The world this player is looking at (falls back to Meadow if it isn't open).
function curWorld(p) {
  const wi = p.world || 0;
  return WORLDS[wi] && worldOpen(p, wi) ? wi : 0;
}

const wid = p => WORLDS[curWorld(p)].id;

function petFace(pet, w, cls = '') {
  return `<span class="pet ${cls} s${pet.stage}">${P.petEmoji(pet, w)}${pet.hat ? `<span class="hat">${pet.hat}</span>` : ''}</span>`;
}
// A child's pet for the world they're in (egg until it hatches); with `buddy`, the one that plays along.
function petHTML(p, cls = '', buddy = false) {
  const c = buddy ? P.companion(p, wid(p)) : { pet: P.peekPet(p, wid(p)), wid: wid(p) };
  return petFace(c.pet, c.wid, cls);
}

// Players. Each child picks their own animal at every launch; each keeps separate progress.
const MAX_PLAYERS = 6;

function home() {
  const ps = P.state.profiles;
  app.innerHTML = `
    <div class="home">
      <h1 class="logo">Math<br>Wonderland</h1>
      <div class="logo-art">🌻 ➕ 🌈 ✖️ 🦋</div>
      <div class="players">
        ${ps.map(p => `<button class="player${p.id === P.state.current ? ' last' : ''}" data-id="${p.id}" aria-label="Player">
          <span class="av">${p.avatar}</span>
          ${p.name ? `<span class="pname">${esc(p.name)}</span>` : ''}
          <span class="pmeta">${petHTML(p, 'tiny', true)}<span class="pst">★ ${Object.entries(p.stages).reduce((t, [id, r]) => t + (id.startsWith('boss-') ? 0 : r.stars || 0), 0)}</span></span>
        </button>`).join('')}
        ${ps.length < MAX_PLAYERS ? '<button class="player add" id="add" aria-label="New player"><span class="av">＋</span></button>' : ''}
      </div>
      <button class="gear" id="cloud" aria-label="Family sync, press and hold"><span>⚙️</span><i id="cloudfill"></i></button>
    </div>`;
  holdToOpen(app.querySelector('#cloud'), app.querySelector('#cloudfill'), () => familyPanel(home));
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
      <div class="avatars">${AVATARS.filter(a => !P.state.profiles.some(p => p.avatar === a)).map(a => `<button class="avatar" data-a="${a}">${a}</button>`).join('')}</div>
    </div>`;
  app.querySelector('#back').onclick = () => { sfx.tap(); home(); };
  app.querySelectorAll('.avatar').forEach(b => {
    b.onclick = () => { sfx.ok(); nameStep(b.dataset.a); };
  });
}

// A grown-up types the child's name, so the same child is easy to spot on every device. Optional.
function nameStep(avatar) {
  app.innerHTML = `
    <div class="home">
      <button class="icon-btn back" id="back" aria-label="Back">⬅</button>
      <div class="big-q">${avatar}</div>
      <form class="namebox" id="nameform">
        <input id="pname" maxlength="14" autocomplete="off" placeholder="✏️" aria-label="Child's name">
        <button class="bigbtn green" id="nameok" aria-label="OK">✔</button>
      </form>
    </div>`;
  const input = app.querySelector('#pname');
  setTimeout(() => input.focus(), 50);
  app.querySelector('#back').onclick = () => { sfx.tap(); newPlayer(); };
  app.querySelector('#nameform').onsubmit = e => {
    e.preventDefault();
    sfx.ok();
    P.addProfile(avatar, input.value);
    startChoice();
  };
}

// Start from the beginning, or take the placement quest to skip what you know.
// Each button draws its own little map: walk from the first stage, or answer a few ❓ and fly ahead.
function startChoice() {
  const p = P.me();
  const icons = LEARN.slice(0, 5).map(s => s.icon);
  const stops = (done = 0) => icons.map((ic, i) => `<span class="stop${i < done ? ' won' : ''}">${i < done ? '⭐' : ic}</span>`).join('');
  app.innerHTML = `
    <div class="home">
      <div class="big-q">${p.avatar}</div>
      <div class="start-choice">
        <button class="pathbtn green" id="begin" aria-label="Start at stage 1">
          <span class="minipath">${stops()}<span class="walker">${p.avatar}</span></span>
          <span class="pathnums">${icons.map((_, i) => `<b>${i + 1}</b>`).join('')}</span>
        </button>
        <button class="pathbtn gold" id="quest" aria-label="Quiz and jump ahead">
          <span class="minipath"><span class="stop quiz"><span class="slot">?</span></span>${stops(3).replace(/<span class="stop[^>]*>[^<]*<\/span>$/, '')}<span class="flyer">🚀</span></span>
        </button>
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
    const rec = P.stageRec(p, LEARN[i].id);
    rec.stars = Math.max(rec.stars, 2);
    rec.demo = true;
  }
  P.hatch(p.pet);
  P.save();
  const at = LEARN[Math.min(r.placedAt, LEARN.length - 1)];
  sfx.chest();
  app.innerHTML = `
    <div class="result">
      <div class="res-top">🚀</div>
      <div class="placed"><span>${p.avatar}</span><b>→</b><span class="stage-ic">${at.icon}</span></div>
      <div class="res-gems">💎 +${r.gems}</div>
      <button class="bigbtn green" id="go" aria-label="Go to map">▶</button>
      ${lookBackHTML(r.log)}
    </div>`;
  bindLookBack(app, r.log);
  app.querySelector('#go').onclick = () => { sfx.tap(); map(at.id); };
}

// The world map
function map(focusId) {
  const p = P.me();
  if (!p) return home();
  if (focusId) p.world = worldOfStage(focusId);
  // A world that opened but was never visited (for example after an update) opens by itself, with a hello.
  const seen = (p.seenW ||= [0]);
  const fresh = focusId ? -1 : WORLDS.findIndex((_, k) => k > 0 && worldOpen(p, k) && !seen.includes(k));
  if (fresh > 0) p.world = fresh;
  const wi = curWorld(p), W = WORLDS[wi], STAGES = W.stages;
  if (!seen.includes(wi)) { seen.push(wi); P.save(); }
  // Children who already have stars in a world get its pet the first time they see it there.
  const newPet = wi > 0 && STAGES.some(s => p.stages[s.id]?.stars > 0) && P.hatch(P.petOf(p, W.id));
  if (newPet) P.save();
  const n = STAGES.length;
  const STEP = 116;
  const xs = STAGES.map((_, i) => 50 + Math.sin(i * 1.05) * 26);
  const firstOpen = STAGES.findIndex((s, i) => P.isUnlocked(p, STAGES, i) && !(p.stages[s.id]?.stars > 0));
  const focus = focusId ? STAGES.findIndex(s => s.id === focusId) : firstOpen;
  const height = (n + 1) * STEP + 90;
  // The boss opens once every learning stage has a star.
  const beaten = bossBeaten(p, W);
  // A troll already beaten stays open, even when new stages join the world later.
  const bossOpen = p.unlockAll || beaten || learnOf(W).filter(s => !s.added).every(s => (p.stages[s.id]?.stars || 0) > 0);
  const pts = [...xs, 50].map((x, i) => `${x},${i * STEP + 70}`).join(' ');

  app.innerHTML = `
    <div class="map w-${W.id}">
      <div class="topbar">
        <button class="avatar-btn" id="who" aria-label="Change player">${p.avatar}</button>
        <div class="gem-count"><span>💎</span><b>${p.gems}</b></div>
        <button class="pet-btn" id="petbtn" aria-label="Pet and stickers">${petHTML(p)}</button>
      </div>
      <div class="world-tabs">${WORLDS.map((w, k) => `<button class="wtab${k === wi ? ' on' : ''}${worldOpen(p, k) ? '' : ' locked'}${worldOpen(p, k) && worldHasFresh(p, w) ? ' hasnew' : ''}" data-w="${k}" aria-label="World ${k + 1}">${worldOpen(p, k) ? w.icon : '🔒'}<b>${k + 1}</b></button>`).join('')}</div>
      <div class="scroller" id="scroller">
        <div class="path" style="height:${height}px">
          <svg class="trail" viewBox="0 0 100 ${height}" preserveAspectRatio="none" aria-hidden="true">
            <polyline points="${pts}" fill="none" stroke-width="5" stroke-dasharray="2 12" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
          </svg>
          ${STAGES.map((s, i) => {
            const open = P.isUnlocked(p, STAGES, i);
            const stars = p.stages[s.id]?.stars || 0;
            const fresh = open && isFresh(p, STAGES, i);
            const cls = ['node', open ? 'open' : 'locked', i === firstOpen ? 'current' : '', stars ? 'done' : '', s.icon.startsWith('×') ? 'txt' : '', s.puzzle ? 'puzzle' : '', fresh ? 'fresh' : ''].join(' ');
            return `<div class="node-wrap" style="left:${xs[i]}%;top:${i * STEP + 70}px">
              <button class="${cls}" data-i="${i}" aria-label="Stage ${i + 1}">${open ? s.icon : '🔒'}${fresh ? '<span class="newbadge">✨</span>' : ''}</button>
              <div class="stars">${starsHTML(stars)}</div></div>`;
          }).join('')}
          <div class="node-wrap" style="left:50%;top:${n * STEP + 70}px">
            <button class="node boss ${bossOpen ? 'open' : 'locked'} ${bossOpen && firstOpen < 0 && !beaten ? 'current' : ''}" id="bossnode" aria-label="Boss">${bossOpen ? W.boss : '🔒'}</button>
            <div class="stars soon">${beaten ? '🏆' : ''}</div>
          </div>
        </div>
      </div>
      <button class="gear" id="gear" aria-label="Parent corner, press and hold"><span>⚙️</span><i id="gearfill"></i></button>
    </div>`;

  app.querySelector('#who').onclick = () => { sfx.tap(); home(); };
  app.querySelector('#petbtn').onclick = () => { sfx.tap(); petScreen(W.id); };
  app.querySelectorAll('.node[data-i]').forEach(b => {
    const i = +b.dataset.i;
    b.onclick = () => {
      if (!P.isUnlocked(p, STAGES, i)) { sfx.bad(); b.classList.add('wobble'); setTimeout(() => b.classList.remove('wobble'), 500); return; }
      sfx.tap();
      stagePopup(STAGES, i);
    };
  });
  app.querySelectorAll('.wtab').forEach(b => {
    const k = +b.dataset.w;
    b.onclick = () => {
      if (!worldOpen(p, k)) { sfx.bad(); b.classList.add('wobble'); setTimeout(() => b.classList.remove('wobble'), 500); return; }
      sfx.tap();
      p.world = k;
      P.save();
      map();
    };
  });
  app.querySelector('#bossnode').onclick = e => {
    if (!bossOpen) { sfx.bad(); e.currentTarget.classList.add('wobble'); setTimeout(() => e.currentTarget?.classList.remove('wobble'), 500); return; }
    sfx.tap();
    startRound(app, { mode: 'boss', world: W, onQuit: () => map(), onDone: r => bossResult(W, r) });
  };
  holdToOpen(app.querySelector('#gear'), app.querySelector('#gearfill'), parentCorner);

  if (fresh > 0) {
    sfx.chest();
    const hi = document.createElement('div');
    hi.className = 'newworld';
    hi.innerHTML = `<div><span>${W.icon}</span><b>${wi + 1}</b></div>`;
    app.querySelector('.map').appendChild(hi);
    hi.onclick = () => hi.remove();
    setTimeout(() => hi.remove(), 2600);
  }
  if (newPet) {
    const born = document.createElement('div');
    born.className = 'newworld petborn';
    born.innerHTML = `<div>🥚<b>→</b>${petFace(P.petOf(p, W.id), W.id, 'bounce')}</div>`;
    setTimeout(() => {
      if (!app.contains(app.querySelector('#bossnode'))) return;
      sfx.grow();
      app.querySelector('.map').appendChild(born);
      born.onclick = () => born.remove();
      setTimeout(() => born.remove(), 3000);
    }, fresh > 0 ? 2700 : 300);
  }

  const sc = app.querySelector('#scroller');
  const f = focus >= 0 ? focus : bossOpen ? n : -1;
  if (f >= 0) sc.scrollTop = Math.max(0, f * STEP + 70 - sc.clientHeight / 2 + 60);
}

function stagePopup(STAGES, i) {
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
  ov.querySelector('#play').onclick = () => { sfx.tap(); play(STAGES, i, 'normal'); };
  const g = ov.querySelector('#gate');
  if (g) g.onclick = () => { sfx.tap(); play(STAGES, i, 'gate'); };
}

function play(STAGES, i, mode) {
  const s = STAGES[i];
  startRound(app, { mode, stage: s, onQuit: () => map(s.id), onDone: r => result(STAGES, i, r) });
}

// After a round: stars, gems and a surprise chest.
function result(STAGES, i, r) {
  const p = P.me();
  const s = STAGES[i];
  const rec = P.stageRec(p, s.id);
  const before = rec.stars;
  rec.stars = Math.max(rec.stars, r.stars);
  rec.plays++;
  const w = WORLDS[worldOfStage(s.id)].id;
  const hatched = r.stars > 0 && P.hatch(P.petOf(p, w));
  P.save();
  const nextOpen = i + 1 < STAGES.length && before === 0 && r.stars > 0;

  app.innerHTML = `
    <div class="result">
      <div class="res-top">${r.mode === 'gate' ? '⚡' : s.icon}</div>
      <div class="stars huge">${[1, 2, 3].map(k => `<i class="${k <= r.stars ? 'on' : ''}" style="animation-delay:${k * 0.35}s">★</i>`).join('')}</div>
      <div class="res-gems">💎 +${r.gems}${r.best >= 5 ? ` <span class="res-streak">🔥${r.best}</span>` : ''}</div>
      ${hatched ? `<div class="hatch">🥚 → ${petFace(P.petOf(p, w), w, 'bounce')}</div>` : ''}
      ${r.stars > 0 ? '<button class="chest" id="chest" aria-label="Open chest">🎁</button>' : '<div class="retry-face">💪</div>'}
      <div class="reward" id="reward" hidden></div>
      <div class="res-btns">
        <button class="bigbtn" id="again" aria-label="Play again">🔁</button>
        <button class="bigbtn green" id="map" aria-label="Map">${nextOpen ? '▶' : '🗺️'}</button>
      </div>
      ${lookBackHTML(r.log)}
    </div>`;
  bindLookBack(app, r.log);
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
  app.querySelector('#again').onclick = () => { sfx.tap(); play(STAGES, i, r.mode === 'gate' ? 'gate' : 'normal'); };
  app.querySelector('#map').onclick = () => { sfx.tap(); map(nextOpen ? STAGES[i + 1].id : s.id); };
}

// A world's boss: win for a big chest with three prizes. The first win opens the next world.
function bossResult(W, r) {
  const p = P.me();
  const first = r.win && !bossBeaten(p, W);
  if (r.win) setBossBeaten(p, W);
  const wi = WORLDS.indexOf(W), nextW = first && WORLDS[wi + 1];
  if (nextW) p.world = wi + 1;
  P.save();
  if (r.win) sfx.chest(); else sfx.fail();
  app.innerHTML = `
    <div class="result">
      <div class="res-top boss-end ${r.win ? 'beaten' : ''}">${r.win ? '💥' : W.boss}</div>
      <div class="res-top">${r.win ? '🏆' : '💪'}</div>
      <div class="res-gems">💎 +${r.gems}</div>
      ${r.win ? '<button class="chest big" id="chest" aria-label="Open chest">🎁</button>' : ''}
      <div class="reward three" id="reward" hidden></div>
      <div class="res-btns">
        <button class="bigbtn" id="again" aria-label="Fight again">🔁</button>
        <button class="bigbtn green" id="map" aria-label="Map">${nextW ? `${nextW.icon} ▶` : '🗺️'}</button>
      </div>
      ${lookBackHTML(r.log)}
    </div>`;
  bindLookBack(app, r.log);
  const chest = app.querySelector('#chest');
  if (chest) chest.onclick = () => {
    chest.disabled = true;
    chest.classList.add('open');
    sfx.chest();
    setTimeout(() => {
      chest.remove();
      const box = app.querySelector('#reward');
      box.hidden = false;
      const prizes = [openChest(p), openChest(p), openChest(p)];
      if (first) { p.gems += 100; prizes.push('<div class="rw-item">💎</div><div class="rw-sub">+100</div>'); }
      box.innerHTML = prizes.map(x => `<div>${x}</div>`).join('');
      P.save();
    }, 500);
  };
  app.querySelector('#again').onclick = () => { sfx.tap(); startRound(app, { mode: 'boss', world: W, onQuit: () => map(), onDone: r2 => bossResult(W, r2) }); };
  app.querySelector('#map').onclick = () => { sfx.tap(); map(); };
}

function openChest(p) {
  const roll = Math.random();
  const hatsLeft = HATS.filter(h => !p.hats.includes(h));
  if (roll < 0.2 && hatsLeft.length) {
    const h = pick(hatsLeft);
    p.hats.push(h);
    const c = P.companion(p, wid(p));
    c.pet.hat = h;
    return `<div class="rw-item">${h}</div><div class="rw-sub">${petFace(c.pet, c.wid, 'bounce')}</div>`;
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

// Pet and sticker book. Each world has its own pet; the row on top picks which one to look after.
// Worlds that aren't built yet show a locked egg, so kids know more pets are coming.
const SOON = [['candy', '🍭'], ['desert', '🏜️'], ['volcano', '🌋'], ['space', '🚀']];

function petScreen(w = wid(P.me())) {
  const p = P.me();
  const k = WORLDS.findIndex(x => x.id === w);
  if (k < 0 || !worldOpen(p, k)) w = 'meadow';
  const W = WORLDS.find(x => x.id === w);
  const pet = P.petOf(p, w);
  const cost = P.feedCost(pet);
  const canFeed = pet.stage > 0 && pet.stage < 3 && p.gems >= cost;
  const soon = SOON.filter(([id]) => !WORLDS.some(x => x.id === id));
  app.innerHTML = `
    <div class="petscreen">
      <div class="topbar">
        <button class="icon-btn" id="back" aria-label="Back to map">⬅</button>
        <div class="gem-count"><span>💎</span><b id="pg">${p.gems}</b></div>
        <span></span>
      </div>
      <div class="petpicks">
        ${WORLDS.map((x, j) => worldOpen(p, j)
          ? `<button class="petpick${x.id === w ? ' on' : ''}" data-w="${x.id}" aria-label="Pet of world ${j + 1}">${petFace(P.peekPet(p, x.id), x.id)}<small>${x.icon}</small></button>`
          : `<button class="petpick locked" aria-label="Locked">🥚<small>🔒</small></button>`).join('')}
        ${soon.map(() => '<button class="petpick locked soon" aria-label="Coming soon">🥚<small>🔒</small></button>').join('')}
      </div>
      <div class="pet-stage">${petFace(pet, w, 'huge')}</div>
      ${pet.stage === 0 ? `<div class="pet-hint">${w === 'meadow' ? '▶' : W.icon} ⭐ → 🐣</div>` : pet.stage < 3 ? `
        <div class="growbar"><i style="width:${Math.round(P.feedProgress(pet) * 100)}%"></i></div>
        <button class="bigbtn green feed" id="feed" ${canFeed ? '' : 'disabled'}><span>🍎</span><small>💎 ${cost}</small></button>` : '<div class="pet-hint">🏆</div>'}
      <div class="hats">
        <button class="hatbtn ${pet.hat ? '' : 'on'}" data-h="" aria-label="No hat">∅</button>
        ${HATS.map(h => p.hats.includes(h)
          ? `<button class="hatbtn ${pet.hat === h ? 'on' : ''}" data-h="${h}">${h}</button>`
          : `<button class="hatbtn shop" data-buy="${h}" ${p.gems >= P.HAT_COST ? '' : 'disabled'}><span>${h}</span><small>💎${P.HAT_COST}</small></button>`).join('')}
      </div>
      <div class="book">
        <div class="book-head">📒 ${p.stickers.length} / ${STICKERS.length}</div>
        <div class="book-grid">${STICKERS.map(s => `<span class="${p.stickers.includes(s) ? 'got' : ''}">${p.stickers.includes(s) ? s : '❔'}</span>`).join('')}</div>
      </div>
    </div>`;
  app.querySelector('#back').onclick = () => { sfx.tap(); map(); };
  app.querySelectorAll('.petpick').forEach(b => {
    b.onclick = () => {
      if (!b.dataset.w) { sfx.bad(); b.classList.add('wobble'); setTimeout(() => b.classList.remove('wobble'), 500); return; }
      sfx.tap();
      petScreen(b.dataset.w);
    };
  });
  const feedBtn = app.querySelector('#feed');
  if (feedBtn) feedBtn.onclick = () => {
    const grew = P.feed(p, pet);
    P.save();
    grew ? sfx.grow() : sfx.ok();
    petScreen(w);
    const el = app.querySelector('.pet-stage .pet');
    el.classList.add(grew ? 'grow' : 'munch');
  };
  app.querySelectorAll('.hatbtn').forEach(b => {
    b.onclick = () => {
      if (b.dataset.buy) {
        if (p.gems < P.HAT_COST) return;
        p.gems -= P.HAT_COST;
        p.hats.push(b.dataset.buy);
        pet.hat = b.dataset.buy;
        sfx.chest();
      } else {
        sfx.tap();
        pet.hat = b.dataset.h || null;
      }
      P.save();
      petScreen(w);
    };
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
  const W = WORLDS[curWorld(p)], STAGES = W.stages;
  const done = STAGES.filter(s => p.stages[s.id]?.stars > 0).length;
  const ov = document.createElement('div');
  ov.className = 'overlay';
  ov.innerHTML = `
    <div class="popup parent">
      <h2>Parent corner</h2>
      <p class="pc-sum">${p.avatar}${p.name ? ' ' + esc(p.name) : ''} has cleared <b>${done} of ${STAGES.length}</b> stages in world ${W.icon} and holds <b>${p.gems}</b> gems.</p>
      <table class="pc-table">
        ${STAGES.map(s => { const r = p.stages[s.id]; return `<tr><td>${s.icon}</td><td><span class="stars">${starsHTML(r?.stars || 0)}</span></td><td>${r?.plays || 0} plays</td></tr>`; }).join('')}
      </table>
      <label class="pc-row">Name <input type="text" id="pc-name" maxlength="14" value="${esc(p.name || '')}" autocomplete="off"></label>
      <label class="pc-row"><input type="checkbox" id="pc-unlock" ${p.unlockAll ? 'checked' : ''}> Open all stages</label>
      <label class="pc-row"><input type="checkbox" id="pc-sound" ${P.state.muted ? '' : 'checked'}> Sound effects</label>
      <div class="pc-row">Coins <span class="pc-seg"><button class="pc-cty${country() === 'IL' ? ' on' : ''}" data-c="IL">₪ Israel</button><button class="pc-cty${country() === 'US' ? ' on' : ''}" data-c="US">$ US</button></span></div>
      <div class="pc-btns">
        <button class="pc-btn danger" id="pc-del">Delete this player</button>
        <button class="pc-btn" id="pc-family">☁️ Family sync</button>
        <button class="pc-btn" id="pc-close">Close</button>
      </div>
      <p class="pc-note">${C.family() ? 'Players are shared with every device that uses your family code.' : 'Progress is saved in this browser on this device only.'}</p>
    </div>`;
  app.appendChild(ov);
  ov.querySelector('#pc-name').onchange = e => { p.name = e.target.value.trim().slice(0, 14); P.save(); };
  ov.querySelector('#pc-unlock').onchange = e => { p.unlockAll = e.target.checked; P.save(); };
  ov.querySelector('#pc-sound').onchange = e => { P.state.muted = !e.target.checked; P.save(); };
  ov.querySelectorAll('.pc-cty').forEach(b => { b.onclick = () => { setCountry(b.dataset.c); ov.querySelectorAll('.pc-cty').forEach(x => x.classList.toggle('on', x === b)); }; });
  ov.querySelector('#pc-close').onclick = () => { ov.remove(); map(); };
  ov.querySelector('#pc-family').onclick = () => { ov.remove(); familyPanel(map); };
  const del = ov.querySelector('#pc-del');
  del.onclick = () => {
    if (del.dataset.sure) { P.removeProfile(p.id); ov.remove(); home(); return; }
    del.dataset.sure = '1';
    del.textContent = 'Tap again to delete for good';
  };
}

// Family sync panel (for parents, so it uses words). Players sync between devices with the same code.
function familyPanel(back) {
  const ov = document.createElement('div');
  ov.className = 'overlay';
  const ago = t => { const m = Math.round((Date.now() - t) / 60000); return !t ? 'not yet' : m < 1 ? 'just now' : m < 60 ? `${m} min ago` : new Date(t).toLocaleString(); };
  const render = (msg = '') => {
    const fam = C.family();
    let body;
    if (!C.configured()) {
      body = `<p class="pc-sum">Family sync isn't switched on for this copy of the game yet. It needs a free Firebase project; see the setup steps in the game's README.</p>`;
    } else if (!fam) {
      body = `
        <p class="pc-sum">Share players between phones and tablets. Create a family code here, then type the same code on each other device.</p>
        <button class="pc-btn primary" id="fam-new">Create a family code</button>
        <div class="fam-join">
          <input id="fam-code" inputmode="text" autocapitalize="characters" autocomplete="off" spellcheck="false" placeholder="XXXX-XXX-XXX" maxlength="14">
          <button class="pc-btn" id="fam-join">Join</button>
        </div>`;
    } else {
      body = `
        <p class="pc-sum">Family code</p>
        <div class="fam-code">${C.formatCode(fam)}</div>
        <p class="pc-note">Type this code on another device (hold ⚙️ on the player screen) to share these players. Keep it in the family: anyone with the code can see and change the players (animal, name and progress).</p>
        <p class="pc-sum">Last synced: <b>${ago(C.lastSync())}</b>${C.lastError ? ` <span class="fam-err">(${C.lastError === 'offline' ? 'offline, will retry' : 'couldn’t reach the server, will retry'})</span>` : ''}</p>
        <div class="pc-btns">
          <button class="pc-btn" id="fam-sync">Sync now</button>
          <button class="pc-btn danger" id="fam-leave">Stop syncing</button>
        </div>`;
    }
    ov.innerHTML = `
      <div class="popup parent">
        <h2>☁️ Family sync</h2>
        ${body}
        ${msg ? `<p class="fam-msg">${msg}</p>` : ''}
        <label class="pc-row"><input type="checkbox" id="pc-sound" ${P.state.muted ? '' : 'checked'}> Sound effects</label>
        <button class="pc-btn" id="fam-close">Close</button>
      </div>`;
    const $ = id => ov.querySelector('#' + id);
    const busy = b => { b.disabled = true; b.textContent = '…'; };
    $('fam-close').onclick = () => { ov.remove(); back(); };
    $('pc-sound').onchange = e => { P.state.muted = !e.target.checked; P.writeLocal(); };
    if ($('fam-new')) $('fam-new').onclick = async e => { busy(e.target); await C.createFamily(); render(C.lastError ? 'Couldn’t reach the server. The code is saved and will sync when the connection is back.' : ''); };
    if ($('fam-join')) $('fam-join').onclick = async e => {
      busy(e.target);
      const r = await C.joinFamily($('fam-code').value);
      render({ ok: 'Joined! Players from the family are now on this device.', short: 'The code has 10 letters and numbers.', missing: 'No family with that code. Check the letters and try again.', error: 'Couldn’t reach the server. Check the internet connection.' }[r]);
    };
    if ($('fam-sync')) $('fam-sync').onclick = async e => { busy(e.target); await C.sync(); render(); };
    if ($('fam-leave')) $('fam-leave').onclick = e => {
      if (!e.target.dataset.sure) { e.target.dataset.sure = '1'; e.target.textContent = 'Tap again to stop'; return; }
      C.leaveFamily(); render('This device stopped syncing. Its players stay here.');
    };
  };
  render();
  app.appendChild(ov);
}

// When another device changes the players, refresh the player screen or map if it's showing.
C.onRemoteChange(() => {
  if (document.querySelector('.overlay')) return;
  if (app.querySelector('.players')) home();
  else if (app.querySelector('#scroller')) map();
});

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

home();
C.sync();
