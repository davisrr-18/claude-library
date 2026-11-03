import { useCallback, useEffect, useState } from 'react';
import { reducedMotion } from './useReducedMotion.js';

const dark = () => window.matchMedia('(prefers-color-scheme: dark)');
const readDark = () => {
  const t = document.documentElement.dataset.theme;
  return t ? t === 'dark' : dark().matches;
};

/** Tema claro/escuro: segue o sistema e guarda a escolha (localStorage é opcional). O script do index.html aplica o salvo antes do primeiro paint. */
export function useTheme() {
  const [isDark, setIsDark] = useState(readDark);
  useEffect(() => {
    const mq = dark();
    const sync = () => setIsDark(readDark());
    mq.addEventListener?.('change', sync);
    return () => mq.removeEventListener?.('change', sync);
  }, []);
  const toggle = useCallback(() => {
    const root = document.documentElement;
    const next = readDark() ? 'light' : 'dark';
    if (!reducedMotion()) {
      root.classList.add('theme-anim'); // transição de cores só durante a troca
      setTimeout(() => root.classList.remove('theme-anim'), 450);
    }
    root.dataset.theme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {
      /* sem persistência */
    }
    setIsDark(next === 'dark');
  }, []);
  return { isDark, toggle };
}
