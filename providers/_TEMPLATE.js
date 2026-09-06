/**
 * Provider adapter template — copy this file to `providers/<your-id>.js`.
 *
 * An adapter is a plain, isomorphic ES module (no DOM, no Node APIs) so the
 * exact same code runs in the browser (static build) and in the dev server.
 * The app talks to every provider through this one interface.
 *
 * ── Neutral shapes the app uses ────────────────────────────────────────────
 *
 * Filters (produced by the UI, passed to buildRequest):
 *   {
 *     start, perPage,                       // pagination (1-indexed start)
 *     sku,                                  // single-stone lookup (skips other filters)
 *     shape: string[],                      // shape slugs, e.g. ['round','oval']
 *     carat:   [min, max],                  // carat weight
 *     price:   [min, max],                  // in the provider's currency
 *     cut:     [minCode, maxCode],          // grade CODES into maps.cut
 *     color:   [minCode, maxCode],          // grade CODES into maps.color
 *     clarity: [minCode, maxCode],          // grade CODES into maps.clarity
 *     onlyMedia, onlySale: boolean,
 *     sortBy: 'price' | 'carat', sortDir: 'ASC' | 'DESC',
 *   }
 *
 * Diamond (returned by normalize, consumed by the UI):
 *   {
 *     provider, sku, shape, shapeLabel,
 *     carat, price, listPrice,             // listPrice > price renders as a sale
 *     cut, color, clarity,                 // human labels, e.g. 'Ideal', 'D', 'VVS1'
 *     polish, symmetry, fluorescence,
 *     growth,                              // e.g. 'CVD', 'HPHT'
 *     cert, certType,                      // certificate URL + 'IGI' | 'GIA'
 *     video, image,                        // media URLs (null if none)
 *     measurements, table, depth, crownAngle, pavilionAngle, lwratio,
 *     productUrl,
 *   }
 */
export default {
  id: 'my-provider',                 // unique slug
  name: 'My Provider',               // shown in the UI
  productBase: 'https://example.com',

  // Grade code → label, 1-indexed (code 1 = worst … code N = best).
  maps: {
    cut:          ['Good', 'Very Good', 'Excellent', 'Ideal'],
    color:        ['M', 'L', 'K', 'J', 'I', 'H', 'G', 'F', 'E', 'D'],
    clarity:      ['I2', 'I1', 'SI2', 'SI1', 'VS2', 'VS1', 'VVS2', 'VVS1', 'IF', 'FL'],
    polish:       ['Good', 'Very Good', 'Excellent'],
    symmetry:     ['Good', 'Very Good', 'Excellent'],
    fluorescence: ['None', 'Faint', 'Medium', 'Strong', 'Very Strong'],
  },
  shapes: ['round', 'oval', 'cushion', 'emerald', 'pear'],
  ranges: {
    carat:   [0.05, 80],
    price:   [0, 5000000],
    cut:     [0, 4],
    color:   [0, 10],
    clarity: [0, 10],
  },
  pinnedSkus: [],

  // URL for a shape's icon (used as a thumbnail fallback). Return '' to skip.
  shapeIcon(/* slug */) { return ''; },

  // Filters → an HTTP request describing how to fetch a page of results.
  // `headers` are applied server-side only (the browser build routes through a
  // CORS proxy and cannot set forbidden headers like Origin/Referer).
  buildRequest(/* filters */) {
    return { url: '', method: 'POST', headers: { 'content-type': 'application/json' }, body: {} };
  },

  // A request that returns exactly the one stone with this sku.
  buildItemRequest(sku) { return this.buildRequest({ sku, perPage: 1 }); },

  // Raw provider JSON → { total, count, records }.
  parseList(/* json */) { return { total: 0, count: 0, records: [] }; },

  // One raw record → a Diamond (shape documented above).
  normalize(/* record */) { return {}; },
};
