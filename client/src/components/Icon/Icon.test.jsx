import { render } from '@testing-library/react';
import { expect, test } from 'vitest';
import { PATHS } from '../../utils/icons.js';
import Icon from './Icon.jsx';

test('é decorativo: aria-hidden e fora da ordem de foco', () => {
  const { container } = render(<Icon name="search" size={20} />);
  const svg = container.querySelector('svg');
  expect(svg).toHaveAttribute('aria-hidden', 'true');
  expect(svg).toHaveAttribute('focusable', 'false');
  expect(svg).toHaveAttribute('width', '20');
  expect(svg.querySelector('path')).toHaveAttribute('d', PATHS.search);
});

test('nome desconhecido cai no ícone de pasta', () => {
  const { container } = render(<Icon name="nao-existe" />);
  expect(container.querySelector('path')).toHaveAttribute('d', PATHS.folder);
});
