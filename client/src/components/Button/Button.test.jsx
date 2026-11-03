import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import Button from './Button.jsx';

test('sem href é um button de tipo button (não envia formulário)', () => {
  render(<Button>Ok</Button>);
  expect(screen.getByRole('button', { name: 'Ok' })).toHaveAttribute('type', 'button');
});

test('com href é um link', () => {
  render(<Button href="#/">Voltar</Button>);
  expect(screen.getByRole('link', { name: 'Voltar' })).toHaveAttribute('href', '#/');
});
