const LOADERS = {
  javascript: () => import('../../../../vendor/highlight/languages/javascript.min.js'),
  typescript: () => import('../../../../vendor/highlight/languages/typescript.min.js'),
  bash: () => import('../../../../vendor/highlight/languages/bash.min.js'),
  shell: () => import('../../../../vendor/highlight/languages/shell.min.js'),
  json: () => import('../../../../vendor/highlight/languages/json.min.js'),
  yaml: () => import('../../../../vendor/highlight/languages/yaml.min.js'),
  markdown: () => import('../../../../vendor/highlight/languages/markdown.min.js'),
  python: () => import('../../../../vendor/highlight/languages/python.min.js'),
  xml: () => import('../../../../vendor/highlight/languages/xml.min.js'),
  css: () => import('../../../../vendor/highlight/languages/css.min.js'),
  go: () => import('../../../../vendor/highlight/languages/go.min.js'),
  java: () => import('../../../../vendor/highlight/languages/java.min.js'),
  sql: () => import('../../../../vendor/highlight/languages/sql.min.js'),
  diff: () => import('../../../../vendor/highlight/languages/diff.min.js'),
  plaintext: () => import('../../../../vendor/highlight/languages/plaintext.min.js'),
};

const ALIASES = {
  js: 'javascript',
  mjs: 'javascript',
  ts: 'typescript',
  sh: 'bash',
  zsh: 'bash',
  console: 'shell',
  yml: 'yaml',
  md: 'markdown',
  py: 'python',
  html: 'xml',
  svg: 'xml',
  golang: 'go',
  text: 'plaintext',
  txt: 'plaintext',
};

let corePromise;
const core = () =>
  (corePromise ??= import('../../../../vendor/highlight/core.min.js').then((m) => m.default));

/** Destaca `pre code.language-*`. Falhas deixam o código como texto simples. */
export async function highlightCodeBlocks(root) {
  const blocks = [...root.querySelectorAll('pre code[class*="language-"]')];
  if (!blocks.length) return;
  let hljs;
  try {
    hljs = await core();
  } catch {
    return; // sem destaque: o código continua legível
  }
  for (const code of blocks) {
    try {
      const m = code.className.match(/language-([\w-]+)/);
      if (!m) continue;
      const lang = ALIASES[m[1].toLowerCase()] ?? m[1].toLowerCase();
      const load = LOADERS[lang];
      if (!load) continue;
      if (!hljs.getLanguage(lang)) hljs.registerLanguage(lang, (await load()).default);
      hljs.highlightElement(code);
    } catch {
      /* este bloco fica como texto simples; os demais seguem */
    }
  }
}
