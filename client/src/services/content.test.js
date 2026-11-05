import { afterEach, expect, test, vi } from 'vitest';
import { loadManifest, loadPiece, clearPieceCache } from './content.js';

const ok = (body, kind = 'text') => ({ ok: true, status: 200, [kind]: async () => body });
const falha = (status) => ({ ok: false, status });
const manifestValido = {
  tiers: ['basicas', 'intermediarias', 'complexas'].map((id) => ({ id, title: id, cards: [] })),
};

afterEach(() => {
  vi.unstubAllGlobals();
  clearPieceCache();
});

test('loadManifest devolve o manifest validado', async () => {
  const fetchMock = vi.fn().mockResolvedValue(ok(manifestValido, 'json'));
  vi.stubGlobal('fetch', fetchMock);
  expect(await loadManifest()).toEqual(manifestValido);
  expect(fetchMock).toHaveBeenCalledWith('content/manifest.json', { cache: 'no-cache' });
});

test('loadManifest falha com o status quando o HTTP não é ok', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(falha(404)));
  await expect(loadManifest()).rejects.toThrow('HTTP 404');
});

test('loadManifest recusa manifest inválido e lista os erros', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok({ tiers: [] }, 'json')));
  await expect(loadManifest()).rejects.toThrow(/falta o nível: basicas/);
});

test('loadPiece codifica cada segmento do caminho e devolve o texto', async () => {
  const fetchMock = vi.fn().mockResolvedValue(ok('# oi'));
  vi.stubGlobal('fetch', fetchMock);
  expect(await loadPiece('intermediarias/pacote x/a#b.md')).toBe('# oi');
  expect(fetchMock).toHaveBeenCalledWith('content/intermediarias/pacote%20x/a%23b.md', { cache: 'no-cache' });
});

test('loadPiece guarda em cache: a mesma peça só é buscada uma vez, mesmo em chamadas simultâneas', async () => {
  const fetchMock = vi.fn().mockResolvedValue(ok('texto'));
  vi.stubGlobal('fetch', fetchMock);
  await Promise.all([loadPiece('a/b.md'), loadPiece('a/b.md')]);
  await loadPiece('a/b.md');
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

test('loadPiece não guarda a falha: a próxima chamada tenta de novo', async () => {
  const fetchMock = vi.fn().mockResolvedValueOnce(falha(500)).mockResolvedValueOnce(ok('agora foi'));
  vi.stubGlobal('fetch', fetchMock);
  await expect(loadPiece('a/b.md')).rejects.toThrow('HTTP 500');
  expect(await loadPiece('a/b.md')).toBe('agora foi');
});
