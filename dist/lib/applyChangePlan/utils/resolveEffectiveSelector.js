const combineOne = (baseSel, childSel) => {
    // SCSS parent-selector substitution. When base is empty, `&` collapses out.
    if (childSel.includes('&'))
        return childSel.replace(/&/g, baseSel);
    // No '&' → descendant combinator between parent and child (or just the
    // child when there is no parent context to prepend).
    if (baseSel === '')
        return childSel;
    return `${baseSel} ${childSel}`;
};
const combine = (base, children) => {
    const result = [];
    for (const baseSel of base) {
        for (const child of children) {
            result.push(combineOne(baseSel, child.trim()));
        }
    }
    return result;
};
/**
 * Resolves a postcss Rule's selector list into its flat effective form, with
 * every SCSS `&` substituted via its parent-rule chain (Cartesian product
 * across comma-separated parent selectors).
 *
 * Non-rule parents (at-rules like `@media`, `@supports`, mixins) are skipped
 * during the walk — they don't contribute a selector context. A rule inside
 * `@media x { .parent { &.child { } } }` resolves as if it were just
 * `.parent { &.child { } }`.
 */
export const resolveEffectiveSelector = (rule) => {
    const parentChain = [];
    let current = rule.parent;
    while (current) {
        if (current.type === 'rule') {
            parentChain.unshift(current);
        }
        current = current.parent;
    }
    let base = [''];
    for (const parent of parentChain) {
        base = combine(base, parent.selectors);
    }
    return combine(base, rule.selectors);
};
