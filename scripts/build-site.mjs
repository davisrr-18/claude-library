#!/usr/bin/env node
// Monta a pasta do site publicável (padrão: dist/) a partir da build do client (client/dist) mais o _headers.
// Recusa construir se a build não existir ou estiver desatualizada em relação a content/, ou se a verificação de
// conteúdo achar dado sensível. Multiplataforma (Node puro). Uso: node scripts/build-site.mjs [pasta-de-saida]
// (`npm run build:site` roda a build do client antes.)
import { cpSync, copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, rmSync, statSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkContent } from './check-content.mjs';

/** De onde vem o site: a saída do Vite. Só o que o Vite gera (HTML, assets e content/) vai para o ar. */
export const SITE_SOURCE = 'client/dist';
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
 * não pode ser a raiz do projeto, um ancestral dela, a pasta da build do client, nem um arquivo; e precisa não
 * existir, estar vazia ou parecer um build anterior (tem _headers, index.html e content/manifest.json).
 */
function assertSafeOutput(root, out) {
  const bad = (why) => { throw new Error(`saída inválida (${out}): ${why}`); };
  if (dirname(out) === out) bad('é a raiz do sistema de arquivos');
  if (out === root) bad('é a raiz do projeto');
  if (isInside(out, root)) bad('contém a raiz do projeto');
  const source = join(root, SITE_SOURCE);
  if (isInside(source, out) || isInside(out, source)) bad(`se sobrepõe a ${SITE_SOURCE}, de onde o site é copiado`);
  for (const protectedDir of ['client/src', 'client/vendor', 'content', 'deploy', 'scripts', 'tests', 'docs', '.github']) {
    if (isInside(join(root, protectedDir), out)) bad(`está dentro de ${protectedDir}, que faz parte do projeto`);
  }
  if (existsSync(out) && !isEmptyDir(out) && !looksBuilt(out)) {
    bad('a pasta não está vazia e não parece um build anterior; escolha outra ou esvazie-a');
  }
}

/** Arquivos que o index.html referencia por caminho local precisam existir dentro da build. */
function assertIndexAssetsPublished(source) {
  const html = readFileSync(join(source, 'index.html'), 'utf8');
  for (const m of html.matchAll(/\b(?:href|src)\s*=\s*"([^"]*)"/g)) {
    const ref = m[1].trim();
    if (!ref || EXTERNAL.test(ref)) continue;
    const target = resolve(source, ref.split(/[?#]/)[0]);
    if (!isInside(source, target) || !existsSync(target)) {
      throw new Error(`index.html referencia "${ref}", que não está na build (${SITE_SOURCE})`);
    }
  }
}

/** A build precisa ter exatamente o content/ atual: uma build velha publicaria conteúdo desatualizado. */
function assertContentUpToDate(root, source) {
  const fresh = listFiles(join(root, 'content'));
  const built = existsSync(join(source, 'content')) ? listFiles(join(source, 'content')) : [];
  const stale = (what) => { throw new Error(`a build do client está desatualizada em relação a content/ (${what}); rode "npm run build"`); };
  const missing = fresh.find((f) => !built.includes(f));
  if (missing) stale(`falta ${missing}`);
  const extra = built.find((f) => !fresh.includes(f));
  if (extra) stale(`sobrou ${extra}`);
  for (const f of fresh) {
    if (!readFileSync(join(root, 'content', f)).equals(readFileSync(join(source, 'content', f)))) stale(`${f} mudou`);
  }
}

/**
 * Constrói o site em `outDir` a partir de `rootDir`. Devolve { files } (caminhos relativos, com "/").
 * Lança erro (sem escrever nada) se a saída for perigosa, a build faltar ou estiver velha, ou o conteúdo tiver dado sensível.
 */
export function buildSite(rootDir, outDir) {
  const root = resolve(rootDir);
  const out = resolve(outDir);
  assertSafeOutput(root, out);

  const source = join(root, SITE_SOURCE);
  if (!existsSync(join(source, 'index.html'))) throw new Error(`falta ${SITE_SOURCE}/index.html; rode "npm run build" antes`);
  if (!existsSync(join(root, HEADERS_SOURCE))) throw new Error(`falta ${HEADERS_SOURCE}`);
  assertIndexAssetsPublished(source);
  assertContentUpToDate(root, source);

  // Portão de segurança: o deploy pode rodar mesmo se outra verificação falhar, então o build também verifica.
  // (A identidade do autor só é procurada na máquina do autor, por `npm run check`.)
  const { errors } = checkContent(root);
  if (errors.length) throw new Error(`dado sensível ou conteúdo inválido, nada foi publicado:\n${errors.map((e) => `  ${e}`).join('\n')}`);

  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  cpSync(source, out, { recursive: true });
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
    console.log(`Site montado em ${relative(process.cwd(), out) || '.'}: ${files.length} arquivos (${SITE_SOURCE} + _headers).`);
  } catch (err) {
    console.error(`ERRO: ${err.message}`);
    process.exitCode = 1;
  }
}
