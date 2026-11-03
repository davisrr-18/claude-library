---
titulo: CLAUDE.md do projeto web
slug: webdev-claude-md
nivel: intermediaria
stack: "HTML, CSS, JavaScript, React, Node.js"
tipo: claude-md
destino: CLAUDE.md (raiz do projeto)
---

# CLAUDE.md do projeto web

Salve como `CLAUDE.md` na raiz do projeto. É lido em toda sessão, então foi mantido enxuto; o detalhe estrutural fica no `arquitetura.md`.

````markdown
# [PROJETO]

[DESCRICAO_DO_PROJETO]

@arquitetura.md

## Stack
- Front: HTML semântico, CSS (CSS Modules + tokens em custom properties), JavaScript ESM, React com Vite.
- Back: Node.js com Express, JavaScript ESM. Banco: [BANCO].
- Gerenciador de pacotes: [GERENCIADOR] (workspaces: `client/` e `server/`).

## Comandos
- Instalar: `[GERENCIADOR] install`
- Dev (front e back): `[GERENCIADOR] run dev`
- Testes (tudo): `[GERENCIADOR] test`
- Testes do front: `[GERENCIADOR] run test -w client`
- Testes do back: `[GERENCIADOR] run test -w server`
- Lint: `[GERENCIADOR] run lint`
- Formatar: `[GERENCIADOR] run format`
- Build: `[GERENCIADOR] run build`
- Portas: front `[PORTA_CLIENT]`, back `[PORTA_SERVER]`

## Convenções
- Componentes React: função + hooks, um componente por arquivo, nome em PascalCase, arquivo `Nome.jsx` com `Nome.module.css` e `Nome.test.jsx` ao lado.
- Hooks em `hooks/`, prefixo `use`. Chamadas HTTP só em `services/`, nunca dentro de componentes.
- CSS: mobile-first, valores de cor, espaço e tipografia vêm dos tokens (`var(--...)`), nunca valores soltos. Sem `!important`.
- HTML: elementos semânticos antes de `div`; todo controle interativo é um elemento nativo (`button`, `a`, `input`) com rótulo.
- JavaScript: `const` por padrão, sem `var`, funções pequenas, erros tratados e nunca engolidos em silêncio.
- Back: em camadas `routes → controllers → services`; entrada validada na borda; erros no formato `{ error: { code, message } }`.
- Commits pequenos, no imperativo, em português (`adiciona filtro de busca`).

## Proibições
- Nunca ler, editar ou imprimir `.env*`. Variáveis novas entram em `.env.example`, sem valores reais.
- Nunca colocar segredo, chave ou token no código do front.
- Não instalar dependência sem me perguntar (diga qual, para quê e o tamanho).
- Não editar `package-lock.json` à mão.
- Não fazer `push`, `deploy` ou apagar branch sem pedido explícito.
- Não desligar lint, teste ou regra de acessibilidade para "fazer passar".

## Autonomia
- Decide sozinho: nomes, divisão em funções e componentes, organização de CSS, testes a escrever.
- Pergunta antes de: mudar contrato da API, schema do banco, estrutura de pastas, adicionar dependência, alterar configuração de build.
- Se a tarefa ficar maior do que o nível anunciado, para e reclassifica.

## Fluxo por tarefa
1. Classifique o nível (Básica, Intermediária ou Complexa), anuncie em uma linha e siga o fluxo correspondente.
2. Na dúvida entre dois níveis, escolha o maior.
3. Use o agent `explorador` antes de mexer em área que você ainda não leu.
4. Use o agent `revisor` antes de dar como pronto qualquer mudança Intermediária ou Complexa.

## Definição de pronto
- Comportamento pedido funciona (mostre como verificou).
- `lint` e os testes relevantes passam; mudança de comportamento tem teste novo.
- Sem alterações fora do escopo pedido.
- Interface nova funciona só com teclado e em tela de 360px.
- Resumo final: arquivos alterados, comandos rodados e resultado, pendências.
````

## O que ajustar com o tempo

- **Stack e Comandos** mudam por projeto.
- Se passar de ~100 linhas, mova detalhes para skills ou regras por pasta em vez de crescer este arquivo.
- Cada regra que você repetir mais de duas vezes em prompts deve virar linha aqui.
