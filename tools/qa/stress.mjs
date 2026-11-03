import { JSDOM } from 'jsdom';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs'; import path from 'node:path';
const ROOT = process.env.APP_ROOT || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').replace(/<script[\s\S]*?<\/script>/g, '');
const dom = new JSDOM(html, { url: 'http://localhost:8000/', pretendToBeVisual: true });
const w = dom.window; w.scrollTo = () => {};
const errors = [];
for (const k of ['error', 'warn']) { const o = console[k]; console[k] = (...a) => { errors.push(a.join(' ')); }; }
Object.assign(globalThis, { document: w.document, window: w, location: w.location, HTMLElement: w.HTMLElement, Node: w.Node, localStorage: w.localStorage,
  matchMedia: () => ({ matches: false, addEventListener() {} }),
  fetch: async (url) => { const f = path.join(ROOT, decodeURIComponent(String(url))); if (!fs.existsSync(f)) return { ok: false, status: 404, text: async () => '', json: async () => ({}) };
    const b = fs.readFileSync(f, 'utf8'); return { ok: true, status: 200, text: async () => b, json: async () => JSON.parse(b) }; } });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const $ = (s) => w.document.querySelector(s), $$ = (s) => [...w.document.querySelectorAll(s)];
let failed = 0; const check = (n, c, x = '') => { console.log(`${c ? 'OK  ' : 'FAIL'} ${n} ${c ? '' : x}`); if (!c) failed++; };
const time = async (label, fn) => { const t0 = performance.now(); const r = await fn(); console.log(`     ${label}: ${(performance.now() - t0).toFixed(0)} ms`); return r; };

await time('carga inicial (300 cards)', async () => { await import(path.join(ROOT, 'js/app.js')); await sleep(400); });
check('home: 300 cards renderizados', $$('.card').length === 300, String($$('.card').length));
check('home: 3 faixas com abas', $$('.tier').length === 3 && $$('[role="tab"]').length >= 12);
check('tags: Git/git/GIT/TESTES/testes unificadas', (() => { const t = $$('.tag-btn').map((b) => b.dataset.tag.toLowerCase()); return new Set(t).size === t.length; })(), $$('.tag-btn').map((b) => b.dataset.tag).join(','));
const q = $('#q');
await time('digitar "alpha" (carrega 900+ pecas p/ busca no corpo)', async () => { q.value = 'alpha'; q.dispatchEvent(new w.Event('input', { bubbles: true })); await sleep(1500); });
const nAlpha = $$('.card').length;
check('busca no corpo achou cards', nAlpha > 0 && nAlpha <= 300, String(nAlpha));
await time('digitar mais 6 teclas em sequencia', async () => { for (const v of ['alpha b', 'alpha be', 'alpha bet', 'alpha beta', 'alpha beta g', 'alpha beta ga']) { q.value = v; q.dispatchEvent(new w.Event('input', { bubbles: true })); await sleep(5); } await sleep(300); });
check('busca refinada nao aumenta o resultado', $$('.card').length <= nAlpha);
q.value = ''; q.dispatchEvent(new w.Event('input', { bubbles: true })); await sleep(300);
check('limpar busca volta aos 300', $$('.card').length === 300);
await time('clicar em todas as abas de cada faixa', async () => { for (const t of $$('[role="tab"]')) { t.click(); } await sleep(100); });
await sleep(1500);
check('apos clicar em todas as abas, sem erro e a ultima de cada faixa mostra os arquivos do tipo', $$('.piece-group').length > 0 && !$('.callout.is-error'), String($$('.piece-group').length));
await time('abrir 40 cards/pecas em sequencia', async () => { for (let i = 0; i < 40; i++) { w.location.hash = `#/${['basicas', 'intermediarias', 'complexas'][i % 3]}/card-${['basicas', 'intermediarias', 'complexas'][i % 3]}-${i}`; await sleep(25); } await sleep(500); });
check('ultimo card aberto renderizou', !!$('.card-hero h1') && !$('.callout.is-error'), $('main').textContent.slice(0, 80));
check('aside lista os 100 cards do nivel', $$('.card-aside li').length === 100, String($$('.card-aside li').length));
await time('voltar para a Home', async () => { w.location.hash = '#/'; await sleep(500); });
const sel = $$('[role="tab"][aria-selected="true"]').map((t) => t.children[1].textContent);
console.log('     abas selecionadas ao voltar:', sel.join(' | '), '| grupos de arquivos:', $$('.piece-group').length);
await sleep(1500);
check('home de novo: a aba escolhida em cada faixa persiste (nao e "Todos") e mostra arquivos', sel.length === 3 && sel.every((x) => x !== 'Todos') && $$('.piece-group').length > 0 && $$('.card').length === 0);
$$('[role="tab"]').filter((t) => t.children[1].textContent === 'Todos').forEach((t) => t.click()); await sleep(50);
check('voltar para "Todos" nas 3 faixas mostra os 300', $$('.card').length === 300, String($$('.card').length));
const ids = $$('[id]').map((e) => e.id); const dup = ids.filter((v, i) => ids.indexOf(v) !== i);
check('sem ids duplicados no DOM (300 cards)', dup.length === 0, dup.slice(0, 5).join(','));
check('sem erros no console', errors.filter((e) => !/Not implemented|navigation/i.test(e)).length === 0, JSON.stringify(errors.slice(0, 3)));
console.log(failed ? `\n${failed} FALHA(S)` : '\nTudo OK'); process.exit(failed ? 1 : 0);
