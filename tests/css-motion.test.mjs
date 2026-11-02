import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const css = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '..', 'css/style.css'), 'utf8');

// Animações de decoração não podem ficar em loop: o usuário percebe como "repetindo sem parar".
// Só o esqueleto de carregamento (shimmer) pode repetir, e some quando o conteúdo chega.
test('so o esqueleto de carregamento (shimmer) tem animacao infinita', () => {
  const infinite = [...css.matchAll(/animation:\s*([^;}]*\binfinite\b[^;}]*)/g)].map((m) => m[1].trim());
  const offenders = infinite.filter((a) => !a.startsWith('shimmer'));
  assert.deepEqual(offenders, [], `animacoes infinitas fora do esqueleto: ${offenders.join(' | ')}`);
});

test('keyframes decorativos terminam onde comecam (sem "pulo" ao acabar)', () => {
  for (const name of ['breathe', 'drift']) {
    const m = css.match(new RegExp(`@keyframes ${name}\\s*\\{([^@]*?\\})\\s*(?=\\n@|\\n\\n|\\n/\\*|$)`));
    assert.ok(m, `keyframes ${name} nao encontrado`);
    const body = m[1];
    assert.match(body, /0%,\s*100%\s*\{/, `${name} deve ter 0%, 100% iguais`);
  }
});

test('elemento ja revelado ao rolar nao pode reanimar quando a classe .reveal sai', () => {
  assert.match(css, /\.revealed\s*\{[^}]*animation:\s*none\s*!important/);
});
