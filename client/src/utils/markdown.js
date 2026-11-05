import { Marked } from '../../vendor/marked.esm.js';

const SCHEME = /^[a-z][a-z0-9+.-]*:/i;

/**
 * Aceita apenas http(s), âncoras (#x) e caminhos relativos.
 * Remove espaços e caracteres de controle antes de olhar o esquema, pois
 * navegadores ignoram `\t`/`\n` dentro dele (`java\nscript:`).
 */
export function isSafeUrl(url) {
  if (typeof url !== 'string') return false;
  // Navegadores tratam `\` como `/`: `/\evil.com` vira `//evil.com`.
  const u = url.replace(/[\u0000- \u007f-\u009f]/g, '').replace(/\\/g, '/');
  if (!u) return false;
  if (u.startsWith('//')) return false;
  if (SCHEME.test(u)) return /^https?:/i.test(u);
  return true;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const md = new Marked({
  gfm: true,
  renderer: {
    // HTML bruto (bloco ou inline) nunca vira marcação: aparece como texto.
    html({ text }) {
      return escapeHtml(text);
    },
    // Dentro da peça o h1 é o card e o h2 é o título da peça: `#` vira h3 (máximo h6).
    heading({ tokens, depth }) {
      const level = Math.min(depth + 2, 6);
      return `<h${level}>${this.parser.parseInline(tokens)}</h${level}>\n`;
    },
    link({ href, title, tokens }) {
      const inner = this.parser.parseInline(tokens);
      if (!isSafeUrl(href)) return inner;
      const t = title ? ` title="${escapeHtml(title)}"` : '';
      const external = /^https?:/i.test(href.replace(/[\u0000- ]/g, ''));
      const rel = external ? ' rel="noopener noreferrer" target="_blank"' : '';
      return `<a href="${escapeHtml(href)}"${t}${rel}>${inner}</a>`;
    },
    image({ href, title, text }) {
      if (!isSafeUrl(href)) return escapeHtml(text);
      const t = title ? ` title="${escapeHtml(title)}"` : '';
      return `<img src="${escapeHtml(href)}" alt="${escapeHtml(text)}"${t}>`;
    },
  },
});

/** Converte Markdown em HTML seguro para inserir com innerHTML. */
export function renderMarkdown(body) {
  if (typeof body !== 'string' || body === '') return '';
  return md.parse(body, { async: false });
}
