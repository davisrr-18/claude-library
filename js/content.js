export const TIER_IDS = ['basicas', 'intermediarias', 'complexas'];
export const PIECE_TYPES = ['skill', 'claude-md', 'arquitetura', 'agente', 'workflow', 'prompt'];

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Separa front matter `chave: valor` (entre `---`) do corpo. */
export function parseFrontMatter(text) {
  const src = String(text).replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const m = src.match(/^---\n(?:([\s\S]*?)\n)?---[ \t]*(?:\n|$)/);
  if (!m) return { meta: {}, body: src };
  const meta = {};
  for (const line of (m[1] ?? '').split('\n')) {
    const i = line.indexOf(':');
    if (i <= 0) continue;
    const key = line.slice(0, i).trim();
    let value = line.slice(i + 1).trim();
    if (/^(["']).*\1$/.test(value) && value.length >= 2) value = value.slice(1, -1);
    if (key) meta[key] = value;
  }
  return { meta, body: src.slice(m[0].length) };
}

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim() !== '';
}

function isSafeRelativePath(p) {
  if (typeof p !== 'string' || !p || p.startsWith('/') || p.includes('\\')) return false;
  return !p.split('/').some((seg) => seg === '..' || seg === '' || seg === '.');
}

/** Valida a estrutura do manifest. Retorna todos os erros encontrados. */
export function validateManifest(m) {
  const errors = [];
  if (!m || typeof m !== 'object' || !Array.isArray(m.tiers)) {
    return { ok: false, errors: ['manifest inválido: falta a lista "tiers"'] };
  }
  const seenTiers = new Set();
  for (const tier of m.tiers) {
    if (!TIER_IDS.includes(tier?.id)) {
      errors.push(`nível desconhecido: ${JSON.stringify(tier?.id)}`);
      continue;
    }
    if (seenTiers.has(tier.id)) errors.push(`nível duplicado: ${tier.id}`);
    seenTiers.add(tier.id);
    if (!isNonEmptyString(tier.title)) errors.push(`${tier.id}: falta title`);
    if (!Array.isArray(tier.cards)) {
      errors.push(`${tier.id}: "cards" deve ser uma lista`);
      continue;
    }
    const seenCards = new Set();
    for (const card of tier.cards) {
      const where = `${tier.id}/${card?.id}`;
      if (typeof card?.id !== 'string' || !KEBAB.test(card.id)) {
        errors.push(`${tier.id}: id de card inválido (use kebab-case): ${JSON.stringify(card?.id)}`);
        continue;
      }
      if (seenCards.has(card.id)) errors.push(`${where}: id de card duplicado`);
      seenCards.add(card.id);
      if (!isNonEmptyString(card.title)) errors.push(`${where}: falta title`);
      if (card.summary !== undefined && typeof card.summary !== 'string') {
        errors.push(`${where}: "summary" deve ser texto`);
      }
      if (card.tags !== undefined && !(Array.isArray(card.tags) && card.tags.every((t) => typeof t === 'string'))) {
        errors.push(`${where}: "tags" deve ser uma lista de textos`);
      }
      if (!Array.isArray(card.pieces)) {
        errors.push(`${where}: "pieces" deve ser uma lista`);
        continue;
      }
      const seenTypes = new Set();
      for (const piece of card.pieces) {
        if (!PIECE_TYPES.includes(piece?.type)) {
          errors.push(`${where}: tipo de peça inválido: ${JSON.stringify(piece?.type)}`);
          continue;
        }
        if (!isNonEmptyString(piece.title)) errors.push(`${where}/${piece.type}: falta title`);
        if (seenTypes.has(piece.type)) errors.push(`${where}: tipo de peça repetido: ${piece.type}`);
        seenTypes.add(piece.type);
        if (!isSafeRelativePath(piece.file)) {
          errors.push(`${where}/${piece.type}: caminho de arquivo inválido: ${JSON.stringify(piece.file)}`);
        }
      }
    }
  }
  for (const id of TIER_IDS) {
    if (!seenTiers.has(id)) errors.push(`falta o nível: ${id}`);
  }
  return { ok: errors.length === 0, errors };
}
