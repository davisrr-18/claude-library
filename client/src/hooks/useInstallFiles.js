import { useEffect, useState } from 'react';
import { loadPiece } from '../services/content.js';
import { parseFrontMatter } from '../utils/content.js';
import { installFile } from '../utils/install.js';

const NONE = { files: [], failed: 0 };

/**
 * Arquivos instaláveis de um card, na ordem do manifest, e quantas peças falharam ao carregar (`failed`): sem elas, os
 * comandos de instalação ficariam incompletos e quem usa precisa avisar.
 */
export function useInstallFiles(card) {
  const [state, setState] = useState({ card, ...NONE });
  useEffect(() => {
    let cancelled = false;
    Promise.all(
      card.pieces.map((p) =>
        loadPiece(p.file).then(
          (raw) => {
            try {
              const { meta, body } = parseFrontMatter(raw);
              return { file: installFile(p, meta, body) };
            } catch {
              return { failed: true };
            }
          },
          () => ({ failed: true }),
        ),
      ),
    ).then((results) => {
      if (cancelled) return;
      setState({
        card,
        files: results.map((r) => r.file).filter(Boolean),
        failed: results.filter((r) => r.failed).length,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [card]);
  return state.card === card ? state : NONE;
}
