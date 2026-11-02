---
titulo: Checklist de verificação do pacote de estudos
slug: estudos-checklist-de-verificacao
nivel: intermediaria
stack: "[LINGUAGEM/STACK]"
tipo: checklist
destino: consulta (não precisa instalar)
---

# Checklist de verificação

Use em três momentos: ao instalar o pacote, ao fechar cada sessão e ao fazer a revisão do pacote depois de algumas semanas.

## A. Instalação (uma vez)

- [ ] `CLAUDE.md` está na raiz de `[PASTA-DE-ESTUDOS]` e os placeholders `[LINGUAGEM]`, `[COMANDO_RODAR]`, `[COMANDO_TESTAR]` foram preenchidos.
- [ ] Os 3 agents estão em `.claude/agents/` (`tutor.md`, `revisor-de-codigo.md`, `gerador-de-exercicios.md`).
- [ ] As 3 skills estão em `.claude/skills/<nome>/SKILL.md` (`sessao-de-estudo`, `revisao-espacada`, `explicar-codigo`), com o nome da pasta igual ao `name` do frontmatter.
- [ ] Nenhum placeholder `[COLCHETES]` ficou sem preencher nos arquivos instalados.
- [ ] `[COMANDO_TESTAR]` e `[COMANDO_RODAR]` funcionam no terminal, dentro da pasta de estudos.
- [ ] Abrir o Claude Code na pasta e pedir "liste os agents e skills disponíveis" mostra os 3 e os 3.

## B. Teste de fumaça (primeira sessão)

- [ ] O Claude fez o diagnóstico antes de explicar.
- [ ] Mostrou um plano e esperou o seu "ok".
- [ ] Explicou em blocos curtos e fez pergunta ou exercício a cada bloco.
- [ ] Ao travar, deu dica de nível 1 antes de entregar a solução.
- [ ] Ao enviar um código, a revisão veio sem o código reescrito e com no máximo 3 problemas.
- [ ] Os arquivos `notas/progresso.md`, `notas/revisao.md` e `notas/duvidas.md` foram criados e preenchidos.

## C. Fechamento de cada sessão

- [ ] Resumo de até 5 linhas entregue.
- [ ] Pontos fracos listados.
- [ ] `notas/progresso.md` com data, tema e domínio.
- [ ] Itens novos em `notas/revisao.md` com a próxima data.
- [ ] Dúvidas pendentes em `notas/duvidas.md`.
- [ ] Você sabe dizer, com suas palavras, o que aprendeu. Se não souber, a sessão não fechou de verdade.

## D. Revisão do pacote (a cada 3 a 4 semanas)

- [ ] O tutor está dando dica demais ou de menos? Ajuste "Como ensinar" no `CLAUDE.md`.
- [ ] Os exercícios estão no nível certo (nem triviais, nem travando por horas)?
- [ ] A revisão espaçada está sendo usada? Se não, avalie se vale colocá-la no começo de toda sessão.
- [ ] O `CLAUDE.md` passou de ~80 linhas? Mova detalhes para skills.
- [ ] Alguma regra repetida em vários arquivos? Deixe em um lugar só.

## Sinais de que algo está errado

| Sintoma | Provável causa | Ajuste |
|---|---|---|
| O Claude entrega a solução de cara | Regra de dicas não carregada ou ignorada | Reforce o item 3 em "Como ensinar" e confirme que o `CLAUDE.md` está na raiz |
| Sessões longas demais | Tempo disponível não informado | Informe `[TEMPO_DISPONIVEL]` no prompt |
| Notas não são atualizadas | Passo 6 da skill não executado | Peça: "faça o registro obrigatório da sessão" |
| Agent não é chamado | Descrição vaga | Torne a `description` do agent mais específica |
| Exercícios sem teste funcionando | `[COMANDO_TESTAR]` errado | Corrija o comando no `CLAUDE.md` |
