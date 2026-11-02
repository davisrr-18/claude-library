import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir, userInfo } from 'node:os';
import { join, dirname } from 'node:path';
import { findSensitive, checkContent, authorNeedles } from '../scripts/check-content.mjs';

const created = [];
after(() => {
  for (const dir of created) rmSync(dir, { recursive: true, force: true });
});

/** Cria uma raiz temporária (dentro de os.tmpdir()) com os arquivos informados. */
function makeRoot(files) {
  const dir = mkdtempSync(join(tmpdir(), 'check-content-'));
  created.push(dir);
  for (const [rel, text] of Object.entries(files)) {
    const abs = join(dir, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, text);
  }
  return dir;
}

/** Diretório temporário separado da raiz (usado como alvo de symlinks). */
function makeDir(files = {}) {
  return makeRoot(files);
}

const manifest = (cards) => ({
  tiers: [
    { id: 'basicas', title: 'Básicas', cards },
    { id: 'intermediarias', title: 'Intermediárias', cards: [] },
    { id: 'complexas', title: 'Complexas', cards: [] },
  ],
});
const cardWith = (file = 'basicas/exemplo/skill.md', over = {}) => ({
  id: 'exemplo',
  title: 'Exemplo',
  summary: 'Resumo',
  tags: [],
  pieces: [{ type: 'skill', title: 'Skill', file }],
  ...over,
});
const json = (m) => JSON.stringify(m, null, 2);
const CLEAN = '---\nname: exemplo\ndescription: Modelo.\n---\n# Skill\n\nTexto comum.\n';
const rules = (text) => findSensitive(text).map((f) => f.rule);

// Valores falsos (montados por concatenação para o literal completo não aparecer no arquivo).
const AWS_KEY = 'AKIA' + 'ABCD1234EFGH5678';
const JWT = ['eyJhbGciOiJIUzI1NiJ9', 'eyJzdWIiOiJmdWxhbm8ifQ', 'c2lnbmF0dXJhLWZpY3RpY2lh'].join('.');
const GH_CLASSIC = 'ghu_' + 'A'.repeat(36);
const GH_PAT = 'github_pat_' + 'A1_'.repeat(8);
const SLACK = 'xoxb-' + '1234567890-abcdef';
const GOOGLE = 'AIza' + 'Ab_-1'.repeat(7);
const STRIPE = 'sk_live_' + 'a1'.repeat(8);

// ---------- findSensitive ----------

test('findSensitive: detecta e-mail', () => {
  assert.deepEqual(rules('contato: fulano@example.com'), ['email']);
  const [finding] = findSensitive('x a@b.co y');
  assert.equal(finding.match, 'a@b.co');
});

test('findSensitive: não dispara em @ sem e-mail válido', () => {
  for (const text of ['user@', '@media (max-width: 600px)', 'npm i foo@1.2.3', '@types/node']) {
    assert.deepEqual(findSensitive(text), [], text);
  }
});

test('findSensitive: detecta caminho pessoal /home e /Users', () => {
  const [home] = findSensitive('veja /home/fulano/projeto/x');
  assert.equal(home.rule, 'caminho-pessoal');
  assert.equal(home.match, '/home/fulano');
  assert.deepEqual(rules('em /Users/maria/Documents'), ['caminho-pessoal']);
});

test('findSensitive: não dispara em ~/.claude/skills nem em /home sem usuário', () => {
  for (const text of ['use ~/.claude/skills', 'pasta /home/ vazia', '/homework/x']) {
    assert.deepEqual(findSensitive(text), [], text);
  }
});

test('findSensitive: detecta caminho /root/', () => {
  const [root] = findSensitive('ver /root/.ssh agora');
  assert.equal(root.rule, 'caminho-pessoal');
  assert.equal(root.match, '/root/');
});

test('findSensitive: /root/ dentro de outro caminho ou sem barra final não dispara', () => {
  for (const text of ['/rootfs/x', 'root/x', 'ver /opt/x/root/y', 'final em /root']) {
    assert.deepEqual(findSensitive(text), [], text);
  }
});

test('findSensitive: detecta caminho pessoal Windows com barra invertida', () => {
  const [win] = findSensitive('C:\\Users\\fulano\\Documents');
  assert.equal(win.rule, 'caminho-pessoal');
  assert.equal(win.match, 'C:\\Users\\fulano');
});

test('findSensitive: caminho Windows sem usuário ou de outra pasta não dispara', () => {
  for (const text of ['C:\\Users\\', 'C:\\Program Files\\x', 'C:\\Users']) {
    assert.deepEqual(findSensitive(text), [], text);
  }
});

test('findSensitive: detecta token GitHub ghp_ e gho_ com 36 caracteres', () => {
  assert.deepEqual(rules(`token ghp_${'a'.repeat(36)}`), ['token-github']);
  assert.deepEqual(rules(`token gho_${'A9'.repeat(18)}`), ['token-github']);
});

test('findSensitive: detecta tokens GitHub ghu_, ghs_ e ghr_', () => {
  for (const prefix of ['ghu_', 'ghs_', 'ghr_']) {
    assert.deepEqual(rules(prefix + 'A'.repeat(36)), ['token-github'], prefix);
  }
});

test('findSensitive: token GitHub com menos de 36 caracteres não dispara', () => {
  assert.deepEqual(findSensitive(`ghp_${'a'.repeat(35)}`), []);
  assert.deepEqual(findSensitive('ghp_exemplo'), []);
  assert.deepEqual(findSensitive('ghu_' + 'A'.repeat(35)), []);
  assert.deepEqual(findSensitive('ghx_' + 'A'.repeat(36)), []);
});

test('findSensitive: detecta github_pat_ com 22 ou mais caracteres', () => {
  assert.deepEqual(rules(GH_PAT), ['token-github-pat']);
  assert.deepEqual(rules('github_pat_' + 'a'.repeat(22)), ['token-github-pat']);
});

test('findSensitive: github_pat_ com menos de 22 caracteres não dispara', () => {
  assert.deepEqual(findSensitive('github_pat_' + 'a'.repeat(21)), []);
  assert.deepEqual(findSensitive('github_pat_exemplo'), []);
});

test('findSensitive: detecta chave sk- com 20 ou mais caracteres', () => {
  assert.deepEqual(rules(`chave sk-${'a'.repeat(20)}`), ['chave-sk']);
  assert.deepEqual(rules(`sk-ant-api03-${'x'.repeat(30)}`), ['chave-sk']);
});

test('findSensitive: sk- curto ou em palavras comuns não dispara', () => {
  for (const text of [`sk-${'a'.repeat(19)}`, 'sk-...', 'task-manager-exemplo-de-texto']) {
    assert.deepEqual(findSensitive(text), [], text);
  }
});

test('findSensitive: detecta cabeçalho de chave privada', () => {
  assert.deepEqual(rules('-----BEGIN PRIVATE KEY-----'), ['chave-privada']);
  assert.deepEqual(rules('-----BEGIN RSA PRIVATE KEY-----'), ['chave-privada']);
});

test('findSensitive: certificado não é chave privada', () => {
  assert.deepEqual(findSensitive('-----BEGIN CERTIFICATE-----'), []);
});

test('findSensitive: detecta chave AWS AKIA e ASIA com 16 caracteres maiúsculos ou dígitos', () => {
  assert.deepEqual(rules(AWS_KEY), ['chave-aws']);
  assert.deepEqual(rules('chave ASIA' + 'ABCD1234EFGH5678 fim'), ['chave-aws']);
});

test('findSensitive: chave AWS incompleta, em minúsculas ou colada em outra palavra não dispara', () => {
  for (const text of ['AKIA' + 'ABCD1234EFGH567', 'AKIA' + 'abcd1234efgh5678', 'XAKIA' + 'ABCD1234EFGH5678']) {
    assert.deepEqual(findSensitive(text), [], text);
  }
});

test('findSensitive: detecta JWT com três segmentos base64url começando em eyJ', () => {
  assert.deepEqual(rules(JWT), ['token-jwt']);
});

test('findSensitive: JWT com menos de três segmentos ou sem eyJ não dispara', () => {
  for (const text of ['eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOi', 'abc.def.ghi', 'eyJ.abc.def', 'eyJhbGciOi']) {
    assert.deepEqual(findSensitive(text), [], text);
  }
});

test('findSensitive: detecta token Slack xox[abpr]- com 10 ou mais caracteres', () => {
  assert.deepEqual(rules(SLACK), ['token-slack']);
  for (const prefix of ['xoxp-', 'xoxa-', 'xoxr-']) {
    assert.deepEqual(rules(prefix + 'A1b2C3d4E5'), ['token-slack'], prefix);
  }
});

test('findSensitive: token Slack curto ou de outro tipo não dispara', () => {
  assert.deepEqual(findSensitive('xoxb-' + '123456789'), []);
  assert.deepEqual(findSensitive('xoxz-' + 'abcdefghijk'), []);
});

test('findSensitive: detecta chave Google AIza com 35 caracteres', () => {
  assert.deepEqual(rules(GOOGLE), ['chave-google']);
});

test('findSensitive: chave Google com 34 caracteres não dispara', () => {
  assert.deepEqual(findSensitive('AIza' + 'A'.repeat(34)), []);
});

test('findSensitive: detecta chave Stripe sk_live_ e rk_live_ com 16 ou mais caracteres', () => {
  assert.deepEqual(rules(STRIPE), ['chave-stripe']);
  assert.deepEqual(rules('rk_live_' + 'A'.repeat(20)), ['chave-stripe']);
});

test('findSensitive: chave Stripe curta ou de teste não dispara', () => {
  assert.deepEqual(findSensitive('sk_live_' + 'a'.repeat(15)), []);
  assert.deepEqual(findSensitive('sk_test_' + 'a'.repeat(20)), []);
});

test('findSensitive: detecta credencial em URL, inclusive host sem ponto', () => {
  assert.deepEqual(rules('https://fulano:senha@example.com/x'), ['credencial-url']);
  const [cred] = findSensitive('http://fulano:senha@localhost:3000/x');
  assert.equal(cred.rule, 'credencial-url');
  assert.equal(cred.match, 'http://fulano:senha@localhost');
});

test('findSensitive: credencial em URL cobre o e-mail que ela contém (não é reportado de novo)', () => {
  assert.deepEqual(rules('http://usuario:senha@example.com'), ['credencial-url']);
});

test('findSensitive: URL sem senha ou sem usuário não é credencial', () => {
  assert.deepEqual(findSensitive('https://example.com/x'), []);
  assert.deepEqual(rules('https://fulano@example.com'), ['email']);
});

test('findSensitive: detecta CPF no formato 000.000.000-00', () => {
  assert.deepEqual(rules('CPF 123.456.789-09 no cadastro'), ['cpf']);
});

test('findSensitive: CPF com dígitos a mais, a menos ou sem pontuação não dispara', () => {
  for (const text of ['1123.456.789-09', '123.456.789-0', '123456789-09', '123.456.7890-09']) {
    assert.deepEqual(findSensitive(text), [], text);
  }
});

test('findSensitive: detecta token GitHub, Slack, Google, Stripe e JWT', () => {
  for (const [value, rule] of [
    [GH_CLASSIC, 'token-github'],
    [GH_PAT, 'token-github-pat'],
    [SLACK, 'token-slack'],
    [GOOGLE, 'chave-google'],
    [STRIPE, 'chave-stripe'],
    [JWT, 'token-jwt'],
    [AWS_KEY, 'chave-aws'],
  ]) {
    assert.deepEqual(rules(`x ${value} y`), [rule], rule);
  }
});

test('findSensitive: texto comum não dispara', () => {
  assert.deepEqual(findSensitive('Use esta skill para revisar o código e escrever testes.'), []);
});

test('findSensitive: reporta todas as ocorrências de regras diferentes', () => {
  assert.deepEqual(rules('a@b.com e /home/fulano'), ['email', 'caminho-pessoal']);
});

// ---------- checkContent ----------

test('checkContent: raiz válida não gera erros', () => {
  const root = makeRoot({
    'content/manifest.json': json(manifest([cardWith()])),
    'content/basicas/exemplo/skill.md': CLEAN,
  });
  assert.deepEqual(checkContent(root), { errors: [] });
});

test('checkContent: manifest inválido gera erro', () => {
  const root = makeRoot({
    'content/manifest.json': json(manifest([cardWith('basicas/exemplo/skill.md', { icon: 'nope' })])),
    'content/basicas/exemplo/skill.md': CLEAN,
  });
  const { errors } = checkContent(root);
  assert.ok(errors.some((e) => e.startsWith('content/manifest.json:') && /icon inválido/.test(e)), errors.join('\n'));
});

test('checkContent: arquivo de peça ausente gera erro', () => {
  const root = makeRoot({
    'content/manifest.json': json(manifest([cardWith('basicas/ausente/skill.md')])),
  });
  const { errors } = checkContent(root);
  assert.deepEqual(errors, ['content/basicas/ausente/skill.md: arquivo ausente (peça skill)']);
});

test('checkContent: caminho fora de content/ não é lido nem causa falha', () => {
  const root = makeRoot({
    'content/manifest.json': json(manifest([cardWith('../fora/skill.md')])),
  });
  const { errors } = checkContent(root);
  assert.ok(errors.some((e) => e.includes('caminho de arquivo inválido')), errors.join('\n'));
  assert.ok(errors.every((e) => !e.includes('ausente')), errors.join('\n'));
});

test('checkContent: e-mail em .md gera erro com arquivo e trecho', () => {
  const root = makeRoot({
    'content/manifest.json': json(manifest([cardWith()])),
    'content/basicas/exemplo/skill.md': `${CLEAN}\nFale com fulano@example.com\n`,
  });
  assert.deepEqual(checkContent(root).errors, [
    'content/basicas/exemplo/skill.md: email: fulano@example.com',
  ]);
});

test('checkContent: varre .md em subpastas e o manifest', () => {
  const root = makeRoot({
    'content/manifest.json': json(manifest([cardWith('basicas/exemplo/skill.md', { title: 'Contato a@b.com' })])),
    'content/basicas/exemplo/skill.md': CLEAN,
    'content/intermediarias/x/notas.md': `nota ghp_${'a'.repeat(36)}\n`,
  });
  const { errors } = checkContent(root);
  assert.ok(errors.some((e) => e.startsWith('content/manifest.json: email: a@b.com')), errors.join('\n'));
  assert.ok(
    errors.some((e) => e.startsWith('content/intermediarias/x/notas.md: token-github: ')),
    errors.join('\n'),
  );
});

test('checkContent: manifest.json ausente gera erro', () => {
  const root = makeRoot({ 'content/basicas/exemplo/skill.md': CLEAN });
  const { errors } = checkContent(root);
  assert.equal(errors.length, 1);
  assert.ok(errors[0].startsWith('content/manifest.json:'), errors[0]);
});

// ---------- checkContent: escopo da varredura ----------

test('checkContent: varre arquivos de texto da raiz fora de content/ (extensão sem diferenciar maiúsculas)', () => {
  const root = makeRoot({
    'content/manifest.json': json(manifest([cardWith()])),
    'content/basicas/exemplo/skill.md': CLEAN,
    'README.md': 'contato fulano@example.com\n',
    'docs/notas.TXT': 'contato fulano@example.com\n',
    'site/pagina.HTML': 'contato fulano@example.com\n',
    'imagem.svg': 'contato fulano@example.com\n',
  });
  const errors = checkContent(root).errors.sort();
  assert.deepEqual(errors, [
    'README.md: email: fulano@example.com',
    'docs/notas.TXT: email: fulano@example.com',
    'imagem.svg: email: fulano@example.com',
    'site/pagina.HTML: email: fulano@example.com',
  ]);
});

test('checkContent: texto de qualquer extensão é varrido, em qualquer pasta (exceto tests/ e vendor/)', () => {
  for (const nome of ['script.sh', 'dados.csv', 'config.toml', 'app.py', '.env', 'LEIA-ME', 'dados.bin']) {
    const root = makeRoot({
      'content/manifest.json': json(manifest([cardWith()])),
      'content/basicas/exemplo/skill.md': CLEAN,
      [nome]: 'contato fulano@example.com',
    });
    assert.deepEqual(checkContent(root).errors, [`${nome}: email: fulano@example.com`], nome);
  }
});

test('checkContent: arquivo binário (byte NUL) é ignorado, mesmo com texto dentro', () => {
  const root = makeRoot({
    'content/manifest.json': json(manifest([cardWith()])),
    'content/basicas/exemplo/skill.md': CLEAN,
    'imagem.png': 'cabecalho\0fulano@example.com',
  });
  assert.deepEqual(checkContent(root).errors, []);
});

test('checkContent: dentro de content/ todo arquivo regular é varrido, qualquer extensão', () => {
  const root = makeRoot({
    'content/manifest.json': json(manifest([cardWith()])),
    'content/basicas/exemplo/skill.md': CLEAN,
    'content/basicas/exemplo/dados.bin': 'fulano@example.com',
  });
  assert.deepEqual(checkContent(root).errors, [
    'content/basicas/exemplo/dados.bin: email: fulano@example.com',
  ]);
});

test('checkContent: ignora .git, node_modules e vendor', () => {
  const root = makeRoot({
    'content/manifest.json': json(manifest([cardWith()])),
    'content/basicas/exemplo/skill.md': CLEAN,
    '.git/config.md': 'fulano@example.com',
    'node_modules/x/a.md': 'fulano@example.com',
    'vendor/y.md': 'fulano@example.com',
    'docs/vendor/z.md': 'fulano@example.com',
  });
  assert.deepEqual(checkContent(root).errors, []);
});

test('checkContent: tests/ não passa pelas regras genéricas', () => {
  const root = makeRoot({
    'content/manifest.json': json(manifest([cardWith()])),
    'content/basicas/exemplo/skill.md': CLEAN,
    'tests/fixture.test.mjs': `const x = 'fulano@example.com' + 'ghp_${'a'.repeat(36)}';\n`,
  });
  assert.deepEqual(checkContent(root).errors, []);
});

test('checkContent: symlink de arquivo não é seguido e gera erro', () => {
  const outside = makeDir({ 'segredo.md': 'fulano@example.com\n' });
  const root = makeRoot({
    'content/manifest.json': json(manifest([cardWith()])),
    'content/basicas/exemplo/skill.md': CLEAN,
  });
  symlinkSync(join(outside, 'segredo.md'), join(root, 'content', 'basicas', 'exemplo', 'link.md'));
  assert.deepEqual(checkContent(root).errors, ['content/basicas/exemplo/link.md: symlink não permitido']);
});

test('checkContent: symlink de diretório não é seguido e gera erro', () => {
  const outside = makeDir({ 'a.md': 'fulano@example.com\n' });
  const root = makeRoot({
    'content/manifest.json': json(manifest([cardWith()])),
    'content/basicas/exemplo/skill.md': CLEAN,
  });
  symlinkSync(outside, join(root, 'linkdir'));
  assert.deepEqual(checkContent(root).errors, ['linkdir: symlink não permitido']);
});

test('checkContent: manifest que é symlink gera erro de symlink e não é lido', () => {
  const outside = makeDir({ 'real.json': json(manifest([cardWith()])) });
  const root = makeRoot({
    'content/basicas/exemplo/skill.md': CLEAN,
  });
  symlinkSync(join(outside, 'real.json'), join(root, 'content', 'manifest.json'));
  assert.deepEqual(checkContent(root).errors, ['content/manifest.json: symlink não permitido']);
});

// ---------- checkContent: identidade do autor ----------

test('checkContent: identidade do autor é procurada em todos os arquivos, inclusive tests/, sem diferenciar maiúsculas', () => {
  const root = makeRoot({
    'content/manifest.json': json(manifest([cardWith()])),
    'content/basicas/exemplo/skill.md': CLEAN,
    'README.md': 'Autor: FulanoUser aqui\n',
    'tests/a.test.mjs': 'const autor = "fulanouser";\n',
    'imagem.png': 'fulanouser',
  });
  const errors = checkContent(root, { needles: ['fulanouser'] }).errors.sort();
  assert.deepEqual(errors, [
    'README.md: identidade-do-autor: ***',
    'imagem.png: identidade-do-autor: ***',
    'tests/a.test.mjs: identidade-do-autor: ***',
  ]);
});

test('checkContent: identidade do autor nunca imprime o valor procurado', () => {
  const root = makeRoot({
    'content/manifest.json': json(manifest([cardWith()])),
    'content/basicas/exemplo/skill.md': `${CLEAN}\nfulano@example.com\n`,
  });
  const { errors } = checkContent(root, { needles: ['fulano@example.com'] });
  // A regra email continua mostrando o valor (regra visível); a linha de identidade não.
  assert.deepEqual(errors.filter((e) => e.includes('identidade-do-autor')), [
    'content/basicas/exemplo/skill.md: identidade-do-autor: ***',
  ]);
});

test('checkContent: needle vazio é ignorado', () => {
  const root = makeRoot({
    'content/manifest.json': json(manifest([cardWith()])),
    'content/basicas/exemplo/skill.md': CLEAN,
  });
  assert.deepEqual(checkContent(root, { needles: [''] }).errors, []);
});

test('authorNeedles: inclui e-mail e nome do git e o usuário do sistema, ignorando valores curtos', () => {
  const dir = makeRoot({});
  const gitconfig = join(dir, 'gitconfig');
  writeFileSync(gitconfig, '[user]\n\tname = Ab\n\temail = fulano@example.com\n');
  // GIT_DIR inexistente impede que a configuração local do repositório do projeto interfira.
  const env = {
    ...process.env,
    GIT_CONFIG_GLOBAL: gitconfig,
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_DIR: join(dir, 'sem-repositorio'),
  };
  const needles = authorNeedles(env);
  assert.ok(needles.includes('fulano@example.com'), JSON.stringify(needles));
  assert.ok(!needles.includes('Ab'), 'nome com menos de 4 caracteres não deve entrar');
  assert.ok(needles.every((n) => n.length >= 4), 'todo valor tem pelo menos 4 caracteres');
  const username = userInfo().username;
  if (username.length >= 4) assert.ok(needles.includes(username));
});

test('authorNeedles: sem configuração de git devolve só o usuário do sistema', () => {
  const dir = makeRoot({});
  const gitconfig = join(dir, 'vazio');
  writeFileSync(gitconfig, '');
  const env = {
    ...process.env,
    GIT_CONFIG_GLOBAL: gitconfig,
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_DIR: join(dir, 'sem-repositorio'),
  };
  const username = userInfo().username;
  const expected = username.length >= 4 ? [username] : [];
  assert.deepEqual(authorNeedles(env), expected);
});

test('identidade do autor e procurada em TODO arquivo, inclusive binario (ex.: EXIF de imagem)', () => {
  const root = makeRoot({
    'content/manifest.json': json(manifest([cardWith()])),
    'content/basicas/exemplo/skill.md': CLEAN,
    'foto.png': 'cabecalho\0Artist: Fulano de Tal\0fim',
  });
  assert.deepEqual(checkContent(root, { needles: ['fulano de tal'] }).errors, ['foto.png: identidade-do-autor: ***']);
});

test('byte NUL num arquivo de texto nao desliga a varredura (nao pode ser usado para esconder dados)', () => {
  const root = makeRoot({
    'content/manifest.json': json(manifest([cardWith()])),
    'content/basicas/exemplo/skill.md': CLEAN,
    'content/basicas/exemplo/extra.md': '\0 fale com fulano@example.com',
    'notas.txt': '\0 fale com outro@example.org',
  });
  const errors = checkContent(root).errors;
  assert.ok(errors.includes('content/basicas/exemplo/extra.md: email: fulano@example.com'), errors.join('|'));
  assert.ok(errors.includes('notas.txt: email: outro@example.org'), errors.join('|'));
});

test('imagens e fontes (extensao binaria conhecida) nao passam pelas regras de segredo, so pela identidade', () => {
  const root = makeRoot({
    'content/manifest.json': json(manifest([cardWith()])),
    'content/basicas/exemplo/skill.md': CLEAN,
    'logo.png': 'xx fulano@example.com xx',
    'fonte.woff2': 'ghp_' + 'A'.repeat(36),
  });
  assert.deepEqual(checkContent(root).errors, []);
});
