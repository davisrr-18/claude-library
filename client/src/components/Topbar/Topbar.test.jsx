import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import Topbar from './Topbar.jsx';

const tiers = [
  { id: 'basicas', title: 'Tarefas Básicas' },
  { id: 'intermediarias', title: 'Tarefas Intermediárias' },
];

afterEach(() => {
  delete document.documentElement.dataset.theme;
});

test('o nível ativo tem aria-current e os links apontam para a rota do nível', () => {
  render(<Topbar tiers={tiers} activeTier="intermediarias" />);
  const nav = screen.getByRole('navigation', { name: 'Níveis' });
  expect(nav).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Tarefas Intermediárias' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  expect(screen.getByRole('link', { name: 'Tarefas Básicas' })).not.toHaveAttribute('aria-current');
  expect(screen.getByRole('link', { name: 'Tarefas Básicas' })).toHaveAttribute('href', '#/basicas');
});

test('a marca é um link para a Home com nome acessível', () => {
  render(<Topbar tiers={tiers} activeTier={null} />);
  expect(screen.getByRole('link', { name: 'Claude Library, início' })).toHaveAttribute('href', '#/');
});

test('o botão de tema alterna e guarda a escolha', () => {
  document.documentElement.dataset.theme = 'light';
  render(<Topbar tiers={tiers} activeTier={null} />);
  fireEvent.click(screen.getByRole('button', { name: 'Mudar para o tema escuro' }));
  expect(document.documentElement.dataset.theme).toBe('dark');
  expect(screen.getByRole('button', { name: 'Mudar para o tema claro' })).toBeInTheDocument();
});
