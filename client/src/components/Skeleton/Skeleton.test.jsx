import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import Skeleton from './Skeleton.jsx';

test('anuncia o carregamento como status ocupado', () => {
  render(<Skeleton />);
  expect(screen.getByRole('status', { name: 'Carregando' })).toHaveAttribute('aria-busy', 'true');
});
