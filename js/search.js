/** Normaliza para comparação: minúsculas e sem acentos. */
export function normalize(s) {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/** Palavras normalizadas (letras e dígitos); hífen e pontuação separam palavras. */
function tokenize(s) {
  return normalize(s).split(/[^a-z0-9]+/).filter(Boolean);
}

/**
 * Um registro por card: { tier, card, title, summary, tags, text }.
 * `text` é o corpo concatenado das peças (pode ser '' até ser carregado).
 */
export function buildIndex(entries) {
  return entries.map((entry, order) => ({
    entry,
    order,
    title: tokenize(entry.title),
    tags: (entry.tags || []).map(normalize), // tag inteira, para o filtro por tag
    tagWords: (entry.tags || []).flatMap(tokenize),
    summary: tokenize(entry.summary),
    text: [...new Set(tokenize(entry.text))],
  }));
}

const hasPrefix = (words, w) => words.some((x) => x.startsWith(w));

/**
 * Busca por palavras: cada palavra da consulta deve ser o começo de alguma palavra do card
 * ("git" não casa com "digital"; "migra" casa com "Migração"). Consulta vazia devolve todos na
 * ordem original; consulta só com pontuação não encontra nada. Com consulta, ordena por relevância:
 * título > tags/resumo > corpo. opts: { tier?: string, tags?: string[] } (tags combinam com AND).
 */
export function search(index, query, opts = {}) {
  const words = tokenize(query);
  if (!words.length && normalize(query).trim() !== '') return [];
  const wantTags = (opts.tags || []).map(normalize);
  const scored = [];
  for (const row of index) {
    if (opts.tier && row.entry.tier !== opts.tier) continue;
    if (!wantTags.every((t) => row.tags.includes(t))) continue;
    let score = 0;
    let ok = true;
    for (const w of words) {
      if (hasPrefix(row.title, w)) score += 10;
      else if (hasPrefix(row.tagWords, w) || hasPrefix(row.summary, w)) score += 4;
      else if (hasPrefix(row.text, w)) score += 1;
      else { ok = false; break; }
    }
    if (ok) scored.push({ row, score });
  }
  scored.sort((a, b) => b.score - a.score || a.row.order - b.row.order);
  return scored.map((s) => s.row.entry);
}

/** Remove tags repetidas (ignora caixa e acentos), mantendo a primeira forma e a ordem. */
export function dedupeTags(tags) {
  const seen = new Set();
  const out = [];
  for (const t of tags || []) {
    const k = normalize(t).trim();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(t);
  }
  return out;
}

/** Tags únicas (sem diferenciar caixa), em ordem alfabética, com a quantidade de cards. */
export function collectTags(entries) {
  const groups = new Map();
  for (const e of entries) {
    for (const tag of dedupeTags(e.tags)) {
      const key = normalize(tag);
      const g = groups.get(key) ?? { tag, count: 0 };
      g.count += 1;
      groups.set(key, g);
    }
  }
  return [...groups.values()].sort((a, b) => a.tag.localeCompare(b.tag));
}

/** Dois títulos são "o mesmo" ignorando caixa, acentos e pontuação (para não repetir o título da peça). Vazio nunca casa. */
export function sameTitle(a, b) {
  const clean = (v) => normalize(v).replace(/[^a-z0-9]+/g, ' ').trim();
  const x = clean(a);
  return x !== '' && x === clean(b);
}
