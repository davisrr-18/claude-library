import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { clearPieceCache } from '../../services/content.js';
import TierSection from './TierSection.jsx';

afterEach(() => {
  vi.unstubAllGlobals();
  clearPieceCache();
});

const tier = { id: 'intermediarias', title: 'Tarefas Intermediárias', description: 'Meio termo' };
const card = (id, title, pieces) => ({
  tier: tier.id,
  card: id,
  tierObj: tier,
  cardObj: { id, title, pieces, tags: [] },
});
const entries = [
  card('a', 'Alfa', [{ type: 'agente', title: 'Tutor', file: 'a/tutor.md' }]),
  card('b', 'Beta', [{ type: 'skill', title: 'Skill B', file: 'b/s.md' }]),
];

function Exemplo(props) {
  const [tab, setTab] = useState('');
  return <TierSection tier={tier} entries={props.entries ?? entries} tab={tab} onTab={setTab} {...props} />;
}

test('mostra título com link, descrição, contagem e os cards em "Todos"', () => {
  render(<Exemplo />);
  expect(
    screen.getByRole('heading', { level: 2, name: 'Tarefas Intermediárias' }).querySelector('a'),
  ).toHaveAttribute('href', '#/intermediarias');
  expect(screen.getByText('Meio termo')).toBeInTheDocument();
  expect(screen.getByText('2 cards')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Alfa' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Beta' })).toBeInTheDocument();
});

test('as abas têm Todos e só os tipos que existem, com contagem acessível', () => {
  render(<Exemplo />);
  expect(screen.getAllByRole('tab').map((t) => t.textContent.replace(/\d.*$/, '').trim())).toEqual([
    'Todos',
    'Skills',
    'Agentes',
  ]);
  expect(screen.getByRole('tab', { name: /Todos.*2 cards/ })).toHaveAttribute('aria-selected', 'true');
});

test('escolher um tipo mostra os arquivos desse tipo, agrupados pelo card de origem', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => 'texto do tutor' }),
  );
  render(<Exemplo />);
  fireEvent.click(screen.getByRole('tab', { name: /Agentes/ }));
  const panel = screen.getByRole('tabpanel');
  expect(within(panel).getByRole('link', { name: 'Alfa' })).toHaveAttribute('href', '#/intermediarias/a');
  expect(within(panel).queryByRole('link', { name: 'Beta' })).toBeNull();
  await waitFor(() => expect(within(panel).getByText('texto do tutor')).toBeInTheDocument());
});

test('com o tipo escolhido inexistente nos cards filtrados, volta a mostrar todos', () => {
  render(<Exemplo entries={[entries[0]]} tab="skill" />);
  expect(screen.getByRole('tab', { name: /Todos/ })).toHaveAttribute('aria-selected', 'true');
});

test('nível sem cards mostra o aviso e nenhuma aba', () => {
  render(<Exemplo entries={[]} />);
  expect(screen.getByText('Nenhum card neste nível ainda.')).toBeInTheDocument();
  expect(screen.queryByRole('tablist')).toBeNull();
});

test('link=false deixa o título sem link (página do nível)', () => {
  render(<Exemplo link={false} heading={1} cardHeading={2} />);
  expect(
    screen.getByRole('heading', { level: 1, name: 'Tarefas Intermediárias' }).querySelector('a'),
  ).toBeNull();
  expect(screen.getByRole('heading', { level: 2, name: 'Alfa' })).toBeInTheDocument();
});

test('a animação da troca de aba roda uma vez: depois dela, os cards voltam ao normal', () => {
  vi.useFakeTimers();
  try {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => 'x' }));
    render(<Exemplo />);
    fireEvent.click(screen.getByRole('tab', { name: /Agentes/ }));
    fireEvent.click(screen.getByRole('tab', { name: /Todos/ }));
    expect(screen.getByRole('link', { name: 'Alfa' })).toHaveClass('anim-rise');
    act(() => vi.advanceTimersByTime(901));
    expect(screen.getByRole('link', { name: 'Alfa' })).not.toHaveClass('anim-rise');
  } finally {
    vi.useRealTimers();
  }
});
