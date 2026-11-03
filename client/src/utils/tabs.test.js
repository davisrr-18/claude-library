// @vitest-environment node
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { typeCounts, nextTabIndex, resolveTypeTab, TYPE_TAB_LABELS, groupPiecesByType } from './tabs.js';
import { PIECE_TYPES } from './content.js';

const entry = (id, ...types) => ({ id, cardObj: { pieces: types.map((type) => ({ type })) } });
const entries = [
  entry('a', 'skill', 'agente'),
  entry('b', 'agente', 'workflow'),
  entry('c', 'prompt'),
  entry('d'),
];

test('typeCounts: so tipos presentes, na ordem canonica, contando arquivos (pecas)', () => {
  assert.deepEqual(typeCounts(entries), [
    { type: 'skill', count: 1 },
    { type: 'agente', count: 2 },
    { type: 'workflow', count: 1 },
    { type: 'prompt', count: 1 },
  ]);
});

test('typeCounts: card com dois arquivos do mesmo tipo conta os dois; lista vazia', () => {
  assert.deepEqual(typeCounts([entry('x', 'skill', 'skill')]), [{ type: 'skill', count: 2 }]);
  assert.deepEqual(typeCounts([]), []);
});

test('typeCounts: ordem canonica independe da ordem das pecas', () => {
  const got = typeCounts([entry('x', 'prompt', 'claude-md', 'arquitetura', 'skill')]).map((c) => c.type);
  assert.deepEqual(got, ['skill', 'claude-md', 'arquitetura', 'prompt']);
});

test('nextTabIndex: setas dao a volta; Home e End; outras teclas ignoradas', () => {
  assert.equal(nextTabIndex('ArrowRight', 0, 4), 1);
  assert.equal(nextTabIndex('ArrowRight', 3, 4), 0);
  assert.equal(nextTabIndex('ArrowLeft', 0, 4), 3);
  assert.equal(nextTabIndex('ArrowLeft', 2, 4), 1);
  assert.equal(nextTabIndex('Home', 2, 4), 0);
  assert.equal(nextTabIndex('End', 1, 4), 3);
  for (const key of ['Enter', ' ', 'Tab', 'a', 'ArrowUp', 'ArrowDown'])
    assert.equal(nextTabIndex(key, 1, 4), null, key);
});

test('nextTabIndex: uma unica aba e lista vazia', () => {
  assert.equal(nextTabIndex('ArrowRight', 0, 1), 0);
  assert.equal(nextTabIndex('ArrowRight', 0, 0), null);
});

test('TYPE_TAB_LABELS: todo tipo de peca tem rotulo de aba (tipo novo sem rotulo faria aba vazia)', () => {
  for (const type of PIECE_TYPES) assert.ok(TYPE_TAB_LABELS[type], `falta rotulo para ${type}`);
  assert.deepEqual(Object.keys(TYPE_TAB_LABELS).sort(), [...PIECE_TYPES].sort());
});

test("resolveTypeTab: guardado valido fica; ausente ou inexistente volta para Todos ('')", () => {
  const available = [
    { type: 'skill', count: 1 },
    { type: 'agente', count: 2 },
  ];
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

test('groupPiecesByType: agrupa por tipo, ordem canonica, mantem a ordem das pecas dentro do tipo', () => {
  const pieces = [
    { type: 'prompt', title: 'P', file: 'p.md' },
    { type: 'agente', title: 'A1', file: 'a1.md' },
    { type: 'skill', title: 'S1', file: 's1.md' },
    { type: 'agente', title: 'A2', file: 'a2.md' },
    { type: 'agente', title: 'A3', file: 'a3.md' },
    { type: 'skill', title: 'S2', file: 's2.md' },
  ];
  const groups = groupPiecesByType(pieces);
  assert.deepEqual(
    groups.map((g) => g.type),
    ['skill', 'agente', 'prompt'],
  );
  assert.deepEqual(
    groups[0].pieces.map((p) => p.title),
    ['S1', 'S2'],
  );
  assert.deepEqual(
    groups[1].pieces.map((p) => p.title),
    ['A1', 'A2', 'A3'],
  );
  assert.deepEqual(
    groups[2].pieces.map((p) => p.title),
    ['P'],
  );
});

test('groupPiecesByType: vazio, e tipo desconhecido e ignorado', () => {
  assert.deepEqual(groupPiecesByType([]), []);
  assert.deepEqual(groupPiecesByType(undefined), []);
  assert.deepEqual(groupPiecesByType([{ type: 'nada', title: 'x', file: 'x.md' }]), []);
});
