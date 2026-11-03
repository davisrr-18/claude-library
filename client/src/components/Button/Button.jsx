import styles from './Button.module.css';

/** Botão ou link com cara de botão (se `href`). `variant="ghost"` é o secundário; `size="sm"` o compacto. */
export default function Button({ href, variant, size, className = '', children, ...rest }) {
  const cls = [styles.btn, variant === 'ghost' && styles.ghost, size === 'sm' && styles.sm, className]
    .filter(Boolean)
    .join(' ');
  if (href !== undefined) {
    return (
      <a className={cls} href={href} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" className={cls} {...rest}>
      {children}
    </button>
  );
}
