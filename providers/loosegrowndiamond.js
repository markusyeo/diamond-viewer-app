/**
 * Provider: Loose Grown Diamond (loosegrowndiamond.com)
 *
 * A provider adapter is a plain, isomorphic ES module — no DOM, no Node APIs —
 * so the same code runs in the browser (static build) and in the dev server.
 * See `providers/_TEMPLATE.js` for the full interface contract.
 */

const ORIGIN = 'https://www.loosegrowndiamond.com';
const ENDPOINT = `${ORIGIN}/wp-json/ls/v1/inventory-filter`;

// Grade code → label. Codes are 1-indexed (code 1 = worst, code N = best).
const MAPS = {
  cut:          ['Good', 'Very Good', 'Excellent', 'Ideal'],
  color:        ['M', 'L', 'K', 'J', 'I', 'H', 'G', 'F', 'E', 'D'],
  clarity:      ['I2', 'I1', 'SI3', 'SI2', 'SI1', 'VS2', 'VS1', 'VVS2', 'VVS1', 'IF', 'FL'],
  polish:       ['Good', 'Very Good', 'Excellent'],
  symmetry:     ['Good', 'Very Good', 'Excellent'],
  fluorescence: ['None', 'Faint', 'Medium', 'Strong', 'Very Strong'],
};

const SHAPES = [
  'round', 'oval', 'cushion', 'emerald', 'pear', 'radiant', 'princess',
  'marquise', 'asscher', 'heart', 'old_european', 'old_mine', 'rose_cut',
  'hexagon', 'kite', 'half_moon', 'baguette', 'trapezoid', 'triangular',
];

const label = (map, v) => {
  const n = Math.round(Number(v));
  return (n >= 1 && map[n - 1]) ? map[n - 1] : null;
};
const titleCase = (s) => String(s || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export default {
  id: 'loosegrowndiamond',
  name: 'Loose Grown Diamond',
  productBase: ORIGIN,
  maps: MAPS,
  shapes: SHAPES,
  ranges: {
    carat:   [0.05, 77.78],
    price:   [92, 4284300],
    cut:     [0, 4],
    color:   [0, 10],
    clarity: [0, 11],
  },
  // Diamonds shown up front in the "Starred" row.
  pinnedSkus: ['827613442', '800642473', '800642471', '803689299', '800642474'],

  shapeIcon(slug) {
    return `${ORIGIN}/wp-content/themes/loose-diomond/aj_custom/diamond/shape/${slug}.webp`;
  },

  // Neutral filter object → the site's inventory-filter request.
  buildRequest(f = {}) {
    const body = { ls_start: f.start || 1, ls_per_page: f.perPage || 60 };
    if (f.sku) body.ls_sku = String(f.sku);
    if (Array.isArray(f.shape) && f.shape.length) body.shape = f.shape;
    const range = (key, val) => {
      if (Array.isArray(val) && val.length === 2) body[key] = `${val[0]},${val[1]}`;
    };
    range('carat_range', f.carat);
    range('price_range', f.price);
    range('cut_range', f.cut);
    range('color', f.color);          // NB: the site uses "color", not "color_range"
    range('clarity_range', f.clarity);
    if (f.sortBy) { body.ls_sortby = f.sortBy; body.ls_sort = f.sortDir || 'ASC'; }
    if (f.onlyMedia) body.is_media = 1;
    if (f.onlySale) body.is_sale = 1;
    return {
      url: ENDPOINT,
      method: 'POST',
      // Sent server-side only; browsers can't set Origin/Referer/UA (the CORS
      // proxy supplies its own). The endpoint accepts the request without them.
      headers: {
        'content-type': 'application/json',
        'origin': ORIGIN,
        'referer': `${ORIGIN}/lab-diamonds/`,
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      body,
    };
  },

  buildItemRequest(sku) {
    return this.buildRequest({ sku, perPage: 1 });
  },

  parseList(json) {
    return {
      total: json?.total || 0,
      count: json?.current_count || (json?.data?.length ?? 0),
      records: json?.data || [],
    };
  },

  normalize(d) {
    const shape = String(d.shape || '').toLowerCase().replace(/\s+/g, '_');
    return {
      provider: 'loosegrowndiamond',
      sku: d.sku,
      shape,
      shapeLabel: titleCase(d.shape_title || d.shape),
      carat: d.carat != null ? Number(d.carat) : null,
      // The site shows `price` as the retail figure and strikes `org_price`
      // when it differs. `sale_price` is an internal net figure it never shows.
      price: d.price != null ? Number(d.price) : null,
      listPrice: (d.org_price !== '' && d.org_price != 0 && Number(d.org_price) !== Number(d.price))
        ? Number(d.org_price) : null,
      cut: label(MAPS.cut, d.cut),
      color: label(MAPS.color, d.color),
      clarity: label(MAPS.clarity, d.clarity),
      polish: label(MAPS.polish, d.polish),
      symmetry: label(MAPS.symmetry, d.symmetry),
      fluorescence: label(MAPS.fluorescence, d.fluorescence),
      growth: d.dtype || null,
      cert: d.certificate || null,
      certType: d.certificate_type === '2' ? 'GIA' : 'IGI',
      video: d.video || null,
      image: d.image || null,
      measurements: d.mm || null,
      table: d.av_table ? Number(d.av_table) : null,
      depth: d.depth ? Number(d.depth) : null,
      crownAngle: Number(d.crown_angle) || null,
      pavilionAngle: Number(d.pavilion_angle) || null,
      lwratio: d.lwratio ? Number(d.lwratio) : null,
      productUrl: `${ORIGIN}/diamond/${d.sku}/`,
    };
  },
};
