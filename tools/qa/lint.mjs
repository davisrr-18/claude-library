// Linter de JS (eslint, regras recomendadas + algumas extras). Sai com 1 se houver qualquer achado.
import { ESLint } from 'eslint';
import js from '@eslint/js';
import globals from 'globals';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const P = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const eslint = new ESLint({
  cwd: P,
  overrideConfigFile: true,
  overrideConfig: [
    js.configs.recommended,
    { files: ['js/**/*.js'], languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: { ...globals.browser } } },
    { files: ['scripts/**/*.mjs', 'tests/**/*.mjs'], languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: { ...globals.node } } },
    {
      rules: {
        'no-unused-vars': ['warn', { args: 'after-used', caughtErrors: 'none' }],
        'no-empty': ['warn', { allowEmptyCatch: true }],
        'no-shadow': 'warn',
        eqeqeq: ['warn', 'always', { null: 'ignore' }], // `x == null` é intencional
        'no-var': 'warn',
        'prefer-const': 'warn',
        'no-self-compare': 'warn',
        'no-unreachable-loop': 'warn',
        // Intencionais: a sanitização rejeita caracteres de controle (java\0script) de propósito.
        'no-control-regex': 'off',
        // Falso positivo: cada entrada de entries é atribuída uma única vez, sem estado compartilhado.
        'require-atomic-updates': 'off',
      },
    },
  ],
});
const results = await eslint.lintFiles(['js/**/*.js', 'scripts/**/*.mjs', 'tests/**/*.mjs']);
let n = 0;
for (const r of results) {
  for (const m of r.messages) {
    n++;
    console.log(`${r.filePath.replace(`${P}/`, '')}:${m.line}:${m.column} ${m.ruleId}: ${m.message}`);
  }
}
console.log(n ? `\n${n} achado(s) em ${results.length} arquivos` : `Lint OK: ${results.length} arquivos, nenhum achado`);
process.exit(n ? 1 : 0);
