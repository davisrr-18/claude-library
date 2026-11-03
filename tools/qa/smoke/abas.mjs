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
const $ = (s, r = w.document) => r.querySelector(s), $$ = (s, r = w.document) => [...r.querySelectorAll(s)];
let failed = 0; const check = (n, c, x = '') => { console.log(`${c ? 'OK  ' : 'FAIL'} ${n} ${c ? '' : x}`); if (!c) failed++; };
await import(path.join(ROOT, 'js/app.js')); await sleep(350);

const tier = (id) => $(`#tier-${id}`).closest('.tier');
const tabsOf = (id) => $$('[role="tab"]', tier(id)).map((t) => t.children[1].textContent + t.querySelector('.type-count').firstChild.textContent);
const cardsOf = (id) => $$('.card', tier(id));

check('basicas: abas Todos, Skills, Agentes, Prompts (com contagem)', JSON.stringify(tabsOf('basicas')) === JSON.stringify(['Todos2', 'Skills1', 'Agentes1', 'Prompts1']), tabsOf('basicas').join('|'));
check('intermediarias: Todos, Agentes, Workflows', JSON.stringify(tabsOf('intermediarias')) === JSON.stringify(['Todos1', 'Agentes1', 'Workflows1']), tabsOf('intermediarias').join('|'));
check('complexas: Todos, Skills, Agentes, Workflows', JSON.stringify(tabsOf('complexas')) === JSON.stringify(['Todos1', 'Skills1', 'Agentes1', 'Workflows1']), tabsOf('complexas').join('|'));
check('aba "Todos" selecionada por padrao e mostra todos os cards', $('[role="tab"][aria-selected="true"]', tier('basicas')).textContent.includes('Todos') && cardsOf('basicas').length === 2);
check('roving tabindex: so a aba ativa e alcancavel por Tab', $$('[role="tab"]', tier('basicas')).map((t) => t.getAttribute('tabindex')).join(',') === '0,-1,-1,-1');
check('painel ligado a aba (aria-controls / aria-labelledby)', $('[role="tab"]', tier('basicas')).getAttribute('aria-controls') === $('[role="tabpanel"]', tier('basicas')).id && $('[role="tabpanel"]', tier('basicas')).getAttribute('aria-labelledby') === $('[role="tab"][aria-selected="true"]', tier('basicas')).id);
check('tablist tem nome acessivel', !!$('[role="tablist"]', tier('basicas')).getAttribute('aria-label'));

// clicar em Agentes filtra e abre direto a peca
const agentes = $$('[role="tab"]', tier('basicas')).find((t) => t.textContent.includes('Agentes'));
agentes.focus(); agentes.click(); await sleep(50);
await sleep(150);
const groupsOf = (id) => $$('.piece-group', tier(id));
check('Agentes: mostra direto os arquivos (nao os cards), so em basicas', groupsOf('basicas').length === 1 && cardsOf('basicas').length === 0 && cardsOf('intermediarias').length === 1, groupsOf('basicas').length + '/' + cardsOf('basicas').length);
check('Agentes: grupo aponta o card de origem', groupsOf('basicas')[0]?.querySelector('.piece-origin a')?.getAttribute('href') === '#/basicas/investigacao-rapida', groupsOf('basicas')[0]?.querySelector('.piece-origin a')?.getAttribute('href'));
check('Agentes: o arquivo (titulo e texto) aparece na propria faixa', groupsOf('basicas')[0]?.querySelector('.piece h4')?.textContent.includes('Agente investigator') && !!groupsOf('basicas')[0]?.querySelector('article.md'), groupsOf('basicas')[0]?.textContent.slice(0, 80));
check('Agentes: aba continua focada e selecionada (foco nao se perde)', w.document.activeElement === agentes && agentes.getAttribute('aria-selected') === 'true');
check('abas das outras faixas nao mudam', $('[role="tab"][aria-selected="true"]', tier('complexas')).textContent.includes('Todos'));

// teclado
w.document.activeElement.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); await sleep(150);
check('ArrowRight: vai para Prompts e mostra os arquivos', $('[role="tab"][aria-selected="true"]', tier('basicas')).textContent.includes('Prompts') && groupsOf('basicas').length === 1 && w.document.activeElement.textContent.includes('Prompts'));
w.document.activeElement.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); await sleep(50);
check('ArrowRight no ultimo: volta para Todos', $('[role="tab"][aria-selected="true"]', tier('basicas')).textContent.includes('Todos') && cardsOf('basicas').length === 2);
w.document.activeElement.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'End', bubbles: true })); await sleep(50);
check('End: ultima aba', $('[role="tab"][aria-selected="true"]', tier('basicas')).textContent.includes('Prompts'));
w.document.activeElement.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Home', bubbles: true })); await sleep(50);
check('Home: primeira aba', $('[role="tab"][aria-selected="true"]', tier('basicas')).textContent.includes('Todos'));
w.document.activeElement.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true })); await sleep(50);
check('ArrowLeft na primeira: vai para a ultima', $('[role="tab"][aria-selected="true"]', tier('basicas')).textContent.includes('Prompts'));

// a escolha persiste ao repintar por busca/filtro e volta ao navegar
const q = $('#q'); q.value = 'investigacao'; q.dispatchEvent(new w.Event('input', { bubbles: true })); await sleep(350);
await sleep(150);
check('busca + aba: o tipo escolhido continua valido se o card restante o tem', groupsOf('basicas').length === 1 && $('[role="tab"][aria-selected="true"]', tier('basicas')).textContent.includes('Prompts'), tabsOf('basicas').join('|'));
q.value = 'exemplo'; q.dispatchEvent(new w.Event('input', { bubbles: true })); await sleep(350);
check('busca sem o tipo escolhido: recua para Todos, sem erro', cardsOf('basicas').length === 1 && $('[role="tab"][aria-selected="true"]', tier('basicas')).textContent.includes('Todos'), tabsOf('basicas').join('|'));
q.value = ''; q.dispatchEvent(new w.Event('input', { bubbles: true })); await sleep(300);
check('limpar busca: a aba escolhida (Prompts) volta', $('[role="tab"][aria-selected="true"]', tier('basicas')).textContent.includes('Prompts'));
w.location.hash = '#/basicas/exemplo'; await sleep(300); w.location.hash = '#/'; await sleep(350);
check('ao voltar para a Home a escolha continua', $('[role="tab"][aria-selected="true"]', tier('basicas')).textContent.includes('Prompts'));

// pagina do nivel tambem tem abas
w.location.hash = '#/complexas'; await sleep(350);
check('pagina do nivel: abas presentes e cards em h2', $$('[role="tab"]').length === 4 && !!$('.card h2'));
const wf = $$('[role="tab"]').find((t) => t.textContent.includes('Workflows')); wf.click(); await sleep(50);
await sleep(150);
check('pagina do nivel: Workflows mostra o arquivo de workflow, com o card de origem em h2', $('.piece-group .piece-origin a')?.getAttribute('href') === '#/complexas/planejar-em-marcos' && $('.piece-group .piece h3')?.textContent.length > 0 && $('.piece-origin')?.tagName === 'H2');
w.location.hash = '#/complexas/planejar-em-marcos/workflow'; await sleep(500);
check('link direto abre a aba Workflow do card', $('.tabs a[aria-current="page"]')?.textContent.includes('Workflow') && !!$('article.md'));

// nivel vazio nao tem abas
w.location.hash = '#/'; await sleep(300);
// ---- correcoes da revisao ----
w.location.hash = '#/'; await sleep(350);
{
  const tab = $$('[role="tab"]', tier('basicas')).find((t) => t.textContent.includes('Agentes'));
  tab.focus();
  const selectedBefore = $('[role="tab"][aria-selected="true"]', tier('basicas'));
  const alt = new w.KeyboardEvent('keydown', { key: 'ArrowRight', altKey: true, bubbles: true, cancelable: true });
  tab.dispatchEvent(alt);
  check('Alt+seta nao e engolida nem troca de aba', alt.defaultPrevented === false && $('[role="tab"][aria-selected="true"]', tier('basicas')) === selectedBefore && w.document.activeElement === tab);
  const plain = new w.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
  tab.dispatchEvent(plain);
  const list = $$('[role="tab"]', tier('basicas'));
  const expectedNext = list[(list.indexOf(tab) + 1) % list.length];
  check('controle: a mesma seta sem Alt continua funcionando (vai para a aba seguinte)', plain.defaultPrevented === true && $('[role="tab"][aria-selected="true"]', tier('basicas')) === expectedNext && w.document.activeElement === expectedNext);
  tab.focus(); tab.click(); await sleep(30);
  const ctrl = new w.KeyboardEvent('keydown', { key: 'ArrowLeft', ctrlKey: true, bubbles: true, cancelable: true });
  tab.dispatchEvent(ctrl);
  check('Ctrl+seta tambem passa direto', ctrl.defaultPrevented === false);
  tab.click(); await sleep(30);
  const idBefore = tab.id;
  // repinta a lista enquanto o foco esta numa aba (o que acontece quando os corpos das pecas terminam de carregar)
  tab.focus();
  const q2 = $('#q'); q2.value = 'a'; q2.dispatchEvent(new w.Event('input', { bubbles: true })); await sleep(350);
  check('foco volta para a mesma aba depois de repintar a lista', w.document.activeElement?.id === idBefore, w.document.activeElement?.tagName + '#' + w.document.activeElement?.id);
  q2.value = ''; q2.dispatchEvent(new w.Event('input', { bubbles: true })); await sleep(300);
  const card = $('.card');
  check('card: nome acessivel = titulo do card', !!card && w.document.getElementById(card.getAttribute('aria-labelledby'))?.textContent === card.querySelector('h3, h2').textContent);
  check('contagem da aba tem texto para leitor de tela (sem aria-label em span)', !$('.type-count[aria-label]') && !!$('.type-count .sr-only'));
}
check('barra de progresso fora do header (backdrop-filter nao a prende)', !!$('.progress') && !$('.topbar .progress'));
w.location.hash = '#/basicas/exemplo/skill'; await sleep(500);
check('titulo repetido do corpo foi removido (ja esta no cabecalho)', $('article.md').firstElementChild?.tagName !== 'H3' || $('article.md').firstElementChild.textContent !== 'Skill de exemplo', $('article.md').firstElementChild?.outerHTML.slice(0, 80));
check('cabecalho da peca continua com o titulo', $('.piece-head h2')?.textContent === 'Skill de exemplo');
w.location.hash = '#/complexas/planejar-em-marcos/skill'; await sleep(500);
check('peca com titulo diferente do manifest mantem seu primeiro titulo', !!$('article.md h3, article.md h4'), $('article.md').innerHTML.slice(0, 100));
// ---- animacoes nao podem reiniciar ao repintar ----
w.location.hash = '#/'; await sleep(350);
check('ao carregar a Home a fase de entrada esta ativa', $('main').classList.contains('is-entering'));
{
  const aba = $$('[role="tab"]').find((t) => t.textContent.includes('Agentes'));
  aba.click(); await sleep(30);
  check('trocar de aba encerra a fase de entrada (cards novos nao reanimam a entrada)', !$('main').classList.contains('is-entering'));
}
w.location.hash = '#/basicas'; await sleep(350);
check('navegar para outra pagina inicia a entrada de novo (1 vez)', $('main').classList.contains('is-entering'));
{
  const q3 = $('#q') ?? null;
  w.location.hash = '#/'; await sleep(350);
  check('de volta a Home: entrada ativa', $('main').classList.contains('is-entering'));
  const q4 = $('#q'); q4.value = 'a'; q4.dispatchEvent(new w.Event('input', { bubbles: true })); await sleep(50);
  check('buscar encerra a fase de entrada', !$('main').classList.contains('is-entering'));
  q4.value = ''; q4.dispatchEvent(new w.Event('input', { bubbles: true })); await sleep(100);
}
const bad = errors.filter((e) => !/Not implemented|navigation/i.test(e));
check('sem erros no console', bad.length === 0, JSON.stringify(bad));
console.log(failed ? `\n${failed} FALHA(S)` : '\nTudo OK'); process.exit(failed ? 1 : 0);
