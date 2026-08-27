import path from 'node:path';
import type {
  DynamicClassUsage,
  UnusedClassResult,
  UnusedClassUsage,
} from '../../types.js';
import { getContentOfFiles } from '../../utils/getContentOfFiles.js';
import {
  DEFAULT_LOCALS_CONVENTION,
  getLocalNameVariants,
  type LocalsConvention,
} from '../../utils/localsConvention.js';
import { parseIgnoreComments } from '../../utils/parseIgnoreComments.js';
import {
  applyCoverage,
  type ClassAccess,
  extractClassAccesses,
} from './utils/coverage/index.js';
import {
  type ClassAncestry,
  extractComposedClassesFromContent,
  extractCssClassAncestry,
  extractCssClassesWithLocations,
} from './utils/extractCssClasses/index.js';
import { extractUsedClasses } from './utils/extractUsedClasses.js';
import { findFilesImportingCssModule } from './utils/findFilesImportingCssModule/index.js';
import { detectModulePassedToFunction } from './utils/passedToFunction/detectModulePassedToFunction.js';
import { rescueUsedAncestors } from './utils/rescueUsedAncestors.js';
import { collectPartialClasses } from './utils/scssImports/index.js';

type GetUnusedClassesFromCssParams = {
  cssFile: string;
  srcDir: string;
  localsConvention?: LocalsConvention;
};

export const getUnusedClassesFromCss = async ({
  cssFile,
  srcDir,
  localsConvention = DEFAULT_LOCALS_CONVENTION,
}: GetUnusedClassesFromCssParams): Promise<UnusedClassResult | null> => {
  const cssContent = getContentOfFiles({ files: [cssFile], srcDir });
  const cssClassesWithLocations = extractCssClassesWithLocations(cssContent);
  const cssClasses = cssClassesWithLocations.map((info) => info.className);
  const ancestry: ClassAncestry = extractCssClassAncestry(cssContent);

  if (cssClasses.length === 0) {
    return null;
  }

  // A class used only via `composes:` (never read in code) still counts as
  // used — seed it so it isn't reported as unused.
  const composedClasses = extractComposedClassesFromContent(cssContent);

  const importingFilesData = await findFilesImportingCssModule(cssFile, srcDir);

  if (importingFilesData.length === 0) {
    return {
      file: cssFile,
      status: 'notImported',
    };
  }

  // Classes pulled in via `@use`/`@forward`/`@import` belong to a shared
  // partial this module does not own, so a local class that merely shares a
  // name with one of them must not be reported as unused. Classes that exist
  // ONLY in a partial are never candidates here — they are not in `cssClasses`,
  // which is extracted from this file alone (issue #90).
  const partialClasses = collectPartialClasses(path.join(srcDir, cssFile));

  // `usedByName` holds authored names that are used whatever css-loader renames
  // them to (composes, partials, an ignored importer, coverage). `usedByReference`
  // holds `styles.foo` / `styles['foo']` spellings, matched to a class only
  // after folding through the convention below.
  const usedByName = new Set<string>([...composedClasses, ...partialClasses]);
  const usedByReference = new Set<string>();
  const allAccesses: ClassAccess[] = [];

  for (const importingFileData of importingFilesData) {
    const sourceContent = getContentOfFiles({
      files: [importingFileData.file],
      srcDir,
    });

    const { isFileIgnored } = parseIgnoreComments(sourceContent);
    if (isFileIgnored) {
      // If file is ignored, treat all CSS classes as used from this file
      // This way ignored files don't cause false positives for unused classes
      for (const className of cssClasses) {
        usedByName.add(className);
      }
      continue;
    }

    // The whole module passed to a function → we can't tell which classes it
    // uses, so ignore the module (one hand-off in any file is enough).
    const passedSite = detectModulePassedToFunction(
      sourceContent,
      importingFileData.importName,
      importingFileData.file
    );
    if (passedSite) {
      return {
        file: cssFile,
        status: 'ignoredPassedToFunction',
        sourceFile: importingFileData.file,
        importName: importingFileData.importName,
        line: passedSite.line,
        column: passedSite.column,
      };
    }

    // Static usages (importName.foo / importName['foo']) are collected via a
    // dedicated pass so the long-standing ignore semantics of that path are
    // preserved. Dynamic access sites (variables, templates, ternaries) are
    // gathered separately for coverage analysis. The Set dedupes overlaps.
    const fileUsedClasses = extractUsedClasses({
      sourceContent,
      importNames: [importingFileData.importName],
      filePath: importingFileData.file,
    });
    for (const className of fileUsedClasses) {
      usedByReference.add(className);
    }

    allAccesses.push(
      ...extractClassAccesses(
        sourceContent,
        [importingFileData.importName],
        importingFileData.file
      )
    );
  }

  // Aggregate coverage across the whole module after gathering every access
  // site, so a covers-all expression in any file suppresses unused-checking
  // even if another file would have left some class uncovered.
  const { coveredClasses, coversAll, coversAllAccesses } = applyCoverage(
    cssClasses,
    allAccesses,
    localsConvention
  );

  if (coversAll) {
    const dynamicUsages: DynamicClassUsage[] = coversAllAccesses.map(
      (access) => ({
        className: access.display,
        file: access.file,
        line: access.line,
        column: access.column,
      })
    );

    return {
      file: cssFile,
      status: 'withDynamicImports',
      dynamicUsages,
    };
  }

  for (const className of coveredClasses) {
    usedByName.add(className);
  }

  // Fold the references into authored-name space: a class is used if source
  // names any spelling it is exported under (for `asIs`, just the authored
  // name). `usedClasses` is then a single namespace, as `rescueUsedAncestors`
  // and the final comparison both expect.
  const usedClasses = new Set<string>(usedByName);
  for (const className of cssClasses) {
    const referenced = getLocalNameVariants(className, localsConvention).some(
      (variant) => usedByReference.has(variant)
    );
    if (referenced) {
      usedClasses.add(className);
    }
  }

  // A used child keeps its ampersand-family parent from looking unused. Runs
  // after every "used" signal (static, literal, dynamic coverage) is merged in.
  rescueUsedAncestors(usedClasses, ancestry);

  const unusedClasses: string[] = [];
  for (const className of cssClasses) {
    if (!usedClasses.has(className)) {
      unusedClasses.push(className);
    }
  }

  if (unusedClasses.length === 0) {
    return null;
  }

  const locationMap = new Map(
    cssClassesWithLocations.map((info) => [info.className, info])
  );

  const unusedClassesWithLocations: UnusedClassUsage[] = unusedClasses.map(
    (className) => {
      const locationInfo = locationMap.get(className);
      if (!locationInfo) {
        console.warn(
          `Warning: Location information not found for unused class "${className}" in ${cssFile}. Using default location.`
        );
        return {
          className,
          line: -1,
          column: -1,
        };
      }

      return {
        className,
        line: locationInfo.line,
        column: locationInfo.column,
      };
    }
  );

  return {
    file: cssFile,
    unusedClasses: unusedClassesWithLocations,
    status: 'correct',
  };
};
