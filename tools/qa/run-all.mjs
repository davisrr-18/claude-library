// Roda toda a verificação de qualidade que NÃO é teste unitário (esses ficam em `npm test`, na raiz):
// linter, CSS, fuzz, testes de fumaça com DOM simulado (conteúdo real e fixtures) e estresse com 300 cards.
// Uso: node run-all.mjs [filtro]   (ex.: `node run-all.mjs smoke` roda só os que têm "smoke" no nome)
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeBigContent } from './lib/big-fixture.mjs';

const QA = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(QA, '../..');
const filter = process.argv[2] ?? '';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-library-qa-'));
process.on('exit', () => fs.rmSync(tmp, { recursive: true, force: true }));

/** Cópia do site (código atual) em pasta temporária, com o conteúdo escolhido por `fillContent(dir)`. */
function site(name, fillContent) {
  const dir = path.join(tmp, name);
  for (const d of ['js', 'css', 'vendor']) fs.cpSync(path.join(ROOT, d), path.join(dir, d), { recursive: true });
  fs.copyFileSync(path.join(ROOT, 'index.html'), path.join(dir, 'index.html'));
  fillContent(dir);
  return dir;
}
const simple = () => site('simples', (dir) => fs.cpSync(path.join(QA, 'fixtures/conteudo-simples/content'), path.join(dir, 'content'), { recursive: true }));
const threeCards = () => site('tres-cards', (dir) => {
  fs.cpSync(path.join(QA, 'fixtures/conteudo-simples/content'), path.join(dir, 'content'), { recursive: true });
  fs.copyFileSync(path.join(QA, 'fixtures/manifest-3-cards.json'), path.join(dir, 'content/manifest.json'));
});
const big = () => site('grande', (dir) => makeBigContent(dir));

// nome, script, onde roda (undefined = conteúdo real do projeto), tempo máximo em segundos
const STEPS = [
  ['lint', 'lint.mjs'],
  ['css', 'css-check.mjs'],
  ['fuzz', 'fuzz.mjs', undefined, 280],
  ['smoke/ancoras', 'smoke/ancoras.mjs'],
  ['smoke/estudos', 'smoke/estudos.mjs'],
  ['smoke/instalacao', 'smoke/instalacao.mjs'],
  ['smoke/geral', 'smoke/geral.mjs', simple],
  ['smoke/abas', 'smoke/abas.mjs', simple],
  ['smoke/filtros', 'smoke/filtros.mjs', threeCards],
  ['estresse (300 cards)', 'stress.mjs', big, 280],
];

const results = [];
for (const [name, script, makeSite, timeout = 120] of STEPS) {
  if (filter && !name.includes(filter)) continue;
  const t0 = Date.now();
  const env = { ...process.env };
  if (makeSite) env.APP_ROOT = makeSite();
  else delete env.APP_ROOT;
  const r = spawnSync(process.execPath, [path.join(QA, script)], { env, encoding: 'utf8', timeout: timeout * 1000 });
  const ok = r.status === 0;
  results.push({ name, ok, secs: ((Date.now() - t0) / 1000).toFixed(1) });
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name} (${results.at(-1).secs}s)`);
  if (!ok) {
    const out = `${r.stdout}\n${r.stderr}`.split('\n').filter((l) => /FAIL|FALHA|PROBLEMA|achado|problema|Error|\.mjs:|\.js:/.test(l));
    console.log((out.length ? out : (r.stdout + r.stderr).split('\n').slice(-12)).slice(0, 25).map((l) => `     ${l}`).join('\n'));
    if (r.error) console.log(`     ${r.error.message}`);
  }
}
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} verificações passaram${failed.length ? `; falharam: ${failed.map((f) => f.name).join(', ')}` : ''}.`);
process.exit(failed.length ? 1 : 0);
