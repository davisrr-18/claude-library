import styles from './Skeleton.module.css';

export default function Skeleton() {
  return (
    <div className={styles.skeleton} role="status" aria-busy="true" aria-label="Carregando">
      <i style={{ width: '40%' }} />
      <i />
      <i />
      <i style={{ width: '70%' }} />
    </div>
  );
}
