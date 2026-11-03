import { expect, test } from 'vitest';
import { safeFragment } from './markdownDom.js';

// Segunda camada de defesa: o walker precisa limpar HTML cru mesmo se a primeira camada (renderMarkdown) falhar.
const html = (s) => {
  const div = document.createElement('div');
  div.append(safeFragment(s));
  return div;
};

test('remove tags fora da lista (script, iframe, svg, style, form) com o conteúdo', () => {
  const out = html(
    '<p>ok</p><script>alert(1)</script><iframe src="https://x"></iframe><svg onload="x()"></svg><style>p{}</style><form></form>',
  );
  expect(out.innerHTML).toBe('<p>ok</p>');
});

test('remove atributos de evento, style e URLs perigosas, e mantém os permitidos', () => {
  const out = html(
    '<a href="javascript:alert(1)" onclick="x()" style="color:red" title="t" rel="noopener">l</a><img src="data:text/html,x" alt="a" onerror="x()">',
  );
  const a = out.querySelector('a');
  expect(a.getAttributeNames().sort()).toEqual(['rel', 'title']);
  expect(out.querySelector('img').getAttributeNames()).toEqual(['alt']);
});

test('aceita link e imagem seguros', () => {
  const out = html('<a href="https://exemplo.com/x">l</a><img src="img/a.png" alt="a">');
  expect(out.querySelector('a').getAttribute('href')).toBe('https://exemplo.com/x');
  expect(out.querySelector('img').getAttribute('src')).toBe('img/a.png');
});

test('limpa também elementos aninhados', () => {
  const out = html('<blockquote><p>a<script>x</script><b onclick="x()">b</b></p></blockquote>');
  expect(out.innerHTML).toBe('<blockquote><p>a</p></blockquote>');
});

test('input só passa como checkbox', () => {
  const out = html(
    '<input type="checkbox" checked disabled><input type="text" value="x"><input type="password">',
  );
  expect(out.querySelectorAll('input')).toHaveLength(1);
  expect(out.querySelector('input').getAttribute('type')).toBe('checkbox');
});
