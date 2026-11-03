import { fireEvent, render, screen } from '@testing-library/react';
import { useRef, useState } from 'react';
import { expect, test, vi } from 'vitest';
import { buildEntries } from '../../utils/entries.js';
import { buildIndex } from '../../utils/search.js';
import Home, { NO_FILTERS } from './Home.jsx';

const manifest = {
  tiers: [
    {
      id: 'basicas',
      title: 'Tarefas Básicas',
      cards: [{ id: 'g', title: 'Git Básico', summary: 'commits e branches', tags: ['git'], pieces: [] }],
    },
    {
      id: 'intermediarias',
      title: 'Tarefas Intermediárias',
      cards: [{ id: 'w', title: 'Desenvolvimento Web', summary: 'react e api', tags: ['web'], pieces: [] }],
    },
    { id: 'complexas', title: 'Tarefas Complexas', cards: [] },
  ],
};
const entries = buildEntries(manifest);
const library = { manifest, entries, index: buildIndex(entries), ensureBodies: vi.fn().mockResolvedValue() };

function Exemplo() {
  const [filters, setFilters] = useState(NO_FILTERS);
  const [tabs, setTabs] = useState({});
  const focusSearchRef = useRef(false);
  return (
    <Home
      library={library}
      filters={filters}
      onFilters={setFilters}
      tierTabs={tabs}
      onTierTab={(t, v) => setTabs({ ...tabs, [t]: v })}
      focusSearchRef={focusSearchRef}
    />
  );
}

test('sem filtro mostra uma faixa por nível, com os cards', () => {
  render(<Exemplo />);
  expect(screen.getAllByRole('region').length).toBeGreaterThanOrEqual(3);
  expect(screen.getByRole('link', { name: 'Git Básico' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Desenvolvimento Web' })).toBeInTheDocument();
  expect(screen.getByText('Nenhum card neste nível ainda.')).toBeInTheDocument();
});

test('buscar filtra os cards, anuncia o total e some com os níveis sem resultado', () => {
  render(<Exemplo />);
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'react' } });
  expect(screen.queryByRole('link', { name: 'Git Básico' })).toBeNull();
  expect(screen.getByRole('link', { name: 'Desenvolvimento Web' })).toBeInTheDocument();
  expect(screen.getByText('1 card encontrado.')).toBeInTheDocument();
  expect(screen.queryByText('Nenhum card neste nível ainda.')).toBeNull();
  expect(library.ensureBodies).toHaveBeenCalled();
});

test('busca sem resultado mostra "Nada encontrado" e Limpar filtros volta tudo', () => {
  render(<Exemplo />);
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zzzzzz' } });
  expect(screen.getByRole('heading', { name: 'Nada encontrado' })).toBeInTheDocument();
  fireEvent.click(screen.getAllByRole('button', { name: 'Limpar filtros' }).at(-1));
  expect(screen.getByRole('link', { name: 'Git Básico' })).toBeInTheDocument();
  expect(screen.getByRole('searchbox')).toHaveValue('');
  expect(document.activeElement).toBe(screen.getByRole('searchbox'));
});

test('Esc na busca limpa os filtros', () => {
  render(<Exemplo />);
  const box = screen.getByRole('searchbox');
  fireEvent.change(box, { target: { value: 'react' } });
  fireEvent.keyDown(box, { key: 'Escape' });
  expect(box).toHaveValue('');
  expect(screen.getByRole('link', { name: 'Git Básico' })).toBeInTheDocument();
});

test('filtrar por nível mostra só aquela faixa, mesmo vazia', () => {
  render(<Exemplo />);
  fireEvent.click(screen.getByRole('button', { name: 'Tarefas Complexas' }));
  expect(screen.queryByRole('link', { name: 'Git Básico' })).toBeNull();
  expect(screen.getByText('Nenhum card neste nível ainda.')).toBeInTheDocument();
});

test('filtrar por tag mostra só os cards da tag e alterna', () => {
  render(<Exemplo />);
  const tag = screen.getByRole('button', { name: '#git, 1 card' });
  fireEvent.click(tag);
  expect(tag).toHaveAttribute('aria-pressed', 'true');
  expect(screen.queryByRole('link', { name: 'Desenvolvimento Web' })).toBeNull();
  fireEvent.click(tag);
  expect(screen.getByRole('link', { name: 'Desenvolvimento Web' })).toBeInTheDocument();
});
