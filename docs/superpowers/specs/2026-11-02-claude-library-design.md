# Claude Library — Spec de design

Data: 2026-11-02 · Status: aguardando revisão do usuário

## Objetivo
Página estática pessoal (HTML, CSS, JS puros) que organiza propostas para o Claude Code por complexidade da tarefa: **Tarefas Básicas**, **Tarefas Intermediárias** e **Tarefas Complexas**. Cada nível contém cards; cada card agrupa peças (Skill `.md`, `CLAUDE.md`, arquitetura, agente, workflow, prompt) escritas em Markdown. Publicada em GitHub Pages a partir de repositório privado.

## Critérios de sucesso
1. Adicionar um card = criar `.md` + uma entrada no `manifest.json`; aparece sem build.
2. Navegar Home → nível → card → peça; busca global encontra título, tags, resumo e corpo.
3. Copiar um bloco de código e a peça inteira com um clique.
4. Funciona em desktop e celular, nos temas claro e escuro.
5. Nenhum conteúdo sensível é publicado (verificado por script).

## Restrições
- Sem backend, build, framework ou CDN; `marked` vendorizado.
- GitHub Pages não restringe acesso ao site fora do Enterprise Cloud. O conteúdo deve ser seguro para exposição pública; senha em JS não é proteção e não será usada.
- Sem commit, push, criação de repositório ou deploy sem autorização explícita.

## Arquitetura
SPA estática com hash routing. `index.html` carrega `content/manifest.json`; `fetch` busca os `.md`; `marked` renderiza; saída é sanitizada.

Unidades (uma responsabilidade cada):
- `js/content.js`: carregar manifest, validar, extrair front matter YAML simples, sanitizar HTML. Sem DOM.
- `js/search.js`: construir índice e consultar. Sem DOM.
- `js/app.js`: rotas, renderização, abas, copiar, tema. Única unidade com DOM.
- `scripts/check-content.mjs`: valida manifest (arquivos existem, ids únicos, tipos válidos) e varre `content/` por padrões sensíveis (e-mails, `/home/`, tokens como `ghp_`, `sk-`, chaves privadas).

### Modelo de dados
```
tiers[]: { id, title, cards[] }
card:    { id, title, summary, tags[], pieces[] }
piece:   { type, title, file }
type ∈ skill | claude-md | arquitetura | agente | workflow | prompt
```
`id` em kebab-case, único dentro do pai. `file` relativo a `content/`, sem `..`.

### Rotas
`#/`, `#/<nivel>`, `#/<nivel>/<card>`, `#/<nivel>/<card>/<tipo>`. Rota inválida mostra tela "não encontrado" com link para a Home.

## Comportamento
- **Home:** 3 blocos com grade de cards (título, resumo, tags, ícones dos tipos).
- **Card:** cabeçalho + abas por tipo de peça; cada aba renderiza o `.md`. Abas navegáveis por teclado.
- **Busca:** campo no topo, filtro por nível; correspondência por palavras, sem distinção de maiúsculas e acentos.
- **Copiar:** por bloco de código e por peça (texto Markdown original); usa `navigator.clipboard`, com fallback e mensagem em caso de falha.
- **Tema:** `prefers-color-scheme` por padrão; alternância salva em localStorage (try/catch, a página funciona sem ele).
- **Front matter:** removido da exibição; `name` e `description` aparecem como cabeçalho da peça.

## Tratamento de erros
- Manifest ausente ou inválido: mensagem explícita com o motivo.
- `.md` com 404/falha de rede: erro apenas na aba afetada; o resto continua.
- Abertura via `file://`: aviso explicando `python3 -m http.server`.

## Segurança
- Sanitização: remove `<script>`, `<iframe>`, `<object>`, atributos `on*` e URLs `javascript:`/`data:` em links; só `http(s)`, âncoras e caminhos relativos.
- `<meta name="robots" content="noindex">` (reduz indexação; não é controle de acesso).
- Script de conteúdo sensível roda antes do deploy e falha o job se encontrar algo.

## Testes (Node nativo, sem dependências)
- front matter: presente, ausente, malformado.
- manifest: id duplicado, tipo inválido, arquivo inexistente, `..` no caminho.
- sanitização: scripts, `on*`, `javascript:`.
- busca: acentos, múltiplas palavras, filtro por nível.
- detecção de conteúdo sensível: positivos e negativos.
- Manual: navegação completa, copiar, tema, rota inválida, largura de celular.

## Conteúdo inicial
Um card de exemplo por nível, baseado em `plan-update`, nos agentes `investigator`/`implementer`/`reviewer` e no fluxo de marcos. Trechos do `CLAUDE.md` global só entram com confirmação do usuário.

## Deploy (fase posterior, com autorização)
Workflow `.github/workflows/pages.yml`: roda testes e `check-content`, publica a pasta. Antes disso o usuário confirma o plano GitHub e a visibilidade aceitável.

## Fora do escopo
Edição pela página, backend, login, comentários, framework, build.

## Marcos propostos
1. Esqueleto: `index.html`, CSS, manifest, rotas, Home e página de card com 1 card de exemplo.
2. Renderização Markdown, front matter, sanitização, copiar, tema.
3. Busca e conteúdo inicial dos 3 níveis.
4. `check-content`, testes, revisão independente, responsividade.
5. Deploy (somente com autorização).

## Addendum (2026-11-02): redesenho "vitrine de cards"
Aprovado pelo usuário após o Marco 2. Substitui o visual do Marco 1 e antecipa a busca.
- **Paleta:** escuro = preto + laranja (`#0b0b0b` / `#ff7a1a`); claro = branco + laranja (`#ffffff` / `#ff7a1a`, texto laranja `#c2410c` para contraste).
- **Home:** hero com busca (atalho `/`), estatísticas, filtro por nível e por tag (AND), faixas de nível com cards ricos (ícone, resumo, chips de peças, tags).
- **Card:** cabeçalho com ícone e nível, abas com ícone por tipo de peça, leitura em ~74 caracteres, destaque de sintaxe (highlight.js vendorizado), anterior/próximo.
- **Manifest:** `tiers[].description` e `cards[].icon` opcionais (`CARD_ICONS` em `js/content.js`).
- **Busca:** um registro por card (título, tags, resumo e corpo de todas as peças); todas as palavras devem casar; ordem: título > tags/resumo > corpo.
- **Convenção pendente:** links e imagens relativos dentro dos `.md` ainda resolvem contra a página, não contra `content/`; definir antes de usar imagens.
