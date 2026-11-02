---
titulo: Pacote geral de estudos em programação
slug: estudos-programacao
nivel: intermediaria
stack: "[LINGUAGEM/STACK]"
tipo: indice
---

# Pacote geral de estudos em programação

**Nível:** Intermediária. São vários artefatos que trabalham juntos, sem risco irreversível, e o pacote pede validação no uso real.

**Para que serve:** transformar o Claude em um tutor de programação com método: ele diagnostica, ensina em passos curtos, passa exercício, corrige com feedback e registra o progresso para você retomar depois.

## Arquivos do pacote

| # | Arquivo | Tipo | Destino no seu projeto |
|---|---|---|---|
| 01 | `01-prompt-principal.md` | Prompt | Colar no início de cada sessão |
| 02 | `02-claude-md.md` | CLAUDE.md | `CLAUDE.md` (raiz da pasta de estudos) |
| 03 | `03-agent-tutor.md` | Agent | `.claude/agents/tutor.md` |
| 04 | `04-agent-revisor-de-codigo.md` | Agent | `.claude/agents/revisor-de-codigo.md` |
| 05 | `05-agent-gerador-de-exercicios.md` | Agent | `.claude/agents/gerador-de-exercicios.md` |
| 06 | `06-skill-sessao-de-estudo.md` | Skill | `.claude/skills/sessao-de-estudo/SKILL.md` |
| 07 | `07-skill-revisao-espacada.md` | Skill | `.claude/skills/revisao-espacada/SKILL.md` |
| 08 | `08-skill-explicar-codigo.md` | Skill | `.claude/skills/explicar-codigo/SKILL.md` |
| 09 | `09-checklist-de-verificacao.md` | Checklist | Consulta (não precisa instalar) |

## Estrutura final na sua pasta de estudos

```
[PASTA-DE-ESTUDOS]/
├── CLAUDE.md
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
│   ├── progresso.md
│   ├── duvidas.md
│   └── revisao.md
├── exercicios/
└── gabarito/
```

As pastas `notas/`, `exercicios/` e `gabarito/` o Claude cria sozinho na primeira sessão, se não existirem.

## Placeholders a preencher (uma vez)

| Placeholder | Exemplo |
|---|---|
| `[LINGUAGEM]` | Python, JavaScript, Go |
| `[COMANDO_RODAR]` | `python arquivo.py` |
| `[COMANDO_TESTAR]` | `pytest` |
| `[PASTA-DE-ESTUDOS]` | `~/estudos` |
| `[NIVEL_ATUAL]` | iniciante, intermediário |
| `[OBJETIVO]` | "entender recursão", "montar uma API" |

## Como usar no dia a dia

1. Abra o Claude Code dentro de `[PASTA-DE-ESTUDOS]`.
2. Cole o prompt do arquivo 01 preenchendo `[TEMA]`, `[OBJETIVO]` e `[TEMPO_DISPONIVEL]`.
3. O Claude conduz a sessão pela skill `sessao-de-estudo` e atualiza `notas/progresso.md` no final.
4. Em outro dia, use a skill `revisao-espacada` para revisar o que está no ponto de esquecer.
5. Quando travar em um código, peça para a skill `explicar-codigo` destrinchar.

## Ajustes esperados

Com o uso, o que normalmente muda é só o `CLAUDE.md` (comandos e preferências suas) e o nível dos exercícios. Agents e skills tendem a ficar estáveis.
