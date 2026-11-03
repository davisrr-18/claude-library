import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import InstallPanel from './InstallPanel.jsx';

const files = [{ path: '.claude/agents/tutor.md', content: 'oi' }];

afterEach(() => localStorage.clear());

const abrir = () => {
  const details = document.querySelector('details');
  details.open = true;
  fireEvent(details, new Event('toggle'));
};

test('fechado, não monta os comandos', () => {
  render(<InstallPanel summary="Instalar" files={files} />);
  expect(screen.queryByRole('tablist')).toBeNull();
});

test('ao abrir, mostra as 3 abas de sistema e guarda a escolha', () => {
  render(<InstallPanel summary="Instalar" files={files} />);
  abrir();
  expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(['Linux', 'macOS', 'Windows']);
  fireEvent.click(screen.getByRole('tab', { name: 'Windows' }));
  expect(localStorage.getItem('os')).toBe('windows');
});

test('a escolha de sistema muda os comandos mostrados', () => {
  render(<InstallPanel summary="Instalar" files={files} />);
  abrir();
  fireEvent.click(screen.getByRole('tab', { name: 'Linux' }));
  const linux = screen.getByRole('region', { name: 'Comandos de instalação' }).textContent;
  fireEvent.click(screen.getByRole('tab', { name: 'Windows' }));
  expect(screen.getByRole('region', { name: 'Comandos de instalação' }).textContent).not.toBe(linux);
});

test('dois blocos na mesma página não repetem ids', () => {
  render(
    <>
      <InstallPanel summary="Um" files={files} />
      <InstallPanel summary="Dois" files={files} />
    </>,
  );
  document.querySelectorAll('details').forEach((d) => {
    d.open = true;
    fireEvent(d, new Event('toggle'));
  });
  const ids = [...document.querySelectorAll('[id]')].map((e) => e.id);
  expect(new Set(ids).size).toBe(ids.length);
});
