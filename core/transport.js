/**
 * Transport — turns a neutral filter object into normalized Diamonds, using
 * whichever mode is available (see config.js).
 *
 *  - local:  POST to the dev server's /api, which runs the provider adapter.
 *  - static: run the adapter in the browser and fetch via the CORS proxy.
 */
import { CONFIG } from './config.js';

let modePromise = null;

export function detectMode() {
  if (!modePromise) {
    modePromise = fetch('/api/health')
      .then((r) => (r.ok ? 'local' : 'static'))
      .catch(() => 'static');
  }
  return modePromise;
}

// Execute a provider request. Static mode routes through the CORS proxy.
async function execute(req) {
  const mode = await detectMode();
  const url = mode === 'static' ? CONFIG.corsProxy + req.url : req.url;
  const res = await fetch(url, {
    method: req.method || 'GET',
    headers: { 'content-type': 'application/json' },
    body: req.body ? JSON.stringify(req.body) : undefined,
  });
  if (!res.ok) throw new Error(`upstream ${res.status}`);
  return res.json();
}

/** Run a search. Returns { total, count, diamonds }. */
export async function runQuery(provider, filters) {
  const mode = await detectMode();
  if (mode === 'local') {
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ provider: provider.id, filters }),
    });
    if (!res.ok) throw new Error(`server ${res.status}`);
    return res.json();
  }
  const json = await execute(provider.buildRequest(filters));
  const { total, count, records } = provider.parseList(json);
  return { total, count, diamonds: records.map((r) => provider.normalize(r)) };
}

/** Look up specific SKUs (used for the pinned row). Returns { diamonds }. */
export async function runItems(provider, skus) {
  const mode = await detectMode();
  if (mode === 'local') {
    const res = await fetch('/api/items', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ provider: provider.id, skus }),
    });
    if (!res.ok) throw new Error(`server ${res.status}`);
    return res.json();
  }
  const found = await Promise.all(skus.map(async (sku) => {
    try {
      const json = await execute(provider.buildItemRequest(sku));
      const { records } = provider.parseList(json);
      return records[0] ? provider.normalize(records[0]) : null;
    } catch { return null; }
  }));
  return { diamonds: found.filter(Boolean) };
}
