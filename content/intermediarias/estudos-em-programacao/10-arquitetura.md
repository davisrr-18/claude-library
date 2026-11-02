---
titulo: Arquitetura da pasta de estudos
slug: estudos-arquitetura
tipo: arquitetura
stack: "[LINGUAGEM/STACK]"
destino: arquitetura.md (raiz da pasta de estudos)
---

# Arquitetura da pasta de estudos

Este arquivo descreve como a pasta de estudos é organizada e como as peças se conectam. Leia antes de criar, mover ou alterar qualquer arquivo aqui.

## Visão geral

Pasta de estudos de programação em `[LINGUAGEM]`. O Claude atua como tutor. Todo o estado do estudo vive em arquivos Markdown (`notas/`), os exercícios têm testes automatizados e as soluções ficam separadas em `gabarito/`.

## Estrutura de pastas

```
[PASTA-DE-ESTUDOS]/
├── CLAUDE.md                  regras permanentes do tutor
├── arquitetura.md             este arquivo
├── .claude/
│   ├── agents/
│   │   ├── tutor.md
│   │   ├── revisor-de-codigo.md
│   │   └── gerador-de-exercicios.md
│   └── skills/
│       ├── sessao-de-estudo/SKILL.md
│       ├── revisao-espacada/SKILL.md
│       └── explicar-codigo/SKILL.md
├── notas/
│   ├── progresso.md           histórico do que foi estudado
│   ├── revisao.md             itens e datas da revisão espaçada
│   └── duvidas.md             dúvidas em aberto
├── exercicios/
│   └── [tema]/
│       └── NN-[nome]/
│           ├── enunciado.md
│           ├── solucao_aluno.[ext]
│           └── teste_[nome].[ext]
└── gabarito/
    └── [tema]/
        └── NN-[nome].[ext]
```

## Componentes

| Componente | Responsabilidade | Lê | Escreve |
|---|---|---|---|
| `CLAUDE.md` | Regras de ensino, comandos, proibições | (carregado em toda sessão) | só o usuário |
| agent `tutor` | Explicar, verificar entendimento, dar dicas | `notas/`, `exercicios/` | `notas/` |
| agent `revisor-de-codigo` | Feedback sobre o código do aluno | `exercicios/` | nada (somente leitura) |
| agent `gerador-de-exercicios` | Criar exercícios, testes e gabarito | `notas/progresso.md` | `exercicios/`, `gabarito/` |
| skill `sessao-de-estudo` | Conduzir a sessão completa | `notas/` | `notas/` |
| skill `revisao-espacada` | Testar itens vencidos e reagendar | `notas/revisao.md` | `notas/revisao.md` |
| skill `explicar-codigo` | Explicar código em camadas | código indicado | nada (somente leitura) |

## Fluxo

```
estudar ──► praticar ──► revisar código ──► registrar ──► revisar depois
(tutor /     (exercicios/   (revisor-de-      (notas/       (revisao-
 sessao-      + testes)      codigo)           progresso,    espacada)
 de-estudo)                                    revisao,
                                               duvidas)
```

1. **Estudar:** a skill `sessao-de-estudo` diagnostica, planeja e ensina em blocos, com o agent `tutor`.
2. **Praticar:** o agent `gerador-de-exercicios` cria os exercícios; o aluno resolve em `solucao_aluno.[ext]`.
3. **Revisar código:** o agent `revisor-de-codigo` roda os testes e devolve o feedback.
4. **Registrar:** ao fechar a sessão, `notas/` é atualizado.
5. **Revisar depois:** a skill `revisao-espacada` testa os itens vencidos e reagenda.

## Formato dos arquivos de estado

**`notas/progresso.md`** (um bloco por sessão, mais recente no fim):

```
## AAAA-MM-DD — [Tema] ([Linguagem])
- Coberto: ...
- Domínio: fraco | ok | forte
- Pontos fracos: ...
- Próximo passo: ...
```

**`notas/revisao.md`** (uma linha por item):

```
| Item | Tema | Último intervalo (dias) | Próxima revisão | Observação |
|---|---|---|---|---|
```

Intervalos: 1, 3, 7, 14 e 30 dias.

**`notas/duvidas.md`** (lista; marque as resolvidas com `[x]`):

```
- [ ] AAAA-MM-DD — [Tema]: pergunta em aberto
```

## Convenções

- Pastas e arquivos em `kebab-case`, exceto `CLAUDE.md`, `SKILL.md` e os arquivos de código, que seguem a convenção de `[LINGUAGEM]`.
- Exercícios numerados por dificuldade (`01-`, `02-`, ...), um conceito principal por exercício.
- Datas no formato `AAAA-MM-DD`.
- Textos em português; termos técnicos em inglês, explicados na primeira vez.

## Regras de integridade

- O gabarito nunca fica na mesma pasta do exercício e não é mostrado antes de o aluno pedir.
- `solucao_aluno.[ext]` pertence ao aluno: nunca sobrescrever nem reescrever.
- `progresso.md` e `duvidas.md` só recebem acréscimos; `revisao.md` pode ter linhas atualizadas.
- Nada é criado ou alterado fora de `[PASTA-DE-ESTUDOS]`.
- Ao adicionar ou remover pasta, agent ou skill, atualizar a árvore e a tabela de componentes deste arquivo.

## Decisões

| Data | Decisão | Motivo |
|---|---|---|
| 2026-11-02 | Estado do estudo em Markdown dentro de `notas/` | Legível, versionável e editável à mão |
| 2026-11-02 | Gabarito em pasta separada | Evita ver a solução sem querer |
| 2026-11-02 | Revisor de código somente leitura | O aluno precisa corrigir o próprio código |
| 2026-11-02 | Revisão espaçada em 1, 3, 7, 14 e 30 dias | Intervalo simples e suficiente para começar |
