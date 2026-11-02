import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderMarkdown, isSafeUrl } from '../js/markdown.js';

test('isSafeUrl: aceita http(s), ancora e relativos', () => {
  for (const u of ['https://a.b', 'http://a.b/x?y=1', '#ancora', 'docs/a.md', './a.md', '../a.md', 'a.md#x']) {
    assert.equal(isSafeUrl(u), true, u);
  }
});

test('isSafeUrl: rejeita esquemas perigosos e disfarces', () => {
  for (const u of [
    'javascript:alert(1)', 'JaVaScRiPt:alert(1)', ' javascript:alert(1)', 'java\nscript:alert(1)',
    'java\tscript:alert(1)', 'data:text/html,x', 'vbscript:x', 'file:///etc/passwd', 'mailto:a@b.c', '//evil.com/x', '', undefined, null,
  ]) {
    assert.equal(isSafeUrl(u), false, String(u));
  }
});

test('renderiza titulo, lista e bloco de codigo', () => {
  const html = renderMarkdown('# T\n\n- a\n- b\n\n```js\nlet x = 1 < 2;\n```\n');
  assert.match(html, /<h1[^>]*>T<\/h1>/);
  assert.match(html, /<li>a<\/li>/);
  assert.match(html, /<pre><code[^>]*>/);
  assert.match(html, /1 &lt; 2/);
});

test('HTML bruto e escapado: script', () => {
  const html = renderMarkdown('<script>alert(1)</script>');
  assert.doesNotMatch(html, /<script/i);
  assert.match(html, /&lt;script&gt;/);
});

test('HTML bruto e escapado: img com onerror, bloco e inline', () => {
  assert.doesNotMatch(renderMarkdown('<img src=x onerror=alert(1)>'), /<img/i);
  assert.doesNotMatch(renderMarkdown('texto <img src=x onerror=alert(1)> fim'), /<img/i);
  assert.doesNotMatch(renderMarkdown('<div onclick="x()">oi</div>'), /<div/i);
  assert.doesNotMatch(renderMarkdown('<iframe src="https://x"></iframe>'), /<iframe/i);
});

test('link javascript: perde o href mas mantem o texto', () => {
  const html = renderMarkdown('[clique](javascript:alert(1))');
  assert.doesNotMatch(html, /href/i);
  assert.match(html, /clique/);
});

test('link seguro ganha rel e target seguros', () => {
  const html = renderMarkdown('[ok](https://example.com)');
  assert.match(html, /href="https:\/\/example\.com"/);
  assert.match(html, /rel="noopener noreferrer"/);
});

test('imagem insegura nao gera src; segura gera', () => {
  assert.doesNotMatch(renderMarkdown('![x](javascript:alert(1))'), /src=/i);
  assert.doesNotMatch(renderMarkdown('![x](data:text/html,x)'), /src=/i);
  assert.match(renderMarkdown('![alt](img/a.png)'), /src="img\/a\.png"/);
});

test('autolink perigoso e link com titulo malicioso', () => {
  assert.doesNotMatch(renderMarkdown('<javascript:alert(1)>'), /href=/i);
  const html = renderMarkdown('[a](https://x.y "t\\" onmouseover=\\"alert(1)")');
  // o titulo deve continuar dentro do atributo (aspas escapadas), sem virar atributo novo
  assert.doesNotMatch(html, /"\s*onmouseover=/);
});

test('entrada vazia ou nao-string', () => {
  assert.equal(renderMarkdown(''), '');
  assert.equal(renderMarkdown(undefined), '');
});

test('isSafeUrl: barra invertida vira // (protocol-relative) e e rejeitada', () => {
  for (const u of ['/\\evil.com/x', '\\\\evil.com', '\\/evil.com']) assert.equal(isSafeUrl(u), false, u);
});

test('lista ordenada preserva o numero inicial no HTML gerado', () => {
  assert.match(renderMarkdown('3. a\n4. b'), /<ol start="3">/);
});
