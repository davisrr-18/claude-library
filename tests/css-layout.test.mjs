import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const css = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '..', 'css/style.css'), 'utf8');

/** Corpo de TODAS as regras cujo seletor é exatamente `selector` (mescla as declarações). */
function declarations(selector) {
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(?:^|\\n)${esc}\\s*\\{([^}]*)\\}`, 'g');
  return [...css.matchAll(re)].map((m) => m[1]).join(' ');
}

// Regressão: o corpo do "Instalar pelo terminal" é um grid; com coluna automática ela cresce até a linha
// mais longa do comando (os heredocs têm linhas compridas) e a caixa estoura para fora do bloco.
test('.install-body: a coluna do grid pode encolher (minmax(0, 1fr)) para o bloco de comandos rolar por dentro', () => {
  const d = declarations('.install-body');
  assert.match(d, /display:\s*grid/);
  assert.match(d, /grid-template-columns:\s*minmax\(0,\s*1fr\)/);
});

test('o bloco de comandos rola na horizontal e na vertical dentro da caixa (nao estoura)', () => {
  const d = declarations('.install .code-wrap pre');
  assert.match(d, /overflow:\s*auto/);
  assert.match(d, /max-height:/);
  // sem quebra de linha forcada: comandos de terminal nao podem ser quebrados no meio
  assert.doesNotMatch(d, /white-space:\s*pre-wrap/);
});

test('.install e seus filhos podem encolher (min-width: 0) e nunca passam da largura do pai', () => {
  assert.match(declarations('.install'), /min-width:\s*0/);
  assert.match(declarations('.install'), /max-width:\s*100%/);
  assert.match(declarations('.install-body > *'), /min-width:\s*0/);
});

// Guarda geral: todo grid que contem texto de largura imprevisivel (codigo, comandos) deve ter coluna
// minmax(0, 1fr) ou min-width: 0 nos itens. Aqui conferimos os contêineres de conteudo da pagina do card.
test('contêineres de conteudo da pagina do card tambem tem coluna que encolhe', () => {
  assert.match(declarations('.card-layout'), /grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(declarations('.card-main'), /min-width:\s*0/);
  assert.match(declarations('.tier-body'), /min-width:\s*0/);
});

test('grids que recebem texto de tamanho imprevisivel (filtros, lista lateral) tambem tem coluna que encolhe', () => {
  assert.match(declarations('.filters'), /grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(declarations('.card-aside ul'), /grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(declarations('.card-aside a span'), /overflow-wrap:\s*anywhere/);
});

// Regressão: o botão "Copiar" ficava flutuando (position: absolute) por cima do bloco, cobrindo a barra de
// rolagem vertical e o texto. Ele agora tem uma linha própria no topo do bloco.
test('botao Copiar do bloco de codigo nao flutua sobre o codigo (linha propria, sem position: absolute)', () => {
  assert.doesNotMatch(declarations('.code-wrap .code-copy'), /position:\s*absolute/);
  assert.match(declarations('.code-wrap'), /display:\s*flex/);
  assert.match(declarations('.code-wrap'), /flex-direction:\s*column/);
  assert.match(declarations('.code-wrap .code-copy'), /align-self:\s*flex-end/);
});

test('o bloco de codigo e a caixa (borda/fundo no .code-wrap) e o <pre> rola por dentro sem moldura propria', () => {
  assert.match(declarations('.code-wrap'), /border:\s*1px solid/);
  assert.match(declarations('.code-wrap'), /overflow:\s*hidden/);
  assert.match(declarations('.code-wrap pre'), /border:\s*0/);
  assert.match(declarations('.code-wrap pre'), /overflow-x:\s*auto/);
});
