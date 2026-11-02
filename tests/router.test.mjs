import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseRoute, isAppHash, resolveView } from '../js/router.js';

test('home', () => {
  assert.deepEqual(parseRoute('#/'), { view: 'home' });
  assert.deepEqual(parseRoute(''), { view: 'home' });
  assert.deepEqual(parseRoute('#'), { view: 'home' });
});

test('nivel, com e sem barra final', () => {
  assert.deepEqual(parseRoute('#/basicas'), { view: 'tier', tier: 'basicas' });
  assert.deepEqual(parseRoute('#/basicas/'), { view: 'tier', tier: 'basicas' });
});

test('card', () => {
  assert.deepEqual(parseRoute('#/basicas/exemplo'), { view: 'card', tier: 'basicas', card: 'exemplo' });
});

test('peca', () => {
  assert.deepEqual(parseRoute('#/basicas/exemplo/skill'), {
    view: 'piece', tier: 'basicas', card: 'exemplo', type: 'skill',
  });
});

test('segmentos codificados sao decodificados', () => {
  assert.deepEqual(parseRoute('#/%62asicas'), { view: 'tier', tier: 'basicas' });
});

test('rotas invalidas', () => {
  assert.equal(parseRoute('#/xyz').view, 'notfound');
  assert.equal(parseRoute('#/basicas/a/b/c').view, 'notfound');
  assert.equal(parseRoute('#/%E0%A4%A').view, 'notfound'); // percent-encoding malformado
});

test('isAppHash: so hashes de rota do app (nao ancoras como #main)', () => {
  assert.equal(isAppHash(''), true);
  assert.equal(isAppHash('#'), true);
  assert.equal(isAppHash('#/'), true);
  assert.equal(isAppHash('#/basicas'), true);
  assert.equal(isAppHash('#main'), false);
});

test('barras duplicadas e barra final no card', () => {
  assert.deepEqual(parseRoute('#/basicas/exemplo/'), { view: 'card', tier: 'basicas', card: 'exemplo' });
  assert.equal(parseRoute('#/basicas//exemplo/skill').view, 'piece');
});

test('segmentos extras e caracteres hostis dao notfound', () => {
  assert.equal(parseRoute('#/basicas/exemplo/skill/extra').view, 'notfound');
  assert.equal(parseRoute('#/basicas%00').view, 'notfound');
  assert.equal(parseRoute('#/basicas%2Fexemplo').view, 'notfound');
  assert.equal(parseRoute('#//basicas').view, 'tier');
});

const m = {
  tiers: [
    { id: 'basicas', cards: [{ id: 'a', pieces: [{ type: 'skill' }] }, { id: 'vazio', pieces: [] }] },
    { id: 'intermediarias', cards: [] },
    { id: 'complexas', cards: [] },
  ],
};

test('resolveView: casa a rota com o manifest', () => {
  assert.deepEqual(resolveView({ view: 'home' }, m), { view: 'home' });
  assert.equal(resolveView(parseRoute('#/basicas'), m).tier.id, 'basicas');
  const card = resolveView(parseRoute('#/basicas/a'), m);
  assert.equal(card.view, 'card');
  assert.equal(card.card.id, 'a');
  const piece = resolveView(parseRoute('#/basicas/a/skill'), m);
  assert.deepEqual([piece.view, piece.type], ['piece', 'skill']);
});

test('resolveView: nivel vazio existe; card, peca ou nivel inexistentes dao notfound', () => {
  assert.equal(resolveView(parseRoute('#/intermediarias'), m).view, 'tier');
  assert.equal(resolveView(parseRoute('#/basicas/nao-existe'), m).view, 'notfound');
  assert.equal(resolveView(parseRoute('#/basicas/a/agente'), m).view, 'notfound'); // tipo valido, mas o card nao tem
  assert.equal(resolveView(parseRoute('#/basicas/vazio/skill'), m).view, 'notfound'); // card sem pecas
  assert.equal(resolveView(parseRoute('#/xyz'), m).view, 'notfound');
  assert.equal(resolveView({ view: 'notfound' }, m).view, 'notfound');
});
