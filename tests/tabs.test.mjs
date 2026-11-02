import { test } from 'node:test';
import assert from 'node:assert/strict';
import { typeCounts, filterByType, nextTabIndex } from '../js/tabs.js';

const entry = (id, ...types) => ({ id, cardObj: { pieces: types.map((type) => ({ type })) } });
const entries = [
  entry('a', 'skill', 'agente'),
  entry('b', 'agente', 'workflow'),
  entry('c', 'prompt'),
  entry('d'),
];

test('typeCounts: so tipos presentes, na ordem canonica, contando cards', () => {
  assert.deepEqual(typeCounts(entries), [
    { type: 'skill', count: 1 },
    { type: 'agente', count: 2 },
    { type: 'workflow', count: 1 },
    { type: 'prompt', count: 1 },
  ]);
});

test('typeCounts: card com dois tipos iguais conta uma vez; lista vazia', () => {
  assert.deepEqual(typeCounts([entry('x', 'skill', 'skill')]), [{ type: 'skill', count: 1 }]);
  assert.deepEqual(typeCounts([]), []);
});

test('typeCounts: ordem canonica independe da ordem das pecas', () => {
  const got = typeCounts([entry('x', 'prompt', 'claude-md', 'arquitetura', 'skill')]).map((c) => c.type);
  assert.deepEqual(got, ['skill', 'claude-md', 'arquitetura', 'prompt']);
});

test('filterByType: vazio devolve todos; tipo devolve so quem tem a peca', () => {
  assert.equal(filterByType(entries, '').length, 4);
  assert.deepEqual(filterByType(entries, 'agente').map((e) => e.id), ['a', 'b']);
  assert.deepEqual(filterByType(entries, 'prompt').map((e) => e.id), ['c']);
  assert.deepEqual(filterByType(entries, 'skill').map((e) => e.id), ['a']);
  assert.deepEqual(filterByType(entries, 'arquitetura'), []);
});

test('nextTabIndex: setas dao a volta; Home e End; outras teclas ignoradas', () => {
  assert.equal(nextTabIndex('ArrowRight', 0, 4), 1);
  assert.equal(nextTabIndex('ArrowRight', 3, 4), 0);
  assert.equal(nextTabIndex('ArrowLeft', 0, 4), 3);
  assert.equal(nextTabIndex('ArrowLeft', 2, 4), 1);
  assert.equal(nextTabIndex('Home', 2, 4), 0);
  assert.equal(nextTabIndex('End', 1, 4), 3);
  for (const key of ['Enter', ' ', 'Tab', 'a', 'ArrowUp', 'ArrowDown']) assert.equal(nextTabIndex(key, 1, 4), null, key);
});

test('nextTabIndex: uma unica aba e lista vazia', () => {
  assert.equal(nextTabIndex('ArrowRight', 0, 1), 0);
  assert.equal(nextTabIndex('ArrowRight', 0, 0), null);
});
