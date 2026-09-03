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
 * `--passWithNoTests` is in the npm script rather than here, deliberately: that layer does not exist
 * yet. It arrives with the 2.0 rebuild (Phase 2), and the flag comes back out in the same commit as
 * the first test. Until then `npm test` reports honestly that it ran nothing.
 */
module.exports = {
    ...base,
    snapshotSerializers: []
};
