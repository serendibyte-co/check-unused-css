import {
  DEFAULT_LOCALS_CONVENTION,
  getLocalNameVariants,
  type LocalsConvention,
} from '../../../../utils/localsConvention.js';
import type { ClassAccess, CoverageOutcome } from './types.js';

/**
 * Aggregate every access site of a CSS module (gathered across all importing
 * files) into the set of covered classes and a module-level `coversAll` flag.
 *
 * Coverage is additive across files (a class is covered if covered anywhere),
 * and `coversAll` is absorbing: a single covers-all access anywhere means the
 * whole module is not checked for unused classes (the conservative rule wins).
 *
 * Keys and patterns are matched against the spellings a class is exported
 * under (`localsConvention`), so `coveredClasses` is always authored names.
 * Under `asIs` that is a plain equality/regex test against those names.
 */
export const applyCoverage = (
  cssClasses: string[],
  accesses: ClassAccess[],
  localsConvention: LocalsConvention = DEFAULT_LOCALS_CONVENTION
): CoverageOutcome => {
  const coveredClasses = new Set<string>();
  const coversAllAccesses: ClassAccess[] = [];
  let coversAll = false;

  // Most modules have no dynamic access at all — skip building the index.
  if (accesses.length === 0) {
    return { coveredClasses, coversAll, coversAllAccesses };
  }

  // variant spelling -> authored class name(s) it is exported from.
  const authoredByVariant = new Map<string, string[]>();
  for (const name of cssClasses) {
    for (const variant of getLocalNameVariants(name, localsConvention)) {
      const existing = authoredByVariant.get(variant);
      if (existing) {
        existing.push(name);
      } else {
        authoredByVariant.set(variant, [name]);
      }
    }
  }

  for (const access of accesses) {
    const { classification } = access;

    if (classification.kind === 'literals') {
      for (const key of classification.classNames) {
        for (const name of authoredByVariant.get(key) ?? []) {
          coveredClasses.add(name);
        }
      }
    } else if (classification.kind === 'pattern') {
      for (const [variant, names] of authoredByVariant) {
        if (classification.regex.test(variant)) {
          for (const name of names) {
            coveredClasses.add(name);
          }
        }
      }
    } else {
      coversAll = true;
      coversAllAccesses.push(access);
    }
  }

  return { coveredClasses, coversAll, coversAllAccesses };
};
