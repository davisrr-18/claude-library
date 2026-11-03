import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom');
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const P = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const dom = new JSDOM('<!doctype html><body></body>', { url: 'http://localhost:8000/' });
Object.assign(globalThis, { document: dom.window.document, window: dom.window, HTMLElement: dom.window.HTMLElement, Node: dom.window.Node, matchMedia: () => ({ matches: false, addEventListener() {} }) });
const { renderMarkdown, isSafeUrl } = await import(P + '/js/markdown.js');
const { safeFragment } = await import(P + '/js/dom.js');
const { isTagAllowed, isAttrAllowed } = await import(P + '/js/sanitize.js');
const { parseFrontMatter, validateManifest } = await import(P + '/js/content.js');
const { parseRoute, resolveView } = await import(P + '/js/router.js');
const { buildIndex, search, collectTags, dedupeTags, normalize, sameTitle } = await import(P + '/js/search.js');
const { typeCounts, nextTabIndex, resolveTypeTab } = await import(P + '/js/tabs.js');
const { findSensitive } = await import(P + '/scripts/check-content.mjs');

let seed = 12345;
const rnd = () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pick = (a) => a[Math.floor(rnd() * a.length)];
const problems = [];
const fail = (area, msg, sample) => { if (problems.length < 40) problems.push(`[${area}] ${msg} :: ${JSON.stringify(sample)?.slice(0, 140)}`); };

// ---------- 1. Markdown -> HTML -> politica de DOM: nenhum vetor de XSS sobrevive ----------
const frag = ['<script>alert(1)</script>', '<img src=x onerror=alert(1)>', '[a](javascript:alert(1))', '[a](JaVa\tScRiPt:alert(1))', '![x](data:text/html,<script>alert(1)</script>)', '<svg onload=alert(1)>', '<iframe srcdoc="<script>alert(1)</script>">', '&#106;avascript:alert(1)', '[x](&#x6a;avascript:alert(1))', '<a href="javascript:alert(1)">x</a>', '<details open ontoggle=alert(1)>', '<math><mi xlink:href="javascript:alert(1)">', '<style>*{x:expression(alert(1))}</style>', '<form action=javascript:alert(1)><button>', '<input autofocus onfocus=alert(1)>', '<base href="javascript:alert(1)//">', '<meta http-equiv=refresh content="0;url=javascript:alert(1)">', '[a][1]\n\n[1]: javascript:alert(1)', '<https://evil.com" onmouseover="alert(1)>', '[x](https://a.b "t\\" onmouseover=\\"alert(1)")', '```js" onclick="alert(1)\ncode\n```', '```\n<script>alert(1)</script>\n```', '`<img src=x onerror=alert(1)>`', '| a | b |\n|---|---|\n| <img src=x onerror=alert(1)> | 2 |', '- [x] <b onclick=alert(1)>', '# <img src=x onerror=alert(1)>', '> <svg/onload=alert(1)>', '\\<script>', '<!--', '-->', '<![CDATA[', '<?php echo 1 ?>', '[a](//evil.com)', '[a](/\\evil.com)', '[a](\\\\evil.com)', '[a](vbscript:x)', '[a](file:///etc/passwd)', '[a](mailto:x@y.z)', '<xmp><script>', '<noscript><p title="</noscript><img src=x onerror=alert(1)>">', '<template><script>alert(1)</script></template>', '\u0000<script>', 'text', '\n', '\n\n', '# ', '## ', '- ', '1. ', '* * *', '**', '_', '~~x~~', '[', ']', '(', ')', '|', '>', '`', '```', '<', '>', '&', '"', "'"];
let xssBad = 0;
const ALLOWED = (el) => isTagAllowed(el.tagName, Object.fromEntries([...el.attributes].map((a) => [a.name, a.value])));
for (let i = 0; i < 4000; i++) {
  const n = 1 + Math.floor(rnd() * 6);
  let md = ''; for (let k = 0; k < n; k++) md += pick(frag) + (rnd() < 0.5 ? '\n' : ' ');
  let html;
  try { html = renderMarkdown(md); } catch (e) { fail('markdown', 'renderMarkdown lançou: ' + e.message, md); continue; }
  let f;
  try { f = safeFragment(html); } catch (e) { fail('safeFragment', 'lançou: ' + e.message, md); continue; }
  const walk = (node) => { for (const el of node.children) {
    if (!ALLOWED(el)) { fail('xss', `elemento fora da lista sobreviveu: ${el.tagName}`, md); xssBad++; }
    for (const a of el.attributes) {
      if (/^on/i.test(a.name)) { fail('xss', `atributo ${a.name} sobreviveu`, md); xssBad++; }
      if (!isAttrAllowed(el.tagName, a.name, a.value)) { fail('xss', `atributo fora da lista: ${el.tagName}[${a.name}]`, md); xssBad++; }
      if (/^\s*(javascript|vbscript|data|file):/i.test(a.value.replace(/[\u0000-\u0020]/g, ''))) { fail('xss', `valor perigoso em ${a.name}`, md); xssBad++; }
    }
    walk(el);
  } };
  walk(f);
}
console.log(`1. XSS: 4000 documentos, ${xssBad} vetores sobreviventes`);

// ---------- 2. parseFrontMatter ----------
const fmFrag = ['---', '---\n', 'name: x', 'description: >', '  continua', 'k: "a: b"', '\n', '\r\n', '# titulo', '- item', 'a:', ':b', 'x y: z', '\uFEFF', '\t', 'chave: valor com --- dentro', 'texto solto'];
for (let i = 0; i < 4000; i++) {
  let t = ''; const n = Math.floor(rnd() * 8); for (let k = 0; k < n; k++) t += pick(fmFrag) + pick(['\n', '\r\n', '', ' ']);
  try {
    const r = parseFrontMatter(t);
    if (typeof r.body !== 'string' || typeof r.meta !== 'object' || r.meta === null) fail('frontmatter', 'formato de retorno inválido', t);
    if (r.body.length > t.length + 1) fail('frontmatter', 'body maior que a entrada', t);
    if (!Object.keys(r.meta).length && r.body !== t.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n') && !/^---\n(?:[\s\S]*?\n)?---/.test(t.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n'))) fail('frontmatter', 'sem front matter mas o corpo foi alterado', t);
    for (const k of Object.keys(r.meta)) if (/[\n\r]/.test(k)) fail('frontmatter', 'chave com quebra de linha', t);
  } catch (e) { fail('frontmatter', 'lançou: ' + e.message, t); }
}
console.log('2. parseFrontMatter: 4000 entradas');

// ---------- 3. validateManifest e o que o app faz com um manifest "valido" ----------
const goodManifest = () => ({ tiers: [
  { id: 'basicas', title: 'B', description: 'd', cards: [{ id: 'a', title: 'A', summary: 's', icon: 'bot', tags: ['t'], pieces: [{ type: 'skill', title: 'S', file: 'basicas/a/skill.md' }] }] },
  { id: 'intermediarias', title: 'I', cards: [] }, { id: 'complexas', title: 'C', cards: [] } ] });
const weird = [null, undefined, 0, -1, 1e308, NaN, '', ' ', 'x', '😀', '\u0000', '../x', '/x', 'a b', [], [null], [{}], {}, { x: 1 }, true, false, 'skill', 'basicas', '__proto__', 'constructor', 'toString'];
function mutate(m) { const paths = []; (function walk(o, p) { if (o && typeof o === 'object') for (const k of Object.keys(o)) { paths.push([...p, k]); walk(o[k], [...p, k]); } })(m, []);
  if (!paths.length) return m;
  const p = pick(paths); let o = m; for (const k of p.slice(0, -1)) o = o[k]; const last = p[p.length - 1];
  if (rnd() < 0.25) { if (Array.isArray(o)) o.splice(+last, 1); else delete o[last]; } else o[last] = pick(weird); return m; }
let okCount = 0;
for (let i = 0; i < 6000; i++) {
  let m = goodManifest(); const nm = 1 + Math.floor(rnd() * 3); for (let k = 0; k < nm; k++) m = mutate(m);
  let v;
  try { v = validateManifest(m); } catch (e) { fail('manifest', 'validateManifest lançou: ' + e.message, m); continue; }
  if (!v.ok) continue;
  okCount++;
  try {
    // o que app.js faz com um manifest valido
    const entries = m.tiers.flatMap((t) => t.cards.map((c) => ({ tier: t.id, card: c.id, title: c.title, summary: c.summary || '', tags: c.tags || [], text: '', tierObj: t, cardObj: c })));
    const idx = buildIndex(entries); search(idx, 'a'); search(idx, '', { tier: 'basicas', tags: ['t'] }); collectTags(entries); typeCounts(entries);
    for (const h of ['#/', '#/basicas', '#/basicas/a', '#/basicas/a/skill', '#/x', '#/basicas/a/agente']) resolveView(parseRoute(h), m);
    for (const e of entries) { dedupeTags(e.cardObj.tags); String(e.cardObj.title).length; }
  } catch (e) { fail('manifest', 'manifest VÁLIDO quebra o app: ' + e.message, m); }
}
console.log(`3. validateManifest: 6000 mutações, ${okCount} aceitas como válidas (e testadas contra o app)`);

// ---------- 4. rotas e busca com texto hostil ----------
const hostile = ['', ' ', '%', '%00', '%2F', '%E0%A4%A', '#', '#/', '#//', '#/basicas/', '#/%62asicas', '😀', '\u0000', '../..', '#/basicas/' + 'a/'.repeat(500), '#/' + 'x'.repeat(100000), '%'.repeat(1000), '#/basicas/a/skill/extra', '#/__proto__', '#/constructor/toString'];
for (const h of hostile) { try { const r = parseRoute(h); resolveView(r, goodManifest()); } catch (e) { fail('router', 'lançou: ' + e.message, h.slice(0, 40)); } }
const entries = [{ tier: 'basicas', card: 'a', title: 'Ação Ñandú Straße Ølen', summary: 'resumo', tags: ['Git', 'git'], text: 'texto ' .repeat(1000) }];
const idx = buildIndex(entries);
for (let i = 0; i < 4000; i++) { let q = ''; const n = Math.floor(rnd() * 12); for (let k = 0; k < n; k++) q += pick(['a', 'ç', 'ß', 'ø', '(', '[', '*', '\\', ' ', '😀', '\u0301', 'é', '\u0000', '-', '.', 'git', 'acao']);
  try { const r = search(idx, q, { tags: rnd() < 0.3 ? ['git'] : [], tier: rnd() < 0.2 ? 'basicas' : undefined }); if (!Array.isArray(r)) fail('search', 'não devolveu array', q); } catch (e) { fail('search', 'lançou: ' + e.message, q); } }
for (const k of ['ArrowRight', 'ArrowLeft', 'Home', 'End', 'x', '', undefined, null]) for (const [cur, len] of [[0, 0], [0, 1], [5, 3], [-1, 3], [2, 4], [NaN, 3]]) { try { const r = nextTabIndex(k, cur, len); if (r !== null && !(r >= 0 && r < len)) fail('tabs', `índice fora da faixa: ${r}`, [k, cur, len]); } catch (e) { fail('tabs', 'lançou: ' + e.message, [k, cur, len]); } }
console.log('4. rotas, busca e abas: entradas hostis');

// ---------- 5. ReDoS no verificador de conteudo ----------
const big = 100000; const adv = { 'a@': 'a@'.repeat(big / 2), 'a.': 'a.'.repeat(big / 2), '@@': '@'.repeat(big), '/home/': '/home/' + 'a'.repeat(big), 'eyJ': 'eyJ' + 'a.'.repeat(big / 2), 'sk-': 'sk-' + 'a'.repeat(big), 'ghp_': 'ghp_' + 'a'.repeat(big), 'AKIA': 'AKIA' + 'A'.repeat(big), 'http://': 'http://' + 'a:'.repeat(big / 2), 'BEGIN': '-----BEGIN ' + 'A '.repeat(big / 2), 'xoxb': 'xoxb-' + '1'.repeat(big), 'C:\\Users': 'C:\\Users\\' + 'a'.repeat(big), 'cpf': '123.456.789-'.repeat(big / 12), 'mix': 'a@b.' + 'c'.repeat(big), 'dots': 'a@' + 'b.'.repeat(big / 2), 'x-': 'x-'.repeat(big / 2) };
let worst = ['', 0];
for (const [name, text] of Object.entries(adv)) { const t0 = performance.now(); try { findSensitive(text); } catch (e) { fail('redos', 'lançou: ' + e.message, name); } const dt = performance.now() - t0; if (dt > worst[1]) worst = [name, dt]; if (dt > 1500) fail('redos', `lento: ${dt.toFixed(0)} ms em 100k caracteres`, name); }
console.log(`5. verificador: 100k caracteres adversariais, pior caso ${worst[0]} = ${worst[1].toFixed(0)} ms`);
// markdown tambem
for (const [name, text] of Object.entries({ '[': '['.repeat(20000), '*': '*'.repeat(20000), '`': '`'.repeat(20000), '- ': '- '.repeat(5000), '<': '<'.repeat(20000), '![': '![](x)'.repeat(3000), '(': '[a]('.repeat(100), '|': ('|a|b|\n').repeat(2000), '#': '#'.repeat(5000), '_': '_a'.repeat(10000) })) { const t0 = performance.now(); try { renderMarkdown(text); } catch (e) { fail('markdown', 'lançou: ' + e.message, name); } const dt = performance.now() - t0; if (dt > 1500) fail('markdown-redos', `lento: ${dt.toFixed(0)} ms`, name); }
console.log('   markdown: entradas patológicas processadas');

console.log(problems.length ? `\nPROBLEMAS (${problems.length}):\n` + problems.join('\n') : '\nFuzz: nenhum problema encontrado');
process.exit(problems.length ? 1 : 0);
