// Gera um site de teste com 300 cards (100 por nível), cada um com 1 a 4 peças em Markdown, para o teste de estresse.
import fs from 'node:fs';
import path from 'node:path';

const TYPES = ['skill', 'agente', 'workflow', 'prompt', 'claude-md', 'arquitetura'];
const TAGS = ['git', 'testes', 'review', 'seguranca', 'api', 'frontend', 'Git', 'TESTES', 'migração', 'docs'];
const ICONS = ['folder', 'code', 'zap', 'layers', 'git-branch', 'bot', 'file-text', 'message-square', 'shield', 'bug', 'star'];
const WORDS = 'alpha beta gama delta ação coração migração revisão teste código fluxo marcos agente skill prompt arquitetura investigação'.split(' ');

function mulberry32(seed) {
  let a = seed;
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** Escreve content/ em `dir` (manifest.json + os .md). Determinístico (mesma semente, mesmo conteúdo). */
export function makeBigContent(dir, perTier = 100) {
  const rnd = mulberry32(7);
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const sample = (a, n) => [...a].sort(() => rnd() - 0.5).slice(0, n);
  const between = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
  const tiers = ['basicas', 'intermediarias', 'complexas'].map((id) => ({ id, title: `Nível ${id}`, description: `Faixa ${id}`, cards: [] }));
  for (const tier of tiers) {
    for (let i = 0; i < perTier; i++) {
      const cid = `card-${tier.id}-${i}`;
      fs.mkdirSync(path.join(dir, 'content', tier.id, cid), { recursive: true });
      const pieces = sample(TYPES, between(1, 4)).map((type) => {
        const body = Array.from({ length: between(50, 400) }, () => pick(WORDS)).join(' ');
        fs.writeFileSync(path.join(dir, 'content', tier.id, cid, `${type}.md`),
          `---\nname: ${cid}-${type}\ndescription: peça ${type}\n---\n\n# Título ${i}\n\n${body}\n\n\`\`\`bash\necho ${i}\n\`\`\`\n\n| a | b |\n|---|---|\n| 1 | 2 |\n`);
        return { type, title: `${type} ${i}`, file: `${tier.id}/${cid}/${type}.md` };
      });
      tier.cards.push({
        id: cid, title: `Card ${i} de ${tier.id} ${pick(WORDS)}`, icon: pick(ICONS),
        summary: Array.from({ length: between(8, 30) }, () => pick(WORDS)).join(' '),
        tags: sample(TAGS, between(0, 4)), pieces,
      });
    }
  }
  fs.mkdirSync(path.join(dir, 'content'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'content/manifest.json'), JSON.stringify({ tiers }, null, 1));
  return perTier * 3;
}
