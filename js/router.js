import { TIER_IDS, PIECE_TYPES } from './content.js';

const NOT_FOUND = { view: 'notfound' };

/** Converte `location.hash` em uma descrição de rota. Não toca no DOM. */
export function parseRoute(hash) {
  const raw = String(hash || '').replace(/^#/, '');
  let parts;
  try {
    parts = raw.split('/').filter(Boolean).map(decodeURIComponent);
  } catch {
    return NOT_FOUND;
  }
  if (parts.length === 0) return { view: 'home' };
  const [tier, card, type, ...rest] = parts;
  if (!TIER_IDS.includes(tier) || rest.length) return NOT_FOUND;
  if (!card) return { view: 'tier', tier };
  if (!type) return { view: 'card', tier, card };
  if (!PIECE_TYPES.includes(type)) return NOT_FOUND;
  return { view: 'piece', tier, card, type };
}

/** Só hashes de rota (vazio, `#` ou `#/...`) são do app; `#main` etc. são âncoras. */
export function isAppHash(hash) {
  const h = String(hash || '');
  return h === '' || h === '#' || h.startsWith('#/');
}
