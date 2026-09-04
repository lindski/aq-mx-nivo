#!/usr/bin/env node
/**
 * Enforces this widget's invariants as a build failure rather than a convention.
 * Run by `prerelease`; run it by hand with `npm run check:layers`.
 *
 *   1. Only the three adapter files may know Mendix exists.
 *   2. The design-time bundles must not reach Nivo.
 *   3. Enumeration value keys in the widget XML must be identifiers.
 *   4. The widget XML must not use property types Studio Pro rejects.
 *   5. package.json and src/package.xml must agree on the version.
 *   6. The widget id, packagePath and src/package.xml files path must agree.
 *
 * Modelled on `aq-mx-aggrid/scripts/check-layers.mjs`, and deliberately dumb and textual. A clever
 * check that understood the module graph would be easier to fool and harder to trust.
 *
 * Rules 3 and 4 exist because the toolchain cannot tell you a widget XML is wrong. It validates
 * against the shipped XSD, builds, lints and packages, and Studio Pro then refuses it. These checks
 * are the only place that knowledge can live.
 *
 * Rule 2 matters more here than anywhere. The design-time bundle does NOT tree-shake, and any path
 * from editorConfig or editorPreview into the runtime drags the whole runtime in — an ordinary
 * component import is enough. Nivo is ~4.8 MB. Measured on a comparable wrapped library, the same
 * mistake produced an editorPreview.js of 5,384,494 bytes; splitting it gave 6,626.
 *
 * Rule 6 exists because this widget changed its id and packagePath at 2.0, and the mismatch it
 * guards against packages CLEANLY: the .mpk builds, installs and looks valid while the client
 * module points at a directory that is not in it. A sibling AuraQ widget is shipping with exactly
 * that mismatch today.
 */
import { readdirSync, readFileSync, statSync, existsSync } from "fs";
import { join, relative, sep } from "path";
import { fileURLToPath } from "url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const srcDir = join(root, "src");

const SOURCE_EXTENSIONS = [".ts", ".tsx", ".mts", ".js", ".jsx", ".mjs"];
const SKIP_DIRS = new Set(["node_modules", "dist", "build", "coverage", ".git"]);

/**
 * The only files permitted to import Mendix.
 *
 * `AqNivo.tsx` is the runtime adapter. `mendix/` is the adapter's own folder — the projection of
 * Mendix values onto plain data — and is Mendix-aware by definition. The two design-time entries
 * need the generated preview prop types.
 *
 * Everything else — `components/`, `charts/`, `data/`, `config/`, `preview/`, `ui/` — takes plain
 * values. That is what lets the page-editor preview drive the same chart component the runtime
 * does, and what makes the JSON parsing, the configuration merge and the datasource projection
 * testable with no Mendix runtime at all.
 */
const MENDIX_AWARE_FILES = new Set(["src/AqNivo.tsx", "src/AqNivo.editorConfig.ts", "src/AqNivo.editorPreview.tsx"]);
const MENDIX_AWARE_DIRS = ["src/mendix/", "src/editor-config/"];

/** The design-time bundles. Not code-split, and not tree-shaken. */
const DESIGN_TIME = new Set(["src/AqNivo.editorConfig.ts", "src/AqNivo.editorPreview.tsx"]);

const MENDIX_RULES = [
    { pattern: /from\s+["']mendix(\/[^"']*)?["']/, reason: 'imports "mendix" — only the adapter may' },
    { pattern: /require\(\s*["']mendix(\/[^"']*)?["']\s*\)/, reason: 'requires "mendix" — only the adapter may' },
    {
        pattern: /from\s+["'][^"']*typings\/[^"']*["']/,
        reason: "imports the generated typings — only the adapter may"
    }
];

/**
 * A value import of Nivo from a design-time file drags every reachable @nivo package into a bundle
 * Studio Pro loads. `import type` is fine; a plain import is not, even when it currently only names
 * types — one careless edit turns it into a value import and the cost is invisible until someone
 * measures.
 *
 * The page-editor preview must therefore be a FAITHFUL STATIC stand-in — the chart chrome the
 * properties control, drawn without Nivo — not the real component and not a grey box.
 */
const DESIGN_TIME_RULES = [
    {
        pattern: /^\s*import\s+(?!type\b)[^;]*from\s+["'](@nivo\/[^"']*|d3-[^"']*|@react-spring\/[^"']*)["']/,
        reason: "value-imports Nivo — the design-time bundle is not tree-shaken, use `import type` or neither"
    },
    {
        pattern: /^\s*import\s+(?!type\b)[^;]*from\s+["']\.\.?\/components\/[^"']*["']/,
        reason: "imports the runtime chart component — that is the path Nivo reaches the design-time bundle by; the preview needs a static stand-in"
    }
];

/**
 * Property types the XSD accepts and Studio Pro rejects for `pluginWidget="true"`.
 *
 * `translatableString` cost a working widget: the XML validated, the build succeeded, lint passed and
 * the .mpk packaged — and Studio Pro then refused the whole file, so every page using the grid
 * reported "Could not find widget". Use `textTemplate` for translatable text (G-19).
 */
const FORBIDDEN_PROPERTY_TYPES = {
    translatableString: 'not supported by pluggable widgets — use type="textTemplate"'
};

function walk(dir, out = []) {
    for (const entry of readdirSync(dir)) {
        if (SKIP_DIRS.has(entry)) {
            continue;
        }
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) {
            walk(full, out);
        } else if (SOURCE_EXTENSIONS.some(ext => entry.endsWith(ext))) {
            out.push(full);
        }
    }
    return out;
}

const violations = [];
const report = (file, line, text, reason) => violations.push({ file, line, text, reason });

// --- 1 & 2: layering ------------------------------------------------------------------------

if (existsSync(srcDir)) {
    for (const absolute of walk(srcDir)) {
        const file = relative(root, absolute).split(sep).join("/");
        const mendixAware = MENDIX_AWARE_FILES.has(file) || MENDIX_AWARE_DIRS.some(dir => file.startsWith(dir));

        const rules = [...(mendixAware ? [] : MENDIX_RULES), ...(DESIGN_TIME.has(file) ? DESIGN_TIME_RULES : [])];
        if (rules.length === 0) {
            continue;
        }

        readFileSync(absolute, "utf8")
            .split(/\r?\n/)
            .forEach((line, index) => {
                for (const rule of rules) {
                    if (rule.pattern.test(line)) {
                        report(file, index + 1, line.trim(), rule.reason);
                    }
                }
            });
    }
}

// --- 7: no console logging in shipped source -------------------------------------------------

/**
 * 1.x shipped seven `console.debug` calls and one `console.error` on the render path, several of
 * them logging an entire chart dataset — so a page with a chart wrote kilobytes to the console on
 * every render, in production, for every user (C-08).
 *
 * JavaScript evaluates a call's arguments whether or not anything consumes them, so the cost is
 * paid even when nobody is looking at the console. Render-path logging is not a debugging
 * convenience; it is a permanent tax on every placement.
 *
 * Diagnostics belong behind the Mendix client logger in the adapter, where they run once per
 * interaction rather than once per render.
 */
if (existsSync(srcDir)) {
    for (const absolute of walk(srcDir)) {
        const file = relative(root, absolute).split(sep).join("/");

        readFileSync(absolute, "utf8")
            .split(/\r?\n/)
            .forEach((line, index) => {
                if (/^\s*(?!\/\/|\*)[^"'`\n]*\bconsole\s*\.\s*(log|debug|info|warn|error|trace|table|dir)\s*\(/.test(line)) {
                    report(
                        file,
                        index + 1,
                        line.trim(),
                        "logs to the console in shipped source — the arguments are evaluated even when nothing reads them, " +
                            "and 1.x logged whole datasets on every render (C-08)"
                    );
                }
            });
    }
}

// --- 3 & 4: the widget XML ------------------------------------------------------------------

const widgetXmlPath = join(srcDir, "AqNivo.xml");
if (existsSync(widgetXmlPath)) {
    const identifier = /^[A-Za-z_][A-Za-z0-9_]*$/;

    readFileSync(widgetXmlPath, "utf8")
        .split(/\r?\n/)
        .forEach((line, index) => {
            const enumKey = /<enumerationValue\s+key="([^"]*)"/.exec(line);
            if (enumKey && !identifier.test(enumKey[1])) {
                report(
                    "src/AqNivo.xml",
                    index + 1,
                    line.trim(),
                    `enumeration key "${enumKey[1]}" is not an identifier — Studio Pro rejects it on project open, and the XSD does not`
                );
            }

            const propertyType = /<property\s[^>]*\btype="([^"]*)"/.exec(line);
            if (propertyType && FORBIDDEN_PROPERTY_TYPES[propertyType[1]]) {
                report(
                    "src/AqNivo.xml",
                    index + 1,
                    line.trim(),
                    `property type "${propertyType[1]}" is ${FORBIDDEN_PROPERTY_TYPES[propertyType[1]]}`
                );
            }
        });
}

// --- 5: version agreement -------------------------------------------------------------------

const packageJsonPath = join(root, "package.json");
const packageXmlPath = join(srcDir, "package.xml");

if (existsSync(packageJsonPath) && existsSync(packageXmlPath)) {
    const jsonVersion = JSON.parse(readFileSync(packageJsonPath, "utf8")).version;
    const xmlVersion = /<clientModule[^>]*\sversion="([^"]*)"/.exec(readFileSync(packageXmlPath, "utf8"))?.[1];

    if (jsonVersion !== xmlVersion) {
        report(
            "src/package.xml",
            1,
            `version="${xmlVersion}"`,
            `does not match package.json version "${jsonVersion}" — only the Marketplace checks this, and it checks last`
        );
    }
    if (!/^\d+\.\d+\.\d+$/.test(String(jsonVersion))) {
        report("package.json", 1, `"version": "${jsonVersion}"`, "must be plain three-part semver");
    }
}

// --- 8: the chart type vocabulary is declared twice, so check it agrees ----------------------

/**
 * `src/charts/chartTypes.ts` declares the chart types as a plain union so that the Mendix-free layer
 * does not have to import the generated typings — importing `ChartTypeEnum` there would break the
 * layering rule above for the sake of one string union.
 *
 * That leaves the vocabulary declared in two places. Rather than trust them to stay in step, assert
 * it: the enumeration keys in the widget XML and the entries in CHART_TYPES must be the same set.
 * Add a chart type to one and the build fails until it is added to the other.
 */
const chartTypesPath = join(srcDir, "charts", "chartTypes.ts");

if (existsSync(widgetXmlPath) && existsSync(chartTypesPath)) {
    const xml = readFileSync(widgetXmlPath, "utf8");
    const source = readFileSync(chartTypesPath, "utf8");

    /**
     * Pull the enumeration keys of ONE property, by name.
     *
     * This used to filter every <enumerationValue> in the file by a "Responsive" prefix, which worked
     * only because the chart type keys were the Nivo component names. At 2.0 they became base names
     * and the file grew a second enumeration, so the prefix heuristic would have silently matched
     * nothing — and a guard that passes because it found no keys is worse than no guard at all.
     * Scope it to the property instead, and report an empty result as a violation rather than a pass.
     *
     * Deliberately indexOf/slice rather than a constructed regex: this file's whole premise is being
     * dumb and textual, and a `new RegExp` built from a template literal is exactly the kind of
     * escaping that breaks silently and takes the guard with it.
     */
    const xmlEnumKeys = propertyKey => {
        const opening = '<property key="' + propertyKey + '"';
        const from = xml.indexOf(opening);
        if (from < 0) {
            return [];
        }
        const to = xml.indexOf("</property>", from);
        const block = to < 0 ? xml.slice(from) : xml.slice(from, to);
        return [...block.matchAll(/<enumerationValue\s+key="([^"]*)"/g)].map(m => m[1]);
    };

    const tsArrayEntries = name => {
        const opening = "export const " + name + " = [";
        const from = source.indexOf(opening);
        if (from < 0) {
            return [];
        }
        const to = source.indexOf("] as const;", from);
        const block = to < 0 ? "" : source.slice(from + opening.length, to);
        return [...block.matchAll(/"([^"]+)"/g)].map(m => m[1]);
    };

    /** Both vocabularies are declared twice, so assert both rather than trusting either. */
    const VOCABULARIES = [
        { property: "chartType", constant: "CHART_TYPES" },
        { property: "renderer", constant: "RENDERER_MODES" }
    ];

    for (const { property, constant } of VOCABULARIES) {
        const xmlKeys = xmlEnumKeys(property);
        const tsKeys = tsArrayEntries(constant);

        if (xmlKeys.length === 0) {
            report("src/AqNivo.xml", 1, `<property key="${property}">`, "declares no enumeration values — a guard that finds nothing is not a passing guard");
        }
        if (tsKeys.length === 0) {
            report("src/charts/chartTypes.ts", 1, constant, "declares no entries — a guard that finds nothing is not a passing guard");
        }

        for (const key of xmlKeys.filter(k => !tsKeys.includes(k))) {
            report("src/charts/chartTypes.ts", 1, constant, `is missing "${key}", which AqNivo.xml declares for ${property}`);
        }
        for (const key of tsKeys.filter(k => !xmlKeys.includes(k))) {
            report("src/AqNivo.xml", 1, `<property key="${property}">`, `is missing "${key}", which ${constant} declares`);
        }
    }
}

// --- 6: identity agreement ------------------------------------------------------------------

/**
 * The build emits the widget's files to a directory derived from the widget **id** — the id minus
 * the widget name, dots to slashes. `src/package.xml` is copied into the .mpk **verbatim**, so
 * nothing in the build compares the two. Verified by unpacking 1.0.0: id `auraq.aqnivo.AqNivo`
 * emitted `auraq/aqnivo/AqNivo.js`, and package.xml declared `auraq/aqnivo`.
 *
 * At 2.0 the id became `com.auraq.aqnivo.AqNivo`, so the files path must be `com/auraq/aqnivo`.
 * Get it wrong and the .mpk still builds, still packages, still installs — the client module simply
 * points at a directory that is not in the archive.
 *
 * `packagePath` is checked too because it names the .mpk file itself: change it without deleting
 * the old package and the app carries two packages claiming one widget id.
 */
const widgetXmlForId = join(srcDir, "AqNivo.xml");

if (existsSync(widgetXmlForId) && existsSync(packageXmlPath) && existsSync(packageJsonPath)) {
    const widgetId = /<widget\b[\s\S]*?\bid="([^"]*)"/.exec(readFileSync(widgetXmlForId, "utf8"))?.[1];
    const filesPath = /<file\s+path="([^"]*)"/.exec(readFileSync(packageXmlPath, "utf8"))?.[1];
    const packagePath = JSON.parse(readFileSync(packageJsonPath, "utf8")).packagePath;

    if (widgetId && filesPath) {
        const expected = widgetId.split(".").slice(0, -1).join("/");
        if (filesPath !== expected) {
            report(
                "src/package.xml",
                1,
                `<file path="${filesPath}" />`,
                `does not match widget id "${widgetId}" — the build emits to "${expected}", and this mismatch packages cleanly`
            );
        }
    }

    if (widgetId && packagePath && !widgetId.startsWith(packagePath + ".")) {
        report(
            "package.json",
            1,
            `"packagePath": "${packagePath}"`,
            `is not a prefix of widget id "${widgetId}" — packagePath names the .mpk, and a stale package claiming the same id wins nondeterministically`
        );
    }
}

// --- report ---------------------------------------------------------------------------------

if (violations.length > 0) {
    console.error(`\ncheck:layers FAILED — ${violations.length} violation(s).\n`);
    for (const v of violations) {
        console.error(`  ${v.file}:${v.line}`);
        console.error(`    ${v.text}`);
        console.error(`    ${v.reason}\n`);
    }
    process.exit(1);
}

console.log("check:layers passed.");
