/**
 * Provider registry.
 *
 * To add a provider: create `providers/<id>.js` implementing the adapter
 * contract (see `_TEMPLATE.js`), import it here, and add it to `providers`.
 * Everything else — filters, grid, detail, caching, dev proxy — works from the
 * adapter's declared maps/ranges/shapes with no other changes.
 */
import loosegrowndiamond from './loosegrowndiamond.js';

export const providers = [
  loosegrowndiamond,
];

export const byId = Object.fromEntries(providers.map((p) => [p.id, p]));

export const defaultProvider = providers[0];
