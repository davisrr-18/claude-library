import CopyButton from '../CopyButton/CopyButton.jsx';
import styles from './CodeBlock.module.css';

/** Bloco de código rolável pelo teclado, com o botão Copiar em linha própria. `className` ajusta o contêiner. */
export default function CodeBlock({
  code,
  label = 'Bloco de código',
  copyLabel,
  className = '',
  preClassName,
}) {
  return (
    <div className={`${styles.wrap} ${className}`.trim()}>
      <CopyButton
        label="Copiar"
        getText={() => code}
        ariaLabel={copyLabel ?? `Copiar ${label.toLowerCase()}`}
        className={styles.copy}
      />
      {/* A região rolável precisa ser focável para quem usa só o teclado. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
      <pre tabIndex={0} role="region" aria-label={label} className={preClassName}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

export { styles as codeBlockStyles };
