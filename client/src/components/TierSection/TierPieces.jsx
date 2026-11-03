import { cardHref } from '../../utils/format.js';
import Icon from '../Icon/Icon.jsx';
import PieceView from '../PieceView/PieceView.jsx';
import styles from './TierSection.module.css';

/**
 * Arquivos de um tipo (ex.: todos os CLAUDE.md) de todos os cards de uma faixa, agrupados pelo card de origem.
 * O título do card tem o nível `cardHeading` e o da peça, o seguinte.
 */
export default function TierPieces({ entries, type, cardHeading }) {
  const Heading = `h${cardHeading}`;
  const groups = entries
    .map((entry) => ({ entry, pieces: entry.cardObj.pieces.filter((p) => p.type === type) }))
    .filter((g) => g.pieces.length);

  return groups.map(({ entry, pieces }) => (
    <div key={entry.card} className={styles.group}>
      <Heading className={styles.origin}>
        <a href={cardHref(entry.tierObj.id, entry.cardObj.id)}>
          <Icon name={entry.cardObj.icon || 'folder'} size={16} />
          <span>{entry.cardObj.title}</span>
        </a>
      </Heading>
      {pieces.map((p) => (
        <PieceView key={p.file} piece={p} headingLevel={cardHeading + 1} />
      ))}
    </div>
  ));
}
