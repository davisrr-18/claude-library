import { render, screen, within } from '@testing-library/react';
import { expect, test } from 'vitest';
import CardAside from './CardAside.jsx';

const tier = { id: 'basicas', title: 'Tarefas Básicas' };
const cards = [
  { id: 'a', title: 'Alfa' },
  { id: 'b', title: 'Beta' },
];

test('lista os cards do nível e marca o atual', () => {
  render(<CardAside tier={tier} cards={cards} currentId="b" />);
  const aside = screen.getByRole('complementary', { name: 'Cards em Tarefas Básicas' });
  expect(
    within(aside)
      .getAllByRole('link')
      .map((a) => a.textContent),
  ).toEqual(['Alfa', 'Beta']);
  expect(within(aside).getByRole('link', { name: 'Beta' })).toHaveAttribute('aria-current', 'page');
  expect(within(aside).getByRole('link', { name: 'Alfa' })).toHaveAttribute('href', '#/basicas/a');
});
