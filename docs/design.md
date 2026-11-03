# Design

O que o usuário escolheu e o que ele pediu para evitar. Antes de mudar visual, releia este arquivo.

## Direção

- **Vitrine de cards** (escolhida entre 4 opções): hero com busca, faixas por nível com cards ricos, filtros por nível e tag, página de card com abas e coluna lateral.
- **Paleta:** escuro = **preto + laranja**; claro = **branco + laranja**.
- **Tela cheia:** o conteúdo usa a largura toda, com margens proporcionais (`--gutter: clamp(16px, 4.5vw, 80px)`); só limita acima de 2560px (`--maxw`). Topo e rodapé alinham com o conteúdo.
- Pediu **mais animação e suavidade em todas as partes**, mas que **parem** (ver Movimento).

## Tokens (em `:root`; o escuro redefine os mesmos nomes)

| Token | Claro | Escuro |
|---|---|---|
| `--bg` / `--surface` | `#ffffff` / `#ffffff` | `#0b0b0b` / `#141413` |
| `--surface-2` | `#f6f4f0` | `#1b1a18` |
| `--text` / `--muted` | `#17120d` / `#615a50` | `#f4f1ec` / `#a39d93` |
| `--accent` (preenchimentos) | `#ff7a1a` | `#ff7a1a` |
| `--accent-ink` (texto/links) | `#c2410c` | `#ff9a4d` |
| `--on-accent` | `#17120d` | `#0b0b0b` |
| `--border` / `--border-strong` | `#e7e2d9` / `#d6cfc2` | `#2a2825` / `#3a3733` |
| `--field-border` (≥ 3:1) | `#8f877a` | `#77716a` |
| `--code-bg` | `#faf8f4` | `#101010` |

### Nomes novos (migração, `client/src/styles/tokens.css`)

Mesmos valores, nomes do modelo dev_web. Quem migra um trecho de `css/style.css` troca assim:

| Antigo | Novo | Antigo | Novo |
|---|---|---|---|
| `--bg` | `--cor-fundo` | `--code-bg` | `--cor-codigo-fundo` |
| `--surface` / `--surface-2` | `--cor-superficie` / `--cor-superficie-2` | `--danger` | `--cor-perigo` |
| `--border` / `--border-strong` | `--cor-borda` / `--cor-borda-forte` | `--glow` / `--grid` | `--cor-brilho` / `--cor-grade` |
| `--field-border` | `--cor-borda-campo` | `--title-grad` | `--cor-titulo-grad` |
| `--text` / `--muted` | `--cor-texto` / `--cor-texto-suave` | `--shadow` | `--sombra` |
| `--accent` / `--accent-ink` / `--on-accent` | `--cor-destaque` / `--cor-destaque-texto` / `--cor-sobre-destaque` | `--radius` / `--radius-sm` | `--raio-md` / `--raio-sm` |
| `--gutter` / `--maxw` / `--topbar-h` | `--espaco-margem` / `--largura-max` / `--altura-topo` | `--font` / `--mono` | `--fonte-texto` / `--fonte-codigo` |

Escalas novas no `client` (valores soltos não são aceitos, há teste): espaço `--espaco-0` a `--espaco-8` (2px a 64px, com meios-passos como `--espaco-25` = 10px), fonte `--fonte-2xs` a `--fonte-3xl` (0,75 a 1,5 rem, mais `--fonte-hero`, `--fonte-titulo-card` e `--fonte-lead`, que são fluidas) e raio `--raio-2xs` a `--raio-xl` e `--raio-pill`. O CSS antigo usa `!important` em animações e em `prefers-reduced-motion`; o modelo proíbe. Ao migrar (marco 4), reescrever sem `!important` e manter o teste de movimento.

Regras: laranja `#ff7a1a` só em preenchimentos (texto sobre ele é escuro); para texto/links no claro usa-se `--accent-ink`, que tem contraste suficiente. O tema segue o sistema (`prefers-color-scheme`) e o botão guarda a escolha (`data-theme`, aplicado antes do primeiro paint). Cores de sintaxe (highlight.js) são escritas no CSS na mesma paleta.

## Layout e responsividade

- Breakpoints usados: `≤380px`, `≤640px`, `≥900px` (faixa do nível em 2 colunas), `≥1024px` (card com coluna lateral), `≥1280px`, `≥1800px` (fonte 17px), `max-height: 600px` (celular na horizontal: barras fixas viram normais), `pointer: coarse` (alvos de 44px), `hover: hover` (efeitos de mouse).
- Topo fixo; barra de filtros fixa só a partir de 641px; as alturas reais são medidas por JS (`--topbar-h`, `--filters-h`) para o `scroll-padding` nunca esconder o foco. No celular o topo não é fixo e a barra de progresso é `position: fixed`.
- **Grids com texto imprevisível usam `minmax(0, 1fr)`** (ou `min-width: 0`): já houve estouro de caixa por isso (bloco de comandos). Blocos de código rolam por dentro, sem quebrar linha.
- **Blocos de código:** a caixa (`.code-wrap`) tem margem interna de 10px; o botão **Copiar tem linha própria** no topo (nunca `position: absolute` sobre o código ou a barra de rolagem); barras de rolagem finas.
- Tabelas largas ficam num contêiner rolável focável.

## Movimento

- Entrada da página (elementos sobem em sequência), revelação ao rolar (cada elemento uma vez), contador do hero, brilho que segue o mouse (cards e hero), barra de progresso de leitura e sombra do topo ao rolar, troca de tema com transição de cores.
- **Cada animação roda uma vez.** O usuário reclamou de animações que se repetiam; as decorativas do hero (`breathe`, `drift`) rodam **uma passada** e terminam onde começam. **Só o esqueleto de carregamento (`shimmer`) pode ser infinito.** `tests/css-motion.test.mjs` falha se outra for.
- Repintar a lista (buscar, filtrar, trocar de aba) encerra a fase de entrada para não reanimar elementos novos; elementos revelados ao rolar ganham `.revealed` (nunca reanimam).
- `prefers-reduced-motion: reduce` desliga animações e transições, deixa tudo visível e pula contador, revelação e transição de tema.

## Acessibilidade (decisões)

- Hierarquia: `h1` = página/card, `h2` = peça ou faixa, Markdown da peça começa em `h3` (nunca `h1`/`h2` dentro do texto).
- Foco: a cada rota vai para o `h1` (`tabindex=-1`, sem contorno); atalho `/` foca a busca; troca de aba mantém o foco; abas reais (`tablist`/`tab`, `aria-selected`, tabindex móvel) com setas, Home e End (Alt/Ctrl/Cmd+setas não são interceptados).
- Cards têm nome acessível curto (`aria-labelledby` = título [+ peça]); contagens têm texto para leitor de tela; blocos de código e tabelas rolam por teclado; "Pular para o conteúdo" fica acima do topo.
- Foco visível em `--accent-ink`; contraste de texto ≥ 4,5:1 nos dois temas (calculado em revisão).

## O que o usuário não gostou (não repetir)

Animações em loop; botão ou controle por cima de código/barras de rolagem; caixa que "vaza" do bloco; conteúdo preso ao meio da tela; cards de exemplo inventados no site; topo colado na lateral.
