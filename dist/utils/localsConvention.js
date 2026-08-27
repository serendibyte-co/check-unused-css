export const LOCALS_CONVENTIONS = [
    'asIs',
    'camelCase',
    'camelCaseOnly',
    'dashes',
    'dashesOnly',
];
// `asIs` is exact-match only — the tool's original behaviour — so it stays the
// default and the flag is non-breaking.
export const DEFAULT_LOCALS_CONVENTION = 'asIs';
// css-loader also accepts the kebab-cased spelling of each convention. Accept
// those too so the value can be copied straight from a Vite/webpack config,
// then normalise to the canonical form used everywhere else here.
const CONVENTION_ALIASES = {
    'as-is': 'asIs',
    'camel-case': 'camelCase',
    'camel-case-only': 'camelCaseOnly',
    'dashes-only': 'dashesOnly',
};
/**
 * Normalises a raw `--locals-convention` value to a `LocalsConvention`, or
 * returns `null` when it is not a recognised convention.
 */
export const parseLocalsConvention = (value) => {
    if (LOCALS_CONVENTIONS.includes(value)) {
        return value;
    }
    return CONVENTION_ALIASES[value] ?? null;
};
// camelCase / dashesCamelCase / preserveCamelCase are ported verbatim from
// css-loader/src/utils.js so the naming semantics match it exactly.
const preserveCamelCase = (string) => {
    let result = string;
    let isLastCharLower = false;
    let isLastCharUpper = false;
    let isLastLastCharUpper = false;
    for (let i = 0; i < result.length; i++) {
        const character = result[i];
        if (isLastCharLower && /[\p{Lu}]/u.test(character)) {
            result = `${result.slice(0, i)}-${result.slice(i)}`;
            isLastCharLower = false;
            isLastLastCharUpper = isLastCharUpper;
            isLastCharUpper = true;
            i += 1;
        }
        else if (isLastCharUpper &&
            isLastLastCharUpper &&
            /[\p{Ll}]/u.test(character)) {
            result = `${result.slice(0, i - 1)}-${result.slice(i - 1)}`;
            isLastLastCharUpper = isLastCharUpper;
            isLastCharUpper = false;
            isLastCharLower = true;
        }
        else {
            isLastCharLower =
                character.toLowerCase() === character &&
                    character.toUpperCase() !== character;
            isLastLastCharUpper = isLastCharUpper;
            isLastCharUpper =
                character.toUpperCase() === character &&
                    character.toLowerCase() !== character;
        }
    }
    return result;
};
const camelCase = (input) => {
    let result = input.trim();
    if (result.length === 0) {
        return '';
    }
    if (result.length === 1) {
        return result.toLowerCase();
    }
    const hasUpperCase = result !== result.toLowerCase();
    if (hasUpperCase) {
        result = preserveCamelCase(result);
    }
    return result
        .replace(/^[_.\- ]+/, '')
        .toLowerCase()
        .replace(/[_.\- ]+([\p{Alpha}\p{N}_]|$)/gu, (_, p1) => p1.toUpperCase())
        .replace(/\d+([\p{Alpha}\p{N}_]|$)/gu, (m) => m.toUpperCase());
};
const dashesCamelCase = (str) => str.replace(/-+(\w)/g, (_match, firstLetter) => firstLetter.toUpperCase());
// Dedupe, and drop empties so a blank name never pollutes the match set.
const normalise = (names) => Array.from(new Set(names)).filter((name) => name.length > 0);
/**
 * The identifiers a source file can use to reference the CSS class
 * `cssClassName` under `convention`, matching css-loader's
 * `exportLocalsConvention`. `camelCase`/`dashes` keep the authored name and add
 * the transformed one; the `*Only` variants return the transformed name alone;
 * `asIs` returns just the authored name. Both report directions treat a CSS
 * class and a JS reference as the same class when they share one of these.
 */
export const getLocalNameVariants = (cssClassName, convention) => {
    switch (convention) {
        case 'camelCase':
            return normalise([cssClassName, camelCase(cssClassName)]);
        case 'camelCaseOnly':
            return normalise([camelCase(cssClassName)]);
        case 'dashes':
            return normalise([cssClassName, dashesCamelCase(cssClassName)]);
        case 'dashesOnly':
            return normalise([dashesCamelCase(cssClassName)]);
        default:
            return normalise([cssClassName]);
    }
};
/**
 * Every JS reference spelling that resolves to one of `cssClassNames` under
 * `convention`, collected into a Set for O(1) lookup by the used-but-missing
 * check.
 */
export const buildValidReferenceSet = (cssClassNames, convention) => {
    const valid = new Set();
    for (const className of cssClassNames) {
        for (const variant of getLocalNameVariants(className, convention)) {
            valid.add(variant);
        }
    }
    return valid;
};
