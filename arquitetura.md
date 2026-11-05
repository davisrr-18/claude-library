# Arquitetura de Claude Library (modelo dev_web)

Site estático: SPA em React (Vite) que lê o catálogo de pacotes de `content/` como arquivos estáticos. Não há `server/` nem banco: o GitHub Pages só serve arquivos.

## Visão geral

```
Navegador ──► client (React + Vite, build estática) ──fetch──► content/ (manifest.json + .md)
```

- `client/` é um workspace npm. O Vite serve o site em desenvolvimento e gera `client/dist/`.
- `content/` fica na raiz, intocado: os arquivos do usuário entram sem alteração. Em desenvolvimento e na build, o conteúdo é servido ao lado do site.
- Em produção, o GitHub Pages publica a build mais `content/`, nunca a raiz do repositório.

## Estrutura de pastas (alvo)

```
claude-library/
├── CLAUDE.md
├── arquitetura.md
├── package.json                  workspaces: client
├── .claude/                      agents, skills e settings (local, fora do git)
├── .github/workflows/            ci.yml, pages.yml
├── content/                      manifest.json + um .md por peça
├── docs/                         documentação do projeto
│   └── decisions/                registros de decisão (um .md por decisão)
├── scripts/                      check-content, build do site publicável (build-site)
├── tests/                        node:test: conteúdo, docs, .gitignore, build do site
└── client/
    ├── index.html
    ├── vite.config.js
    ├── vendor/                   marked e highlight.js (versão, licença e hash em vendor/README.md)
    └── src/
        ├── main.jsx              ponto de entrada
        ├── App.jsx               rotas e layout raiz
        ├── pages/                uma pasta por rota: Home, Tier, Card, NotFound
        ├── components/           UI reutilizável, cada um com .module.css e .test.jsx: Topbar, Footer, Hero, Filters,
        │                         TierSection, CardTile, CardHero, CardAside, PieceTabs, PieceView, Markdown,
        │                         InstallPanel, CodeBlock, CopyButton, Tabs, Button, Icon, LevelDots, Callout,
        │                         Skeleton, Crumbs, Pager, EmptyState, ErrorBoundary (aviso no lugar de tela em branco)
        ├── hooks/                useLibrary, useHash, usePieceText, useInstallFiles, useTheme, useOs, useScrollFx,
        │                         useHeightVar, usePointerGlow, useEntrance
        ├── dom/                  helpers imperativos de DOM: reveal (revelação ao rolar), reducedMotion, copyText,
        │                         highlight, markdownDom (safeFragment e afins)
        ├── services/             leitura do conteúdo (único lugar que faz fetch)
        ├── test/                 apoio dos testes (conteúdo grande e determinístico para o estresse)
        ├── styles/
        │   ├── tokens.css        cores, espaços, tipografia (custom properties)
        │   └── global.css        reset e estilos base
        └── utils/                funções puras: content (front matter e validação do manifest), router, search,
                                  tabs, install, markdown, sanitize, icons (dados), format (rótulos e links), entries.
                                  Em `services/`: content (fetch do manifest e das peças).
```

`server/` não existe. Se um dia existir, segue o modelo (`routes → controllers → services`) e o deploy deixa de ser só Pages; isso é decisão a registrar.

## Camadas e responsabilidades

| Camada | Responsabilidade | Pode importar de |
|---|---|---|
| `pages/` | Montar a tela de uma rota, buscar dados via hooks | `components`, `hooks`, `services` |
| `components/` | UI reutilizável, sem saber de rotas nem de fetch | `components`, `hooks`, `dom`, `utils`, `styles` |
| `hooks/` | Estado e efeitos compartilhados | `services`, `utils`, `dom` |
| `dom/` | Helpers imperativos de DOM (sem React) | `utils` |
| `services/` | Único lugar que lê `content/` por `fetch` | `utils` |
| `utils/` | Funções puras, sem DOM e sem React | nada do projeto |

**Regra de dependência:** as setas só descem na tabela. Componentes nunca chamam `fetch`; `utils/` nunca importa React nem toca o DOM.

## Segurança do conteúdo

O repositório e o site são públicos e o Markdown vem de arquivos, então valem duas camadas, mais a lista de permissões do DOM:

- Markdown: HTML bruto escapado e URLs filtradas por `isSafeUrl`.
- Segunda camada: `sanitize` com lista de permissões.
- Texto do conteúdo entra no React como texto. O único lugar que insere HTML do conteúdo é `components/Markdown` (com `safeFragment`, de `dom/markdownDom.js`, template inerte e lista de permissões de `sanitize`), sem `dangerouslySetInnerHTML`; fora dele, injetar HTML é proibido.
- Nada de segredo no `client/`; só variáveis `VITE_` e nunca com segredo.

## Estilo e design (CSS)

- `styles/tokens.css` define `--cor-*`, `--espaco-*` (0 a 8, com meios-passos), `--fonte-*` (escala e títulos fluidos), `--raio-*` em `:root`; o CSS não usa `px` nem `rem` soltos em espaço, fonte e raio (há teste); o modo escuro redefine os mesmos tokens em `@media (prefers-color-scheme: dark)`. O mapa dos tokens antigos (`--bg`, `--accent`…) para esses nomes está em `docs/design.md`.
- Cada componente tem o próprio `.module.css`; estilo global só em `global.css`.
- Mobile-first, `@media (min-width: ...)` para ampliar. Flexbox e Grid, unidades relativas antes de `px`.
- Regras do projeto que continuam: grids com texto imprevisível usam `minmax(0, 1fr)` ou `min-width: 0`; nada com `position: absolute` sobre área rolável ou texto; `:hover` só em `@media (hover: hover)`; alvos de toque ≥ 44px em `pointer: coarse`; animações só de entrada, uma vez, e respeitando `prefers-reduced-motion`.

## Configuração e segredos

- Não há variáveis de ambiente hoje. Se surgirem, entram em `.env.example` sem valor real; `.env*` nunca é lido, editado ou versionado.

## Testes

| Onde | Ferramenta | O que cobre |
|---|---|---|
| `client/src/**/*.test.jsx` | Vitest + Testing Library | Comportamento do componente visto pelo usuário |
| `client/src/utils/*.test.js`, `dom/*.test.js` | Vitest | Funções puras e helpers de DOM; `install-exec.test.js` também roda bash (e zsh/PowerShell, se existirem) de verdade |
| `tests/` | `node:test` | Conteúdo, documentação, `.gitignore`, build do site, scripts |
| `client/src/styles/regras.test.js` | Vitest | Regras de CSS do projeto lendo os `.css` |
| `client/src/fuzz.test.js`, `estresse.test.jsx`, `integracao.test.jsx` | Vitest | Entradas hostis (XSS), 300 cards e todo o conteúdo real |

## Publicação

`npm run build:site` roda a build do client e monta `dist/` com `client/dist` (HTML, assets e `content/`) mais o `_headers` de `deploy/`. `scripts/build-site.mjs` é um portão: **recusa** build velha em relação a `content/`, dado sensível, referência do `index.html` fora da build e saída perigosa (nunca apaga a raiz, um ancestral dela ou pastas do projeto). O workflow do GitHub Pages (`.github/workflows/pages.yml`) roda lint, testes e `npm run check` e só então publica. Os caminhos do site são relativos (`base: './'`), então funciona em qualquer subcaminho.

## Regras de integridade

- Toda mudança de comportamento chega com teste novo ou ajustado (TDD: ver falhar, implementar, ver passar).
- Mudança nesta estrutura ou no modelo de dados exige atualizar este arquivo no mesmo commit.
- Dependência nova é decisão: registrar em `docs/decisions/` com motivo, e só instalar com o OK do usuário.

## Decisões

Ver `docs/decisions/`. A primeira registra a migração para este modelo. As decisões anteriores estão em `docs/decisoes.md`.
