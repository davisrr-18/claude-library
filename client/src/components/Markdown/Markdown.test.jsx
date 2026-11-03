import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import Markdown from './Markdown.jsx';

afterEach(() => vi.unstubAllGlobals());

test('renderiza o Markdown sem executar HTML bruto: ele aparece como texto', () => {
  const { container } = render(
    <Markdown body={'# Título\n\n<img src=x onerror=alert(1)>\n\n[mau](javascript:alert(1))'} />,
  );
  expect(container.querySelector('img')).toBeNull();
  expect(container.querySelector('a[href^="javascript"]')).toBeNull();
  expect(container).toHaveTextContent('<img src=x onerror=alert(1)>');
});

test('títulos do corpo começam em h3 (h1 é o card e h2 a peça)', () => {
  render(<Markdown body={'## Sub'} />);
  expect(screen.getByRole('heading', { level: 4, name: 'Sub' })).toBeInTheDocument();
});

test('remove o primeiro título do corpo quando é igual ao título da peça', () => {
  render(<Markdown body={'# Minha Peça\n\ntexto'} titles={['Minha Peça']} />);
  expect(screen.queryByRole('heading', { name: 'Minha Peça' })).toBeNull();
  expect(screen.getByText('texto')).toBeInTheDocument();
});

test('bloco de código: região focável com nome e botão Copiar que copia o código', async () => {
  const writeText = vi.fn().mockResolvedValue();
  vi.stubGlobal('navigator', { clipboard: { writeText } });
  render(<Markdown body={'```bash\necho oi\n```'} />);
  expect(screen.getByRole('region', { name: 'Bloco de código' })).toHaveAttribute('tabindex', '0');
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Copiar bloco de código' })));
  expect(writeText).toHaveBeenCalledWith('echo oi\n');
});

test('vários blocos são numerados', () => {
  render(<Markdown body={'```\na\n```\n\n```\nb\n```'} />);
  expect(screen.getByRole('region', { name: 'Bloco de código 2 de 2' })).toBeInTheDocument();
});

test('tabelas ganham um contêiner rolável focável', () => {
  render(<Markdown body={'| a | b |\n|---|---|\n| 1 | 2 |'} />);
  expect(screen.getByRole('region', { name: 'Tabela (use as setas para rolar)' })).toHaveAttribute(
    'tabindex',
    '0',
  );
});
