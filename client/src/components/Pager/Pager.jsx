import { cardHref } from '../../utils/format.js';
import Icon from '../Icon/Icon.jsx';
import styles from './Pager.module.css';

/** Anterior / Próximo card do mesmo nível. */
export default function Pager({ tier, prev, next }) {
  return (
    <nav className={styles.pager} aria-label="Outros cards deste nível" data-reveal="">
      {prev ? (
        <a className={styles.link} href={cardHref(tier.id, prev.id)}>
          <Icon name="arrow-left" size={16} />
          <span>
            <small>Anterior</small>
            {prev.title}
          </span>
        </a>
      ) : (
        <span />
      )}
      {next && (
        <a className={`${styles.link} ${styles.next}`} href={cardHref(tier.id, next.id)}>
          <span>
            <small>Próximo</small>
            {next.title}
          </span>
          <Icon name="arrow-right" size={16} />
        </a>
      )}
    </nav>
  );
}
