import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize, buildIndex, search, collectTags, dedupeTags, sameTitle } from '../js/search.js';

const entries = [
  { tier: 'basicas', card: 'commit', title: 'Commits limpos', summary: 'Mensagens de commit', tags: ['git'], text: 'Use conventional commits e revisão.' },
  { tier: 'basicas', card: 'revisao', title: 'Revisão de código', summary: 'Checklist', tags: ['review', 'git'], text: 'Ação do revisor.' },
  { tier: 'complexas', card: 'migracao', title: 'Migração grande', summary: 'Marcos', tags: ['arquitetura'], text: 'Plano em marcos com commit por marco.' },
];
const idx = buildIndex(entries);
const ids = (r) => r.map((e) => e.card);

test('normalize: minusculas e sem acentos', () => {
  assert.equal(normalize('Ação REVISÃO'), 'acao revisao');
  assert.equal(normalize(undefined), '');
});

test('consulta vazia ou so espacos nao filtra (retorna todos, na ordem original)', () => {
  assert.deepEqual(ids(search(idx, '')), ['commit', 'revisao', 'migracao']);
  assert.deepEqual(ids(search(idx, '   ')), ['commit', 'revisao', 'migracao']);
});

test('acentos: "acao" acha "Ação"; "revisao" acha "Revisão"', () => {
  assert.deepEqual(ids(search(idx, 'acao')), ['revisao']);
  assert.ok(ids(search(idx, 'revisao')).includes('revisao'));
});

test('casa por PALAVRA (prefixo), nao por trecho solto', () => {
  const i = buildIndex([
    { tier: 'basicas', card: 'a', title: 'Mundo digital', summary: '', tags: [], text: '' },
    { tier: 'basicas', card: 'b', title: 'Controle com git', summary: '', tags: [], text: '' },
  ]);
  assert.deepEqual(ids(search(i, 'git')), ['b']); // "digital" contem "git" no meio: nao casa
  assert.deepEqual(ids(search(i, 'dig')), ['a']); // prefixo casa
  assert.deepEqual(ids(search(i, 'ital')), []); // sufixo nao casa
});

test('prefixo: "migra" acha "Migração"; hifen separa palavras', () => {
  assert.deepEqual(ids(search(idx, 'migra')), ['migracao']);
  const i = buildIndex([{ tier: 'basicas', card: 'a', title: 'Arquivo claude-md', summary: '', tags: [], text: '' }]);
  assert.deepEqual(ids(search(i, 'claude-md')), ['a']);
  assert.deepEqual(ids(search(i, 'md')), ['a']);
});

test('varias palavras exigem todas (AND)', () => {
  assert.deepEqual(ids(search(idx, 'commit marco')), ['migracao']);
  assert.deepEqual(ids(search(idx, 'commit xyz')), []);
});

test('titulo pesa mais que corpo', () => {
  const r = ids(search(idx, 'commit'));
  assert.equal(r[0], 'commit');
  assert.ok(r.includes('migracao'));
});

test('filtro por nivel e por tags (AND entre tags)', () => {
  assert.deepEqual(ids(search(idx, '', { tier: 'complexas' })), ['migracao']);
  assert.deepEqual(ids(search(idx, '', { tags: ['git'] })), ['commit', 'revisao']);
  assert.deepEqual(ids(search(idx, '', { tags: ['git', 'review'] })), ['revisao']);
  assert.deepEqual(ids(search(idx, 'commit', { tier: 'basicas', tags: ['git'] })), ['commit']);
});

test('caracteres especiais nao quebram; so pontuacao nao encontra nada', () => {
  assert.deepEqual(ids(search(idx, '(.*[')), []);
  assert.deepEqual(ids(search(idx, '***')), []);
});

test('peso: titulo > tags/resumo > corpo (ordem decide, nao so presenca)', () => {
  const i = buildIndex([
    { tier: 'basicas', card: 'corpo', title: 'Zeta', summary: '', tags: [], text: 'teste aqui' },
    { tier: 'basicas', card: 'resumo', title: 'Beta', summary: 'sobre teste', tags: [], text: '' },
    { tier: 'basicas', card: 'titulo', title: 'Teste geral', summary: '', tags: [], text: '' },
    { tier: 'basicas', card: 'tag', title: 'Gama', summary: '', tags: ['teste'], text: '' },
  ]);
  assert.deepEqual(ids(search(i, 'teste')), ['titulo', 'resumo', 'tag', 'corpo']);
});

test('dedupeTags: ignora caixa e acento, mantem a primeira forma', () => {
  assert.deepEqual(dedupeTags(['Git', 'git', 'GIT', 'revisão', 'revisao', '']), ['Git', 'revisão']);
  assert.deepEqual(dedupeTags(undefined), []);
});

test('collectTags junta tags que so diferem na caixa', () => {
  const got = collectTags([
    { tags: ['Git'] }, { tags: ['git', 'x'] }, { tags: ['GIT', 'git'] },
  ]);
  assert.deepEqual(got, [{ tag: 'Git', count: 3 }, { tag: 'x', count: 1 }]);
});

test('collectTags: unicas, ordenadas, com contagem', () => {
  assert.deepEqual(collectTags(entries), [
    { tag: 'arquitetura', count: 1 }, { tag: 'git', count: 2 }, { tag: 'review', count: 1 },
  ]);
});

test('sameTitle: ignora caixa, acento, espacos e pontuacao nas pontas', () => {
  assert.equal(sameTitle('Skill de exemplo', 'skill  de EXEMPLO'), true);
  assert.equal(sameTitle('Fluxo: investigar, implementar', 'Fluxo investigar implementar'), true);
  assert.equal(sameTitle('Investigação', 'investigacao'), true);
  assert.equal(sameTitle('Skill de exemplo', 'Skill de exemplo 2'), false);
  assert.equal(sameTitle('', ''), false); // vazio nunca e "igual": nao remove titulo nenhum
  assert.equal(sameTitle(undefined, 'x'), false);
});

test('ç e ñ sao normalizados; letras sem decomposicao (ø, ß) viram separador sem quebrar', () => {
  assert.equal(normalize('Ação coração piñata'), 'acao coracao pinata');
  const i = buildIndex([{ tier: 'basicas', card: 'a', title: 'Coração', summary: '', tags: [], text: '' }]);
  assert.deepEqual(search(i, 'coracao').map((e) => e.card), ['a']);
  assert.doesNotThrow(() => search(i, 'straße ø'));
});
