import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import Hero from './Hero.jsx';

const matchMediaOriginal = window.matchMedia;
afterEach(() => {
  window.matchMedia = matchMediaOriginal;
});

const manifest = {
  tiers: [
    { id: 'basicas', cards: [{ pieces: [{ type: 'agente' }, { type: 'agente' }, { type: 'skill' }] }] },
  ],
};

const montar = (props = {}) =>
  render(
    <Hero manifest={manifest} cardCount={1} query="" onQuery={() => {}} onClear={() => {}} {...props} />,
  );

test('tem o h1 e uma caixa de busca com nome acessível', () => {
  montar();
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Seu Claude Code, organizado');
  expect(screen.getByRole('searchbox', { name: 'Buscar skills, workflows, agentes' })).toBeInTheDocument();
});

test('digitar chama onQuery e Esc chama onClear', () => {
  const onQuery = vi.fn();
  const onClear = vi.fn();
  montar({ onQuery, onClear });
  const box = screen.getByRole('searchbox');
  fireEvent.change(box, { target: { value: 'git' } });
  expect(onQuery).toHaveBeenCalledWith('git');
  fireEvent.keyDown(box, { key: 'Escape' });
  expect(onClear).toHaveBeenCalled();
});

test('o resumo conta cards e peças por tipo, no singular ou plural (sem animar a contagem)', () => {
  window.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} }); // movimento reduzido
  montar();
  const stats = screen.getByRole('list', { name: 'Resumo do conteúdo' });
  expect(stats).toHaveTextContent(/1 card/);
  expect(stats).toHaveTextContent(/2 agentes/);
  expect(stats).toHaveTextContent(/1 skill/);
});
