import { useEffect, useState } from 'react';
import { isAppHash } from '../utils/router.js';

/**
 * `location.hash` como estado. Âncoras que não são rota (`#main`, do link "Pular para o conteúdo") são ignoradas,
 * e entrar por uma delas vira a Home.
 */
export function useHash() {
  const [hash, setHash] = useState(() => {
    if (!isAppHash(window.location.hash)) {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#/`);
    }
    return window.location.hash;
  });
  useEffect(() => {
    const onChange = () => {
      if (isAppHash(window.location.hash)) setHash(window.location.hash);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return hash;
}
