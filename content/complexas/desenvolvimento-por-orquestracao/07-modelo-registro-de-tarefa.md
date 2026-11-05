---
titulo: Modelo de registro de tarefa
slug: desenvolvimento-multiagente-modelo-registro
nivel: variavel
stack: "qualquer"
tipo: modelo
destino: docs/tasks/TEMPLATE.md
---

# Modelo de registro de tarefa

Modelo para o registro de trabalho em várias etapas. Salve como `docs/tasks/TEMPLATE.md` e copie para um arquivo novo por tarefa (`docs/tasks/AAAA-MM-DD-nome.md`).

````markdown
# [TITULO_DA_TAREFA]

- **Status:** [em andamento / pausada / concluída]
- **Nível:** [Básica / Intermediária / Complexa]
- **Branch / worktree:** [NOME]
- **Sessão principal:** [MODELO] / [ESFORCO]

## Objetivo
[Uma ou duas frases]

## Critérios de aceite
- [ ] [CRITERIO_OBSERVAVEL]

## Escopo
- **Dentro:** [ARQUIVOS_OU_SUBSISTEMAS]
- **Fora:** [O_QUE_NAO_MEXER]

## Marcos
| # | Marco | Estado | Aprovação | Faixa prevista |
|---|---|---|---|---|
| 1 | Investigação e plano | [pendente / feito] | [aprovado em AAAA-MM-DD / pendente] | [FAIXA] |
| 2 | Implementação | [pendente] | [pendente] | [FAIXA] |
| 3 | Revisão e fechamento | [pendente] | [pendente] | [FAIXA] |

## Delegações
Uma linha por subagent, com a escolha e o motivo. Não copie transcrições.

| Data | Agente | Modelo | Esforço | Faixa e motivo | Resultado resumido | Tokens (se medidos) |
|---|---|---|---|---|---|---|
| [AAAA-MM-DD] | investigator | [MODELO] | [ESFORCO] | [FAIXA: sinais que a elevaram] | [ACHADOS] | [N] |

## Escalonamentos
| Data | Agente | De | Para | Motivo |
|---|---|---|---|---|
| [AAAA-MM-DD] | implementer | [MODELO/ESFORCO] | [MODELO/ESFORCO] | [ex.: revisão bloqueou a mesma entrega pela segunda vez] |

## Decisões
| Data | Decisão | Motivo |
|---|---|---|
| [AAAA-MM-DD] | [DECISAO] | [MOTIVO] |

## Revisão e defeitos encontrados
| Data | Revisor | Defeitos (bloqueantes / importantes) | Corrigidos? |
|---|---|---|---|
| [AAAA-MM-DD] | [MODELO] | [N / N] | [sim / não] |

## Verificação
| Data | Comando | Resultado |
|---|---|---|
| [AAAA-MM-DD] | [COMANDO] | [PASSOU / FALHOU, com contagem] |

## Pendências e riscos
- [PENDENCIA]

## Próximo passo exato
[Ação concreta para retomar sem depender do histórico do chat]

## Retomada
Frase para abrir a próxima conversa: "[retomar TAREFA, marco N, com modelo e esforço recomendados]"

## Mudanças no plano
| Data | O que mudou | Motivo |
|---|---|---|
| [AAAA-MM-DD] | [ESCOPO_OU_ORDEM_ALTERADOS] | [MOTIVO] |

> Nunca guarde segredos, credenciais, dados pessoais ou logs grandes aqui.
````
