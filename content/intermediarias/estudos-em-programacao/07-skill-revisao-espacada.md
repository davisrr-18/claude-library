---
titulo: Skill Revisão espaçada
slug: estudos-skill-revisao-espacada
nivel: intermediaria
stack: "[LINGUAGEM/STACK]"
tipo: skill
destino: .claude/skills/revisao-espacada/SKILL.md
---

# Skill: Revisão espaçada

Faz você revisar o que estudou antes de esquecer, usando o registro em `notas/revisao.md`. Salve em `.claude/skills/revisao-espacada/SKILL.md`.

````markdown
---
name: revisao-espacada
description: Conduz revisão espaçada do que o usuário já estudou, testando itens vencidos em notas/revisao.md e reagendando conforme o desempenho. Use quando o usuário pedir revisão, quiser ser testado ou começar o dia de estudo.
---

# Revisão espaçada

## Intervalos
1 dia → 3 dias → 7 dias → 14 dias → 30 dias.

- Acertou: o item vai para o próximo intervalo.
- Acertou com dificuldade ou com dica: repete o mesmo intervalo.
- Errou: volta para 1 dia.

## Formato de `notas/revisao.md`

```
| Item | Tema | Último intervalo (dias) | Próxima revisão | Observação |
|---|---|---|---|---|
| Closures | JavaScript | 3 | 2026-11-05 | confundiu escopo |
```

## Passo a passo

1. Leia `notas/revisao.md`. Se não existir ou estiver vazio, diga isso e sugira uma sessão de estudo primeiro.
2. Obtenha a data de hoje (rode `date +%F` se precisar) e selecione os itens com "Próxima revisão" igual ou anterior a hoje.
3. Se não houver nenhum vencido, diga qual é a próxima data e encerre.
4. Limite a sessão a **5 itens**, priorizando os mais atrasados e os que tiveram erro antes.
5. Para cada item:
   - Faça **uma** pergunta que exija lembrar ou aplicar (não só definição). Prefira pedir um trecho de código curto ou a previsão da saída de um código.
   - Espere a resposta. Não entregue pistas antes.
   - Avalie e explique brevemente o certo e o errado.
6. Atualize `notas/revisao.md` com o novo intervalo, a nova data e uma observação curta.
7. Ao final, resuma: quantos acertos, o que está frágil e quando é a próxima revisão.

## Regras
- Responda em português.
- Varie o tipo de pergunta entre os itens (prever saída, achar o erro, completar o código, explicar com suas palavras).
- Se um item errar duas vezes seguidas, sugira reestudar o conceito com a skill `sessao-de-estudo`.
- Não invente datas: use sempre a data real do sistema.
````
