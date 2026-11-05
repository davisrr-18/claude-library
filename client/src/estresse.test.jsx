import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { clearPieceCache } from './services/content.js';
import { makeBigContent } from './test/bigContent.js';
import App from './App.jsx';

// Estresse: 300 cards e mais de 700 peças. Confere que a interface continua correta (não é um teste de velocidade).
const { manifest, files } = makeBigContent(100);

beforeEach(() => {
  window.scrollTo = vi.fn();
  window.history.replaceState(null, '', '#/');
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url) => {
      if (url.endsWith('manifest.json')) return { ok: true, status: 200, json: async () => manifest };
      const text = files.get(decodeURIComponent(url.replace(/^content\//, '')));
      return text === undefined
        ? { ok: false, status: 404 }
        : { ok: true, status: 200, text: async () => text };
    }),
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
  clearPieceCache();
});

const cards = () =>
  screen.queryAllByRole('link').filter((a) => /^#\/[a-z]+\/card-/.test(a.getAttribute('href') ?? ''));

test('a Home mostra os 300 cards, a busca no texto filtra e limpar volta aos 300', async () => {
  render(<App />);
  await waitFor(() => expect(cards()).toHaveLength(300), { timeout: 20000 });

  const box = screen.getByRole('searchbox');
  fireEvent.change(box, { target: { value: 'alpha' } });
  await waitFor(() => expect(cards().length).toBeGreaterThan(0), { timeout: 20000 });
  const alpha = cards().length;
  expect(alpha).toBeLessThanOrEqual(300);

  fireEvent.change(box, { target: { value: 'alpha beta gama' } });
  await waitFor(() => expect(cards().length).toBeLessThanOrEqual(alpha), { timeout: 20000 });

  fireEvent.keyDown(box, { key: 'Escape' });
  await waitFor(() => expect(cards()).toHaveLength(300), { timeout: 20000 });
}, 60000);

test('tags com maiúsculas diferentes (Git, git) aparecem uma só vez', async () => {
  render(<App />);
  await waitFor(() => expect(cards()).toHaveLength(300), { timeout: 20000 });
  const tags = within(screen.getByRole('group', { name: 'Filtrar por tag' }))
    .getAllByRole('button')
    .map((b) => b.textContent.replace(/\d+$/, '').toLowerCase());
  expect(new Set(tags).size).toBe(tags.length);
}, 60000);

test('o card do meio da lista abre, lista os 100 cards do nível na lateral e não repete ids', async () => {
  window.history.replaceState(null, '', '#/intermediarias/card-intermediarias-50');
  render(<App />);
  expect(
    await screen.findByRole('heading', { level: 1, name: /Card 50 de intermediarias/ }, { timeout: 20000 }),
  ).toBeInTheDocument();
  await waitFor(() => expect(screen.queryAllByRole('status', { name: 'Carregando' })).toHaveLength(0), {
    timeout: 20000,
  });
  const lateral = screen.getByRole('complementary', { name: 'Cards em Nível intermediarias' });
  expect(within(lateral).getAllByRole('link')).toHaveLength(100);
  expect(screen.queryAllByRole('alert')).toHaveLength(0);
  const ids = [...document.querySelectorAll('[id]')].map((e) => e.id);
  expect(ids.filter((v, i) => ids.indexOf(v) !== i)).toEqual([]);
}, 60000);

test('escolher cada aba de tipo nas três faixas mostra arquivos sem erro', async () => {
  render(<App />);
  await waitFor(() => expect(cards()).toHaveLength(300), { timeout: 20000 });
  for (const tab of screen.getAllByRole('tab')) {
    await act(async () => fireEvent.click(tab));
  }
  await waitFor(() => expect(screen.queryAllByRole('status', { name: 'Carregando' })).toHaveLength(0), {
    timeout: 30000,
  });
  expect(screen.queryAllByRole('alert')).toHaveLength(0);
}, 90000);
