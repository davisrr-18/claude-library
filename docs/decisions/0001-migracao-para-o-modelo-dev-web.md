# 0001 — Migração para o modelo dev_web

Data: 2026-11-03. Status: em andamento (marco 1 concluído).

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
2. **Esqueleto:** `client/` com Vite, tokens, página vazia; dependências aprovadas; workflow do Pages ajustado.
3. **Lógica:** módulos puros para `utils/` e `services/`, testes para Vitest, mantendo TDD.
4. **Interface:** `app.js` e `style.css` viram componentes e CSS Modules.
5. **Fechamento:** `npm run check`, QA, revisão independente, deploy.

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

## Pontos em aberto

- `.claude/` é ignorado pelo git (pessoal e local) e aqui aponta por links simbólicos para o `.claude` do modelo em `dev_web/`. Versionar agents e skills no repositório exigiria mudar `.gitignore` e o teste que o confere; fica para decidir.
- Mapa dos tokens atuais (`--bg`, `--accent`…) para `--cor-*`, `--espaco-*`: definido no marco 2.
