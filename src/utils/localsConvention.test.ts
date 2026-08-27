import { describe, expect, test } from 'bun:test';
import {
  buildValidReferenceSet,
  getLocalNameVariants,
  LOCALS_CONVENTIONS,
  type LocalsConvention,
  parseLocalsConvention,
} from './localsConvention.js';

describe('parseLocalsConvention', () => {
  test('accepts the five canonical names unchanged', () => {
    for (const name of [
      'asIs',
      'camelCase',
      'camelCaseOnly',
      'dashes',
      'dashesOnly',
    ] as const) {
      expect(parseLocalsConvention(name)).toBe(name);
    }
  });

  test('normalizes css-loader kebab-cased aliases', () => {
    expect(parseLocalsConvention('as-is')).toBe('asIs');
    expect(parseLocalsConvention('camel-case')).toBe('camelCase');
    expect(parseLocalsConvention('camel-case-only')).toBe('camelCaseOnly');
    expect(parseLocalsConvention('dashes-only')).toBe('dashesOnly');
  });

  test('returns null for unknown values', () => {
    expect(parseLocalsConvention('kebabCase')).toBeNull();
    expect(parseLocalsConvention('')).toBeNull();
    expect(parseLocalsConvention('CamelCase')).toBeNull();
  });
});

describe('getLocalNameVariants', () => {
  describe('asIs (default, non-breaking)', () => {
    test('returns only the exact authored name', () => {
      expect(getLocalNameVariants('header-bar', 'asIs')).toEqual([
        'header-bar',
      ]);
      expect(getLocalNameVariants('headerBar', 'asIs')).toEqual(['headerBar']);
      expect(getLocalNameVariants('header', 'asIs')).toEqual(['header']);
    });
  });

  describe('camelCase', () => {
    test('keeps the original kebab name AND adds the camelCased form', () => {
      expect(getLocalNameVariants('header-bar', 'camelCase')).toEqual([
        'header-bar',
        'headerBar',
      ]);
    });

    test('collapses to a single entry when there is nothing to convert', () => {
      expect(getLocalNameVariants('header', 'camelCase')).toEqual(['header']);
      expect(getLocalNameVariants('headerBar', 'camelCase')).toEqual([
        'headerBar',
      ]);
    });

    test('camelizes multi-segment and digit-containing names', () => {
      expect(getLocalNameVariants('a-b-c', 'camelCase')).toEqual([
        'a-b-c',
        'aBC',
      ]);
      expect(getLocalNameVariants('col-2-wide', 'camelCase')).toEqual([
        'col-2-wide',
        'col2Wide',
      ]);
    });
  });

  describe('camelCaseOnly', () => {
    test('returns only the camelCased form, dropping the original', () => {
      expect(getLocalNameVariants('header-bar', 'camelCaseOnly')).toEqual([
        'headerBar',
      ]);
      expect(getLocalNameVariants('header', 'camelCaseOnly')).toEqual([
        'header',
      ]);
    });
  });

  describe('dashes', () => {
    test('keeps the original AND converts only dash groups', () => {
      expect(getLocalNameVariants('header-bar', 'dashes')).toEqual([
        'header-bar',
        'headerBar',
      ]);
    });

    test('leaves underscores untouched (unlike camelCase)', () => {
      expect(getLocalNameVariants('header_bar', 'dashes')).toEqual([
        'header_bar',
      ]);
      expect(getLocalNameVariants('header_bar', 'camelCase')).toEqual([
        'header_bar',
        'headerBar',
      ]);
    });
  });

  describe('dashesOnly', () => {
    test('returns only the dash-converted form', () => {
      expect(getLocalNameVariants('header-bar', 'dashesOnly')).toEqual([
        'headerBar',
      ]);
    });
  });

  test('never yields an empty string, under any convention', () => {
    for (const convention of LOCALS_CONVENTIONS) {
      expect(getLocalNameVariants('', convention)).toEqual([]);
    }
  });
});

describe('buildValidReferenceSet', () => {
  test('asIs: set is exactly the raw class names', () => {
    const set = buildValidReferenceSet(
      ['header-bar', 'footer', 'navList'],
      'asIs'
    );
    expect([...set].sort()).toEqual(['footer', 'header-bar', 'navList']);
  });

  test('camelCase: includes both spellings of every hyphenated class', () => {
    const set = buildValidReferenceSet(['header-bar', 'footer'], 'camelCase');
    expect(set.has('header-bar')).toBe(true);
    expect(set.has('headerBar')).toBe(true);
    expect(set.has('footer')).toBe(true);
  });

  test('camelCaseOnly: the raw hyphenated spelling is NOT valid', () => {
    const set = buildValidReferenceSet(['header-bar'], 'camelCaseOnly');
    expect(set.has('headerBar')).toBe(true);
    expect(set.has('header-bar')).toBe(false);
  });
});

// Guards the invariant the two report directions rely on: whichever spelling
// code uses, it must round-trip to the same CSS class under `camelCase`.
describe('camelCase round-trip between CSS and JS spellings', () => {
  const convention: LocalsConvention = 'camelCase';

  test('a kebab CSS class is reachable by its camelCase JS property', () => {
    const variants = getLocalNameVariants('camel-case-thing', convention);
    expect(variants).toContain('camelCaseThing');
  });

  test('an already-camelCase CSS class stays reachable by that name', () => {
    const variants = getLocalNameVariants('camelCaseThing', convention);
    expect(variants).toContain('camelCaseThing');
  });
});
