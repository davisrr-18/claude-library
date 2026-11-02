import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize, buildIndex, search, collectTags } from '../js/search.js';

const entries = [
  { tier: 'basicas', card: 'commit', title: 'Commits limpos', summary: 'Mensagens de commit', tags: ['git'], text: 'Use conventional commits e revisão.' },
  { tier: 'basicas', card: 'revisao', title: 'Revisão de código', summary: 'Checklist', tags: ['review', 'git'], text: 'Ação do revisor.' },
  { tier: 'complexas', card: 'migracao', title: 'Migração grande', summary: 'Marcos', tags: ['arquitetura'], text: 'Plano em marcos com commit por marco.' },
];
const idx = buildIndex(entries);
const ids = (r) => r.map((e) => e.card);

test('normalize: minusculas e sem acentos', () => {
  assert.equal(normalize('Ação REVISÃO'), 'acao revisao');
  assert.equal(normalize(undefined), '');
});

test('consulta vazia ou so espacos nao filtra (retorna todos, na ordem original)', () => {
  assert.deepEqual(ids(search(idx, '')), ['commit', 'revisao', 'migracao']);
  assert.deepEqual(ids(search(idx, '   ')), ['commit', 'revisao', 'migracao']);
});

test('acentos: "acao" acha "Ação"; "revisao" acha "Revisão"', () => {
  // busca por trecho: "acao" tambem esta em "Migração"; o titulo pesa mais, entao vem primeiro
  assert.deepEqual(ids(search(idx, 'acao')), ['migracao', 'revisao']);
  assert.ok(ids(search(idx, 'revisao')).includes('revisao'));
});

test('varias palavras exigem todas (AND)', () => {
  assert.deepEqual(ids(search(idx, 'commit marco')), ['migracao']);
  assert.deepEqual(ids(search(idx, 'commit xyz')), []);
});

test('titulo pesa mais que corpo', () => {
  const r = ids(search(idx, 'commit'));
  assert.equal(r[0], 'commit');
  assert.ok(r.includes('migracao'));
});

test('filtro por nivel e por tags (AND entre tags)', () => {
  assert.deepEqual(ids(search(idx, '', { tier: 'complexas' })), ['migracao']);
  assert.deepEqual(ids(search(idx, '', { tags: ['git'] })), ['commit', 'revisao']);
  assert.deepEqual(ids(search(idx, '', { tags: ['git', 'review'] })), ['revisao']);
  assert.deepEqual(ids(search(idx, 'commit', { tier: 'basicas', tags: ['git'] })), ['commit']);
});

test('caracteres especiais de regex nao quebram', () => {
  assert.deepEqual(ids(search(idx, '(.*[')), []);
});

test('collectTags: unicas, ordenadas, com contagem', () => {
  assert.deepEqual(collectTags(entries), [
    { tag: 'arquitetura', count: 1 }, { tag: 'git', count: 2 }, { tag: 'review', count: 1 },
  ]);
});
