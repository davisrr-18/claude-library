#!/usr/bin/env node
// Monta a pasta do site publicável (padrão: dist/): SÓ a lista de permissão, nunca a raiz do repositório.
// Recusa construir se a verificação de conteúdo achar dado sensível ou se faltar algo que o site usa.
// Multiplataforma (Node puro). Uso: node scripts/build-site.mjs [pasta-de-saida]
import { cpSync, copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, rmSync, statSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkContent } from './check-content.mjs';

/** O que vai para o ar. tests/, docs/, tools/, scripts/, deploy/, .git e .github NUNCA entram. */
export const SITE_ENTRIES = ['index.html', 'css', 'js', 'vendor', 'content'];
const HEADERS_SOURCE = 'deploy/_headers';
const EXTERNAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i;

const toPosix = (p) => p.split(sep).join('/');
const isInside = (base, target) => {
  const rel = relative(base, target);
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
};

function listFiles(dir, prefix = '') {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? listFiles(join(dir, e.name), `${prefix}${e.name}/`) : [`${prefix}${e.name}`]).sort();
}

const looksBuilt = (out) => existsSync(join(out, '_headers')) && existsSync(join(out, 'index.html')) && existsSync(join(out, 'content', 'manifest.json'));
const isEmptyDir = (out) => statSync(out).isDirectory() && readdirSync(out).length === 0;

/**
 * A pasta de saída é APAGADA antes do build, então só é aceita se não puder ser algo importante:
 * não pode ser a raiz do projeto, um ancestral dela, uma pasta do site nem um arquivo; e precisa não existir,
 * estar vazia ou parecer um build anterior (tem _headers, index.html e content/manifest.json).
 */
function assertSafeOutput(root, out) {
  const bad = (why) => { throw new Error(`saída inválida (${out}): ${why}`); };
  if (dirname(out) === out) bad('é a raiz do sistema de arquivos');
  if (out === root) bad('é a raiz do projeto');
  if (isInside(out, root)) bad('contém a raiz do projeto');
  for (const entry of SITE_ENTRIES) {
    if (isInside(join(root, entry), out)) bad(`está dentro de ${entry}, que faz parte do site`);
  }
  if (existsSync(out) && !isEmptyDir(out) && !looksBuilt(out)) {
    bad('a pasta não está vazia e não parece um build anterior; escolha outra ou esvazie-a');
  }
}

/** Arquivos que o index.html referencia por caminho local precisam existir E estar na lista de permissão. */
function assertIndexAssetsPublished(root) {
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  for (const m of html.matchAll(/\b(?:href|src)\s*=\s*"([^"]*)"/g)) {
    const ref = m[1].trim();
    if (!ref || EXTERNAL.test(ref)) continue;
    const clean = ref.split(/[?#]/)[0];
    const first = clean.split('/')[0];
    const target = resolve(root, clean);
    if (!SITE_ENTRIES.includes(first) || !existsSync(target)) {
      throw new Error(`index.html referencia "${ref}", que não está no site publicado (só ${SITE_ENTRIES.join(', ')})`);
    }
  }
}

/**
 * Constrói o site em `outDir` a partir de `rootDir`. Devolve { files } (caminhos relativos, com "/").
 * Lança erro (sem escrever nada) se a saída for perigosa, faltar algo ou o conteúdo tiver dado sensível.
 */
export function buildSite(rootDir, outDir) {
  const root = resolve(rootDir);
  const out = resolve(outDir);
  assertSafeOutput(root, out);

  for (const entry of SITE_ENTRIES) {
    if (!existsSync(join(root, entry))) throw new Error(`falta ${entry}, que faz parte do site`);
  }
  if (!existsSync(join(root, HEADERS_SOURCE))) throw new Error(`falta ${HEADERS_SOURCE}`);
  assertIndexAssetsPublished(root);

  // Portão de segurança: o Cloudflare publica a cada push mesmo se o CI falhar, então o build também verifica.
  // (A identidade do autor só é procurada na máquina do autor, por `npm run check`.)
  const { errors } = checkContent(root);
  if (errors.length) throw new Error(`dado sensível ou conteúdo inválido, nada foi publicado:\n${errors.map((e) => `  ${e}`).join('\n')}`);

  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  for (const entry of SITE_ENTRIES) cpSync(join(root, entry), join(out, entry), { recursive: true });
  copyFileSync(join(root, HEADERS_SOURCE), join(out, '_headers'));
  return { files: listFiles(out).map(toPosix) };
}

function runsAsScript() {
  if (process.argv[1] === undefined) return false;
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return resolve(process.argv[1]) === fileURLToPath(import.meta.url);
  }
}

if (runsAsScript()) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const out = resolve(process.argv[2] ?? join(root, 'dist'));
  try {
    const { files } = buildSite(root, out);
    console.log(`Site montado em ${relative(process.cwd(), out) || '.'}: ${files.length} arquivos (${SITE_ENTRIES.join(', ')} + _headers).`);
  } catch (err) {
    console.error(`ERRO: ${err.message}`);
    process.exitCode = 1;
  }
}
