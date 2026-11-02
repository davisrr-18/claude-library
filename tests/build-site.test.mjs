import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSite, SITE_ENTRIES } from '../scripts/build-site.mjs';

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

/** Projeto mínimo, só para testar o build isolado do repositório real. */
function miniProject(extra = {}) {
  const root = fresh('projeto');
  for (const d of ['css', 'js', 'vendor', 'content/basicas/a', 'deploy', 'tests', 'docs', 'tools/qa', 'scripts']) mkdirSync(join(root, d), { recursive: true });
  const files = {
    'index.html': '<link rel="stylesheet" href="css/style.css"><script type="module" src="js/app.js"></script>',
    'css/style.css': 'body{}', 'js/app.js': 'export {}', 'vendor/marked.esm.js': 'export {}',
    'content/manifest.json': JSON.stringify({ tiers: [
      { id: 'basicas', title: 'B', cards: [{ id: 'a', title: 'A', pieces: [{ type: 'skill', title: 'S', file: 'basicas/a/skill.md' }] }] },
      { id: 'intermediarias', title: 'I', cards: [] }, { id: 'complexas', title: 'C', cards: [] }] }),
    'content/basicas/a/skill.md': '# ok\n',
    'deploy/_headers': '/*\n  X-Robots-Tag: noindex\n',
    'tests/x.test.mjs': '// nao publicar', 'docs/x.md': 'nao publicar', 'tools/qa/x.mjs': 'nao publicar', 'scripts/x.mjs': 'nao publicar',
    'CLAUDE.md': 'nao publicar', 'README.md': 'nao publicar', 'package.json': '{}', ...extra,
  };
  for (const [rel, text] of Object.entries(files)) writeFileSync(join(root, rel), text);
  return root;
}

test('lista de permissao: index.html, css, js, vendor, content (e o _headers gerado)', () => {
  assert.deepEqual([...SITE_ENTRIES].sort(), ['content', 'css', 'index.html', 'js', 'vendor']);
});

test('o build do projeto real publica exatamente a lista de permissao e nada mais', () => {
  const out = fresh('real');
  const { files } = buildSite(REPO, out);
  assert.deepEqual(readdirSync(out).sort(), ['_headers', 'content', 'css', 'index.html', 'js', 'vendor']);
  for (const proibido of ['tests', 'docs', 'tools', 'scripts', 'deploy', '.git', '.github', 'node_modules', 'CLAUDE.md', 'README.md', 'package.json', 'package-lock.json']) {
    assert.ok(!existsSync(join(out, proibido)), `${proibido} nao pode ser publicado`);
  }
  assert.deepEqual(files, listFiles(out), 'o retorno descreve o que de fato foi escrito');
  assert.ok(files.length > 30);
});

test('todo arquivo que o manifest cita esta no site publicado, e os modulos do app tambem', () => {
  const out = fresh('real');
  buildSite(REPO, out);
  const manifest = JSON.parse(readFileSync(join(out, 'content/manifest.json'), 'utf8'));
  const cited = manifest.tiers.flatMap((t) => t.cards.flatMap((c) => c.pieces.map((p) => `content/${p.file}`)));
  assert.ok(cited.length > 0);
  for (const f of cited) assert.ok(existsSync(join(out, f)), `falta ${f}`);
  for (const f of ['js/app.js', 'js/install.js', 'css/style.css', 'vendor/marked.esm.js', 'vendor/highlight/core.min.js']) assert.ok(existsSync(join(out, f)), `falta ${f}`);
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

test('projeto minimo: publica so a lista de permissao, mesmo com tests/docs/tools/scripts presentes', () => {
  const root = miniProject();
  const out = fresh('saida');
  buildSite(root, out);
  assert.deepEqual(listFiles(out), ['_headers', 'content/basicas/a/skill.md', 'content/manifest.json', 'css/style.css', 'index.html', 'js/app.js', 'vendor/marked.esm.js']);
});

test('RECUSA construir com dado sensivel no conteudo (o Cloudflare publica mesmo se o CI falhar)', () => {
  const root = miniProject({ 'content/basicas/a/skill.md': 'fale com fulano@example.com\n' });
  const out = fresh('saida');
  assert.throws(() => buildSite(root, out), /dado sensível|email/i);
  assert.ok(!existsSync(out) || readdirSync(out).length === 0, 'nada deve ser publicado quando o conteudo falha na verificacao');
});

test('RECUSA construir se um arquivo do manifest nao existe', () => {
  const root = miniProject();
  rmSync(join(root, 'content/basicas/a/skill.md'));
  assert.throws(() => buildSite(root, fresh('saida')), /ausente|skill\.md/);
});

test('RECUSA construir se o index.html referencia um arquivo que nao esta na lista de permissao', () => {
  const root = miniProject({ 'index.html': '<script type="module" src="js/app.js"></script><link href="docs/estilo.css" rel="stylesheet">' });
  assert.throws(() => buildSite(root, fresh('saida')), /docs\/estilo\.css/);
});

test('ignora links externos, ancoras e data: ao conferir os arquivos do index.html', () => {
  const root = miniProject({ 'index.html': '<link rel="stylesheet" href="css/style.css"><a href="#main">x</a><a href="https://example.com/x.css">y</a><img src="data:image/png;base64,AAAA"><script type="module" src="js/app.js"></script>' });
  assert.doesNotThrow(() => buildSite(root, fresh('saida')));
});

test('TRAVAS: nunca apaga a raiz, o pai da raiz nem as pastas do site', () => {
  const root = miniProject();
  for (const ruim of [root, dirname(root), join(root, 'js'), join(root, 'content/basicas'), join(root, 'css'), join(root, 'vendor'), join(root, 'index.html'), '/', '.']) {
    assert.throws(() => buildSite(root, ruim), /saída inválida|inválid/i, String(ruim));
  }
  assert.ok(existsSync(join(root, 'js/app.js')) && existsSync(join(root, 'index.html')), 'o projeto continua intacto');
});

test('saida dentro do projeto, mas fora do site (ex.: dist/), e permitida', () => {
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

test('sem a pasta/arquivo da lista de permissao -> erro claro', () => {
  const root = miniProject();
  rmSync(join(root, 'vendor'), { recursive: true });
  assert.throws(() => buildSite(root, fresh('saida')), /vendor/);
});
