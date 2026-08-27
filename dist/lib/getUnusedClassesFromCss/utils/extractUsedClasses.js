import { walk } from 'estree-walker';
import { parseIgnoreComments } from '../../../utils/parseIgnoreComments.js';
import { contentToAst } from './findUnusedClasses/utils/contentToAst.js';
const isMemberExpressionWithClassName = (node, importNames) => {
    return (node.type === 'MemberExpression' &&
        !node.computed &&
        node.object.type === 'Identifier' &&
        importNames.includes(node.object.name) &&
        node.property.type === 'Identifier' &&
        !!node.property.loc);
};
const isMemberExpressionWithBracketNotation = (node, importNames) => {
    return (node.type === 'MemberExpression' &&
        node.computed &&
        node.object.type === 'Identifier' &&
        importNames.includes(node.object.name) &&
        node.property.type === 'Literal' &&
        typeof node.property.value === 'string' &&
        !!node.property.loc);
};
export const extractUsedClasses = ({ sourceContent, importNames, filePath, }) => {
    const ast = contentToAst(sourceContent, filePath);
    const usedClasses = new Set();
    walk(ast, {
        enter(node) {
            if (isMemberExpressionWithClassName(node, importNames)) {
                usedClasses.add(node.property.name);
            }
            else if (isMemberExpressionWithBracketNotation(node, importNames)) {
                usedClasses.add(node.property.value);
            }
        },
    });
    return Array.from(usedClasses);
};
export const extractUsedClassesWithLocations = ({ sourceContent, importNames, filePath, }) => {
    const { ignoredLines } = parseIgnoreComments(sourceContent);
    const ast = contentToAst(sourceContent, filePath);
    const usedClasses = [];
    walk(ast, {
        enter(node) {
            if (isMemberExpressionWithClassName(node, importNames)) {
                const lineNumber = node.property.loc.start.line;
                if (!ignoredLines.has(lineNumber)) {
                    usedClasses.push({
                        className: node.property.name,
                        line: lineNumber,
                        column: node.property.loc.start.column + 1, // AST columns are 0-based, but editors show 1-based
                    });
                }
            }
            else if (isMemberExpressionWithBracketNotation(node, importNames)) {
                const lineNumber = node.property.loc.start.line;
                if (!ignoredLines.has(lineNumber)) {
                    usedClasses.push({
                        className: node.property.value,
                        line: lineNumber,
                        column: node.property.loc.start.column + 1, // AST columns are 0-based, but editors show 1-based
                    });
                }
            }
        },
    });
    return usedClasses;
};
