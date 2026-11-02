# Retomar em um chat novo

O Claude Code lê o `CLAUDE.md` da raiz sozinho ao abrir o projeto. Para o chat começar já alinhado:

## 1. Abrir na pasta certa

```bash
# Linux e macOS (bash/zsh)
cd ~/Programação/Projects/claude-library && git pull && claude
```
```powershell
# Windows (PowerShell)
cd $HOME\Programação\Projects\claude-library; git pull; claude
```

## 2. Primeira mensagem sugerida

Cole algo assim (ajuste o final com o que quer fazer):

> Leia o `CLAUDE.md` e o `docs/README.md` deste projeto e siga as regras de lá. Depois rode `npm test` e `npm run check` para confirmar que está tudo verde e me diga o estado atual. Quero: [o que você quer fazer].

Se o pedido for **adicionar um pacote**: diga o caminho da pasta (ex.: `~/Programação/Estudos em Programação`) e o nível. O Claude lê todos os arquivos, copia sem alterar, registra o card, verifica e te responde com os comandos de Linux, macOS e Windows.

## 3. O que o Claude vai fazer sozinho (por causa do `CLAUDE.md`)

- Falar português, direto, separando o que verificou do que não verificou.
- Escrever o teste antes do código; rodar `npm test`, `npm run check` e, se mexer na interface, `npm run qa`.
- Commitar e dar push em `main` (autorizado), sem reescrever histórico.
- **Não** publicar no GitHub Pages, **não** pôr dado pessoal em arquivo, **não** inventar conteúdo, **não** usar o `CLAUDE.md` global como conteúdo do site.
- Incluir comandos de terminal para os 3 sistemas ao adicionar/instalar algo.
- Delegar a subagentes Haiku (até 3, escopos separados) e conferir o que eles entregam; pedir revisão independente.
- Avisar que não tem navegador e pedir print quando algo visual estiver estranho.

## 4. Primeira vez em uma máquina nova

```bash
# Linux e macOS
git clone <url-do-repositorio-no-github>/claude-library.git && cd claude-library
npm test && npm run check
npm run qa:install && npm run qa      # opcional: QA completo (baixa jsdom, eslint, css-tree)
python3 -m http.server 8000
```
```powershell
# Windows (PowerShell)
git clone <url-do-repositorio-no-github>/claude-library.git; cd claude-library
npm test; npm run check
npm run qa:install; npm run qa        # opcional
py -m http.server 8000
```

Necessário: Node 22 ou superior, git e Python (só para servir localmente). No Windows e no macOS, `npm test` também executa os testes de PowerShell/zsh que na máquina anterior eram pulados.

## 5. Estado na última atualização

- Site completo e verde (`npm test`, `npm run check`, `npm run qa`).
- Conteúdo: card **Estudos em Programação** (Tarefas Intermediárias), 11 peças.
- **Pendente (depende do usuário):** escolher como publicar (o GitHub Pages foi autorizado, mas o plano gratuito não permite em repositório privado; ver `docs/decisoes.md`), conferir o resultado do CI nos 3 sistemas, e novos pacotes para Básicas e Complexas.
- Detalhes e histórico: `docs/decisoes.md`.
