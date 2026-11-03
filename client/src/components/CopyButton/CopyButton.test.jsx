import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import CopyButton from './CopyButton.jsx';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const clique = () => act(async () => fireEvent.click(screen.getByRole('button')));

test('copia o texto e mostra "Copiado!", voltando ao rótulo depois de 1,8 s', async () => {
  const writeText = vi.fn().mockResolvedValue();
  vi.stubGlobal('navigator', { clipboard: { writeText } });
  vi.useFakeTimers();
  render(<CopyButton label="Copiar" getText={() => 'abc'} />);
  await clique();
  expect(writeText).toHaveBeenCalledWith('abc');
  expect(screen.getByRole('button')).toHaveTextContent('Copiado!');
  act(() => vi.advanceTimersByTime(1801));
  expect(screen.getByRole('button')).toHaveTextContent('Copiar');
});

test('avisa quando não consegue copiar', async () => {
  vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('negado')) } });
  document.execCommand = vi.fn(() => false);
  render(<CopyButton label="Copiar" getText={() => 'x'} />);
  await clique();
  expect(screen.getByRole('button')).toHaveTextContent('Não foi possível copiar');
});
