import { useEffect, useState } from 'react';
import { useEndEntrance } from '../../hooks/useEntrance.js';
import { plural, tierHref, tierLevel } from '../../utils/format.js';
import { TYPE_ICON } from '../../utils/icons.js';
import { resolveTypeTab, TYPE_TAB_LABELS, typeCounts } from '../../utils/tabs.js';
import Callout from '../Callout/Callout.jsx';
import CardTile from '../CardTile/CardTile.jsx';
import Icon from '../Icon/Icon.jsx';
import LevelDots from '../LevelDots/LevelDots.jsx';
import Tabs, { tabId } from '../Tabs/Tabs.jsx';
import TierPieces from './TierPieces.jsx';
import styles from './TierSection.module.css';

/**
 * Faixa de um nível: cabeçalho e abas por tipo de peça. "Todos" mostra os cards do nível; uma aba de tipo (Skills,
 * CLAUDE.md…) mostra direto os arquivos desse tipo de todos os cards. A aba escolhida (`tab`) é guardada por quem
 * usa; se o tipo escolhido não existe nos cards filtrados, mostra todos sem esquecer a escolha.
 */
export default function TierSection({
  tier,
  entries,
  tab,
  onTab,
  heading = 2,
  cardHeading = 3,
  link = true,
}) {
  const endEntrance = useEndEntrance();
  const [swap, setSwap] = useState(false);
  // A animação da troca de aba roda uma vez: depois dela, cards novos (busca, filtro) entram sem animar.
  useEffect(() => {
    if (!swap) return undefined;
    const id = setTimeout(() => setSwap(false), 900);
    return () => clearTimeout(id);
  }, [swap]);
  const Heading = `h${heading}`;
  const available = typeCounts(entries);
  const current = resolveTypeTab(tab, available);

  const items = [
    { id: '', label: 'Todos', count: entries.length, icon: 'folder' },
    ...available.map(({ type, count }) => ({
      id: type,
      label: TYPE_TAB_LABELS[type],
      count,
      icon: TYPE_ICON[type],
    })),
  ].map((d) => ({
    id: d.id,
    children: (
      <>
        <Icon name={d.icon} size={16} />
        <span>{d.label}</span>{' '}
        <span className={styles.typeCount}>
          {d.count}{' '}
          <span className="sr-only">
            {d.id ? (d.count === 1 ? 'arquivo' : 'arquivos') : d.count === 1 ? 'card' : 'cards'}
          </span>
        </span>
      </>
    ),
  }));

  const select = (type) => {
    endEntrance();
    setSwap(true);
    onTab(type);
  };

  return (
    <section className={styles.tier} aria-labelledby={`tier-${tier.id}`}>
      <header className={`${styles.head} enter`} data-reveal="">
        <span className={styles.dots}>
          <LevelDots level={tierLevel(tier.id)} />
        </span>
        <div>
          <Heading id={`tier-${tier.id}`}>
            {link ? <a href={tierHref(tier.id)}>{tier.title}</a> : tier.title}
          </Heading>
          {tier.description && <p>{tier.description}</p>}
        </div>
        <span className={styles.count}>{plural(entries.length, ['card', 'cards'])}</span>
      </header>

      <div className={styles.body}>
        {entries.length === 0 ? (
          <Callout>Nenhum card neste nível ainda.</Callout>
        ) : (
          <>
            <Tabs
              label={`Tipo de peça em ${tier.title}`}
              prefix={`tab-${tier.id}`}
              panelId={`panel-${tier.id}`}
              items={items}
              value={current}
              onChange={select}
              className={`${styles.tabs} enter`}
              tabClassName={styles.tab}
            />
            <div id={`panel-${tier.id}`} role="tabpanel" aria-labelledby={tabId(`tab-${tier.id}`, current)}>
              {current ? (
                <TierPieces entries={entries} type={current} cardHeading={cardHeading} />
              ) : (
                <div className={styles.grid}>
                  {entries.map((e, i) => (
                    <CardTile key={e.card} entry={e} index={i} headingLevel={cardHeading} swap={swap} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
