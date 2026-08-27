// check-unused-css-disable
import styles from './Card.module.css';

// The file-level ignore directive makes every class in this module count as
// used. Convention folding must not drop that signal for `*Only` conventions.
export const Card = () => <div className={styles.cardBody} />;
