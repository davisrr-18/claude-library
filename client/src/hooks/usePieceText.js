import { useEffect, useState } from 'react';
import { loadPiece } from '../services/content.js';

/** Texto de uma peça: { status: 'loading' | 'ready' | 'error', text, error }. Falha de uma peça não afeta as outras. */
export function usePieceText(file) {
  const [state, setState] = useState({ file, status: 'loading' });
  useEffect(() => {
    let cancelled = false;
    loadPiece(file).then(
      (text) => !cancelled && setState({ file, status: 'ready', text }),
      (error) => !cancelled && setState({ file, status: 'error', error }),
    );
    return () => {
      cancelled = true;
    };
  }, [file]);
  return state.file === file ? state : { file, status: 'loading' };
}
