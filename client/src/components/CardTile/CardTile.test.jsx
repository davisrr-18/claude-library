import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import CardTile from './CardTile.jsx';

const entry = {
  tierObj: { id: 'intermediarias' },
  cardObj: {
    id: 'web',
    title: 'Desenvolvimento Web',
    summary: 'Pacote de web',
    tags: ['web', 'Web', 'react'],
    pieces: [
      { type: 'agente', title: 'A' },
      { type: 'agente', title: 'B' },
      { type: 'skill', title: 'S' },
    ],
  },
};

test('é um link para a página do card, nomeado pelo título', () => {
  render(<CardTile entry={entry} />);
  const link = screen.getByRole('link', { name: 'Desenvolvimento Web' });
  expect(link).toHaveAttribute('href', '#/intermediarias/web');
});

test('mostra o resumo, as peças por tipo com contagem e as tags sem repetição', () => {
  render(<CardTile entry={entry} />);
  expect(screen.getByText('Pacote de web')).toBeInTheDocument();
  expect(screen.getByRole('list', { name: 'Peças incluídas' })).toHaveTextContent(/Agente ×2/);
  expect(screen.getByRole('list', { name: 'Peças incluídas' })).toHaveTextContent(/Skill/);
  expect(screen.getAllByText(/^#web$/i)).toHaveLength(1);
});

test('o nível do título é configurável', () => {
  render(<CardTile entry={entry} headingLevel={2} />);
  expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
});
