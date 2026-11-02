# Claude Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Página estática que organiza propostas do Claude Code em três níveis de complexidade, com cards e peças em Markdown.

**Architecture:** SPA com hash routing, sem build. Módulos ES puros (`content.js`, `search.js`) sem DOM, testáveis em Node; `app.js` é a única unidade com DOM. Markdown renderizado por `marked` vendorizado, com HTML bruto escapado e links filtrados no renderizador.

**Tech Stack:** HTML, CSS, JS (ES modules), `marked` (vendorizado), `node:test` para testes.

**Spec:** `docs/superpowers/specs/2026-11-02-claude-library-design.md`

## Global Constraints
- Sem backend, build, framework ou CDN; `marked` fica em `vendor/marked.min.js`.
- `package.json` só com `{"type":"module"}`; zero dependências.
- Tipos de peça: `skill | claude-md | arquitetura | agente | workflow | prompt`. Níveis: `basicas`, `intermediarias`, `complexas`.
- Rotas: `#/`, `#/<nivel>`, `#/<nivel>/<card>`, `#/<nivel>/<card>/<tipo>`.
- ids em kebab-case, únicos dentro do pai; `file` relativo a `content/`, sem `..`, sem `/` inicial.
- Conteúdo sem dados sensíveis (e-mails, `/home/`, tokens). `<meta name="robots" content="noindex">`.
- localStorage sempre em try/catch. Sem commit, push ou deploy sem autorização do usuário.

## Review Focus
- Manifest com nível sem cards ou card sem peças: renderiza estado vazio, não quebra.
- `.md` com quebras CRLF e front matter com `:` no valor: parseado corretamente.
- Tipo de peça repetido no mesmo card: rejeitado pela validação.
- Hash com caracteres codificados (`%20`) ou barra final: resolve ou cai em "não encontrado".
- Busca vazia ou só espaços: não filtra nada; consulta com acento casa sem acento.
- Clipboard indisponível: mensagem de falha, sem exceção.
- HTML bruto no Markdown (`<script>`, `onerror=`, `[x](javascript:...)`): nunca executa.

---

### Task 1: Núcleo de conteúdo (`js/content.js`) — Marco 1

**Files:**
- Create: `package.json`, `js/content.js`, `tests/content.test.mjs`

**Interfaces:**
- Produces:
  - `parseFrontMatter(text: string) -> { meta: Record<string,string>, body: string }`
  - `validateManifest(m: unknown) -> { ok: boolean, errors: string[] }`
  - `PIECE_TYPES: string[]`, `TIER_IDS: string[]`

- [ ] **Step 1: Testes que falham** em `tests/content.test.mjs`: `parseFrontMatter` com front matter simples, ausente (`meta` vazio, `body` igual ao texto), CRLF, valor com `:` (`description: a: b` → `"a: b"`); `validateManifest` rejeitando id duplicado, tipo inválido, `file` com `..`, `file` iniciado por `/`, tipo repetido no card, nível desconhecido; aceitando um manifest válido e um nível com `cards: []`.
- [ ] **Step 2: Rodar `node --test tests/` e confirmar falha** (módulo inexistente).
- [ ] **Step 3: Implementar** as funções acima em `js/content.js`; front matter é só linhas `chave: valor` entre `---`, sem biblioteca YAML.
- [ ] **Step 4: Rodar `node --test tests/`; esperado: todos passam.**

### Task 2: Esqueleto da aplicação — Marco 1

**Files:**
- Create: `index.html`, `css/style.css`, `js/app.js`, `content/manifest.json`, `content/basicas/exemplo/skill.md`
- Modify: —

**Interfaces:**
- Consumes: `validateManifest`, `parseFrontMatter` (Task 1)
- Produces: `parseRoute(hash: string) -> { view: 'home'|'tier'|'card'|'piece'|'notfound', tier?, card?, type? }` exportada de `js/router.js` (puro, sem DOM)

- [ ] **Step 1: Teste que falha** `tests/router.test.mjs`: `#/` → home; `#/basicas` → tier; `#/basicas/exemplo` → card; `#/basicas/exemplo/skill` → piece; `#/basicas/` com barra final → tier; `#/%62asicas` decodifica para tier; `#/xyz` → notfound.
- [ ] **Step 2: Rodar e confirmar falha.**
- [ ] **Step 3: Implementar `js/router.js`**, depois `index.html` (com meta `noindex`, viewport, `<script type="module" src="js/app.js">`), `app.js` (carrega e valida o manifest, renderiza Home com 3 blocos e grade de cards, página de card com abas por peça, tela "não encontrado", aviso para `file://`, erro claro se o manifest falhar) e CSS base com tokens em `:root` e `prefers-color-scheme`.
- [ ] **Step 4: Rodar `node --test tests/`; esperado: passam.** Verificação manual: `python3 -m http.server 8000` e abrir `http://localhost:8000`; Home mostra os 3 níveis, o card de exemplo abre, rota inválida mostra "não encontrado".

### Task 3: Markdown seguro, copiar e tema — Marco 2

**Files:**
- Create: `vendor/marked.min.js` (versão fixa, anotar a versão no topo de `vendor/README.md`), `js/markdown.js`, `tests/markdown.test.mjs`
- Modify: `js/app.js`, `css/style.css`

**Interfaces:**
- Consumes: `parseFrontMatter` (Task 1)
- Produces: `renderMarkdown(body: string) -> string` (HTML seguro); `isSafeUrl(url: string) -> boolean`

- [ ] **Step 1: Testes que falham** em `tests/markdown.test.mjs`: `<script>alert(1)</script>` sai escapado; `<img src=x onerror=alert(1)>` sai escapado; `[x](javascript:alert(1))` não gera `href` perigoso; `isSafeUrl` aceita `https://a.b`, `#ancora`, `docs/a.md`, rejeita `javascript:x`, `data:text/html,x`, `vbscript:x`; título e lista renderizam normalmente.
- [ ] **Step 2: Rodar e confirmar falha.**
- [ ] **Step 3: Implementar `renderMarkdown`** com `marked` configurado: renderer `html` devolve o texto escapado; renderers `link`/`image` usam `isSafeUrl` e descartam o `href`/`src` se inseguro.
- [ ] **Step 4: Rodar testes; esperado: passam.**
- [ ] **Step 5: Em `app.js`**: renderizar a peça com `renderMarkdown`, cabeçalho com `name`/`description` do front matter, botão copiar em cada `<pre>` e "copiar peça" (Markdown original) usando `navigator.clipboard.writeText` com mensagem de falha se rejeitar; alternância de tema com localStorage em try/catch. Verificação manual: copiar funciona; tema persiste após recarregar; bloquear localStorage não quebra a página.

### Task 4: Busca — Marco 3

**Files:**
- Create: `js/search.js`, `tests/search.test.mjs`
- Modify: `js/app.js`, `index.html`

**Interfaces:**
- Produces:
  - `normalize(s: string) -> string` (minúsculas, sem acentos)
  - `buildIndex(entries: {tier,card,type,title,tags,summary,text}[]) -> Index`
  - `search(index: Index, query: string, opts?: {tier?: string}) -> entries[]`

- [ ] **Step 1: Testes que falham**: `normalize("Ação")` = `"acao"`; `search` com `"acao"` acha texto "ação"; consulta com duas palavras exige ambas; consulta vazia ou só espaços retorna `[]`; `opts.tier` filtra o nível; título pesa mais que corpo na ordenação.
- [ ] **Step 2: Rodar e confirmar falha.**
- [ ] **Step 3: Implementar** com correspondência por palavras (todas devem aparecer); pontuação simples: título > tags/resumo > corpo.
- [ ] **Step 4: Rodar testes; esperado: passam.**
- [ ] **Step 5: Em `app.js`**: campo de busca no topo, filtro por nível, índice montado lazy no primeiro uso (busca todos os `.md` do manifest), resultados linkando para a peça. Verificação manual: buscar termo do corpo e com/sem acento.

### Task 5: Conteúdo inicial — Marco 3

**Files:**
- Create: um card por nível em `content/basicas/`, `content/intermediarias/`, `content/complexas/`, com `.md` por peça
- Modify: `content/manifest.json`

- [ ] **Step 1: Montar os cards** a partir de `~/.claude/skills/plan-update`, `~/.claude/agents/{investigator,implementer,reviewer}.md` e do fluxo de marcos. Ler os arquivos de origem antes de copiar; remover caminhos pessoais e qualquer dado sensível.
- [ ] **Step 2: Mostrar ao usuário o que entrou** (lista de arquivos) e pedir confirmação de qualquer trecho do `CLAUDE.md` global antes de incluí-lo.
- [ ] **Step 3: Verificação:** o app carrega os 3 níveis sem erro no console; todas as abas renderizam.

### Task 6: Verificação de conteúdo e manifest — Marco 4

**Files:**
- Create: `scripts/check-content.mjs`, `tests/check-content.test.mjs`

**Interfaces:**
- Consumes: `validateManifest` (Task 1)
- Produces: `findSensitive(text: string) -> {rule: string, match: string}[]`; CLI `node scripts/check-content.mjs` sai com código 1 se houver erro de manifest, arquivo ausente ou conteúdo sensível.

- [ ] **Step 1: Testes que falham** para `findSensitive`: detecta e-mail, `/home/<usuario>`, `ghp_` + 36 caracteres, `sk-` + 20 ou mais caracteres, `-----BEGIN PRIVATE KEY-----`; não dispara em texto comum nem em `~/.claude/skills`.
- [ ] **Step 2: Rodar e confirmar falha.**
- [ ] **Step 3: Implementar `findSensitive` e a CLI** (valida manifest, confirma que cada `file` existe, varre todos os `.md` e o manifest).
- [ ] **Step 4: Rodar `node --test tests/` e `node scripts/check-content.mjs`; esperado: testes passam e o script sai com 0 no conteúdo atual.**

### Task 7: Responsividade, acessibilidade e revisão — Marco 4

**Files:**
- Modify: `css/style.css`, `js/app.js`

- [ ] **Step 1: Ajustar** layout para 360px de largura sem rolagem horizontal, foco visível, abas com `role="tablist"`/`tab`/`tabpanel` e setas do teclado, contraste adequado nos dois temas.
- [ ] **Step 2: Verificação manual** em largura de celular e com navegação só por teclado.
- [ ] **Step 3: Revisão independente** pelo agente `reviewer` (não o que implementou), sobre o diff completo e os itens de Review Focus. Corrigir achados e reexecutar `node --test tests/` e `node scripts/check-content.mjs`.

### Fora deste plano (Marco 5)
Deploy com `.github/workflows/pages.yml`: só após autorização explícita do usuário e confirmação do plano GitHub/visibilidade.
