import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ICON_NAMES, TYPE_ICON } from '../js/icons.js';
import { CARD_ICONS, PIECE_TYPES } from '../js/content.js';

test('todo icone de card existe em icons.js', () => {
  for (const name of CARD_ICONS) assert.ok(ICON_NAMES.includes(name), `falta o icone "${name}"`);
});

test('todo tipo de peca tem icone, e ele existe', () => {
  for (const type of PIECE_TYPES) {
    assert.ok(TYPE_ICON[type], `tipo sem icone: ${type}`);
    assert.ok(ICON_NAMES.includes(TYPE_ICON[type]), `icone inexistente para ${type}: ${TYPE_ICON[type]}`);
  }
});

test('icones usados pela interface existem', () => {
  for (const name of ['search', 'copy', 'check', 'x', 'arrow-left', 'arrow-right', 'sun', 'moon', 'folder']) {
    assert.ok(ICON_NAMES.includes(name), name);
  }
});
