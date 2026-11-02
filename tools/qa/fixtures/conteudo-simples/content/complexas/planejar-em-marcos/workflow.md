---
name: planejar-em-marcos
description: Resumo do fluxo em marcos verificáveis, com aprovações explícitas do usuário e revisão independente antes do encerramento.
---

# Fluxo em marcos

Use para trabalho relevante, multi-etapa ou de alto risco. Trabalho trivial ou pergunta somente de leitura pode seguir um fluxo simplificado. A skill completa está na peça "Skill plan-update" deste card.

## Antes do Marco 1

1. Leia o `CLAUDE.md` do projeto e as regras técnicas que ele referencia.
2. Verifique o `git status` e o registro de tarefa existente (por exemplo `docs/tasks/`). Não sobrescreva trabalho em andamento.
3. Identifique requisitos, critérios de aceitação, dependências e riscos.
4. Classifique a complexidade em baixa, média, alta ou crítica.
5. Decida a delegação. Delegue somente quando houver benefício líquido.
6. Apresente o escopo inicial e peça autorização.

## Marco 1: investigação e planejamento

- Consolide as descobertas em um plano único, com tarefas, dependências, responsáveis e critérios de saída.
- Apresente o plano de delegação em tabela: Tarefa, Complexidade, Responsável, Dependências, Critério de saída. Indique quais tarefas são paralelas e quais são sequenciais.
- Peça aprovação antes do Marco 2.

## Marco 2: implementação

- Implemente incrementalmente, somente o escopo aprovado.
- Rode testes focados a cada incremento e integre continuamente.
- Peça aprovação antes do Marco 3.

## Marco 3: validação

- Faça a revisão independente, corrija os problemas confirmados e rode os testes de regressão e o build pertinentes.
- Registre riscos e pendências.
- Peça aprovação para o encerramento.

Não inicie atividades de um marco antes da aprovação do anterior. Uma autorização cobre somente o escopo aprovado.

## Delegação

- Papéis: `investigator` (investigação somente leitura), `implementer` (implementação de escopo aprovado) e `reviewer` (revisão independente, somente leitura).
- Confirme que o papel existe na sessão antes de delegar.
- No máximo três subagentes simultâneos. Não mais de três `implementer` editando, e só em arquivos disjuntos.
- A revisão não é feita pelo agente que implementou a alteração.
- Subagentes não decidem escopo, aprovação de marcos ou commits, a menos que o contrato diga isso.

Cada delegação informa: objetivo e escopo, arquivos, permissão de leitura ou edição, dependências, critérios de aceitação e testes, formato de entrega e condição de encerramento.

## Registro da tarefa

Ao fim de cada marco, registre: agentes que realmente rodaram, tarefas delegadas e resultados, mudanças no plano com motivo, decisões técnicas e arquivos afetados, testes executados com resultados reais, riscos restantes e o próximo passo exato. Não copie transcrições nem segredos.

Para cada marco, recomende abrir uma nova conversa, com uma frase curta de retomada que indique o modelo e o esforço sugeridos.

## Relatório final

- O que foi implementado ou corrigido, e os arquivos principais.
- Verificação realmente executada e seus resultados.
- Agentes utilizados, e se um nível mais leve bastaria.
- Riscos restantes, bloqueios e verificações manuais pendentes.
