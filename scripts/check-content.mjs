#!/usr/bin/env node
// Verificação do projeto: manifest válido, arquivos das peças presentes, nenhum dado sensível
// nos arquivos de texto (e em todo o conteúdo) e nenhuma identidade do autor em nenhum arquivo.
import { execFileSync } from 'node:child_process';
import { existsSync, lstatSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { userInfo } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateManifest } from '../js/content.js';

const URL_CREDENTIAL_RULE = 'credencial-url';

// O lookbehind do e-mail só deixa a regex começar no início de um trecho; sem ele, cada posição varria
// o trecho inteiro até o fim (tempo quadrático: base64 grande travava `npm run check`).
const SENSITIVE_RULES = [
  { rule: 'email', re: /(?<![A-Za-z0-9._%+-])[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g },
  { rule: 'caminho-pessoal', re: /\/(?:home|Users)\/[^\s/\\`'"]+/g },
  { rule: 'caminho-pessoal', re: /(?<![A-Za-z0-9_.-])\/root\/|(?<![A-Za-z0-9])[A-Za-z]:\\Users\\[^\s/\\`'"]+/g },
  { rule: 'cpf', re: /(?<!\d)\d{3}\.\d{3}\.\d{3}-\d{2}(?!\d)/g },
  { rule: URL_CREDENTIAL_RULE, secret: true, re: /https?:\/\/[^\s:/@]+:[^\s@/]+@[A-Za-z0-9.-]+/g },
  { rule: 'chave-privada', secret: true, re: /-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----/g },
  { rule: 'chave-aws', secret: true, re: /(?<![A-Za-z0-9])(?:AKIA|ASIA)[A-Z0-9]{16}/g },
  { rule: 'token-jwt', secret: true, re: /(?<![A-Za-z0-9_-])eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g },
  { rule: 'token-github', secret: true, re: /gh[pousr]_[A-Za-z0-9]{36}/g },
  { rule: 'token-github-pat', secret: true, re: /github_pat_[A-Za-z0-9_]{22,}/g },
  { rule: 'token-slack', secret: true, re: /xox[abpr]-[A-Za-z0-9-]{10,}/g },
  { rule: 'chave-google', secret: true, re: /AIza[A-Za-z0-9_-]{35}/g },
  { rule: 'chave-stripe', secret: true, re: /(?<![A-Za-z0-9])[sr]k_live_[A-Za-z0-9]{16,}/g },
  { rule: 'chave-sk', secret: true, re: /(?<![A-Za-z0-9])sk-[A-Za-z0-9_-]{20,}/g },
];

const SECRET_RULE_NAMES = new Set(SENSITIVE_RULES.filter((r) => r.secret).map((r) => r.rule));
/** Só o prefixo do tipo de segredo aparece no log; o restante é omitido. */
const SECRET_PREFIX = /^(?:-----BEGIN |sk-|https?:\/\/|gh[pousr]_|github_pat_|AKIA|ASIA|eyJ|xox[abpr]-|AIza|[sr]k_live_)/;

/** Procura dados sensíveis no texto. Retorna cada ocorrência com a regra que a encontrou. */
export function findSensitive(text) {
  const source = String(text);
  const all = [];
  for (const { rule, re } of SENSITIVE_RULES) {
    for (const m of source.matchAll(re)) {
      all.push({ rule, match: m[0], start: m.index, end: m.index + m[0].length });
    }
  }
  // A credencial em URL cobre o trecho inteiro: nada dentro dela é reportado de novo (ex.: o "e-mail" do usuário:senha@host).
  const covering = all.filter((f) => f.rule === URL_CREDENTIAL_RULE);
  return all
    .filter((f) => f.rule === URL_CREDENTIAL_RULE || !covering.some((c) => f.start < c.end && c.start < f.end))
    .map(({ rule, match }) => ({ rule, match }));
}

function displayMatch(rule, match) {
  if (!SECRET_RULE_NAMES.has(rule)) return match;
  const prefix = match.match(SECRET_PREFIX)?.[0] ?? '';
  return `${prefix}*** (${match.length} caracteres, valor omitido)`;
}

const EXCLUDED_DIRS = new Set(['node_modules', 'vendor']);

function isInside(base, target) {
  const rel = relative(base, target);
  return rel !== '' && rel.split(sep)[0] !== '..' && !isAbsolute(rel);
}

function isFile(abs) {
  return existsSync(abs) && statSync(abs).isFile();
}

function isSymlink(abs) {
  try {
    return lstatSync(abs).isSymbolicLink();
  } catch {
    return false;
  }
}

function* pieceEntries(manifest) {
  if (!Array.isArray(manifest?.tiers)) return;
  for (const tier of manifest.tiers) {
    if (!Array.isArray(tier?.cards)) continue;
    for (const card of tier.cards) {
      if (!Array.isArray(card?.pieces)) continue;
      yield* card.pieces;
    }
  }
}

/**
 * Lista os arquivos da raiz, recursivamente, sem entrar em .git, node_modules e vendor.
 * Symlinks não são seguidos: aparecem com `symlink: true`.
 */
function listProjectEntries(root, dir = root, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git') continue;
    const abs = join(dir, entry.name);
    const rel = relative(root, abs).split(sep).join('/');
    if (entry.isSymbolicLink()) {
      out.push({ abs, rel, symlink: true });
    } else if (entry.isDirectory()) {
      if (!EXCLUDED_DIRS.has(entry.name)) listProjectEntries(root, abs, out);
    } else if (entry.isFile()) {
      out.push({ abs, rel, symlink: false });
    }
  }
  return out;
}

/** Arquivo binário = byte NUL nos primeiros 8 KB. Qualquer outro é varrido, seja qual for a extensão. */
function isBinary(buffer) {
  return buffer.subarray(0, 8192).includes(0);
}

/** Regras genéricas: todo arquivo de texto do projeto. tests/ fica de fora (fixtures sintéticas). */
function passesGenericRules(rel) {
  return rel.split('/')[0] !== 'tests';
}

/**
 * Verifica o conteúdo da raiz do projeto (a pasta que contém content/).
 * `needles` são textos de identidade do autor, procurados sem diferenciar maiúsculas em todos os arquivos.
 * Retorna { errors }, uma string por problema encontrado.
 */
export function checkContent(rootDir, { needles = [] } = {}) {
  const root = resolve(rootDir);
  const contentDir = join(root, 'content');
  const manifestPath = join(contentDir, 'manifest.json');
  const manifestRel = 'content/manifest.json';
  const errors = [];

  // Symlinks não são seguidos: o manifest (ou o diretório content/) que for symlink não é lido; a varredura reporta o erro.
  const manifestBlocked = isSymlink(contentDir) || isSymlink(manifestPath);
  if (!manifestBlocked && !existsSync(manifestPath)) {
    errors.push(`${manifestRel}: arquivo ausente`);
  } else if (!manifestBlocked) {
    const manifestText = readFileSync(manifestPath, 'utf8');
    let manifest;
    try {
      manifest = JSON.parse(manifestText);
    } catch (err) {
      errors.push(`${manifestRel}: JSON inválido: ${err.message}`);
    }
    if (manifest !== undefined) {
      for (const message of validateManifest(manifest).errors) {
        errors.push(`${manifestRel}: ${message}`);
      }
      for (const piece of pieceEntries(manifest)) {
        if (typeof piece?.file !== 'string') continue;
        const abs = resolve(contentDir, piece.file);
        // Caminhos inválidos já foram reportados por validateManifest; não os acessamos.
        if (!isInside(contentDir, abs)) continue;
        if (!isFile(abs)) {
          errors.push(`content/${piece.file}: arquivo ausente (peça ${piece.type})`);
        }
      }
    }
  }

  const identity = [...new Set(needles.map((n) => String(n)).filter((n) => n.length > 0).map((n) => n.toLowerCase()))];
  for (const entry of listProjectEntries(root)) {
    if (entry.symlink) {
      errors.push(`${entry.rel}: symlink não permitido`);
      continue;
    }
    const buffer = readFileSync(entry.abs);
    if (isBinary(buffer)) continue;
    const text = buffer.toString('utf8');
    if (passesGenericRules(entry.rel)) {
      for (const { rule, match } of findSensitive(text)) {
        errors.push(`${entry.rel}: ${rule}: ${displayMatch(rule, match)}`);
      }
    }
    const lower = text.toLowerCase();
    if (identity.some((n) => lower.includes(n))) {
      errors.push(`${entry.rel}: identidade-do-autor: ***`);
    }
  }

  return { errors };
}

/**
 * Textos que identificam o autor local (e-mail e nome do git, usuário do sistema), para procurar em todo o projeto.
 * Valores vazios ou com menos de 4 caracteres são ignorados. `env` é repassado ao git.
 */
export function authorNeedles(env = process.env) {
  const values = [];
  for (const key of ['user.email', 'user.name']) {
    try {
      values.push(execFileSync('git', ['config', key], { env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
    } catch {
      // Chave ausente ou git indisponível: ignora.
    }
  }
  try {
    values.push(userInfo().username);
  } catch {
    // Usuário do sistema indisponível: ignora.
  }
  return [...new Set(values.map((v) => String(v).trim()).filter((v) => v.length >= 4))];
}

/**
 * Foi chamado como script? Compara caminhos reais: se o projeto for acessado por link simbólico,
 * argv[1] não é o caminho real e uma comparação direta daria false, saindo com 0 sem verificar nada
 * (falha aberta). Em caso de erro ao resolver, assume que é script para nunca passar em silêncio.
 */
function runsAsScript() {
  if (process.argv[1] === undefined) return false;
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return true;
  }
}
const isMain = runsAsScript();
if (isMain) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const { errors } = checkContent(root, { needles: authorNeedles() });
  if (errors.length > 0) {
    for (const error of errors) console.error(error);
    console.error(`\n${errors.length} problema(s) encontrado(s).`);
    process.exitCode = 1;
  } else {
    console.log('OK');
  }
}
