import { expect, test } from 'vitest';
import { safeFragment } from './dom/markdownDom.js';
import { mulberry32 } from './test/bigContent.js';
import { buildEntries } from './utils/entries.js';
import { parseFrontMatter, validateManifest } from './utils/content.js';
import { isAttrAllowed, isTagAllowed } from './utils/sanitize.js';
import { renderMarkdown } from './utils/markdown.js';
import { parseRoute, resolveView } from './utils/router.js';
import { buildIndex, collectTags, dedupeTags, search } from './utils/search.js';
import { nextTabIndex, typeCounts } from './utils/tabs.js';

// Fuzz com semente fixa (determinístico): entradas aleatórias e hostis não podem lançar erro nem deixar XSS passar.
const rnd = mulberry32(12345);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const SLOW_MS = 1500;

test('Markdown + sanitização: nenhum vetor de XSS sobrevive em 4000 documentos aleatórios', () => {
  const frag = [
    '<script>alert(1)</script>',
    '<img src=x onerror=alert(1)>',
    '[a](javascript:alert(1))',
    '[a](JaVa\tScRiPt:alert(1))',
    '![x](data:text/html,<script>alert(1)</script>)',
    '<svg onload=alert(1)>',
    '<iframe srcdoc="<script>alert(1)</script>">',
    '&#106;avascript:alert(1)',
    '[x](&#x6a;avascript:alert(1))',
    '<a href="javascript:alert(1)">x</a>',
    '<details open ontoggle=alert(1)>',
    '<math><mi xlink:href="javascript:alert(1)">',
    '<style>*{x:expression(alert(1))}</style>',
    '<form action=javascript:alert(1)><button>',
    '<input autofocus onfocus=alert(1)>',
    '<base href="javascript:alert(1)//">',
    '<meta http-equiv=refresh content="0;url=javascript:alert(1)">',
    '[a][1]\n\n[1]: javascript:alert(1)',
    '<https://evil.com" onmouseover="alert(1)>',
    '[x](https://a.b "t\\" onmouseover=\\"alert(1)")',
    '```js" onclick="alert(1)\ncode\n```',
    '```\n<script>alert(1)</script>\n```',
    '`<img src=x onerror=alert(1)>`',
    '| a | b |\n|---|---|\n| <img src=x onerror=alert(1)> | 2 |',
    '- [x] <b onclick=alert(1)>',
    '# <img src=x onerror=alert(1)>',
    '> <svg/onload=alert(1)>',
    '\\<script>',
    '<!--',
    '-->',
    '<![CDATA[',
    '<?php echo 1 ?>',
    '[a](//evil.com)',
    '[a](/\\evil.com)',
    '[a](\\\\evil.com)',
    '[a](vbscript:x)',
    '[a](file:///etc/passwd)',
    '[a](mailto:x@y.z)',
    '<xmp><script>',
    '<noscript><p title="</noscript><img src=x onerror=alert(1)>">',
    '<template><script>alert(1)</script></template>',
    '\u0000<script>',
    'text',
    '\n',
    '\n\n',
    '# ',
    '## ',
    '- ',
    '1. ',
    '* * *',
    '**',
    '_',
    '~~x~~',
    '[',
    ']',
    '(',
    ')',
    '|',
    '>',
    '`',
    '```',
    '<',
    '>',
    '&',
    '"',
    "'",
  ];
  const problems = [];
  const walk = (node, md) => {
    for (const el of node.children) {
      const attrs = Object.fromEntries([...el.attributes].map((a) => [a.name, a.value]));
      if (!isTagAllowed(el.tagName, attrs))
        problems.push(`tag fora da lista: ${el.tagName} :: ${JSON.stringify(md)}`);
      for (const [name, value] of Object.entries(attrs)) {
        if (/^on/i.test(name)) problems.push(`atributo ${name} sobreviveu :: ${JSON.stringify(md)}`);
        if (!isAttrAllowed(el.tagName, name, value))
          problems.push(`atributo fora da lista: ${el.tagName}[${name}] :: ${JSON.stringify(md)}`);
        if (/^\s*(javascript|vbscript|data|file):/i.test(value.replace(/[\u0000- ]/g, '')))
          problems.push(`valor perigoso em ${name} :: ${JSON.stringify(md)}`);
      }
      walk(el, md);
    }
  };
  for (let i = 0; i < 4000; i++) {
    let md = '';
    for (let k = 0, n = 1 + Math.floor(rnd() * 6); k < n; k++) md += pick(frag) + (rnd() < 0.5 ? '\n' : ' ');
    const div = document.createElement('div');
    div.append(safeFragment(renderMarkdown(md)));
    walk(div, md);
    if (problems.length > 20) break;
  }
  expect(problems.slice(0, 20)).toEqual([]);
}, 60000);

test('parseFrontMatter: 4000 entradas aleatórias, formato de retorno sempre válido', () => {
  const fm = [
    '---',
    '---\n',
    'name: x',
    'description: >',
    '  continua',
    'k: "a: b"',
    '\n',
    '\r\n',
    '# titulo',
    '- item',
    'a:',
    ':b',
    'x y: z',
    '﻿',
    '\t',
    'chave: valor com --- dentro',
    'texto solto',
  ];
  const problems = [];
  for (let i = 0; i < 4000; i++) {
    let t = '';
    for (let k = 0, n = Math.floor(rnd() * 8); k < n; k++) t += pick(fm) + pick(['\n', '\r\n', '', ' ']);
    const r = parseFrontMatter(t);
    if (typeof r.body !== 'string' || typeof r.meta !== 'object' || r.meta === null)
      problems.push(`retorno inválido :: ${JSON.stringify(t)}`);
    if (r.body.length > t.length + 1) problems.push(`body maior que a entrada :: ${JSON.stringify(t)}`);
    for (const k of Object.keys(r.meta))
      if (/[\n\r]/.test(k)) problems.push(`chave com quebra de linha :: ${JSON.stringify(t)}`);
  }
  expect(problems.slice(0, 20)).toEqual([]);
});

test('validateManifest: 6000 manifests mutados; os que passam como válidos não quebram a interface', () => {
  const good = () => ({
    tiers: [
      {
        id: 'basicas',
        title: 'B',
        description: 'd',
        cards: [
          {
            id: 'a',
            title: 'A',
            summary: 's',
            icon: 'bot',
            tags: ['t'],
            pieces: [{ type: 'skill', title: 'S', file: 'basicas/a/skill.md' }],
          },
        ],
      },
      { id: 'intermediarias', title: 'I', cards: [] },
      { id: 'complexas', title: 'C', cards: [] },
    ],
  });
  const weird = [
    null,
    undefined,
    0,
    -1,
    1e308,
    NaN,
    '',
    ' ',
    'x',
    '😀',
    '\u0000',
    '../x',
    '/x',
    'a b',
    [],
    [null],
    [{}],
    {},
    { x: 1 },
    true,
    false,
    'skill',
    'basicas',
    '__proto__',
    'constructor',
    'toString',
  ];
  const mutate = (m) => {
    const paths = [];
    (function walk(o, p) {
      if (o && typeof o === 'object')
        for (const k of Object.keys(o)) {
          paths.push([...p, k]);
          walk(o[k], [...p, k]);
        }
    })(m, []);
    if (!paths.length) return m;
    const p = pick(paths);
    let o = m;
    for (const k of p.slice(0, -1)) o = o[k];
    const last = p[p.length - 1];
    if (rnd() < 0.25) {
      if (Array.isArray(o)) o.splice(+last, 1);
      else delete o[last];
    } else o[last] = pick(weird);
    return m;
  };
  const problems = [];
  let aceitos = 0;
  for (let i = 0; i < 6000; i++) {
    let m = good();
    for (let k = 0, n = 1 + Math.floor(rnd() * 3); k < n; k++) m = mutate(m);
    const v = validateManifest(m);
    if (!v.ok) continue;
    aceitos++;
    try {
      const entries = buildEntries(m);
      const idx = buildIndex(entries);
      search(idx, 'a');
      search(idx, '', { tier: 'basicas', tags: ['t'] });
      collectTags(entries);
      typeCounts(entries);
      for (const h of ['#/', '#/basicas', '#/basicas/a', '#/basicas/a/skill', '#/x', '#/basicas/a/agente'])
        resolveView(parseRoute(h), m);
      for (const e of entries) dedupeTags(e.cardObj.tags);
    } catch (e) {
      problems.push(`manifest válido quebra a interface: ${e.message} :: ${JSON.stringify(m).slice(0, 140)}`);
    }
  }
  expect(problems.slice(0, 20)).toEqual([]);
  expect(aceitos).toBeGreaterThan(0);
});

test('rotas, busca e abas com entradas hostis não lançam erro', () => {
  const hostile = [
    '',
    ' ',
    '%',
    '%00',
    '%2F',
    '%E0%A4%A',
    '#',
    '#/',
    '#//',
    '#/basicas/',
    '#/%62asicas',
    '😀',
    '\u0000',
    '../..',
    `#/basicas/${'a/'.repeat(500)}`,
    `#/${'x'.repeat(100000)}`,
    '%'.repeat(1000),
    '#/basicas/a/skill/extra',
    '#/__proto__',
    '#/constructor/toString',
  ];
  const manifest = {
    tiers: [
      { id: 'basicas', title: 'B', cards: [{ id: 'a', title: 'A', pieces: [] }] },
      { id: 'intermediarias', title: 'I', cards: [] },
      { id: 'complexas', title: 'C', cards: [] },
    ],
  };
  for (const h of hostile) expect(() => resolveView(parseRoute(h), manifest), h.slice(0, 40)).not.toThrow();

  const idx = buildIndex([
    {
      tier: 'basicas',
      card: 'a',
      title: 'Ação Ñandú Straße Ølen',
      summary: 'resumo',
      tags: ['Git', 'git'],
      text: 'texto '.repeat(1000),
    },
  ]);
  for (let i = 0; i < 4000; i++) {
    let q = '';
    for (let k = 0, n = Math.floor(rnd() * 12); k < n; k++)
      q += pick([
        'a',
        'ç',
        'ß',
        'ø',
        '(',
        '[',
        '*',
        '\\',
        ' ',
        '😀',
        '́',
        'é',
        '\u0000',
        '-',
        '.',
        'git',
        'acao',
      ]);
    const r = search(idx, q, { tags: rnd() < 0.3 ? ['git'] : [], tier: rnd() < 0.2 ? 'basicas' : undefined });
    expect(Array.isArray(r), q).toBe(true);
  }
  for (const k of ['ArrowRight', 'ArrowLeft', 'Home', 'End', 'x', '', undefined, null]) {
    for (const [cur, len] of [
      [0, 0],
      [0, 1],
      [5, 3],
      [-1, 3],
      [2, 4],
      [NaN, 3],
    ]) {
      const r = nextTabIndex(k, cur, len);
      expect(r === null || (r >= 0 && r < len), `${k} ${cur} ${len} -> ${r}`).toBe(true);
    }
  }
});

test('Markdown patológico não trava (nenhum caso passa de 1,5 s)', () => {
  const casos = {
    '[': '['.repeat(20000),
    '*': '*'.repeat(20000),
    '`': '`'.repeat(20000),
    '- ': '- '.repeat(5000),
    '<': '<'.repeat(20000),
    '![': '![](x)'.repeat(3000),
    '(': '[a]('.repeat(100),
    '|': '|a|b|\n'.repeat(2000),
    '#': '#'.repeat(5000),
    _: '_a'.repeat(10000),
  };
  const lentos = [];
  for (const [nome, texto] of Object.entries(casos)) {
    const t0 = performance.now();
    renderMarkdown(texto);
    const dt = performance.now() - t0;
    if (dt > SLOW_MS) lentos.push(`${nome}: ${dt.toFixed(0)} ms`);
  }
  expect(lentos).toEqual([]);
});
