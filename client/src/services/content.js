import { validateManifest } from '../utils/content.js';

// Único lugar do client que lê `content/` (arquivos estáticos ao lado do site).
const pieceCache = new Map();

const encodePath = (file) => file.split('/').map(encodeURIComponent).join('/');

async function get(url) {
  // no-cache: revalida com o servidor (ETag, 304 barato). Sem isso o Pages serve manifest de até 10 min atrás junto
  // com o código novo, e a validação recusa o formato antigo.
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res;
}

/** Lê e valida `content/manifest.json`. Lança erro com o status HTTP ou a lista de problemas do manifest. */
export async function loadManifest() {
  const data = await (await get('content/manifest.json')).json();
  const { ok, errors } = validateManifest(data);
  if (!ok) throw new Error(errors.join('; '));
  return data;
}

/** Texto de uma peça. Cacheia a promessa (chamadas simultâneas dividem um fetch) e esquece a falha. */
export function loadPiece(file) {
  if (pieceCache.has(file)) return pieceCache.get(file);
  const promise = get(`content/${encodePath(file)}`).then((res) => res.text());
  pieceCache.set(file, promise);
  promise.catch(() => pieceCache.delete(file));
  return promise;
}

export function clearPieceCache() {
  pieceCache.clear();
}
