---
titulo: Pacote de desenvolvimento web completo
slug: webdev
nivel: intermediaria
stack: "HTML, CSS, JavaScript, React, Node.js"
tipo: indice
---

# Pacote de desenvolvimento web completo

**Nível:** Intermediária. São várias peças integradas (regras, agents, skills, permissões), sem risco irreversível, e o pacote pede validação no primeiro projeto real.

**Para que serve:** deixar o Claude pronto para construir aplicações web full-stack com HTML, CSS, JavaScript, React (front) e Node.js (back), seguindo uma arquitetura clara, testando o que muda e revisando antes de dar como pronto.

**Padrões assumidos** (troque no `CLAUDE.md` e no `arquitetura.md` se usar outros): Vite + React no front, Express no back, JavaScript com ESM, Vitest + Testing Library no front, `node:test` + Supertest no back, ESLint + Prettier, CSS Modules com tokens em CSS custom properties.

## Arquivos do pacote

| # | Arquivo | Tipo | Destino no projeto |
|---|---|---|---|
| 01 | `01-prompt-principal.md` | Prompt | Colar ao delegar uma tarefa |
| 02 | `02-claude-md.md` | CLAUDE.md | `CLAUDE.md` (raiz) |
| — | `arquitetura.md` | Arquitetura | `arquitetura.md` (raiz) |
| 03 | `03-settings-json.md` | Permissões e hooks | `.claude/settings.json` |
| 04 | `04-agent-explorador.md` | Agent | `.claude/agents/explorador.md` |
| 05 | `05-agent-frontend.md` | Agent | `.claude/agents/frontend.md` |
| 06 | `06-agent-backend.md` | Agent | `.claude/agents/backend.md` |
| 07 | `07-agent-testador.md` | Agent | `.claude/agents/testador.md` |
| 08 | `08-agent-revisor.md` | Agent | `.claude/agents/revisor.md` |
| 09 | `09-skill-nova-feature.md` | Skill | `.claude/skills/nova-feature/SKILL.md` |
| 10 | `10-skill-corrigir-bug.md` | Skill | `.claude/skills/corrigir-bug/SKILL.md` |
| 11 | `11-skill-componente-react.md` | Skill | `.claude/skills/componente-react/SKILL.md` |
| 12 | `12-skill-endpoint-api.md` | Skill | `.claude/skills/endpoint-api/SKILL.md` |
| 13 | `13-skill-acessibilidade-responsivo.md` | Skill | `.claude/skills/acessibilidade-responsivo/SKILL.md` |
| 14 | `14-checklist-de-verificacao.md` | Checklist | Consulta (não precisa instalar) |

## Placeholders a preencher (uma vez por projeto)

| Placeholder | Exemplo |
|---|---|
| `[PROJETO]` | `loja-online` |
| `[GERENCIADOR]` | `npm` |
| `[PORTA_CLIENT]` / `[PORTA_SERVER]` | `5173` / `3000` |
| `[BANCO]` | PostgreSQL, SQLite, MongoDB ou "nenhum ainda" |
| `[DESCRICAO_DO_PROJETO]` | Uma ou duas frases sobre o produto |

## Ordem de instalação

1. Crie a estrutura de pastas do `arquitetura.md`.
2. Coloque `CLAUDE.md` e `arquitetura.md` na raiz e preencha os placeholders.
3. Crie `.claude/settings.json`, `.claude/agents/` e `.claude/skills/` com os arquivos 03 a 13.
4. Rode a checklist de instalação (seção A do arquivo 14).
5. Delegue a primeira tarefa com o prompt do arquivo 01.
