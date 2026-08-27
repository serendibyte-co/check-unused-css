---
'check-unused-css': minor
---

Add a `--locals-convention <asIs|camelCase|camelCaseOnly|dashes|dashesOnly>` flag that mirrors `css-loader`/Vite's `exportLocalsConvention` option. Under `camelCase` (and the other non-`asIs` modes) a class authored in CSS as `.header-bar` and a JS reference to `styles.headerBar` are treated as the same class in both report directions, so kebab-case CSS Modules classes accessed via their camelCase locals are no longer double-reported as "unused in CSS" and "non-existent in CSS". Defaults to `asIs`, so existing behaviour is unchanged.

A malformed invocation (unknown flag, missing flag value, bad `--locals-convention` value) now exits `2` (bad args) with just the message, instead of `5` (internal error) with a stack trace.
