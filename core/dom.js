/** Small DOM + formatting helpers, and the live-360° iframe mounter. */

export const $ = (sel, el = document) => el.querySelector(sel);
export const fmtUSD = (n) => (n == null ? '—' : '$' + Number(n).toLocaleString('en-US'));
export const esc = (s) => String(s ?? '').replace(/[&<>"]/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ── live 360° viewer ────────────────────────────────────────────────────────
 * The viewer (loupe360) is a cross-origin SPA. Reparenting an iframe reloads
 * it, so each card keeps its own iframe attached and just hides/shows it — a
 * second hover of the same stone reuses the loaded viewer with no refetch.
 * An LRU cap bounds how many stay alive at once. */
const VID_CAP = 16;
// The loupe viewer renders the stone centred inside a fixed 500×500 box anchored
// at the page's top-left. Matching the iframe to that box makes the iframe centre
// coincide with the stone, so centring + scaling frame it cleanly.
const VID_NATIVE = 500;
const vidLRU = [];

export function touchVid(entry) {
  const i = vidLRU.indexOf(entry);
  if (i >= 0) vidLRU.splice(i, 1);
  vidLRU.push(entry);
  while (vidLRU.length > VID_CAP) {
    const old = vidLRU.shift();
    if (old && old.frame) { old.frame.remove(); old.frame = null; old.card._vid = null; }
  }
}

// Insert a viewer iframe at native 600px, scaled to fill `box`, centered.
// `oy` nudges the content down (px, native scale) so the stone — which the
// loupe viewer renders slightly above its canvas centre — lands dead centre.
export function mount360(box, url, zoom, oy) {
  const f = document.createElement('iframe');
  f.setAttribute('allow', 'autoplay');
  f.setAttribute('scrolling', 'no');
  f.style.cssText = `position:absolute;top:50%;left:50%;width:${VID_NATIVE}px;height:${VID_NATIVE}px;border:0;transform-origin:center center;z-index:2;background:var(--thumb)`;
  f.dataset.zoom = zoom || 1.4;
  f.dataset.oy = oy || 0;
  f.src = url;
  box.appendChild(f);
  scale360(f, box);
  return f;
}

export function scale360(f, box) {
  const w = box.clientWidth || box.offsetWidth;
  const h = box.clientHeight || box.offsetHeight;
  // Cover the box: the larger dimension drives the scale so no stage shows.
  const s = (Math.max(w, h) / VID_NATIVE) * Number(f.dataset.zoom || 1);
  const oy = Number(f.dataset.oy || 0);
  f.style.transform = `translate(-50%, calc(-50% + ${oy}px)) scale(${s})`;
}
