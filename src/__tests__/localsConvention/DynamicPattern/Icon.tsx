import styles from './Icon.module.css';

// `styles[`icon${name}`]` reaches `iconHome` / `iconAway` at runtime — the
// real exported locals under camelCaseOnly. The `^icon.*$` coverage pattern
// must be matched against those renamed spellings, not the authored names, or
// both rules look unused and --remove empties the file.
export const Icon = ({ name }: { name: 'Home' | 'Away' }) => (
  <div className={styles[`icon${name}`]} />
);
