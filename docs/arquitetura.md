# Arquitetura

Site estático de página única (SPA com rotas por `#`), sem build. O navegador carrega `index.html`, que importa `js/app.js` como módulo ES. O conteúdo é lido em tempo de execução de `content/manifest.json` e dos `.md` das peças.

```
navegador ──► index.html ──► js/app.js ──► content/manifest.json   (valida e monta o índice)
                                      └──► content/<nível>/<card>/*.md   (sob demanda, com cache)
```

## Estrutura de pastas

```
index.html            página única (meta noindex, script do tema antes do paint, aviso de file://)
css/style.css         todo o estilo (tokens, componentes, animações, responsivo)
js/                   código da interface (módulos ES)
content/              manifest.json + peças em Markdown
vendor/               marked.esm.js e highlight.js (versão, licença e hash em vendor/README.md)
scripts/              check-content.mjs (verificação de conteúdo)
tests/                testes unitários (node:test)
tools/qa/             QA com dependências isoladas (jsdom, eslint, css-tree)
docs/                 documentação (este diretório) e o histórico de spec/plano em docs/superpowers/
CLAUDE.md             regras do projeto, lidas pelo Claude Code em todo chat
```

## Módulos de `js/`

Regra: lógica em módulos **puros** (sem DOM, testáveis em Node). Tocam o DOM: `app.js`, `dom.js`, `icons.js` (cria SVG) e `code-highlight.js`; os demais são puros.

| Arquivo | Responsabilidade | Exporta (principais) | DOM |
|---|---|---|---|
| `content.js` | Constantes do modelo, front matter, validação do manifest | `TIER_IDS`, `PIECE_TYPES`, `CARD_ICONS`, `parseFrontMatter`, `validateManifest`, `pieceDescription` | não |
| `router.js` | Rotas por hash | `parseRoute`, `isAppHash`, `resolveView` | não |
| `search.js` | Busca por palavra (prefixo), tags, títulos | `normalize`, `buildIndex`, `search`, `collectTags`, `dedupeTags`, `sameTitle` | não |
| `tabs.js` | Abas por tipo de peça | `typeCounts`, `filterByType`, `groupPiecesByType`, `nextTabIndex`, `resolveTypeTab`, `TYPE_TAB_LABELS` | não |
| `install.js` | Comandos de terminal (Linux, macOS, Windows) | `installTarget`, `extractArtifact`, `installFile`, `buildInstall`, `detectOs`, `OS_LIST` | não |
| `markdown.js` | Markdown → HTML seguro (marked + renderer próprio) | `renderMarkdown`, `isSafeUrl` | não |
| `sanitize.js` | Lista de permissões de tags e atributos (2ª camada) | `isTagAllowed`, `isAttrAllowed` | não |
| `icons.js` | Ícones SVG de traço (feitos com `createElementNS`) | `icon`, `TYPE_ICON`, `ICON_NAMES` | sim |
| `code-highlight.js` | Destaque de sintaxe (carrega highlight.js sob demanda) | `highlightCodeBlocks` | sim |
| `dom.js` | Helpers de DOM | `h`, `safeFragment`, `copyText`, `copyButton`, `addCopyButtons`, `wrapTables`, `initTheme` | sim |
| `app.js` | Estado, rotas, telas, busca, abas, instalação, efeitos de rolagem | (ponto de entrada) | sim |

## Modelo de dados (`content/manifest.json`)

```json
{ "tiers": [
  { "id": "basicas | intermediarias | complexas", "title": "…", "description": "… (opcional)",
    "cards": [
      { "id": "kebab-case", "title": "…", "summary": "… (opcional)", "icon": "um de CARD_ICONS (opcional)",
        "tags": ["…"],
        "pieces": [
          { "type": "skill | claude-md | arquitetura | agente | workflow | prompt",
            "title": "…", "file": "<nível>/<card>/arquivo.md", "install": "file | block (opcional)" }
        ] } ] } ] }
```

Regras (em `validateManifest`, com testes): os 3 níveis devem existir; ids em kebab-case e únicos no pai; `file` relativo a `content/`, sem `..`, sem `/` inicial, sem espaço nas pontas nem caractere de controle; `tags` são textos não vazios; `icon` está em `CARD_ICONS`. **Um card pode ter várias peças do mesmo tipo** (ex.: 3 agentes), mas o `title` não repete dentro do tipo e o mesmo `file` não repete no card. `install: "file"` instala o arquivo inteiro (sem o front matter); `"block"` (padrão) instala o primeiro bloco ` ```markdown `.

Cada `.md` pode ter front matter (subconjunto de YAML: `chave: valor`, aspas, blocos `>` e `|`, listas `- item`). O site usa `name`/`description` e, na falta de `description`, `destino` ("Destino: …").

## Rotas

`#/` Home · `#/<nível>` página do nível · `#/<nível>/<card>` card (primeiro tipo) · `#/<nível>/<card>/<tipo>` aba do tipo. Qualquer outra coisa → "Página não encontrada". Hashes que não começam com `#/` (como `#main`) são âncoras, não rotas; abrir a página com um deles normaliza para `#/`.

## Fluxo de execução

1. `init`: tema, medição do topo, efeitos de rolagem e ponteiro; `fetch` do manifest; `validateManifest`; `buildEntries` (um registro por card) e `buildIndex`.
2. `route` (a cada `hashchange`): `resolveView(parseRoute(hash), manifest)` → `renderHome` / `renderTier` / `renderCard` / `renderNotFound`; depois foco (no `h1`, na busca com `/`, ou na aba ativa), rolagem ao topo e `playEntrance`.
3. **Home:** hero com estatísticas (contagem animada), filtros (nível e tags, AND), uma faixa por nível. Cada faixa tem **abas por tipo de peça** (Todos + os tipos existentes, com contagem); escolher um tipo filtra os cards e o link abre a aba daquele tipo. A escolha fica em `state.tierTabs` e persiste na sessão.
4. **Busca:** índice por card (título, tags, resumo, corpo). Todas as palavras devem casar como **início de palavra**, sem caixa e sem acento; ordem por relevância (título > tags/resumo > corpo). Os corpos das peças são carregados uma vez, sob demanda, na primeira digitação; falha de rede reabre a tentativa após 5 s. Com mais de 60 cards, a repintura espera 90 ms de pausa.
5. **Card:** abas (links, `aria-current`) por tipo; a aba mostra **todas** as peças do tipo, empilhadas. Cada peça: cabeçalho (título, `name`, `Destino`), botão "Copiar peça", painel de instalação (se instalável), texto renderizado. O primeiro título do corpo é removido se for igual ao título da peça. Com 2+ peças instaláveis, o card mostra também "Instalar o pacote inteiro".
6. **Instalação pelo terminal:** `installFile(piece, meta, body)` extrai caminho e conteúdo; `buildInstall(os, files)` gera bash (Linux e macOS, heredoc com delimitador único entre aspas) ou PowerShell (here-string literal, UTF-8 sem BOM, base64 se uma linha começar com `'@`). Só caminhos `.md` relativos com `[A-Za-z0-9_./-]` são aceitos.

## Segurança (camadas)

1. `renderMarkdown`: HTML bruto vira texto; links e imagens só passam por `isSafeUrl` (http/https, âncoras, relativos; recusa `javascript:`, `data:`, `//`, `\`, caracteres de controle no esquema).
2. `safeFragment`: o HTML é parseado num `<template>` (inerte) e só tags/atributos de `sanitize.js` sobrevivem; URLs são revalidadas.
3. A interface nunca usa `innerHTML` com texto do conteúdo; tudo entra por `textContent`/`h()`.
4. Comandos de terminal só embutem caminho validado; o conteúdo vai em heredoc/here-string literal (nunca interpretado pelo shell).
5. `check-content.mjs`: manifest, arquivos, dados sensíveis (e-mail, caminho pessoal, tokens GitHub/AWS/Slack/Google/Stripe/JWT, chave privada, credencial em URL, CPF) e a identidade do autor em todo arquivo; segredos aparecem mascarados na saída; symlinks são recusados; respeita o `.gitignore` em repositório git; tempo linear.
6. `index.html` tem `noindex` (reduz indexação, **não** é controle de acesso).

## CSS (`css/style.css`)

Seções: tokens e temas · topo · layout · hero · filtros · faixas de nível e cards · botões · página do card · Markdown · animações · responsivo e acessibilidade · instalar pelo terminal. Detalhes de cores, breakpoints e movimento: `design.md`.

## Publicação e CI

- **CI** (`.github/workflows/ci.yml`, ativo): `npm test` e `npm run check` em Linux, macOS e Windows a cada push e pull request. É onde os comandos de instalação rodam de verdade no PowerShell e no zsh.
- **O que é publicado:** `npm run build:site` (`scripts/build-site.mjs`) monta `dist/` só com `index.html`, `css/`, `js/`, `vendor/` e `content/` mais `_headers` (de `deploy/_headers`). Antes de copiar, ele verifica o conteúdo (`checkContent`), o manifest e as referências do `index.html`, e **recusa construir** se algo estiver errado; a pasta de saída é apagada, então só é aceita se não existir, estiver vazia ou parecer um build anterior. Todos os caminhos do site são relativos, então funciona em qualquer subcaminho.
- **Destino: GitHub Pages** (`.github/workflows/pages.yml`, ativo). A cada push em `main`: job `verificar` (`npm test` e `npm run check`) e, se passar, job `publicar` (`npm run build:site` → `dist/` → artefato → deploy). Ações fixadas por hash de commit. O site fica em `https://<usuario>.github.io/<repositório>/`; todos os caminhos são relativos, então o subcaminho funciona.
- O repositório é **público** (o plano gratuito só permite Pages assim). O site é público para quem tiver a URL.
- **Alternativa não usada:** Cloudflare Pages com login (Cloudflare Access), guia em [`deploy/cloudflare.md`](deploy/cloudflare.md): mantém o repositório privado e o site só abre após login.
