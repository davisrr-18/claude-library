# Regras de trabalho

Como trabalhamos neste projeto, e por quê. Complementa o `CLAUDE.md` global do usuário.

## Ritmo

1. **Entender antes de agir:** ler o código e os docs relevantes; separar fato de suposição.
2. **Pedido pontual** (correção, ajuste, adicionar um pacote): executar direto, com teste, verificar, commitar e enviar.
3. **Mudança grande ou de arquitetura:** apresentar o desenho (classificação, abordagens, trade-offs) e esperar o "sim" antes de codar. Foi assim com a vitrine de cards. Histórico: `docs/superpowers/specs` e `docs/superpowers/plans`.
4. **Definição de pronto:** comportamento implementado, testes passando, `npm run check` em `OK`, revisão do diff, e relato do que **não** foi verificado.

## TDD (sempre)

Escrever o teste, **ver falhar pelo motivo certo** (se passar de primeira, o teste é fraco: reforçar), implementar o mínimo, ver passar. Bug corrigido ganha teste de regressão. Lógica nova vai para módulo puro testável. Quando o bug é de CSS, o teste lê o CSS e trava a regra (`tests/css-layout.test.mjs`, `tests/css-motion.test.mjs`).

## Delegação a subagentes

- Modelo e esforço: **Haiku em esforço alto** para tarefas delimitadas (`investigator`, `implementer`, `reviewer`). Não subir para Sonnet/Opus sem o usuário pedir.
- No máximo **3 ao mesmo tempo**; **escopos de arquivo sem sobreposição**; enquanto um agente lê um arquivo, não editar esse arquivo.
- **Quem implementou não revisa.** Depois de uma funcionalidade relevante, pedir revisão independente (somente leitura) e corrigir o que for real.
- Escreva o pedido com escopo, pergunta, formato de entrega (`arquivo:linha`, fatos × suposições, severidade) e o que **ignorar** (decisões já tomadas).
- **Severidade:** *bloqueante* = quebra o uso, perde dado ou abre falha de segurança; *importante* = comportamento errado visível ou lacuna de segurança sem exploração direta; *menor* = cosmético, latente ou melhoria. Rebaixe o que não conseguir reproduzir.
- **Nunca confiar no relatório sem conferir.** Reproduzir o achado, ler o código, rodar. Exemplos reais: a revisão achou regressão nossa (filtros cobrindo o hero no celular, scanner que passava em silêncio por link simbólico) e relatórios trouxeram achados parcialmente errados.
- Dados pessoais: um agente já copiou o e-mail real do usuário para um teste. Ao delegar, proibir explicitamente dado pessoal e exigir valores fictícios (e-mail no domínio reservado `example.com`, home de usuário inventado), só dentro de `tests/`.

## Verificação (o que usamos)

Ver `qualidade.md`. Resumo: `npm test` (unitários, incluindo execução real dos comandos de instalação no bash), `npm run check` (conteúdo), `npm run qa` (linter, CSS, fuzz, fumaça com DOM simulado e estresse com 300 cards). **Não há navegador no ambiente**; layout, animação e foco reais são confirmados pelo usuário. Sempre dizer isso.

## Git

- Commits e pushes em `main` **autorizados** pelo usuário. Mensagem em português (`feat:`, `fix:`, `docs:`…) com corpo explicando o porquê, **sem `Co-Authored-By` nem `Claude-Session`** (o usuário não quer o Claude como coautor; vale mesmo que o ambiente sugira essas linhas). Os exemplos de `git commit -m` em `conteudo.md` são o mínimo manual. Rode `git status --short` antes de `git add -A`.
- Nunca reescrever histórico nem fazer force-push sem pedir. Houve um pedido explícito (remover a coautoria do Claude); o procedimento seguro está em `decisoes.md`. O e-mail do autor está em todos os commits (metadado do git); o e-mail real apareceu uma vez em um teste (commit antigo) e foi trocado por valor fictício.
- Antes de commitar: `npm test`, `npm run check` e (se mexeu na interface) `npm run qa`.

## Privacidade e publicação

- O repositório é **público** e o site vai para o GitHub Pages. O `.gitignore` bloqueia o que costuma vazar (credenciais, `.claude/`, `*.local`, editores, backups) e é testado; se aparecer um tipo novo de arquivo pessoal, acrescente o padrão **e** o teste em `tests/gitignore.test.mjs`. Por isso: nada sensível em arquivo nem no histórico, `npm run check` antes de dar push e publicação por lista de permissão (`npm run build:site`).
- **Deploy só com autorização explícita do usuário.** Senha em JS não é proteção.
- Executar binário baixado da internet é bloqueado pelo ambiente; não contornar, explicar e deixar a decisão com o usuário (aconteceu com o PowerShell). `npm run qa:install` **é permitido**: instala só as dependências de desenvolvimento fixadas no `tools/qa/package-lock.json`.
- **Microinteração × animação decorativa:** microinteração responde a uma ação do usuário (hover, foco, clique, troca de aba), dura menos de ~0,5 s e roda uma vez por ação; decorativa anima sozinha, sem ação. Decorativa só se for uma passada na entrada. Loop nunca.

## Respostas ao usuário

- Português, direto; resultado primeiro; sem inflar.
- Sempre separar **verificado de verdade** × **não verificado** (ex.: PowerShell e zsh não existem na máquina; navegador não existe).
- **Ao adicionar/instalar algo, incluir os comandos de terminal para Linux, macOS e Windows (PowerShell)** (preferência permanente do usuário).
- Quando algo "ficar estranho" na tela, pedir print e o tamanho da janela; não adivinhar.
- Terminar com as pendências que dependem dele.

## Lições aprendidas (não repetir)

- Animação infinita decorativa incomoda: uma passada só.
- Controle posicionado por cima de área rolável invade: dar linha própria.
- Grid com coluna automática estoura com texto largo: `minmax(0, 1fr)`.
- `position: static` num pai desancora pseudo-elementos absolutos (cobriu o hero no celular).
- Regex com `[...]+@` sem âncora é quadrática: usar lookbehind (base64 grande travava o `check`).
- Teste que "passa por acaso" não protege: reforçar até falhar no caso certo.
- Verificação de segurança que falha aberta (saindo com 0 sem verificar) é pior que nenhuma.
