import { sameTitle } from '../../utils/search.js';
import { isAttrAllowed, isTagAllowed } from '../../utils/sanitize.js';

/**
 * Segunda camada de defesa: o HTML de renderMarkdown já escapa HTML bruto e filtra URLs. Aqui ele é parseado em
 * um <template> (inerte: nada executa nem carrega) e só passam tags e atributos aprovados por utils/sanitize.js.
 * É o único lugar do client que insere HTML vindo do conteúdo.
 */
export function safeFragment(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  const walk = (node) => {
    for (const child of [...node.children]) {
      const attrs = Object.fromEntries([...child.attributes].map((a) => [a.name, a.value]));
      if (!isTagAllowed(child.tagName, attrs)) {
        child.remove();
        continue;
      }
      for (const [name, value] of Object.entries(attrs)) {
        if (!isAttrAllowed(child.tagName, name, value)) child.removeAttribute(name);
      }
      walk(child);
    }
  };
  walk(tpl.content);
  return tpl.content;
}

/** O título da peça já está no cabeçalho: remove o primeiro título do corpo se for o mesmo. */
export function removeDuplicateTitle(article, titles) {
  const first = article.firstElementChild;
  if (first && /^H[1-6]$/.test(first.tagName) && titles.some((t) => t && sameTitle(first.textContent, t)))
    first.remove();
}

/** Tabelas largas ganham um contêiner rolável focável (mantém a semântica de tabela). */
export function wrapTables(article, className) {
  for (const table of article.querySelectorAll('table')) {
    const wrap = document.createElement('div');
    wrap.className = className;
    wrap.tabIndex = 0;
    wrap.setAttribute('role', 'region');
    wrap.setAttribute('aria-label', 'Tabela (use as setas para rolar)');
    table.replaceWith(wrap);
    wrap.append(table);
  }
}

/**
 * Envolve cada <pre> em uma caixa com um espaço para o botão Copiar e o torna rolável pelo teclado.
 * Devolve [{ host, pre, label }]: `host` é onde o React põe o botão.
 */
export function wrapCodeBlocks(article, { wrapClass, hostClass }) {
  const pres = [...article.querySelectorAll('pre')];
  return pres.map((pre, i) => {
    const wrap = document.createElement('div');
    wrap.className = wrapClass;
    const host = document.createElement('div');
    host.className = hostClass;
    pre.replaceWith(wrap);
    const n = pres.length > 1 ? ` ${i + 1} de ${pres.length}` : '';
    pre.tabIndex = 0;
    pre.setAttribute('role', 'region');
    pre.setAttribute('aria-label', `Bloco de código${n}`);
    wrap.append(host, pre);
    return { host, pre, label: `Copiar bloco de código${n}` };
  });
}
