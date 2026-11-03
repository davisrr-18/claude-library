import { act, renderHook } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { useTheme } from './useTheme.js';

afterEach(() => {
  delete document.documentElement.dataset.theme;
  vi.restoreAllMocks();
  localStorage.clear();
});

test('alterna entre claro e escuro e guarda a escolha', () => {
  document.documentElement.dataset.theme = 'light';
  const { result } = renderHook(() => useTheme());
  expect(result.current.isDark).toBe(false);
  act(() => result.current.toggle());
  expect(result.current.isDark).toBe(true);
  expect(document.documentElement.dataset.theme).toBe('dark');
  expect(localStorage.getItem('theme')).toBe('dark');
});

test('sem localStorage (bloqueado) o tema ainda troca na página', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('bloqueado');
  });
  document.documentElement.dataset.theme = 'dark';
  const { result } = renderHook(() => useTheme());
  act(() => result.current.toggle());
  expect(document.documentElement.dataset.theme).toBe('light');
  expect(result.current.isDark).toBe(false);
});

test('com View Transitions, a troca é uma transição da tela inteira (sem transição por elemento)', () => {
  const start = vi.fn((fn) => fn());
  document.startViewTransition = start;
  document.documentElement.dataset.theme = 'light';
  const { result } = renderHook(() => useTheme());
  act(() => result.current.toggle());
  expect(start).toHaveBeenCalledTimes(1);
  expect(document.documentElement.dataset.theme).toBe('dark');
  expect(result.current.isDark).toBe(true);
  expect(document.documentElement.classList.contains('theme-anim')).toBe(false);
  delete document.documentElement.dataset.theme;
  delete document.startViewTransition;
});

test('com movimento reduzido, troca na hora mesmo havendo View Transitions', () => {
  const start = vi.fn((fn) => fn());
  document.startViewTransition = start;
  const original = window.matchMedia;
  window.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} });
  document.documentElement.dataset.theme = 'light';
  const { result } = renderHook(() => useTheme());
  act(() => result.current.toggle());
  expect(start).not.toHaveBeenCalled();
  expect(document.documentElement.dataset.theme).toBe('dark');
  window.matchMedia = original;
  delete document.startViewTransition;
});

test('dois cliques seguidos no mesmo frame ainda alternam duas vezes (volta ao tema original)', () => {
  const adiados = [];
  document.startViewTransition = (fn) => {
    adiados.push(fn); // o navegador só chama o callback no frame seguinte
    return { ready: Promise.reject(new Error('pulada')), finished: Promise.resolve() };
  };
  document.documentElement.dataset.theme = 'light';
  const { result } = renderHook(() => useTheme());
  act(() => {
    result.current.toggle();
    result.current.toggle();
  });
  act(() => adiados.forEach((fn) => fn()));
  expect(document.documentElement.dataset.theme).toBe('light');
  delete document.documentElement.dataset.theme;
  delete document.startViewTransition;
});
