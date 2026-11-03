import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import CodeBlock from './CodeBlock.jsx';

test('região rolável focável com nome e botão Copiar próprio', () => {
  render(<CodeBlock code="echo oi" label="Comandos de instalação" />);
  const pre = screen.getByRole('region', { name: 'Comandos de instalação' });
  expect(pre).toHaveAttribute('tabindex', '0');
  expect(pre).toHaveTextContent('echo oi');
  expect(screen.getByRole('button', { name: 'Copiar comandos de instalação' })).toBeInTheDocument();
});
