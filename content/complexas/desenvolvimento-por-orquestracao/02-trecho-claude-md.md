---
titulo: Política de desenvolvimento por orquestração para o CLAUDE.md
slug: desenvolvimento-multiagente-trecho-claude-md
nivel: variavel
stack: "qualquer"
tipo: claude-md
destino: colar no CLAUDE.md do projeto (seção própria)
---

# Política de desenvolvimento por orquestração para o CLAUDE.md

Cole a seção abaixo no `CLAUDE.md` do projeto e preencha os placeholders. O procedimento detalhado fica na skill.

````markdown
## Desenvolvimento por orquestração

Delegação é a estratégia padrão para trabalho de engenharia substancial, quando o ambiente oferece suporte. Aplique em toda sessão, inclusive ao retomar. O objetivo é qualidade; custo é critério de desempate.

### Papéis
- **Orquestrador** (sessão principal, `[MODELO_PRINCIPAL]`, esforço `[ESFORCO_PRINCIPAL]`): planeja, escolhe modelo e esforço de cada subagent, integra, verifica e entrega. Responde pelo resultado final.
- **investigator**: investigação somente leitura, com evidências e referências a arquivos.
- **implementer**: implementação isolada dentro do escopo aprovado, com testes de regressão.
- **reviewer**: revisão independente, somente leitura. Sempre outro contexto que não o implementer.

Os valores em `.claude/agents/*.md` são o padrão de cada papel. O orquestrador sobrescreve modelo e esforço por delegação, seguindo as regras abaixo.

### Escolha de modelo e esforço por delegação
Antes de cada delegação, o orquestrador escolhe modelo e esforço pela dificuldade real da parte delegada, não pelo papel. Use a faixa como ponto de partida:

| Faixa | Exemplo de tarefa | Padrão indicado |
|---|---|---|
| Mecânica | renomear, ajustar texto, mover código sem lógica | modelo menor, esforço low |
| Padrão | feature em um subsistema com padrões claros | modelo intermediário, esforço medium |
| Difícil | concorrência, persistência, migração, contrato público | modelo mais forte, esforço high |
| Arquitetural | desenho entre subsistemas, decisões irreversíveis | modelo mais forte, esforço high |

Suba de faixa quando houver sinal de dificuldade: concorrência, persistência, contrato público, invariante entre módulos, especificação ambígua, dependência não documentada, ou falha anterior nesta mesma tarefa.

Regras fixas:
- O reviewer nunca roda em modelo mais fraco que o implementer da mesma tarefa.
- Se a revisão bloquear a mesma entrega duas vezes, suba um nível no implementer e registre o motivo.
- Não escolha o modelo mais barato só para economizar em tarefa difícil.
- Registre, para cada delegação, modelo, esforço e motivo, no registro da tarefa.

Como passar a escolha: o modelo vai no parâmetro `model` da chamada de delegação, e o esforço no parâmetro `effort`, que exige Claude Code v2.1.292 ou superior. Esta seção do `CLAUDE.md` é a instrução que define essa escolha explícita. Se `CLAUDE_CODE_EFFORT_LEVEL` estiver definida, ela prevalece sobre o esforço da delegação; por isso, antes de uma tarefa, confirme que ela não está definida.

### Quando delegar
- Trabalho trivial: fazer direto.
- Investigação relevante: `investigator`.
- Implementação isolada, com arquivos que não colidem: `implementer`.
- Mudança com risco de regressão: `reviewer` independente.
- Não delegar só para atingir um número. Se a coordenação custar mais que o ganho, faça direto.

### Limites
- No máximo três subagents simultâneos, de qualquer tipo. Esse limite veio de medição em uma tarefa específica; mude só com nova medição registrada.
- Implementers só editam arquivos disjuntos.
- Divida o trabalho por subsistema ou conjunto de arquivos, sem sobreposição.
- Não repita investigação já feita sem uma razão concreta.
- Sem delegação aninhada, salvo ganho claro.

### Delegação válida
Cada tarefa delegada define: objetivo e escopo, arquivos ou subsistemas, leitura ou edição, dependências e conflitos possíveis, critério de aceite, verificação esperada, entregáveis, condição de parada, modelo e esforço escolhidos com o motivo, e as seções de regras a aplicar (nomeadas uma a uma, sem mandar ler tudo).

### Execução real e transparência
- Só diga que um subagent rodou se ele rodou.
- Se a delegação falhar ou não estiver disponível, diga isso. Não substitua revisão independente por autorrevisão sem avisar.
- Verifique a saída do subagent antes de integrar.
- Em cada etapa relevante, informe quais agentes rodaram, com modelo e esforço, o que fizeram, achados e riscos restantes.

### Marcos e aprovação (Complexa)
- Marco 1: investigação e plano. Espere aprovação explícita.
- Marco 2: implementação incremental.
- Marco 3: revisão independente e fechamento.
- Aprovação cobre só o escopo acordado. Correções dentro do escopo não exigem nova aprovação.
- Ao fechar um marco, registre em `docs/tasks/` o que mudou no plano, o próximo passo exato, e recomende uma nova conversa para o marco seguinte com a frase de retomada.

### Registro
Para trabalho em várias etapas, ou que atravesse pacotes, mantenha um registro em `docs/tasks/` seguindo `docs/tasks/TEMPLATE.md`. Ele deve trazer, por delegação, modelo, esforço e motivo, além do resultado. Nunca guarde segredos, dados pessoais ou logs grandes no registro.

### Medição
- Ao fechar uma tarefa Intermediária ou Complexa, registre tokens por agente quando disponível e os defeitos que a revisão encontrou.
- Compare, por faixa, qualidade e custo. Se uma faixa mais barata produzir o mesmo resultado de forma consistente, registre isso como evidência antes de rebaixar a faixa.
- Não diga que houve economia sem medição.

### Entrega
Toda entrega final traz uma **Recomendação de agentes**: modelo e esforço usados em cada papel, se uma faixa mais barata teria bastado (com evidência), e se houve escalonamento e por quê.
````
