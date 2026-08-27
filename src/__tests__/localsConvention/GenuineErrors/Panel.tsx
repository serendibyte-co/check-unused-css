import styles from './Panel.module.css';

// Even with convention-aware matching on, real problems must still surface:
// `.dead-rule` is never referenced (unused) and `.ghostClass` has no matching
// rule under any spelling (non-existent).
export const Panel = () => (
  <div className={styles.sidePanel}>
    <span className={styles.ghostClass} />
  </div>
);
