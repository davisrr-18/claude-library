import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import Footer from './Footer.jsx';

test('é o rodapé da página e avisa do atalho de busca', () => {
  render(<Footer />);
  expect(screen.getByRole('contentinfo')).toHaveTextContent('tecle / para buscar');
});
