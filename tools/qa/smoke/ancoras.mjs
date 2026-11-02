// Abrir direto com hash de ancora (#main) nao pode travar no esqueleto "Carregando".
import { JSDOM } from 'jsdom';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs'; import path from 'node:path';
const ROOT = process.env.APP_ROOT || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
let failed = 0; const check = (n, c, x = '') => { console.log(`${c ? 'OK  ' : 'FAIL'} ${n} ${c ? '' : x}`); if (!c) failed++; };
for (const start of ['#main', '#qualquer-coisa', '#/']) {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').replace(/<script[\s\S]*?<\/script>/g, '');
  const dom = new JSDOM(html, { url: 'http://localhost:8000/' + start, pretendToBeVisual: true });
  const w = dom.window; w.scrollTo = () => {};
  Object.assign(globalThis, { document: w.document, window: w, location: w.location, HTMLElement: w.HTMLElement, Node: w.Node, localStorage: w.localStorage,
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    fetch: async (url) => { const f = path.join(ROOT, decodeURIComponent(String(url))); const b = fs.readFileSync(f, 'utf8'); return { ok: true, status: 200, text: async () => b, json: async () => JSON.parse(b) }; } });
  await import(path.join(ROOT, 'js/app.js') + '?' + Math.random());
  await new Promise((r) => setTimeout(r, 350));
  check(`abrir com ${start}: renderiza a Home (sem esqueleto preso)`, !!w.document.querySelector('.hero') && !w.document.querySelector('.skeleton'), w.document.querySelector('main').innerHTML.slice(0, 120));
  check(`abrir com ${start}: hash normalizado para #/`, w.location.hash === '#/' , w.location.hash);
}
console.log(failed ? `\n${failed} FALHA(S)` : '\nTudo OK'); process.exit(failed ? 1 : 0);
