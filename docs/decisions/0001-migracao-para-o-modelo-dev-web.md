# 0001 — Migração para o modelo dev_web

Data: 2026-11-03. Status: **concluída** (marcos 1 a 5).

## Decisão

Adotar a estrutura do modelo dev_web (CLAUDE.md e `arquitetura.md` na raiz, `client/` com React + Vite, CSS Modules + tokens, Vitest, `docs/decisions/`) no lugar do site de HTML/JS puros sem build.

Respostas do usuário que fixaram o escopo:

- **Front:** React + Vite em `client/` (reescrita de `js/` e `css/` em componentes).
- **Back:** sem `server/` por ora. O GitHub Pages só serve arquivos estáticos, e o conteúdo continua em `content/`.
- **Pacotes:** npm, com workspace `client`.
- **Regras:** fundir. Valem o CLAUDE.md e o `arquitetura.md` do modelo mais as regras próprias do projeto (conteúdo público, dados sensíveis, git, deploy, forma de trabalhar).

## O que muda

- Cai a regra "sem build e sem dependência de execução". Entram dependências de execução (React) e de desenvolvimento (Vite, Vitest, ESLint, Prettier), cada uma aprovada pelo usuário antes de instalar.
- O deploy deixa de publicar `index.html`, `css/` e `js/` e passa a publicar a build do Vite mais `content/` e `vendor/` conforme a necessidade.
- Testes de módulos puros passam de `node:test` para Vitest quando o módulo migra. Testes de conteúdo, documentação, `.gitignore` e build do site continuam em `node:test`.

- **Testes e scripts que dependem de `js/` e `css/`** (marcos 3 e 4): 9 arquivos de `tests/` importam de `../js/`, `tests/css-layout.test.mjs` e `tests/css-motion.test.mjs` leem `css/style.css` (o segundo trava a regra de animação) e `scripts/check-content.mjs` importa `../js/content.js`. Cada módulo que migra leva o teste junto, e o teste de CSS passa a ler os `.module.css` e `tokens.css`. Nenhuma regra travada por teste pode ficar sem teste ao fim do marco 4. O `check-content` passa a importar `validateManifest` do novo lugar (`utils/`).
- **Dois `arquitetura.md`:** o da raiz é o alvo; `docs/arquitetura.md` descreve o código atual e é conferido por `tests/docs.test.mjs`. O de `docs/` é apagado ao fim do marco 4. Do mesmo modo, `docs/decisoes.md` é o histórico até aqui e `docs/decisions/` recebe as decisões novas.

## O que não muda

Conteúdo público e sem dado pessoal, `npm run check`, as duas camadas de sanitização do Markdown, `localStorage` em `try/catch`, acessibilidade, regras de CSS e de animação, commits em português sem coautoria do Claude, e a regra de que todo push em `main` vira público.

## Marcos

1. **Base:** CLAUDE.md fundido, `arquitetura.md` novo, esta decisão. Sem código. (concluído)
2. **Esqueleto:** `client/` com Vite, tokens, página vazia; dependências aprovadas; CI com lint, testes e build. (concluído) No workflow do Pages só o portão de verificação muda (`npm ci` e `npm run lint` antes dos testes); a publicação continua sendo o site antigo, para um push no meio da migração não colocar uma página vazia no ar. A troca para `client/dist` é do marco 5.
3. **Lógica:** módulos puros para `utils/` e `services/`, testes para Vitest, mantendo TDD. (concluído) Os módulos foram **copiados**, não movidos, porque o site publicado ainda usa `js/`. `js/` fica **congelado** até o marco 5, quando é apagado junto com os testes legados dos módulos copiados e o `check-content` passa a importar de `client/src/utils/content.js`. Correção em módulo copiado vale nos dois lugares até lá.
4. **Interface:** `app.js` e `style.css` viram componentes e CSS Modules. (concluído, falta a conferência visual do usuário) `client/` tem a interface inteira: Home com busca e filtros, página do nível, página do card, instalação pelo terminal e página não encontrada. O site publicado ainda é o antigo; a troca é o marco 5.
5. **Fechamento:** publicação trocada para `client/dist`, legado apagado, `vendor/` movido para `client/vendor/`. (concluído) `js/`, `css/`, o `index.html` da raiz, os testes legados e `docs/arquitetura.md` foram removidos. O `check-content` passou a importar `validateManifest` de `client/src/utils/content.js`. `build:site` roda a build do client e `scripts/build-site.mjs` monta `dist/` com `client/dist` mais o `_headers`, recusando build velha. O workflow do Pages instala com `npm ci` e publica essa saída.
   - **`tools/qa/` apagado, não migrado:** a suíte de QA era toda sobre o DOM do site antigo (`app.js`, `style.css`). O que tinha valor foi portado para o Vitest do `client`: o fuzz (XSS em 4000 documentos, front matter, mutações do manifest, rotas, busca, Markdown patológico) virou `fuzz.test.js` e o estresse de 300 cards virou `estresse.test.jsx`. Lint, CSS e fumaça são cobertos por `npm run lint`, `styles/regras.test.js`, `App.test.jsx`, `integracao.test.jsx` e os testes de cada componente. Não foi portado: o ataque de ReDoS ao `findSensitive` (já coberto por `tests/check-content-perf.test.mjs`) e o `css-check` por `css-tree` (a build do Vite já rejeita CSS inválido).

## Comandos alvo (valem a partir do marco 2)

Instalar `npm install`; dev `npm run dev`; testes `npm test` e `npm run test -w client`; lint `npm run lint`; formatar `npm run format`; build `npm run build`. Porta do front: 5173 (padrão do Vite). Não há porta de back.

## Dependências propostas (marco 2, todas dependem do OK do usuário)

| Pacote | Para quê |
|---|---|
| `react`, `react-dom` | interface |
| `vite`, `@vitejs/plugin-react` | build e servidor de dev |
| `vitest`, `@testing-library/react`, `jsdom` | testes do front |
| `eslint`, `prettier` | lint e formatação |

`marked` e `highlight.js` ficam em `vendor/` (versão, licença e hash fixos). Roteamento: manter o `router.js` por hash, sem `react-router`. Os tamanhos são conferidos com `npm view` antes de instalar.

## Estado das dependências (marco 2)

Instaladas com o OK do usuário: `react`, `react-dom` (execução); `vite`, `@vitejs/plugin-react`, `vitest`, `@testing-library/react`, `jsdom`, `eslint`, `prettier` (desenvolvimento). `@testing-library/dom` entra sozinho, como dependência obrigatória (peer) do Testing Library. `package-lock.json` gerado pelo npm.

Marco 4, instaladas com o OK do usuário: `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y` e `@testing-library/jest-dom`. O lint agora confere hooks e acessibilidade em JSX (o `shortcut` antigo de `eslint.config.js` foi removido). **`eslint` voltou para a versão 9**: `eslint-plugin-react` e `eslint-plugin-jsx-a11y` declaram suporte só até a 9, e o npm recusou a instalação com a 10.

## Como a interface foi migrada (marco 4)

- **Estado:** `useLibrary` (manifest, cards, índice e carga dos textos para a busca), `useHash` (rota), e no `App` os filtros e as abas por nível, para voltarem iguais ao navegar. Sem biblioteca de estado nem de rotas.
- **Markdown:** o único lugar que insere HTML do conteúdo é `components/Markdown`, com `renderMarkdown`, depois `safeFragment` (lista de permissões de `utils/sanitize.js`) e montagem no DOM sem `dangerouslySetInnerHTML`. Os botões Copiar dos blocos são componentes React em portais.
- **Movimento:** todo `animation` e `transition` fica em `@media (prefers-reduced-motion: no-preference)`; isso substituiu os `!important` do CSS antigo. As animações compartilhadas são classes globais em `styles/global.css` (`.enter` só durante a entrada da página, `.anim-rise`, `.anim-fade`, `.reveal`).
- **Tokens:** novos para as cores de sintaxe (`--cor-sintaxe-*`), `--cor-destaque-claro` e `--sombra-topo`, porque o modelo proíbe cor solta no CSS.
- **Testes:** todo componente e página tem teste, e os hooks de estado (`useLibrary`, `useHash`, `useOs`, `useTheme`) também; **sem teste direto** ficam `usePieceText`, `useInstallFiles` (cobertos por `PieceView` e `Card`) e os de efeito visual `useScrollFx`, `usePointerGlow`, `useHeightVar` e `reveal` (só se verificam no navegador); `src/styles/regras.test.js` trava as regras de CSS (sem `!important`, sem cor solta, movimento e `:hover` nos lugares certos, layouts que já deram problema) e `src/integracao.test.jsx` renderiza toda rota de card e de tipo do conteúdo real.
- **Diferença de comportamento:** cada peça mostra o próprio "Carregando" e aparece quando chega (antes, a lista toda esperava a última).

## Pontos em aberto

- **`vendor/` fora de `client/`:** resolvido no marco 5. `marked` e `highlight.js` estão em `client/vendor/` (com o `README.md` de versão, licença e hash); `eslint` e `prettier` o ignoram.

## Resolvido depois do marco 4 (a pedido do usuário)

- **Troca de tema com "piscada":** a classe `theme-anim` forçava 0,4 s de transição em todo elemento (e gradientes não transitam, então davam um pulo). Agora a troca usa View Transitions (fade da tela inteira, uma só imagem); sem suporte do navegador ou com movimento reduzido, troca na hora.
- **Barra de progresso de leitura borrada:** o `scaleX` esticava o `box-shadow` (brilho) e a `transition` de 0,12 s atrasava a barra; ainda havia um re-render do React por frame. Agora o progresso vai direto para `--progresso` no elemento (sem brilho, sem transição, sem re-render), e só `scrolled` é estado.
- **Espaço, tipografia e raio só por tokens:** `tokens.css` ganhou a escala de espaço (`--espaco-0` a `--espaco-8`, com meios-passos como `--espaco-25`), a de fonte (`--fonte-2xs` a `--fonte-3xl`, mais `--fonte-hero`, `--fonte-titulo-card`, `--fonte-lead`) e a de raio (`--raio-2xs` a `--raio-xl`, `--raio-pill`). Os valores antigos foram trocados pelo token mais próximo, então alguns espaços e fontes mudaram até 4px e 0,03rem (o respiro de 72px no fim da página ganhou token próprio, `--espaco-85`, para não mudar). Em telas de 1800px ou mais o `html` vai a 17px e os tokens em `rem` crescem junto (os poucos `px` que sobraram, como a altura do topo e os alvos de 44px, não). `regras.test.js` agora barra `px`/`rem` soltos nessas propriedades. **O visual precisa da sua conferência.**
- **Pacote incompleto sem aviso:** a página do card agora avisa quando uma peça do pacote não carrega ("a instalação pelo terminal pode estar incompleta").
- **Timeouts de teste maiores:** `testTimeout: 15000` (em `client/vite.config.js`) e `asyncUtilTimeout: 4000` (em `setup-tests.js`) existem porque a suíte renderiza todo o conteúdo real em paralelo e a máquina fica lenta; o teste instável do atalho "/" tinha uma corrida real (o ouvinte ainda não ligado) e foi corrigido na causa, não pelo timeout. É só configuração de teste, não de build do site.
- **Organização:** novo `client/src/dom/` para os módulos imperativos de DOM (`reveal`, `reducedMotion`, `copyText`, `highlight`, `markdownDom`), que estavam em `hooks/` e `components/`. `PieceView` continua buscando por `usePieceText`, o que a tabela de camadas permite.

- **Cópias sem guarda automática:** nada confere que `js/` e `client/src/utils/` continuam equivalentes; o risco é aceito até o marco 5 (curto, `js/` congelado). A revisão do marco 3 comparou as sete cópias: só diferem em formatação e no caminho do `vendor/`.
- **HTML do Markdown:** `renderMarkdown` devolve HTML para inserir; no marco 4 ele só pode entrar pelo único componente com `dangerouslySetInnerHTML`, depois do `sanitize` (regra 3 do `CLAUDE.md`).

- `.claude/` é ignorado pelo git (pessoal e local) e aqui aponta por links simbólicos para o `.claude` do modelo em `dev_web/`. Versionar agents e skills no repositório exigiria mudar `.gitignore` e o teste que o confere; fica para decidir.
- Mapa dos tokens atuais (`--bg`, `--accent`…) para `--cor-*`, `--espaco-*`: definido no marco 2.
