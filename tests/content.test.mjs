import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFrontMatter, validateManifest, PIECE_TYPES, TIER_IDS } from '../js/content.js';

test('parseFrontMatter: front matter simples', () => {
  const { meta, body } = parseFrontMatter('---\nname: x\ndescription: y\n---\n# Titulo\n');
  assert.deepEqual(meta, { name: 'x', description: 'y' });
  assert.equal(body, '# Titulo\n');
});

test('parseFrontMatter: ausente devolve texto intacto', () => {
  const { meta, body } = parseFrontMatter('# so corpo');
  assert.deepEqual(meta, {});
  assert.equal(body, '# so corpo');
});

test('parseFrontMatter: CRLF', () => {
  const { meta, body } = parseFrontMatter('---\r\nname: x\r\n---\r\ncorpo\r\n');
  assert.equal(meta.name, 'x');
  assert.equal(body, 'corpo\n');
});

test('parseFrontMatter: valor com dois pontos', () => {
  const { meta } = parseFrontMatter('---\ndescription: a: b\n---\nc');
  assert.equal(meta.description, 'a: b');
});

test('parseFrontMatter: sem fechamento nao e front matter', () => {
  const { meta, body } = parseFrontMatter('---\nname: x\nsem fim');
  assert.deepEqual(meta, {});
  assert.equal(body, '---\nname: x\nsem fim');
});

const piece = (over = {}) => ({ type: 'skill', title: 'S', file: 'basicas/a/skill.md', ...over });
const card = (over = {}) => ({ id: 'a', title: 'A', summary: 's', tags: [], pieces: [piece()], ...over });
const manifest = (cards = [card()]) => ({
  tiers: [
    { id: 'basicas', title: 'Tarefas Básicas', cards },
    { id: 'intermediarias', title: 'Tarefas Intermediárias', cards: [] },
    { id: 'complexas', title: 'Tarefas Complexas', cards: [] },
  ],
});

test('constantes', () => {
  assert.deepEqual(TIER_IDS, ['basicas', 'intermediarias', 'complexas']);
  assert.deepEqual(PIECE_TYPES, ['skill', 'claude-md', 'arquitetura', 'agente', 'workflow', 'prompt']);
});

test('validateManifest: valido, com niveis vazios', () => {
  assert.deepEqual(validateManifest(manifest()), { ok: true, errors: [] });
});

test('validateManifest: nao-objeto e sem tiers', () => {
  assert.equal(validateManifest(null).ok, false);
  assert.equal(validateManifest({}).ok, false);
});

test('validateManifest: id duplicado entre cards', () => {
  const r = validateManifest(manifest([card(), card()]));
  assert.equal(r.ok, false);
  assert.match(r.errors.join('\n'), /duplicad/i);
});

test('validateManifest: tipo invalido', () => {
  const r = validateManifest(manifest([card({ pieces: [piece({ type: 'nada' })] })]));
  assert.equal(r.ok, false);
  assert.match(r.errors.join('\n'), /tipo/i);
});

test('validateManifest: tipo repetido no mesmo card', () => {
  const r = validateManifest(manifest([card({ pieces: [piece(), piece({ file: 'basicas/a/b.md' })] })]));
  assert.equal(r.ok, false);
  assert.match(r.errors.join('\n'), /repetid/i);
});

test('validateManifest: file com .. ou barra inicial', () => {
  assert.equal(validateManifest(manifest([card({ pieces: [piece({ file: '../x.md' })] })])).ok, false);
  assert.equal(validateManifest(manifest([card({ pieces: [piece({ file: 'a/../../x.md' })] })])).ok, false);
  assert.equal(validateManifest(manifest([card({ pieces: [piece({ file: '/etc/x.md' })] })])).ok, false);
});

test('validateManifest: id fora de kebab-case', () => {
  assert.equal(validateManifest(manifest([card({ id: 'Meu Card' })])).ok, false);
});

test('validateManifest: nivel desconhecido ou faltando', () => {
  const m = manifest();
  m.tiers[0].id = 'outro';
  assert.equal(validateManifest(m).ok, false);
  const m2 = manifest();
  m2.tiers.pop();
  assert.equal(validateManifest(m2).ok, false);
});

test('validateManifest: card sem pecas e permitido', () => {
  assert.equal(validateManifest(manifest([card({ pieces: [] })])).ok, true);
});

test('parseFrontMatter: BOM no inicio', () => {
  const { meta, body } = parseFrontMatter('﻿---\nname: x\n---\ncorpo');
  assert.equal(meta.name, 'x');
  assert.equal(body, 'corpo');
});

test('parseFrontMatter: front matter vazio', () => {
  const { meta, body } = parseFrontMatter('---\n---\ncorpo');
  assert.deepEqual(meta, {});
  assert.equal(body, 'corpo');
});

test('validateManifest: tags e summary com tipo errado', () => {
  assert.equal(validateManifest(manifest([card({ tags: 'modelo' })])).ok, false);
  assert.equal(validateManifest(manifest([card({ tags: [1] })])).ok, false);
  assert.equal(validateManifest(manifest([card({ summary: 5 })])).ok, false);
});

test('validateManifest: title de nivel e de peca obrigatorios', () => {
  const m = manifest();
  delete m.tiers[0].title;
  assert.equal(validateManifest(m).ok, false);
  assert.equal(validateManifest(manifest([card({ pieces: [piece({ title: '' })] })])).ok, false);
});

test('validateManifest: estruturas nao-lista, nulos e caminhos estranhos', () => {
  const m = manifest();
  m.tiers[0].cards = 'x';
  assert.equal(validateManifest(m).ok, false);
  assert.equal(validateManifest(manifest([card({ pieces: 'x' })])).ok, false);
  assert.equal(validateManifest(manifest([null])).ok, false);
  assert.equal(validateManifest(manifest([card({ pieces: [null] })])).ok, false);
  for (const file of ['', 'a\\b.md', 'a/./b.md', 'a//b.md']) {
    assert.equal(validateManifest(manifest([card({ pieces: [piece({ file })] })])).ok, false, file);
  }
  const dup = manifest();
  dup.tiers.push({ id: 'basicas', title: 'x', cards: [] });
  assert.equal(validateManifest(dup).ok, false);
});

test('CARD_ICONS: lista fechada com padrao folder', async () => {
  const { CARD_ICONS } = await import('../js/content.js');
  assert.ok(CARD_ICONS.includes('folder'));
  assert.ok(CARD_ICONS.length >= 8);
});

test('validateManifest: icon opcional, mas restrito a lista', () => {
  assert.equal(validateManifest(manifest([card({ icon: 'bot' })])).ok, true);
  assert.equal(validateManifest(manifest([card({ icon: 'nao-existe' })])).ok, false);
  assert.equal(validateManifest(manifest([card({ icon: 5 })])).ok, false);
});

test('validateManifest: description de nivel e texto opcional', () => {
  const m = manifest();
  m.tiers[0].description = 'Tarefas rapidas';
  assert.equal(validateManifest(m).ok, true);
  m.tiers[0].description = 5;
  assert.equal(validateManifest(m).ok, false);
});

test('parseFrontMatter: bloco dobrado (>) e literal (|)', () => {
  const folded = parseFrontMatter('---\nname: x\ndescription: >\n  linha um\n  linha dois\n---\ncorpo');
  assert.equal(folded.meta.description, 'linha um linha dois');
  const literal = parseFrontMatter('---\ndescription: |\n  a\n  b\n---\ncorpo');
  assert.equal(literal.meta.description, 'a\nb');
  assert.equal(folded.body, 'corpo');
});

test('parseFrontMatter: regua --- no inicio do corpo nao engole a secao', () => {
  const text = '---\n\n# Titulo\n\ntexto\n\n---\n\n# Outro\n';
  const { meta, body } = parseFrontMatter(text);
  assert.deepEqual(meta, {});
  assert.equal(body, text);
});

test('parseFrontMatter: titulo entre reguas continua sendo corpo', () => {
  const { meta, body } = parseFrontMatter('---\n# Titulo\n---\ntexto');
  assert.deepEqual(meta, {});
  assert.equal(body, '---\n# Titulo\n---\ntexto');
});

test('parseFrontMatter: aspas removidas, chave duplicada vale a ultima', () => {
  const { meta } = parseFrontMatter('---\nname: "a"\nname: b\ndescription: \'c\'\n---\n');
  assert.deepEqual(meta, { name: 'b', description: 'c' });
});

test('validateManifest: tags vazias ou so com espacos sao rejeitadas', () => {
  assert.equal(validateManifest(manifest([card({ tags: [''] })])).ok, false);
  assert.equal(validateManifest(manifest([card({ tags: ['  '] })])).ok, false);
});

test('validateManifest: file com espaco nas pontas ou caractere de controle', () => {
  for (const file of ['a.md ', ' a.md', 'a\u0000.md', 'a\n.md']) {
    assert.equal(validateManifest(manifest([card({ pieces: [piece({ file })] })])).ok, false, JSON.stringify(file));
  }
});

test('validateManifest: mensagens dizem o que esta errado', () => {
  const dup = validateManifest(manifest([card(), card()])).errors.join('\n');
  assert.match(dup, /basicas\/a: id de card duplicado/);
  const rep = validateManifest(manifest([card({ pieces: [piece(), piece({ file: 'basicas/a/b.md' })] })])).errors.join('\n');
  assert.match(rep, /tipo de peça repetido: skill/);
});
