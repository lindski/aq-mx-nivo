/**
 * Rollup override — emit chunks instead of one bundle, so the 24 `@nivo` packages load on demand.
 *
 * The stock `@mendix/pluggable-widgets-tools` config discovers this file and passes its own config
 * array in as `args.configDefaultConfig`. Every stock plugin still runs — mpk packaging, the project
 * copy, widget typings, licences — and the npm scripts stay stock.
 *
 * ## Why this file has to exist
 *
 * `src/charts/registry.tsx` loads each Nivo package with a dynamic `import()` (B-01). The stock
 * config sets `output.file` — singular — for the web bundles, and Rollup refuses to emit multiple
 * chunks into a single file:
 *
 *     RollupError: Invalid value for option "output.file" - when building multiple chunks,
 *     the "output.dir" option must be used, not "output.file".
 *
 * That failure is the good outcome. A lazy registry that silently collapsed back into one bundle
 * would look like it worked and save nothing, and nobody would notice until they measured.
 *
 * ## What is deliberately NOT patched
 *
 * The CommonJS `editorPreview` and `editorConfig` bundles. The Studio Pro page editor is not
 * code-split, a dynamic import there is inlined anyway, and those two files must stay single-file.
 *
 * ## The trap
 *
 * Never `import` the stock config from here. The stock config discovers this file, which would
 * import the stock config, which would discover this file — the build hangs with no output, no
 * error, and leaves orphaned node processes behind. `args.configDefaultConfig` is the supported way
 * to reach it.
 */
export default args => {
    const configs = args.configDefaultConfig;

    return configs.map(config => {
        const output = Array.isArray(config.output) ? config.output : [config.output];

        const patched = output.map(out => {
            // Only the web bundles Rollup would split. The CommonJS design-time bundles stay as they are.
            if (!out || !out.file || (out.format !== "amd" && out.format !== "es")) {
                return out;
            }

            const isEsm = out.format === "es";

            // Split on either separator: the stock config builds this path with the platform's own,
            // so on Windows it arrives back-slashed and a "/"-only split silently yields -1 and
            // hands Rollup the entire absolute path as the entry file NAME.
            const lastSeparator = Math.max(out.file.lastIndexOf("/"), out.file.lastIndexOf("\\"));
            const directory = out.file.slice(0, lastSeparator);
            const fileName = out.file.slice(lastSeparator + 1);

            // eslint-disable-next-line no-unused-vars
            const { file, ...rest } = out;

            return {
                ...rest,
                dir: directory,
                entryFileNames: fileName,
                chunkFileNames: isEsm ? "chunks/[name]-[hash].mjs" : "chunks/[name]-[hash].js"
            };
        });

        return { ...config, output: Array.isArray(config.output) ? patched : patched[0] };
    });
};
