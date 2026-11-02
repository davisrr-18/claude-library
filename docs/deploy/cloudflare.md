# Publicar no Cloudflare Pages, com login

Escolha do usuário para publicar: mantém o repositório **privado** e o site só abre para quem entrar com login (Cloudflare Access). O GitHub Pages não serve, porque o plano gratuito não permite Pages em repositório privado.

**Estado:** o lado do projeto está pronto e testado. Falta o que só o usuário pode fazer: criar a conta no Cloudflare, conectar o repositório e ligar o login (passos abaixo). Os nomes de botões do painel do Cloudflare mudam de vez em quando; se algo não bater, procure o equivalente.

## O que já está no repositório

| Arquivo | Para quê |
|---|---|
| `scripts/build-site.mjs` (`npm run build:site`) | Monta `dist/` só com `index.html`, `css/`, `js/`, `vendor/` e `content/` (+ `_headers`). **Recusa construir** se a verificação de conteúdo achar dado sensível, se faltar arquivo do manifest ou se o `index.html` apontar para fora da lista. Nunca apaga uma pasta que não seja vazia ou um build anterior. Testado em Linux, macOS e Windows pelo CI. |
| `deploy/_headers` | Cabeçalhos do site: `noindex`, sem iframe, sem referrer, `nosniff`. O Cloudflare aplica este arquivo. |
| `.node-version` | Node 22 no build do Cloudflare. |
| `docs/deploy/pages.yml` | Alternativa **inativa** para o GitHub Pages (só funciona com plano pago ou repositório público). |

## Passo a passo (uma vez)

1. Crie uma conta gratuita em <https://dash.cloudflare.com/sign-up>.
2. No painel: **Workers & Pages → Create → Pages → Connect to Git**. Autorize o GitHub e, na instalação do app do Cloudflare, escolha **Only select repositories → este repositório** (funciona com repositório privado).
3. Configurações de build:
   - **Framework preset:** None
   - **Build command:** `npm run build:site`
   - **Build output directory:** `dist`
   - **Root directory:** deixe em branco
4. **Save and Deploy.** O site fica em `https://<nome-do-projeto>.pages.dev`.
5. **Ligue o login logo em seguida** (até lá o endereço abre para qualquer pessoa que o conheça; o conteúdo já foi verificado, mas o ideal é fechar rápido):
   - No projeto: **Settings → General → Access policy → Enable**. Isso cria uma aplicação do Cloudflare Access que cobre o `.pages.dev` e as URLs de preview.
   - Em **Zero Trust → Access → Applications**, abra a aplicação criada e confira a política: **Action: Allow**, **Include: Emails** com o seu e-mail, e o método de login **One-time PIN** (o Cloudflare manda um código por e-mail).
   - O plano gratuito do Zero Trust cobre até 50 pessoas. Pode ser que o Cloudflare peça um meio de pagamento para ativar o plano gratuito; confira na tela antes de confirmar.
6. **Teste de verdade:** abra o endereço numa **janela anônima**. Deve aparecer a tela de login do Cloudflare, não o site. Só considere publicado e protegido depois disso.

Não escreva o seu e-mail nem a URL do projeto em arquivos do repositório (o verificador de conteúdo procura a identidade do autor).

## Depois: atualizar o site

Cada `git push` em `main` faz o Cloudflare construir e publicar sozinho (o build roda o mesmo portão de segurança). Se o build falhar, nada é publicado e a versão anterior continua no ar. Para ver o resultado: **Workers & Pages → seu projeto → Deployments**.

## Comandos (iguais ao resto do projeto)

Montar e ver o site publicável no seu computador:

```bash
# Linux e macOS (bash/zsh)
npm run build:site
python3 -m http.server 8000 --directory dist      # abra http://localhost:8000
```
```powershell
# Windows (PowerShell)
npm run build:site
py -m http.server 8000 --directory dist
```

Conferir que o login está ligado (substitua pelo seu endereço; deve responder com redirecionamento para `cloudflareaccess.com`, nunca `200` com o site):

```bash
# Linux e macOS
curl -sI https://<nome-do-projeto>.pages.dev | head -5
```
```powershell
# Windows (PowerShell): use curl.exe, porque "curl" é um apelido do PowerShell
curl.exe -sI https://<nome-do-projeto>.pages.dev
```

## Alternativa sem conectar o GitHub (envio manual)

```bash
# Linux e macOS
npm run build:site
npx wrangler login
npx wrangler pages deploy dist --project-name claude-library
```
```powershell
# Windows (PowerShell)
npm run build:site
npx wrangler login
npx wrangler pages deploy dist --project-name claude-library
```

`npx wrangler` baixa a ferramenta oficial do Cloudflare do npm; rode você mesmo no seu terminal (o ambiente do Claude bloqueia executar programas baixados). Esse caminho não faz o deploy automático a cada push.

## Se mudar de ideia

GitHub Pro (plano pago) ou repositório público separado só com o site também funcionam; veja `docs/decisoes.md`. Em ambos o site fica **público** (sem login).
