import { JSDOM } from 'jsdom';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs'; import path from 'node:path';
const ROOT = process.env.APP_ROOT || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').replace(/<script[\s\S]*?<\/script>/g, '');
const dom = new JSDOM(html, { url: 'http://localhost:8000/', pretendToBeVisual: true });
const w = dom.window; w.scrollTo = () => {};
const errors = [];
for (const k of ['error', 'warn']) { const o = console[k]; console[k] = (...a) => { errors.push(a.join(' ')); o(...a); }; }
Object.assign(globalThis, { document: w.document, window: w, location: w.location, HTMLElement: w.HTMLElement, Node: w.Node, localStorage: w.localStorage,
  matchMedia: () => ({ matches: false, addEventListener() {} }),
  fetch: async (url) => { const f = path.join(ROOT, decodeURIComponent(String(url))); if (!fs.existsSync(f)) return { ok: false, status: 404, text: async () => '', json: async () => ({}) };
    const b = fs.readFileSync(f, 'utf8'); return { ok: true, status: 200, text: async () => b, json: async () => JSON.parse(b) }; } });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const $ = (s) => w.document.querySelector(s), $$ = (s) => [...w.document.querySelectorAll(s)];
let failed = 0; const check = (n, c, x = '') => { console.log(`${c ? 'OK  ' : 'FAIL'} ${n} ${c ? '' : x}`); if (!c) failed++; };
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/manifest.json'), 'utf8'));
const cards = manifest.tiers.flatMap((t) => t.cards.map((c) => ({ t, c })));
await import(path.join(ROOT, 'js/app.js')); await sleep(300);

check(`home: ${cards.length} cards`, $$('.card').length === cards.length, String($$('.card').length));
check('home: 3 faixas, todas com cards', $$('.tier').length === 3 && $$('.tier').every((t) => t.querySelector('.card')));
check('home: stats mostram agentes e workflows', $('.stats').textContent.includes('agentes') && $('.stats').textContent.includes('workflows'), $('.stats').textContent);

let pieces = 0;
for (const { t, c } of cards) for (const p of c.pieces) {
  pieces++;
  w.location.hash = `#/${t.id}/${c.id}/${p.type}`; await sleep(450);
  const ok = $('article.md') && $('article.md').textContent.trim().length > 40 && !$('.callout.is-error');
  check(`peça ${t.id}/${c.id}/${p.type}`, !!ok, $('#piece-panel')?.textContent.slice(0, 120));
  check(`  título e aba corretos`, $('.card-hero h1')?.textContent === c.title && $('.tabs a[aria-current="page"]'));
  check(`  front matter fora do texto`, !$('article.md').textContent.includes('name: '));
  const blocks = $$('pre code[class*="language-"]');
  if (blocks.length) check(`  ${blocks.length} bloco(s) de código destacados`, blocks.every((b) => b.classList.contains('hljs') || b.querySelector('[class^="hljs-"]') || /language-(text|plaintext)/.test(b.className)), blocks.map((b) => b.className).join(','));
  check(`  botões copiar (${$$('.code-wrap').length} blocos)`, $$('.code-wrap .code-copy').length === $$('.code-wrap').length);
}
check(`${pieces} peças abertas`, pieces === 8, String(pieces));

// busca no corpo das pecas
w.location.hash = '#/'; await sleep(300);
const q = $('#q');
const type = async (v) => { q.value = v; q.dispatchEvent(new w.Event('input', { bubbles: true })); await sleep(300); return $$('.card').map((c) => c.querySelector('h3').textContent); };
check('busca "marcos" acha o card complexo', (await type('marcos')).includes('Planejar em marcos'));
check('busca "somente leitura" acha investigação', (await type('somente leitura')).includes('Investigação rápida'));
check('busca "investigacao" (sem acento) acha investigação', (await type('investigacao')).includes('Investigação rápida'));
check('busca sem resultado', (await type('zzzzqq')).length === 0 && !!$('.empty'));
q.value = ''; q.dispatchEvent(new w.Event('input', { bubbles: true })); await sleep(200);

// pager e aside entre cards do mesmo nivel (1 card por nivel -> sem aside); basicas tem 2
w.location.hash = '#/basicas/exemplo'; await sleep(400);
check('basicas: aside com 2 cards', $$('.card-aside li').length === 2);
check('basicas: exemplo tem proximo', !!$('.pager-link.is-next'));
w.location.hash = '#/complexas/planejar-em-marcos/agente'; await sleep(400);
check('complexas: 1 card -> sem aside', !$('.card-aside'));

// hierarquia de titulos em cada tipo de pagina
const levels = () => $$('h1,h2,h3,h4,h5,h6').map((e) => +e.tagName[1]);
const noJump = (l) => l.every((v, i) => i === 0 ? v === 1 : v <= Math.max(...l.slice(0, i)) + 1);
w.location.hash = '#/complexas/planejar-em-marcos/skill'; await sleep(500);
check('peca: um unico h1 e sem saltos de nivel', levels().filter((v) => v === 1).length === 1 && noJump(levels()), levels().join(','));
check('peca: nenhum h1/h2 dentro do markdown', $$('article.md h1, article.md h2').length === 0);
check('peca: tabela dentro de contêiner focavel', $$('.table-wrap[tabindex="0"] table').length >= 1);
check('peca: blocos de codigo focaveis e com nome', $$('pre').every((p) => p.getAttribute('tabindex') === '0' && p.getAttribute('aria-label')));
w.location.hash = '#/basicas'; await sleep(300);
check('nivel: h1 e cards em h2', levels().join(',').startsWith('1,2,2') || levels()[0] === 1 && noJump(levels()), levels().join(','));
check('nivel: card com nome acessivel curto', $('.card').getAttribute('aria-labelledby') && w.document.getElementById($('.card').getAttribute('aria-labelledby')).textContent.length > 0);
w.location.hash = '#/'; await sleep(300);
check('home: h1 > h2 > h3 sem saltos', noJump(levels()), levels().join(','));
check('home: bolinhas do menu sao decorativas', $$('#tier-nav .level').every((l) => l.getAttribute('aria-hidden') === 'true'));
check('home: tag chips com nome acessivel', $$('.tag-btn').every((b) => /^#.+, \d+ cards?$/.test(b.getAttribute('aria-label'))), $$('.tag-btn').map((b)=>b.getAttribute('aria-label')).join('|'));

const bad = errors.filter((e) => !/Not implemented|navigation/i.test(e));
check('sem erros no console', bad.length === 0, JSON.stringify(bad));
console.log(failed ? `\n${failed} FALHA(S)` : '\nTudo OK'); process.exit(failed ? 1 : 0);
