/**
 * Starred diamonds — the user's own saved stones, per provider.
 *
 * Stored durably in localStorage (no TTL, separate from the response cache).
 * We keep the full normalized diamond object, not just its SKU, so the Starred
 * row renders instantly without refetching.
 */
const KEY = (pid) => `dvstars:${pid}`;
const SEEDED = (pid) => `dvseeded:${pid}`;

export function loadStars(pid) {
  try { return JSON.parse(localStorage.getItem(KEY(pid))) || []; } catch { return []; }
}

function save(pid, arr) {
  try { localStorage.setItem(KEY(pid), JSON.stringify(arr)); } catch { /* ignore */ }
}

export function isStarred(pid, sku) {
  return loadStars(pid).some((d) => d.sku === sku);
}

/** Toggle a diamond. Returns true if it is now starred. Newest stars first. */
export function toggleStar(pid, diamond) {
  return setStar(pid, diamond, !isStarred(pid, diamond.sku));
}

/** Force a diamond's starred state to `on`. Returns the resulting state. */
export function setStar(pid, diamond, on) {
  const arr = loadStars(pid);
  const i = arr.findIndex((d) => d.sku === diamond.sku);
  if (on && i < 0) arr.unshift(diamond);
  else if (!on && i >= 0) arr.splice(i, 1);
  save(pid, arr);
  return on;
}

export const wasSeeded = (pid) => { try { return !!localStorage.getItem(SEEDED(pid)); } catch { return false; } };

/** Persist the starred list without marking the seed complete (partial seed). */
export const putStars = (pid, diamonds) => save(pid, diamonds);

/** Persist the starred list and lock the one-time seed so it never re-runs. */
export function markSeeded(pid, diamonds) {
  save(pid, diamonds);
  try { localStorage.setItem(SEEDED(pid), '1'); } catch { /* ignore */ }
}
