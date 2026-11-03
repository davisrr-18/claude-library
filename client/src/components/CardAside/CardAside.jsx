import { cardHref } from '../../utils/format.js';
import Icon from '../Icon/Icon.jsx';
import styles from './CardAside.module.css';

/** Lista lateral dos cards do mesmo nível (só em telas largas). */
export default function CardAside({ tier, cards, currentId }) {
  return (
    <aside className={`${styles.aside} enter`} aria-label={`Cards em ${tier.title}`} data-reveal="">
      <h2>{tier.title}</h2>
      <ul>
        {cards.map((c, i) => (
          <li key={c.id} className="anim-rise" style={{ '--delay': `${0.2 + Math.min(i, 8) * 0.05}s` }}>
            <a href={cardHref(tier.id, c.id)} aria-current={c.id === currentId ? 'page' : undefined}>
              <Icon name={c.icon || 'folder'} size={16} />
              <span>{c.title}</span>
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
