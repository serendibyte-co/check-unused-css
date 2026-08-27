import styles from './Widget.module.css';

// `.header-bar` and `.nav-list` are authored kebab-case but referenced by their
// camelCase locals; `.footer-note` is referenced by its original kebab string
// via bracket access. All three are valid under `localsConvention: 'camelCase'`.
export const Widget = () => (
  <div className={styles.headerBar}>
    <ul className={styles.navList} />
    <span className={styles['footer-note']} />
  </div>
);
