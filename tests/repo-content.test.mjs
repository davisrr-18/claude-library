import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkContent } from '../scripts/check-content.mjs';

// O mesmo que `npm run check` (sem a identidade do autor, que depende da máquina):
// manifest válido, arquivos presentes e nenhum dado sensível nos arquivos do projeto.
test('o conteudo real do repositorio passa na verificacao', () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  assert.deepEqual(checkContent(root).errors, []);
});
