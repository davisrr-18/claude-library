import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { loadManifest, loadPiece } from '../services/content.js';
import { parseFrontMatter } from '../utils/content.js';
import { buildEntries } from '../utils/entries.js';
import { buildIndex } from '../utils/search.js';

const RETRY_MS = 5000;
const keyOf = (e) => `${e.tier}/${e.card}`;

/**
 * Manifest + cards + índice de busca. `ensureBodies()` carrega o corpo de todas as peças uma vez para a busca no
 * texto; se alguma falhar, o resultado parcial não é guardado e a próxima busca tenta de novo após 5 s.
 */
export function useLibrary() {
  const [load, setLoad] = useState({ status: 'loading' });
  const [texts, setTexts] = useState(null);
  const bodies = useRef({ promise: null, retryAt: 0 });

  useEffect(() => {
    let cancelled = false;
    loadManifest().then(
      (manifest) => !cancelled && setLoad({ status: 'ready', manifest, base: buildEntries(manifest) }),
      (error) => !cancelled && setLoad({ status: 'error', error }),
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const entries = useMemo(
    () => (load.base ?? []).map((e) => ({ ...e, text: texts?.get(keyOf(e)) ?? '' })),
    [load.base, texts],
  );
  const index = useMemo(() => buildIndex(entries), [entries]);

  const ensureBodies = useCallback(() => {
    const state = bodies.current;
    if (!load.base || (!state.promise && Date.now() < state.retryAt)) return Promise.resolve();
    state.promise ??= (async () => {
      let incomplete = false;
      const map = new Map();
      await Promise.all(
        load.base.map(async (entry) => {
          const parts = await Promise.all(
            entry.cardObj.pieces.map((p) =>
              loadPiece(p.file)
                .then((t) => parseFrontMatter(t).body)
                .catch(() => {
                  incomplete = true;
                  return '';
                }),
            ),
          );
          map.set(keyOf(entry), parts.join('\n'));
        }),
      );
      setTexts(map);
      if (incomplete) {
        state.promise = null;
        state.retryAt = Date.now() + RETRY_MS;
      }
    })();
    return state.promise;
  }, [load.base]);

  return { status: load.status, error: load.error, manifest: load.manifest, entries, index, ensureBodies };
}
