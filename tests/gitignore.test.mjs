import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// O .gitignore é conferido com o próprio git (`git check-ignore`), nos dois sentidos: o que PRECISA ser
// ignorado (pessoal, local, segredo) e o que NÃO pode ser (o projeto de verdade). Um .gitignore errado é silencioso.
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const hasGit = spawnSync('git', ['--version'], { stdio: 'ignore' }).status === 0 && existsSync(join(ROOT, '.git'));
const opts = { skip: !hasGit && 'sem repositório git' };

/** true se o git ignora o caminho (o arquivo nem precisa existir). */
function ignored(path) {
  const r = spawnSync('git', ['check-ignore', '-q', '--no-index', path], { cwd: ROOT });
  assert.ok(r.status === 0 || r.status === 1, `git check-ignore falhou para ${path}: ${r.stderr}`);
  return r.status === 0;
}

const DEVE_IGNORAR = [
  // gerado
  'node_modules/x/index.js', 'client/node_modules/react/index.js', 'dist/index.html', 'client/dist/index.html', '.wrangler/state/x',
  // pessoal e local do Claude Code
  '.claude/settings.local.json', '.claude/agents/meu.md', 'CLAUDE.local.md', 'settings.local.json', 'qualquer.local',
  // segredos e credenciais
  '.env', '.env.local', '.env.production', '.dev.vars', '.npmrc', '.netrc', 'chave.pem', 'cert.p12', 'cert.pfx', 'api.key',
  'id_rsa', 'id_rsa.pub', 'id_ed25519', 'meu.secret', 'secrets/token.txt', 'credentials.json', 'credentials-prod.json',
  // sistema operacional
  '.DS_Store', 'docs/.DS_Store', 'Thumbs.db', 'desktop.ini', 'ehthumbs.db',
  // editores
  '.vscode/settings.json', '.idea/workspace.xml', 'arquivo.swp', 'rascunho~', '.history/x.md',
  // logs, backups e rascunhos
  'debug.log', 'npm-debug.log', 'npm-debug.log.1', 'index.html.bak', 'x.orig', 'x.rej', 'backup.bundle', 'x.tmp',
];

const NAO_PODE_IGNORAR = [
  'CLAUDE.md', 'arquitetura.md', 'README.md', 'package.json', 'package-lock.json', 'eslint.config.js', '.prettierrc.json',
  '.gitignore', '.node-version', '.github/workflows/ci.yml', '.github/workflows/pages.yml',
  'client/index.html', 'client/package.json', 'client/vite.config.js', 'client/src/App.jsx', 'client/src/styles/tokens.css',
  'client/vendor/marked.esm.js', 'client/vendor/README.md', 'client/vendor/highlight/core.min.js',
  'content/manifest.json', 'content/intermediarias/estudos-em-programacao/00-indice.md', 'deploy/_headers',
  'docs/README.md', 'docs/novo-chat.md', 'docs/deploy/cloudflare.md', 'scripts/build-site.mjs', 'tests/gitignore.test.mjs',
  '.env.example', // exemplo sem segredo pode ser versionado
];

for (const p of DEVE_IGNORAR) {
  test(`ignora: ${p}`, opts, () => assert.equal(ignored(p), true, `${p} deveria estar no .gitignore`));
}
for (const p of NAO_PODE_IGNORAR) {
  test(`NAO ignora: ${p}`, opts, () => assert.equal(ignored(p), false, `${p} faz parte do projeto e nao pode ser ignorado`));
}

test('nenhum arquivo rastreado casa com o .gitignore (nada pessoal ja versionado escapou)', opts, () => {
  const r = spawnSync('git', ['ls-files', '-ci', '--exclude-standard'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout.trim(), '', `rastreados mas ignorados (remova do git com "git rm --cached"):\n${r.stdout}`);
});
