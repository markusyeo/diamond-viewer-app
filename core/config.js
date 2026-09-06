/**
 * Runtime configuration.
 *
 * The app runs in one of two transport modes, detected automatically:
 *  - "local":  served by the bundled dev server, which proxies provider APIs
 *              (no CORS limits, can set request headers).
 *  - "static": served as a plain static site (e.g. GitHub Pages). The browser
 *              calls provider APIs through a public CORS proxy, because the
 *              providers block direct cross-origin browser requests.
 */
export const CONFIG = {
  // Public CORS proxy for the static build. `${corsProxy}${targetUrl}`.
  // proxy.cors.sh forwards the method + body and returns CORS headers.
  corsProxy: 'https://proxy.cors.sh/',

  // Results per page (also the infinite-scroll page size).
  perPage: 60,

  // Cache lifetime for API responses in localStorage.
  cacheTtlMs: 30 * 60 * 1000,
};
