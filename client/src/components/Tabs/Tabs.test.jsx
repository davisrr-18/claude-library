import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { expect, test } from 'vitest';
import Tabs from './Tabs.jsx';

const items = [
  { id: '', children: 'Todos' },
  { id: 'a', children: 'A' },
  { id: 'b', children: 'B' },
];

function Exemplo() {
  const [v, setV] = useState('');
  return <Tabs label="Tipos" prefix="t" panelId="p" items={items} value={v} onChange={setV} />;
}

test('só a aba escolhida entra na ordem do Tab', () => {
  render(<Exemplo />);
  const tabs = screen.getAllByRole('tab');
  expect(tabs.map((t) => t.tabIndex)).toEqual([0, -1, -1]);
  expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
});

test('seta para a direita escolhe e foca a próxima aba; End vai à última; Home volta à primeira', () => {
  render(<Exemplo />);
  const tabs = screen.getAllByRole('tab');
  tabs[0].focus();
  fireEvent.keyDown(tabs[0], { key: 'ArrowRight' });
  expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
  expect(document.activeElement).toBe(tabs[1]);
  fireEvent.keyDown(tabs[1], { key: 'End' });
  expect(tabs[2]).toHaveAttribute('aria-selected', 'true');
  fireEvent.keyDown(tabs[2], { key: 'Home' });
  expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
});

test('Alt+seta não é roubada (voltar do navegador)', () => {
  render(<Exemplo />);
  const tabs = screen.getAllByRole('tab');
  fireEvent.keyDown(tabs[0], { key: 'ArrowRight', altKey: true });
  expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
});

test('clique escolhe a aba', () => {
  render(<Exemplo />);
  fireEvent.click(screen.getByRole('tab', { name: 'B' }));
  expect(screen.getByRole('tab', { name: 'B' })).toHaveAttribute('aria-selected', 'true');
});
