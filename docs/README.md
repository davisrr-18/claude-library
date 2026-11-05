# Documentação do projeto

Comece por `../CLAUDE.md` (regras que o Claude Code lê em todo chat) e por `novo-chat.md` (como retomar).

| Documento | Para quê |
|---|---|
| [`../CLAUDE.md`](../CLAUDE.md) | Regras de código, conteúdo, git, trabalho e resposta; comandos; limites do ambiente |
| [`novo-chat.md`](novo-chat.md) | Como abrir um chat novo já alinhado, primeira mensagem sugerida, estado atual |
| [`../arquitetura.md`](../arquitetura.md) | Pastas, camadas, segurança do conteúdo, CSS, testes e publicação do `client` |
| [`design.md`](design.md) | Paleta, tokens, layout, responsividade, movimento, acessibilidade, o que o usuário não gostou |
| [`regras-de-trabalho.md`](regras-de-trabalho.md) | Ritmo, TDD, delegação a subagentes, git, privacidade, respostas, lições aprendidas |
| [`conteudo.md`](conteudo.md) | Como adicionar pacotes e cards (com comandos para os 3 sistemas), formatos de peça, estado do conteúdo |
| [`qualidade.md`](qualidade.md) | `npm test`, `npm run check`, `npm run lint`: o que cada um cobre e o que não cobre |
| [`decisoes.md`](decisoes.md) | Registro de decisões, o que mudou de ideia e o que está em aberto |
| [`decisions/`](decisions/0001-migracao-para-o-modelo-dev-web.md) | Registros de decisão do modelo dev_web (um por arquivo); a 0001 é a migração para React + Vite (concluída) |
| [`superpowers/`](superpowers/) | Histórico do site antigo (HTML/JS puros): spec e plano originais. Os caminhos citados lá (`js/`, `css/`) não existem mais |

## Regra de manutenção

Mudou algo que está documentado? Atualize o documento **no mesmo commit**: arquitetura (módulo, rota, modelo), design (token, breakpoint, regra de movimento), conteúdo (modelo ou estado), qualidade (nova verificação) e `decisoes.md` (decisão ou pendência). O `CLAUDE.md` deve continuar curto: detalhe vai para `docs/`.
