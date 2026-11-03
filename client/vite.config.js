import { cpSync, existsSync, statSync, createReadStream } from 'node:fs';
import { dirname, extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = join(REPO, 'content');
const TYPES = { '.json': 'application/json', '.md': 'text/markdown; charset=utf-8' };

// `content/` fica na raiz do repositório (os arquivos do usuário entram sem alteração).
// Em dev é servido em /content/; na build é copiado para dist/content/.
const conteudo = () => ({
  name: 'conteudo-na-raiz',
  configureServer(server) {
    server.middlewares.use('/content', (req, res, next) => {
      let alvo;
      try {
        alvo = normalize(join(CONTENT, decodeURIComponent((req.url ?? '/').split('?')[0])));
      } catch {
        return next(); // URL com escape inválido (ex.: %E0%A4%A)
      }
      if (!alvo.startsWith(CONTENT + sep) || !existsSync(alvo) || !statSync(alvo).isFile()) return next();
      res.setHeader('Content-Type', TYPES[extname(alvo)] ?? 'application/octet-stream');
      createReadStream(alvo)
        .on('error', () => res.destroy())
        .pipe(res);
    });
  },
  closeBundle() {
    cpSync(CONTENT, join(REPO, 'client', 'dist', 'content'), { recursive: true });
  },
});

export default defineConfig({
  base: './', // caminhos relativos: o site funciona em qualquer subcaminho do Pages
  plugins: [react(), conteudo()],
  test: { environment: 'jsdom', setupFiles: ['./src/setup-tests.js'], testTimeout: 15000 },
});
