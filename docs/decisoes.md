# Registro de decisões

Mais recente no fim. Cada decisão: o quê, por quê. Itens que mudaram de ideia estão marcados.

## Escopo e stack

- **HTML, CSS e JS puros, sem build e sem dependências de execução.** Foi escolha do usuário. Terceiros só vendorizados (`marked` 15.0.12, `highlight.js` 11.11.1), com versão, licença e hash em `vendor/README.md`. Nada de CDN.
- **Conteúdo em Markdown**, lido em tempo de execução via `fetch` (por isso precisa de servidor http; `file://` não funciona e a página avisa).
- **Estrutura do usuário:** três níveis (Tarefas Básicas, Intermediárias e Complexas) → cards → peças de tipos diferentes (skill, `CLAUDE.md`, arquitetura, agente, workflow, prompt).
- **SPA com rotas por hash**, sem framework (a escolha original era "documentação navegável"; o visual evoluiu para vitrine).

## Publicação e privacidade

- Pretendido: GitHub Pages com repositório privado, "só para mim". **Realidade:** Pages publica o site para quem tiver a URL (só Enterprise Cloud restringe; o plano gratuito nem permite Pages em repositório privado). Decisão: projetar para exposição pública, varrer dados sensíveis, `noindex`, e **publicar só com autorização explícita**. Senha em JS foi descartada (não é proteção).
- O e-mail real do autor está nos metadados dos commits (configuração do git) e apareceu uma vez num teste; foi trocado por valor fictício. Histórico **não** foi reescrito (exigiria force-push); o usuário pode adotar o e-mail `noreply` do GitHub nos próximos commits.

## Interface

- **Vitrine de cards** (escolhida entre: docs com sidebar, vitrine, terminal, misto). Paleta preto+laranja / branco+laranja. Tela cheia. Topo alinhado com o conteúdo.
- **Abas por tipo de peça** dentro de cada faixa de nível (pedido do usuário): Todos + tipos existentes, com contagem; o card abre direto a aba do tipo; abas reais com teclado.
- **Várias peças do mesmo tipo no card** (o pacote de estudos tem 3 agentes e 3 skills): substitui a regra original "um tipo por card". Validação: título único por tipo, arquivo não repetido no card.
- **Abas da página do card são links** (`aria-current`), não `role="tab"` com setas; o Tab alcança todas. Já as abas por tipo das faixas e as de sistema operacional são abas reais com setas.
- **Busca por palavra (prefixo)**, não por trecho: `git` não casa com `digital`; `migra` casa com `Migração`. Letras de qualquer alfabeto (inclusive marcas combinantes) formam palavras. Filtros persistem ao voltar à Home dentro da sessão.
- **Título do Markdown começa em `h3`** (h1 = card, h2 = peça). O primeiro título do corpo é removido quando é igual ao da peça.
- **Animações:** uma passada e param (mudou de ideia: as do hero eram infinitas e o usuário reclamou). Botão Copiar em linha própria (antes flutuava e invadia).
- Cards de exemplo inventados **removidos** a pedido; só conteúdo do usuário.

## Segurança

- Sanitização em duas camadas (renderer do Markdown + política de DOM). `safeFragment` é o único `innerHTML`, sobre `<template>` inerte.
- Verificador de conteúdo: varre todos os arquivos, identidade do autor em todos, mascara segredos, recusa symlinks, tempo linear, respeita `.gitignore` em repositório git. Falha aberta por link simbólico foi um bug real e corrigido.
- Comandos de instalação: caminho validado estritamente; conteúdo em heredoc/here-string literal; testados executando de verdade.

## Qualidade

- `npm test` sem dependências; QA com dependências **isoladas** em `tools/qa/`.
- Sem navegador no ambiente: aparência, animação e layout real são confirmados pelo usuário; a regra do CSS que causou o bug é travada por teste que lê o CSS.
- Revisão independente depois de cada funcionalidade; relatório de agente sempre conferido.

## Em aberto

- **Deploy no GitHub Pages: autorizado, mas bloqueado pelo plano.** O usuário mandou publicar; o GitHub respondeu que o plano gratuito não permite Pages em repositório privado (HTTP 422). Workflow pronto e inativo em `docs/deploy/pages.yml`. Caminhos possíveis, a escolher pelo usuário: (A) plano pago (GitHub Pro) mantendo o repositório privado; (B) tornar o repositório público (expõe código, documentos e o e-mail dos commits); (C) repositório público separado só com o site; (D) hospedagem com controle de acesso, como Cloudflare Pages com Access ou Netlify, que atende o desejo original de "só eu acesso". Nunca escolher sem o usuário.
- **PowerShell (Windows) e zsh (macOS):** comandos testados por texto; execução real só onde existirem (o ambiente bloqueou executar o PowerShell baixado).
- Cards de **Básicas** e **Complexas** (vazias) e de `CLAUDE.md`/arquitetura de outros pacotes, quando o usuário trouxer.
- Link e imagem relativos dentro dos `.md` resolvem contra `index.html`, não contra `content/` (convenção a definir se algum pacote usar).
