import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import App from './App.jsx';

test('mostra o título da página como h1 dentro do main', () => {
  render(<App />);
  const main = screen.getByRole('main');
  expect(main.contains(screen.getByRole('heading', { level: 1, name: 'Claude Library' }))).toBe(true);
});

test('tem link para pular direto ao conteúdo', () => {
  render(<App />);
  expect(screen.getByRole('link', { name: 'Pular para o conteúdo' }).getAttribute('href')).toBe('#main');
});
