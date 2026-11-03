import { dedupeTags } from '../../utils/search.js';
import Icon from '../Icon/Icon.jsx';
import LevelDots from '../LevelDots/LevelDots.jsx';
import styles from './CardHero.module.css';

/** Cabeçalho da página do card: ícone, nível, título (h1), resumo e tags. */
export default function CardHero({ tier, level, card }) {
  const tags = dedupeTags(card.tags);
  return (
    <header className={`${styles.hero} enter`}>
      <span className={styles.icon}>
        <Icon name={card.icon || 'folder'} size={30} />
      </span>
      <div>
        <div className={styles.meta}>
          <LevelDots level={level} />
          <span>{tier.title}</span>
        </div>
        <h1>{card.title}</h1>
        {card.summary && <p className={styles.lead}>{card.summary}</p>}
        {tags.length > 0 && (
          <ul className={styles.tags}>
            {tags.map((t) => (
              <li key={t}>{`#${t}`}</li>
            ))}
          </ul>
        )}
      </div>
    </header>
  );
}
