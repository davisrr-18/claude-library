export const TIER_IDS = ['basicas', 'intermediarias', 'complexas'];
export const PIECE_TYPES = ['skill', 'claude-md', 'arquitetura', 'agente', 'workflow', 'prompt'];

export const CARD_ICONS = [
  'folder', 'code', 'zap', 'layers', 'git-branch', 'bot', 'file-text', 'message-square', 'shield', 'bug', 'star',
];

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const KEY_LINE = /^([A-Za-z0-9_-]+)[ \t]*:(.*)$/;

/**
 * Separa o front matter (`chave: valor`, entre `---`) do corpo.
 * Subconjunto de YAML: valores simples, aspas, blocos `>` (dobrado) e `|` (literal) e continuação indentada.
 * Se alguma linha do bloco não tiver esse formato, nada é front matter (ex.: régua `---` no corpo).
 */
export function parseFrontMatter(text) {
  const src = String(text).replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const m = src.match(/^---\n(?:([\s\S]*?)\n)?---[ \t]*(?:\n|$)/);
  if (!m) return { meta: {}, body: src };

  const fields = []; // { key, value, extra: [] }
  for (const line of (m[1] ?? '').split('\n')) {
    if (line.trim() === '') continue;
    const kv = line.match(KEY_LINE);
    if (kv && !/^\s/.test(line)) fields.push({ key: kv[1], value: kv[2].trim(), extra: [] });
    else if (/^\s+\S/.test(line) && fields.length) fields[fields.length - 1].extra.push(line.trim());
    else return { meta: {}, body: src };
  }

  const meta = {};
  for (const { key, value, extra } of fields) {
    let v = value;
    if (/^[>|][+-]?$/.test(v)) v = extra.join(v[0] === '>' ? ' ' : '\n');
    else if (extra.length) v = [v, ...extra].join(' ');
    else if (v.length >= 2 && /^(["']).*\1$/.test(v)) v = v.slice(1, -1);
    meta[key] = v;
  }
  return { meta, body: src.slice(m[0].length) };
}

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim() !== '';
}

function isSafeRelativePath(p) {
  if (typeof p !== 'string' || !p || p.startsWith('/') || p.includes('\\')) return false;
  if (p !== p.trim() || /[\u0000-\u001f\u007f]/.test(p)) return false;
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
    if (tier.description !== undefined && typeof tier.description !== 'string') {
      errors.push(`${tier.id}: "description" deve ser texto`);
    }
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
      if (card.icon !== undefined && !CARD_ICONS.includes(card.icon)) {
        errors.push(`${where}: icon inválido: ${JSON.stringify(card.icon)}`);
      }
      if (card.tags !== undefined && !(Array.isArray(card.tags) && card.tags.every(isNonEmptyString))) {
        errors.push(`${where}: "tags" deve ser uma lista de textos não vazios`);
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
