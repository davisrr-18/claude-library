import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import Pager from './Pager.jsx';

const tier = { id: 'basicas' };

test('mostra anterior e próximo com links para os cards', () => {
  render(<Pager tier={tier} prev={{ id: 'a', title: 'Alfa' }} next={{ id: 'c', title: 'Gama' }} />);
  expect(screen.getByRole('link', { name: /Anterior\s*Alfa/ })).toHaveAttribute('href', '#/basicas/a');
  expect(screen.getByRole('link', { name: /Próximo\s*Gama/ })).toHaveAttribute('href', '#/basicas/c');
});

test('sem anterior, só o próximo (e vice-versa)', () => {
  const { rerender } = render(<Pager tier={tier} next={{ id: 'c', title: 'Gama' }} />);
  expect(screen.queryByRole('link', { name: /Anterior/ })).toBeNull();
  rerender(<Pager tier={tier} prev={{ id: 'a', title: 'Alfa' }} />);
  expect(screen.queryByRole('link', { name: /Próximo/ })).toBeNull();
});
