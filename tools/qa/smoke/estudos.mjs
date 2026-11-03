import { JSDOM } from 'jsdom';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs'; import path from 'node:path';
const ROOT = process.env.APP_ROOT || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
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
const $ = (s, r = w.document) => r.querySelector(s), $$ = (s, r = w.document) => [...r.querySelectorAll(s)];
let failed = 0; const check = (n, c, x = '') => { console.log(`${c ? 'OK  ' : 'FAIL'} ${n} ${c ? '' : x}`); if (!c) failed++; };
await import(path.join(ROOT, 'js/app.js')); await sleep(400);

// ---------- Home ----------
check('home: so os 2 cards do usuario (estudos e desenvolvimento web); exemplos removidos', JSON.stringify($$('.card h3').map((e) => e.textContent)) === JSON.stringify(['Estudos em Programação', 'Desenvolvimento Web']), $$('.card h3').map((e) => e.textContent).join('|'));
check('home: os cards estao em Tarefas Intermediarias', $('#tier-intermediarias').closest('.tier').querySelectorAll('.card').length === 2);
const estudosCard = $$('.card').find((c) => c.querySelector('h3').textContent === 'Estudos em Programação');
check('home: Basicas e Complexas vazias com aviso', $$('.tier').filter((t) => t.querySelector('.callout')).length === 2);
check('home: chips agrupados com contagem (Agente ×3, Skill ×3)', (() => { const t = estudosCard.querySelector('.chips').textContent; return t.includes('Agente ×3') && t.includes('Skill ×3'); })(), estudosCard.querySelector('.chips').textContent);
await sleep(1000); // espera a contagem animada terminar
check('home: estatisticas contam as pecas dos 2 cards (8 skills, 8 agentes, 2 CLAUDE.md, 4 arquiteturas, 3 workflows, 2 prompts)', (() => { const t = $('.stats').textContent; return t.includes('8 skills') && t.includes('8 agentes') && t.includes('2 CLAUDE.md') && t.includes('4 arquiteturas') && t.includes('3 workflows') && t.includes('2 prompts') && t.includes('2 cards'); })(), $('.stats').textContent);
const tabs = $$('[role="tab"]', $('#tier-intermediarias').closest('.tier')).map((t) => t.children[1].textContent + t.querySelector('.type-count').firstChild.textContent);
check('faixa Intermediarias: abas por tipo (Todos conta cards; os tipos contam arquivos)', JSON.stringify(tabs) === JSON.stringify(['Todos2', 'Skills8', 'CLAUDE.md2', 'Arquiteturas4', 'Agentes8', 'Workflows3', 'Prompts2']), tabs.join('|'));
{
  const ag = $$('[role="tab"]').find((t) => t.textContent.includes('Agentes')); ag.click(); await sleep(600);
  const groups = $$('.piece-group');
  check('aba Agentes: mostra direto os 8 arquivos de agente, agrupados pelo card de origem (sem cards)', groups.length === 2 && $$('.card').length === 0 && groups.map((g) => g.querySelectorAll('.piece').length).join(',') === '3,5' && groups[0].querySelector('.piece-origin a').getAttribute('href') === '#/intermediarias/estudos-em-programacao', groups.map((g) => g.querySelectorAll('.piece').length).join(','));
  check('aba Agentes: cada arquivo tem Copiar e o bloco de codigo', $$('.piece-group .piece').every((p) => p.querySelector('.piece-head .btn') && p.querySelector('pre')));
  const cl = $$('[role="tab"]').find((t) => t.textContent.includes('CLAUDE.md')); cl.click(); await sleep(600);
  check('aba CLAUDE.md: os 2 arquivos CLAUDE.md da faixa', $$('.piece-group .piece').length === 2 && $$('.piece-group .piece-head h4').map((h) => h.textContent).join('|').includes('CLAUDE.md'), $$('.piece-group .piece-head h4').map((h) => h.textContent).join('|'));
  const todos = $$('[role="tab"]').find((t) => t.children[1].textContent === 'Todos'); todos.click(); await sleep(30);
}

// ---------- busca no corpo ----------
{
  const q = $('#q'); const type = async (v) => { q.value = v; q.dispatchEvent(new w.Event('input', { bubbles: true })); await sleep(350); return $$('.card').length; };
  check('busca "revisao espacada" (sem acento) acha o card', (await type('revisao espacada')) === 1);
  check('busca "gabarito" (so aparece no corpo) acha o card', (await type('gabarito')) === 1);
  check('busca "zzzz" nao acha nada', (await type('zzzz')) === 0);
  check('busca "estudos tutor" (AND) acha', (await type('estudos tutor')) === 1);
  q.value = ''; q.dispatchEvent(new w.Event('input', { bubbles: true })); await sleep(200);
}

// ---------- pagina do card ----------
const base = '#/intermediarias/estudos-em-programacao';
w.location.hash = base; await sleep(500);
check('card: titulo, nivel e tags', $('.card-hero h1').textContent === 'Estudos em Programação' && $$('.card-hero .tag').length === 4);
const tabLinks = $$('.tabs a').map((a) => a.textContent.replace(/\s+/g, ' ').trim());
check('card: abas por tipo na ordem canonica, com contagem de pecas', JSON.stringify(tabLinks) === JSON.stringify(['Skill3 peças', 'CLAUDE.md', 'Arquitetura2 peças', 'Agente3 peças', 'Workflow', 'Prompt']), tabLinks.join('|'));
check('card: aside lista os 2 cards do nivel', $$('.card-aside li').length === 2);

const open = async (type) => { w.location.hash = `${base}/${type}`; await sleep(600); };
await open('agente');
check('agentes: 3 pecas empilhadas, na ordem do manifest', JSON.stringify($$('.piece .piece-head h2').map((h) => h.textContent)) === JSON.stringify(['Agent: Tutor', 'Agent: Revisor de código', 'Agent: Gerador de exercícios']), $$('.piece h2').map((h) => h.textContent).join('|'));
check('agentes: cada peca mostra o Destino (.claude/agents/...)', $$('.piece-head p').map((p) => p.textContent).join('|') === 'Destino: .claude/agents/tutor.md|Destino: .claude/agents/revisor-de-codigo.md|Destino: .claude/agents/gerador-de-exercicios.md', $$('.piece-head p').map((p) => p.textContent).join('|'));
check('agentes: h1 duplicado do arquivo removido (titulo ja esta no cabecalho)', $$('.piece article > h3').every((h) => !/^Agent:/.test(h.textContent)));
check('agentes: cada peca tem seu botao "Copiar peca" com nome proprio', $$('.piece-head .btn').map((b) => b.getAttribute('aria-label')).join('|') === 'Copiar peça: Agent: Tutor|Copiar peça: Agent: Revisor de código|Copiar peça: Agent: Gerador de exercícios');
check('agentes: o bloco ````markdown vira UM bloco de codigo por agente, com Copiar', $$('.piece').every((p) => p.querySelectorAll('pre').length >= 1 && p.querySelector('.code-copy')));
{
  const code = $('.piece pre code').textContent;
  check('agentes: o bloco de codigo traz o front matter do agente inteiro (name/description/tools)', code.includes('name: tutor') && code.includes('tools: Read') && code.includes('Você é um tutor'), code.slice(0, 120));
  check('agentes: placeholders [COLCHETES] preservados como texto', $$('.piece')[1].textContent.includes('[COMANDO_TESTAR]'));
}
check('agentes: sem erros nas pecas', !$('.callout.is-error'));

await open('skill');
check('skills: 3 pecas empilhadas', $$('.piece').length === 3 && $$('.piece .piece-head h2').map((h) => h.textContent).join('|') === 'Skill: Sessão de estudo|Skill: Revisão espaçada|Skill: Explicar código');
{
  const sessao = $$('.piece')[0];
  const codeTexts = $$('pre code', sessao).map((c) => c.textContent);
  check('skill sessao: bloco externo (4 crases) contem o bloco interno (3 crases) como TEXTO', codeTexts.some((t) => t.includes('name: sessao-de-estudo') && t.includes('```') && t.includes('## AAAA-MM-DD')), codeTexts.map((t) => t.length).join(','));
  check('skill sessao: so 1 bloco de codigo na peca (o interno nao virou um segundo)', codeTexts.length === 1, String(codeTexts.length));
  const rev = $$('.piece')[1];
  check('skill revisao: tabela de exemplo dentro do codigo preservada como texto', $$('pre code', rev).some((c) => c.textContent.includes('| Item | Tema |')));
  const exp = $$('.piece')[2];
  check('skill explicar: tabela fora de codigo (do passo 3) vira <table>? (esta dentro do bloco)', $$('pre code', exp).some((c) => c.textContent.includes('| Passo | Linha |')));
}
await open('claude-md');
check('claude-md: 1 peca com Destino e codigo', $$('.piece').length === 1 && $('.piece-head p').textContent === 'Destino: CLAUDE.md (raiz da pasta de estudos)' && !!$('pre code'));
await open('prompt');
check('prompt: destino e 4 blocos (principal + 3 variacoes)', $('.piece-head p').textContent === 'Destino: colar no início de cada sessão' && $$('pre').length === 4, String($$('pre').length));
await open('arquitetura');
check('arquitetura: tabelas (indice e componentes/decisoes) e arvore de pastas em codigo', $$('table').length >= 4 && $$('pre code').some((c) => c.textContent.includes('├── CLAUDE.md')), String($$('table').length));
check('arquitetura: tabelas dentro de contêiner rolavel focavel', $$('.table-wrap[tabindex="0"] table').length === $$('table').length);
check('arquitetura: 2 pecas empilhadas (indice e arquitetura da pasta), na ordem do manifest', JSON.stringify($$('.piece .piece-head h2').map((h) => h.textContent)) === JSON.stringify(['Pacote geral de estudos em programação', 'Arquitetura da pasta de estudos']), $$('.piece h2').map((h) => h.textContent).join('|'));
check('arquitetura: so a 2a peca tem Destino (arquitetura.md), o indice nao tem', $$('.piece')[0].querySelector('.piece-head p') === null && $$('.piece')[1].querySelector('.piece-head p').textContent === 'Destino: arquitetura.md (raiz da pasta de estudos)');
check('arquitetura: h1 duplicado removido nas duas', $$('.piece article > h3').every((h) => !/^(Pacote geral|Arquitetura da pasta)/.test(h.textContent)));
check('arquitetura: sem erros', !$('.callout.is-error'));
await open('workflow');
check('workflow (checklist): 1 peca, lista de tarefas com checkbox desabilitado', $$('.piece').length === 1 && $$('input[type="checkbox"]').length >= 20 && $$('input[type="checkbox"]').every((i) => i.disabled), String($$('input[type="checkbox"]').length));
check('workflow: tabela "Sinais de que algo esta errado"', $$('table').length === 1);

// ---------- rotas ----------
w.location.hash = `${base}/arquitetura`; await sleep(300);
check('deep link por tipo funciona', $('.tabs a[aria-current="page"]').textContent.includes('Arquitetura'));
w.location.hash = '#/basicas/exemplo'; await sleep(300);
check('card removido (exemplo) agora e "nao encontrado"', $('h1').textContent === 'Página não encontrada');
w.location.hash = '#/basicas'; await sleep(300);
check('nivel vazio mostra aviso, sem abas', !!$('.callout') && !$('[role="tab"]'));

const bad = errors.filter((e) => !/Not implemented|navigation/i.test(e));
check('sem erros no console', bad.length === 0, JSON.stringify(bad.slice(0, 3)));
console.log(failed ? `\n${failed} FALHA(S)` : '\nTudo OK'); process.exit(failed ? 1 : 0);
