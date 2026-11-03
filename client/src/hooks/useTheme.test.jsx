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
