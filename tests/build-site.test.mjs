import { test, after, before } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSite, SITE_SOURCE } from '../scripts/build-site.mjs';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const base = mkdtempSync(join(tmpdir(), 'claude-library-build-'));
after(() => rmSync(base, { recursive: true, force: true }));
let n = 0;
const fresh = (name) => join(base, `${name}-${n++}`);

/** Lista todos os arquivos de uma pasta, relativos e com "/" (igual em qualquer sistema). */
function listFiles(dir, prefix = '') {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? listFiles(join(dir, e.name), `${prefix}${e.name}/`) : [`${prefix}${e.name}`]).sort();
}

// O build do projeto real precisa da build do client: gera agora, para o teste não depender de rodar `npm run build` antes.
before(() => {
  const vite = join(REPO, 'node_modules', 'vite', 'bin', 'vite.js');
  const r = spawnSync(process.execPath, [vite, 'build', '--logLevel', 'error'], { cwd: join(REPO, 'client'), encoding: 'utf8' });
  assert.equal(r.status, 0, `vite build falhou: ${r.stdout}${r.stderr}`);
});

const MANIFEST = JSON.stringify({ tiers: [
  { id: 'basicas', title: 'B', cards: [{ id: 'a', title: 'A', pieces: [{ type: 'skill', title: 'S', file: 'basicas/a/skill.md' }] }] },
  { id: 'intermediarias', title: 'I', cards: [] }, { id: 'complexas', title: 'C', cards: [] }] });

/** Projeto mínimo (com a build do client já feita), só para testar o build isolado do repositório real. */
function miniProject(extra = {}) {
  const root = fresh('projeto');
  for (const d of ['client/dist/assets', 'client/dist/content/basicas/a', 'content/basicas/a', 'deploy', 'tests', 'docs', 'scripts', 'client/src']) mkdirSync(join(root, d), { recursive: true });
  const files = {
    'client/dist/index.html': '<link rel="stylesheet" href="./assets/app.css"><script type="module" src="./assets/app.js"></script>',
    'client/dist/assets/app.css': 'body{}', 'client/dist/assets/app.js': 'export {}',
    'client/dist/content/manifest.json': MANIFEST, 'client/dist/content/basicas/a/skill.md': '# ok\n',
    'content/manifest.json': MANIFEST, 'content/basicas/a/skill.md': '# ok\n',
    'deploy/_headers': '/*\n  X-Robots-Tag: noindex\n',
    'tests/x.test.mjs': '// nao publicar', 'docs/x.md': 'nao publicar', 'scripts/x.mjs': 'nao publicar', 'client/src/App.jsx': '// nao publicar',
    'CLAUDE.md': 'nao publicar', 'README.md': 'nao publicar', 'package.json': '{}', ...extra,
  };
  for (const [rel, text] of Object.entries(files)) writeFileSync(join(root, rel), text);
  return root;
}

test('o site vem da build do client', () => {
  assert.equal(SITE_SOURCE, 'client/dist');
});

test('o build do projeto real publica a build do client e o _headers, e nada mais', () => {
  const out = fresh('real');
  const { files } = buildSite(REPO, out);
  assert.deepEqual(readdirSync(out).sort(), ['_headers', 'assets', 'content', 'index.html']);
  for (const proibido of ['tests', 'docs', 'scripts', 'deploy', 'client', '.git', '.github', 'node_modules', 'CLAUDE.md', 'README.md', 'package.json', 'package-lock.json']) {
    assert.ok(!existsSync(join(out, proibido)), `${proibido} nao pode ser publicado`);
  }
  assert.deepEqual(files, listFiles(out), 'o retorno descreve o que de fato foi escrito');
  assert.ok(files.some((f) => /^assets\/index-.*\.js$/.test(f)), 'falta o JavaScript do app');
  assert.ok(files.some((f) => /^assets\/index-.*\.css$/.test(f)), 'falta o CSS do app');
});

test('todo arquivo que o manifest cita esta no site publicado, e o realce de sintaxe tambem', () => {
  const out = fresh('real');
  const { files } = buildSite(REPO, out);
  const manifest = JSON.parse(readFileSync(join(out, 'content/manifest.json'), 'utf8'));
  const cited = manifest.tiers.flatMap((t) => t.cards.flatMap((c) => c.pieces.map((p) => `content/${p.file}`)));
  assert.ok(cited.length > 0);
  for (const f of cited) assert.ok(existsSync(join(out, f)), `falta ${f}`);
  assert.ok(files.some((f) => /^assets\/core\.min-.*\.js$/.test(f)), 'falta o highlight.js');
});

test('_headers: noindex, sem iframe, sem referrer, nosniff', () => {
  const out = fresh('real');
  buildSite(REPO, out);
  const h = readFileSync(join(out, '_headers'), 'utf8');
  for (const linha of [/X-Robots-Tag:\s*noindex/, /X-Frame-Options:\s*DENY/, /Referrer-Policy:\s*no-referrer/, /X-Content-Type-Options:\s*nosniff/]) assert.match(h, linha);
});

test('e repetivel: apaga o que sobrou de uma construcao anterior', () => {
  const root = miniProject();
  const out = fresh('saida');
  buildSite(root, out);
  writeFileSync(join(out, 'lixo-antigo.txt'), 'x');
  mkdirSync(join(out, 'pasta-antiga'));
  const again = buildSite(root, out);
  assert.ok(!existsSync(join(out, 'lixo-antigo.txt')) && !existsSync(join(out, 'pasta-antiga')));
  assert.deepEqual(again.files, listFiles(out));
});

test('projeto minimo: publica so a build e o _headers, mesmo com tests/docs/scripts/client/src presentes', () => {
  const root = miniProject();
  const out = fresh('saida');
  buildSite(root, out);
  assert.deepEqual(listFiles(out), ['_headers', 'assets/app.css', 'assets/app.js', 'content/basicas/a/skill.md', 'content/manifest.json', 'index.html']);
});

test('RECUSA construir com dado sensivel no conteudo (o deploy pode rodar mesmo se o CI falhar)', () => {
  const sujo = 'fale com fulano@example.com\n';
  const root = miniProject({ 'content/basicas/a/skill.md': sujo, 'client/dist/content/basicas/a/skill.md': sujo });
  const out = fresh('saida');
  assert.throws(() => buildSite(root, out), /dado sensível|email/i);
  assert.ok(!existsSync(out) || readdirSync(out).length === 0, 'nada deve ser publicado quando o conteudo falha na verificacao');
});

test('RECUSA construir se um arquivo do manifest nao existe', () => {
  const root = miniProject();
  rmSync(join(root, 'content/basicas/a/skill.md'));
  rmSync(join(root, 'client/dist/content/basicas/a/skill.md'));
  assert.throws(() => buildSite(root, fresh('saida')), /ausente|skill\.md/);
});

test('RECUSA construir sem a build do client (client/dist)', () => {
  const root = miniProject();
  rmSync(join(root, 'client/dist'), { recursive: true });
  assert.throws(() => buildSite(root, fresh('saida')), /client\/dist\/index\.html.*npm run build/);
});

test('RECUSA construir com build velha: conteudo mudou depois da build', () => {
  const root = miniProject({ 'content/basicas/a/skill.md': '# texto novo\n' });
  assert.throws(() => buildSite(root, fresh('saida')), /desatualizada.*skill\.md mudou/);
});

test('RECUSA construir com build velha: arquivo novo em content/ que a build nao tem', () => {
  const root = miniProject({ 'content/basicas/a/novo.md': '# novo\n' });
  assert.throws(() => buildSite(root, fresh('saida')), /desatualizada.*falta basicas\/a\/novo\.md/);
});

test('RECUSA construir com build velha: a build tem arquivo que saiu de content/', () => {
  const root = miniProject({ 'client/dist/content/basicas/a/velho.md': '# velho\n' });
  assert.throws(() => buildSite(root, fresh('saida')), /desatualizada.*sobrou basicas\/a\/velho\.md/);
});

test('RECUSA construir se o index.html referencia um arquivo que nao esta na build', () => {
  const root = miniProject({ 'client/dist/index.html': '<script type="module" src="./assets/app.js"></script><link href="./assets/sumiu.css" rel="stylesheet">' });
  assert.throws(() => buildSite(root, fresh('saida')), /assets\/sumiu\.css/);
});

test('RECUSA construir se o index.html aponta para fora da build', () => {
  const root = miniProject({ 'client/dist/index.html': '<script type="module" src="../../CLAUDE.md"></script>' });
  assert.throws(() => buildSite(root, fresh('saida')), /CLAUDE\.md/);
});

test('ignora links externos, ancoras e data: ao conferir os arquivos do index.html', () => {
  const root = miniProject({ 'client/dist/index.html': '<link rel="stylesheet" href="./assets/app.css"><a href="#main">x</a><a href="https://example.com/x.css">y</a><img src="data:image/png;base64,AAAA"><script type="module" src="./assets/app.js"></script>' });
  assert.doesNotThrow(() => buildSite(root, fresh('saida')));
});

test('TRAVAS: nunca apaga a raiz, o pai da raiz, a build do client nem as pastas do projeto', () => {
  const root = miniProject();
  for (const ruim of [root, dirname(root), join(root, 'client/dist'), join(root, 'client/dist/assets'), join(root, 'client/src'), join(root, 'content'), join(root, 'content/basicas'), join(root, 'deploy'), join(root, 'scripts'), '/', '.']) {
    assert.throws(() => buildSite(root, ruim), /saída inválida|inválid/i, String(ruim));
  }
  assert.ok(existsSync(join(root, 'client/dist/index.html')) && existsSync(join(root, 'client/src/App.jsx')), 'o projeto continua intacto');
});

test('saida dentro do projeto, mas fora das pastas dele (ex.: dist/), e permitida', () => {
  const root = miniProject();
  const out = join(root, 'dist');
  assert.doesNotThrow(() => buildSite(root, out));
  assert.ok(existsSync(join(out, 'index.html')));
});

test('o build nao altera o projeto de origem', () => {
  const root = miniProject();
  const antes = listFiles(root);
  buildSite(root, fresh('saida'));
  assert.deepEqual(listFiles(root), antes);
});
