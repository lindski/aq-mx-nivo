const base = require("@mendix/pluggable-widgets-tools/test-config/jest.config.js");

/**
 * The toolchain's own jest config, minus one thing.
 *
 * It registers `enzyme-to-json/serializer` as a snapshot serializer, which loads `enzyme`, which
 * loads `cheerio` — and `cheerio` ships ESM that this jest setup does not transform, so every suite
 * fails to load with `SyntaxError: Unexpected token 'export'` before a single test runs. The error
 * names cheerio and enzyme and says nothing about snapshots, so it reads as a broken test
 * environment rather than one unnecessary serializer.
 *
 * There are no component snapshot tests here and there will not be: the suites this repo wants
 * cover the Mendix-free layer — safe JSON parsing, the static/dynamic/function configuration merge,
 * the datasource-to-Nivo-shape projection — none of which renders anything.
 *
 * The `testMatch` override is not a preference — the inherited one cannot work from this checkout.
 * It globs every `.spec` file under `<rootDir>`, and `<rootDir>` expands to a Windows path with mixed
 * separators. This repository lives under a directory beginning with a dot, so the expansion
 * contains `dev\.aq`, and in a glob a backslash is an *escape character*: micromatch reads `\.` as a
 * literal dot rather than as a separator followed by a directory, and the pattern matches nothing.
 * Jest then reports "No tests found" and helpfully lists the 14 files it checked — which reads as a
 * discovery problem in your test files rather than in the path they sit under.
 *
 * `testRegex` has no such escaping, so it is used instead. Jest rejects having both, hence the
 * explicit `testMatch: undefined`.
 */
module.exports = {
    ...base,
    testMatch: undefined,
    testRegex: "\\.spec\\.(js|jsx|ts|tsx)$",
    snapshotSerializers: []
};
