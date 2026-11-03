import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { clearPieceCache } from '../../services/content.js';
import Card from './Card.jsx';

afterEach(() => {
  vi.unstubAllGlobals();
  clearPieceCache();
});

const pieces = [
  { type: 'agente', title: 'Tutor', file: 'p/tutor.md', install: 'file' },
  { type: 'agente', title: 'Revisor', file: 'p/revisor.md', install: 'file' },
  { type: 'skill', title: 'Skill X', file: 'p/skill.md' },
];
const card = { id: 'p', title: 'Pacote', summary: 'Resumo do pacote', tags: ['web'], pieces };
const outro = { id: 'q', title: 'Outro', pieces: [] };
const tier = { id: 'intermediarias', title: 'Tarefas Intermediárias', cards: [outro, card] };

const arquivos = {
  'content/p/tutor.md': '---\ndestino: .claude/agents/tutor.md\n---\nTexto do tutor',
  'content/p/revisor.md': '---\ndestino: .claude/agents/revisor.md\n---\nTexto do revisor',
  'content/p/skill.md': 'Texto da skill',
};
const stubFetch = () =>
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url) => ({ ok: true, status: 200, text: async () => arquivos[url] })),
  );

test('mostra trilha, h1, resumo, abas por tipo e, sem tipo na rota, a primeira aba (na ordem dos tipos)', async () => {
  stubFetch();
  render(<Card tier={tier} card={card} />);
  expect(screen.getByRole('heading', { level: 1, name: 'Pacote' })).toBeInTheDocument();
  expect(screen.getByText('Resumo do pacote')).toBeInTheDocument();
  expect(screen.getByRole('navigation', { name: 'Você está em' })).toHaveTextContent(
    'Tarefas Intermediárias',
  );
  const abas = screen.getByRole('navigation', { name: 'Peças do card' });
  expect(abas).toHaveTextContent('Agente');
  expect(abas).toHaveTextContent('Skill');
  expect(screen.getByRole('link', { name: /Skill/ })).toHaveAttribute('aria-current', 'page');
  await waitFor(() => expect(screen.getByText('Texto da skill')).toBeInTheDocument());
  expect(screen.queryByText('Texto do tutor')).toBeNull();
});

test('o tipo da rota escolhe a aba ativa e mostra todas as peças daquele tipo', async () => {
  stubFetch();
  render(<Card tier={tier} card={card} activeType="agente" />);
  expect(screen.getByRole('link', { name: /Agente/ })).toHaveAttribute('aria-current', 'page');
  await waitFor(() => expect(screen.getByText('Texto do tutor')).toBeInTheDocument());
  expect(screen.getByText('Texto do revisor')).toBeInTheDocument();
  expect(screen.queryByText('Texto da skill')).toBeNull();
});

test('pacote com 2 ou mais arquivos instaláveis oferece instalar tudo de uma vez', async () => {
  stubFetch();
  render(<Card tier={tier} card={card} />);
  await waitFor(() =>
    expect(screen.getByText('Instalar o pacote inteiro pelo terminal (2 arquivos)')).toBeInTheDocument(),
  );
});

test('navegação entre cards do nível: anterior e lista lateral', () => {
  stubFetch();
  render(<Card tier={tier} card={card} />);
  expect(screen.getByRole('navigation', { name: 'Outros cards deste nível' })).toHaveTextContent('Outro');
  expect(screen.getByRole('complementary', { name: 'Cards em Tarefas Intermediárias' })).toBeInTheDocument();
  expect(
    screen.getAllByRole('link', { name: 'Pacote' }).some((a) => a.getAttribute('aria-current') === 'page'),
  ).toBe(true);
});

test('card sem peças mostra o aviso', () => {
  render(<Card tier={tier} card={outro} />);
  expect(screen.getByText('Este card ainda não tem peças.')).toBeInTheDocument();
  expect(screen.queryByRole('navigation', { name: 'Peças do card' })).toBeNull();
});

test('se uma peça do pacote não carrega, avisa que a instalação pode estar incompleta', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url) =>
      url === 'content/p/revisor.md'
        ? { ok: false, status: 404 }
        : { ok: true, status: 200, text: async () => arquivos[url] },
    ),
  );
  render(<Card tier={tier} card={card} />);
  await waitFor(() =>
    expect(
      screen.getByText(/1 peça do pacote não carregou: a instalação pelo terminal pode estar incompleta/),
    ).toBeInTheDocument(),
  );
});

test('sem falhas, não mostra aviso de instalação incompleta', async () => {
  stubFetch();
  render(<Card tier={tier} card={card} />);
  await screen.findByText('Instalar o pacote inteiro pelo terminal (2 arquivos)');
  expect(screen.queryByText(/pode estar incompleta/)).toBeNull();
});
