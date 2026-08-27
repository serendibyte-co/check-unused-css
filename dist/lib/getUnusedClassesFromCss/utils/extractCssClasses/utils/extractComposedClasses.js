import postcssScss from 'postcss-scss';
const splitTokens = (value) => value
    .split(/\s+/)
    .map((name) => name.trim())
    .filter((name) => name.length > 0);
/**
 * Returns the class names referenced via `composes:` that are defined in the
 * SAME file. Composing a class is a use of it, so these targets count as used
 * — but they still exist locally, so they are NOT dropped from the defined set.
 *
 * Only same-file targets are returned. `composes: x from '…'` and
 * `composes: x from global` reference another module, so they are skipped.
 */
export const extractComposedClasses = (root) => {
    const localComposedClasses = new Set();
    root.walkDecls('composes', (decl) => {
        const tokens = splitTokens(decl.value);
        // A `from` token (`composes: a b from <source>`) makes the whole
        // declaration reference another module, so it adds no local class. Checked
        // as a token, not a substring, so a class named `from-…` stays local.
        if (tokens.includes('from')) {
            return;
        }
        for (const className of tokens) {
            localComposedClasses.add(className);
        }
    });
    return Array.from(localComposedClasses);
};
/**
 * Same as {@link extractComposedClasses} but takes raw CSS text, so callers
 * that only hold the file contents don't have to parse it themselves.
 */
export const extractComposedClassesFromContent = (cssContent) => extractComposedClasses(postcssScss.parse(cssContent));
