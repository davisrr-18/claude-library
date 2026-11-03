import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { clearPieceCache } from '../services/content.js';
import { useInstallFiles } from './useInstallFiles.js';

afterEach(() => {
  vi.unstubAllGlobals();
  clearPieceCache();
});

const card = {
  pieces: [
    { type: 'agente', title: 'A', file: 'p/a.md', install: 'file' },
    { type: 'agente', title: 'B', file: 'p/b.md', install: 'file' },
    { type: 'skill', title: 'C', file: 'p/c.md' },
  ],
};
const arquivos = {
  'content/p/a.md': '---\ndestino: .claude/agents/a.md\n---\ncorpo a',
  'content/p/b.md': '---\ndestino: .claude/agents/b.md\n---\ncorpo b',
  'content/p/c.md': 'sem destino',
};
const stub = (falham = []) =>
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url) =>
      falham.includes(url)
        ? { ok: false, status: 500 }
        : { ok: true, status: 200, text: async () => arquivos[url] },
    ),
  );

test('junta os arquivos instaláveis na ordem do manifest e ignora peça sem destino', async () => {
  stub();
  const { result } = renderHook(() => useInstallFiles(card));
  await waitFor(() => expect(result.current.files).toHaveLength(2));
  expect(result.current.files.map((f) => f.path)).toEqual(['.claude/agents/a.md', '.claude/agents/b.md']);
  expect(result.current.failed).toBe(0);
});

test('conta as peças que falharam ao carregar', async () => {
  stub(['content/p/b.md']);
  const { result } = renderHook(() => useInstallFiles(card));
  await waitFor(() => expect(result.current.failed).toBe(1));
  expect(result.current.files).toHaveLength(1);
});
