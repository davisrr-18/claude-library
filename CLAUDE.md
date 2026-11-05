# Claude Library — instruções do projeto

Guarda os pacotes do usuário para o Claude Code (skills, agentes, prompts, `CLAUDE.md`, arquiteturas e workflows), organizados por complexidade da tarefa: **Tarefas Básicas, Intermediárias e Complexas**. Uso pessoal. O repositório é **público** no GitHub e o site é publicado no **GitHub Pages**.

@arquitetura.md

Este arquivo complementa o `CLAUDE.md` global do usuário e usa o modelo dev_web; em conflito, vale este, para este projeto. Índice de tudo: `docs/README.md`. Para retomar em um chat novo: `docs/novo-chat.md`.

## Histórico

O site começou em HTML/JS puros, sem build, e foi migrado para o modelo dev_web (React + Vite em `client/`). Plano, marcos, dependências e o que ficou em aberto: `docs/decisions/0001-migracao-para-o-modelo-dev-web.md` (concluída). Decisões anteriores: `docs/decisoes.md`.

## Stack

- React com Vite, CSS Modules + tokens em custom properties, Vitest + Testing Library, ESLint (com `react-hooks` e `jsx-a11y`) e Prettier. Sem back e sem banco (o GitHub Pages é estático). Gerenciador: npm (workspace `client/`). Terceiros de execução: `react`, `react-dom` e, em `client/vendor/`, `marked` e `highlight.js` (versão, licença e hash em `client/vendor/README.md`).

## Comandos

| O quê | Linux e macOS (bash/zsh) | Windows (PowerShell) |
|---|---|---|
| Instalar (uma vez) | `npm install` | `npm install` |
| Dev do `client` (Vite, porta 5173) | `npm run dev` | `npm run dev` |
| Testes (`tests/` com `node:test` + Vitest do `client`) | `npm test` | `npm test` |
| Lint e formatação do `client` | `npm run lint` · `npm run format` | `npm run lint` · `npm run format` |
| Build do `client` em `client/dist/` | `npm run build` | `npm run build` |
| Montar o site publicável em `dist/` (build + verificação) | `npm run build:site` | `npm run build:site` |
| Verificar conteúdo (manifest, arquivos, dados sensíveis) | `npm run check` | `npm run check` |

Abrir o HTML da build por duplo clique não funciona (módulos ES exigem http): use `npm run dev`. Node 22.22 ou superior (exigência do jsdom). `npm test` roda `tests/` e o Vitest do `client`; o lint cobre só `client/`. Detalhes de cada verificação: `docs/qualidade.md`.

## Convenções

- Componentes React: função + hooks, um componente por arquivo, PascalCase, `Nome.jsx` com `Nome.module.css` e `Nome.test.jsx` ao lado. Hooks em `hooks/`, prefixo `use`. Leitura de `content/` só em `services/`, nunca dentro de componentes.
- CSS: mobile-first; cor, espaço e tipografia vêm dos tokens (`var(--...)`: `--cor-*`, `--espaco-*`, `--raio-*`, `--fonte-*`), nunca valores soltos. Sem `!important`.
- HTML: elementos semânticos antes de `div`; todo controle interativo é um elemento nativo com rótulo.
- JavaScript: `const` por padrão, sem `var`, funções pequenas, erros tratados e nunca engolidos em silêncio.
- Commits pequenos, no imperativo, em português, formato `tipo: resumo` (ver Git).

## Regras de código (não negociáveis)

1. **Dependência de execução só com o "sim" do usuário** (diga qual, para quê e o tamanho; registre em `docs/decisions/`). Sem CDN. Terceiros de runtime em `client/vendor/` (versão fixa, licença, hash) ou como dependência aprovada. Não editar `package-lock.json` à mão.
2. **Teste primeiro (TDD):** escrever o teste, ver falhar pelo motivo certo, implementar, ver passar. Lógica nova vai em módulo puro testável em `client/src/utils/`; DOM só em componentes e hooks.
3. **Nunca injetar HTML com texto do conteúdo.** Texto entra como texto (React escapa). Sem `dangerouslySetInnerHTML`. O HTML do Markdown só entra em `components/Markdown`, por `safeFragment` (template inerte + lista de permissões de `sanitize`).
4. **Markdown:** HTML bruto escapado, URLs filtradas por `isSafeUrl`, mais a segunda camada de `sanitize`. Não afrouxar nenhuma das duas.
5. `localStorage` sempre em `try/catch`; a página funciona sem ele.
6. **CSS:** cor, espaço, fonte e raio só por token, sem `px`/`rem` soltos em padding, margin, gap, font-size e border-radius (há teste); todo `animation` e `transition` dentro de `@media (prefers-reduced-motion: no-preference)` e `:hover` dentro de `@media (hover: hover)` (há teste, e `!important` é proibido); grids com texto de largura imprevisível usam `minmax(0, 1fr)` ou `min-width: 0`; **nada com `position: absolute` por cima de área rolável ou de texto** (o botão Copiar tem linha própria); `:hover` só dentro de `@media (hover: hover)`; alvos de toque ≥ 44px em `pointer: coarse`.
7. **Animações:** só a entrada da página, a revelação ao rolar e microinterações; cada uma roda **uma vez**. **Nenhuma animação decorativa em loop** (só o esqueleto de carregamento pode repetir); tudo respeita `prefers-reduced-motion`. Há teste que trava isso (`client/src/styles/regras.test.js`).
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
- **Deploy no GitHub Pages: autorizado e ativo** (`.github/workflows/pages.yml`). Todo push em `main` roda `npm ci`, `npm run lint`, `npm test` e `npm run check` e, se passarem, publica só a lista de permissão (`npm run build:site`), nunca a raiz. **Todo push em `main` vira público:** rode `npm run check` antes. Não mudar a visibilidade do repositório nem criar outro repositório sem o usuário pedir.

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
- Testes relevantes e `npm run check` passam; mudança de comportamento tem teste novo. `npm run lint` passa.
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
