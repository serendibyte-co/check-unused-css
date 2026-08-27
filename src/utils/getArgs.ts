import type { Args } from '../types.js';
import {
  DEFAULT_LOCALS_CONVENTION,
  LOCALS_CONVENTIONS,
  type LocalsConvention,
  parseLocalsConvention,
} from './localsConvention.js';

/**
 * A malformed CLI invocation. The entry point maps this to `BAD_ARGS` (exit 2,
 * message only) rather than treating it like an internal crash.
 */
export class ArgsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ArgsError';
  }
}

const LOCALS_CONVENTION_ERROR = `--locals-convention must be one of: ${LOCALS_CONVENTIONS.join(', ')}.`;

const toLocalsConvention = (raw: string): LocalsConvention => {
  const parsed = parseLocalsConvention(raw);
  if (parsed === null) {
    throw new ArgsError(LOCALS_CONVENTION_ERROR);
  }
  return parsed;
};

export const getArgs = (): Args => {
  const args = process.argv.slice(2);
  let targetPath: string | undefined;
  const excludePatterns: string[] = [];
  let noDynamic = false;
  let remove = false;
  let yes = false;
  let localsConvention: LocalsConvention = DEFAULT_LOCALS_CONVENTION;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === undefined) continue;

    if (arg === '--exclude' || arg === '-e') {
      const nextArg = args[i + 1];
      if (!nextArg || nextArg.startsWith('-')) {
        throw new ArgsError('--exclude flag requires a pattern argument.');
      }
      excludePatterns.push(nextArg);
      i++; // Skip the next argument as it's the pattern
    } else if (arg.startsWith('--exclude=')) {
      const pattern = arg.substring(arg.indexOf('=') + 1);
      if (!pattern) {
        throw new ArgsError('--exclude flag requires a pattern argument.');
      }
      excludePatterns.push(pattern);
    } else if (arg.startsWith('-e=')) {
      const pattern = arg.substring(arg.indexOf('=') + 1);
      if (!pattern) {
        throw new ArgsError('-e flag requires a pattern argument.');
      }
      excludePatterns.push(pattern);
    } else if (arg === '--locals-convention') {
      const nextArg = args[i + 1];
      if (!nextArg || nextArg.startsWith('-')) {
        throw new ArgsError(
          '--locals-convention flag requires a value argument.'
        );
      }
      localsConvention = toLocalsConvention(nextArg);
      i++; // Skip the next argument as it's the value
    } else if (arg.startsWith('--locals-convention=')) {
      const value = arg.substring(arg.indexOf('=') + 1);
      if (!value) {
        throw new ArgsError(
          '--locals-convention flag requires a value argument.'
        );
      }
      localsConvention = toLocalsConvention(value);
    } else if (arg === '--no-dynamic') {
      noDynamic = true;
    } else if (arg === '--remove') {
      remove = true;
    } else if (arg === '--yes' || arg === '-y') {
      yes = true;
    } else if (arg.startsWith('-')) {
      throw new ArgsError(`Unknown flag: ${arg}`);
    } else {
      if (targetPath !== undefined) {
        throw new ArgsError(
          'Multiple path arguments provided. Expected only one path argument.'
        );
      }
      targetPath = arg;
    }
  }

  return {
    targetPath,
    excludePatterns: excludePatterns.length > 0 ? excludePatterns : undefined,
    noDynamic,
    mode: remove ? 'remove' : 'report',
    yes,
    localsConvention,
  };
};
