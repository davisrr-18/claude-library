---
name: plan-update
description: Planeja uma atualização ou funcionalidade de software em marcos verificáveis, com delegação adaptativa a subagentes, critérios de saída, aprovações e controle de custo. Use ao iniciar trabalho relevante, multi-etapa ou de alto risco.
---

# Planejamento de atualização por marcos

Transforme os requisitos em um plano executável, com marcos verificáveis e aprovações explícitas.

Este procedimento é genérico. As regras específicas do projeto (stack, comandos de build, testes, convenções, publicação) vêm do `CLAUDE.md` do projeto e das regras técnicas que ele referencia. Em caso de conflito, o `CLAUDE.md` do projeto prevalece.

## Procedimento

1. Ler o `CLAUDE.md` do projeto e as regras técnicas aplicáveis.
2. Verificar `git status` e o registro de tarefa existente (por exemplo `docs/tasks/`). Não sobrescrever trabalho em andamento.
3. Identificar requisitos, critérios de aceitação, dependências e riscos.
4. Classificar a complexidade e decidir a delegação (ver abaixo).
5. Dividir o trabalho em marcos verificáveis.
6. Definir testes e gates de qualidade para cada marco.
7. Definir o modelo e o esforço recomendados, com base na complexidade e no risco.
8. Registrar escopo, decisões e pendências no registro da tarefa.

Para trabalho relevante, apresentar o escopo inicial e pedir autorização antes do Marco 1. Ao concluir cada marco, apresentar os resultados e pedir aprovação antes do próximo. A autorização de um marco cobre somente o escopo aprovado. Correções dentro do escopo aprovado não exigem nova aprovação.

Trabalho trivial ou pergunta somente de leitura pode seguir um fluxo simplificado.

## Classificação de complexidade

Considerar: complexidade lógica e arquitetural, número de arquivos e subsistemas, dependências entre implementações, risco de regressão e de compatibilidade, necessidade de testes e revisão, possibilidade de execução independente e custo de coordenação.

Usar quatro níveis: baixa, média, alta e crítica. A complexidade não determina sozinha o número de subagentes.

## Delegação

Delegue somente quando houver benefício líquido. Não crie agentes por obrigação nem para atingir uma quantidade.

Papéis, definidos em `~/.claude/agents/` ou no projeto em `.claude/agents/`:

- `investigator`: investigação delimitada e somente leitura.
- `implementer`: implementação isolada de escopo aprovado.
- `reviewer`: revisão independente, somente leitura.

Regras:

- Antes de delegar, confirmar que o papel está disponível na sessão. Se não estiver, executar diretamente e informar o usuário. Não substituir silenciosamente por outro agente.
- No máximo três subagentes simultâneos. Não mais de três `implementer` editando ao mesmo tempo, e apenas em arquivos disjuntos.
- Paralelizar somente tarefas independentes. Executar em sequência as dependentes.
- A revisão independente não deve ser feita pelo mesmo agente que implementou a alteração.
- Não delegar a subagentes a decisão de escopo, a aprovação de marcos ou commits, a menos que isso esteja explicitamente no contrato.

### Contrato de delegação

Cada delegação deve informar:

- Objetivo e escopo delimitado.
- Arquivos ou subsistemas relevantes.
- Permissão de leitura ou de edição.
- Dependências e possíveis conflitos.
- Critérios de aceitação e testes esperados.
- Formato de entrega conciso.
- Condição objetiva de encerramento.

### Plano de delegação

Para trabalho relevante, apresentar uma tabela:

| Tarefa | Complexidade | Responsável | Dependências | Critério de saída |
|--------|--------------|-------------|--------------|-------------------|

Incluir somente tarefas realmente necessárias. Indicar quais são paralelas e quais são sequenciais. Quando nenhuma delegação for necessária, registrar o motivo em uma frase.

## Pipeline

Dentro dos marcos aprovados:

1. **Investigar:** entender o problema e identificar arquivos, dependências, riscos e testes relevantes.
2. **Planejar:** decompor o trabalho e definir responsáveis e critérios de saída.
3. **Implementar:** executar diretamente ou delegar partes independentes.
4. **Integrar:** consolidar alterações e resolver incompatibilidades.
5. **Revisar:** revisão independente proporcional ao risco.
6. **Corrigir:** tratar apenas problemas confirmados e reexecutar os testes relacionados.
7. **Validar:** verificar os critérios de aceitação e registrar os resultados.

Evite ciclos indefinidos de implementação e revisão. Após cada revisão, corrija somente problemas concretos, documente os riscos restantes e encerre quando os critérios de saída forem atendidos.

## Marcos

**Marco 1: Investigação e planejamento.** Consolidar as descobertas em um plano único, com tarefas, dependências, responsáveis e critérios de saída. Pedir aprovação antes do Marco 2.

**Marco 2: Implementação.** Implementar incrementalmente o escopo aprovado. Executar testes focados a cada incremento. Integrar continuamente. Pedir aprovação antes do Marco 3.

**Marco 3: Validação.** Revisão independente, correção de problemas confirmados, testes de regressão e build pertinentes. Registrar riscos e pendências. Pedir aprovação para o encerramento.

Não iniciar atividades de um marco antes da aprovação do anterior.

Um marco só pode ser declarado concluído quando: o escopo aprovado está implementado; os critérios de aceitação foram verificados; os testes relevantes têm resultado conhecido; a integração e a revisão exigidas foram feitas; as limitações e pendências estão documentadas; e as aprovações necessárias foram respeitadas.

## Registro

Ao fim de cada marco, registrar no registro da tarefa:

- Agentes que realmente rodaram, com suas responsabilidades.
- Tarefas delegadas e resultados.
- Mudanças no plano, com motivo: escopo que entrou ou saiu, passos reordenados, critérios de saída ajustados, novas decisões.
- Decisões técnicas e arquivos afetados.
- Testes executados e seus resultados reais.
- Problemas e riscos restantes.
- Próximo passo exato, para que uma nova sessão retome apenas pelo registro e pelo Git.

Não copiar transcrições completas nem segredos para o registro. Não duplicar informações já registradas.

Para cada marco, recomendar abrir uma nova conversa. Incluir na recomendação uma frase curta de retomada, com o modelo e o esforço sugeridos.

## Eficiência

- Evitar leituras repetidas do repositório. Reutilizar descobertas e decisões registradas.
- Não revisar novamente um diff inalterado sem justificativa.
- Não reexecutar testes que já passaram, salvo se o código relevante mudou.
- Nunca reduzir testes ou critérios de qualidade para economizar.
- Não declarar economia de tokens ou cota sem medição.

## Relatório final

Ao concluir, informar de forma concisa:

- O que foi implementado ou corrigido, e os arquivos principais.
- Verificação realmente executada e seus resultados.
- Agentes utilizados e recomendação de modelo e esforço: se um nível mais leve bastaria e se houve escalonamento.
- Riscos restantes, bloqueios e verificações manuais pendentes.
