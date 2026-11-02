/**
 * Gera os comandos de terminal (Linux, macOS e Windows/PowerShell) que criam os arquivos de uma peça
 * no lugar certo. Funções puras, sem DOM. O conteúdo vai embutido nos comandos, então um único "copiar"
 * basta. O caminho é validado de forma estrita: nunca entra no comando algo que o shell interprete.
 */

export const OS_LIST = [
  { id: 'linux', label: 'Linux' },
  { id: 'macos', label: 'macOS' },
  { id: 'windows', label: 'Windows' },
];

const HEADER = '# Rode dentro da pasta onde quer instalar (ex.: a sua pasta de estudos)';
const SAFE_PATH = /^[A-Za-z0-9_./-]+\.md$/;

function isSafePath(path) {
  if (typeof path !== 'string' || !SAFE_PATH.test(path) || path.startsWith('/') || path.startsWith('-')) return false;
  return !path.split('/').some((seg) => seg === '' || seg === '.' || seg === '..');
}

/**
 * Caminho de destino a partir do campo `destino` do front matter (ex.: `.claude/agents/tutor.md`,
 * `CLAUDE.md (raiz da pasta de estudos)`). Devolve null se não for um caminho de arquivo `.md` seguro
 * (ex.: "colar no início de cada sessão", "consulta").
 */
export function installTarget(destino) {
  if (typeof destino !== 'string') return null;
  const path = destino.trim().split(/\s+\(/)[0].trim();
  return isSafePath(path) ? path : null;
}

/**
 * Conteúdo do primeiro bloco de código ```markdown (ou com mais crases, como as 4 do pacote, que
 * podem conter blocos de 3) de um arquivo Markdown. É o "arquivo de verdade" que a peça ensina a salvar.
 */
export function extractArtifact(markdown) {
  if (typeof markdown !== 'string') return null;
  const text = markdown.replace(/\r\n?/g, '\n');
  const m = text.match(/^(`{3,})markdown[ \t]*\n([\s\S]*?)\n\1[ \t]*$/m);
  return m ? m[2] : null;
}

/**
 * Arquivo a instalar para uma peça: { path, content } ou null.
 * - padrão (`install` ausente ou "block"): o conteúdo é o bloco ```markdown do arquivo;
 * - `install: "file"` (no manifest): o arquivo inteiro É o que se instala (ex.: arquitetura.md); `body` já vem
 *   sem o front matter, que é só metadado da biblioteca e não deve ir para o arquivo instalado.
 * Precisa de `destino` com um caminho .md seguro (senão null).
 */
export function installFile(piece, meta, body) {
  const path = installTarget(meta?.destino);
  if (!path) return null;
  const content = piece?.install === 'file'
    ? String(body ?? '').replace(/\r\n?/g, '\n').replace(/^\n+/, '').replace(/\s+$/, '')
    : extractArtifact(body);
  return content ? { path, content } : null;
}

/** 'linux' | 'macos' | 'windows' a partir de navigator.platform ou do userAgent. Padrão: linux. */
export function detectOs(platform) {
  const p = String(platform ?? '');
  if (/win/i.test(p) && !/darwin/i.test(p)) return 'windows';
  if (/mac|iphone|ipad/i.test(p)) return 'macos';
  return 'linux';
}

const dirOf = (path) => (path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '');
const shQuote = (s) => `'${s.replace(/'/g, `'\\''`)}'`;
const psQuote = (s) => `'${s.replace(/'/g, "''")}'`;

/** UTF-8 → base64 sem `Buffer` (funciona no navegador e no Node). */
function toBase64(text) {
  let binary = '';
  for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function uniqueDelimiter(contents) {
  const lines = new Set(contents.flatMap((c) => c.split('\n')));
  const base = 'CLAUDE_LIBRARY_EOF';
  let delim = base;
  for (let n = 2; lines.has(delim); n++) delim = `${base}_${n}`;
  return delim;
}

function buildUnix(files) {
  const delim = uniqueDelimiter(files.map((f) => f.content));
  const out = [HEADER];
  const made = new Set();
  for (const { path, content } of files) {
    const dir = dirOf(path);
    if (dir && !made.has(dir)) {
      made.add(dir);
      out.push(`mkdir -p ${shQuote(dir)}`);
    }
    out.push(`cat > ${shQuote(path)} <<'${delim}'`, content, delim);
  }
  return out.join('\n');
}

function buildWindows(files) {
  const out = [HEADER, '$utf8 = New-Object System.Text.UTF8Encoding $false'];
  const made = new Set();
  for (const { path, content } of files) {
    const dir = dirOf(path).replace(/\//g, '\\');
    if (dir && !made.has(dir)) {
      made.add(dir);
      out.push(`New-Item -ItemType Directory -Force -Path ${psQuote(dir)} | Out-Null`);
    }
    // Here-string literal (@' ... '@) não expande nada; só quebra se uma linha começar com '@.
    // Nesse caso o conteúdo vai em base64.
    if (/(^|\n)'@/.test(content)) {
      const b64 = toBase64(content);
      out.push(`$content = [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${b64}'))`);
    } else {
      out.push("$content = @'", content, "'@");
    }
    out.push(`[System.IO.File]::WriteAllText((Join-Path (Get-Location) ${psQuote(path.replace(/\//g, '\\'))}), $content + "\`n", $utf8)`);
  }
  return out.join('\n');
}

/**
 * Comandos para criar `files` ([{ path, content }]) no sistema `os`.
 * Lança erro para sistema desconhecido ou caminho inseguro.
 */
export function buildInstall(os, files) {
  if (!OS_LIST.some((o) => o.id === os)) throw new Error(`sistema desconhecido: ${os}`);
  for (const f of files) {
    if (!isSafePath(f.path)) throw new Error(`caminho inválido: ${JSON.stringify(f.path)}`);
  }
  if (!files.length) return '';
  return os === 'windows' ? buildWindows(files) : buildUnix(files);
}
