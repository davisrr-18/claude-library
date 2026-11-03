# Arquitetura de Claude Library (modelo dev_web)

> **Estado:** alvo da migração em andamento (ver `docs/decisions/0001-migracao-para-o-modelo-dev-web.md`). Enquanto o marco 4 não termina, o código real ainda é o descrito em `docs/arquitetura.md` (HTML/JS puros em `js/` e `css/`). Este arquivo diz para onde estamos indo; leia os dois.

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
├── scripts/                      check-content, build do site publicável
├── tests/                        node:test: conteúdo, docs, .gitignore, build do site
├── tools/qa/                     QA com dependências isoladas
├── vendor/                       marked e highlight.js (versão, licença e hash)
└── client/
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── main.jsx              ponto de entrada
        ├── App.jsx               rotas e layout raiz
        ├── pages/                uma pasta por rota (Home, Card)
        ├── components/           UI reutilizável (cada um com .module.css e .test.jsx)
        ├── hooks/                estado e efeitos compartilhados (useXxx)
        ├── services/             leitura do conteúdo (único lugar que faz fetch)
        ├── styles/
        │   ├── tokens.css        cores, espaços, tipografia (custom properties)
        │   └── global.css        reset e estilos base
        └── utils/                funções puras (router, search, tabs, install, markdown, sanitize)
```

`server/` não existe. Se um dia existir, segue o modelo (`routes → controllers → services`) e o deploy deixa de ser só Pages; isso é decisão a registrar.

## Camadas e responsabilidades

| Camada | Responsabilidade | Pode importar de |
|---|---|---|
| `pages/` | Montar a tela de uma rota, buscar dados via hooks | `components`, `hooks`, `services` |
| `components/` | UI reutilizável, sem saber de rotas nem de fetch | `components`, `hooks`, `utils`, `styles` |
| `hooks/` | Estado e efeitos compartilhados | `services`, `utils` |
| `services/` | Único lugar que lê `content/` por `fetch` | `utils` |
| `utils/` | Funções puras, sem DOM e sem React | nada do projeto |

**Regra de dependência:** as setas só descem na tabela. Componentes nunca chamam `fetch`; `utils/` nunca importa React nem toca o DOM.

## Segurança do conteúdo (inalterada pela migração)

O repositório e o site são públicos e o Markdown vem de arquivos, então valem as duas camadas de hoje:

- Markdown: HTML bruto escapado e URLs filtradas por `isSafeUrl`.
- Segunda camada: `sanitize` com lista de permissões.
- Texto do conteúdo entra no React como texto. `dangerouslySetInnerHTML` só em um componente, e só com a saída do `sanitize`; fora disso é proibido.
- Nada de segredo no `client/`; só variáveis `VITE_` e nunca com segredo.

## Estilo e design (CSS)

- `styles/tokens.css` define `--cor-*`, `--espaco-*`, `--fonte-*`, `--raio-*` em `:root`; o modo escuro redefine os mesmos tokens em `@media (prefers-color-scheme: dark)`. O mapa dos tokens atuais (`--bg`, `--accent`…) para esses nomes é feito no marco 2 e registrado em `docs/design.md`.
- Cada componente tem o próprio `.module.css`; estilo global só em `global.css`.
- Mobile-first, `@media (min-width: ...)` para ampliar. Flexbox e Grid, unidades relativas antes de `px`.
- Regras do projeto que continuam: grids com texto imprevisível usam `minmax(0, 1fr)` ou `min-width: 0`; nada com `position: absolute` sobre área rolável ou texto; `:hover` só em `@media (hover: hover)`; alvos de toque ≥ 44px em `pointer: coarse`; animações só de entrada, uma vez, e respeitando `prefers-reduced-motion`.

## Configuração e segredos

- Não há variáveis de ambiente hoje. Se surgirem, entram em `.env.example` sem valor real; `.env*` nunca é lido, editado ou versionado.

## Testes

| Onde | Ferramenta | O que cobre |
|---|---|---|
| `client/src/**/*.test.jsx` | Vitest + Testing Library | Comportamento do componente visto pelo usuário |
| `client/src/utils/*.test.js` | Vitest | Funções puras |
| `tests/` | `node:test` | Conteúdo, documentação, `.gitignore`, build do site, scripts |
| `tools/qa/` | Playwright e afins (isolado) | Lint, CSS, fuzz, fumaça, estresse |

## Regras de integridade

- Toda mudança de comportamento chega com teste novo ou ajustado (TDD: ver falhar, implementar, ver passar).
- Mudança nesta estrutura ou no modelo de dados exige atualizar este arquivo no mesmo commit.
- Dependência nova é decisão: registrar em `docs/decisions/` com motivo, e só instalar com o OK do usuário.

## Decisões

Ver `docs/decisions/`. A primeira registra esta migração. As decisões anteriores à migração estão em `docs/decisoes.md`.
