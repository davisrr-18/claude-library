# Claude Library

Biblioteca pessoal, em HTML, CSS e JavaScript puros, para guardar e consultar as propostas que eu monto para o Claude Code (skills, agentes, workflows, prompts, `CLAUDE.md` e arquiteturas), organizadas por complexidade da tarefa: **Básicas**, **Intermediárias** e **Complexas**.

Sem build e sem dependências de execução. Os dois pacotes de terceiros estão em `vendor/` (marked e highlight.js, com versão e licença em `vendor/README.md`).

## Rodar localmente

```bash
python3 -m http.server 8000
```

Abra <http://localhost:8000>. Abrir `index.html` com duplo clique não funciona: módulos ES não carregam via `file://`.

| Sistema | Comando (na pasta do projeto) |
|---|---|
| Linux / macOS | `python3 -m http.server 8000` |
| Windows (PowerShell) | `py -m http.server 8000` (ou `python -m http.server 8000`) |

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

## Instalar uma peça pelo terminal

Peças que ensinam a salvar um arquivo (agentes, skills e `CLAUDE.md` do pacote de estudos) têm um bloco **"Salvar ... pelo terminal"**, e o card inteiro tem **"Instalar o pacote pelo terminal"**. Escolha **Linux**, **macOS** ou **Windows** (o site já seleciona o seu), copie e cole no terminal aberto na pasta onde quer instalar. Os comandos criam as pastas e os arquivos com o conteúdo embutido, sem baixar nada.

Para uma peça aparecer assim, o arquivo `.md` precisa de `destino:` no front matter com o caminho (ex.: `destino: .claude/agents/tutor.md`) e de um bloco ` ```markdown ` com o conteúdo do arquivo. Se o arquivo inteiro for o que se instala (como um `arquitetura.md`), declare na peça do manifest `"install": "file"`: o corpo do arquivo é instalado, sem o front matter da biblioteca. Caminhos com `..`, absolutos ou com caracteres de shell são recusados.

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
- Tipos de peça: `skill`, `claude-md`, `arquitetura`, `agente`, `workflow`, `prompt`. Um card pode ter **várias peças do mesmo tipo** (ex.: 3 agentes); elas aparecem empilhadas na aba do tipo. O `title` não pode repetir entre peças do mesmo tipo, e o mesmo `file` não pode aparecer duas vezes no card.
- Front matter do `.md`: `name` e `description` aparecem no cabeçalho da peça. Se não houver `description`, o campo `destino` (onde salvar o arquivo) é mostrado como "Destino: ...".
- Ícones: veja `CARD_ICONS` em `js/content.js`.
- `file` é relativo a `content/`, sem `..` nem `/` inicial. `id` em kebab-case.

3. Rode `npm run check` e `npm test`.

### Os mesmos passos pelo terminal

Copiar os arquivos do pacote para dentro do site (ajuste os caminhos):

```bash
# Linux e macOS (bash/zsh)
mkdir -p content/intermediarias/meu-pacote
cp "$HOME/caminho/do/pacote"/*.md content/intermediarias/meu-pacote/
```

```powershell
# Windows (PowerShell)
New-Item -ItemType Directory -Force content\intermediarias\meu-pacote | Out-Null
Copy-Item "$HOME\caminho\do\pacote\*.md" content\intermediarias\meu-pacote\
```

Depois edite `content/manifest.json` (passo 2) e verifique e publique no repositório (igual nos três sistemas):

```bash
npm run check && npm test
git add -A
git commit -m "feat: adiciona meu-pacote"
git push
```

## Documentação

Tudo que define como o projeto funciona e como trabalhamos nele está em **`CLAUDE.md`** (regras lidas pelo Claude Code em todo chat) e em **`docs/`**: arquitetura, design, regras de trabalho, conteúdo, qualidade e decisões. Comece por [`docs/README.md`](docs/README.md) e, para retomar em um chat novo, [`docs/novo-chat.md`](docs/novo-chat.md).

## Qualidade

```bash
npm test            # testes unitários (inclui a documentação conferida contra o código)
npm run check       # manifest, arquivos, dados sensíveis, identidade do autor
npm run qa:install  # uma vez: instala as ferramentas de QA (jsdom, eslint, css-tree) isoladas em tools/qa
npm run qa          # linter, CSS, fuzz, fumaça com DOM simulado e estresse com 300 cards
```

Os comandos são iguais em Linux, macOS e Windows. O que cada um cobre e o que não cobre: [`docs/qualidade.md`](docs/qualidade.md).

## Estrutura

```
CLAUDE.md           regras do projeto (lidas pelo Claude Code)
index.html          página única (rotas por hash: #/, #/<nivel>, #/<nivel>/<card>, #/<nivel>/<card>/<tipo>)
css/style.css       tema preto/laranja e branco/laranja
js/                 app.js (interface), dom.js, content.js, router.js, search.js, tabs.js, install.js, markdown.js, sanitize.js, icons.js, code-highlight.js
content/            manifest.json e os .md de cada peça
vendor/             marked e highlight.js (versão, licença e hash em vendor/README.md)
scripts/            check-content.mjs
tests/              testes unitários
tools/qa/           verificação com dependências isoladas (fumaça, fuzz, estresse, lint, CSS)
docs/               documentação; docs/superpowers/ guarda o spec e o plano originais
```

## Publicar

```bash
npm run build:site     # monta dist/ só com index.html, css/, js/, vendor/ e content/ (recusa se achar dado sensível)
```

Destino escolhido: Cloudflare Pages com login, mantendo o repositório privado. Passo a passo: [`docs/deploy/cloudflare.md`](docs/deploy/cloudflare.md). O GitHub Pages não funciona em repositório privado no plano gratuito.

## Segurança e privacidade

- **GitHub Pages publica o site para quem tiver a URL, mesmo com repositório privado** (só o plano Enterprise Cloud restringe o acesso). O `noindex` da página reduz a indexação, mas não é controle de acesso.
- Por isso, nada sensível deve estar em arquivo publicado. Ao publicar, envie só `index.html`, `css/`, `js/`, `vendor/` e `content/`, nunca a raiz do repositório (que traz `tests/`, `docs/` e `.git`).
- O Markdown é renderizado com HTML bruto escapado, URLs filtradas e uma segunda lista de permissões de tags e atributos no DOM.

## Limites conhecidos

- O front matter é um subconjunto de YAML (`chave: valor`, aspas, blocos `>` e `|`, listas `- item`).
- Links e imagens relativos dentro dos `.md` resolvem contra `index.html`, não contra `content/`.
- Aparência, layout e animações reais só se confirmam em navegador. A lógica da interface (`app.js`) é verificada em `npm run qa` com um DOM simulado (jsdom), que não tem layout nem CSS.
