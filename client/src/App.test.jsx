import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { clearPieceCache } from './services/content.js';
import App from './App.jsx';

const manifest = {
  tiers: [
    {
      id: 'basicas',
      title: 'Tarefas Básicas',
      cards: [
        {
          id: 'g',
          title: 'Git Básico',
          summary: 'commits',
          tags: [],
          pieces: [
            { type: 'prompt', title: 'P', file: 'g/p.md' },
            { type: 'skill', title: 'S', file: 'g/s.md' },
          ],
        },
      ],
    },
    { id: 'intermediarias', title: 'Tarefas Intermediárias', cards: [] },
    { id: 'complexas', title: 'Tarefas Complexas', cards: [] },
  ],
};

const stubFetch = (manifestResponse = { ok: true, status: 200, json: async () => manifest }) =>
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url) =>
      url.endsWith('manifest.json')
        ? manifestResponse
        : { ok: true, status: 200, text: async () => 'texto do prompt' },
    ),
  );

const go = (hash) =>
  act(() => {
    window.location.hash = hash;
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });

beforeEach(() => {
  window.scrollTo = vi.fn();
  window.history.replaceState(null, '', '#/');
});
afterEach(() => {
  vi.unstubAllGlobals();
  clearPieceCache();
  document.title = '';
});

test('tem link para pular direto ao conteúdo', () => {
  stubFetch();
  render(<App />);
  expect(screen.getByRole('link', { name: 'Pular para o conteúdo' })).toHaveAttribute('href', '#main');
});

test('mostra o carregando e depois a Home com o card do manifest', async () => {
  stubFetch();
  render(<App />);
  expect(screen.getByRole('status', { name: 'Carregando' })).toBeInTheDocument();
  expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Seu Claude Code, organizado');
  expect(screen.getByRole('link', { name: 'Git Básico' })).toBeInTheDocument();
  expect(screen.getByRole('main')).toBeInTheDocument();
});

test('manifest que falha vira alerta', async () => {
  stubFetch({ ok: false, status: 500 });
  render(<App />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Manifest inválido ou indisponível: HTTP 500');
});

test('a rota do card mostra o card, foca o h1 e atualiza o título da aba', async () => {
  stubFetch();
  window.history.replaceState(null, '', '#/basicas/g');
  render(<App />);
  const h1 = await screen.findByRole('heading', { level: 1, name: 'Git Básico' });
  await waitFor(() => expect(document.activeElement).toBe(h1));
  expect(document.title).toBe('Git Básico · Claude Library');
  expect(screen.getByRole('link', { name: 'Tarefas Básicas', current: 'page' })).toBeInTheDocument();
});

test('navegar pelo hash troca a página e volta ao topo', async () => {
  stubFetch();
  render(<App />);
  await screen.findByRole('link', { name: 'Git Básico' });
  go('#/basicas');
  expect(await screen.findByRole('heading', { level: 1, name: 'Tarefas Básicas' })).toBeInTheDocument();
  expect(window.scrollTo).toHaveBeenCalled();
});

test('rota que não existe mostra a página não encontrada', async () => {
  stubFetch();
  window.history.replaceState(null, '', '#/nao-existe');
  render(<App />);
  expect(await screen.findByRole('heading', { level: 1, name: 'Página não encontrada' })).toBeInTheDocument();
  expect(document.title).toBe('Página não encontrada · Claude Library');
});

test('a tecla "/" foca a busca na Home', async () => {
  stubFetch();
  render(<App />);
  const box = await screen.findByRole('searchbox');
  fireEvent.keyDown(document.body, { key: '/' });
  expect(document.activeElement).toBe(box);
});

test('a tecla "/" fora da Home vai para a Home e foca a busca', async () => {
  stubFetch();
  window.history.replaceState(null, '', '#/basicas');
  render(<App />);
  await screen.findByRole('heading', { level: 1, name: 'Tarefas Básicas' });
  fireEvent.keyDown(document.body, { key: '/' });
  go(window.location.hash); // jsdom já mudou o hash; só entrega o evento
  const box = await screen.findByRole('searchbox', {}, { timeout: 4000 });
  await waitFor(() => expect(document.activeElement).toBe(box));
});

test('"/" digitada em um campo de texto não é roubada', async () => {
  stubFetch();
  render(<App />);
  const box = await screen.findByRole('searchbox');
  box.blur();
  fireEvent.keyDown(box, { key: '/' });
  expect(document.activeElement).not.toBe(box);
});

test('os filtros ficam guardados ao ir para um card e voltar à Home', async () => {
  stubFetch();
  render(<App />);
  fireEvent.change(await screen.findByRole('searchbox'), { target: { value: 'git' } });
  go('#/basicas/g');
  await screen.findByRole('heading', { level: 1, name: 'Git Básico' });
  go('#/');
  expect(await screen.findByRole('searchbox')).toHaveValue('git');
});

test('trocar de peça no mesmo card leva o foco para a aba ativa (e não para o h1)', async () => {
  stubFetch();
  window.history.replaceState(null, '', '#/basicas/g/prompt');
  render(<App />);
  await screen.findByRole('heading', { level: 1, name: 'Git Básico' });
  go('#/basicas/g/skill');
  const aba = await screen.findByRole('link', { name: /Skill/, current: 'page' });
  await waitFor(() => expect(document.activeElement).toBe(aba));
});
