import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <span>Claude Library</span>
      <span>
        Uso pessoal · tecle <kbd>/</kbd> para buscar
      </span>
    </footer>
  );
}
