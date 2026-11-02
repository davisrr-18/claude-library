import { test } from 'node:test';
import assert from 'node:assert/strict';
import { typeCounts, filterByType, nextTabIndex, resolveTypeTab, TYPE_TAB_LABELS } from '../js/tabs.js';
import { PIECE_TYPES } from '../js/content.js';

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

test('TYPE_TAB_LABELS: todo tipo de peca tem rotulo de aba (tipo novo sem rotulo faria aba vazia)', () => {
  for (const type of PIECE_TYPES) assert.ok(TYPE_TAB_LABELS[type], `falta rotulo para ${type}`);
  assert.deepEqual(Object.keys(TYPE_TAB_LABELS).sort(), [...PIECE_TYPES].sort());
});

test('resolveTypeTab: guardado valido fica; ausente ou inexistente volta para Todos (\'\')', () => {
  const available = [{ type: 'skill', count: 1 }, { type: 'agente', count: 2 }];
  assert.equal(resolveTypeTab('agente', available), 'agente');
  assert.equal(resolveTypeTab('prompt', available), '');
  assert.equal(resolveTypeTab(undefined, available), '');
  assert.equal(resolveTypeTab('', available), '');
  assert.equal(resolveTypeTab('skill', []), '');
});

test('nextTabIndex: indice atual invalido (nao inteiro) nunca devolve NaN', () => {
  for (const cur of [NaN, null, undefined, '1', 1.5, -1, Infinity]) {
    for (const key of ['ArrowRight', 'ArrowLeft', 'Home', 'End']) {
      const r = nextTabIndex(key, cur, 3);
      assert.ok(r === null || (Number.isInteger(r) && r >= 0 && r < 3), `${key}/${String(cur)} -> ${r}`);
    }
  }
});
