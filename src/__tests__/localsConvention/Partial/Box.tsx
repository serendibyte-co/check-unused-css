import styles from './Box.module.scss';

// `.spacing-sm` is also defined in the `@use`d partial, so a same-named local
// class is not "unused" (issue #90). That seed is an authored-name signal and
// must survive convention folding. `.box-inner` is used via its camelCase local.
export const Box = () => <div className={styles.boxInner} />;
