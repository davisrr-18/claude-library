import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseRoute, isAppHash } from '../js/router.js';

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
