import { afterEach, describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCheckUnusedCss } from '../runCheckUnusedCss.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));

const CAMEL_DIR = 'src/__tests__/localsConvention/CamelCase';
const GENUINE_DIR = 'src/__tests__/localsConvention/GenuineErrors';
const NO_HYPHEN_DIR = 'src/__tests__/localsConvention/NoHyphen';
const ANCESTRY_DIR = 'src/__tests__/localsConvention/Ancestry';
const COMPOSES_DIR = 'src/__tests__/localsConvention/Composes';
const IGNORED_DIR = 'src/__tests__/localsConvention/IgnoredImporter';
const PARTIAL_DIR = 'src/__tests__/localsConvention/Partial';
const DYNAMIC_DIR = 'src/__tests__/localsConvention/DynamicPattern';
const DYNAMIC_BROKEN_DIR =
  'src/__tests__/localsConvention/DynamicPatternBroken';
const DIVERGENCE_DIR = 'src/__tests__/localsConvention/Divergence';

describe('localsConvention: camelCase', () => {
  test('kebab-case classes referenced by camelCase locals produce zero false positives', () => {
    const result = runCheckUnusedCss({
      targetPath: CAMEL_DIR,
      localsConvention: 'camelCase',
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/No unused CSS classes found/);
    expect(result.stderr).not.toMatch(/non-existent/i);
    // The kebab rules must not be flagged as unused...
    expect(result.stdout).not.toMatch(/\.header-bar/);
    expect(result.stdout).not.toMatch(/\.nav-list/);
    // ...and the camelCase JS accesses must not be flagged as non-existent.
    expect(result.stdout).not.toMatch(/\.headerBar/);
    expect(result.stdout).not.toMatch(/\.navList/);
  });

  test('bracket access with the original kebab string still counts as used', () => {
    const result = runCheckUnusedCss({
      targetPath: CAMEL_DIR,
      localsConvention: 'camelCase',
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).not.toMatch(/\.footer-note/);
  });

  test('genuine unused and non-existent classes are still reported', () => {
    const result = runCheckUnusedCss({
      targetPath: GENUINE_DIR,
      localsConvention: 'camelCase',
    });

    expect(result.exitCode).toBe(1);

    // `.dead-rule` is defined but never referenced by any spelling.
    expect(result.stdout).toMatch(/Panel\.module\.css:\d+:\d+ - \.dead-rule/);
    // `styles.ghostClass` has no matching rule under any spelling.
    expect(result.stderr).toMatch(
      /classes used in source files but non-existent in CSS/
    );
    expect(result.stdout).toMatch(/Panel\.tsx:\d+:\d+ - \.ghostClass/);

    // `.side-panel` <-> `styles.sidePanel` must NOT be reported.
    expect(result.stdout).not.toMatch(/\.side-panel/);
    expect(result.stdout).not.toMatch(/\.sidePanel/);
  });
});

// Every "used" signal that is seeded with an authored CSS name — SCSS
// suffix-concat ancestry, same-file `composes:`, a file-level ignore
// directive, `@use` partial classes — has to survive convention folding,
// including under the `*Only` conventions that rename the authored name.
describe('localsConvention: authored-name signals survive convention folding', () => {
  for (const convention of ['camelCase', 'camelCaseOnly'] as const) {
    test(`\`${convention}\`: SCSS concat parent of a camelCase-referenced child is rescued`, () => {
      const result = runCheckUnusedCss({
        targetPath: ANCESTRY_DIR,
        localsConvention: convention,
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/No unused CSS classes found/);
      expect(result.stdout).not.toMatch(/\.nav-bar/);
    });

    test(`\`${convention}\`: a class only reached via same-file composes: is not unused`, () => {
      const result = runCheckUnusedCss({
        targetPath: COMPOSES_DIR,
        localsConvention: convention,
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/No unused CSS classes found/);
      expect(result.stdout).not.toMatch(/\.base-btn/);
    });

    test(`\`${convention}\`: a file-level ignore directive still marks every class used`, () => {
      const result = runCheckUnusedCss({
        targetPath: IGNORED_DIR,
        localsConvention: convention,
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/No unused CSS classes found/);
      expect(result.stdout).not.toMatch(/\.card-body/);
    });

    test(`\`${convention}\`: a local class sharing a name with a @use partial is not unused`, () => {
      const result = runCheckUnusedCss({
        targetPath: PARTIAL_DIR,
        localsConvention: convention,
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/No unused CSS classes found/);
      expect(result.stdout).not.toMatch(/\.spacing-sm/);
    });
  }
});

// The blocking regression: before the reverse-fold fix, `--remove` under
// `camelCase` treated the concat parent as unused and deleted the rule that
// held the still-referenced `&-item` child, emptying the file.
describe('localsConvention: --remove never deletes an in-use SCSS concat parent', () => {
  const tmpDirs: string[] = [];

  afterEach(() => {
    while (tmpDirs.length > 0) {
      const dir = tmpDirs.pop();
      if (dir) fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  test('camelCase: the ancestry fixture is left untouched', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'scuc-locals-remove-'));
    tmpDirs.push(tmp);
    fs.cpSync(path.join(HERE, 'Ancestry'), tmp, { recursive: true });
    const scss = path.join(tmp, 'Nav.module.scss');
    const before = fs.readFileSync(scss, 'utf-8');

    const result = runCheckUnusedCss({
      targetPath: '.',
      localsConvention: 'camelCase',
      extraArgs: ['--remove', '--yes'],
      cwd: tmp,
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/Nothing to remove/);
    expect(fs.readFileSync(scss, 'utf-8')).toBe(before);
  });
});

// Coverage patterns (`styles[`icon${x}`]`) match against authored names, so
// they must be resolved through the convention: `.icon-home` is reached at
// runtime as `iconHome` and must count as covered, not deleted.
describe('localsConvention: dynamic pattern coverage is convention-aware', () => {
  const tmpDirs: string[] = [];

  afterEach(() => {
    while (tmpDirs.length > 0) {
      const dir = tmpDirs.pop();
      if (dir) fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  for (const convention of ['camelCase', 'camelCaseOnly'] as const) {
    test(`\`${convention}\`: pattern-covered kebab classes are not reported unused`, () => {
      const result = runCheckUnusedCss({
        targetPath: DYNAMIC_DIR,
        localsConvention: convention,
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/No unused CSS classes found/);
      expect(result.stdout).not.toMatch(/\.icon-home/);
      expect(result.stdout).not.toMatch(/\.icon-away/);
    });
  }

  test('camelCaseOnly: a kebab template pattern that is dead at runtime IS reported', () => {
    // `styles[`icon-${x}`]` -> `styles['icon-home']` -> undefined under
    // camelCaseOnly. `^icon-.*$` must not cover `.icon-home` / `.icon-away`.
    const result = runCheckUnusedCss({
      targetPath: DYNAMIC_BROKEN_DIR,
      localsConvention: 'camelCaseOnly',
    });

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toMatch(/Icon\.module\.css:\d+:\d+ - \.icon-home/);
    expect(result.stdout).toMatch(/Icon\.module\.css:\d+:\d+ - \.icon-away/);
  });

  test('asIs: the same kebab template pattern still covers both classes', () => {
    const result = runCheckUnusedCss({ targetPath: DYNAMIC_BROKEN_DIR });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/No unused CSS classes found/);
  });

  test('camelCaseOnly: --remove leaves the pattern-covered file untouched', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'scuc-locals-pattern-'));
    tmpDirs.push(tmp);
    fs.cpSync(path.join(HERE, 'DynamicPattern'), tmp, { recursive: true });
    const css = path.join(tmp, 'Icon.module.css');
    const before = fs.readFileSync(css, 'utf-8');

    const result = runCheckUnusedCss({
      targetPath: '.',
      localsConvention: 'camelCaseOnly',
      extraArgs: ['--remove', '--yes'],
      cwd: tmp,
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/Nothing to remove/);
    expect(fs.readFileSync(css, 'utf-8')).toBe(before);
  });
});

describe('localsConvention: asIs (default — regression protection)', () => {
  test('without the flag, camelCase accesses to kebab rules are false-positived exactly as before', () => {
    const result = runCheckUnusedCss(CAMEL_DIR);

    expect(result.exitCode).toBe(1);

    // "defined but unused" direction: the kebab rules look dead.
    expect(result.stdout).toMatch(/Widget\.module\.css:\d+:\d+ - \.header-bar/);
    expect(result.stdout).toMatch(/Widget\.module\.css:\d+:\d+ - \.nav-list/);

    // "used but missing" direction: the camelCase accesses look invalid.
    expect(result.stderr).toMatch(
      /classes used in source files but non-existent in CSS/
    );
    expect(result.stdout).toMatch(/Widget\.tsx:\d+:\d+ - \.headerBar/);
    expect(result.stdout).toMatch(/Widget\.tsx:\d+:\d+ - \.navList/);

    // The bracket access with the exact string still matches even under asIs.
    expect(result.stdout).not.toMatch(/\.footer-note/);
  });

  test('passing --locals-convention asIs explicitly matches the no-flag behavior', () => {
    const withFlag = runCheckUnusedCss({
      targetPath: CAMEL_DIR,
      localsConvention: 'asIs',
    });
    const withoutFlag = runCheckUnusedCss(CAMEL_DIR);

    expect(withFlag.exitCode).toBe(withoutFlag.exitCode);
    expect(withFlag.stdout).toBe(withoutFlag.stdout);
    expect(withFlag.stderr).toBe(withoutFlag.stderr);
  });
});

describe('localsConvention: classes without hyphens are unaffected', () => {
  for (const convention of [
    'asIs',
    'camelCase',
    'camelCaseOnly',
    'dashes',
    'dashesOnly',
  ]) {
    test(`\`${convention}\` reports the unused no-hyphen class and nothing else`, () => {
      const result = runCheckUnusedCss({
        targetPath: NO_HYPHEN_DIR,
        localsConvention: convention,
      });

      expect(result.exitCode).toBe(1);
      expect(result.stdout).toMatch(/Card\.module\.css:\d+:\d+ - \.cardBody/);
      expect(result.stdout).not.toMatch(/\.cardTitle/);
      expect(result.stdout).not.toMatch(/- \.card$/m);
      expect(result.stderr).not.toMatch(/non-existent/i);
    });
  }
});

describe('localsConvention: dashesOnly end to end', () => {
  test('kebab class referenced by its dash-camelised local, composes target renamed too', () => {
    const result = runCheckUnusedCss({
      targetPath: COMPOSES_DIR,
      localsConvention: 'dashesOnly',
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/No unused CSS classes found/);
    expect(result.stderr).not.toMatch(/non-existent/i);
  });
});

// `.foo_bar` referenced as `styles.fooBar`: the two families genuinely diverge
// on underscores — `camelCase` folds `foo_bar` -> `fooBar`, `dashes` leaves it.
describe('localsConvention: dashes vs camelCase actually diverge on underscores', () => {
  for (const convention of ['camelCase', 'camelCaseOnly'] as const) {
    test(`\`${convention}\`: \`.foo_bar\` resolves from \`styles.fooBar\``, () => {
      const result = runCheckUnusedCss({
        targetPath: DIVERGENCE_DIR,
        localsConvention: convention,
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/No unused CSS classes found/);
    });
  }

  for (const convention of ['dashes', 'dashesOnly'] as const) {
    test(`\`${convention}\`: \`.foo_bar\` does NOT resolve (underscore left as-is)`, () => {
      const result = runCheckUnusedCss({
        targetPath: DIVERGENCE_DIR,
        localsConvention: convention,
      });

      expect(result.exitCode).toBe(1);
      expect(result.stdout).toMatch(/Thing\.module\.css:\d+:\d+ - \.foo_bar/);
      expect(result.stdout).toMatch(/Thing\.tsx:\d+:\d+ - \.fooBar/);
      // `.plain-key` folds the same way for both families and stays resolved.
      expect(result.stdout).not.toMatch(/\.plain-key/);
      expect(result.stdout).not.toMatch(/\.plainKey/);
    });
  }
});
