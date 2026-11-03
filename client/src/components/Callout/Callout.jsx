import styles from './Callout.module.css';

/** Aviso. `kind="error"` vira alerta para leitores de tela. */
export default function Callout({ kind = 'notice', children }) {
  const error = kind === 'error';
  return (
    <div
      className={`${styles.callout} ${error ? styles.error : ''}`.trim()}
      role={error ? 'alert' : undefined}
    >
      {children}
    </div>
  );
}
