---
titulo: Permissões de git somente leitura (settings.json)
slug: desenvolvimento-multiagente-settings-json
nivel: variavel
stack: "qualquer"
tipo: settings
destino: .claude/settings.json
---

# Permissões de git somente leitura (settings.json)

Restringe, por comando, o que o shell pode fazer. Vale para a sessão principal e para os subagents. Salve em `.claude/settings.json`. Se o arquivo já existir, mescle as chaves `allow` e `deny` sem apagar o que já está lá.

Limite honesto: `deny` bloqueia os comandos listados, não qualquer escrita possível. Um comando como `sed -i` ou um script pode escapar da lista. Por isso o reviewer também não tem `Write` nem `Edit`.

````json
{
  "permissions": {
    "allow": [
      "Bash(git status:*)",
      "Bash(git diff:*)",
      "Bash(git log:*)",
      "Bash(git show:*)"
    ],
    "deny": [
      "Bash(git commit:*)",
      "Bash(git push:*)",
      "Bash(git reset:*)",
      "Bash(git checkout:*)",
      "Bash(git restore:*)",
      "Bash(git clean:*)",
      "Bash(git rebase:*)",
      "Bash(git merge:*)",
      "Bash(git stash:*)",
      "Bash(rm -rf:*)",
      "Read(./.env)",
      "Read(./.env.*)"
    ]
  }
}
````

## Notas

- Ajuste a lista de `deny` ao que o projeto precisa proteger. Se o projeto exige que o orquestrador faça commits, deixe `git commit` fora do `deny`, mas mantenha `push` e os comandos destrutivos.
- Os padrões seguem a sintaxe de permissões do Claude Code. Confirme no próprio projeto, rodando um `git push` de teste, que ele é recusado.
