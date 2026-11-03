import { render, screen, within } from '@testing-library/react';
import { expect, test } from 'vitest';
import Crumbs from './Crumbs.jsx';

test('mostra links e o item atual sem link', () => {
  render(
    <Crumbs
      items={[{ label: 'Início', href: '#/' }, { label: 'Nível', href: '#/basicas' }, { label: 'Card' }]}
    />,
  );
  const nav = screen.getByRole('navigation', { name: 'Você está em' });
  expect(
    within(nav)
      .getAllByRole('link')
      .map((a) => a.textContent),
  ).toEqual(['Início', 'Nível']);
  expect(within(nav).getByText('Card').tagName).toBe('SPAN');
});
