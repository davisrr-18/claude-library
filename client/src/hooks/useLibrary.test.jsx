import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { clearPieceCache } from '../services/content.js';
import { useLibrary } from './useLibrary.js';

const manifest = {
  tiers: [
    {
      id: 'basicas',
      title: 'B',
      cards: [{ id: 'a', title: 'Alfa', pieces: [{ type: 'prompt', title: 'P', file: 'basicas/a/p.md' }] }],
    },
    { id: 'intermediarias', title: 'I', cards: [] },
    { id: 'complexas', title: 'C', cards: [] },
  ],
};

const resposta = (body, kind) => ({ ok: true, status: 200, [kind]: async () => body });
const fetchCom = (pecas) =>
  vi.fn(async (url) => {
    if (url.endsWith('manifest.json')) return resposta(manifest, 'json');
    const r = pecas[url];
    return r instanceof Error ? { ok: false, status: 500 } : resposta(r, 'text');
  });

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  clearPieceCache();
});

test('carrega o manifest e cria as entradas', async () => {
  vi.stubGlobal('fetch', fetchCom({}));
  const { result } = renderHook(() => useLibrary());
  expect(result.current.status).toBe('loading');
  await waitFor(() => expect(result.current.status).toBe('ready'));
  expect(result.current.entries.map((e) => e.card)).toEqual(['a']);
});

test('manifest que falha vira erro com a mensagem', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
  const { result } = renderHook(() => useLibrary());
  await waitFor(() => expect(result.current.status).toBe('error'));
  expect(result.current.error.message).toBe('HTTP 404');
});

test('ensureBodies põe o texto das peças nas entradas (sem o front matter)', async () => {
  vi.stubGlobal('fetch', fetchCom({ 'content/basicas/a/p.md': '---\ntitulo: x\n---\ncorpo secreto' }));
  const { result } = renderHook(() => useLibrary());
  await waitFor(() => expect(result.current.status).toBe('ready'));
  await act(() => result.current.ensureBodies());
  expect(result.current.entries[0].text).toBe('corpo secreto');
});

test('se uma peça falha, tenta de novo só depois de 5 s', async () => {
  const f = fetchCom({ 'content/basicas/a/p.md': new Error('x') });
  vi.stubGlobal('fetch', f);
  const { result } = renderHook(() => useLibrary());
  await waitFor(() => expect(result.current.status).toBe('ready'));
  vi.useFakeTimers();
  await act(() => result.current.ensureBodies());
  const chamadas = f.mock.calls.length;
  await act(() => result.current.ensureBodies()); // dentro dos 5 s: não busca
  expect(f.mock.calls.length).toBe(chamadas);
  vi.advanceTimersByTime(5001);
  await act(() => result.current.ensureBodies());
  expect(f.mock.calls.length).toBeGreaterThan(chamadas);
});
