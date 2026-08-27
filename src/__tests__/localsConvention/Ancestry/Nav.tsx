import styles from './Nav.module.scss';

// `.nav-bar-item` (SCSS suffix concat) is referenced by its camelCase local.
// `.nav-bar` is the concat parent — never named directly — and must still be
// rescued as used, or --remove would delete the rule holding `&-item`.
export const Nav = () => <div className={styles.navBarItem} />;
