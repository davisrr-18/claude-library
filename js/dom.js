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
export function copyButton(label, getText, extraClass = '', ariaLabel = null) {
  const content = (name, text) => [icon(name, 15), h('span', {}, text)];
  const btn = h('button', { type: 'button', class: `btn btn-ghost btn-sm ${extraClass}`.trim(), 'aria-live': 'polite', 'aria-label': ariaLabel }, content('copy', label));
  let resetTimer;
  btn.addEventListener('click', async () => {
    const ok = await copyText(getText());
    btn.replaceChildren(...(ok ? content('check', 'Copiado!') : content('x', 'Não foi possível copiar')));
    clearTimeout(resetTimer); // clique duplo não encurta o aviso
    resetTimer = setTimeout(() => btn.replaceChildren(...content('copy', label)), 1800);
  });
  return btn;
}

/** Envolve cada <pre> com um botão de copiar e o torna rolável pelo teclado. */
export function addCopyButtons(root) {
  const blocks = [...root.querySelectorAll('pre')];
  blocks.forEach((pre, i) => {
    const wrap = h('div', { class: 'code-wrap' });
    pre.replaceWith(wrap);
    pre.setAttribute('tabindex', '0');
    pre.setAttribute('role', 'region');
    pre.setAttribute('aria-label', blocks.length > 1 ? `Bloco de código ${i + 1} de ${blocks.length}` : 'Bloco de código');
    const label = blocks.length > 1 ? `Copiar bloco de código ${i + 1} de ${blocks.length}` : 'Copiar bloco de código';
    wrap.append(copyButton('Copiar', () => pre.textContent, 'code-copy', label), pre);
  });
}

/** Tabelas largas ganham um contêiner rolável focável (mantém a semântica de tabela). */
export function wrapTables(root) {
  for (const table of root.querySelectorAll('table')) {
    const wrap = h('div', { class: 'table-wrap', tabindex: '0', role: 'region', 'aria-label': 'Tabela (use as setas para rolar)' });
    table.replaceWith(wrap);
    wrap.append(table);
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
