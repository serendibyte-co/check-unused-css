import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { ArgsError, getArgs } from './getArgs.js';

describe('getArgs', () => {
  let originalArgv: string[];

  beforeEach(() => {
    // Save original process.argv
    originalArgv = [...process.argv];
  });

  afterEach(() => {
    // Restore original process.argv
    process.argv = originalArgv;
  });

  test('returns empty object when no arguments provided', () => {
    process.argv = ['node', 'script.js'];

    const result = getArgs();

    expect(result).toEqual({
      targetPath: undefined,
      excludePatterns: undefined,
      noDynamic: false,
      mode: 'report',
      yes: false,
      localsConvention: 'asIs',
    });
  });

  test('returns targetPath when one argument provided', () => {
    const testPath = '/path/to/target';
    process.argv = ['node', 'script.js', testPath];

    const result = getArgs();

    expect(result).toEqual({
      targetPath: testPath,
      excludePatterns: undefined,
      noDynamic: false,
      mode: 'report',
      yes: false,
      localsConvention: 'asIs',
    });
  });

  test('handles relative path argument', () => {
    const relativePath = './src/components';
    process.argv = ['node', 'script.js', relativePath];

    const result = getArgs();

    expect(result).toEqual({
      targetPath: relativePath,
      excludePatterns: undefined,
      noDynamic: false,
      mode: 'report',
      yes: false,
      localsConvention: 'asIs',
    });
  });

  test('handles absolute path argument', () => {
    const absolutePath = '/usr/local/src/project';
    process.argv = ['node', 'script.js', absolutePath];

    const result = getArgs();

    expect(result).toEqual({
      targetPath: absolutePath,
      excludePatterns: undefined,
      noDynamic: false,
      mode: 'report',
      yes: false,
      localsConvention: 'asIs',
    });
  });

  test('handles path with spaces', () => {
    const pathWithSpaces = '/path/with spaces/folder';
    process.argv = ['node', 'script.js', pathWithSpaces];

    const result = getArgs();

    expect(result).toEqual({
      targetPath: pathWithSpaces,
      excludePatterns: undefined,
      noDynamic: false,
      mode: 'report',
      yes: false,
      localsConvention: 'asIs',
    });
  });

  test('handles Windows-style path', () => {
    const windowsPath = 'C:\\Users\\Documents\\project';
    process.argv = ['node', 'script.js', windowsPath];

    const result = getArgs();

    expect(result).toEqual({
      targetPath: windowsPath,
      excludePatterns: undefined,
      noDynamic: false,
      mode: 'report',
      yes: false,
      localsConvention: 'asIs',
    });
  });

  test('handles path with special characters', () => {
    const specialPath = './src/components-test_folder@123';
    process.argv = ['node', 'script.js', specialPath];

    const result = getArgs();

    expect(result).toEqual({
      targetPath: specialPath,
      excludePatterns: undefined,
      noDynamic: false,
      mode: 'report',
      yes: false,
      localsConvention: 'asIs',
    });
  });

  test('handles empty string argument', () => {
    process.argv = ['node', 'script.js', ''];

    const result = getArgs();

    expect(result).toEqual({
      targetPath: '',
      excludePatterns: undefined,
      noDynamic: false,
      mode: 'report',
      yes: false,
      localsConvention: 'asIs',
    });
  });

  test('throws error when multiple path arguments provided', () => {
    process.argv = ['node', 'script.js', 'path1', 'path2'];

    expect(() => getArgs()).toThrow(
      'Multiple path arguments provided. Expected only one path argument.'
    );
  });

  test('throws error when three path arguments provided', () => {
    process.argv = ['node', 'script.js', 'path1', 'path2', 'path3'];

    expect(() => getArgs()).toThrow(
      'Multiple path arguments provided. Expected only one path argument.'
    );
  });

  test('throws error for unknown flags', () => {
    const flagLikeArg = '--help';
    process.argv = ['node', 'script.js', flagLikeArg];

    expect(() => getArgs()).toThrow('Unknown flag: --help');
  });

  test('malformed-invocation errors are ArgsError instances', () => {
    for (const argv of [
      ['--nope'],
      ['--exclude'],
      ['--locals-convention', 'kebabCase'],
      ['a', 'b'],
    ]) {
      process.argv = ['node', 'script.js', ...argv];
      expect(() => getArgs()).toThrow(ArgsError);
    }
  });

  test('handles numeric argument', () => {
    const numericArg = '123';
    process.argv = ['node', 'script.js', numericArg];

    const result = getArgs();

    expect(result).toEqual({
      targetPath: numericArg,
      excludePatterns: undefined,
      noDynamic: false,
      mode: 'report',
      yes: false,
      localsConvention: 'asIs',
    });
  });

  test('handles dot notation paths', () => {
    const dotPath = '../parent/folder';
    process.argv = ['node', 'script.js', dotPath];

    const result = getArgs();

    expect(result).toEqual({
      targetPath: dotPath,
      excludePatterns: undefined,
      noDynamic: false,
      mode: 'report',
      yes: false,
      localsConvention: 'asIs',
    });
  });

  test('handles current directory notation', () => {
    const currentDir = '.';
    process.argv = ['node', 'script.js', currentDir];

    const result = getArgs();

    expect(result).toEqual({
      targetPath: currentDir,
      excludePatterns: undefined,
      noDynamic: false,
      mode: 'report',
      yes: false,
      localsConvention: 'asIs',
    });
  });

  test('handles parent directory notation', () => {
    const parentDir = '..';
    process.argv = ['node', 'script.js', parentDir];

    const result = getArgs();

    expect(result).toEqual({
      targetPath: parentDir,
      excludePatterns: undefined,
      noDynamic: false,
      mode: 'report',
      yes: false,
      localsConvention: 'asIs',
    });
  });

  // New tests for exclude patterns
  test('handles single exclude pattern with --exclude flag', () => {
    process.argv = ['node', 'script.js', '--exclude', '**/test/**'];

    const result = getArgs();

    expect(result).toEqual({
      targetPath: undefined,
      excludePatterns: ['**/test/**'],
      noDynamic: false,
      mode: 'report',
      yes: false,
      localsConvention: 'asIs',
    });
  });

  test('handles single exclude pattern with -e flag', () => {
    process.argv = ['node', 'script.js', '-e', '**/test/**'];

    const result = getArgs();

    expect(result).toEqual({
      targetPath: undefined,
      excludePatterns: ['**/test/**'],
      noDynamic: false,
      mode: 'report',
      yes: false,
      localsConvention: 'asIs',
    });
  });

  test('handles exclude pattern with equals syntax --exclude=', () => {
    process.argv = ['node', 'script.js', '--exclude=**/test/**'];

    const result = getArgs();

    expect(result).toEqual({
      targetPath: undefined,
      excludePatterns: ['**/test/**'],
      noDynamic: false,
      mode: 'report',
      yes: false,
      localsConvention: 'asIs',
    });
  });

  test('handles exclude pattern with equals syntax -e=', () => {
    process.argv = ['node', 'script.js', '-e=**/test/**'];

    const result = getArgs();

    expect(result).toEqual({
      targetPath: undefined,
      excludePatterns: ['**/test/**'],
      noDynamic: false,
      mode: 'report',
      yes: false,
      localsConvention: 'asIs',
    });
  });

  test('handles multiple exclude patterns', () => {
    process.argv = [
      'node',
      'script.js',
      '--exclude',
      '**/test/**',
      '-e',
      '**/stories/**',
    ];

    const result = getArgs();

    expect(result).toEqual({
      targetPath: undefined,
      excludePatterns: ['**/test/**', '**/stories/**'],
      noDynamic: false,
      mode: 'report',
      yes: false,
      localsConvention: 'asIs',
    });
  });

  test('handles path and exclude patterns together', () => {
    process.argv = [
      'node',
      'script.js',
      'src/components',
      '--exclude',
      '**/test/**',
    ];

    const result = getArgs();

    expect(result).toEqual({
      targetPath: 'src/components',
      excludePatterns: ['**/test/**'],
      noDynamic: false,
      mode: 'report',
      yes: false,
      localsConvention: 'asIs',
    });
  });

  test('handles exclude patterns and path in different order', () => {
    process.argv = [
      'node',
      'script.js',
      '--exclude',
      '**/test/**',
      'src/components',
    ];

    const result = getArgs();

    expect(result).toEqual({
      targetPath: 'src/components',
      excludePatterns: ['**/test/**'],
      noDynamic: false,
      mode: 'report',
      yes: false,
      localsConvention: 'asIs',
    });
  });

  test('throws error when --exclude flag has no pattern', () => {
    process.argv = ['node', 'script.js', '--exclude'];

    expect(() => getArgs()).toThrow(
      '--exclude flag requires a pattern argument.'
    );
  });

  test('throws error when -e flag has no pattern', () => {
    process.argv = ['node', 'script.js', '-e'];

    expect(() => getArgs()).toThrow(
      '--exclude flag requires a pattern argument.'
    );
  });

  test('throws error when --exclude= has empty pattern', () => {
    process.argv = ['node', 'script.js', '--exclude='];

    expect(() => getArgs()).toThrow(
      '--exclude flag requires a pattern argument.'
    );
  });

  test('throws error when -e= has empty pattern', () => {
    process.argv = ['node', 'script.js', '-e='];

    expect(() => getArgs()).toThrow('-e flag requires a pattern argument.');
  });

  test('throws error when exclude flag is followed by another flag', () => {
    process.argv = ['node', 'script.js', '--exclude', '--other-flag'];

    expect(() => getArgs()).toThrow(
      '--exclude flag requires a pattern argument.'
    );
  });

  test('handles complex exclude patterns', () => {
    process.argv = [
      'node',
      'script.js',
      '--exclude',
      '**/*.test.{css,scss}',
      '-e',
      '**/node_modules/**',
    ];

    const result = getArgs();

    expect(result).toEqual({
      targetPath: undefined,
      excludePatterns: ['**/*.test.{css,scss}', '**/node_modules/**'],
      noDynamic: false,
      mode: 'report',
      yes: false,
      localsConvention: 'asIs',
    });
  });

  test('handles patterns with equals signs using --exclude=', () => {
    process.argv = ['node', 'script.js', '--exclude=pattern=with=equals'];

    const result = getArgs();

    expect(result).toEqual({
      targetPath: undefined,
      excludePatterns: ['pattern=with=equals'],
      noDynamic: false,
      mode: 'report',
      yes: false,
      localsConvention: 'asIs',
    });
  });

  test('handles patterns with equals signs using -e=', () => {
    process.argv = ['node', 'script.js', '-e=another=pattern=with=equals'];

    const result = getArgs();

    expect(result).toEqual({
      targetPath: undefined,
      excludePatterns: ['another=pattern=with=equals'],
      noDynamic: false,
      mode: 'report',
      yes: false,
      localsConvention: 'asIs',
    });
  });

  test('handles multiple patterns with equals signs', () => {
    process.argv = [
      'node',
      'script.js',
      '--exclude=first=pattern=with=equals',
      '-e=second=pattern=with=equals',
    ];

    const result = getArgs();

    expect(result).toEqual({
      targetPath: undefined,
      excludePatterns: [
        'first=pattern=with=equals',
        'second=pattern=with=equals',
      ],
      noDynamic: false,
      mode: 'report',
      yes: false,
      localsConvention: 'asIs',
    });
  });

  // Tests for --no-dynamic flag
  test('handles --no-dynamic flag', () => {
    process.argv = ['node', 'script.js', '--no-dynamic'];

    const result = getArgs();

    expect(result).toEqual({
      targetPath: undefined,
      excludePatterns: undefined,
      noDynamic: true,
      mode: 'report',
      yes: false,
      localsConvention: 'asIs',
    });
  });

  test('handles --no-dynamic flag with path', () => {
    process.argv = ['node', 'script.js', 'src/components', '--no-dynamic'];

    const result = getArgs();

    expect(result).toEqual({
      targetPath: 'src/components',
      excludePatterns: undefined,
      noDynamic: true,
      mode: 'report',
      yes: false,
      localsConvention: 'asIs',
    });
  });

  test('handles --no-dynamic flag with exclude patterns', () => {
    process.argv = [
      'node',
      'script.js',
      '--no-dynamic',
      '--exclude',
      '**/test/**',
    ];

    const result = getArgs();

    expect(result).toEqual({
      targetPath: undefined,
      excludePatterns: ['**/test/**'],
      noDynamic: true,
      mode: 'report',
      yes: false,
      localsConvention: 'asIs',
    });
  });

  test('handles --no-dynamic flag with path and exclude patterns', () => {
    process.argv = [
      'node',
      'script.js',
      'src/components',
      '--no-dynamic',
      '--exclude',
      '**/test/**',
      '-e',
      '**/stories/**',
    ];

    const result = getArgs();

    expect(result).toEqual({
      targetPath: 'src/components',
      excludePatterns: ['**/test/**', '**/stories/**'],
      noDynamic: true,
      mode: 'report',
      yes: false,
      localsConvention: 'asIs',
    });
  });

  test('handles flags in different order', () => {
    process.argv = [
      'node',
      'script.js',
      '--exclude',
      '**/test/**',
      '--no-dynamic',
      'src/components',
    ];

    const result = getArgs();

    expect(result).toEqual({
      targetPath: 'src/components',
      excludePatterns: ['**/test/**'],
      noDynamic: true,
      mode: 'report',
      yes: false,
      localsConvention: 'asIs',
    });
  });

  // --remove / --yes / -y
  test('handles --remove flag alone', () => {
    process.argv = ['node', 'script.js', '--remove'];

    const result = getArgs();

    expect(result).toEqual({
      targetPath: undefined,
      excludePatterns: undefined,
      noDynamic: false,
      mode: 'remove',
      yes: false,
      localsConvention: 'asIs',
    });
  });

  test('handles --yes flag alone (no-op without --remove)', () => {
    process.argv = ['node', 'script.js', '--yes'];

    const result = getArgs();

    expect(result).toEqual({
      targetPath: undefined,
      excludePatterns: undefined,
      noDynamic: false,
      mode: 'report',
      yes: true,
      localsConvention: 'asIs',
    });
  });

  test('handles -y short alias', () => {
    process.argv = ['node', 'script.js', '-y'];

    const result = getArgs();

    expect(result).toEqual({
      targetPath: undefined,
      excludePatterns: undefined,
      noDynamic: false,
      mode: 'report',
      yes: true,
      localsConvention: 'asIs',
    });
  });

  test('handles --remove --yes together', () => {
    process.argv = ['node', 'script.js', '--remove', '--yes'];

    const result = getArgs();

    expect(result).toEqual({
      targetPath: undefined,
      excludePatterns: undefined,
      noDynamic: false,
      mode: 'remove',
      yes: true,
      localsConvention: 'asIs',
    });
  });

  test('handles --remove -y together', () => {
    process.argv = ['node', 'script.js', '--remove', '-y'];

    const result = getArgs();

    expect(result).toEqual({
      targetPath: undefined,
      excludePatterns: undefined,
      noDynamic: false,
      mode: 'remove',
      yes: true,
      localsConvention: 'asIs',
    });
  });

  test('handles --remove with path and --yes', () => {
    process.argv = ['node', 'script.js', 'src/components', '--remove', '--yes'];

    const result = getArgs();

    expect(result).toEqual({
      targetPath: 'src/components',
      excludePatterns: undefined,
      noDynamic: false,
      mode: 'remove',
      yes: true,
      localsConvention: 'asIs',
    });
  });

  test('handles --remove with --exclude and --no-dynamic combined', () => {
    process.argv = [
      'node',
      'script.js',
      'src',
      '--remove',
      '--exclude',
      '**/test/**',
      '--no-dynamic',
    ];

    const result = getArgs();

    expect(result).toEqual({
      targetPath: 'src',
      excludePatterns: ['**/test/**'],
      noDynamic: true,
      mode: 'remove',
      yes: false,
      localsConvention: 'asIs',
    });
  });

  test('rejects unknown flag like --dry-run (out of scope for this MVP)', () => {
    process.argv = ['node', 'script.js', '--dry-run'];

    expect(() => getArgs()).toThrow('Unknown flag: --dry-run');
  });

  test('rejects unknown flag like --comment (deferred to future feature)', () => {
    process.argv = ['node', 'script.js', '--comment'];

    expect(() => getArgs()).toThrow('Unknown flag: --comment');
  });

  // --locals-convention
  test('defaults localsConvention to asIs when the flag is absent', () => {
    process.argv = ['node', 'script.js'];

    expect(getArgs().localsConvention).toBe('asIs');
  });

  test('parses --locals-convention with a space-separated value', () => {
    process.argv = ['node', 'script.js', '--locals-convention', 'camelCase'];

    expect(getArgs()).toEqual({
      targetPath: undefined,
      excludePatterns: undefined,
      noDynamic: false,
      mode: 'report',
      yes: false,
      localsConvention: 'camelCase',
    });
  });

  test('parses --locals-convention with equals syntax', () => {
    process.argv = ['node', 'script.js', '--locals-convention=dashesOnly'];

    expect(getArgs().localsConvention).toBe('dashesOnly');
  });

  test('accepts every css-loader convention name', () => {
    for (const value of [
      'asIs',
      'camelCase',
      'camelCaseOnly',
      'dashes',
      'dashesOnly',
    ] as const) {
      process.argv = ['node', 'script.js', '--locals-convention', value];
      expect(getArgs().localsConvention).toBe(value);
    }
  });

  test('normalizes css-loader kebab-cased convention aliases', () => {
    process.argv = ['node', 'script.js', '--locals-convention', 'camel-case'];
    expect(getArgs().localsConvention).toBe('camelCase');

    process.argv = ['node', 'script.js', '--locals-convention=camel-case-only'];
    expect(getArgs().localsConvention).toBe('camelCaseOnly');
  });

  test('combines --locals-convention with a path and other flags', () => {
    process.argv = [
      'node',
      'script.js',
      'src/components',
      '--locals-convention',
      'camelCase',
      '--no-dynamic',
    ];

    expect(getArgs()).toEqual({
      targetPath: 'src/components',
      excludePatterns: undefined,
      noDynamic: true,
      mode: 'report',
      yes: false,
      localsConvention: 'camelCase',
    });
  });

  test('throws on an unknown --locals-convention value', () => {
    process.argv = ['node', 'script.js', '--locals-convention', 'kebabCase'];

    expect(() => getArgs()).toThrow(
      '--locals-convention must be one of: asIs, camelCase, camelCaseOnly, dashes, dashesOnly.'
    );
  });

  test('throws when --locals-convention has no value', () => {
    process.argv = ['node', 'script.js', '--locals-convention'];

    expect(() => getArgs()).toThrow(
      '--locals-convention flag requires a value argument.'
    );
  });

  test('throws when --locals-convention is followed by another flag', () => {
    process.argv = ['node', 'script.js', '--locals-convention', '--no-dynamic'];

    expect(() => getArgs()).toThrow(
      '--locals-convention flag requires a value argument.'
    );
  });

  test('throws when --locals-convention= has an empty value', () => {
    process.argv = ['node', 'script.js', '--locals-convention='];

    expect(() => getArgs()).toThrow(
      '--locals-convention flag requires a value argument.'
    );
  });
});
