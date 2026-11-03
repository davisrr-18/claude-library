import styles from './Crumbs.module.css';

/** Trilha "Início / Nível / Card". `items` é [{ label, href? }]; o último (sem href) é a página atual. */
export default function Crumbs({ items }) {
  return (
    <nav className={`${styles.crumbs} enter`} aria-label="Você está em">
      {items.map(({ label, href }) =>
        href ? (
          <a key={label} href={href}>
            {label}
          </a>
        ) : (
          <span key={label}>{label}</span>
        ),
      )}
    </nav>
  );
}
