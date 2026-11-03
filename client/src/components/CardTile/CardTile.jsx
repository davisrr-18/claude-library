import { useId } from 'react';
import { TYPE_ICON } from '../../utils/icons.js';
import { cardHref, TYPE_LABELS } from '../../utils/format.js';
import { dedupeTags } from '../../utils/search.js';
import { groupPiecesByType } from '../../utils/tabs.js';
import Icon from '../Icon/Icon.jsx';
import styles from './CardTile.module.css';

/** Card da vitrine: um link para a página do card. `index` escalona a entrada; `swap` anima a troca de aba. */
export default function CardTile({ entry, index = 0, headingLevel = 3, swap = false }) {
  const { cardObj: card, tierObj: tier } = entry;
  const titleId = useId();
  const Heading = `h${headingLevel}`;
  const tags = dedupeTags(card.tags);
  const i = Math.min(index, 8);

  return (
    <a
      className={`${styles.card} enter ${swap ? 'anim-rise' : ''}`.trim()}
      href={cardHref(tier.id, card.id)}
      aria-labelledby={titleId}
      data-glow="card"
      data-reveal=""
      style={{ '--i': i, '--delay': swap ? `${i * 0.045}s` : `${0.2 + index * 0.07}s` }}
    >
      <span className={styles.icon}>
        <Icon name={card.icon || 'folder'} size={22} />
      </span>
      <Heading id={titleId}>{card.title}</Heading>
      <p className={styles.summary}>{card.summary || ''}</p>
      <ul className={styles.chips} aria-label="Peças incluídas">
        {groupPiecesByType(card.pieces).map((g) => (
          <li key={g.type} className={styles.chip}>
            <Icon name={TYPE_ICON[g.type]} size={13} />
            {TYPE_LABELS[g.type]}
            {g.pieces.length > 1 ? ` ×${g.pieces.length}` : ''}
          </li>
        ))}
      </ul>
      {tags.length > 0 && (
        <ul className={styles.tags} aria-label="Tags">
          {tags.map((t) => (
            <li key={t} className={styles.tag}>{`#${t}`}</li>
          ))}
        </ul>
      )}
      <span className={styles.go} aria-hidden="true">
        <Icon name="arrow-right" size={16} />
      </span>
    </a>
  );
}
