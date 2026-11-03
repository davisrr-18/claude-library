import { useRef } from 'react';
import { useHeightVar } from '../../hooks/useHeightVar.js';
import { useScrollFx } from '../../hooks/useScrollFx.js';
import { useTheme } from '../../hooks/useTheme.js';
import { tierHref, tierLevel } from '../../utils/format.js';
import Icon from '../Icon/Icon.jsx';
import LevelDots from '../LevelDots/LevelDots.jsx';
import styles from './Topbar.module.css';

/** Topo: marca, níveis, tema, sombra ao rolar e barra de progresso de leitura. */
export default function Topbar({ tiers, activeTier }) {
  const ref = useRef(null);
  const bar = useRef(null);
  const scrolled = useScrollFx(bar);
  const { isDark, toggle } = useTheme();
  useHeightVar(ref, '--altura-topo');

  return (
    <>
      <header ref={ref} className={`${styles.topbar} ${scrolled ? styles.scrolled : ''}`.trim()}>
        <a className={styles.brand} href="#/" aria-label="Claude Library, início">
          <span className={styles.mark} aria-hidden="true">
            &gt;_
          </span>
          <span className={styles.name}>Claude Library</span>
        </a>
        <nav className={styles.tiers} aria-label="Níveis">
          {tiers.map((t) => (
            <a key={t.id} href={tierHref(t.id)} aria-current={t.id === activeTier ? 'page' : undefined}>
              <LevelDots level={tierLevel(t.id)} label="" />
              <span>{t.title}</span>
            </a>
          ))}
        </nav>
        <button
          type="button"
          className={styles.iconBtn}
          aria-label={isDark ? 'Mudar para o tema claro' : 'Mudar para o tema escuro'}
          onClick={toggle}
        >
          <Icon name={isDark ? 'sun' : 'moon'} size={18} />
        </button>
      </header>
      <div ref={bar} className={styles.progress} aria-hidden="true" />
    </>
  );
}
