// @vitest-environment node
import { expect, test } from 'vitest';
import { TYPE_LABELS, TYPE_PLURAL, cardHref, pieceHref, plural, tierHref, tierLevel } from './format.js';
import { PIECE_TYPES } from './content.js';

test('todo tipo de peça tem rótulo e plural', () => {
  for (const t of PIECE_TYPES) {
    expect(TYPE_LABELS[t], t).toBeTruthy();
    expect(TYPE_PLURAL[t], t).toHaveLength(2);
  }
});

test('plural escolhe singular só para 1 (inclusive 0 e 2)', () => {
  expect(plural(1, ['card', 'cards'])).toBe('1 card');
  expect(plural(0, ['card', 'cards'])).toBe('0 cards');
  expect(plural(2, ['card', 'cards'])).toBe('2 cards');
});

test('links de rota codificam cada segmento', () => {
  expect(tierHref('basicas')).toBe('#/basicas');
  expect(cardHref('basicas', 'a b')).toBe('#/basicas/a%20b');
  expect(pieceHref('basicas', 'c', 'claude-md')).toBe('#/basicas/c/claude-md');
});

test('tierLevel é a posição do nível começando em 1', () => {
  expect(tierLevel('basicas')).toBe(1);
  expect(tierLevel('complexas')).toBe(3);
});
