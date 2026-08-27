import styles from './Btn.module.css';

// `.base-btn` is pulled in only via `composes:` — a use of it — even though
// no source file references it under any spelling. Must survive every
// convention, including `camelCaseOnly`/`dashesOnly` which rename it.
export const Btn = () => <div className={styles.primaryBtn} />;
