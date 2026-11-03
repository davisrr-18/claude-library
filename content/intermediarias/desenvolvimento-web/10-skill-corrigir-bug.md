---
titulo: Skill Corrigir bug
slug: webdev-skill-corrigir-bug
nivel: intermediaria
stack: "HTML, CSS, JavaScript, React, Node.js"
tipo: skill
destino: .claude/skills/corrigir-bug/SKILL.md
---

# Skill: Corrigir bug

Rotina para corrigir um bug pela causa, não pelo sintoma, deixando um teste que impede o retorno. Salve em `.claude/skills/corrigir-bug/SKILL.md`.

````markdown
---
name: corrigir-bug
description: Investiga e corrige um bug no projeto web, reproduzindo primeiro, achando a causa raiz e deixando um teste de regressão. Use quando o usuário relatar comportamento errado, erro no console, erro 4xx/5xx inesperado ou teste que quebrou.
---

# Corrigir bug

## Entradas
Sintoma, comportamento esperado, passos para reproduzir e onde acontece (tela, rota, ambiente). Mensagens de erro e logs completos ajudam. Se faltar o essencial, pergunte antes de investigar.

## Passo a passo

### 1. Reproduzir
- Reproduza o problema de verdade (rodando o app, a rota ou o teste). Registre o resultado.
- Se não conseguir reproduzir, diga o que tentou e peça dados; não "corrija no escuro".

### 2. Isolar
- Use o agent `explorador` para mapear o fluxo envolvido, do clique ou requisição até a resposta.
- Reduza: qual é o menor caso que ainda falha? Em qual camada (UI, hook, service, rota, controller, service, banco) o dado deixa de ser o esperado?
- Confira o que mudou recentemente na área (`git log -p` nos arquivos suspeitos).

### 3. Achar a causa raiz
- Formule uma hipótese, verifique com log temporário, teste ou leitura do código. Descarte hipóteses uma por uma.
- Pergunte "por que isso aconteceu?" até chegar na causa, não no ponto onde estourou.
- Remova todo log temporário no final.

### 4. Escrever o teste que falha
- Com o agent `testador` (ou direto): escreva um teste que reproduz o bug e **falha pelo motivo certo**. Rode e confirme.

### 5. Corrigir
- Menor mudança que resolve a causa. Sem refatoração junto.
- Se a correção exige mudar contrato da API, schema ou estrutura: pare e peça aprovação.

### 6. Verificar
- O teste novo passa; `[GERENCIADOR] run lint` e a suíte da área passam.
- Reproduza o cenário original à mão, se for visual ou de fluxo.
- Procure o mesmo padrão de erro em outros lugares (`Grep`) e informe, sem corrigir sem pedir.

### 7. Entregar
- Causa raiz em 1 ou 2 frases, o que mudou (arquivos), o teste adicionado, como verificou e outros pontos suspeitos.

## Regras
- Responda em português.
- Não suprima o erro (try/catch vazio, `?.` por reflexo, desligar validação) para o sintoma sumir.
- Se a causa for dado ou configuração do ambiente e não código, diga isso claramente.
- Se a investigação passar de 3 hipóteses sem avanço, resuma o que já descartou e peça direção.
````
