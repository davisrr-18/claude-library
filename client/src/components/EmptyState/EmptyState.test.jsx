import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import EmptyState from './EmptyState.jsx';

test('título no nível pedido, texto e ação', () => {
  render(
    <EmptyState title="Nada" headingLevel={1} action={<button type="button">Voltar</button>}>
      Sem resultados.
    </EmptyState>,
  );
  expect(screen.getByRole('heading', { level: 1, name: 'Nada' })).toBeInTheDocument();
  expect(screen.getByText('Sem resultados.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Voltar' })).toBeInTheDocument();
});

test('o nível padrão do título é 2', () => {
  render(<EmptyState title="Vazio">x</EmptyState>);
  expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
});
