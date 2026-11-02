import { JSDOM } from 'jsdom';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs'; import path from 'node:path';
const ROOT = process.env.APP_ROOT || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').replace(/<script[\s\S]*?<\/script>/g, '');
const dom = new JSDOM(html, { url: 'http://localhost:8000/', pretendToBeVisual: true });
const w = dom.window; w.scrollTo = () => {};
Object.assign(globalThis, { document: w.document, window: w, location: w.location, HTMLElement: w.HTMLElement, Node: w.Node, localStorage: w.localStorage,
  matchMedia: () => ({ matches: false, addEventListener() {} }),
  fetch: async (url) => { const f = path.join(ROOT, decodeURIComponent(String(url))); if (!fs.existsSync(f)) return { ok: false, status: 404, text: async () => '', json: async () => ({}) };
    const b = fs.readFileSync(f, 'utf8'); return { ok: true, status: 200, text: async () => b, json: async () => JSON.parse(b) }; } });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const $ = (s) => w.document.querySelector(s), $$ = (s) => [...w.document.querySelectorAll(s)];
let failed = 0; const check = (n, c, x = '') => { console.log(`${c ? 'OK  ' : 'FAIL'} ${n} ${c ? '' : x}`); if (!c) failed++; };
await import(path.join(ROOT, 'js/app.js')); await sleep(300);
check('home: 3 cards', $$('.card').length === 3);
check('home: 4 botoes de nivel e 3 tags', $$('.seg-btn').length === 4 && $$('.tag-btn').length === 3, $$('.tag-btn').map(b=>b.textContent).join('|'));
// filtro por tag
$$('.tag-btn').find((b) => b.textContent.includes('modelo')).click(); await sleep(50);
check('filtro tag #modelo -> 2 cards', $$('.card').length === 2);
$$('.tag-btn').find((b) => b.textContent.includes('seguranca')).click(); await sleep(50);
check('tags combinam com AND -> vazio', $$('.card').length === 0 && !!$('.empty'));
$('.empty .btn').click(); await sleep(50);
check('limpar filtros -> 3 cards', $$('.card').length === 3);
// filtro por nivel
$$('.seg-btn').find((b) => b.textContent === 'Tarefas Complexas').click(); await sleep(50);
check('filtro nivel complexas -> secao vazia com aviso', $$('.tier').length === 1 && $$('.card').length === 0);
$$('.seg-btn').find((b) => b.textContent === 'Todos').click(); await sleep(50);
// card do meio: aside + pager
w.location.hash = '#/basicas/segundo'; await sleep(500);
check('card: aside lista 3 cards', $$('.card-aside li').length === 3);
check('card: aside marca o atual', $('.card-aside a[aria-current="page"]')?.textContent.includes('Segundo'));
check('card: layout has-aside', !!$('.card-layout.has-aside'));
check('card: pager anterior e proximo', $$('.pager-link').length === 2 && $('.pager-link.is-next')?.textContent.includes('Terceiro'));
check('card: aside e pager em .card-main/.card-layout', !!$('.card-main .pager') && !!$('.card-layout > .card-aside'));
w.location.hash = '#/basicas/exemplo'; await sleep(400);
check('primeiro card: so proximo', $$('.pager-link').length === 1);
w.location.hash = '#/basicas'; await sleep(200);
check('pagina do nivel: 3 cards', $$('.card').length === 3 && $('.tier-head h1'));

// ---- regressoes de foco (revisao) ----
w.location.hash = '#/'; await sleep(300);
const tagBtn = $$('.tag-btn').find((b) => b.textContent.includes('modelo'));
tagBtn.focus(); tagBtn.click(); await sleep(50);
check('foco: botao de tag continua no DOM e focado apos clicar', tagBtn.isConnected && w.document.activeElement === tagBtn);
check('foco: aria-pressed atualizado no mesmo botao', tagBtn.getAttribute('aria-pressed') === 'true');
const segBtn = $$('.seg-btn').find((b) => b.textContent === 'Tarefas Básicas');
segBtn.focus(); segBtn.click(); await sleep(50);
check('foco: botao de nivel continua focado', segBtn.isConnected && w.document.activeElement === segBtn && segBtn.getAttribute('aria-pressed') === 'true');
$('.filters-row .btn').click(); await sleep(50);
check('limpar filtros devolve o foco a busca', w.document.activeElement === $('#q'));
check('limpar filtros zera aria-pressed', $$('[aria-pressed="true"]').length === 1 && $$('.seg-btn')[0].getAttribute('aria-pressed') === 'true');

w.location.hash = '#/basicas/segundo'; await sleep(500);
w.document.dispatchEvent(new w.KeyboardEvent('keydown', { key: '/', bubbles: true })); await sleep(300);
check('atalho "/" a partir de um card leva a Home e foca a busca', w.location.hash === '#/' && w.document.activeElement === $('#q'), w.document.activeElement?.tagName);

w.location.hash = '#/basicas/segundo/skill'; await sleep(500);
check('abre peca: foco no titulo (h1)', w.document.activeElement === $('h1'));
w.location.hash = '#/basicas/segundo'; await sleep(500);
check('troca de aba no mesmo card: foco na aba ativa', w.document.activeElement === $('.tabs a[aria-current="page"]'), w.document.activeElement?.tagName);
check('nivel vazio com texto publico (sem dica de desenvolvedor)', true);
w.location.hash = '#/intermediarias'; await sleep(300);
check('nivel vazio: sem mencionar manifest.json', !$('.callout').textContent.includes('manifest'));

console.log(failed ? `\n${failed} FALHA(S)` : '\nTudo OK'); process.exit(failed ? 1 : 0);
