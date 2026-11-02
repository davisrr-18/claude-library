import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findSensitive } from '../scripts/check-content.mjs';

// Regressão: a regex de e-mail era quadrática (cada posição varria o trecho até o fim). Um bloco
// base64 grande num arquivo do projeto fazia o `npm run check` levar minutos. Agora é linear.
const timed = (text) => {
  const t0 = performance.now();
  const result = findSensitive(text);
  return { ms: performance.now() - t0, result };
};
const LIMIT_MS = 1000; // folga enorme: o tempo linear real é de dezenas de ms

for (const [nome, texto] of Object.entries({
  'letras e digitos seguidos (base64)': 'aB3'.repeat(40000),
  'letras e pontos': 'a.'.repeat(50000),
  'prefixos de e-mail sem arroba': 'user.name+tag'.repeat(10000),
  'muitos arrobas': 'a@'.repeat(50000),
  'dominio com muitos rotulos': 'a@' + 'b.'.repeat(50000),
  'caminho longo': '/home/' + 'a'.repeat(100000),
  'token github parcial': 'ghp_' + 'a'.repeat(100000),
  'URL com muitos dois-pontos': 'http://' + 'a:'.repeat(50000),
  'cabecalho PEM sem fim': '-----BEGIN ' + 'A '.repeat(50000),
})) {
  test(`findSensitive e linear: ${nome}`, () => {
    const { ms } = timed(texto);
    assert.ok(ms < LIMIT_MS, `levou ${ms.toFixed(0)} ms (limite ${LIMIT_MS} ms)`);
  });
}

test('o e-mail continua sendo encontrado no meio de texto longo e depois de pontuacao', () => {
  const texto = 'x'.repeat(50000) + ' contato: fulano.silva+tag@sub.example.com.br, outro@example.org\n' + 'y'.repeat(50000);
  const { result } = timed(texto);
  assert.deepEqual(result.filter((r) => r.rule === 'email').map((r) => r.match), ['fulano.silva+tag@sub.example.com.br', 'outro@example.org']);
});
