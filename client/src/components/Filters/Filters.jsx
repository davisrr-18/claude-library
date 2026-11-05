import { useRef } from 'react';
import { useHeightVar } from '../../hooks/useHeightVar.js';
import { plural } from '../../utils/format.js';
import Button from '../Button/Button.jsx';
import Icon from '../Icon/Icon.jsx';
import styles from './Filters.module.css';

/**
 * Filtros da Home: nível (um só), tags (várias) e "Limpar filtros". Fica no fluxo da página (não fixo); informa a própria altura
 * em --altura-filtros para o foco do teclado não ficar atrás dele.
 */
export default function Filters({ tiers, tags, filters, active, onTier, onTag, onClear }) {
  const ref = useRef(null);
  useHeightVar(ref, '--altura-filtros', { onlySticky: true });
  const levels = [{ id: '', title: 'Todos' }, ...tiers];

  return (
    <div ref={ref} className={`${styles.filters} enter`} style={{ '--delay': '0.22s' }}>
      <div className={styles.row}>
        <div className={styles.seg} role="group" aria-label="Filtrar por nível">
          {levels.map((t) => (
            <button
              key={t.id}
              type="button"
              className={styles.segBtn}
              aria-pressed={filters.tier === t.id}
              onClick={() => onTier(t.id)}
            >
              {t.title}
            </button>
          ))}
        </div>
        {active && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            <Icon name="x" size={14} />
            Limpar filtros
          </Button>
        )}
      </div>
      {tags.length > 0 && (
        <div className={styles.tagbar} role="group" aria-label="Filtrar por tag">
          {tags.map(({ tag, count }) => (
            <button
              key={tag}
              type="button"
              className={styles.tagBtn}
              aria-pressed={filters.tags.has(tag)}
              aria-label={`#${tag}, ${plural(count, ['card', 'cards'])}`}
              onClick={() => onTag(tag)}
            >
              {`#${tag}`}
              <span>{count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
