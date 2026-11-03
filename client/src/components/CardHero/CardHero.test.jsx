import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import CardHero from './CardHero.jsx';

const tier = { id: 'basicas', title: 'Tarefas Básicas' };

test('título como h1, nível, resumo e tags sem repetição', () => {
  render(
    <CardHero
      tier={tier}
      level={1}
      card={{ title: 'Git', summary: 'Resumo', tags: ['git', 'Git', 'vcs'] }}
    />,
  );
  expect(screen.getByRole('heading', { level: 1, name: 'Git' })).toBeInTheDocument();
  expect(screen.getByText('Resumo')).toBeInTheDocument();
  expect(screen.getByText('Tarefas Básicas')).toBeInTheDocument();
  expect(screen.getAllByText(/^#git$/i)).toHaveLength(1);
  expect(screen.getByText('#vcs')).toBeInTheDocument();
});

test('sem resumo nem tags não cria parágrafo nem lista vazios', () => {
  const { container } = render(<CardHero tier={tier} level={2} card={{ title: 'X' }} />);
  expect(container.querySelector('p')).toBeNull();
  expect(container.querySelector('ul')).toBeNull();
});
