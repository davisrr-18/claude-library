---
titulo: Permissões e hooks (settings.json)
slug: webdev-settings-json
nivel: intermediaria
stack: "HTML, CSS, JavaScript, React, Node.js"
tipo: settings
destino: .claude/settings.json
---

# Permissões e hooks

Salve como `.claude/settings.json` na raiz do projeto. Define o que o Claude pode rodar sem perguntar, o que pede confirmação e o que fica bloqueado, e formata o código automaticamente depois de cada edição.

````json
{
  "permissions": {
    "allow": [
      "Bash(npm run dev:*)",
      "Bash(npm run test:*)",
      "Bash(npm test:*)",
      "Bash(npm run lint:*)",
      "Bash(npm run format:*)",
      "Bash(npm run build:*)",
      "Bash(git status:*)",
      "Bash(git diff:*)",
      "Bash(git log:*)",
      "Bash(git branch:*)"
    ],
    "ask": [
      "Bash(npm install:*)",
      "Bash(npm uninstall:*)",
      "Bash(git add:*)",
      "Bash(git commit:*)",
      "Bash(git checkout:*)",
      "Bash(git merge:*)"
    ],
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)",
      "Edit(./.env)",
      "Edit(./.env.*)",
      "Edit(./package-lock.json)",
      "Bash(rm -rf:*)",
      "Bash(git push:*)",
      "Bash(git reset --hard:*)",
      "Bash(git clean:*)",
      "Bash(curl:*)",
      "Bash(wget:*)"
    ]
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path' | grep -E '\\.(js|jsx|css|html|json|md)$' | xargs -r npx prettier --write"
          }
        ]
      }
    ]
  }
}
````

## Como funciona

- **allow:** comandos de rotina (dev, testes, lint, build, leitura do git) rodam sem perguntar.
- **ask:** instalar dependência e escrever no git pedem sua confirmação, em linha com a regra do `CLAUDE.md`.
- **deny:** segredos (`.env*`), apagar em massa, `push`, reset destruidor e download de scripts da internet ficam bloqueados.
- **hook de formatação:** depois de cada `Edit` ou `Write`, o Prettier formata o arquivo alterado. Isso não depende de o Claude lembrar.

## Requisitos

- `jq` instalado na máquina (o hook usa para ler o caminho do arquivo).
- `prettier` como dependência de desenvolvimento do projeto (`npm install -D prettier`).
- Se usar `pnpm` ou `yarn`, troque `npm` pelos equivalentes nos padrões de `allow` e `ask`.

## Ajustes comuns

- Quer liberar `git commit` sem perguntar? Mova a linha de `ask` para `allow`.
- Precisa de `curl` para testar a API local? Troque o `deny` por um padrão específico, por exemplo `Bash(curl http://localhost:*)` em `allow`.
- Se o hook atrapalhar (arquivos grandes, formatação lenta), remova o bloco `hooks` e rode `format` manualmente.
