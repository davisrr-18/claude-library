import { isSafeUrl } from './markdown.js';

/**
 * Política da segunda camada de sanitização (aplicada ao DOM em app.js).
 * Pura e sem DOM para poder ser testada em Node.
 */
const ALLOWED_TAGS = new Set([
  'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'LI', 'A', 'IMG', 'CODE', 'PRE', 'EM', 'STRONG',
  'DEL', 'BLOCKQUOTE', 'HR', 'BR', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD', 'INPUT',
]);

const PLAIN_ATTRS = new Set(['alt', 'title', 'rel', 'disabled', 'checked']);

/** `attrs` é um objeto nome → valor com os atributos do elemento. */
export function isTagAllowed(tagName, attrs = {}) {
  const tag = String(tagName).toUpperCase();
  if (!ALLOWED_TAGS.has(tag)) return false;
  if (tag === 'INPUT') return attrs.type === 'checkbox';
  return true;
}

export function isAttrAllowed(tagName, name, value) {
  const tag = String(tagName).toUpperCase();
  const v = String(value);
  if (PLAIN_ATTRS.has(name)) return true;
  switch (name) {
    case 'href':
    case 'src':
      return isSafeUrl(v);
    case 'start':
      return tag === 'OL' && /^\d{1,6}$/.test(v);
    case 'type':
      return tag === 'INPUT' && v === 'checkbox';
    case 'target':
      return v === '_blank';
    case 'class':
      return /^[\w -]+$/.test(v);
    case 'align':
      return ['left', 'center', 'right'].includes(v);
    default:
      return false;
  }
}
