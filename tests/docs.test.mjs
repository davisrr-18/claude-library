import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// A documentação é conferida contra o código: se um módulo, arquivo, comando ou export citado deixar de
// existir, o teste falha e o documento precisa ser atualizado no mesmo commit.
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');
const DOCS = ['CLAUDE.md', ...readdirSync(join(ROOT, 'docs')).filter((f) => f.endsWith('.md')).map((f) => `docs/${f}`)];

test('a documentacao existe e tem os documentos esperados', () => {
  for (const f of ['CLAUDE.md', 'docs/README.md', 'docs/novo-chat.md', 'docs/arquitetura.md', 'docs/design.md',
    'docs/regras-de-trabalho.md', 'docs/conteudo.md', 'docs/qualidade.md', 'docs/decisoes.md']) {
    assert.ok(existsSync(join(ROOT, f)), `falta ${f}`);
  }
});

test('links relativos dos documentos apontam para arquivos que existem', () => {
  let checked = 0;
  for (const doc of DOCS) {
    for (const m of read(doc).matchAll(/\]\(([A-Za-z0-9./_-][^)\s#]*)(?:#[^)]*)?\)/g)) {
      if (/^(https?:|mailto:)/.test(m[1])) continue;
      checked++;
      assert.ok(existsSync(normalize(join(ROOT, dirname(doc), m[1]))), `${doc}: link quebrado -> ${m[1]}`);
    }
  }
  assert.ok(checked >= 5, `poucos links conferidos (${checked}): o teste nao esta lendo os documentos`);
});

test('todo arquivo do projeto citado entre crases nos documentos existe', () => {
  const PATH = /^(?:tests|js|scripts|tools|css|content|docs|vendor)\/[\w./-]+\.\w+$/;
  let checked = 0;
  for (const doc of DOCS) {
    for (const m of read(doc).matchAll(/`([^`\s]+)`/g)) {
      if (!PATH.test(m[1])) continue;
      checked++;
      assert.ok(existsSync(join(ROOT, m[1])), `${doc}: arquivo citado nao existe -> ${m[1]}`);
    }
  }
  assert.ok(checked >= 15, `poucos caminhos conferidos (${checked}): o teste nao esta lendo os documentos`);
});

test('todo "npm run X" citado existe no package.json da raiz', () => {
  const scripts = new Set(Object.keys(JSON.parse(read('package.json')).scripts));
  let checked = 0;
  for (const doc of DOCS) {
    for (const m of read(doc).matchAll(/npm run ([a-z][\w:-]*)/g)) {
      checked++;
      assert.ok(scripts.has(m[1]), `${doc}: npm run ${m[1]} nao existe no package.json`);
    }
  }
  assert.ok(checked >= 8, `poucos comandos conferidos (${checked})`);
});

test('arquitetura.md: todo modulo de js/ tem linha na tabela e cada export prometido existe de verdade', () => {
  const table = read('docs/arquitetura.md').split('\n').filter((l) => /^\| `[\w-]+\.js` \|/.test(l));
  const documented = new Map(table.map((l) => [l.match(/^\| `([\w-]+\.js)`/)[1], l.split('|')[3] ?? '']));
  const actual = readdirSync(join(ROOT, 'js')).filter((f) => f.endsWith('.js'));
  assert.deepEqual([...documented.keys()].sort(), actual.sort(), 'modulos da tabela x arquivos de js/');
  for (const [file, exportsCell] of documented) {
    const src = read(`js/${file}`);
    for (const name of [...exportsCell.matchAll(/`([A-Za-z_]\w*)`/g)].map((m) => m[1])) {
      assert.match(src, new RegExp(`export\\s+(?:async\\s+)?(?:function|const|let|class)\\s+${name}\\b|export\\s*\\{[^}]*\\b${name}\\b`),
        `docs/arquitetura.md promete ${file} exportar ${name}, mas nao exporta`);
    }
  }
});

test('os documentos nao tem dado pessoal (o verificador do projeto tambem barra, aqui falha mais cedo)', () => {
  for (const doc of DOCS) {
    const text = read(doc);
    assert.doesNotMatch(text, /\/(?:home|Users)\/[a-z]/, `${doc}: caminho pessoal`); // sensivel a maiusculas: "setas/Home/End" nao e caminho
    assert.doesNotMatch(text, /[\w.+-]+@[\w-]+\.[a-z]{2,}/i, `${doc}: e-mail`);
  }
});
