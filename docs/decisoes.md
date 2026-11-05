# Registro de decisões

Mais recente no fim. Cada decisão: o quê, por quê. Itens que mudaram de ideia estão marcados.

## Escopo e stack

- **HTML, CSS e JS puros, sem build e sem dependências de execução.** Foi escolha do usuário. Terceiros só vendorizados (`marked` 15.0.12, `highlight.js` 11.11.1), com versão, licença e hash em `vendor/README.md`. Nada de CDN.
- **Conteúdo em Markdown**, lido em tempo de execução via `fetch` (por isso precisa de servidor http; `file://` não funciona e a página avisa).
- **Estrutura do usuário:** três níveis (Tarefas Básicas, Intermediárias e Complexas) → cards → peças de tipos diferentes (skill, `CLAUDE.md`, arquitetura, agente, workflow, prompt).
- **SPA com rotas por hash**, sem framework (a escolha original era "documentação navegável"; o visual evoluiu para vitrine).

## Publicação e privacidade

- Pretendido: GitHub Pages com repositório privado, "só para mim". **Realidade:** Pages publica o site para quem tiver a URL, e o plano gratuito nem permite Pages em repositório privado. Decisão: projetar para exposição pública, varrer dados sensíveis, `noindex` e **publicar só com autorização explícita** (dada depois, ver Publicação). Senha em JS foi descartada (não é proteção).
- O e-mail real do autor está nos metadados dos commits (configuração do git) e apareceu uma vez num teste (commit antigo), depois trocado por valor fictício. **Atenção:** o repositório agora é público, então esse e-mail e o conteúdo antigo desse teste são públicos; o usuário pode adotar o e-mail `noreply` do GitHub nos próximos commits.
- **Coautoria do Claude removida do histórico (pedido explícito do usuário).** As linhas `Co-Authored-By: Claude …` e `Claude-Session: …` foram retiradas das mensagens dos 26 commits que as tinham, com `git filter-branch --msg-filter` e `git push --force-with-lease`. Procedimento seguro usado: backup (`git bundle`), conferência de que as árvores de arquivos ficaram idênticas nos 27 commits e de que não restou nenhuma linha, e só então o force-push. A autoria (nome e e-mail do usuário) foi preservada. Commits antigos podem continuar acessíveis pelo hash no GitHub até o GC dele. **Daqui para frente, commits não levam essas linhas.**

## Interface

- **Vitrine de cards** (escolhida entre: docs com sidebar, vitrine, terminal, misto). Paleta preto+laranja / branco+laranja. Tela cheia. Topo alinhado com o conteúdo.
- **Abas por tipo de peça** dentro de cada faixa de nível (pedido do usuário): Todos + tipos existentes, com contagem; o card abre direto a aba do tipo; abas reais com teclado.
- **Várias peças do mesmo tipo no card** (o pacote de estudos tem 3 agentes e 3 skills): substitui a regra original "um tipo por card". Validação: título único por tipo, arquivo não repetido no card.
- **Abas da página do card são links** (`aria-current`), não `role="tab"` com setas; o Tab alcança todas. Já as abas por tipo das faixas e as de sistema operacional são abas reais com setas.
- **Busca por palavra (prefixo)**, não por trecho: `git` não casa com `digital`; `migra` casa com `Migração`. Letras de qualquer alfabeto (inclusive marcas combinantes) formam palavras. Filtros persistem ao voltar à Home dentro da sessão.
- **Título do Markdown começa em `h3`** (h1 = card, h2 = peça). O primeiro título do corpo é removido quando é igual ao da peça.
- **Animações:** uma passada e param (mudou de ideia: as do hero eram infinitas e o usuário reclamou). Botão Copiar em linha própria (antes flutuava e invadia).
- Cards de exemplo inventados **removidos** a pedido; só conteúdo do usuário.

## Publicação

- **GitHub Pages:** ao tentar ativar com o repositório privado o GitHub respondeu 422 (o plano gratuito não permite). O usuário então **tornou o repositório público e autorizou o Pages**. Foi considerado Cloudflare Pages com login (guia mantido em `docs/deploy/cloudflare.md`, não usado).
- **Uma única definição do que é publicado:** `scripts/build-site.mjs` (na época, lista de permissão `index.html`, `css/`, `js/`, `vendor/`, `content/` + `_headers`; hoje publica `client/dist` + `_headers`, ver o fim deste arquivo). Ele é um portão: **recusa construir** com dado sensível, arquivo faltando ou referência fora da lista, porque o deploy pode rodar mesmo que outra verificação falhe. O workflow do GitHub Pages (`.github/workflows/pages.yml`) usa o mesmo script.
- O build apaga a pasta de saída, então só aceita uma pasta inexistente, vazia ou que pareça um build anterior; nunca a raiz do projeto, um ancestral dela ou uma pasta do site (testado).

## Segurança

- Sanitização em duas camadas (renderer do Markdown + política de DOM). `safeFragment` é o único `innerHTML`, sobre `<template>` inerte.
- Verificador de conteúdo: varre todos os arquivos, identidade do autor em todos, mascara segredos, recusa symlinks, tempo linear, respeita `.gitignore` em repositório git. Falha aberta por link simbólico foi um bug real e corrigido.
- Comandos de instalação: caminho validado estritamente; conteúdo em heredoc/here-string literal; testados executando de verdade.

## Qualidade

- **CI em 3 sistemas** (`ci.yml`): confirmou em máquinas reais que os comandos de instalação funcionam em bash (Linux, macOS, Windows/Git Bash), zsh (macOS) e PowerShell (Linux, macOS, Windows). Um falso erro no Windows era do teste (o script ia como argumento do `bash -c`, que o Windows reescreve); agora vai pela entrada padrão.

- `npm test` sem dependências; QA com dependências **isoladas** em `tools/qa/`.
- Sem navegador no ambiente: aparência, animação e layout real são confirmados pelo usuário; a regra do CSS que causou o bug é travada por teste que lê o CSS.
- Revisão independente depois de cada funcionalidade; relatório de agente sempre conferido.

## Em aberto

- Cards de **Básicas** e **Complexas** (vazias) e de `CLAUDE.md`/arquitetura de outros pacotes, quando o usuário trouxer.
- Link e imagem relativos dentro dos `.md` resolvem contra `index.html`, não contra `content/` (convenção a definir se algum pacote usar).

## Migração para o modelo dev_web (concluída em 2026-11-03)

Detalhes, marcos, dependências e pendências: `docs/decisions/0001-migracao-para-o-modelo-dev-web.md`. O que isso mudou nas decisões acima:

- **Cai** "HTML, CSS e JS puros, sem build e sem dependências de execução": o site é React + Vite em `client/`. Continua sem CDN; `marked` e `highlight.js` seguem vendorizados, agora em `client/vendor/`.
- **Cai** "`npm test` sem dependências; QA com dependências isoladas em `tools/qa/`": o QA foi absorvido pelo Vitest do `client` (lint com ESLint, regras de CSS, fuzz, estresse e integração com o conteúdo real) e `tools/qa/` foi apagado.
- **Muda** "uma única definição do que é publicado": `scripts/build-site.mjs` agora publica `client/dist` mais o `_headers`, e recusa build velha em relação a `content/`; continua sendo um portão (dado sensível, referência fora da build, saída perigosa).
- **Permanecem** o repositório público, o GitHub Pages, a sanitização em duas camadas do Markdown, as regras de conteúdo e de git (sem coautoria do Claude).
