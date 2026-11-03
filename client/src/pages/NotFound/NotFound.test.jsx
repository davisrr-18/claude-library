import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import NotFound from './NotFound.jsx';

test('é o h1 da página e oferece voltar ao início', () => {
  render(<NotFound />);
  expect(screen.getByRole('heading', { level: 1, name: 'Página não encontrada' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Voltar ao início' })).toHaveAttribute('href', '#/');
});
