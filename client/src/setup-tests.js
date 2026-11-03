import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Sem globals, o Testing Library não limpa o DOM sozinho entre os testes.
afterEach(cleanup);

// O jsdom não tem matchMedia. Padrão dos testes: tema claro e sem preferência de movimento reduzido.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = vi.fn((query) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}
