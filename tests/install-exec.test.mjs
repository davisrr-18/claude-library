import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildInstall, extractArtifact, installTarget } from '../js/install.js';
import { parseFrontMatter } from '../js/content.js';

// Executa DE VERDADE os comandos gerados (bash e, se existir, PowerShell) e compara os arquivos criados
// com o conteúdo original. Texto "que parece certo" não prova que o shell o interpreta corretamente.
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const base = mkdtempSync(join(tmpdir(), 'claude-library-install-'));
after(() => rmSync(base, { recursive: true, force: true }));

const has = (cmd) => spawnSync(cmd, ['--version'], { stdio: 'ignore' }).status === 0;
const HAS_BASH = has('bash');
const POWERSHELL = ['pwsh', 'powershell'].find(has);

/** Arquivos instaláveis do conteúdo real do site (os que declaram `destino` com caminho). */
function realFiles() {
  const manifest = JSON.parse(readFileSync(join(ROOT, 'content/manifest.json'), 'utf8'));
  const out = [];
  for (const t of manifest.tiers) for (const c of t.cards) for (const p of c.pieces) {
    const { meta, body } = parseFrontMatter(readFileSync(join(ROOT, 'content', p.file), 'utf8'));
    const path = installTarget(meta.destino);
    const content = path ? extractArtifact(body) : null;
    if (path && content) out.push({ path, content });
  }
  return out;
}

/** Hostis de propósito: tudo que um shell costuma interpretar. */
const NASTY = [
  { path: 'nasty/dollar.md', content: 'valor $HOME e ${PATH} e $(echo pwned) e `echo pwned` e \\n e \\\\' },
  { path: 'nasty/quotes.md', content: `aspas simples ' e duplas " e '' e "" e '"'"'` },
  { path: 'nasty/eof.md', content: 'antes\nCLAUDE_LIBRARY_EOF\ndepois\nCLAUDE_LIBRARY_EOF_2\nfim' },
  { path: 'nasty/ps.md', content: "linha\n'@ parece fim de here-string\n@'\nfim" },
  { path: 'nasty/unicode.md', content: 'Revisão espaçada ✓ 日本語 😀 — “aspas curvas”' },
  { path: 'nasty/blank.md', content: '\n\nlinhas em branco no comeco\n\n\ne no meio\n\n' },
  { path: 'nasty/fences.md', content: '````markdown\n```\ninterno\n```\n````\n```bash\nrm -rf /\n```' },
  { path: 'nasty/hash.md', content: '# titulo\n#!/bin/sh\n! history\n~ til' },
];

const expected = (content) => content.replace(/\s+$/, '') ? content : content; // o conteúdo exato, como está

function listAll(dir, prefix = '') {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? listAll(join(dir, e.name), `${prefix}${e.name}/`) : [`${prefix}${e.name}`]);
}

for (const [label, files] of [['pacote real do site', realFiles()], ['conteudo hostil a shells', NASTY]]) {
  test(`bash executa os comandos (${label}) e cria arquivos identicos ao original`, { skip: !HAS_BASH }, () => {
    assert.ok(files.length > 0);
    const dir = mkdtempSync(join(base, 'bash-'));
    const script = buildInstall('linux', files);
    const r = spawnSync('bash', ['-c', script], { cwd: dir, encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    assert.equal(r.stdout + r.stderr, '', 'o script nao pode imprimir nada nem executar o conteudo (ex.: $(echo pwned))');
    assert.deepEqual(listAll(dir).sort(), files.map((f) => f.path).sort());
    for (const f of files) {
      // o heredoc termina o arquivo com uma quebra de linha; fora isso, byte a byte
      assert.equal(readFileSync(join(dir, f.path), 'utf8'), f.content + '\n', f.path);
    }
  });

  test(`zsh/macOS: o mesmo script funciona no zsh (${label})`, { skip: !has('zsh') }, () => {
    const dir = mkdtempSync(join(base, 'zsh-'));
    const r = spawnSync('zsh', ['-c', buildInstall('macos', files)], { cwd: dir, encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    for (const f of files) assert.equal(readFileSync(join(dir, f.path), 'utf8'), f.content + '\n', f.path);
  });

  test(`PowerShell executa os comandos (${label}) e cria arquivos identicos, sem BOM`, { skip: !POWERSHELL }, () => {
    const dir = mkdtempSync(join(base, 'ps-'));
    const scriptFile = join(base, `script-${Math.random().toString(36).slice(2)}.ps1`);
    writeFileSync(scriptFile, buildInstall('windows', files));
    const r = spawnSync(POWERSHELL, ['-NoProfile', '-NonInteractive', '-File', scriptFile], { cwd: dir, encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr + r.stdout);
    for (const f of files) {
      const buf = readFileSync(join(dir, f.path));
      assert.notDeepEqual([...buf.subarray(0, 3)], [0xef, 0xbb, 0xbf], `BOM em ${f.path}`);
      assert.equal(buf.toString('utf8'), f.content + '\n', f.path);
    }
  });
}

test('o conteudo hostil nunca e executado: nenhum arquivo extra aparece fora das pastas do pacote', { skip: !HAS_BASH }, () => {
  const dir = mkdtempSync(join(base, 'bash-hostil-'));
  spawnSync('bash', ['-c', buildInstall('linux', NASTY)], { cwd: dir, encoding: 'utf8' });
  assert.deepEqual(readdirSync(dir), ['nasty']);
});

test('aviso: se bash/PowerShell nao existem nesta maquina, os testes correspondentes sao pulados (nao falham)', () => {
  assert.ok(typeof HAS_BASH === 'boolean');
  assert.ok(existsSync(base) && statSync(base).isDirectory());
});
