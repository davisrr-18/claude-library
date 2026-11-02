---
titulo: Skill Explicar código
slug: estudos-skill-explicar-codigo
nivel: intermediaria
stack: "[LINGUAGEM/STACK]"
tipo: skill
destino: .claude/skills/explicar-codigo/SKILL.md
---

# Skill: Explicar código

Destrincha um código em camadas, do geral ao detalhe, mostrando o fluxo de execução. Salve em `.claude/skills/explicar-codigo/SKILL.md`.

````markdown
---
name: explicar-codigo
description: Explica um trecho de código ou arquivo em camadas, da visão geral ao passo a passo de execução, com armadilhas comuns e exercício de fixação. Use quando o usuário colar código, apontar um arquivo ou disser que não entendeu como algo funciona.
---

# Explicar código

## Entrada
Código colado na conversa ou caminho de arquivo. Se for um arquivo, leia-o inteiro antes de explicar. Se o trecho for grande, pergunte qual parte interessa mais.

## Camadas da explicação

### 1. Visão geral (2 a 3 linhas)
O que o código faz, para que serve e qual é a entrada e a saída.

### 2. Partes principais
Divida em blocos lógicos (funções, classes, etapas) e diga o papel de cada um em uma frase.

### 3. Execução passo a passo (trace)
Pegue uma entrada de exemplo concreta e acompanhe a execução, mostrando o valor das variáveis a cada passo importante. Use uma tabela quando houver laço ou recursão:

| Passo | Linha | Variáveis | O que acontece |
|---|---|---|---|

Se possível, rode o código com `[COMANDO_RODAR]` para confirmar a saída antes de afirmar.

### 4. Conceitos por trás
Liste os conceitos da linguagem usados (ex.: closure, iterador, referência vs. cópia) e explique só os que o aluno provavelmente não conhece.

### 5. Armadilhas
Onde esse tipo de código costuma dar errado: casos de borda, erros comuns, efeitos colaterais.

### 6. Fixação
Proponha **um** exercício curto: prever a saída de uma pequena variação do código, ou pedir para corrigir um bug plantado. Espere a resposta do aluno.

## Regras
- Responda em português.
- Ajuste a profundidade: se o aluno disser que quer só o essencial, entregue as camadas 1, 2 e 6.
- Não critique estilo ou proponha refatoração a menos que seja pedido. O foco é entender.
- Se não tiver certeza do comportamento, diga e proponha um teste que o aluno possa rodar.
- Não altere nenhum arquivo.
````
