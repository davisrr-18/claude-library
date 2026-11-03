---
titulo: Skill Componente React
slug: webdev-skill-componente-react
nivel: intermediaria
stack: "HTML, CSS, JavaScript, React, Node.js"
tipo: skill
destino: .claude/skills/componente-react/SKILL.md
---

# Skill: Componente React

Cria um componente reutilizável com marcação semântica, estilo com tokens e teste. Salve em `.claude/skills/componente-react/SKILL.md`.

````markdown
---
name: componente-react
description: Cria ou refatora um componente React reutilizável em client/src/components com HTML semântico, CSS Module baseado em tokens, acessibilidade e teste. Use quando o usuário pedir um componente novo (botão, card, modal, formulário, tabela, etc.).
---

# Componente React

## Entradas
Nome, finalidade, props esperadas, variações e estados (hover, foco, desabilitado, carregando, erro). Se algo faltar, escolha o mais simples e diga o que assumiu.

## Passo a passo

### 1. Checar o que existe
- Procure em `components/` algo equivalente. Se existir, estenda em vez de duplicar.
- Veja `styles/tokens.css` para usar os tokens disponíveis.

### 2. Estrutura de arquivos
```
components/Nome/
├── Nome.jsx
├── Nome.module.css
└── Nome.test.jsx
```

### 3. Marcação
- Elemento nativo certo para o papel: ação é `button`, navegação é `a`, campo é `input` com `label`.
- Não use `div` clicável. Se for inevitável, adicione `role`, `tabIndex` e tratamento de teclado, e justifique.
- Repasse atributos úteis ao elemento raiz (`className`, `aria-*`, `...rest`) com cuidado para não sobrescrever os do componente.

### 4. Props e estado
- Props pequenas, com valores padrão claros; evite props booleanas em excesso (prefira `variant="primario"`).
- Estado só quando necessário; derive o resto. Componente controlado quando o pai precisa saber do valor.
- Defina o que o componente faz em cada estado: carregando, erro, vazio, desabilitado.

### 5. Estilo
- Mobile-first em `Nome.module.css`, só com tokens (`var(--...)`).
- Foco visível (`:focus-visible`), área de toque mínima de 44px em controles, contraste suficiente.
- Respeite `prefers-reduced-motion` em animações.

### 6. Teste
Com Testing Library, cubra: renderiza com o mínimo de props, cada variação relevante, interação (clique, teclado), estados (desabilitado, erro) e que o nome acessível está presente (`getByRole('button', { name: ... })`).

### 7. Verificar
- `[GERENCIADOR] run lint` e o teste do componente passam.
- Rode a skill `acessibilidade-responsivo` no componente.

## Entrega
Arquivos criados, props com tipo e padrão (tabela curta), um exemplo de uso e o que foi verificado.

## Regras
- Responda em português.
- Sem biblioteca de componentes ou de estilo nova sem aprovação.
- Um componente = uma responsabilidade; se passar de ~150 linhas, divida.
````
