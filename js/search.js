/** Normaliza para comparação: minúsculas e sem acentos. */
export function normalize(s) {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/**
 * Um registro por card: { tier, card, title, summary, tags, text }.
 * `text` é o corpo concatenado das peças (pode ser '' até ser carregado).
 */
export function buildIndex(entries) {
  return entries.map((entry, order) => ({
    entry,
    order,
    title: normalize(entry.title),
    tags: (entry.tags || []).map(normalize),
    summary: normalize(entry.summary),
    text: normalize(entry.text),
  }));
}

/**
 * Busca por palavras (todas devem aparecer). Consulta vazia devolve todos na
 * ordem original. Com consulta, ordena por relevância: título > tags/resumo > corpo.
 * opts: { tier?: string, tags?: string[] } (tags combinam com AND).
 */
export function search(index, query, opts = {}) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  const wantTags = (opts.tags || []).map(normalize);
  const scored = [];
  for (const row of index) {
    if (opts.tier && row.entry.tier !== opts.tier) continue;
    if (!wantTags.every((t) => row.tags.includes(t))) continue;
    let score = 0;
    let ok = true;
    for (const w of words) {
      if (row.title.includes(w)) score += 10;
      else if (row.tags.some((t) => t.includes(w)) || row.summary.includes(w)) score += 4;
      else if (row.text.includes(w)) score += 1;
      else { ok = false; break; }
    }
    if (ok) scored.push({ row, score });
  }
  scored.sort((a, b) => b.score - a.score || a.row.order - b.row.order);
  return scored.map((s) => s.row.entry);
}

/** Tags únicas, em ordem alfabética, com a quantidade de cards. */
export function collectTags(entries) {
  const counts = new Map();
  for (const e of entries) for (const t of new Set(e.tags || [])) counts.set(t, (counts.get(t) || 0) + 1);
  return [...counts].sort((a, b) => a[0].localeCompare(b[0])).map(([tag, count]) => ({ tag, count }));
}
