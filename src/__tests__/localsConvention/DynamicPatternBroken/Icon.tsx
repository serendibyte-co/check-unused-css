import styles from './Icon.module.css';

// A kebab template: `styles[`icon-${x}`]` builds `styles['icon-home']`, which
// is `undefined` at runtime under `camelCaseOnly` (the local is `iconHome`).
// The `^icon-.*$` pattern must NOT cover `.icon-home` there — this is genuinely
// dead code and should be reported.
export const Icon = ({ name }: { name: string }) => (
  <div className={styles[`icon-${name}`]} />
);
