import { pieceHref, TYPE_LABELS } from '../../utils/format.js';
import { TYPE_ICON } from '../../utils/icons.js';
import Icon from '../Icon/Icon.jsx';
import styles from './PieceTabs.module.css';

/**
 * Abas da página do card. São links de navegação (cada tipo tem a própria rota), não abas com setas: o Tab alcança
 * todas. `groups` vem de groupPiecesByType.
 */
export default function PieceTabs({ tier, card, groups, current }) {
  return (
    <nav className={`${styles.tabs} enter`} aria-label="Peças do card" data-piece-tabs="">
      {groups.map((g) => (
        <a
          key={g.type}
          href={pieceHref(tier.id, card.id, g.type)}
          aria-current={g === current ? 'page' : undefined}
        >
          <Icon name={TYPE_ICON[g.type]} size={16} />
          {TYPE_LABELS[g.type]}
          {g.pieces.length > 1 && (
            <span className={styles.count}>
              {g.pieces.length} <span className="sr-only">peças</span>
            </span>
          )}
        </a>
      ))}
    </nav>
  );
}
