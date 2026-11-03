import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import PieceTabs from './PieceTabs.jsx';

const tier = { id: 'intermediarias' };
const card = { id: 'web' };
const groups = [
  { type: 'skill', pieces: [{}] },
  { type: 'agente', pieces: [{}, {}] },
];

test('são links de navegação (não abas com setas), um por tipo, com a atual marcada', () => {
  render(<PieceTabs tier={tier} card={card} groups={groups} current={groups[1]} />);
  const nav = screen.getByRole('navigation', { name: 'Peças do card' });
  expect(nav).toBeInTheDocument();
  expect(screen.queryByRole('tablist')).toBeNull();
  expect(screen.getByRole('link', { name: /Agente/ })).toHaveAttribute('aria-current', 'page');
  expect(screen.getByRole('link', { name: /Agente/ })).toHaveAttribute('href', '#/intermediarias/web/agente');
  expect(screen.getByRole('link', { name: /Skill/ })).not.toHaveAttribute('aria-current');
});

test('só mostra a contagem de tipos com mais de uma peça', () => {
  render(<PieceTabs tier={tier} card={card} groups={groups} current={groups[0]} />);
  expect(screen.getByRole('link', { name: /Agente.*2 peças/ })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Skill' })).toBeInTheDocument();
});
