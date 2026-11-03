---
titulo: Arquitetura do projeto web
slug: webdev-arquitetura
tipo: arquitetura
stack: "HTML, CSS, JavaScript, React, Node.js"
destino: arquitetura.md (raiz do projeto)
---

# Arquitetura de [PROJETO]

Aplicação web full-stack: SPA em React consumindo uma API REST em Node.js. Este arquivo descreve a estrutura, as responsabilidades de cada camada e as regras de dependência. Leia antes de criar, mover ou alterar arquivos.

## Visão geral

```
Navegador ──► client (React + Vite) ──HTTP/JSON──► server (Express) ──► [BANCO]
```

- `client/` e `server/` são pacotes independentes de um monorepo com workspaces.
- Em desenvolvimento, o Vite faz proxy de `/api` para `http://localhost:[PORTA_SERVER]`.
- Em produção, o `server` serve a build estática do `client` e a API no mesmo domínio.

## Estrutura de pastas

```
[PROJETO]/
├── CLAUDE.md
├── arquitetura.md
├── package.json                  workspaces: client, server
├── .env.example
├── .claude/                      agents, skills e settings
├── docs/decisions/               registros de decisão (um .md por decisão)
├── client/
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx              ponto de entrada
│       ├── App.jsx               rotas e layout raiz
│       ├── pages/                uma pasta por rota
│       ├── components/           componentes reutilizáveis
│       │   └── Botao/
│       │       ├── Botao.jsx
│       │       ├── Botao.module.css
│       │       └── Botao.test.jsx
│       ├── hooks/                hooks compartilhados (useXxx)
│       ├── services/             chamadas HTTP (um arquivo por recurso)
│       ├── styles/
│       │   ├── tokens.css        cores, espaços, tipografia (custom properties)
│       │   └── global.css        reset e estilos base
│       └── utils/                funções puras
└── server/
    └── src/
        ├── index.js              sobe o servidor (listen)
        ├── app.js                monta o Express (sem listen, para testes)
        ├── config/env.js         lê e valida variáveis de ambiente
        ├── routes/               define caminhos e liga ao controller
        ├── controllers/          traduz HTTP em chamadas de service
        ├── services/             regra de negócio, sem conhecer HTTP
        ├── repositories/         acesso ao banco (se houver banco)
        ├── middlewares/          auth, validação, erros, logs
        └── utils/                funções puras
```

## Camadas e responsabilidades

### Front (`client/`)

| Camada | Responsabilidade | Pode importar de |
|---|---|---|
| `pages/` | Montar a tela de uma rota, buscar dados via hooks | `components`, `hooks`, `services` |
| `components/` | UI reutilizável, sem saber de rotas nem de HTTP | `components`, `hooks`, `utils`, `styles` |
| `hooks/` | Estado e efeitos compartilhados | `services`, `utils` |
| `services/` | Único lugar que faz `fetch` à API | `utils` |
| `utils/` | Funções puras | nada do projeto |

### Back (`server/`)

| Camada | Responsabilidade | Pode importar de |
|---|---|---|
| `routes/` | Mapear método e caminho para controller, aplicar middlewares | `controllers`, `middlewares` |
| `controllers/` | Ler `req`, chamar service, montar `res` | `services` |
| `services/` | Regra de negócio | `repositories`, `utils` |
| `repositories/` | Consultas ao banco | `config` |
| `middlewares/` | Preocupações transversais | `config`, `utils` |

**Regra de dependência:** as setas só descem na tabela. `services` nunca importa `express`; componentes nunca chamam `fetch` direto; nada do `client` importa do `server` e vice-versa.

## Contrato da API

- Prefixo `/api/v1`, JSON em ambos os sentidos, recursos no plural (`/api/v1/produtos`).
- Métodos: `GET` lê, `POST` cria (201), `PUT`/`PATCH` altera, `DELETE` remove (204).
- Sucesso: corpo com o recurso ou lista; listas paginadas em `{ data: [], page, pageSize, total }`.
- Erro: `{ "error": { "code": "CODIGO_EM_MAIUSCULAS", "message": "texto legível" } }` com o status HTTP correto (400 validação, 401/403 acesso, 404 inexistente, 409 conflito, 500 inesperado).
- Entrada sempre validada no middleware antes de chegar ao controller.
- Mudança de contrato (campo, rota, status) é decisão registrada em `docs/decisions/`.

## Estilo e design (CSS)

- `styles/tokens.css` define `--cor-*`, `--espaco-*`, `--fonte-*`, `--raio-*` em `:root`; modo escuro redefine os mesmos tokens em `@media (prefers-color-scheme: dark)`.
- Cada componente tem o próprio `.module.css`; estilos globais ficam só em `global.css`.
- Mobile-first: estilos base para telas pequenas, `@media (min-width: ...)` para ampliar.
- Layout com Flexbox e Grid; unidades relativas (`rem`, `%`, `fr`) antes de `px`.

## Configuração e segredos

- Variáveis em `.env` (nunca versionado); modelo em `.env.example`.
- `server/src/config/env.js` valida as variáveis na inicialização e falha cedo se faltar alguma.
- No front, só variáveis prefixadas com `VITE_` e nunca com segredos.

## Segurança base

- `helmet` e `cors` configurados no `app.js`, com origem explícita (sem `*` em produção).
- Limite de requisições nas rotas sensíveis (login, cadastro).
- Consultas ao banco parametrizadas; nunca concatenar entrada do usuário.
- Saída no React escapada por padrão; evitar `dangerouslySetInnerHTML`.

## Testes

| Onde | Ferramenta | O que cobre |
|---|---|---|
| `client/src/**/*.test.jsx` | Vitest + Testing Library | Comportamento do componente visto pelo usuário |
| `server/tests/` | `node:test` + Supertest sobre `app.js` | Rotas ponta a ponta, services isolados |
| `utils/` (ambos) | Vitest / `node:test` | Funções puras |

## Regras de integridade

- Toda mudança de comportamento chega com teste novo ou ajustado.
- Mudança nesta estrutura, no contrato da API ou no schema exige atualizar este arquivo no mesmo commit.
- Dependência nova é decisão: registrar em `docs/decisions/` com motivo.

## Decisões

| Data | Decisão | Motivo |
|---|---|---|
| 2026-11-03 | Monorepo com `client/` e `server/` | Um repositório, deploy e versionamento coordenados |
| 2026-11-03 | Vite + React no front | Build rápido e configuração mínima |
| 2026-11-03 | Express em camadas `routes → controllers → services` | Regra de negócio testável sem HTTP |
| 2026-11-03 | `app.js` separado de `index.js` | Testes de rota sem abrir porta |
| 2026-11-03 | CSS Modules + tokens | Escopo local de estilo e tema consistente sem biblioteca extra |
