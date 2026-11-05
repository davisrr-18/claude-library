# Retomar em um chat novo

O Claude Code lê o `CLAUDE.md` da raiz sozinho ao abrir o projeto. Para o chat começar já alinhado:

## 1. Abrir na pasta certa

```bash
# Linux e macOS (bash/zsh)
cd ~/Programação/dev_web/claude-library && git pull && claude
```
```powershell
# Windows (PowerShell)
cd $HOME\Programação\dev_web\claude-library; git pull; claude
```

## 2. Primeira mensagem sugerida

Cole algo assim (ajuste o final com o que quer fazer):

> Leia o `CLAUDE.md` e o `docs/README.md` deste projeto e siga as regras de lá. Depois rode `npm test` e `npm run check` para confirmar que está tudo verde e me diga o estado atual. Quero: [o que você quer fazer].

Se o pedido for **adicionar um pacote**: diga o caminho da pasta (ex.: `~/Programação/Estudos em Programação`) e o nível. O Claude lê todos os arquivos, copia sem alterar, registra o card, verifica e te responde com os comandos de Linux, macOS e Windows.

## 3. O que o Claude vai fazer sozinho (por causa do `CLAUDE.md`)

- Falar português, direto, separando o que verificou do que não verificou.
- Escrever o teste antes do código; rodar `npm run lint`, `npm test` e `npm run check`.
- Commitar e dar push em `main` (autorizado), sem reescrever histórico.
- Publicar só por push em `main` (autorizado, depois de `npm run check`); **não** mudar a visibilidade do repositório, **não** pôr dado pessoal em arquivo, **não** inventar conteúdo, **não** usar o `CLAUDE.md` global como conteúdo do site.
- Incluir comandos de terminal para os 3 sistemas ao adicionar/instalar algo.
- Delegar a subagentes Haiku (até 3, escopos separados) e conferir o que eles entregam; pedir revisão independente.
- Avisar que não tem navegador e pedir print quando algo visual estiver estranho.

## 4. Primeira vez em uma máquina nova

```bash
# Linux e macOS
git clone <url-do-repositorio-no-github>/claude-library.git && cd claude-library
npm install
npm test && npm run check
npm run dev                           # abra http://localhost:5173
```
```powershell
# Windows (PowerShell)
git clone <url-do-repositorio-no-github>/claude-library.git; cd claude-library
npm install
npm test; npm run check
npm run dev                           # abra http://localhost:5173
```

Necessário: Node 22.22 ou superior e git. No Windows e no macOS, `npm test` também executa os testes de PowerShell/zsh que na máquina anterior eram pulados.

## 5. Estado na última atualização

- Site completo em React + Vite (`client/`), verde em `npm run lint`, `npm test` e `npm run check`. A migração do site de HTML/JS puros para o modelo dev_web terminou (decisão `docs/decisions/0001-migracao-para-o-modelo-dev-web.md`).
- Conteúdo: dois cards em Tarefas Intermediárias, **Estudos em Programação** (11 peças) e **Desenvolvimento Web** (16 peças).
- CI verde em Linux, macOS e Windows (comandos de instalação executados de verdade em bash, zsh e PowerShell).
- Publicação: **GitHub Pages ativo** (repositório público); todo push em `main` publica a build do `client` depois de `npm run lint`, `npm test` e `npm run check`. Alternativa com login documentada em `docs/deploy/cloudflare.md`.
- **Pendente (depende do usuário):** novos pacotes para Básicas e Complexas.
- Detalhes e histórico: `docs/decisoes.md`.
