import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import LevelDots from './LevelDots.jsx';

test('sem label anuncia o nível como imagem', () => {
  render(<LevelDots level={2} />);
  expect(screen.getByRole('img', { name: 'Nível 2 de 3' })).toBeInTheDocument();
});

test('com label vazio fica escondido dos leitores de tela', () => {
  const { container } = render(<LevelDots level={1} label="" />);
  expect(screen.queryByRole('img')).toBeNull();
  expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
});

test('acende só os pontos até o nível', () => {
  const { container } = render(<LevelDots level={2} />);
  expect([...container.querySelectorAll('i')].map((i) => i.hasAttribute('data-on'))).toEqual([
    true,
    true,
    false,
  ]);
});
