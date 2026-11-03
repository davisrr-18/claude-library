import styles from './EmptyState.module.css';

/** Estado vazio com ícone, título (h1 ou h2), texto e uma ação. */
export default function EmptyState({ icon, title, headingLevel = 2, children, action }) {
  const Heading = `h${headingLevel}`;
  return (
    <div className={`${styles.empty} enter`}>
      {icon}
      <Heading>{title}</Heading>
      <p>{children}</p>
      {action}
    </div>
  );
}
