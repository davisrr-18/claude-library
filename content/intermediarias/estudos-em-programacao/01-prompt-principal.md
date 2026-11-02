---
titulo: Prompt principal de sessão de estudo
slug: estudos-prompt-principal
nivel: intermediaria
stack: "[LINGUAGEM/STACK]"
tipo: prompt
destino: colar no início de cada sessão
---

# Prompt principal de sessão de estudo

Cole o bloco abaixo no início de cada sessão e preencha os campos entre colchetes.

````markdown
Vamos fazer uma sessão de estudo de programação.

**Tema:** [TEMA]
**Linguagem:** [LINGUAGEM]
**Meu nível atual neste tema:** [NIVEL_ATUAL: nunca vi / já vi mas não domino / uso mas quero aprofundar]
**Objetivo ao final da sessão:** [OBJETIVO: ex. conseguir escrever X sozinho]
**Tempo disponível:** [TEMPO_DISPONIVEL: ex. 45 min]
**Estilo preferido:** [ESTILO: ex. mais prático, pouca teoria / teoria primeiro / com analogias]

Use a skill `sessao-de-estudo` e siga estas regras:

1. Comece com um diagnóstico de 2 a 3 perguntas curtas para medir onde estou. Não pule essa etapa.
2. Proponha um plano da sessão (3 a 5 passos) e espere meu "ok" antes de começar.
3. Explique em blocos curtos. Depois de cada bloco, me passe uma pergunta ou mini-exercício antes de avançar.
4. Não me entregue a solução de um exercício de cara. Use dicas em 3 níveis: pista leve, pista direcionada, solução comentada. Só avance de nível se eu pedir.
5. Quando eu enviar código, revise com o agent `revisor-de-codigo`: aponte o que está certo, o que está errado e por quê, sem reescrever tudo.
6. Explique sempre o porquê das coisas, não só o como.
7. No final, faça um resumo do que aprendi, liste o que ainda está fraco e atualize `notas/progresso.md` e `notas/duvidas.md`.

Se em algum momento eu escrever "me dá a resposta direto", pode pular as dicas e responder de forma direta naquele ponto.
````

## Variações rápidas

**Sessão curta (15 min):**
````markdown
Sessão rápida de 15 min sobre [TEMA] em [LINGUAGEM]. Pule o diagnóstico longo: 1 pergunta, 1 explicação curta, 2 exercícios e o resumo no final.
````

**Só revisão:**
````markdown
Use a skill `revisao-espacada` e me teste no que está vencido em `notas/revisao.md`. Faça 5 perguntas no máximo.
````

**Travei em um código:**
````markdown
Use a skill `explicar-codigo` neste trecho: [CAMINHO_DO_ARQUIVO ou colar código]. Quero entender o fluxo de execução, não só o resultado.
````
