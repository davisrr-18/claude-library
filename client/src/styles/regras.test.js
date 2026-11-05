// @vitest-environment node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vitest';

// Regras de CSS do projeto (CLAUDE.md) travadas por teste: movimento, hover, tokens e layout que já deu problema.
const SRC = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function listCss(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return listCss(p);
    return p.endsWith('.css') ? [p] : [];
  });
}

/** Regras do CSS como { prelude, ctx: [at-rules que a contêm], body }. */
function parse(css) {
  const out = [];
  const stack = [];
  let buf = '';
  for (const ch of css.replace(/\/\*[\s\S]*?\*\//g, '')) {
    if (ch === '{') {
      stack.push(buf.trim());
      buf = '';
    } else if (ch === '}') {
      const prelude = stack.pop();
      if (buf.trim()) out.push({ prelude, ctx: [...stack], body: buf.trim() });
      buf = '';
    } else buf += ch;
  }
  return out;
}

const files = listCss(SRC).map((p) => ({
  name: relative(SRC, p).replaceAll('\\', '/'), // Windows usa \ no caminho
  css: readFileSync(p, 'utf8'),
  rules: parse(readFileSync(p, 'utf8')),
}));
const file = (name) => files.find((f) => f.name === name);

/** Declarações de TODAS as regras cujo seletor é exatamente `selector` (mescla). */
const decl = (name, selector) =>
  file(name)
    .rules.filter((r) => r.prelude === selector)
    .map((r) => r.body)
    .join(' ');

test('o teste está lendo o CSS do projeto', () => {
  expect(files.length).toBeGreaterThan(15);
  expect(file('styles/global.css')).toBeTruthy();
});

test('sem !important em nenhum CSS', () => {
  const ruins = files
    .filter((f) => /!important/.test(f.css.replace(/\/\*[\s\S]*?\*\//g, '')))
    .map((f) => f.name);
  expect(ruins).toEqual([]);
});

test('cores só por tokens: nenhum valor de cor solto fora de tokens.css', () => {
  const ruins = [];
  for (const f of files.filter((x) => x.name !== 'styles/tokens.css')) {
    const text = f.css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/#000\b/g, ''); // #000 só como máscara de gradiente
    for (const m of text.matchAll(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/g))
      ruins.push(`${f.name}: ${m[0]}`);
  }
  expect(ruins).toEqual([]);
});

test('todo movimento (animation, transition) fica em prefers-reduced-motion: no-preference', () => {
  const ruins = [];
  for (const f of files) {
    for (const r of f.rules) {
      const m = r.body.match(/(?:^|[;\s])(animation(?:-name|-delay)?|transition(?:-delay)?)\s*:\s*([^;]*)/g);
      if (!m || r.ctx.some((c) => c.includes('prefers-reduced-motion: no-preference'))) continue;
      if (r.ctx.some((c) => c.startsWith('@keyframes'))) continue;
      ruins.push(`${f.name}: ${r.prelude}`);
    }
  }
  expect(ruins).toEqual([]);
});

test('só o esqueleto de carregamento (shimmer) tem animação infinita', () => {
  const infinite = files.flatMap((f) =>
    [...f.css.matchAll(/animation:\s*([^;}]*\binfinite\b[^;}]*)/g)].map((m) => m[1].trim()),
  );
  expect(infinite.filter((a) => !a.startsWith('shimmer'))).toEqual([]);
  expect(infinite.length).toBeGreaterThan(0);
});

test('keyframes decorativos terminam onde começam (sem "pulo" ao acabar)', () => {
  const global = file('styles/global.css').css;
  for (const name of ['breathe', 'drift']) {
    const m = global.match(new RegExp(`@keyframes ${name}\\s*\\{([\\s\\S]*?\\n {4}\\})\\s*\\n`));
    expect(m, `@keyframes ${name}`).toBeTruthy();
    expect(m[1]).toMatch(/0%,\s*100%\s*\{/);
  }
});

test('elemento já revelado ao rolar não reanima quando .reveal sai', () => {
  const rule = file('styles/global.css').rules.find(
    (r) => r.prelude.replace(/\s+/g, ' ') === '.reveal.reveal, .revealed.revealed', // CRLF no Windows
  );
  expect(rule?.body).toMatch(/animation:\s*none/);
});

test(':hover só dentro de @media (hover: hover)', () => {
  const ruins = [];
  for (const f of files) {
    for (const r of f.rules) {
      if (r.prelude.includes(':hover') && !r.ctx.some((c) => c.includes('hover: hover')))
        ruins.push(`${f.name}: ${r.prelude}`);
    }
  }
  expect(ruins).toEqual([]);
});

test('nada com position: absolute em cima de texto ou de área rolável (botão Copiar tem linha própria)', () => {
  expect(decl('components/CodeBlock/CodeBlock.module.css', '.copy')).not.toMatch(/position:\s*absolute/);
  expect(decl('components/CodeBlock/CodeBlock.module.css', '.wrap')).toMatch(/flex-direction:\s*column/);
  expect(decl('components/CodeBlock/CodeBlock.module.css', '.copy')).toMatch(/align-self:\s*flex-end/);
});

// Regressão: o corpo do "Instalar pelo terminal" é um grid; com coluna automática ela cresce até a linha mais longa
// do comando e a caixa estoura para fora do bloco.
test('instalar pelo terminal: coluna que encolhe, bloco rola por dentro e sem quebra forçada', () => {
  const m = 'components/InstallPanel/InstallPanel.module.css';
  expect(decl(m, '.body')).toMatch(/grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  expect(decl(m, '.body > *')).toMatch(/min-width:\s*0/);
  expect(decl(m, '.install')).toMatch(/min-width:\s*0/);
  expect(decl(m, '.install')).toMatch(/max-width:\s*100%/);
  expect(decl(m, '.pre')).toMatch(/overflow:\s*auto/);
  expect(decl(m, '.pre')).toMatch(/max-height:/);
  expect(decl(m, '.pre')).not.toMatch(/white-space:\s*pre-wrap/);
});

test('grids que recebem texto de largura imprevisível têm coluna que encolhe', () => {
  expect(decl('pages/Card/Card.module.css', '.layout')).toMatch(
    /grid-template-columns:\s*minmax\(0,\s*1fr\)/,
  );
  expect(decl('pages/Card/Card.module.css', '.main')).toMatch(/min-width:\s*0/);
  expect(decl('components/TierSection/TierSection.module.css', '.body')).toMatch(/min-width:\s*0/);
  expect(decl('components/Filters/Filters.module.css', '.filters')).toMatch(
    /grid-template-columns:\s*minmax\(0,\s*1fr\)/,
  );
  expect(decl('components/CardAside/CardAside.module.css', '.aside ul')).toMatch(
    /grid-template-columns:\s*minmax\(0,\s*1fr\)/,
  );
  expect(decl('components/CardAside/CardAside.module.css', '.aside a span')).toMatch(
    /overflow-wrap:\s*anywhere/,
  );
});

test('espaço, tipografia e raio só por tokens: nenhum px ou rem solto em padding, margin, gap, font-size, font e border-radius', () => {
  const ruins = [];
  for (const f of files.filter((x) => x.name !== 'styles/tokens.css')) {
    for (const r of f.rules) {
      if (r.prelude.includes('.sr-only')) continue; // utilitário de acessibilidade: margin: -1px é parte da técnica
      for (const d of r.body.matchAll(
        /(?:^|;)\s*((?:padding|margin)(?:-[a-z]+)?|(?:row-|column-)?gap|font-size|font|border-radius)\s*:\s*([^;]+)/g,
      )) {
        if (/(?<![\w.-])\d+(?:\.\d+)?(?:px|rem)\b/.test(d[2]))
          ruins.push(`${f.name}: ${r.prelude} { ${d[1]}: ${d[2].trim()} }`);
      }
    }
  }
  expect(ruins).toEqual([]);
});

test('body é posicionado: contém o .sr-only absoluto, que senão escapa das faixas roláveis e alarga a página no celular', () => {
  expect(decl('styles/global.css', 'body')).toMatch(/position:\s*relative/);
});
