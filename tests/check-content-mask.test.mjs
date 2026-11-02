import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkContent } from '../scripts/check-content.mjs';

function project(mdBody) {
  const root = mkdtempSync(join(tmpdir(), 'claude-library-mask-'));
  mkdirSync(join(root, 'content', 'basicas', 'a'), { recursive: true });
  writeFileSync(join(root, 'content', 'manifest.json'), JSON.stringify({
    tiers: [
      { id: 'basicas', title: 'B', cards: [{ id: 'a', title: 'A', pieces: [{ type: 'skill', title: 'S', file: 'basicas/a/skill.md' }] }] },
      { id: 'intermediarias', title: 'I', cards: [] },
      { id: 'complexas', title: 'C', cards: [] },
    ],
  }));
  writeFileSync(join(root, 'content', 'basicas', 'a', 'skill.md'), mdBody);
  return root;
}

test('segredos sao mascarados na mensagem de erro (o log nao pode vazar o valor)', () => {
  const ghp = 'ghp_' + 'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8';
  const sk = 'sk-' + 'abcdefghijklmnopqrstuvwxyz0123456789';
  const root = project(`token ${ghp} e chave ${sk}\n`);
  try {
    const { errors } = checkContent(root);
    const text = errors.join('\n');
    assert.match(text, /token-github/);
    assert.match(text, /chave-sk/);
    assert.ok(!text.includes(ghp), 'token completo vazou na saida');
    assert.ok(!text.includes(sk), 'chave completa vazou na saida');
    assert.match(text, /ghp_\*{3}/);
    assert.match(text, /sk-\*{3}/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('e-mail e caminho pessoal continuam visiveis para facilitar a correcao', () => {
  const root = project('contato: fulano@example.com em /home/fulano/projeto\n');
  try {
    const text = checkContent(root).errors.join('\n');
    assert.match(text, /fulano@example\.com/);
    assert.match(text, /\/home\/fulano/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
