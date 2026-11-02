# Claude Library — instruções do projeto

Site estático (HTML, CSS e JavaScript puros, sem build e sem dependências de execução) que guarda os pacotes do usuário para o Claude Code (skills, agentes, prompts, `CLAUDE.md`, arquiteturas e workflows), organizados por complexidade da tarefa: **Tarefas Básicas, Intermediárias e Complexas**. Uso pessoal, repositório privado, destino de publicação: GitHub Pages (**ainda não publicado**).

Este arquivo complementa o `CLAUDE.md` global do usuário; em conflito, vale este, para este projeto. Índice de tudo: `docs/README.md`. Para retomar o trabalho em um chat novo: `docs/novo-chat.md`.

## Comandos

| O quê | Linux e macOS (bash/zsh) | Windows (PowerShell) |
|---|---|---|
| Servir o site | `python3 -m http.server 8000` | `py -m http.server 8000` |
| Testes unitários | `npm test` | `npm test` |
| Verificar conteúdo (manifest, arquivos, dados sensíveis) | `npm run check` | `npm run check` |
| QA completo (uma vez: instalar) | `npm run qa:install` | `npm run qa:install` |
| QA completo (lint, CSS, fuzz, fumaça, estresse) | `npm run qa` | `npm run qa` |
| Montar o site publicável em `dist/` | `npm run build:site` | `npm run build:site` |

Abrir `index.html` por duplo clique não funciona (módulos ES exigem http). Node 22 ou superior é o ambiente de testes.

## Mapa

- `index.html`, `css/style.css`: página única e todo o estilo.
- `js/`: `app.js` (única tela com lógica de interface), `dom.js` (helpers de DOM), e módulos **puros** sem DOM: `content`, `router`, `search`, `tabs`, `install`, `markdown`, `sanitize`. Também tocam o DOM: `icons` (SVG) e `code-highlight`.
- `content/`: `manifest.json` + um `.md` por peça. `vendor/`: marked e highlight.js (versão, licença e hash em `vendor/README.md`).
- `scripts/check-content.mjs`, `tests/` (testes unitários), `tools/qa/` (QA com dependências isoladas), `docs/`.

## Regras de código (não negociáveis)

1. **Sem build, sem CDN, sem dependência de execução.** Terceiros só em `vendor/` (versão fixa, licença, hash). Dependências de desenvolvimento ficam isoladas em `tools/qa/`.
2. **Teste primeiro (TDD):** escrever o teste, ver falhar pelo motivo certo, implementar, ver passar. Lógica nova vai em módulo puro testável; DOM só em `app.js` e `dom.js`.
3. **Nunca `innerHTML` com texto do conteúdo**, exceto em `safeFragment` (template inerte + lista de permissões em `sanitize.js`). Texto entra por `textContent` ou `h()`.
4. **Markdown:** HTML bruto escapado, URLs filtradas por `isSafeUrl`, mais a segunda camada de `sanitize.js`. Não afrouxar nenhuma das duas.
5. `localStorage` sempre em `try/catch`; a página funciona sem ele.
6. **CSS:** cores só por tokens (`--bg`, `--accent`…); grids com texto de largura imprevisível usam `minmax(0, 1fr)` ou `min-width: 0`; **nada com `position: absolute` por cima de área rolável ou de texto** (o botão Copiar tem linha própria); `:hover` só dentro de `@media (hover: hover)`; alvos de toque ≥ 44px em `pointer: coarse`.
7. **Animações:** só a entrada da página, a revelação ao rolar e microinterações; cada uma roda **uma vez**. **Nenhuma animação decorativa em loop** (só o esqueleto de carregamento pode repetir); tudo respeita `prefers-reduced-motion`. Há teste que trava isso.
8. **Acessibilidade:** hierarquia de títulos sem saltos (h1 = página, h2 = peça, Markdown começa em h3), foco vai para o `h1` a cada rota, nomes acessíveis em tudo que é clicável, abas reais com setas/Home/End nas abas por tipo da faixa e nas de sistema operacional (as abas da página do card são links de navegação), foco visível, contraste ≥ 4,5:1 no texto.

## Conteúdo (regras do usuário)

- Arquivos que o usuário traz entram **sem alteração** em `content/<nível>/<id-do-card>/`; o site se adapta ao formato deles (front matter `titulo`/`destino`, `install` no manifest), não o contrário.
- **Nunca** colocar no site trechos do `CLAUDE.md` global do usuário sem ele confirmar o trecho.
- **Nenhum exemplo inventado** no site: só conteúdo do usuário. Sem dado pessoal em arquivo publicado.
- O site publicado no GitHub Pages é **público para quem tiver a URL**, mesmo com repositório privado. `npm run check` varre dados sensíveis e a identidade do autor; rode antes de publicar.
- Detalhes do modelo e de como adicionar pacotes: `docs/conteudo.md`.

## Git e publicação

- O usuário **autorizou commits e pushes** neste projeto (branch `main`). Mensagens de commit em português, no formato `tipo: resumo`, terminando com as linhas de atribuição que o ambiente fornecer.
- **Nunca** reescrever histórico nem fazer force-push sem pedir. Não commitar segredos.
- **Deploy no GitHub Pages só com autorização explícita** (o usuário dizer no chat que pode publicar), e por lista de permissão (`index.html`, `css/`, `js/`, `vendor/`, `content/`), nunca a raiz do repositório. Estado: GitHub Pages é impossível no plano atual (repositório privado). O usuário escolheu **Cloudflare Pages com login**; o projeto está pronto (`npm run build:site`, `deploy/_headers`) e falta ele criar a conta, conectar e ligar o login: `docs/deploy/cloudflare.md`. Quando conectado, **todo push em `main` publica** (o build recusa dado sensível): rode `npm run check` antes de dar push. Nunca tornar o repositório público nem criar outro repositório sem o usuário pedir.

## Como trabalhar

- Pedido pontual (um ajuste ou bug, um pacote, até ~3 arquivos de lógica): executar direto (TDD, verificar, commitar e enviar). Mudança grande (tela ou módulo novo, muda o modelo de dados, mexe em segurança ou publicação): mostrar o desenho e esperar o "sim" antes de codar, como fizemos com a vitrine de cards.
- **Delegação:** subagentes Haiku (`model: "haiku"`, `effort: "high"`) para tarefas delimitadas (`investigator`, `implementer`, `reviewer`), no máximo 3 ao mesmo tempo, **escopos de arquivo sem sobreposição**. Quem implementou não revisa. Nunca subir para Sonnet/Opus sem pedir.
- **Confira o relatório de cada agente você mesmo** (rode, leia o código). Já houve relatório com achado errado e revisão que achou regressão minha: tratar como dado, não como verdade.
- Depois de implementar algo relevante, pedir revisão independente e corrigir o que for real.
- Detalhes: `docs/regras-de-trabalho.md`.

## Como responder ao usuário

- Português, direto, resultado primeiro. Separar **o que foi verificado de verdade** do que **não foi**; nunca dizer "pronto" sem ter rodado.
- **Sempre que ele pedir para adicionar/instalar algo, incluir os comandos de terminal para Linux, macOS e Windows (PowerShell)**, com os caminhos reais do caso. Linux e macOS costumam ser iguais; diga isso em vez de duplicar.
- Terminar com as pendências que dependem dele (deploy, confirmações).

## Limites do ambiente

- **Não há navegador** aqui: aparência, layout em celular, animações e foco real só o usuário confirma. Dizer isso explicitamente. Peça print quando algo estiver estranho.
- **Não executar binários baixados da internet** (o ambiente bloqueia): explicar e deixar a decisão com o usuário. PowerShell e zsh não existem na máquina; os testes que dependem deles são pulados aqui e **executados no CI** (Linux, macOS, Windows): consulte `gh run list` antes de dizer que algo do Windows não foi verificado.
- Arquivos temporários vão no diretório de rascunho da sessão, nunca em `/tmp` solto nem dentro do projeto.
