import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

// useOs guarda a preferência em variável de módulo: cada teste carrega o módulo de novo.
let useOs;
beforeEach(async () => {
  vi.resetModules();
  ({ useOs } = await import('./useOs.js'));
});
afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

test('usa o sistema salvo, se for um dos válidos', async () => {
  localStorage.setItem('os', 'macos');
  const { result } = renderHook(() => useOs());
  expect(result.current[0]).toBe('macos');
});

test('valor salvo inválido é ignorado e o sistema é detectado', () => {
  localStorage.setItem('os', 'amiga');
  const { result } = renderHook(() => useOs());
  expect(['linux', 'macos', 'windows']).toContain(result.current[0]);
});

test('escolher guarda no localStorage', () => {
  const { result } = renderHook(() => useOs());
  act(() => result.current[1]('windows'));
  expect(result.current[0]).toBe('windows');
  expect(localStorage.getItem('os')).toBe('windows');
});

test('sem localStorage (bloqueado) a escolha ainda funciona na página', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('bloqueado');
  });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('bloqueado');
  });
  const { result } = renderHook(() => useOs());
  act(() => result.current[1]('macos'));
  expect(result.current[0]).toBe('macos');
});
