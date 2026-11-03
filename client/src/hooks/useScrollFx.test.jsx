import { act, render } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { useScrollFx } from './useScrollFx.js';

function Exemplo() {
  const bar = useRef(null);
  const scrolled = useScrollFx(bar);
  return <div ref={bar} data-testid="barra" data-scrolled={String(scrolled)} />;
}

const rolar = (y, { altura = 2000, janela = 1000 } = {}) => {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true });
  Object.defineProperty(document.documentElement, 'scrollHeight', { value: altura, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: janela, configurable: true });
  act(() => window.dispatchEvent(new Event('scroll')));
};

beforeEach(() => vi.stubGlobal('requestAnimationFrame', (fn) => fn()));
afterEach(() => vi.unstubAllGlobals());

test('o progresso vai direto para o elemento (--progresso), de 0 a 1, sem re-render por frame', () => {
  const { getByTestId } = render(<Exemplo />);
  const barra = getByTestId('barra');
  rolar(0);
  expect(barra.style.getPropertyValue('--progresso')).toBe('0');
  rolar(500);
  expect(barra.style.getPropertyValue('--progresso')).toBe('0.5');
  rolar(5000);
  expect(barra.style.getPropertyValue('--progresso')).toBe('1');
});

test('página que cabe na tela tem progresso 0', () => {
  const { getByTestId } = render(<Exemplo />);
  rolar(0, { altura: 800, janela: 1000 });
  expect(getByTestId('barra').style.getPropertyValue('--progresso')).toBe('0');
});

test('scrolled liga depois de 8px de rolagem', () => {
  const { getByTestId } = render(<Exemplo />);
  rolar(8);
  expect(getByTestId('barra').dataset.scrolled).toBe('false');
  rolar(9);
  expect(getByTestId('barra').dataset.scrolled).toBe('true');
});

test('rolagem negativa (overscroll do iOS) não inverte a barra: progresso fica entre 0 e 1', () => {
  const { getByTestId } = render(<Exemplo />);
  rolar(-40);
  expect(getByTestId('barra').style.getPropertyValue('--progresso')).toBe('0');
});
