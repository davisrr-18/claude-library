import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { clearPieceCache } from './services/content.js';
import App from './App.jsx';

// Integração com o conteúdo REAL do repositório: toda rota de card e de tipo de peça renderiza sem aviso de erro.
const CONTENT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'content');
const manifest = JSON.parse(readFileSync(join(CONTENT, 'manifest.json'), 'utf8'));

beforeEach(() => {
  window.scrollTo = vi.fn();
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url) => {
      const rel = decodeURIComponent(url.replace(/^content\//, ''));
      const text = readFileSync(join(CONTENT, rel), 'utf8');
      return { ok: true, status: 200, json: async () => JSON.parse(text), text: async () => text };
    }),
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
  clearPieceCache();
});

const routes = manifest.tiers.flatMap((t) =>
  t.cards.flatMap((c) => [
    `#/${t.id}/${c.id}`,
    ...[...new Set(c.pieces.map((p) => p.type))].map((type) => `#/${t.id}/${c.id}/${type}`),
  ]),
);

test('há conteúdo real para testar', () => {
  expect(routes.length).toBeGreaterThan(3);
});

test('a Home mostra todos os cards do manifest', async () => {
  window.history.replaceState(null, '', '#/');
  render(<App />);
  for (const t of manifest.tiers)
    for (const c of t.cards) expect(await screen.findByRole('link', { name: c.title })).toBeInTheDocument();
});

test.each(routes)('rota %s renderiza o card e as peças sem erro', async (route) => {
  window.history.replaceState(null, '', route);
  const [, tierId, cardId] = route.split('/');
  const card = manifest.tiers.find((t) => t.id === tierId).cards.find((c) => c.id === cardId);
  render(<App />);
  expect(await screen.findByRole('heading', { level: 1, name: card.title })).toBeInTheDocument();
  // espera as peças do tipo ativo terminarem de carregar
  await waitFor(() => expect(screen.queryAllByRole('status', { name: 'Carregando' })).toHaveLength(0), {
    timeout: 4000,
  });
  expect(screen.queryAllByRole('alert')).toHaveLength(0);
  expect(screen.getAllByRole('heading', { level: 2 }).length).toBeGreaterThan(0);
});
