const CSS_IMPORT_REGEX = /import\s+(\w+)\s+from\s+['"]([^'"]+\.(?:css|scss|sass))['"];?/g;
export const extractCssImports = (content) => {
    const imports = [];
    for (const match of content.matchAll(CSS_IMPORT_REGEX)) {
        const importName = match[1];
        const importPath = match[2];
        if (importName && importPath) {
            imports.push({ importName, importPath });
        }
    }
    return imports;
};
