import path from 'node:path';
import { COLORS } from '../consts.js';
export const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
export const toRel = (file, cwd) => {
    const rel = path.relative(cwd, file);
    return rel === '' ? file : rel;
};
export const formatLocationLine = (file, line, column, className, color = COLORS.red) => {
    return (`  ${COLORS.cyan}${file}:${line}:${column}${COLORS.reset} - ` +
        `${color}.${className}${COLORS.reset}`);
};
