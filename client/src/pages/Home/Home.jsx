import { useDeferredValue, useEffect, useMemo } from 'react';
import Button from '../../components/Button/Button.jsx';
import EmptyState from '../../components/EmptyState/EmptyState.jsx';
import Filters from '../../components/Filters/Filters.jsx';
import Hero from '../../components/Hero/Hero.jsx';
import Icon from '../../components/Icon/Icon.jsx';
import TierSection from '../../components/TierSection/TierSection.jsx';
import { useEndEntrance } from '../../hooks/useEntrance.js';
import { plural } from '../../utils/format.js';
import { collectTags, search } from '../../utils/search.js';
import styles from './Home.module.css';

export const NO_FILTERS = { q: '', tier: '', tags: new Set() };

/**
 * Vitrine: busca, filtros por nível e tag, e uma faixa por nível. O estado dos filtros e das abas mora em quem
 * usa (App), então volta igual ao navegar e voltar. `focusSearchRef` é um ref que o atalho "/" liga.
 */
export default function Home({ library, filters, onFilters, tierTabs, onTierTab, focusSearchRef }) {
  const { manifest, entries, index, ensureBodies } = library;
  const endEntrance = useEndEntrance();
  const q = useDeferredValue(filters.q); // com muitos cards, não reconstrói a lista a cada tecla
  const tags = useMemo(() => collectTags(entries), [entries]);
  const found = useMemo(
    () => search(index, q, { tier: filters.tier || undefined, tags: [...filters.tags] }),
    [index, q, filters.tier, filters.tags],
  );

  const active = Boolean(filters.q.trim() || filters.tier || filters.tags.size);
  const narrowed = Boolean(q.trim() || filters.tags.size);
  const change = (next) => {
    endEntrance(); // o que for recriado por busca/filtro não repete a animação de entrada
    onFilters(next);
  };

  useEffect(() => {
    if (filters.q) ensureBodies();
    if (focusSearchRef.current) {
      focusSearchRef.current = false;
      document.getElementById('q')?.focus();
    }
    // Só ao entrar na Home: depois, a busca chama ensureBodies ao digitar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const byTier = new Map(manifest.tiers.map((t) => [t.id, []]));
  for (const e of found) byTier.get(e.tier).push(e);
  // Só nível escolhido (sem texto nem tags): mostra a faixa mesmo vazia, com o aviso do nível.
  const sections = manifest.tiers.filter(
    (t) => (!filters.tier || filters.tier === t.id) && (!narrowed || byTier.get(t.id).length),
  );

  const clearAll = () => {
    change(NO_FILTERS);
    document.getElementById('q')?.focus();
  };

  return (
    <>
      <Hero
        manifest={manifest}
        cardCount={entries.length}
        query={filters.q}
        onQuery={(value) => {
          ensureBodies();
          change({ ...filters, q: value });
        }}
        onClear={clearAll}
      />
      <Filters
        tiers={manifest.tiers}
        tags={tags}
        filters={filters}
        active={active}
        onTier={(tier) => change({ ...filters, tier })}
        onTag={(tag) => {
          const next = new Set(filters.tags);
          if (!next.delete(tag)) next.add(tag);
          change({ ...filters, tags: next });
        }}
        onClear={clearAll}
      />
      <p className={styles.status} aria-live="polite">
        {active ? `${plural(found.length, ['card encontrado', 'cards encontrados'])}.` : ''}
      </p>
      <div id="results">
        {narrowed && !found.length ? (
          <EmptyState
            icon={<Icon name="search" size={28} />}
            title="Nada encontrado"
            action={<Button onClick={clearAll}>Limpar filtros</Button>}
          >
            Tente outras palavras ou remova algum filtro.
          </EmptyState>
        ) : (
          sections.map((t) => (
            <TierSection
              key={t.id}
              tier={t}
              entries={byTier.get(t.id)}
              tab={tierTabs[t.id]}
              onTab={(type) => onTierTab(t.id, type)}
            />
          ))
        )}
      </div>
    </>
  );
}
