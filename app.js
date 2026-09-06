/** Diamond Viewer — UI. Provider-agnostic: everything reads from the adapter. */
import { defaultProvider } from './providers/index.js';
import { runQuery, runItems } from './core/transport.js';
import { cacheGet, cacheSet } from './core/cache.js';
import { $, esc, fmtUSD, mount360, scale360, touchVid } from './core/dom.js';
import { loadStars, isStarred, setStar, wasSeeded, markSeeded, putStars } from './core/stars.js';

const provider = defaultProvider;
const CFG = { maps: provider.maps, ranges: provider.ranges, shapes: provider.shapes };
const ICON = (slug) => provider.shapeIcon(slug);
const PER = 60;

// Default filter — Old European · D–E · FL–VVS2 · Excellent–Ideal · price ↑
const DEFAULTS = {
  shape: ['old_european'], caratMin: '', caratMax: '', priceMin: '', priceMax: '',
  colorHi: '10', colorLo: '9', clarityHi: '11', clarityLo: '8', cutHi: '4', cutLo: '3',
  onlyMedia: false, onlySale: false, sortBy: 'price', sortDir: 'ASC', sku: '',
};
const clone = (o) => ({ ...o, shape: [...o.shape] });

// Persist the filter so a refresh keeps it. (Theme and stars persist separately.)
const FKEY = `dvfilter:${provider.id}`;
function loadFilter() {
  try {
    const s = JSON.parse(localStorage.getItem(FKEY));
    if (s && typeof s === 'object') return { ...clone(DEFAULTS), ...s, shape: Array.isArray(s.shape) ? s.shape : [] };
  } catch { /* ignore */ }
  return null;
}
function persistFilter() { try { localStorage.setItem(FKEY, JSON.stringify(state)); } catch { /* ignore */ } }

let state = loadFilter() || clone(DEFAULTS);
let page = 1, loading = false, exhausted = false, searchSeq = 0;

/* ---- theme ---- */
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  const b = $('#themeBtn'); if (b) b.textContent = t === 'light' ? '☀' : '☾';
  try { localStorage.setItem('dv-theme', t); } catch { /* ignore */ }
}
(function initTheme() {
  let t = 'dark'; try { t = localStorage.getItem('dv-theme') || 'dark'; } catch { /* ignore */ }
  applyTheme(t);
})();

/* ---- boot ---- */
(function init() {
  $('#siteName').textContent = provider.name;
  buildShapes();
  buildGradeSelects();
  wire();
  applyStateToDOM();
  loadStarred();
  runSearch(true);
})();

// Reflect the current `state` onto every filter control.
function applyStateToDOM() {
  document.querySelectorAll('.shapes .shape').forEach((b) => b.classList.toggle('on', state.shape.includes(b.dataset.shape)));
  const set = (id, v) => { const el = $('#' + id); if (el) el.value = v; };
  set('caratMin', state.caratMin); set('caratMax', state.caratMax);
  set('priceMin', state.priceMin); set('priceMax', state.priceMax);
  set('colorHi', state.colorHi); set('colorLo', state.colorLo);
  set('clarityHi', state.clarityHi); set('clarityLo', state.clarityLo);
  set('cutHi', state.cutHi); set('cutLo', state.cutLo);
  $('#onlyMedia').checked = !!state.onlyMedia; $('#onlySale').checked = !!state.onlySale;
  set('sort', state.sortBy ? `${state.sortBy}|${state.sortDir}` : '');
  set('search', state.sku || '');
}

function buildShapes() {
  const wrap = $('#shapes');
  wrap.innerHTML = CFG.shapes.map((s) => `
    <button class="shape" data-shape="${s}" title="${s.replace(/_/g, ' ')}">
      <img src="${ICON(s)}" alt="" onerror="this.style.visibility='hidden'"/>
      <span>${s.replace(/_/g, ' ').replace('old european', 'Old Euro.').replace('old mine', 'Old Mine')}</span>
    </button>`).join('');
  wrap.querySelectorAll('.shape').forEach((b) => b.onclick = () => {
    b.classList.toggle('on');
    const s = b.dataset.shape;
    state.shape = state.shape.includes(s) ? state.shape.filter((x) => x !== s) : [...state.shape, s];
    debounced();
  });
}

// Grade selects: options run best → least. Value = grade code (1-indexed).
function buildGradeSelects() {
  const fill = (id, map, isHi) => {
    const el = $('#' + id);
    const opts = [`<option value="">${isHi ? 'Best' : 'Least'}</option>`];
    for (let code = map.length; code >= 1; code--) opts.push(`<option value="${code}">${map[code - 1]}</option>`);
    el.innerHTML = opts.join('');
    el.onchange = () => { state[id] = el.value; debounced(); };
  };
  fill('colorHi', CFG.maps.color, true);     fill('colorLo', CFG.maps.color, false);
  fill('clarityHi', CFG.maps.clarity, true); fill('clarityLo', CFG.maps.clarity, false);
  fill('cutHi', CFG.maps.cut, true);         fill('cutLo', CFG.maps.cut, false);
}

function wire() {
  const bind = (id, key) => { const el = $('#' + id); el.oninput = () => { state[key] = el.value; debounced(); }; };
  bind('caratMin', 'caratMin'); bind('caratMax', 'caratMax');
  bind('priceMin', 'priceMin'); bind('priceMax', 'priceMax');
  $('#onlyMedia').onchange = (e) => { state.onlyMedia = e.target.checked; debounced(); };
  $('#onlySale').onchange = (e) => { state.onlySale = e.target.checked; debounced(); };
  $('#sort').onchange = (e) => { const [b, d] = e.target.value.split('|'); state.sortBy = b || ''; state.sortDir = d || ''; runSearch(true); };
  $('#search').oninput = (e) => { state.sku = e.target.value.trim(); debounced(400); };
  $('#reset').onclick = resetFilters;
  $('#applyBtn').onclick = () => { clearTimeout(dt); runSearch(true); toast('Filters reapplied'); };
  $('#themeBtn').onclick = () => applyTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
  $('#menuBtn').onclick = () => { $('#rail').classList.add('open'); $('#scrimRail').classList.add('on'); };
  $('#scrimRail').onclick = () => { $('#rail').classList.remove('open'); $('#scrimRail').classList.remove('on'); };
  $('#overlay').addEventListener('click', (e) => { if (e.target.dataset.close !== undefined) closeDetail(); });
  $('#linksBtn').onclick = openLinksModal;
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeLinksModal(); closeDetail(); }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return; // let text fields handle their own undo
      e.preventDefault(); undoStar();
    }
  });
  new IntersectionObserver((ents) => {
    if (ents[0].isIntersecting && !loading && !exhausted && !state.sku) runSearch(false);
  }, { rootMargin: '600px' }).observe($('#gridEnd'));
}

function resetFilters() { state = clone(DEFAULTS); applyStateToDOM(); runSearch(true); }

let dt;
function debounced(ms = 280) { clearTimeout(dt); dt = setTimeout(() => runSearch(true), ms); }

/* ---- build the neutral filter object from UI state ---- */
function buildFilters() {
  const f = { perPage: PER, start: (page - 1) * PER + 1 };
  if (state.sku) { f.sku = state.sku; return f; }
  if (state.shape.length) f.shape = state.shape;
  const num = (v) => (v === '' ? null : Number(v));
  if (state.caratMin || state.caratMax) f.carat = [num(state.caratMin) ?? CFG.ranges.carat[0], num(state.caratMax) ?? CFG.ranges.carat[1]];
  if (state.priceMin || state.priceMax) f.price = [num(state.priceMin) ?? CFG.ranges.price[0], num(state.priceMax) ?? CFG.ranges.price[1]];
  const gr = (hi, lo, rk) => {
    const a = state[hi] ? Number(state[hi]) : null, b = state[lo] ? Number(state[lo]) : null;
    if (a == null && b == null) return null;
    const top = a ?? CFG.ranges[rk][1], bot = b ?? 1;
    return [Math.min(top, bot), Math.max(top, bot)];
  };
  const col = gr('colorHi', 'colorLo', 'color'); if (col) f.color = col;
  const cla = gr('clarityHi', 'clarityLo', 'clarity'); if (cla) f.clarity = cla;
  const cut = gr('cutHi', 'cutLo', 'cut'); if (cut) f.cut = cut;
  if (state.onlyMedia) f.onlyMedia = true;
  if (state.onlySale) f.onlySale = true;
  if (state.sortBy) { f.sortBy = state.sortBy; f.sortDir = state.sortDir; }
  return f;
}

/* ---- search ---- */
async function runSearch(reset) {
  if (reset) { page = 1; exhausted = false; persistFilter(); $('#grid').innerHTML = skeletons(10); }
  // Every call gets a token; only the latest one is allowed to render. This
  // keeps rapid filter changes correct even while a request is in flight
  // (the old `if (loading) return` silently dropped those changes).
  const my = ++searchSeq;
  loading = true;
  const f = buildFilters();
  const key = `${provider.id}:search:${JSON.stringify(f)}`;
  try {
    let data = cacheGet(key);
    if (!data) { data = await runQuery(provider, f); cacheSet(key, data); }
    if (my !== searchSeq) return; // superseded by a newer search
    $('#count').innerHTML = state.sku ? `${data.count} match${data.count === 1 ? '' : 'es'}` : `<b>${Number(data.total).toLocaleString()}</b> diamonds`;
    $('#invN').textContent = state.sku ? 'SKU SEARCH' : `SHOWING ${Math.min(page * PER, data.total)} OF ${Number(data.total).toLocaleString()}`;
    $('#pinnedSection').style.display = state.sku ? 'none' : '';
    const grid = $('#grid');
    if (reset) grid.innerHTML = '';
    if (!data.diamonds.length && reset) {
      grid.innerHTML = state.sku
        ? `<div class="empty">No diamond with SKU “${esc(state.sku)}”. SKU search needs the full, exact SKU.</div>`
        : '<div class="empty">No diamonds match these filters.</div>';
    } else data.diamonds.forEach((d) => grid.appendChild(card(d)));
    if (data.diamonds.length < PER) exhausted = true;
    page++;
  } catch (e) {
    if (my === searchSeq) $('#grid').innerHTML = `<div class="empty">Couldn't reach the inventory. ${esc(e.message)}</div>`;
  } finally {
    if (my === searchSeq) loading = false;
  }
}

// The Starred row is the user's own saved stones. On first ever load, seed it
// with the provider's suggested picks so it isn't empty; after that it's fully
// user-controlled.
async function loadStarred() {
  if (!wasSeeded(provider.id) && provider.pinnedSkus.length) {
    const have = loadStars(provider.id);
    const haveSkus = new Set(have.map((d) => d.sku));
    const missing = provider.pinnedSkus.filter((s) => !haveSkus.has(s));
    if (missing.length) {
      if (!have.length) $('#pinnedGrid').innerHTML = skeletons(provider.pinnedSkus.length);
      try {
        const d = await runItems(provider, missing);
        const merged = have.concat(d.diamonds.filter((x) => !haveSkus.has(x.sku)));
        // Only lock the seed once every pick is in; otherwise keep the partial
        // list and retry the stragglers on the next load.
        if (merged.length >= provider.pinnedSkus.length) markSeeded(provider.id, merged);
        else putStars(provider.id, merged);
      } catch { /* keep whatever we have; retry next load */ }
    } else {
      markSeeded(provider.id, have);
    }
  }
  renderStarred();
}

function renderStarred() {
  const grid = $('#pinnedGrid');
  const stars = loadStars(provider.id);
  $('#pinnedN').textContent = stars.length ? `${stars.length} STARRED` : '';
  if (!stars.length) {
    grid.innerHTML = '<div class="empty">No starred diamonds yet — tap the ☆ on any stone to save it here.</div>';
  } else {
    grid.innerHTML = '';
    stars.forEach((d) => grid.appendChild(card(d)));
  }
}

// Reflect a stone's starred state on every star control currently in the DOM.
function syncStars(sku, on) {
  document.querySelectorAll(`[data-star="${CSS.escape(sku)}"]`).forEach((b) => {
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', String(on));
    b.title = on ? 'Starred — click to remove' : 'Star this diamond';
  });
}

// Apply a starred state and refresh the UI. `record` pushes it onto the undo stack.
const undoStack = [];
function applyStar(diamond, on, record = true) {
  const prev = isStarred(provider.id, diamond.sku);
  if (record && prev !== on) undoStack.push({ diamond, prev });
  setStar(provider.id, diamond, on);
  syncStars(diamond.sku, on);
  renderStarred();
}

// User clicked a star control: flip it and offer an undo.
function star(diamond) {
  const on = !isStarred(provider.id, diamond.sku);
  applyStar(diamond, on);
  const name = `${diamond.carat != null ? diamond.carat.toFixed(2) + 'ct ' : ''}${diamond.shapeLabel || diamond.shape || ''}`.trim();
  toast(`${on ? 'Starred' : 'Removed'} ${name}`, 'Undo', undoStar);
}

function undoStar() {
  const last = undoStack.pop();
  if (!last) { toast('Nothing to undo'); return; }
  applyStar(last.diamond, last.prev, false);
  const name = `${last.diamond.carat != null ? last.diamond.carat.toFixed(2) + 'ct ' : ''}${last.diamond.shapeLabel || last.diamond.shape || ''}`.trim();
  toast(`${last.prev ? 'Restored' : 'Removed'} ${name}`);
}

function skeletons(n) { return Array.from({ length: n }, () => '<div class="skeleton"></div>').join(''); }

/* ---- card ---- */
function card(d) {
  const el = document.createElement('div');
  el.className = 'card'; el.tabIndex = 0; el.setAttribute('role', 'button');
  const media = d.image
    ? `<img class="photo" src="${esc(d.image)}" alt="" loading="lazy" onerror="this.onerror=null;this.className='icon';this.src='${ICON(d.shape)}'"/>`
    : `<img class="icon" src="${ICON(d.shape)}" alt="" onerror="this.style.visibility='hidden'"/>`;
  const sale = d.listPrice && d.price && d.listPrice > d.price ? `<s>${fmtUSD(d.listPrice)}</s>` : '';
  const starred = isStarred(provider.id, d.sku);
  el.innerHTML = `
    <div class="thumb">
      ${media}
      ${d.video ? '<span class="badge">◐ 360°</span>' : ''}
      ${d.growth ? `<span class="badge growth">${esc(d.growth)}</span>` : ''}
      <button class="star${starred ? ' on' : ''}" data-star="${esc(d.sku)}" aria-label="Star this diamond" aria-pressed="${starred}" title="${starred ? 'Starred — click to remove' : 'Star this diamond'}">★</button>
    </div>
    <div class="body">
      <div class="carat">${d.carat != null ? d.carat.toFixed(2) : '—'}<small> ct</small></div>
      <div class="shape">${esc(d.shapeLabel || d.shape)}</div>
      <div class="specs">
        ${d.color ? `<span class="chip">${esc(d.color)}</span>` : ''}
        ${d.clarity ? `<span class="chip">${esc(d.clarity)}</span>` : ''}
        ${d.cut ? `<span class="chip">${esc(d.cut)}</span>` : ''}
      </div>
      <div class="price">${fmtUSD(d.price)} ${sale}</div>
    </div>`;
  el.onclick = () => openDetail(d);
  el.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDetail(d); } };
  el.querySelector('.star').onclick = (e) => { e.stopPropagation(); star(d, e.currentTarget); };

  // Hover → live 360° viewer, scaled to fill the tile (drag to spin). The
  // iframe stays attached and is hidden on leave, so re-hovering the same stone
  // reuses the loaded viewer with no refetch (LRU-capped by touchVid). A
  // cross-origin iframe swallows its own clicks, so clicking the card elsewhere
  // still opens detail.
  if (d.video) {
    const thumb = el.querySelector('.thumb');
    let timer;
    el.addEventListener('mouseenter', () => {
      timer = setTimeout(() => {
        if (el._vid) { el._vid.style.display = ''; touchVid(el._vidEntry); return; }
        el._vid = mount360(thumb, d.video, 1.12);
        el._vidEntry = { card: el, frame: el._vid };
        touchVid(el._vidEntry);
      }, 160);
    });
    el.addEventListener('mouseleave', () => {
      clearTimeout(timer);
      if (el._vid) el._vid.style.display = 'none';
    });
  }
  return el;
}

/* ---- detail ---- */
let detailResize = null;
function openDetail(d) {
  const stage = $('#stage');
  if (detailResize) window.removeEventListener('resize', detailResize);
  detailResize = null;
  if (d.video) {
    stage.innerHTML = '<div class="corner tl"></div><div class="corner tr"></div><div class="corner bl"></div><div class="corner br"></div><div class="spin-tag">Live 360° · drag to rotate</div>';
    const frame = mount360(stage, d.video, 1.02);
    frame.setAttribute('allowfullscreen', '');
    detailResize = () => scale360(frame, stage);
    window.addEventListener('resize', detailResize);
    // The overlay isn't visible yet (class added below), so the stage has no
    // size at mount time — rescale once it's laid out.
    requestAnimationFrame(() => requestAnimationFrame(detailResize));
  } else {
    stage.innerHTML = `<div class="novid"><img src="${ICON(d.shape)}" alt="" onerror="this.style.display='none'"/>No 360° video for this stone</div>`;
  }

  const g = (lbl, val) => `<div class="g"><div class="gl">${lbl}</div><div class="gv">${val || '—'}</div></div>`;
  const row = (k, v) => (v ? `<div class="rrow"><span class="k">${k}</span><span class="v">${esc(v)}</span></div>` : '');
  const sale = d.listPrice && d.price && d.listPrice > d.price ? `<s>${fmtUSD(d.listPrice)}</s>` : '';

  const dStarred = isStarred(provider.id, d.sku);
  $('#panel').innerHTML = `
    <button class="close" data-close>✕</button>
    <button class="dstar star${dStarred ? ' on' : ''}" data-star="${esc(d.sku)}" aria-label="Star this diamond" aria-pressed="${dStarred}" title="${dStarred ? 'Starred — click to remove' : 'Star this diamond'}">★</button>
    <div class="p-shape">${esc(d.shapeLabel || d.shape)} · ${esc(d.growth || 'Lab Grown')}</div>
    <div class="p-carat">${d.carat != null ? d.carat.toFixed(2) : '—'}<small> ct</small></div>
    <div class="p-sku">SKU ${esc(d.sku)}</div>
    <div class="p-price">${fmtUSD(d.price)} ${sale}</div>
    <div class="grade4">${g('Color', d.color)}${g('Clarity', d.clarity)}${g('Cut', d.cut)}</div>
    <div class="readout">
      ${row('Measurements', d.measurements)}
      ${row('Table', d.table ? d.table + '%' : '')}
      ${row('Depth', d.depth ? d.depth + '%' : '')}
      ${row('L/W Ratio', d.lwratio)}
      ${row('Crown Angle', d.crownAngle ? d.crownAngle + '°' : '')}
      ${row('Pavilion Angle', d.pavilionAngle ? d.pavilionAngle + '°' : '')}
      ${row('Polish', d.polish)}
      ${row('Symmetry', d.symmetry)}
      ${row('Fluorescence', d.fluorescence)}
    </div>
    <div class="actions">
      ${d.cert ? `<a class="act cert" href="${esc(d.cert)}" target="_blank" rel="noopener">⬡ ${esc(d.certType)} Certificate</a>` : ''}
      <a class="act link" href="${esc(d.productUrl)}" target="_blank" rel="noopener">↗ On Site</a>
    </div>`;
  $('#panel .dstar').onclick = (e) => { e.stopPropagation(); star(d, e.currentTarget); };
  $('#overlay').classList.add('on');
  document.body.style.overflow = 'hidden';
}

function closeDetail() {
  $('#overlay').classList.remove('on');
  $('#stage').innerHTML = ''; // stop the video
  if (detailResize) { window.removeEventListener('resize', detailResize); detailResize = null; }
  document.body.style.overflow = '';
}

/* ---- toast (undo + confirmations) ---- */
let toastEl, toastTimer;
function toast(msg, actionLabel, onAction) {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className = 'toast';
    document.body.appendChild(toastEl);
  }
  toastEl.innerHTML = `<span class="msg"></span>${actionLabel ? `<button class="undo">${esc(actionLabel)}<kbd>⌘Z</kbd></button>` : ''}`;
  toastEl.querySelector('.msg').textContent = msg;
  if (actionLabel && onAction) {
    toastEl.querySelector('.undo').onclick = () => { hideToast(); onAction(); };
  }
  toastEl.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, 6000);
}
function hideToast() { if (toastEl) toastEl.classList.remove('on'); }

/* ---- copy / import starred diamonds ---- */

// Plain-text export: a human-readable block per stone, easy to copy or paste.
function starredText() {
  const stars = loadStars(provider.id);
  if (!stars.length) return '';
  const lines = [`Facet — ${stars.length} starred (${provider.name})`, ''];
  for (const d of stars) {
    const spec = [d.carat != null ? d.carat.toFixed(2) + 'ct' : null, d.shapeLabel, d.color, d.clarity, d.cut, fmtUSD(d.price)].filter(Boolean).join(' · ');
    lines.push(`${d.sku}  —  ${spec}`);
    if (d.productUrl) lines.push(`  Product: ${d.productUrl}`);
    if (d.video) lines.push(`  360 video: ${d.video}`);
    if (d.cert) lines.push(`  ${d.certType || 'Certificate'}: ${d.cert}`);
    lines.push('');
  }
  return lines.join('\n').trim() + '\n';
}

// Pull SKUs out of pasted text: our export blocks, product URLs, or a bare list.
function parseSkus(text) {
  const skus = new Set();
  const url = /\/diamond\/([^/\s)]+)\//g;
  let m;
  while ((m = url.exec(text))) skus.add(m[1].trim());
  // "800642473  —  ..." style lines (SKU before an em/en dash or double space)
  const line = /^\s*([A-Za-z0-9][A-Za-z0-9-]{2,})\s+(?:[—–-]{1,2}|\s)/gm;
  while ((m = line.exec(text))) if (/\d/.test(m[1])) skus.add(m[1].trim());
  if (!skus.size) { // fallback: any token that looks like a SKU
    text.split(/[\s,;]+/).forEach((t) => { t = t.trim(); if (/^[A-Za-z0-9-]{4,}$/.test(t) && /\d/.test(t)) skus.add(t); });
  }
  return [...skus];
}

let linksModal;
function openLinksModal() {
  if (!linksModal) {
    linksModal = document.createElement('div');
    linksModal.className = 'modal-scrim';
    linksModal.addEventListener('click', (e) => { if (e.target === linksModal || e.target.dataset.close !== undefined) closeLinksModal(); });
    document.body.appendChild(linksModal);
  }
  const text = starredText();
  const count = loadStars(provider.id).length;
  linksModal.innerHTML = `
    <div class="modal">
      <button class="mclose" data-close aria-label="Close">✕</button>
      <h3>Copy your starred links</h3>
      <p class="sub">${count ? `${count} starred diamond${count === 1 ? '' : 's'}. Select all, or hit Copy.` : 'No starred diamonds yet — star some, or import a list below.'}</p>
      <textarea class="io out" id="ioOut" readonly placeholder="Nothing starred yet.">${esc(text)}</textarea>
      <div class="row">
        <button class="mbtn primary" id="ioCopy"${count ? '' : ' disabled'}>Copy to clipboard</button>
        <button class="mbtn" id="ioTxt"${count ? '' : ' disabled'}>Download .txt</button>
      </div>
      <div class="divider"></div>
      <h3>Import</h3>
      <p class="sub">Paste exported text, product links, or a list of SKUs. Matching stones are added to your starred.</p>
      <textarea class="io paste" id="ioIn" placeholder="800642473, 800642471&#10;or paste an exported list…"></textarea>
      <div class="row"><button class="mbtn primary" id="ioImport">Import</button></div>
    </div>`;
  linksModal.querySelector('#ioCopy').onclick = () => {
    const t = starredText();
    navigator.clipboard?.writeText(t).then(() => toast('Copied to clipboard')).catch(() => selectOut());
    if (!navigator.clipboard) selectOut();
  };
  linksModal.querySelector('#ioTxt').onclick = () => downloadTxt(starredText());
  linksModal.querySelector('#ioImport').onclick = () => doImport(linksModal.querySelector('#ioIn').value);
  linksModal.classList.add('on');
  document.body.style.overflow = 'hidden';
}
function closeLinksModal() {
  if (linksModal) linksModal.classList.remove('on');
  if (!$('#overlay').classList.contains('on')) document.body.style.overflow = '';
}
function selectOut() { const o = linksModal?.querySelector('#ioOut'); if (o) { o.focus(); o.select(); toast('Copy blocked — text selected, press ⌘C'); } }

function downloadTxt(text) {
  const blob = new Blob([text], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `facet-starred-${loadStars(provider.id).length}.txt`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function doImport(text) {
  const skus = parseSkus(text || '');
  if (!skus.length) { toast('No SKUs found in that text'); return; }
  const have = new Set(loadStars(provider.id).map((d) => d.sku));
  const fresh = skus.filter((s) => !have.has(s));
  if (!fresh.length) { toast(`All ${skus.length} already starred`); return; }
  toast(`Importing ${fresh.length}…`);
  try {
    const { diamonds } = await runItems(provider, fresh);
    diamonds.forEach((d) => { setStar(provider.id, d, true); syncStars(d.sku, true); });
    renderStarred();
    const missed = fresh.length - diamonds.length;
    toast(`Imported ${diamonds.length}${missed ? ` · ${missed} not found` : ''}`);
    if (diamonds.length) closeLinksModal();
  } catch { toast('Import failed — check the list and try again'); }
}
