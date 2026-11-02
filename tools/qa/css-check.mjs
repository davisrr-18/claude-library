// CSS: sintaxe (css-tree) e custom properties. Sai com 1 se houver erro de parse, var() sem definição
// ou custom property definida e nunca usada.
import * as csstree from 'css-tree';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const P = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const css = fs.readFileSync(path.join(P, 'css/style.css'), 'utf8');
const problems = [];

csstree.parse(css, { positions: true, onParseError: (e) => problems.push(`parse ${e.line}:${e.column} ${e.message}`) });

// Propriedades e valores segundo a gramática. Limitações conhecidas do css-tree, ignoradas:
// valores com var() ("Matching for a tree with var()") e os descritores de @property.
const ast = csstree.parse(css, { positions: true });
const IGNORED_PROPS = new Set(['syntax', 'inherits', 'initial-value']);
csstree.walk(ast, { visit: 'Declaration', enter(node) {
  if (node.property.startsWith('--') || IGNORED_PROPS.has(node.property)) return;
  const r = csstree.lexer.matchProperty(node.property, node.value);
  if (r.error && !/var\(\)/.test(r.error.message)) problems.push(`css ${node.loc.start.line}: ${node.property}: ${r.error.message.split('\n')[0]}`);
} });

const defined = new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
const used = new Set([...css.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]));
const jsText = fs.readdirSync(path.join(P, 'js')).filter((f) => f.endsWith('.js'))
  .map((f) => fs.readFileSync(path.join(P, 'js', f), 'utf8')).join('\n');
const setByJs = new Set([...jsText.matchAll(/setProperty\('(--[\w-]+)'/g)].map((m) => m[1]).concat([...jsText.matchAll(/`(--[\w-]+):/g)].map((m) => m[1])));
for (const v of used) if (!defined.has(v) && !setByJs.has(v)) problems.push(`var(${v}) sem definição`);
for (const v of defined) if (!used.has(v) && !setByJs.has(v)) problems.push(`${v} definida e nunca usada`);

console.log(problems.length ? problems.join('\n') + `\n\n${problems.length} problema(s) no CSS` : 'CSS OK: sem erro de sintaxe, var() sem definição ou custom property sobrando');
process.exit(problems.length ? 1 : 0);
