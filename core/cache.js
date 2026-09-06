/** localStorage cache for API responses (data only), namespaced under "dv2:". */
import { CONFIG } from './config.js';

export function cacheGet(key) {
  try {
    const r = JSON.parse(localStorage.getItem('dv2:' + key));
    if (r && Date.now() - r.t < CONFIG.cacheTtlMs) return r.v;
  } catch { /* ignore malformed / unavailable storage */ }
  return null;
}

export function cacheSet(key, v) {
  try {
    localStorage.setItem('dv2:' + key, JSON.stringify({ t: Date.now(), v }));
  } catch {
    // Quota exceeded — drop our oldest entries and retry once.
    try {
      Object.keys(localStorage).filter((k) => k.startsWith('dv2:')).slice(0, 20)
        .forEach((k) => localStorage.removeItem(k));
      localStorage.setItem('dv2:' + key, JSON.stringify({ t: Date.now(), v }));
    } catch { /* give up silently */ }
  }
}
