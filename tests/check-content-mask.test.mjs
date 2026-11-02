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

// Valores falsos montados por concatenação: o literal completo não aparece neste arquivo.
const SECRET_FIXTURES = [
  { rule: 'chave-aws', prefix: 'AKIA***', value: 'AKIA' + 'ABCD1234EFGH5678' },
  { rule: 'token-jwt', prefix: 'eyJ***', value: ['eyJhbGciOiJIUzI1NiJ9', 'eyJzdWIiOiJmdWxhbm8ifQ', 'c2lnbmF0dXJhLWZpY3RpY2lh'].join('.') },
  { rule: 'token-github', prefix: 'ghu_***', value: 'ghu_' + 'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8' },
  { rule: 'token-github-pat', prefix: 'github_pat_***', value: 'github_pat_' + 'A1_'.repeat(8) },
  { rule: 'token-slack', prefix: 'xoxb-***', value: 'xoxb-' + '1234567890-abcdef' },
  { rule: 'chave-google', prefix: 'AIza***', value: 'AIza' + 'Ab_-1'.repeat(7) },
  { rule: 'chave-stripe', prefix: 'sk_live_***', value: 'sk_live_' + 'a1'.repeat(8) },
];

test('segredos novos sao mascarados e o valor completo nunca aparece na saida', () => {
  const body = SECRET_FIXTURES.map((f) => `${f.rule}: ${f.value}`).join('\n') + '\n';
  const root = project(body);
  try {
    const { errors } = checkContent(root);
    const text = errors.join('\n');
    for (const { rule, prefix, value } of SECRET_FIXTURES) {
      assert.ok(!text.includes(value), `${rule}: valor completo vazou na saida`);
      assert.ok(text.includes(`${rule}: ${prefix}`), `${rule}: prefixo mascarado ausente\n${text}`);
    }
    assert.equal(errors.length, SECRET_FIXTURES.length, text);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('credencial em URL mostra so https://*** e o e-mail dentro dela nao e reportado de novo', () => {
  const root = project('veja http://fulano:senha@example.com/x agora\n');
  try {
    const { errors } = checkContent(root);
    assert.equal(errors.length, 1, errors.join('\n'));
    assert.equal(errors[0].split(': ')[1], 'credencial-url', errors[0]);
    assert.match(errors[0], /http:\/\/\*\*\*/);
    const text = errors.join('\n');
    assert.ok(!text.includes('senha'), 'senha vazou na saida');
    assert.ok(!text.includes('example.com'), 'host vazou na saida');
    assert.ok(!text.includes(': email:'), 'trecho coberto pela credencial foi reportado como email');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('CPF, caminhos Windows e /root continuam visiveis', () => {
  const root = project('CPF 123.456.789-09, C:\\Users\\fulano\\x e /root/.ssh\n');
  try {
    const text = checkContent(root).errors.join('\n');
    assert.match(text, /cpf: 123\.456\.789-09/);
    assert.match(text, /caminho-pessoal: C:\\Users\\fulano/);
    assert.match(text, /caminho-pessoal: \/root\//);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
