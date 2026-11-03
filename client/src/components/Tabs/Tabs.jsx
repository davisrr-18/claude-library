import { useRef } from 'react';
import { nextTabIndex } from '../../utils/tabs.js';

export const tabId = (prefix, id) => `${prefix}-${id || 'todos'}`;

/**
 * Abas reais (role="tablist"): setas, Home e End movem o foco e escolhem a aba; só a aba escolhida entra na
 * ordem do Tab. `items` é [{ id, children }]; o painel correspondente deve usar aria-labelledby={tabId(prefix, value)}.
 */
export default function Tabs({ label, prefix, panelId, items, value, onChange, className, tabClassName }) {
  const bar = useRef(null);

  const onKeyDown = (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return; // não rouba Alt+← (voltar), Ctrl+setas etc.
    const buttons = [...bar.current.querySelectorAll('[role="tab"]')];
    const from = buttons.indexOf(e.target.closest('[role="tab"]'));
    const to = from < 0 ? null : nextTabIndex(e.key, from, buttons.length);
    if (to === null) return;
    e.preventDefault();
    buttons[to].focus();
    onChange(items[to].id);
  };

  return (
    // O contêiner só repassa o teclado das abas (padrão WAI-ARIA); os controles são os botões.
    // eslint-disable-next-line jsx-a11y/interactive-supports-focus
    <div ref={bar} role="tablist" aria-label={label} className={className} onKeyDown={onKeyDown}>
      {items.map(({ id, children }) => {
        const selected = id === value;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            id={tabId(prefix, id)}
            aria-controls={panelId}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            className={tabClassName}
            onClick={() => onChange(id)}
          >
            {children}
          </button>
        );
      })}
    </div>
  );
}
