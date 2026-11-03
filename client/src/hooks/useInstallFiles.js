import { useEffect, useState } from 'react';
import { loadPiece } from '../services/content.js';
import { parseFrontMatter } from '../utils/content.js';
import { installFile } from '../utils/install.js';

/** Todos os arquivos instaláveis de um card, na ordem do manifest. Peças que falham ao carregar são ignoradas. */
export function useInstallFiles(card) {
  const [state, setState] = useState({ card, files: [] });
  useEffect(() => {
    let cancelled = false;
    Promise.all(
      card.pieces.map((p) =>
        loadPiece(p.file)
          .then((raw) => {
            const { meta, body } = parseFrontMatter(raw);
            return installFile(p, meta, body);
          })
          .catch(() => null),
      ),
    ).then((files) => !cancelled && setState({ card, files: files.filter(Boolean) }));
    return () => {
      cancelled = true;
    };
  }, [card]);
  return state.card === card ? state.files : [];
}
