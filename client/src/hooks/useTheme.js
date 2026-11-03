import { useCallback, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { reducedMotion } from '../dom/reducedMotion.js';

const dark = () => window.matchMedia('(prefers-color-scheme: dark)');
const readDark = () => {
  const t = document.documentElement.dataset.theme;
  return t ? t === 'dark' : dark().matches;
};

/**
 * Tema claro/escuro: segue o sistema e guarda a escolha (localStorage é opcional). O script do index.html aplica o
 * salvo antes do primeiro paint. A troca usa View Transitions (a tela inteira faz um fade, sem o "pulo" de gradientes e
 * de transições por elemento); sem suporte, ou com movimento reduzido, troca na hora.
 */
export function useTheme() {
  const [isDark, setIsDark] = useState(readDark);
  useEffect(() => {
    const mq = dark();
    const sync = () => setIsDark(readDark());
    mq.addEventListener?.('change', sync);
    return () => mq.removeEventListener?.('change', sync);
  }, []);
  const toggle = useCallback(() => {
    const apply = () => {
      // O tema seguinte é calculado só aqui, na hora de aplicar: dois cliques no mesmo frame alternam duas vezes.
      const next = readDark() ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      try {
        localStorage.setItem('theme', next);
      } catch {
        /* sem persistência */
      }
      flushSync(() => setIsDark(next === 'dark')); // o ícone também entra na imagem "nova" da transição
    };
    if (document.startViewTransition && !reducedMotion()) {
      const transition = document.startViewTransition(apply);
      // Uma transição pulada (clique repetido) rejeita estas promessas; a troca em si já foi aplicada.
      transition?.ready?.catch?.(() => {});
      transition?.finished?.catch?.(() => {});
    } else apply();
  }, []);
  return { isDark, toggle };
}
