import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const base = mkdtempSync(join(tmpdir(), 'claude-library-cli-'));
after(() => rmSync(base, { recursive: true, force: true }));

/** Mini projeto com a CLI real, o validador e um card. `skillText` é o conteúdo da peça. */
function makeProject(name, skillText) {
  const root = join(base, name);
  for (const dir of ['scripts', 'js', 'content/basicas/a']) mkdirSync(join(root, dir), { recursive: true });
  copyFileSync(join(REPO, 'scripts/check-content.mjs'), join(root, 'scripts/check-content.mjs'));
  copyFileSync(join(REPO, 'js/content.js'), join(root, 'js/content.js'));
  writeFileSync(join(root, 'package.json'), '{"type":"module"}\n');
  writeFileSync(join(root, 'content/manifest.json'), JSON.stringify({
    tiers: [
      { id: 'basicas', title: 'B', cards: [{ id: 'a', title: 'A', pieces: [{ type: 'skill', title: 'S', file: 'basicas/a/skill.md' }] }] },
      { id: 'intermediarias', title: 'I', cards: [] },
      { id: 'complexas', title: 'C', cards: [] },
    ],
  }));
  writeFileSync(join(root, 'content/basicas/a/skill.md'), skillText);
  return root;
}

const run = (script) => spawnSync(process.execPath, [script], { encoding: 'utf8', env: { ...process.env, GIT_CONFIG_GLOBAL: '/nonexistent', GIT_CONFIG_NOSYSTEM: '1' } });

test('CLI direta: conteudo limpo -> OK e codigo 0', () => {
  const root = makeProject('limpo', '# ok\n');
  const r = run(join(root, 'scripts/check-content.mjs'));
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /OK/);
});

test('CLI direta: e-mail no conteudo -> erro e codigo 1', () => {
  const root = makeProject('sujo', 'fale com fulano@example.com\n');
  const r = run(join(root, 'scripts/check-content.mjs'));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /email/);
});

test('CLI via LINK SIMBOLICO nao pode passar em silencio (falha aberta)', () => {
  const root = makeProject('real-sujo', 'fale com fulano@example.com\n');
  const link = join(base, 'link-sujo');
  symlinkSync(root, link);
  const r = run(join(link, 'scripts/check-content.mjs'));
  assert.equal(r.status, 1, `deveria falhar; stdout=${JSON.stringify(r.stdout)} stderr=${JSON.stringify(r.stderr)}`);
  assert.match(r.stderr, /email/);
});

test('CLI via link simbolico com conteudo limpo -> OK e codigo 0', () => {
  const root = makeProject('real-limpo', '# ok\n');
  const link = join(base, 'link-limpo');
  symlinkSync(root, link);
  const r = run(join(link, 'scripts/check-content.mjs'));
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /OK/);
});
