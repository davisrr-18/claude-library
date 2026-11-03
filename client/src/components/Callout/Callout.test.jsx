import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import Callout from './Callout.jsx';

test('aviso comum não é alerta', () => {
  render(<Callout>oi</Callout>);
  expect(screen.queryByRole('alert')).toBeNull();
});

test('erro é anunciado como alerta', () => {
  render(<Callout kind="error">falhou</Callout>);
  expect(screen.getByRole('alert')).toHaveTextContent('falhou');
});
