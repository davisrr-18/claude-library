#!/usr/bin/env node
// Verificação do conteúdo: manifest válido, arquivos das peças presentes e
// nenhum dado sensível nos .md de content/ nem no manifest.json.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateManifest } from '../js/content.js';

const SENSITIVE_RULES = [
  { rule: 'email', re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g },
  { rule: 'caminho-pessoal', re: /\/(?:home|Users)\/[^\s/\\`'"]+/g },
  { rule: 'token-github', re: /(?:ghp|gho)_[A-Za-z0-9]{36}/g },
  { rule: 'chave-sk', re: /(?<![A-Za-z0-9])sk-[A-Za-z0-9_-]{20,}/g },
  { rule: 'chave-privada', re: /-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----/g },
];

/** Procura dados sensíveis no texto. Retorna cada ocorrência com a regra que a encontrou. */
export function findSensitive(text) {
  const found = [];
  const source = String(text);
  for (const { rule, re } of SENSITIVE_RULES) {
    for (const m of source.matchAll(re)) found.push({ rule, match: m[0] });
  }
  return found;
}

const SECRET_RULES = new Set(['token-github', 'chave-sk', 'chave-privada']);

/** Segredos não vão para o log (CI): mantém só o prefixo. E-mail e caminho ficam visíveis para facilitar a correção. */
function displayMatch(rule, match) {
  if (!SECRET_RULES.has(rule)) return match;
  const prefix = match.match(/^(?:ghp_|gho_|sk-|-----BEGIN )/)?.[0] ?? '';
  return `${prefix}*** (${match.length} caracteres, valor omitido)`;
}

function listMarkdownFiles(dir) {
  if (!existsSync(dir)) return [];
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...listMarkdownFiles(abs));
    else if (entry.isFile() && entry.name.endsWith('.md')) files.push(abs);
  }
  return files;
}

function isInside(base, target) {
  const rel = relative(base, target);
  return rel !== '' && rel.split(sep)[0] !== '..' && !isAbsolute(rel);
}

function isFile(abs) {
  return existsSync(abs) && statSync(abs).isFile();
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
 * Verifica o conteúdo da raiz do projeto (a pasta que contém content/).
 * Retorna { errors }, uma string por problema encontrado.
 */
export function checkContent(rootDir) {
  const root = resolve(rootDir);
  const contentDir = join(root, 'content');
  const manifestPath = join(contentDir, 'manifest.json');
  const manifestRel = 'content/manifest.json';
  const errors = [];

  let manifestText = null;
  if (existsSync(manifestPath)) {
    manifestText = readFileSync(manifestPath, 'utf8');
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
  } else {
    errors.push(`${manifestRel}: arquivo ausente`);
  }

  const scanned = [
    ...(manifestText === null ? [] : [{ abs: manifestPath, text: manifestText }]),
    ...listMarkdownFiles(contentDir).map((abs) => ({ abs, text: readFileSync(abs, 'utf8') })),
  ];
  for (const { abs, text } of scanned) {
    const rel = relative(root, abs).split(sep).join('/');
    for (const { rule, match } of findSensitive(text)) {
      errors.push(`${rel}: ${rule}: ${displayMatch(rule, match)}`);
    }
  }

  return { errors };
}

const isMain = process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const { errors } = checkContent(root);
  if (errors.length > 0) {
    for (const error of errors) console.error(error);
    console.error(`\n${errors.length} problema(s) encontrado(s).`);
    process.exitCode = 1;
  } else {
    console.log('OK');
  }
}
