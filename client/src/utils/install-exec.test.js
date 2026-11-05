// @vitest-environment node
import { test, afterAll } from 'vitest';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildInstall, installFile } from './install.js';
import { parseFrontMatter } from './content.js';

// Executa DE VERDADE os comandos gerados (bash e, se existir, PowerShell) e compara os arquivos criados
// com o conteúdo original. Texto "que parece certo" não prova que o shell o interpreta corretamente.
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const base = mkdtempSync(join(tmpdir(), 'claude-library-install-'));
afterAll(() => rmSync(base, { recursive: true, force: true }));

const has = (cmd) => spawnSync(cmd, ['--version'], { stdio: 'ignore' }).status === 0;
const HAS_BASH = has('bash');
const POWERSHELL = ['pwsh', 'powershell'].find(has);

/** Arquivos instaláveis de cada card do conteúdo real (os que declaram `destino` com caminho). Um card por vez:
 *  cada pacote vai para um projeto próprio, então destinos iguais entre cards (CLAUDE.md) não colidem. */
function realPackages() {
  const manifest = JSON.parse(readFileSync(join(ROOT, 'content/manifest.json'), 'utf8'));
  const out = [];
  for (const t of manifest.tiers)
    for (const c of t.cards) {
      const files = [];
      for (const p of c.pieces) {
        const { meta, body } = parseFrontMatter(readFileSync(join(ROOT, 'content', p.file), 'utf8'));
        const file = installFile(p, meta, body);
        if (file) files.push(file);
      }
      if (files.length) out.push([`pacote real do site: ${c.id}`, files]);
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

function listAll(dir, prefix = '') {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? listAll(join(dir, e.name), `${prefix}${e.name}/`) : [`${prefix}${e.name}`],
  );
}

for (const [label, files] of [...realPackages(), ['conteudo hostil a shells', NASTY]]) {
  test.skipIf(!HAS_BASH)(`bash executa os comandos (${label}) e cria arquivos identicos ao original`, () => {
    assert.ok(files.length > 0);
    const dir = mkdtempSync(join(base, 'bash-'));
    const script = buildInstall('linux', files);
    // O script vai pela entrada padrão (-s), não como argumento (-c): no Windows a linha de comando reescreve
    // aspas e barras invertidas e corromperia o script (o teste falharia sem o comando estar errado).
    const r = spawnSync('bash', ['-s'], { cwd: dir, input: script, encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    assert.equal(
      r.stdout + r.stderr,
      '',
      'o script nao pode imprimir nada nem executar o conteudo (ex.: $(echo pwned))',
    );
    assert.deepEqual(listAll(dir).sort(), files.map((f) => f.path).sort());
    for (const f of files) {
      // o heredoc termina o arquivo com uma quebra de linha; fora isso, byte a byte
      assert.equal(readFileSync(join(dir, f.path), 'utf8'), f.content + '\n', f.path);
    }
  });

  test.skipIf(!has('zsh'))(`zsh/macOS: o mesmo script funciona no zsh (${label})`, () => {
    const dir = mkdtempSync(join(base, 'zsh-'));
    const r = spawnSync('zsh', ['-s'], { cwd: dir, input: buildInstall('macos', files), encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    for (const f of files) assert.equal(readFileSync(join(dir, f.path), 'utf8'), f.content + '\n', f.path);
  });

  test.skipIf(!POWERSHELL)(
    `PowerShell executa os comandos (${label}) e cria arquivos identicos, sem BOM`,
    () => {
      const dir = mkdtempSync(join(base, 'ps-'));
      const scriptFile = join(base, `script-${Math.random().toString(36).slice(2)}.ps1`);
      writeFileSync(scriptFile, buildInstall('windows', files));
      const r = spawnSync(POWERSHELL, ['-NoProfile', '-NonInteractive', '-File', scriptFile], {
        cwd: dir,
        encoding: 'utf8',
      });
      assert.equal(r.status, 0, r.stderr + r.stdout);
      for (const f of files) {
        const buf = readFileSync(join(dir, f.path));
        assert.notDeepEqual([...buf.subarray(0, 3)], [0xef, 0xbb, 0xbf], `BOM em ${f.path}`);
        assert.equal(buf.toString('utf8'), f.content + '\n', f.path);
      }
    },
  );
}

test.skipIf(!HAS_BASH)('o bash cria o arquivo mesmo se ja existir (sobrescreve)', () => {
  const dir = mkdtempSync(join(base, 'bash-overwrite-'));
  writeFileSync(join(dir, 'CLAUDE.md'), 'regras antigas\n');
  const files = [{ path: 'CLAUDE.md', content: '## Nova' }];
  const r = spawnSync('bash', ['-s'], { cwd: dir, input: buildInstall('linux', files), encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(readFileSync(join(dir, 'CLAUDE.md'), 'utf8'), '## Nova\n');
});

test.skipIf(!HAS_BASH)(
  'o conteudo hostil nunca e executado: nenhum arquivo extra aparece fora das pastas do pacote',
  () => {
    const dir = mkdtempSync(join(base, 'bash-hostil-'));
    spawnSync('bash', ['-s'], { cwd: dir, input: buildInstall('linux', NASTY), encoding: 'utf8' });
    assert.deepEqual(readdirSync(dir), ['nasty']);
  },
);

test('aviso: se bash/PowerShell nao existem nesta maquina, os testes correspondentes sao pulados (nao falham)', () => {
  assert.ok(typeof HAS_BASH === 'boolean');
  assert.ok(existsSync(base) && statSync(base).isDirectory());
});
