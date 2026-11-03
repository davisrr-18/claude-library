import { useEffect } from 'react';

/**
 * Expõe a altura de um elemento em uma custom property da raiz (ex.: --altura-topo), para o scroll-padding e o
 * `sticky` dos vizinhos. Com `onlySticky`, vale 0 quando o elemento não está fixo (muda por media query).
 */
export function useHeightVar(ref, name, { onlySticky = false } = {}) {
  useEffect(() => {
    const el = ref.current;
    const root = document.documentElement;
    if (!el || !('ResizeObserver' in window)) return undefined;
    const set = () => {
      const fixed = !onlySticky || getComputedStyle(el).position === 'sticky';
      root.style.setProperty(name, fixed ? `${el.offsetHeight}px` : '0px');
    };
    const observer = new ResizeObserver(set);
    observer.observe(el);
    window.addEventListener('resize', set, { passive: true });
    set();
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', set);
      if (onlySticky) root.style.setProperty(name, '0px');
    };
  }, [ref, name, onlySticky]);
}
