// Picture aids: ten-frames, tens-and-ones blocks, arrays and pattern rows.
// Each returns an HTML string.

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

// r rows of c dots.
export function array(r, c) {
  const s = Math.max(9, Math.min(24, Math.floor(210 / Math.max(r, c))));
  let h = `<div class="arr" style="--s:${s}px;grid-template-columns:repeat(${c},${s}px)">`;
  for (let i = 0; i < r * c; i++) h += `<i class="${Math.floor(i / c) % 2 ? 'alt' : ''}"></i>`;
  return h + '</div>';
}

// A train of tiles. '❓' becomes the yellow slot the child fills in.
export const row = items => `<div class="seq" style="--n:${items.length}">` +
  items.map(x => (x === '❓' ? `<span class="slot${typeof items.find(i => i !== '❓') === 'number' ? ' num' : ''}">?</span>` : `<span${typeof x === 'number' ? ` class="num${x >= 100 ? ' n3' : ''}"` : ''}>${x}</span>`)).join('') + '</div>';
