import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { installTarget, extractArtifact, buildInstall, detectOs, OS_LIST } from '../js/install.js';

test('OS_LIST: Linux, macOS e Windows, nessa ordem', () => {
  assert.deepEqual(OS_LIST.map((o) => o.id), ['linux', 'macos', 'windows']);
});

test('installTarget: caminhos .md validos, com ou sem comentario entre parenteses', () => {
  assert.equal(installTarget('.claude/agents/tutor.md'), '.claude/agents/tutor.md');
  assert.equal(installTarget('.claude/skills/sessao-de-estudo/SKILL.md'), '.claude/skills/sessao-de-estudo/SKILL.md');
  assert.equal(installTarget('CLAUDE.md (raiz da pasta de estudos)'), 'CLAUDE.md');
  assert.equal(installTarget('  notas/progresso.md  '), 'notas/progresso.md');
});

test('installTarget: nao e caminho (instrucao em texto) -> null', () => {
  for (const d of ['colar no início de cada sessão', 'consulta (não precisa instalar)', '', undefined, null, 'tutor', 'a b.md']) {
    assert.equal(installTarget(d), null, String(d));
  }
});

test('installTarget: recusa caminho absoluto, .., barras duplas, caracteres de shell', () => {
  for (const d of ['/etc/passwd.md', '../fora.md', 'a/../b.md', 'a//b.md', '~/x.md', 'C:\\x.md', 'a;rm -rf.md', 'a$(x).md', "a'b.md", 'a`b`.md', 'a&b.md', 'a|b.md', '-rf.md', '.claude/agents/../../x.md']) {
    assert.equal(installTarget(d), null, d);
  }
});

test('extractArtifact: bloco markdown simples e com 4 crases contendo 3 crases dentro', () => {
  assert.equal(extractArtifact('intro\n\n```markdown\nlinha 1\nlinha 2\n```\n\nfim'), 'linha 1\nlinha 2');
  const nested = 'texto\n\n````markdown\n---\nname: x\n---\n\n```\ninterno\n```\n\nresto\n````\n\nfim';
  assert.equal(extractArtifact(nested), '---\nname: x\n---\n\n```\ninterno\n```\n\nresto');
});

test('extractArtifact: pega o primeiro bloco markdown; ignora outras linguagens; sem bloco -> null', () => {
  assert.equal(extractArtifact('```bash\nls\n```\n\n```markdown\nA\n```\n\n```markdown\nB\n```'), 'A');
  assert.equal(extractArtifact('```js\nx\n```'), null);
  assert.equal(extractArtifact('sem blocos'), null);
  assert.equal(extractArtifact(''), null);
  assert.equal(extractArtifact(undefined), null);
});

test('extractArtifact: normaliza CRLF', () => {
  assert.equal(extractArtifact('```markdown\r\na\r\nb\r\n```\r\n'), 'a\nb');
});

const f = (path, content) => ({ path, content });

test('buildInstall linux: mkdir -p da pasta e heredoc com delimitador entre aspas (sem expansao)', () => {
  const out = buildInstall('linux', [f('.claude/agents/tutor.md', 'oi $HOME `x`\nfim')]);
  assert.equal(out, [
    '# Rode dentro da pasta onde quer instalar (ex.: a sua pasta de estudos)',
    "mkdir -p '.claude/agents'",
    "cat > '.claude/agents/tutor.md' <<'CLAUDE_LIBRARY_EOF'",
    'oi $HOME `x`',
    'fim',
    'CLAUDE_LIBRARY_EOF',
  ].join('\n'));
});

test('buildInstall macos e igual ao linux (bash/zsh)', () => {
  const files = [f('CLAUDE.md', 'x')];
  assert.equal(buildInstall('macos', files), buildInstall('linux', files));
});

test('buildInstall: arquivo na raiz nao gera mkdir; pastas repetidas so uma vez', () => {
  const out = buildInstall('linux', [f('CLAUDE.md', 'a'), f('.claude/agents/a.md', 'b'), f('.claude/agents/b.md', 'c')]);
  assert.equal(out.match(/mkdir -p/g).length, 1);
  assert.match(out, /mkdir -p '\.claude\/agents'/);
  assert.doesNotMatch(out, /mkdir -p '\.'/);
});

test('buildInstall linux: delimitador que colide com o conteudo e trocado', () => {
  const out = buildInstall('linux', [f('a.md', 'x\nCLAUDE_LIBRARY_EOF\ny')]);
  assert.match(out, /<<'CLAUDE_LIBRARY_EOF_2'/);
  assert.ok(out.trimEnd().endsWith('CLAUDE_LIBRARY_EOF_2'));
  // o conteudo continua inteiro entre o delimitador novo
  assert.match(out, /x\nCLAUDE_LIBRARY_EOF\ny\nCLAUDE_LIBRARY_EOF_2$/);
});

test('buildInstall windows: PowerShell com here-string literal, barras invertidas e UTF-8 sem BOM', () => {
  const out = buildInstall('windows', [f('.claude/agents/tutor.md', 'oi $x `y`')]);
  assert.equal(out, [
    '# Rode dentro da pasta onde quer instalar (ex.: a sua pasta de estudos)',
    '$utf8 = New-Object System.Text.UTF8Encoding $false',
    "New-Item -ItemType Directory -Force -Path '.claude\\agents' | Out-Null",
    "$content = @'",
    'oi $x `y`',
    "'@",
    "[System.IO.File]::WriteAllText((Join-Path (Get-Location) '.claude\\agents\\tutor.md'), $content + \"`n\", $utf8)",
  ].join('\n'));
});

test('buildInstall windows: linha que comeca com \'@ quebraria o here-string -> usa base64', () => {
  const content = "a\n'@ perigoso\nb";
  const out = buildInstall('windows', [f('x.md', content)]);
  assert.doesNotMatch(out, /\$content = @'/);
  const b64 = out.match(/FromBase64String\('([A-Za-z0-9+/=]+)'\)/)[1];
  assert.equal(Buffer.from(b64, 'base64').toString('utf8'), content);
});

test('buildInstall: conteudo com acentos e emoji passa inteiro nos tres sistemas', () => {
  const content = 'Revisão espaçada ✓ 日本語 😀';
  for (const os of ['linux', 'macos', 'windows']) assert.ok(buildInstall(os, [f('a.md', content)]).includes(content) || os === 'windows', os);
  assert.ok(buildInstall('windows', [f('a.md', content)]).includes(content));
});

test('buildInstall: so aceita caminho valido e sistema conhecido (nunca monta comando perigoso)', () => {
  assert.throws(() => buildInstall('linux', [f('../x.md', 'a')]), /caminho inválido/);
  assert.throws(() => buildInstall('linux', [f("a'; rm -rf ~; echo '.md", 'a')]), /caminho inválido/);
  assert.throws(() => buildInstall('beos', [f('a.md', 'a')]), /sistema/);
  assert.equal(buildInstall('linux', []), '');
});

test('detectOs: a partir de navigator.platform / userAgent', () => {
  assert.equal(detectOs('Win32'), 'windows');
  assert.equal(detectOs('Windows NT 10.0'), 'windows');
  assert.equal(detectOs('MacIntel'), 'macos');
  assert.equal(detectOs('Macintosh; Intel Mac OS X 10_15'), 'macos');
  assert.equal(detectOs('Linux x86_64'), 'linux');
  assert.equal(detectOs('X11; Fedora; Linux'), 'linux');
  assert.equal(detectOs(''), 'linux');
  assert.equal(detectOs(undefined), 'linux');
});

test('js/install.js roda no navegador: nao usa APIs exclusivas do Node (Buffer, require, process)', () => {
  const src = readFileSync(new URL('../js/install.js', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
  for (const api of ['Buffer', 'require(', 'process.', 'node:']) assert.ok(!src.includes(api), `usa ${api}`);
});

test('base64 do fallback do PowerShell decodifica de volta, inclusive acentos e emoji', () => {
  const content = "linha\n'@ Revisão ✓ 日本語 😀\nfim";
  const out = buildInstall('windows', [f('x.md', content)]);
  const b64 = out.match(/FromBase64String\('([A-Za-z0-9+/=]+)'\)/)[1];
  assert.equal(Buffer.from(b64, 'base64').toString('utf8'), content);
});
