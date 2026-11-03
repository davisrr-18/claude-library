import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { clearPieceCache } from '../../services/content.js';
import PieceView from './PieceView.jsx';

afterEach(() => {
  vi.unstubAllGlobals();
  clearPieceCache();
});

const piece = { type: 'agente', title: 'Tutor', file: 'a/tutor.md' };
const resposta = (text) => ({ ok: true, status: 200, text: async () => text });

test('mostra o carregando e depois título, descrição, nome e texto', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(
        resposta('---\nname: tutor-x\ndescription: Ajuda a estudar\n---\n# Tutor\n\nTexto do agente'),
      ),
  );
  render(<PieceView piece={piece} headingLevel={3} />);
  expect(screen.getByRole('status', { name: 'Carregando' })).toBeInTheDocument();
  await waitFor(() => expect(screen.getByRole('heading', { level: 3, name: 'Tutor' })).toBeInTheDocument());
  expect(screen.getByText('Ajuda a estudar')).toBeInTheDocument();
  expect(screen.getByText('tutor-x')).toBeInTheDocument();
  expect(screen.getByText('Texto do agente')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Copiar peça: Tutor' })).toBeInTheDocument();
});

test('peça com destino mostra a instalação pelo terminal', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(resposta('---\ndestino: .claude/agents/tutor.md\n---\ncorpo')),
  );
  render(<PieceView piece={{ ...piece, install: 'file' }} />);
  await waitFor(() =>
    expect(screen.getByText(/Salvar ".claude\/agents\/tutor.md" pelo terminal/)).toBeInTheDocument(),
  );
});

test('falha vira aviso de erro só nesta peça', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
  render(<PieceView piece={piece} />);
  await waitFor(() =>
    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar "a/tutor.md": HTTP 404'),
  );
});
