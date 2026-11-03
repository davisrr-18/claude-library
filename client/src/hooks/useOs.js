import { useCallback, useState } from 'react';
import { OS_LIST, detectOs } from '../utils/install.js';

/** Sistema operacional preferido para os comandos de instalação: escolha salva, senão detectado. */
function initialOs() {
  let saved = null;
  try {
    saved = localStorage.getItem('os');
  } catch {
    /* sem persistência */
  }
  if (OS_LIST.some((o) => o.id === saved)) return saved;
  return detectOs(navigator.userAgentData?.platform || navigator.platform || navigator.userAgent);
}

let preferred = null;

export function useOs() {
  const [os, setOs] = useState(() => (preferred ??= initialOs()));
  const choose = useCallback((id) => {
    preferred = id;
    try {
      localStorage.setItem('os', id);
    } catch {
      /* sem persistência */
    }
    setOs(id);
  }, []);
  return [os, choose];
}
