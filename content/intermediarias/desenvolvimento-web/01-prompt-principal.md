---
titulo: Prompt principal de tarefa web
slug: webdev-prompt-principal
nivel: intermediaria
stack: "HTML, CSS, JavaScript, React, Node.js"
tipo: prompt
destino: colar ao delegar uma tarefa
---

# Prompt principal de tarefa web

Cole o bloco abaixo ao delegar uma tarefa e preencha os campos. Se não souber o nível, escreva "classifique você" e o Claude anuncia o nível antes de começar.

````markdown
**Tarefa:** [O_QUE_QUERO_FAZER, em 1 a 3 frases]
**Camada:** [front / back / ambos]
**Nível:** [Básica / Intermediária / Complexa / classifique você]
**Onde mexer (se souber):** [ARQUIVOS_OU_PASTAS]
**Restrições:** [O_QUE_NAO_MEXER, bibliotecas permitidas, prazos]
**Pronto quando:** [CRITERIO_DE_PRONTO: comportamento observável e testes que devem passar]

Antes de escrever código:
1. Leia `CLAUDE.md` e `arquitetura.md`.
2. Anuncie o nível da tarefa e o motivo em uma linha.
3. Siga o fluxo do nível (abaixo). Se surgir algo maior do que o nível anunciado, pare e reclassifique antes de seguir.

Fluxo por nível:
- **Básica** (um arquivo, objetivo claro): leia, altere, rode a verificação rápida e resuma o diff.
- **Intermediária** (vários arquivos, pede testes): use o agent `explorador`, proponha um plano curto, escreva o teste primeiro quando fizer sentido, implemente, rode lint e testes relevantes e faça autorrevisão do diff.
- **Complexa** (arquitetura, migração, marcos): escreva `PLAN.md` com marcos e critérios, espere minha aprovação, execute marco a marco registrando em `PROGRESS.md`, use o agent `revisor` em cada marco e registre decisões em `docs/decisions/`.

Ao terminar, entregue: o que mudou (arquivos), como verifiquei (comandos e resultado) e o que ficou pendente.
````

## Variações rápidas

**Correção de bug:**
````markdown
Use a skill `corrigir-bug`. Sintoma: [O_QUE_ACONTECE]. Esperado: [O_QUE_DEVERIA_ACONTECER]. Como reproduzir: [PASSOS]. Onde suspeito: [ARQUIVO_OU_NAO_SEI].
````

**Nova funcionalidade:**
````markdown
Use a skill `nova-feature`. Funcionalidade: [DESCRICAO]. Usuário final: [QUEM_USA]. Critérios de aceitação: [LISTA].
````

**Só revisar o que está pendente:**
````markdown
Use o agent `revisor` no diff atual (`git diff`) e me devolva os problemas por gravidade.
````
