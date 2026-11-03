---
titulo: Skill Nova feature
slug: webdev-skill-nova-feature
nivel: intermediaria
stack: "HTML, CSS, JavaScript, React, Node.js"
tipo: skill
destino: .claude/skills/nova-feature/SKILL.md
---

# Skill: Nova feature

Rotina para implementar uma funcionalidade nova de ponta a ponta (tela + API + testes). Salve em `.claude/skills/nova-feature/SKILL.md`.

````markdown
---
name: nova-feature
description: Implementa uma funcionalidade nova de ponta a ponta no projeto web, com plano, contrato da API, back, front, testes e revisão. Use quando o usuário pedir uma funcionalidade que envolve tela e/ou endpoint.
---

# Nova feature

## Entradas
Descrição da funcionalidade, quem usa, critérios de aceitação. Se algo essencial faltar, pergunte tudo de uma vez, numa única mensagem.

## Passo a passo

### 1. Entender e mapear
- Leia `CLAUDE.md` e `arquitetura.md`.
- Use o agent `explorador` para achar telas, rotas e componentes parecidos e o que será afetado.

### 2. Planejar (curto)
Apresente em até 10 linhas: o que será criado/alterado em `client/` e `server/`, o contrato da API novo (método, caminho, entrada, saída, erros) e os testes previstos.
- Se o plano mexe em contrato público, schema do banco, estrutura de pastas ou adiciona dependência: **pare e peça aprovação**.
- Se o plano tem mais de ~8 arquivos ou várias etapas independentes: avise que parece uma tarefa Complexa e proponha `PLAN.md` com marcos.

### 3. Back primeiro (se houver API)
- Delegue ao agent `backend`: teste da rota, depois `route → controller → service`, depois validação e erros.
- Confirme o contrato final antes de seguir.

### 4. Front
- Delegue ao agent `frontend`: `service` da API, hook, componentes e página, usando a skill `componente-react` para cada componente novo.
- Trate carregando, erro e vazio.
- Rode a skill `acessibilidade-responsivo` na tela nova.

### 5. Testes
- Agent `testador` para lacunas: borda e falhas que ainda não têm teste.
- Rode `[GERENCIADOR] run lint` e `[GERENCIADOR] test`.

### 6. Revisão e fechamento
- Agent `revisor` no diff completo. Corrija os bloqueantes e importantes.
- Atualize `arquitetura.md` se estrutura ou contrato mudaram.
- Entregue: o que foi feito (arquivos), como verificou, contrato final da API e pendências.

## Regras
- Responda em português.
- Uma funcionalidade por vez; não "aproveite" para refatorar o que não foi pedido.
- Não dê como pronto sem rodar lint e testes e mostrar o resultado.
````
