# Claude Library — instruções do projeto

Guarda os pacotes do usuário para o Claude Code (skills, agentes, prompts, `CLAUDE.md`, arquiteturas e workflows), organizados por complexidade da tarefa: **Tarefas Básicas, Intermediárias e Complexas**. Uso pessoal. O repositório é **público** no GitHub e o site é publicado no **GitHub Pages**.

@arquitetura.md

Este arquivo complementa o `CLAUDE.md` global do usuário e usa o modelo dev_web; em conflito, vale este, para este projeto. Índice de tudo: `docs/README.md`. Para retomar em um chat novo: `docs/novo-chat.md`.

## Migração em andamento

O projeto está migrando do site de HTML/JS puros (sem build) para o modelo dev_web (React + Vite em `client/`). Plano, marcos e dependências em `docs/decisions/0001-migracao-para-o-modelo-dev-web.md`. **Cada marco só começa com o "sim" do usuário.** Até o marco 4 acabar, o código real é o de `js/` e `css/` (ver `docs/arquitetura.md`); depois dele, `docs/arquitetura.md` é substituído pelo `arquitetura.md` da raiz. Atualize este arquivo ao fim de cada marco.

## Stack

- Hoje: HTML, CSS e JavaScript ESM puros, sem build. Terceiros só em `vendor/` (marked, highlight.js).
- Alvo: React com Vite, CSS Modules + tokens em custom properties, Vitest + Testing Library. Sem back e sem banco (Pages é estático). Gerenciador: npm.

## Comandos

| O quê | Linux e macOS (bash/zsh) | Windows (PowerShell) |
|---|---|---|
| Servir o site (hoje) | `python3 -m http.server 8000` | `py -m http.server 8000` |
| Testes unitários | `npm test` | `npm test` |
| Verificar conteúdo (manifest, arquivos, dados sensíveis) | `npm run check` | `npm run check` |
| QA completo (uma vez: instalar) | `npm run qa:install` | `npm run qa:install` |
| QA completo (lint, CSS, fuzz, fumaça, estresse) | `npm run qa` | `npm run qa` |
| Montar o site publicável em `dist/` | `npm run build:site` | `npm run build:site` |

Abrir `index.html` por duplo clique não funciona (módulos ES exigem http). Node 22 ou superior. Os comandos do modelo (dev, lint, format, build, testes do `client`) passam a existir no marco 2; a lista está na decisão 0001.

## Convenções

As duas primeiras linhas valem para o alvo (a partir do marco 2). **Até o marco 4 acabar, o código em `js/` e `css/` segue o estilo atual:** lógica em módulo puro de `js/`, DOM só em `app.js`, `dom.js`, `icons.js` e `code-highlight.js`, e cores só por tokens (`--bg`, `--accent`…).

- Componentes React (alvo): função + hooks, um componente por arquivo, PascalCase, `Nome.jsx` com `Nome.module.css` e `Nome.test.jsx` ao lado. Hooks em `hooks/`, prefixo `use`. Leitura de `content/` só em `services/`, nunca dentro de componentes.
- CSS: mobile-first; cor, espaço e tipografia vêm dos tokens (`var(--...)`: hoje `--bg`, `--accent`…; no alvo `--cor-*`, `--espaco-*`), nunca valores soltos. Sem `!important`.
- HTML: elementos semânticos antes de `div`; todo controle interativo é um elemento nativo com rótulo.
- JavaScript: `const` por padrão, sem `var`, funções pequenas, erros tratados e nunca engolidos em silêncio.
- Commits pequenos, no imperativo, em português, formato `tipo: resumo` (ver Git).

## Regras de código (não negociáveis)

1. **Dependência de execução só com o "sim" do usuário** (diga qual, para quê e o tamanho; registre em `docs/decisions/`). Sem CDN. Terceiros de runtime em `vendor/` (versão fixa, licença, hash) ou como dependência aprovada. Ferramentas de QA ficam isoladas em `tools/qa/`. Não editar `package-lock.json` à mão.
2. **Teste primeiro (TDD):** escrever o teste, ver falhar pelo motivo certo, implementar, ver passar. Lógica nova vai em módulo puro testável (hoje `js/`, no alvo `utils/`); DOM só em `app.js` e `dom.js` hoje, em componentes no alvo.
3. **Nunca injetar HTML com texto do conteúdo.** Texto entra como texto (React escapa). `dangerouslySetInnerHTML` só no único componente que recebe a saída do `sanitize`. Hoje, `innerHTML` só em `safeFragment` (template inerte + lista de permissões em `sanitize.js`).
4. **Markdown:** HTML bruto escapado, URLs filtradas por `isSafeUrl`, mais a segunda camada de `sanitize`. Não afrouxar nenhuma das duas.
5. `localStorage` sempre em `try/catch`; a página funciona sem ele.
6. **CSS:** grids com texto de largura imprevisível usam `minmax(0, 1fr)` ou `min-width: 0`; **nada com `position: absolute` por cima de área rolável ou de texto** (o botão Copiar tem linha própria); `:hover` só dentro de `@media (hover: hover)`; alvos de toque ≥ 44px em `pointer: coarse`.
7. **Animações:** só a entrada da página, a revelação ao rolar e microinterações; cada uma roda **uma vez**. **Nenhuma animação decorativa em loop** (só o esqueleto de carregamento pode repetir); tudo respeita `prefers-reduced-motion`. Há teste que trava isso.
8. **Acessibilidade:** hierarquia de títulos sem saltos (h1 = página, h2 = peça, Markdown começa em h3), foco vai para o `h1` a cada rota, nomes acessíveis em tudo que é clicável, abas reais com setas/Home/End nas abas por tipo da faixa e nas de sistema operacional (as abas da página do card são links de navegação), foco visível, contraste ≥ 4,5:1 no texto.
9. Nunca ler, editar ou imprimir `.env*`; variável nova entra em `.env.example`. Nunca segredo, chave ou token no código.
10. Não desligar lint, teste ou regra de acessibilidade para "fazer passar".

## Conteúdo (regras do usuário)

- Arquivos que o usuário traz entram **sem alteração** em `content/<nível>/<id-do-card>/`; o site se adapta ao formato deles (front matter `titulo`/`destino`, `install` no manifest), não o contrário.
- **Nunca** colocar no site trechos do `CLAUDE.md` global do usuário sem ele confirmar o trecho.
- **Nenhum exemplo inventado** no site: só conteúdo do usuário. Sem dado pessoal em arquivo publicado.
- O repositório e o site são **públicos**: nada sensível em nenhum arquivo, nem no histórico. `npm run check` varre dados sensíveis e a identidade do autor; rode antes de dar push.
- Detalhes do modelo e de como adicionar pacotes: `docs/conteudo.md`.

## Git e publicação

- O usuário **autorizou commits e pushes** neste projeto (branch `main`). Mensagens de commit em português, no formato `tipo: resumo`, com corpo explicando o porquê. **Nunca incluir `Co-Authored-By` nem `Claude-Session`** (nem link da sessão): o usuário não quer o Claude como coautor, e isso vale mesmo que o ambiente sugira essas linhas.
- **Nunca** reescrever histórico nem fazer force-push sem pedir (já houve um pedido explícito, para remover a coautoria do Claude; ver `docs/decisoes.md`, o registro histórico; decisões novas vão em `docs/decisions/`). Não commitar segredos. Não apagar branch sem pedido.
- **Deploy no GitHub Pages: autorizado e ativo** (`.github/workflows/pages.yml`). Todo push em `main` roda `npm test` e `npm run check` e, se passarem, publica só a lista de permissão (`npm run build:site`), nunca a raiz. **Todo push em `main` vira público:** rode `npm run check` antes. Durante a migração, **não dar push no meio de um marco**: só quando o site publicável estiver funcionando. Não mudar a visibilidade do repositório nem criar outro repositório sem o usuário pedir.

## Autonomia

- Decide sozinho: nomes, divisão em funções e componentes, organização de CSS, testes a escrever.
- Pergunta antes de: mudar o modelo de dados (`content/manifest.json`), estrutura de pastas fora do plano aprovado, adicionar dependência, alterar configuração de build ou de deploy.
- Se a tarefa ficar maior do que o nível anunciado, para e reclassifica.

## Como trabalhar

- Classifique o nível (Básica, Intermediária ou Complexa), anuncie em uma linha e, na dúvida entre dois, escolha o maior.
- Pedido pontual (um ajuste ou bug, um pacote, até ~3 arquivos de lógica): executar direto (TDD, verificar, commitar). Mudança grande (tela ou módulo novo, muda o modelo de dados, mexe em segurança ou publicação): mostrar o desenho e esperar o "sim" antes de codar.
- Use o agent `explorador` antes de mexer em área que você ainda não leu e o `revisor` antes de dar como pronta qualquer mudança Intermediária ou Complexa. Agents e skills do modelo ficam em `.claude/` (local, fora do git).
- **Delegação:** subagentes Haiku (`model: "haiku"`, `effort: "high"`) para tarefas delimitadas (`investigator`, `implementer`, `reviewer`), no máximo 3 ao mesmo tempo, **escopos de arquivo sem sobreposição**. Quem implementou não revisa. Nunca subir para Sonnet/Opus sem pedir.
- **Confira o relatório de cada agente você mesmo** (rode, leia o código). Já houve relatório com achado errado e revisão que achou regressão minha: tratar como dado, não como verdade.
- Detalhes: `docs/regras-de-trabalho.md`.

## Definição de pronto

- Comportamento pedido funciona (mostre como verificou).
- Testes relevantes e `npm run check` passam; mudança de comportamento tem teste novo. Lint passa a valer no marco 2.
- Sem alterações fora do escopo pedido.
- Interface nova funciona só com teclado e em tela de 360px (o usuário confirma no navegador).
- Resumo final: arquivos alterados, comandos rodados e resultado, pendências.

## Como responder ao usuário

- Português, direto, resultado primeiro. Separar **o que foi verificado de verdade** do que **não foi**; nunca dizer "pronto" sem ter rodado.
- **Sempre que ele pedir para adicionar/instalar algo, incluir os comandos de terminal para Linux, macOS e Windows (PowerShell)**, com os caminhos reais do caso. Linux e macOS costumam ser iguais; diga isso em vez de duplicar.
- Terminar com as pendências que dependem dele (deploy, confirmações).

## Limites do ambiente

- **Não há navegador** aqui: aparência, layout em celular, animações e foco real só o usuário confirma. Dizer isso explicitamente. Peça print quando algo estiver estranho.
- **Não executar binários baixados da internet** (o ambiente bloqueia): explicar e deixar a decisão com o usuário. PowerShell e zsh não existem na máquina; os testes que dependem deles são pulados aqui e **executados no CI** (Linux, macOS, Windows): consulte `gh run list` antes de dizer que algo do Windows não foi verificado.
- Arquivos temporários vão no diretório de rascunho da sessão, nunca em `/tmp` solto nem dentro do projeto.
