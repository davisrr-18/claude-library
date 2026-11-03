---
titulo: Checklist de verificação do pacote web
slug: webdev-checklist-de-verificacao
nivel: intermediaria
stack: "HTML, CSS, JavaScript, React, Node.js"
tipo: checklist
destino: consulta (não precisa instalar)
---

# Checklist de verificação

Use em quatro momentos: ao instalar o pacote, ao fechar cada tarefa, antes de integrar uma mudança e ao revisar o pacote depois de algumas semanas.

## A. Instalação (uma vez por projeto)

- [ ] `CLAUDE.md` e `arquitetura.md` estão na raiz e todos os `[PLACEHOLDERS]` foram preenchidos.
- [ ] `CLAUDE.md` contém a linha `@arquitetura.md`.
- [ ] A estrutura de pastas do `arquitetura.md` existe (`client/`, `server/`, `docs/decisions/`).
- [ ] `.claude/settings.json` é um JSON válido (abre sem erro) e os padrões de `allow`/`ask` usam o seu gerenciador de pacotes.
- [ ] `jq` e `prettier` estão instalados (o hook de formatação depende deles).
- [ ] Os 5 agents estão em `.claude/agents/` e as 5 skills em `.claude/skills/<nome>/SKILL.md`, com o nome da pasta igual ao `name` do frontmatter.
- [ ] `[GERENCIADOR] install`, `run dev`, `test`, `run lint` e `run build` funcionam.
- [ ] `.env` está no `.gitignore` e `.env.example` existe.
- [ ] Ao abrir o Claude Code no projeto, ele lista os agents e as skills do pacote.

## B. Teste de fumaça (primeira tarefa)

- [ ] O Claude leu `CLAUDE.md` e `arquitetura.md` antes de começar.
- [ ] Anunciou o nível da tarefa em uma linha.
- [ ] Em tarefa Intermediária, mapeou com o `explorador` e mostrou um plano curto antes de implementar.
- [ ] Pediu aprovação antes de mexer em contrato, schema, estrutura ou dependência.
- [ ] Tentou ler `.env` e foi bloqueado (teste a regra de `deny`).
- [ ] Depois de editar um arquivo, o Prettier o formatou sozinho.

## C. Fechamento de cada tarefa

- [ ] O comportamento pedido funciona e o Claude mostrou como verificou.
- [ ] `[GERENCIADOR] run lint` passa.
- [ ] Os testes da área passam; mudança de comportamento tem teste novo.
- [ ] Bug corrigido tem teste que falhava antes e passa agora.
- [ ] Nenhum arquivo fora do escopo foi alterado (`git status` e `git diff`).
- [ ] O `revisor` foi usado em mudanças Intermediárias e Complexas, e os bloqueantes foram resolvidos.
- [ ] `arquitetura.md` atualizado se estrutura, contrato ou schema mudaram.
- [ ] Resumo final com arquivos, comandos rodados, resultado e pendências.

## D. Antes de integrar (merge/deploy)

**Funcionalidade**
- [ ] Fluxo principal e fluxos de erro testados à mão no app rodando.
- [ ] Estados de carregando, erro e vazio tratados em toda tela que busca dados.

**Segurança**
- [ ] Nenhum segredo no código nem no bundle do front.
- [ ] Toda entrada é validada no servidor e a autorização é checada no servidor.
- [ ] Respostas não vazam campos internos; logs não têm dados sensíveis.
- [ ] CORS com origem explícita; `helmet` ativo.

**Interface**
- [ ] Tudo funciona só com teclado, com foco visível.
- [ ] Sem rolagem horizontal em 360px.
- [ ] Contraste e rótulos conferidos.

**Build**
- [ ] `[GERENCIADOR] run build` conclui sem erro nem aviso novo.
- [ ] Variáveis de ambiente novas estão em `.env.example` e documentadas.

## E. Revisão do pacote (a cada 3 a 4 semanas)

- [ ] O `CLAUDE.md` está abaixo de ~100 linhas? Se não, mova detalhe para skill.
- [ ] Alguma regra que você repete nos prompts já virou linha no `CLAUDE.md`?
- [ ] Os padrões de `allow` estão sem perguntas desnecessárias e sem permissões demais?
- [ ] O `arquitetura.md` ainda bate com as pastas reais? (compare a árvore com `ls`)
- [ ] Algum agent é pouco usado? Reveja a `description` ou remova.
- [ ] O `revisor` está achando problemas reais, ou só repetindo o óbvio? Ajuste os critérios.

## Sinais de que algo está errado

| Sintoma | Provável causa | Ajuste |
|---|---|---|
| O Claude ignora a arquitetura | `CLAUDE.md` sem `@arquitetura.md` ou arquivo fora da raiz | Confira a linha de import e o local |
| Pede permissão para rodar testes | Padrão de `allow` não bate com o seu gerenciador | Ajuste `settings.json` |
| Agent nunca é chamado | `description` vaga | Reescreva dizendo quando usar |
| Mexe em `client/` e `server/` juntos sem avisar | Falta a regra de contrato | Reforce "Autonomia" no `CLAUDE.md` |
| Testes passam mas o bug volta | Teste não reproduzia a causa | Refaça com a skill `corrigir-bug`, passo 4 |
| Prettier reformata o projeto inteiro | Hook rodando em arquivo errado | Confira o `command` do hook e o `.prettierignore` |
