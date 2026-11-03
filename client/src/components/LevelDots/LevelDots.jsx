import styles from './LevelDots.module.css';

/**
 * Três pontos que mostram o nível (1 a 3). `label=""` esconde dos leitores de tela (o texto ao lado já diz o
 * nível); sem `label` usa "Nível N de 3".
 */
export default function LevelDots({ level, label }) {
  const a11y =
    label === '' ? { 'aria-hidden': 'true' } : { role: 'img', 'aria-label': label ?? `Nível ${level} de 3` };
  return (
    <span className={styles.level} {...a11y}>
      {[1, 2, 3].map((i) => (
        <i key={i} className={i <= level ? styles.on : undefined} data-on={i <= level ? '' : undefined} />
      ))}
    </span>
  );
}
