// @vitest-environment node
import { expect, test } from 'vitest';
import { buildEntries } from './entries.js';

const manifest = {
  tiers: [
    { id: 'basicas', title: 'B', cards: [] },
    {
      id: 'intermediarias',
      title: 'I',
      cards: [
        { id: 'a', title: 'A', summary: 'resumo', tags: ['x'], pieces: [] },
        { id: 'b', title: 'B2', pieces: [] },
      ],
    },
  ],
};

test('buildEntries cria uma entrada por card, na ordem do manifest, com padrões para campos opcionais', () => {
  const entries = buildEntries(manifest);
  expect(entries.map((e) => `${e.tier}/${e.card}`)).toEqual(['intermediarias/a', 'intermediarias/b']);
  expect(entries[0]).toMatchObject({ title: 'A', summary: 'resumo', tags: ['x'], text: '' });
  expect(entries[1]).toMatchObject({ summary: '', tags: [], text: '' });
  expect(entries[0].tierObj).toBe(manifest.tiers[1]);
  expect(entries[0].cardObj).toBe(manifest.tiers[1].cards[0]);
});
