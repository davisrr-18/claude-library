# Claude Library

Biblioteca pessoal, em HTML, CSS e JavaScript puros, para guardar e consultar as propostas que eu monto para o Claude Code (skills, agentes, workflows, prompts, `CLAUDE.md` e arquiteturas), organizadas por complexidade da tarefa: **Básicas**, **Intermediárias** e **Complexas**.

Sem build e sem dependências de execução. Os dois pacotes de terceiros estão em `vendor/` (marked e highlight.js, com versão e licença em `vendor/README.md`).

## Rodar localmente

```bash
python3 -m http.server 8000
```

Abra <http://localhost:8000>. Abrir `index.html` com duplo clique não funciona: módulos ES não carregam via `file://`.

Atalho: `/` foca a busca. Dentro de cada faixa de tarefa há abas por tipo de peça (Todos, Skills, Agentes, Workflows, Prompts…), navegáveis com as setas, Home e End; só aparecem os tipos que existem naquele nível, e ao escolher um tipo o card abre direto a peça correspondente.

## Comandos (Node 22)

```bash
npm test          # testes unitários (node --test)
npm run check     # valida o manifest e procura dados sensíveis nos arquivos do projeto
```

`npm run check` sai com código 1 se encontrar problema. Ele confere:
- o `content/manifest.json` (estrutura, ids, tipos de peça, caminhos) e se cada arquivo citado existe;
- e-mails, caminhos pessoais, tokens e chaves (GitHub, AWS, Slack, Google, Stripe, JWT, chave privada), credenciais em URL e CPF, em todos os arquivos do projeto, de qualquer extensão, exceto `tests/` e `vendor/` (imagens e fontes só passam pela checagem de identidade);
- em repositório git, só os arquivos que o git conhece (rastreados e não ignorados): o que está no `.gitignore` não é varrido, então arquivos locais como `.claude/` não afetam o resultado;
- a identidade do autor (e-mail e nome do `git config` e usuário do sistema) em **todos** os arquivos, inclusive `tests/`.

Segredos nunca são impressos por inteiro. Rode antes de cada publicação.

## Adicionar um card

1. Crie a pasta `content/<nivel>/<id-do-card>/` e um arquivo `.md` por peça, com front matter `name` e `description`.
2. Registre o card em `content/manifest.json`:

```json
{
  "id": "meu-card",
  "title": "Meu card",
  "summary": "Uma ou duas frases.",
  "icon": "code",
  "tags": ["exemplo"],
  "pieces": [
    { "type": "skill", "title": "Minha skill", "file": "basicas/meu-card/skill.md" }
  ]
}
```

- Níveis: `basicas`, `intermediarias`, `complexas`.
- Tipos de peça (um por card): `skill`, `claude-md`, `arquitetura`, `agente`, `workflow`, `prompt`.
- Ícones: veja `CARD_ICONS` em `js/content.js`.
- `file` é relativo a `content/`, sem `..` nem `/` inicial. `id` em kebab-case.

3. Rode `npm run check` e `npm test`.

## Estrutura

```
index.html          página única (rotas por hash: #/, #/<nivel>, #/<nivel>/<card>, #/<nivel>/<card>/<tipo>)
css/style.css       tema preto/laranja e branco/laranja
js/                 app.js (interface), content.js, router.js, search.js, tabs.js, markdown.js, sanitize.js, dom.js, icons.js
content/            manifest.json e os .md de cada peça
scripts/            check-content.mjs
tests/              testes unitários
docs/superpowers/   spec e plano de implementação
```

## Segurança e privacidade

- **GitHub Pages publica o site para quem tiver a URL, mesmo com repositório privado** (só o plano Enterprise Cloud restringe o acesso). O `noindex` da página reduz a indexação, mas não é controle de acesso.
- Por isso, nada sensível deve estar em arquivo publicado. Ao publicar, envie só `index.html`, `css/`, `js/`, `vendor/` e `content/`, nunca a raiz do repositório (que traz `tests/`, `docs/` e `.git`).
- O Markdown é renderizado com HTML bruto escapado, URLs filtradas e uma segunda lista de permissões de tags e atributos no DOM.

## Limites conhecidos

- O front matter é um subconjunto de YAML (`chave: valor`, aspas, blocos `>` e `|`).
- Links e imagens relativos dentro dos `.md` resolvem contra `index.html`, não contra `content/`.
- Os testes não cobrem a interface (`app.js`) em navegador; a interface foi verificada por leitura e por um DOM simulado fora do repositório.
