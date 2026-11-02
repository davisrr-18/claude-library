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
await import(path.join(ROOT, 'js/app.js')); await sleep(300);
const base = '#/intermediarias/estudos-em-programacao';
const open = async (h) => { w.location.hash = h; await sleep(700); };
const openDetails = async (d) => { d.open = true; d.dispatchEvent(new w.Event('toggle')); await sleep(60); };

await open(base);
const slot = $('.install-slot details.install');
check('card: painel "Instalar o pacote inteiro" aparece', !!slot && /Instalar o pacote inteiro pelo terminal \(8 arquivos\)/.test(slot.querySelector('summary').textContent), slot?.querySelector('summary')?.textContent);
check('painel comeca fechado e sem comandos montados (so monta ao abrir)', !slot.open && !slot.querySelector('pre'));
await openDetails(slot);
const tabs = $$('[role="tab"]', slot);
check('3 abas de sistema: Linux, macOS, Windows', tabs.map((t) => t.textContent).join('|') === 'Linux|macOS|Windows');
check('sistema detectado esta selecionado (jsdom -> linux) e roving tabindex', $('[aria-selected="true"]', slot).textContent === 'Linux' && tabs.map((t) => t.getAttribute('tabindex')).join(',') === '0,-1,-1');
let cmd = $('pre code', slot).textContent;
check('linux: comandos criam as pastas e os 8 arquivos', (cmd.match(/^cat > /gm) || []).length === 8 && cmd.includes("mkdir -p '.claude/agents'") && cmd.includes("mkdir -p '.claude/skills/sessao-de-estudo'") && cmd.includes("cat > 'CLAUDE.md' <<'CLAUDE_LIBRARY_EOF'"), cmd.slice(0, 200));
check('linux: o conteudo do agente vem inteiro (front matter e corpo)', cmd.includes('name: tutor') && cmd.includes('tools: Read, Glob, Grep, Write, Edit') && cmd.includes('Você é um tutor de programação'));
check('linux: skill com bloco interno de 3 crases preservada dentro do heredoc', cmd.includes('## AAAA-MM-DD — [Tema] ([Linguagem])') && cmd.includes('- Domínio: fraco | ok | forte'));
check('o texto explicativo dos arquivos NAO entra (so o bloco ```markdown)', !cmd.includes('Salve em `.claude/agents/tutor.md`') && !cmd.includes('Conduz a explicação e o ritmo'));
check('tem botao Copiar com nome acessivel', $('.code-copy', slot)?.getAttribute('aria-label') === 'Copiar comandos de instalação');
check('bloco de comandos e rolavel por teclado e nomeado', $('pre', slot).getAttribute('tabindex') === '0' && !!$('pre', slot).getAttribute('aria-label'));

tabs[2].click(); await sleep(30);
cmd = $('pre code', slot).textContent;
check('windows: PowerShell com UTF-8 sem BOM, pastas e 8 arquivos', cmd.includes('$utf8 = New-Object System.Text.UTF8Encoding $false') && cmd.includes("New-Item -ItemType Directory -Force -Path '.claude\\agents' | Out-Null") && (cmd.match(/WriteAllText/g) || []).length === 8 && cmd.includes("'.claude\\skills\\sessao-de-estudo\\SKILL.md'"), cmd.slice(0, 220));
check('windows: here-string literal (sem expansao de $ ou crase)', (cmd.match(/\$content = @'/g) || []).length === 8 && !cmd.includes('FromBase64String'));
check('aba Windows selecionada e as outras fora do Tab', $('[aria-selected="true"]', slot).textContent === 'Windows' && tabs.map((t) => t.getAttribute('tabindex')).join(',') === '-1,-1,0');
tabs[2].focus(); tabs[2].dispatchEvent(new w.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); await sleep(30);
check('teclado: ArrowRight no ultimo volta para Linux e foca', $('[aria-selected="true"]', slot).textContent === 'Linux' && w.document.activeElement === tabs[0]);
tabs[1].click(); await sleep(30);
check('macOS: mesmo script do Linux', $('pre code', slot).textContent === (tabs[0].click(), await sleep(30), $('pre code', slot).textContent));
check('escolha de sistema lembrada (localStorage)', w.localStorage.getItem('os') === 'linux', String(w.localStorage.getItem('os')));

// por peca
await open(`${base}/agente`);
const pieceInstalls = $$('.piece > details.install');
check('agentes: 1 painel por peca (3), com o caminho certo no titulo', pieceInstalls.length === 3 && pieceInstalls.map((d) => d.querySelector('summary').textContent).join('|') === 'Salvar ".claude/agents/tutor.md" pelo terminal|Salvar ".claude/agents/revisor-de-codigo.md" pelo terminal|Salvar ".claude/agents/gerador-de-exercicios.md" pelo terminal', pieceInstalls.map((d) => d.querySelector('summary').textContent).join('|'));
await openDetails(pieceInstalls[1]);
const one = $('pre code', pieceInstalls[1]).textContent;
check('painel da peca instala so aquele arquivo', (one.match(/^cat > /gm) || []).length === 1 && one.includes("cat > '.claude/agents/revisor-de-codigo.md'") && one.includes('name: revisor-de-codigo') && !one.includes('name: tutor'));
check('o painel da peca fica logo abaixo do cabecalho', pieceInstalls[0].previousElementSibling.classList.contains('piece-head'));
check('aba de agentes: o painel do PACOTE tambem esta no topo', !!$('.install-slot details.install'));

for (const t of ['skill', 'claude-md']) { await open(`${base}/${t}`); check(`${t}: tem painel de instalacao por peca`, $$('.piece > details.install').length === (t === 'skill' ? 3 : 1)); }
await open(`${base}/arquitetura`);
{
  const ds = $$('.piece > details.install');
  check('arquitetura: so a peca "Arquitetura da pasta de estudos" tem painel (o indice nao tem destino)', ds.length === 1 && ds[0].querySelector('summary').textContent === 'Salvar "arquitetura.md" pelo terminal', ds.map((d) => d.querySelector('summary').textContent).join('|'));
  await openDetails(ds[0]);
  const c = $('pre code', ds[0]).textContent;
  check('arquitetura.md: instala o ARQUIVO INTEIRO sem o front matter da biblioteca', c.includes("cat > 'arquitetura.md' <<'CLAUDE_LIBRARY_EOF'") && c.includes('# Arquitetura da pasta de estudos') && !c.includes('titulo: Arquitetura') && !c.includes('slug: estudos-arquitetura') && !c.includes('destino: arquitetura.md'), c.slice(0, 260));
  check('arquitetura.md: arquivo na raiz => sem mkdir; traz arvore, tabelas e blocos internos', !c.includes('mkdir') && c.includes('├── CLAUDE.md') && c.includes('| Componente | Responsabilidade |') && c.includes('## Regras de integridade'));
  check('arquitetura.md: so 1 arquivo no comando', (c.match(/^cat > /gm) || []).length === 1);
}
for (const t of ['prompt', 'workflow']) { await open(`${base}/${t}`); check(`${t}: NAO tem painel (destino nao e um caminho de arquivo)`, $$('.piece > details.install').length === 0); }

const bad = errors.filter((e) => !/Not implemented|navigation/i.test(e));
check('sem erros no console', bad.length === 0, JSON.stringify(bad.slice(0, 3)));
console.log(failed ? `\n${failed} FALHA(S)` : '\nTudo OK'); process.exit(failed ? 1 : 0);
