import { useLayoutEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { highlightCodeBlocks } from '../../dom/highlight.js';
import { removeDuplicateTitle, safeFragment, wrapCodeBlocks, wrapTables } from '../../dom/markdownDom.js';
import { revealOnScroll } from '../../dom/reveal.js';
import { renderMarkdown } from '../../utils/markdown.js';
import { codeBlockStyles } from '../CodeBlock/CodeBlock.jsx';
import CopyButton from '../CopyButton/CopyButton.jsx';
import styles from './Markdown.module.css';

/**
 * Corpo de uma peça em Markdown. O HTML passa por renderMarkdown (escapa HTML bruto, filtra URLs) e por safeFragment
 * (lista de permissões) e é montado no DOM sem dangerouslySetInnerHTML. Os botões Copiar dos blocos de código são
 * componentes React em portais. `titles` são nomes que, se iguais ao primeiro título do corpo, o removem.
 */
export default function Markdown({ body, titles = [] }) {
  const holder = useRef(null);
  const key = titles.join('\u0000');

  // O DOM do artigo é montado uma vez por (body, titles) e reaproveitado se o efeito rodar de novo.
  const built = useMemo(() => {
    const article = document.createElement('article');
    article.className = styles.md;
    article.append(safeFragment(renderMarkdown(body)));
    removeDuplicateTitle(article, key ? key.split('\u0000') : []);
    wrapTables(article, styles.tableWrap);
    const blocks = wrapCodeBlocks(article, {
      wrapClass: codeBlockStyles.wrap,
      hostClass: codeBlockStyles.copy,
    });
    [...article.children].forEach((el, i) => {
      el.style.setProperty('--i', String(i));
      el.classList.add('anim-rise');
      el.style.setProperty('--delay', `${0.08 + Math.min(i, 10) * 0.045}s`);
    });
    return { article, blocks };
  }, [body, key]);

  useLayoutEffect(() => {
    holder.current.replaceChildren(built.article);
    revealOnScroll(built.article.children);
    highlightCodeBlocks(built.article);
  }, [built]);

  return (
    <>
      <div ref={holder} />
      {built.blocks.map(({ host, pre, label }, i) =>
        createPortal(
          <CopyButton label="Copiar" getText={() => pre.textContent} ariaLabel={label} />,
          host,
          i,
        ),
      )}
    </>
  );
}
