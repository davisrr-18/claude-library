---
name: implementar-com-testes
description: Passo a passo para uma mudança isolada: investigar, implementar com testes de regressão e revisar de forma independente.
---

# Fluxo: investigar, implementar com testes, revisar

Use este fluxo quando uma funcionalidade ou correção atravessa vários arquivos e precisa de testes. Os três papéis são agentes separados, definidos em `~/.claude/agents/` (ou em `.claude/agents/` do projeto):

| Papel | Pode editar? | O que entrega |
|-------|--------------|---------------|
| `investigator` | Não (somente leitura) | Achados com `caminho:linha`, fatos separados de suposições |
| `implementer` | Sim, somente no escopo aprovado | Arquivos alterados, testes e saída real dos comandos |
| `reviewer` | Não (somente leitura) | Problemas com severidade, `arquivo:linha`, impacto e evidência |

## Antes de começar

1. Confirme que os três papéis estão disponíveis na sessão. Se algum não estiver, execute essa etapa diretamente e informe o usuário. Não substitua silenciosamente por outro agente.
2. Leia o `CLAUDE.md` do projeto e as regras técnicas que ele referencia.
3. Confirme o escopo aprovado. Mudança fora dele exige nova aprovação.

## Etapa 1: investigar (investigator)

1. Delegue ao `investigator` um escopo delimitado: arquivos ou subsistemas e uma pergunta exata.
2. Peça: arquivos relevantes, dependências, caminhos de execução, invariantes, riscos de regressão e testes existentes.
3. Ele não modifica arquivos. Ele deve parar quando as evidências forem suficientes; evite investigações duplicadas.
4. Antes de seguir, separe o que foi verificado do que é suposição.

## Etapa 2: montar o contrato

Monte o contrato de delegação antes de implementar:

```text
Objetivo e escopo:
Arquivos ou subsistemas:
Permissão: edição apenas nos arquivos listados
Dependências e possíveis conflitos:
Critérios de aceitação:
Testes esperados (comandos de build e teste do projeto):
Formato de entrega: arquivos alterados, comandos e saída real, riscos restantes
Condição de encerramento:
```

Organize a ordem: tarefas dependentes rodam em sequência. Tarefas independentes podem rodar em paralelo, respeitando o limite de três subagentes simultâneos. No máximo três `implementer` podem editar ao mesmo tempo, e somente em arquivos disjuntos.

## Etapa 3: implementar com testes (implementer)

1. Delegue ao `implementer` somente o escopo aprovado e o contrato.
2. Ele faz uma mudança pequena e focada, escreve testes de regressão focados e preserva interfaces públicas, compatibilidade e comportamento de persistência.
3. Ele roda o build e os testes nomeados no contrato e informa a saída real.
4. Ele não faz commit, push nem publicação, a menos que o contrato diga explicitamente.
5. Se o escopo for ambíguo ou exigir arquivos fora dele, ele para e relata em vez de expandir o trabalho.

## Etapa 4: integrar

- Consolide as alterações e resolva incompatibilidades entre elas.
- Confira se os arquivos alterados estão dentro do escopo do contrato.
- Reexecute os testes relacionados ao que mudou.

## Etapa 5: revisar (reviewer)

1. Quem revisa precisa ser um agente diferente do que implementou a alteração.
2. Delegue ao `reviewer` o diff, o código ao redor e os critérios de aceitação.
3. Ele foca em defeitos reais, regressões, compatibilidade, integridade de dados, segurança e critérios de aceitação. Observações cosméticas e achados duplicados não entram.
4. Cada achado traz severidade, `arquivo:linha`, impacto e evidência.
5. Se não houver problema concreto, ele diz isso e lista o que verificou.

## Etapa 6: corrigir e validar

1. Corrija somente problemas confirmados e reexecute os testes relacionados.
2. Evite ciclos indefinidos de implementação e revisão. Após cada revisão, corrija apenas o que for concreto, documente os riscos restantes e encerre quando os critérios de aceitação forem atendidos.
3. Antes de declarar a mudança concluída, confira: critérios de aceitação verificados, testes com resultado conhecido e riscos ou limitações registrados.
