---
titulo: Skill Endpoint de API
slug: webdev-skill-endpoint-api
nivel: intermediaria
stack: "HTML, CSS, JavaScript, React, Node.js"
tipo: skill
destino: .claude/skills/endpoint-api/SKILL.md
---

# Skill: Endpoint de API

Cria um endpoint REST nas camadas certas, com validação, erros padronizados e testes. Salve em `.claude/skills/endpoint-api/SKILL.md`.

````markdown
---
name: endpoint-api
description: Cria ou altera um endpoint REST em server/ (Express) seguindo as camadas routes, controllers e services, com validação de entrada, formato de erro padrão e testes com Supertest. Use quando o usuário pedir uma rota nova ou mudança em uma existente.
---

# Endpoint de API

## Entradas
Recurso, operação (listar, buscar, criar, alterar, remover), quem pode chamar (público, autenticado, papel) e regras de negócio. Se faltar, pergunte numa mensagem só.

## Passo a passo

### 1. Contrato primeiro
Escreva e mostre antes de implementar:

| Item | Definição |
|---|---|
| Método e caminho | `POST /api/v1/recursos` |
| Autenticação | pública / token / papel |
| Entrada | corpo, parâmetros e query com tipo, obrigatoriedade e limites |
| Sucesso | status e corpo |
| Erros | status, `code` e `message` de cada caso (400, 401, 403, 404, 409, 500) |

- Confira consistência com "Contrato da API" em `arquitetura.md`.
- Endpoint **novo** pode seguir. **Mudança** em endpoint existente que o front já usa exige aprovação (pode quebrar o cliente).

### 2. Teste da rota
Com Supertest sobre `app.js`: caminho feliz, validação inválida, não autenticado/sem permissão, recurso inexistente e conflito, se aplicável. Rode e veja falhar.

### 3. Implementar por camada
1. **Validação:** schema no middleware, rejeitando campos desconhecidos e tipos errados.
2. **Rota:** liga método e caminho ao controller, com os middlewares (auth, validação).
3. **Controller:** lê `req`, chama o service, devolve `res` com o status certo. Sem regra de negócio.
4. **Service:** regra de negócio e decisões; lança erros de domínio com `code`.
5. **Repositório:** consulta parametrizada; transação quando houver mais de uma escrita dependente.
6. **Erro:** o middleware central transforma erros de domínio em `{ error: { code, message } }`.

### 4. Listagens
Sempre paginar (`page`, `pageSize` com limite máximo) e definir ordenação estável.

### 5. Verificar
- `[GERENCIADOR] run lint` e `[GERENCIADOR] run test -w server` passam.
- Chame o endpoint de verdade (ou pelo teste) e confira status, corpo e erros.
- Revise: dados sensíveis na resposta? autorização checada no servidor? nada em log que não deveria?

### 6. Entregar
Contrato final (tabela do passo 1 atualizada), arquivos alterados, testes e resultado, e o impacto no front (serviço a criar ou ajustar).

## Regras
- Responda em português.
- Nunca confie em dados do cliente: valide tudo, autorize no servidor.
- Não retorne o objeto do banco inteiro; devolva só os campos do contrato.
- Atualize `arquitetura.md` se o contrato mudou a convenção geral.
````
