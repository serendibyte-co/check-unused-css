import styles from './Thing.module.css';

// `.foo_bar` has an underscore: the `camelCase` family folds it to `fooBar`,
// but the `dashes` family only converts dashes and leaves `foo_bar` as-is — so
// `styles.fooBar` resolves under `camelCase`/`camelCaseOnly` and not under
// `dashes`/`dashesOnly`. `.plain-key` folds identically for both families.
export const Thing = () => (
  <div className={styles.fooBar}>
    <span className={styles.plainKey} />
  </div>
);
