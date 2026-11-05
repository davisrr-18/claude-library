# Conteúdo: como adicionar pacotes e cards

O site é do usuário: o conteúdo vem dos pacotes dele. Esta página é o passo a passo (e o que mudar no site quando o formato não encaixa).

## Regras

1. Os arquivos do usuário entram **sem alteração** em `content/<nível>/<id-do-card>/`. Quando o formato deles não encaixa, o **site** se adapta (foi assim com `destino` no front matter e com `install: "file"`), não os arquivos.
2. Níveis: `basicas`, `intermediarias`, `complexas`. Vale o nível que o usuário pediu; se o front matter do pacote (`nivel:`) divergir, avise a divergência e siga o pedido. Sem pedido, use o do front matter.
3. **Nada inventado:** nenhum card de exemplo. Se o usuário não trouxe, não existe.
4. **Nunca** incluir trechos do `CLAUDE.md` global do usuário sem ele confirmar.
5. O site fica público no Pages: ler o conteúdo antes e avisar se houver dado pessoal. `npm run check` procura (e-mail, caminhos pessoais, tokens, identidade do autor).

## Passo a passo

1. **Ler todos os arquivos** do pacote (nunca publicar sem ler).
2. Copiar para `content/<nível>/<id>/` e conferir que a cópia é idêntica: `cmp origem destino` (Linux e macOS) ou `(Get-FileHash origem).Hash -eq (Get-FileHash destino).Hash` (PowerShell). Se houver subpastas ou arquivos que não são `.md`, pergunte ao usuário antes de decidir como organizar.
3. Registrar o card em `content/manifest.json` (modelo em `arquitetura.md`). Escolhas:
   - `type` de cada peça: `skill`, `claude-md`, `arquitetura`, `agente`, `workflow` ou `prompt`. **Vários do mesmo tipo são permitidos** (ex.: 3 agentes); o `title` não repete dentro do tipo e o `file` não repete no card.
   - **`title` da peça igual ao primeiro `# Título` do arquivo**: assim o site não repete o título.
   - `icon` de `CARD_ICONS` (`folder`, `code`, `zap`, `layers`, `git-branch`, `bot`, `file-text`, `message-square`, `shield`, `bug`, `star`), `summary` e `tags` curtos.
   - Instalação pelo terminal: o arquivo precisa de `destino:` no front matter com um caminho `.md` (ex.: `.claude/agents/tutor.md`). Padrão: instala o bloco ` ```markdown ` do arquivo. Se o arquivo inteiro é o que se instala (ex.: `arquitetura.md`), marque `"install": "file"` na peça (o front matter da biblioteca não vai para o arquivo instalado).
4. `npm run check` e `npm test` (o teste `integracao` renderiza todo o conteúdo real e falha se alguma peça der erro).
5. Atualizar `docs/decisoes.md` se houve decisão nova; commit e push.
6. **Responder ao usuário com os comandos para Linux, macOS e Windows** (copiar arquivos, verificar, commitar).

## Comandos para adicionar um pacote

```bash
# Linux e macOS (bash/zsh)
mkdir -p content/intermediarias/meu-pacote
cp "$HOME/caminho/do/pacote"/*.md content/intermediarias/meu-pacote/
npm run check && npm test
git status --short && git add -A && git commit -m "feat: adiciona meu-pacote" && git push
```
```powershell
# Windows (PowerShell)
New-Item -ItemType Directory -Force content\intermediarias\meu-pacote | Out-Null
Copy-Item "$HOME\caminho\do\pacote\*.md" content\intermediarias\meu-pacote\
npm run check; npm test
git status --short; git add -A; git commit -m "feat: adiciona meu-pacote"; git push
```

## Formatos de peça que já existem

- **Peça com bloco ` ```markdown `** (agentes, skills, `CLAUDE.md` do pacote de estudos): o texto explica e o bloco é o arquivo de verdade; o site mostra "Salvar … pelo terminal" com esse bloco. Blocos de 4 crases que contêm blocos de 3 funcionam.
- **Peça que é o próprio arquivo** (`arquitetura.md`): `install: "file"`.
- **Seção para acrescentar a um arquivo que já existe** (política no `CLAUDE.md` do pacote de orquestração): `"install": "append"` mais `"installTo": "CLAUDE.md"` na peça. O comando usa `>>` (bash) ou `AppendAllText` (PowerShell), nunca sobrescreve. Rodar duas vezes duplica a seção.
- **Peça de consulta** (índice, checklist, prompt): `destino` é uma instrução ("colar no início de cada sessão"), não um caminho, então não tem painel de instalação. Peça **sem `destino`** também não tem painel, e não é erro.

## Estado atual do conteúdo

Um card, **Estudos em Programação**, em Tarefas Intermediárias, com 11 peças (origem: a pasta `~/Programação/Estudos em Programação` do usuário + `arquitetura.md`): índice e arquitetura da pasta (Arquitetura ×2), prompt, `CLAUDE.md`, 3 agentes (tutor, revisor de código, gerador de exercícios), 3 skills (sessão de estudo, revisão espaçada, explicar código) e o checklist (Workflow). Os 4 cards de exemplo do início foram removidos a pedido (histórico: commit `6905305`). Básicas e Complexas estão vazias, com aviso.

Segundo card, **Desenvolvimento Web**, em Tarefas Intermediárias, com 15 peças (origem: a pasta `~/Programação/dev_web`): índice, arquitetura (`install: "file"`), prompt, `CLAUDE.md`, permissões e hooks (`.claude/settings.json`, instalado pelo bloco ```json), 5 agentes, 5 skills e o checklist. O site passou a aceitar `destino` terminado em `.json` (instala o bloco ```json). O teste de instalação roda um card por vez, porque cada pacote vai para um projeto próprio.

Terceiro card, **Desenvolvimento por Orquestração**, em Tarefas Complexas (o front matter do pacote traz `nivel: variavel`; coloquei em Complexas por tratar de marcos e revisão independente, e basta mover a pasta e o card se o usuário preferir outro nível), com 10 peças (origem: a pasta `~/Downloads/Desenvolvimento por  Orquestração`): índice, prompt, trecho do `CLAUDE.md`, skill, 3 agentes (investigator, implementer, reviewer), modelo de registro de tarefa, permissões de git (`.claude/settings.json`) e checklist. Só Básicas está vazia.
