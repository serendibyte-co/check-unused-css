import styles from './Card.module.css';

// No hyphens anywhere: every convention must behave identically here.
// `.cardBody` is unused; `.card` and `.cardTitle` are used.
export const Card = () => (
  <div className={styles.card}>
    <div className={styles.cardTitle} />
  </div>
);
