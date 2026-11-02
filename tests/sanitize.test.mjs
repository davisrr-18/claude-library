import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isTagAllowed, isAttrAllowed } from '../js/sanitize.js';

test('tags permitidas e proibidas', () => {
  for (const t of ['P', 'H2', 'A', 'IMG', 'PRE', 'CODE', 'TABLE', 'LI']) assert.equal(isTagAllowed(t, {}), true, t);
  for (const t of ['SCRIPT', 'IFRAME', 'SVG', 'MATH', 'STYLE', 'FORM', 'BUTTON', 'OBJECT', 'EMBED', 'LINK', 'META', 'BASE', 'TEMPLATE', 'DIV', 'SPAN']) {
    assert.equal(isTagAllowed(t, {}), false, t);
  }
});

test('INPUT so como checkbox', () => {
  assert.equal(isTagAllowed('INPUT', { type: 'checkbox' }), true);
  assert.equal(isTagAllowed('INPUT', { type: 'text' }), false);
  assert.equal(isTagAllowed('INPUT', {}), false);
});

test('href/src passam por isSafeUrl', () => {
  assert.equal(isAttrAllowed('A', 'href', 'https://a.b'), true);
  assert.equal(isAttrAllowed('A', 'href', 'javascript:alert(1)'), false);
  assert.equal(isAttrAllowed('A', 'href', '/\\evil.com/x'), false);
  assert.equal(isAttrAllowed('IMG', 'src', 'data:image/svg+xml,<svg onload=x>'), false);
  assert.equal(isAttrAllowed('IMG', 'src', 'img/a.png'), true);
});

test('start so em OL e so numerico', () => {
  assert.equal(isAttrAllowed('OL', 'start', '3'), true);
  assert.equal(isAttrAllowed('OL', 'start', '3x'), false);
  assert.equal(isAttrAllowed('OL', 'start', '-1'), false);
  assert.equal(isAttrAllowed('UL', 'start', '3'), false);
});

test('atributos perigosos sao rejeitados', () => {
  for (const name of ['onerror', 'onclick', 'onload', 'style', 'srcset', 'formaction', 'id', 'name', 'xlink:href', 'is']) {
    assert.equal(isAttrAllowed('IMG', name, 'x'), false, name);
  }
});

test('type so em checkbox; target so _blank; class restrita; align restrito', () => {
  assert.equal(isAttrAllowed('INPUT', 'type', 'checkbox'), true);
  assert.equal(isAttrAllowed('INPUT', 'type', 'image'), false);
  assert.equal(isAttrAllowed('A', 'type', 'checkbox'), false);
  assert.equal(isAttrAllowed('A', 'target', '_blank'), true);
  assert.equal(isAttrAllowed('A', 'target', '_top'), false);
  assert.equal(isAttrAllowed('CODE', 'class', 'language-js hljs'), true);
  assert.equal(isAttrAllowed('CODE', 'class', 'x" onmouseover="y'), false);
  assert.equal(isAttrAllowed('TD', 'align', 'center'), true);
  assert.equal(isAttrAllowed('TD', 'align', 'javascript:x'), false);
});
