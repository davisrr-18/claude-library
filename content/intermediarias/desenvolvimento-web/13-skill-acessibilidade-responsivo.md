---
titulo: Skill Acessibilidade e responsividade
slug: webdev-skill-acessibilidade-responsivo
nivel: intermediaria
stack: "HTML, CSS, JavaScript, React, Node.js"
tipo: skill
destino: .claude/skills/acessibilidade-responsivo/SKILL.md
---

# Skill: Acessibilidade e responsividade

Auditoria rápida de uma tela ou componente, com correção do que for simples. Salve em `.claude/skills/acessibilidade-responsivo/SKILL.md`.

````markdown
---
name: acessibilidade-responsivo
description: Audita uma tela ou componente do front quanto a acessibilidade (teclado, foco, rótulos, contraste, semântica) e responsividade (360px a desktop), e corrige os problemas simples. Use depois de criar ou alterar interface, ou quando o usuário pedir revisão de a11y ou de layout.
---

# Acessibilidade e responsividade

## Entrada
Arquivo, componente ou rota a auditar. Sem indicação, audite os arquivos alterados em `git diff`.

## Auditoria

### Semântica e rótulos
- [ ] Um `h1` por página; títulos em ordem, sem pular nível.
- [ ] Marcos da página: `header`, `nav`, `main`, `footer`.
- [ ] Todo `input`, `select` e `textarea` tem `label` associado.
- [ ] Botão que só tem ícone tem nome acessível (`aria-label` ou texto oculto).
- [ ] Imagens informativas com `alt` descritivo; decorativas com `alt=""`.
- [ ] Ação é `button`, navegação é `a`; nada de `div` clicável sem papel e teclado.

### Teclado e foco
- [ ] Dá para usar tudo só com Tab, Shift+Tab, Enter, Espaço e Esc.
- [ ] Ordem de foco segue a ordem visual.
- [ ] Foco sempre visível (`:focus-visible` com contraste).
- [ ] Modal: foco entra, fica preso nele e volta ao elemento de origem ao fechar; Esc fecha.

### Cor e texto
- [ ] Contraste mínimo: 4.5:1 para texto normal, 3:1 para texto grande e componentes de interface.
- [ ] Informação não depende só de cor (erro tem texto ou ícone).
- [ ] Texto em `rem`, a tela funciona com zoom de 200%.
- [ ] Animações respeitam `prefers-reduced-motion`.

### Formulários e mensagens
- [ ] Erros ficam perto do campo, descritos em texto e ligados por `aria-describedby`.
- [ ] Campos inválidos usam `aria-invalid`; mensagens dinâmicas usam `role="alert"` ou `aria-live`.

### Responsividade
- [ ] Sem rolagem horizontal em 360px, 768px e 1280px.
- [ ] Área de toque de pelo menos 44x44px em controles.
- [ ] Layout com Flexbox/Grid e unidades relativas; sem larguras fixas em `px` que estourem.
- [ ] Imagens e mídia com `max-width: 100%`.
- [ ] Tabelas largas têm estratégia (rolagem dentro do contêiner ou reorganização).

## Como verificar
- Releia o JSX e o CSS contra a lista.
- Se houver ferramenta no projeto (ESLint `jsx-a11y`, testes com `jest-axe`/`vitest-axe`), rode.
- Se o app estiver rodando e houver navegador disponível, teste em 360px e com teclado.
- Diga explicitamente o que não pôde ser verificado (por exemplo, leitor de tela e contraste real).

## Correção
- Corrija o que for simples e restrito aos arquivos auditados (rótulo, atributo, semântica, token de cor, `:focus-visible`).
- Para o que exigir redesenho ou decisão (cores da marca, mudança de fluxo), apenas relate.
- Acrescente teste para cada correção relevante (`getByRole`, `getByLabelText`).

## Entrega
Tabela com **Problema | Onde | Gravidade (alta/média/baixa) | Corrigido?**, mais a lista do que não pôde ser verificado.

## Regras
- Responda em português.
- Não use ARIA para consertar o que elemento nativo resolve.
- Não desligue regra de lint de acessibilidade para passar.
````
