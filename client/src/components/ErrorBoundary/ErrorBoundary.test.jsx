import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import ErrorBoundary from './ErrorBoundary.jsx';

beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => {})); // o React registra o erro capturado
afterEach(() => vi.restoreAllMocks());

const Quebra = () => {
  throw new Error('deu ruim');
};

test('mostra o aviso em vez de uma tela em branco', () => {
  render(
    <ErrorBoundary>
      <Quebra />
    </ErrorBoundary>,
  );
  expect(screen.getByRole('alert')).toHaveTextContent('Erro ao exibir a página: deu ruim');
});

test('sem erro, só mostra o conteúdo', () => {
  render(
    <ErrorBoundary>
      <p>tudo certo</p>
    </ErrorBoundary>,
  );
  expect(screen.getByText('tudo certo')).toBeInTheDocument();
  expect(screen.queryByRole('alert')).toBeNull();
});

test('trocar a key limpa o erro (nova rota)', () => {
  const { rerender } = render(
    <ErrorBoundary key="a">
      <Quebra />
    </ErrorBoundary>,
  );
  rerender(
    <ErrorBoundary key="b">
      <p>outra página</p>
    </ErrorBoundary>,
  );
  expect(screen.getByText('outra página')).toBeInTheDocument();
});
