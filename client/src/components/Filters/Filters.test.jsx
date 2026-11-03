import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import Filters from './Filters.jsx';

const tiers = [
  { id: 'basicas', title: 'Tarefas Básicas' },
  { id: 'complexas', title: 'Tarefas Complexas' },
];
const tags = [
  { tag: 'git', count: 1 },
  { tag: 'web', count: 3 },
];

const montar = (props = {}) =>
  render(
    <Filters
      tiers={tiers}
      tags={tags}
      filters={{ q: '', tier: '', tags: new Set() }}
      active={false}
      onTier={() => {}}
      onTag={() => {}}
      onClear={() => {}}
      {...props}
    />,
  );

test('níveis são botões alternáveis e "Todos" começa marcado', () => {
  montar();
  expect(screen.getByRole('button', { name: 'Todos' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: 'Tarefas Básicas' })).toHaveAttribute('aria-pressed', 'false');
});

test('escolher nível e tag chama os callbacks', () => {
  const onTier = vi.fn();
  const onTag = vi.fn();
  montar({ onTier, onTag });
  fireEvent.click(screen.getByRole('button', { name: 'Tarefas Complexas' }));
  expect(onTier).toHaveBeenCalledWith('complexas');
  fireEvent.click(screen.getByRole('button', { name: '#web, 3 cards' }));
  expect(onTag).toHaveBeenCalledWith('web');
});

test('tag escolhida fica marcada; "1 card" no singular', () => {
  montar({ filters: { q: '', tier: '', tags: new Set(['git']) } });
  expect(screen.getByRole('button', { name: '#git, 1 card' })).toHaveAttribute('aria-pressed', 'true');
});

test('"Limpar filtros" só aparece com filtro ativo', () => {
  const { rerender } = montar();
  expect(screen.queryByRole('button', { name: 'Limpar filtros' })).toBeNull();
  const onClear = vi.fn();
  rerender(
    <Filters
      tiers={tiers}
      tags={tags}
      filters={{ q: 'x', tier: '', tags: new Set() }}
      active
      onTier={() => {}}
      onTag={() => {}}
      onClear={onClear}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));
  expect(onClear).toHaveBeenCalled();
});

test('sem tags não mostra a barra de tags', () => {
  montar({ tags: [] });
  expect(screen.queryByRole('group', { name: 'Filtrar por tag' })).toBeNull();
});
