# Qualidade: testes e verificações

Três camadas. Rode da raiz do projeto; os comandos são iguais em Linux, macOS e Windows.

| Camada | Comando | O que cobre |
|---|---|---|
| Testes unitários | `npm test` | Lógica pura, CSS por leitura, execução real dos comandos de instalação |
| Verificação de conteúdo | `npm run check` | Manifest, arquivos, dados sensíveis, identidade do autor |
| QA completo | `npm run qa` (uma vez: `npm run qa:install`) | Linter, CSS, fuzz, fumaça com DOM simulado, estresse |

## 1. `npm test` (Node 22, `node:test`, zero dependências)

Arquivos em `tests/` (um por módulo ou tema):

- **Módulos puros:** `content`, `router`, `search`, `tabs`, `install`, `markdown`, `sanitize`, `icons`.
- **Verificador:** `check-content` (regras, mascaramento, varredura, binários, symlink), `check-content-cli` (a CLI de verdade, inclusive por link simbólico, e a listagem pelo git), `check-content-mask`, `check-content-perf` (tempo linear), `repo-content` (o próprio repositório passa).
- **CSS por leitura:** `css-layout` (grids que encolhem, botão Copiar em linha própria, espaçamento do bloco, barras finas) e `css-motion` (só o esqueleto pode ser infinito; elemento já revelado não reanima).
- **Execução real:** `install-exec` roda **de verdade** os comandos gerados no `bash` (e no `zsh`/PowerShell quando existirem), num diretório temporário, e compara os arquivos criados com o conteúdo original, inclusive com conteúdo hostil a shells (`$(…)`, crases, aspas, linhas `EOF`, `'@`, emoji). Sem `zsh`/PowerShell na máquina, esses testes são **pulados** (hoje: 4).

No Windows e no macOS, `npm test` roda sozinho os testes de PowerShell/zsh que aqui são pulados: é a forma de confirmar os comandos do Windows.

## 2. `npm run check` (`scripts/check-content.mjs`)

Valida o manifest, confere se cada arquivo existe e varre **todos os arquivos do projeto** (qualquer extensão; em repositório git, só o que o git conhece), exceto `tests/` e `vendor/` nas regras de segredo. Procura e-mail, caminho pessoal, tokens e chaves (GitHub, AWS, Slack, Google, Stripe, JWT, chave privada), credencial em URL e CPF; **a identidade do autor** (e-mail e nome do `git config` e usuário do sistema) é procurada em todos os arquivos, inclusive `tests/`. Segredos saem mascarados; symlinks são erro; falha de leitura é erro; sai com código 1 se achar algo.

Consequência prática: **não escreva dado pessoal real em nenhum arquivo do projeto** (nem em teste, nem em doc). Fixtures fictícios (um e-mail no domínio reservado `example.com`, o home de um usuário inventado) só são permitidos em `tests/`, que fica fora das regras de segredo; **em `docs/` e no resto, o verificador também recusa esses exemplos**, então descreva em palavras ("um e-mail fictício") em vez de escrevê-los. Para o repositório use `<usuario>/claude-library`.

## 3. `npm run qa` (`tools/qa/`)

Dependências isoladas em `tools/qa/package.json` (jsdom, eslint, css-tree); o projeto principal continua sem dependências. Instalar uma vez com `npm run qa:install`. Roda 10 verificações (cada uma também pode ser rodada sozinha: `node tools/qa/run-all.mjs <filtro>`):

| Verificação | O que faz |
|---|---|
| `lint` | eslint (recomendadas + `no-shadow`, `eqeqeq`, `prefer-const`…) em `js/`, `scripts/`, `tests/` |
| `css` | sintaxe, `var()` sem definição, custom property sobrando |
| `fuzz` | ~18 mil entradas hostis: Markdown → HTML → política de DOM (nenhum vetor de XSS pode sobreviver), front matter, mutações do manifest (um manifest válido nunca quebra o app), rotas, busca, tempo do verificador (ReDoS) |
| `smoke/ancoras` | abrir a página com `#main` não trava |
| `smoke/estudos` | o pacote real: abas, peças empilhadas, `Destino`, blocos aninhados, busca, rotas |
| `smoke/instalacao` | painéis de instalação, abas de sistema, conteúdo dos comandos, `arquitetura.md` inteiro |
| `smoke/geral`, `smoke/abas`, `smoke/filtros` | comportamento geral, abas por tipo, filtros, aside e pager, sobre **fixtures** (`tools/qa/fixtures/`), porque o conteúdo real mudou |
| `estresse (300 cards)` | 300 cards gerados (`lib/big-fixture.mjs`): tempo, ids duplicados, tags, busca no corpo |

Os testes de fumaça rodam o `app.js` **de verdade** sobre um DOM simulado (jsdom). jsdom não tem layout nem CSS: ele prova lógica, ARIA, foco, rotas e erros de console; **não** prova aparência.

## O que não está coberto (dizer sempre)

- **Aparência e layout reais** (cores, espaçamentos, estouro de caixa, celular), **animações** e **foco visual**: só em navegador. O usuário confirma; peça print.
- **PowerShell e zsh** não rodam nesta máquina (e o ambiente bloqueia executar binário baixado): os comandos do Windows têm testes de texto, mas a execução real só acontece onde existir PowerShell.
- `marked` 15.0.12 estoura a pilha com ~5000 `>` aninhados e fica lento com milhares de `[a](` abertos (entrada patológica, só do próprio conteúdo do usuário; o app mostra erro em vez de travar o resto).

## Adicionar verificação

Teste unitário novo em `tests/<tema>.test.mjs` (nome `.test.mjs`, importa de `../js/…`). Fumaça nova em `tools/qa/smoke/` (copie o cabeçalho de um existente) e registre em `STEPS` de `tools/qa/run-all.mjs`. Bug de interface sem como testar em Node: escreva o teste que **lê o CSS/JS e trava a causa** e relate que a aparência não foi vista.
