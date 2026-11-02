import { isTagAllowed, isAttrAllowed } from './sanitize.js';
import { icon } from './icons.js';

/** Cria elemento sem innerHTML: todo texto entra como nó de texto. `onclick` etc. aceitam funções. */
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v == null) continue;
    if (typeof v === 'function' && k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

/**
 * Segunda camada de defesa: o HTML de renderMarkdown já escapa HTML bruto e filtra URLs.
 * Aqui ele é parseado em um <template> (inerte: nada executa nem carrega) e só passam
 * tags e atributos aprovados por js/sanitize.js (política pura, testada em Node).
 */
export function safeFragment(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  const walk = (node) => {
    for (const child of [...node.children]) {
      const attrs = Object.fromEntries([...child.attributes].map((a) => [a.name, a.value]));
      if (!isTagAllowed(child.tagName, attrs)) { child.remove(); continue; }
      for (const [name, value] of Object.entries(attrs)) {
        if (!isAttrAllowed(child.tagName, name, value)) child.removeAttribute(name);
      }
      walk(child);
    }
  };
  walk(tpl.content);
  return tpl.content;
}

/** Copia texto; usa a Clipboard API e, se indisponível, um textarea temporário. */
export async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* cai no fallback */ }
  try {
    const ta = h('textarea', { 'aria-hidden': 'true', style: 'position:fixed;opacity:0;top:0' });
    ta.value = text;
    document.body.append(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

/** Botão que copia `getText()` e mostra o resultado por 1,8 s (anunciado via aria-live). */
export function copyButton(label, getText, extraClass = '') {
  const content = (name, text) => [icon(name, 15), h('span', {}, text)];
  const btn = h('button', { type: 'button', class: `btn btn-ghost btn-sm ${extraClass}`.trim(), 'aria-live': 'polite' }, content('copy', label));
  btn.addEventListener('click', async () => {
    const ok = await copyText(getText());
    btn.replaceChildren(...(ok ? content('check', 'Copiado!') : content('x', 'Não foi possível copiar')));
    setTimeout(() => btn.replaceChildren(...content('copy', label)), 1800);
  });
  return btn;
}

/** Envolve cada <pre> com um botão de copiar. */
export function addCopyButtons(root) {
  for (const pre of root.querySelectorAll('pre')) {
    const wrap = h('div', { class: 'code-wrap' });
    pre.replaceWith(wrap);
    wrap.append(copyButton('Copiar', () => pre.textContent, 'code-copy'), pre);
  }
}

/** Tema claro/escuro: respeita o sistema e guarda a escolha (localStorage é opcional). */
export function initTheme(btn) {
  const root = document.documentElement;
  let themeTimer;
  const write = (v) => { try { localStorage.setItem('theme', v); } catch { /* sem persistência */ } };
  const isDark = () => (root.dataset.theme
    ? root.dataset.theme === 'dark'
    : matchMedia('(prefers-color-scheme: dark)').matches);
  const paint = () => {
    btn.replaceChildren(icon(isDark() ? 'sun' : 'moon', 18));
    btn.setAttribute('aria-label', isDark() ? 'Mudar para o tema claro' : 'Mudar para o tema escuro');
  };
  btn.hidden = false;
  btn.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      root.classList.add('theme-anim'); // transição de cores só durante a troca
      clearTimeout(themeTimer);
      themeTimer = setTimeout(() => root.classList.remove('theme-anim'), 450);
    }
    root.dataset.theme = next;
    write(next);
    paint();
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', paint);
  paint();
}
