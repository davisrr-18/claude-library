---
name: investigacao-rapida
description: Prompt curto e reutilizável para pedir uma investigação somente leitura com o agente investigator.
---

# Prompt de investigação somente leitura

## Quando usar

Antes de alterar código, quando você quer entender arquivos, dependências, caminhos de execução e riscos de regressão sem modificar nada.

## Prompt

```text
Use o agente investigator para investigar, somente leitura, [ASSUNTO].

Escopo: [pastas ou arquivos].
Pergunta: [o que precisa ser respondido].
Entregue: arquivos relevantes (caminho:linha), fatos verificados separados de suposições, testes existentes e recomendações acionáveis.
Não modifique arquivos.
```

> Dica: troque os trechos entre colchetes antes de enviar. Quanto mais exato o escopo, menos exploração desnecessária.
