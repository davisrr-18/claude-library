import { act, renderHook } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { useHash } from './useHash.js';

const go = (hash) =>
  act(() => {
    window.location.hash = hash;
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });

afterEach(() => window.history.replaceState(null, '', '#/'));

test('acompanha as mudanças de rota', () => {
  window.history.replaceState(null, '', '#/basicas');
  const { result } = renderHook(() => useHash());
  expect(result.current).toBe('#/basicas');
  go('#/complexas/x');
  expect(result.current).toBe('#/complexas/x');
});

test('ignora âncoras que não são rota (#main) e mantém a rota atual', () => {
  window.history.replaceState(null, '', '#/basicas');
  const { result } = renderHook(() => useHash());
  go('#main');
  expect(result.current).toBe('#/basicas');
});

test('entrar por uma âncora que não é rota vira a Home', () => {
  window.history.replaceState(null, '', '#main');
  const { result } = renderHook(() => useHash());
  expect(result.current).toBe('#/');
});
