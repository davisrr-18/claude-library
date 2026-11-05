import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync, execFileSync } from 'node:child_process';
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
  for (const dir of ['scripts', 'client/src/utils', 'content/basicas/a']) mkdirSync(join(root, dir), { recursive: true });
  copyFileSync(join(REPO, 'scripts/check-content.mjs'), join(root, 'scripts/check-content.mjs'));
  copyFileSync(join(REPO, 'client/src/utils/content.js'), join(root, 'client/src/utils/content.js'));
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

test('importar o modulo nao executa a CLI, mesmo com argv[1] invalido (nao falha aberto nem roda sem querer)', () => {
  const root = makeProject('importado', 'fale com fulano@example.com\n');
  const wrapper = join(base, 'wrapper.mjs');
  writeFileSync(wrapper, `process.argv[1] = '/caminho/que/nao/existe.mjs';\nawait import(${JSON.stringify('file://' + join(root, 'scripts/check-content.mjs'))});\n`);
  const r = run(wrapper);
  assert.equal(r.stdout, '', 'a CLI rodou ao importar: ' + r.stdout);
  assert.equal(r.stderr, '');
  assert.equal(r.status, 0);
});

const hasGit = (() => { try { execFileSync('git', ['--version'], { stdio: 'ignore' }); return true; } catch { return false; } })();

test('em repositorio git, arquivos ignorados (.gitignore) nao sao varridos; os rastreados sao', { skip: !hasGit }, () => {
  const root = makeProject('com-git', '# ok\n');
  mkdirSync(join(root, '.claude'), { recursive: true });
  writeFileSync(join(root, '.gitignore'), '.claude/\n*.local\n');
  writeFileSync(join(root, '.claude/settings.md'), 'fale com fulano@example.com\n'); // ignorado
  writeFileSync(join(root, 'notas.local'), 'fale com fulano@example.com\n'); // ignorado
  writeFileSync(join(root, 'publico.md'), 'fale com outro@example.org\n'); // nao ignorado
  const env = { ...process.env, GIT_CONFIG_GLOBAL: '/nonexistent', GIT_CONFIG_NOSYSTEM: '1' };
  execFileSync('git', ['init', '-q'], { cwd: root, env });
  const r = spawnSync(process.execPath, [join(root, 'scripts/check-content.mjs')], { encoding: 'utf8', env });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /publico\.md: email: outro@example\.org/);
  assert.doesNotMatch(r.stderr, /settings\.md|notas\.local/);
});
