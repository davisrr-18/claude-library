import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import Tier from './Tier.jsx';

const tier = { id: 'basicas', title: 'Tarefas Básicas' };
const entries = [
  { tier: 'basicas', card: 'g', tierObj: tier, cardObj: { id: 'g', title: 'Git', pieces: [], tags: [] } },
];

test('o nível é o h1, os cards são h2 e há trilha de volta', () => {
  render(<Tier tier={tier} entries={entries} tab="" onTab={() => {}} />);
  expect(screen.getByRole('heading', { level: 1, name: 'Tarefas Básicas' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 2, name: 'Git' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Início' })).toHaveAttribute('href', '#/');
});
