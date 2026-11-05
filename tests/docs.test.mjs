import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// A documentação é conferida contra o código: se uma pasta, arquivo, comando ou componente citado deixar de
// existir, o teste falha e o documento precisa ser atualizado no mesmo commit.
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');
const dirs = (rel) => readdirSync(join(ROOT, rel)).filter((f) => statSync(join(ROOT, rel, f)).isDirectory());
const DOCS = ['CLAUDE.md', 'arquitetura.md', ...readdirSync(join(ROOT, 'docs')).filter((f) => f.endsWith('.md')).map((f) => `docs/${f}`)];

test('a documentacao existe e tem os documentos esperados', () => {
  for (const f of ['CLAUDE.md', 'arquitetura.md', 'docs/README.md', 'docs/novo-chat.md', 'docs/design.md',
    'docs/regras-de-trabalho.md', 'docs/conteudo.md', 'docs/qualidade.md', 'docs/decisoes.md',
    'docs/decisions/0001-migracao-para-o-modelo-dev-web.md']) {
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
  const PATH = /^(?:tests|scripts|content|docs|client|deploy|\.github)\/[\w./-]+\.\w+$/;
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

test('arquitetura.md: toda pasta de client/src e todo componente aparecem na arvore, e nada citado sumiu', () => {
  const arq = read('arquitetura.md');
  for (const dir of dirs('client/src')) assert.match(arq, new RegExp(`\\b${dir}/`), `a arvore nao cita client/src/${dir}/`);
  for (const comp of dirs('client/src/components')) assert.match(arq, new RegExp(`\\b${comp}\\b`), `a arvore nao cita o componente ${comp}`);
  for (const page of dirs('client/src/pages')) assert.match(arq, new RegExp(`\\b${page}\\b`), `a arvore nao cita a pagina ${page}`);
  for (const hook of readdirSync(join(ROOT, 'client/src/hooks')).filter((f) => /^use\w+\.js$/.test(f)).map((f) => f.replace('.js', ''))) {
    assert.match(arq, new RegExp(`\\b${hook}\\b`), `a arvore nao cita o hook ${hook}`);
  }
});

test('os documentos nao tem dado pessoal (o verificador do projeto tambem barra, aqui falha mais cedo)', () => {
  for (const doc of DOCS) {
    const text = read(doc);
    assert.doesNotMatch(text, /\/(?:home|Users)\/[a-z]/, `${doc}: caminho pessoal`); // sensivel a maiusculas: "setas/Home/End" nao e caminho
    assert.doesNotMatch(text, /[\w.+-]+@[\w-]+\.[a-z]{2,}/i, `${doc}: e-mail`);
  }
});
