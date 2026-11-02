import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { findSensitive, checkContent } from '../scripts/check-content.mjs';

const created = [];
after(() => {
  for (const dir of created) rmSync(dir, { recursive: true, force: true });
});

/** Cria uma raiz temporária (dentro de os.tmpdir()) com os arquivos informados. */
function makeRoot(files) {
  const dir = mkdtempSync(join(tmpdir(), 'check-content-'));
  created.push(dir);
  for (const [rel, text] of Object.entries(files)) {
    const abs = join(dir, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, text);
  }
  return dir;
}

const manifest = (cards) => ({
  tiers: [
    { id: 'basicas', title: 'Básicas', cards },
    { id: 'intermediarias', title: 'Intermediárias', cards: [] },
    { id: 'complexas', title: 'Complexas', cards: [] },
  ],
});
const cardWith = (file = 'basicas/exemplo/skill.md', over = {}) => ({
  id: 'exemplo',
  title: 'Exemplo',
  summary: 'Resumo',
  tags: [],
  pieces: [{ type: 'skill', title: 'Skill', file }],
  ...over,
});
const json = (m) => JSON.stringify(m, null, 2);
const CLEAN = '---\nname: exemplo\ndescription: Modelo.\n---\n# Skill\n\nTexto comum.\n';
const rules = (text) => findSensitive(text).map((f) => f.rule);

// ---------- findSensitive ----------

test('findSensitive: detecta e-mail', () => {
  assert.deepEqual(rules('contato: davisrocha.contato@gmail.com'), ['email']);
  const [finding] = findSensitive('x a@b.co y');
  assert.equal(finding.match, 'a@b.co');
});

test('findSensitive: não dispara em @ sem e-mail válido', () => {
  for (const text of ['user@', '@media (max-width: 600px)', 'npm i foo@1.2.3', '@types/node']) {
    assert.deepEqual(findSensitive(text), [], text);
  }
});

test('findSensitive: detecta caminho pessoal /home e /Users', () => {
  const [home] = findSensitive('veja /home/davisr/Programação/x');
  assert.equal(home.rule, 'caminho-pessoal');
  assert.equal(home.match, '/home/davisr');
  assert.deepEqual(rules('em /Users/maria/Documents'), ['caminho-pessoal']);
});

test('findSensitive: não dispara em ~/.claude/skills nem em /home sem usuário', () => {
  for (const text of ['use ~/.claude/skills', 'pasta /home/ vazia', '/homework/x']) {
    assert.deepEqual(findSensitive(text), [], text);
  }
});

test('findSensitive: detecta token GitHub ghp_ e gho_ com 36 caracteres', () => {
  assert.deepEqual(rules(`token ghp_${'a'.repeat(36)}`), ['token-github']);
  assert.deepEqual(rules(`token gho_${'A9'.repeat(18)}`), ['token-github']);
});

test('findSensitive: token GitHub com menos de 36 caracteres não dispara', () => {
  assert.deepEqual(findSensitive(`ghp_${'a'.repeat(35)}`), []);
  assert.deepEqual(findSensitive('ghp_exemplo'), []);
});

test('findSensitive: detecta chave sk- com 20 ou mais caracteres', () => {
  assert.deepEqual(rules(`chave sk-${'a'.repeat(20)}`), ['chave-sk']);
  assert.deepEqual(rules(`sk-ant-api03-${'x'.repeat(30)}`), ['chave-sk']);
});

test('findSensitive: sk- curto ou em palavras comuns não dispara', () => {
  for (const text of [`sk-${'a'.repeat(19)}`, 'sk-...', 'task-manager-exemplo-de-texto']) {
    assert.deepEqual(findSensitive(text), [], text);
  }
});

test('findSensitive: detecta cabeçalho de chave privada', () => {
  assert.deepEqual(rules('-----BEGIN PRIVATE KEY-----'), ['chave-privada']);
  assert.deepEqual(rules('-----BEGIN RSA PRIVATE KEY-----'), ['chave-privada']);
});

test('findSensitive: certificado não é chave privada', () => {
  assert.deepEqual(findSensitive('-----BEGIN CERTIFICATE-----'), []);
});

test('findSensitive: texto comum não dispara', () => {
  assert.deepEqual(findSensitive('Use esta skill para revisar o código e escrever testes.'), []);
});

test('findSensitive: reporta todas as ocorrências de regras diferentes', () => {
  assert.deepEqual(rules('a@b.com e /home/davisr'), ['email', 'caminho-pessoal']);
});

// ---------- checkContent ----------

test('checkContent: raiz válida não gera erros', () => {
  const root = makeRoot({
    'content/manifest.json': json(manifest([cardWith()])),
    'content/basicas/exemplo/skill.md': CLEAN,
  });
  assert.deepEqual(checkContent(root), { errors: [] });
});

test('checkContent: manifest inválido gera erro', () => {
  const root = makeRoot({
    'content/manifest.json': json(manifest([cardWith('basicas/exemplo/skill.md', { icon: 'nope' })])),
    'content/basicas/exemplo/skill.md': CLEAN,
  });
  const { errors } = checkContent(root);
  assert.ok(errors.some((e) => e.startsWith('content/manifest.json:') && /icon inválido/.test(e)), errors.join('\n'));
});

test('checkContent: arquivo de peça ausente gera erro', () => {
  const root = makeRoot({
    'content/manifest.json': json(manifest([cardWith('basicas/ausente/skill.md')])),
  });
  const { errors } = checkContent(root);
  assert.deepEqual(errors, ['content/basicas/ausente/skill.md: arquivo ausente (peça skill)']);
});

test('checkContent: caminho fora de content/ não é lido nem causa falha', () => {
  const root = makeRoot({
    'content/manifest.json': json(manifest([cardWith('../fora/skill.md')])),
  });
  const { errors } = checkContent(root);
  assert.ok(errors.some((e) => e.includes('caminho de arquivo inválido')), errors.join('\n'));
  assert.ok(errors.every((e) => !e.includes('ausente')), errors.join('\n'));
});

test('checkContent: e-mail em .md gera erro com arquivo e trecho', () => {
  const root = makeRoot({
    'content/manifest.json': json(manifest([cardWith()])),
    'content/basicas/exemplo/skill.md': `${CLEAN}\nFale com davisrocha.contato@gmail.com\n`,
  });
  assert.deepEqual(checkContent(root).errors, [
    'content/basicas/exemplo/skill.md: email: davisrocha.contato@gmail.com',
  ]);
});

test('checkContent: varre .md em subpastas e o manifest', () => {
  const root = makeRoot({
    'content/manifest.json': json(manifest([cardWith('basicas/exemplo/skill.md', { title: 'Contato a@b.com' })])),
    'content/basicas/exemplo/skill.md': CLEAN,
    'content/intermediarias/x/notas.md': `nota ghp_${'a'.repeat(36)}\n`,
  });
  const { errors } = checkContent(root);
  assert.ok(errors.some((e) => e.startsWith('content/manifest.json: email: a@b.com')), errors.join('\n'));
  assert.ok(
    errors.some((e) => e.startsWith('content/intermediarias/x/notas.md: token-github: ')),
    errors.join('\n'),
  );
});

test('checkContent: manifest.json ausente gera erro', () => {
  const root = makeRoot({ 'content/basicas/exemplo/skill.md': CLEAN });
  const { errors } = checkContent(root);
  assert.equal(errors.length, 1);
  assert.ok(errors[0].startsWith('content/manifest.json:'), errors[0]);
});
