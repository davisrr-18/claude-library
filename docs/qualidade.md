# Qualidade: testes e verificações

Duas camadas e o lint. Rode da raiz do projeto; os comandos são iguais em Linux, macOS e Windows. Antes, uma vez: `npm install`.

| O quê | Comando | O que cobre |
|---|---|---|
| Testes | `npm test` | Tudo: `tests/` (conteúdo, documentação, `.gitignore`, build do site) e o Vitest do `client` |
| Verificação de conteúdo | `npm run check` | Manifest, arquivos, dados sensíveis, identidade do autor |
| Lint | `npm run lint` | ESLint no `client`, com regras de React, hooks e acessibilidade (jsx-a11y) |

## 1. `npm test` (Node 22.22 ou superior)

Roda `node:test` sobre `tests/*.test.mjs` e depois `vitest run` no `client`.

**`tests/` (`node:test`, sobre o repositório e os scripts):**

- **`.gitignore`:** `gitignore` confere com o próprio `git check-ignore`, nos dois sentidos: o que precisa ser ignorado (segredos, `.claude/`, `*.local`, arquivos de editor e de sistema, backups) e o que não pode (o projeto de verdade), e que nenhum arquivo já rastreado casa com o ignore.
- **Build do site:** `build-site` roda a build do client e confere que o `dist/` publica só `client/dist` e o `_headers`, **recusa** build velha (conteúdo mudou), dado sensível e referência fora da build, e **nunca apaga** a raiz, um ancestral dela, a build do client ou uma pasta do projeto.
- **Verificador:** `check-content` (regras, mascaramento, varredura, binários, symlink), `check-content-cli` (a CLI de verdade, inclusive por link simbólico, e a listagem pelo git), `check-content-mask`, `check-content-perf` (tempo linear), `repo-content` (o próprio repositório passa).
- **Documentação:** `docs` confere links, arquivos citados, `npm run X` citados e que a árvore de `arquitetura.md` bate com as pastas de `client/src`.

**`client/src/` (Vitest + Testing Library, jsdom):**

- **Componentes, páginas e hooks:** cada um com `Nome.test.jsx` ao lado (comportamento visto pelo usuário: papéis, nomes acessíveis, teclado, foco).
- **Módulos puros (`utils/`):** inclui `install-exec.test.js`, que roda **de verdade** os comandos de instalação gerados no `bash` (e no `zsh` e PowerShell quando existirem), num diretório temporário, e compara os arquivos criados com o conteúdo original, inclusive com conteúdo hostil a shells (`$(…)`, crases, aspas, linhas `EOF`, `'@` e aspas tipográficas, emoji). Sem `zsh`/PowerShell na máquina, esses testes são **pulados** (hoje: 6).
- **`styles/regras.test.js`:** trava as regras de CSS do `CLAUDE.md` lendo os `.css`: sem `!important`, cor só por token, espaço, fonte e raio sem `px`/`rem` soltos, todo movimento em `prefers-reduced-motion: no-preference`, só o esqueleto em loop, `:hover` só em `hover: hover`, e os layouts que já deram problema (grids que encolhem, botão Copiar em linha própria).
- **`fuzz.test.js`:** entradas aleatórias e hostis com semente fixa: Markdown → HTML → lista de permissões (nenhum vetor de XSS sobrevive em 4000 documentos), front matter, mutações do manifest (um manifest válido nunca quebra a interface), rotas, busca, abas e Markdown patológico (tempo).
- **`estresse.test.jsx`:** 300 cards e mais de 700 peças: busca no texto, tags sem repetição, aba de tipo nas três faixas, card do meio com os 100 da lateral, sem ids duplicados. Confere correção, não velocidade.
- **`integracao.test.jsx`:** renderiza toda rota de card e de tipo de peça do **conteúdo real**, sem aviso de erro.

**CI (`.github/workflows/ci.yml`) roda lint, `npm test`, `npm run check` e `npm run build` em Linux, macOS e Windows a cada push.** Lá os comandos de instalação são executados de verdade: `bash` nos três, `zsh` no macOS e **PowerShell nos três** (o `pwsh` já vem nos runners). Na máquina de desenvolvimento (Fedora, só com `bash`) os testes de `zsh` e PowerShell são pulados; a evidência deles é o CI. Para ver o resultado: `gh run list --limit 3` e `gh run view <id>`.

## 2. `npm run check` (`scripts/check-content.mjs`)

Valida o manifest, confere se cada arquivo existe e varre **todos os arquivos do projeto** (qualquer extensão; em repositório git, só o que o git conhece), exceto `tests/` e `vendor/` nas regras de segredo. Procura e-mail, caminho pessoal, tokens e chaves (GitHub, AWS, Slack, Google, Stripe, JWT, chave privada), credencial em URL e CPF; **a identidade do autor** (e-mail e nome do `git config` e usuário do sistema) é procurada em todos os arquivos, inclusive `tests/`. Segredos saem mascarados; symlinks são erro; falha de leitura é erro; sai com código 1 se achar algo.

Consequência prática: **não escreva dado pessoal real em nenhum arquivo do projeto** (nem em teste, nem em doc). Fixtures fictícios (um e-mail no domínio reservado `example.com`, o home de um usuário inventado) só são permitidos em `tests/`, que fica fora das regras de segredo; **em `docs/` e no resto, o verificador também recusa esses exemplos**, então descreva em palavras ("um e-mail fictício") em vez de escrevê-los. Para o repositório use `<usuario>/claude-library`.

## 3. `npm run lint`

ESLint 9 sobre `client/` (`client/vendor/` e `client/dist/` ficam de fora): regras recomendadas de React e de hooks (`react-hooks`), de acessibilidade em JSX (`jsx-a11y`), `eqeqeq`, `prefer-const`, `no-var`. O código de `scripts/` e `tests/` não passa pelo lint.

## O que não está coberto (dizer sempre)

- **Aparência e layout reais** (cores, espaçamentos, estouro de caixa, celular), **animações**, a troca de tema e a barra de progresso e o **foco visual**: só em navegador. O usuário confirma; peça print.
- **PowerShell e zsh** não rodam na máquina de desenvolvimento (e o ambiente bloqueia executar binário baixado); a execução real deles é verificada no **CI**, não localmente.
- `marked` 15.0.12 estoura a pilha com ~5000 `>` aninhados e fica lento com milhares de `[a](` abertos (entrada patológica, só do próprio conteúdo do usuário; a interface mostra erro em vez de travar o resto).
- O jsdom não tem layout nem CSS: ele prova lógica, ARIA, foco, rotas e erros, **não** aparência.

## Adicionar verificação

- Componente, hook ou página novo: `Nome.test.jsx` ao lado, escrito **antes** do código (ver falhar, implementar, ver passar).
- Regra de CSS nova: um teste em `client/src/styles/regras.test.js`.
- Verificação sobre o repositório ou os scripts: `tests/<tema>.test.mjs`.
- Bug de interface sem como testar em jsdom: escreva o teste que **lê o CSS/JS e trava a causa** e relate que a aparência não foi vista.
