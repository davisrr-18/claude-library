---
titulo: Skill Sessão de estudo
slug: estudos-skill-sessao-de-estudo
nivel: intermediaria
stack: "[LINGUAGEM/STACK]"
tipo: skill
destino: .claude/skills/sessao-de-estudo/SKILL.md
---

# Skill: Sessão de estudo

A rotina completa de uma sessão, do diagnóstico ao registro. Salve em `.claude/skills/sessao-de-estudo/SKILL.md`.

````markdown
---
name: sessao-de-estudo
description: Conduz uma sessão completa de estudo de programação, com diagnóstico, plano, explicação em blocos, exercícios, feedback e registro de progresso. Use quando o usuário quiser estudar um tema ou pedir uma sessão de estudo.
---

# Sessão de estudo

## Entradas
Tema, linguagem, nível atual, objetivo e tempo disponível. Se algo faltar, pergunte de uma vez só, em uma única mensagem.

## Passo a passo

### 1. Contexto
- Leia `notas/progresso.md` e `notas/duvidas.md`, se existirem.
- Se o tema já foi estudado, comece pelo que estava fraco.

### 2. Diagnóstico (2 a 3 perguntas)
Perguntas curtas, de respostas rápidas, que revelem o que o aluno já sabe. Ajuste o plano com base nas respostas.

### 3. Plano
Mostre um plano de 3 a 5 passos que caiba no tempo informado. Espere o "ok" do aluno. Se ele pedir mudanças, ajuste.

### 4. Ciclo de ensino (repetir por conceito)
1. Explique um conceito em poucas linhas, com um exemplo pequeno que roda.
2. Faça uma pergunta ou mini-exercício.
3. Avalie a resposta:
   - Se acertou: confirme o porquê e avance.
   - Se errou: não corrija direto. Dê uma pista de nível 1. Suba para nível 2 e 3 só se necessário.
4. Para exercícios maiores, use o agent `gerador-de-exercicios` e, ao receber o código, o agent `revisor-de-codigo`.

### 5. Fechamento
- Resumo do que foi aprendido (até 5 linhas).
- Pontos fracos.
- Próximo passo sugerido.

### 6. Registro (obrigatório)
- **`notas/progresso.md`**: acrescente uma linha ou bloco com data, tema, o que foi coberto e domínio (fraco / ok / forte).
- **`notas/revisao.md`**: para cada conceito novo, adicione o item e a data da próxima revisão (hoje + 1 dia).
- **`notas/duvidas.md`**: registre dúvidas que ficaram abertas.

Crie os arquivos e pastas que não existirem.

## Regras
- Responda em português.
- Respeite o tempo: se estiver estourando, avise e ofereça encerrar com um resumo.
- Se o aluno disser "me dá a resposta direto", responda direto naquele ponto, sem insistir nas dicas.
- Não invente: se não tiver certeza de algo, diga e sugira como verificar.

## Formato sugerido para `notas/progresso.md`

```
## AAAA-MM-DD — [Tema] ([Linguagem])
- Coberto: ...
- Domínio: fraco | ok | forte
- Pontos fracos: ...
- Próximo passo: ...
```
````
