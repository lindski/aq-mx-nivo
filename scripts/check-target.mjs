#!/usr/bin/env node
/**
 * Runs the dev build and proves the `.mpk` actually reached a Mendix app, instead of succeeding
 * into the void.
 *
 * ## The failure this exists to stop
 *
 * `pluggable-widgets-tools build:web` copies the built `.mpk` into `<projectPath>/widgets/`, where
 * `projectPath` comes from `MX_PROJECT_PATH` or, failing that, `config.projectPath` in package.json.
 * The generator's default for that is `./tests/testProject` — **a directory that does not exist in
 * this repo**, because our test app lives in a separate Team Server repository beside this one.
 *
 * So the copy target resolves to nothing, the copy silently does not happen, and the build
 * **reports success and exits 0**. `dist/<version>/com.auraq.AqNivo.mpk` is written and correct;
 * the app's `widgets/` folder still holds the previous build.
 *
 * That is a genuinely nasty shape, because of what it looks like from the other end: you change a
 * property, rebuild, open Studio Pro, and your change is not there. Studio Pro is *known* to cache a
 * widget's parsed XML and design-time JS for the life of the open project, so the reasonable next
 * move is to blame the cache and restart — which cannot work, takes minutes, and leaves you more
 * confident the cache is broken. It cost a restart on 2026-09-07 after a description-shortening pass,
 * and the only thing that settled it was checking the `.mpk` timestamp in the app's `widgets/`.
 *
 * ## Why this wraps the build instead of checking around it
 *
 * The first version of this script validated before and verified after, leaving PWT to resolve its
 * own copy target. That does not work, and failing to work is how it was found: PWT knows nothing
 * about the `.mxproject` pointer, so the pointer satisfied the check while the copy still went
 * nowhere. Resolving the target and then *handing it to PWT* is the only arrangement where the thing
 * checked and the thing configured cannot disagree.
 *
 * The after-check is kept, and it deliberately verifies the RESULT rather than re-deriving the path.
 * PWT's `projectPath` resolution is internal to the tooling and **has changed across versions**, so
 * a checker that mirrors it silently rots. A destination whose modified time moved is true whatever
 * PWT did internally.
 *
 * ## Usage
 *
 *   npm run build          # resolve, validate, build, verify the copy landed
 *   npm run check:target   # resolve and validate only, no build
 *
 * `npm run release` does NOT use this: release writes to `dist/` by design and copies to no app.
 * Set `MX_NO_PROJECT=1` to build without an app — compiling in CI, or just type-checking.
 */
import { spawnSync } from "child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

const MPK = `${pkg.packagePath}.${pkg.widgetName}.mpk`;
const POINTER = join(root, ".mxproject");
const mode = process.argv[2] ?? "--build";

function fail(lines) {
    console.error(`\ncheck:target FAILED\n`);
    for (const line of lines) console.error(`  ${line}`);
    console.error("");
    process.exit(1);
}

const HOW_TO_FIX = [
    "Point the build at your Mendix test app, either way:",
    "",
    "  1. Write the path into an untracked pointer file, once per machine (preferred):",
    "",
    '       echo "../../.mx/AqNivo-main" > .mxproject',
    "",
    "     Relative to this repo root, or absolute. It is gitignored, so it can differ per machine.",
    "",
    "  2. Or set the environment variable for a single build:",
    "",
    '       MX_PROJECT_PATH="/path/to/the/mendix/app" npm run build',
    "",
    "Building deliberately without an app? Use MX_NO_PROJECT=1, or `npm run release`."
];

/**
 * Where the build should land, and how we knew.
 *
 * The `.mxproject` pointer is the reason this is more than a warning. `MX_PROJECT_PATH` has to be
 * remembered and re-typed on every shell, which means it is reliably forgotten — by a person and by
 * an agent equally, and an agent has no shell history to remind it. An untracked one-line file in
 * the repo root is written once per machine and is discoverable by anything that looks.
 */
function resolveTarget() {
    if (process.env.MX_PROJECT_PATH) {
        return { path: resolve(process.env.MX_PROJECT_PATH), from: "MX_PROJECT_PATH" };
    }
    if (existsSync(POINTER)) {
        const line = readFileSync(POINTER, "utf8")
            .split("\n")
            .map(l => l.trim())
            .find(l => l.length > 0 && !l.startsWith("#"));
        if (line) return { path: resolve(root, line), from: ".mxproject" };
    }
    if (pkg.config?.projectPath) {
        return { path: resolve(root, pkg.config.projectPath), from: "package.json config.projectPath" };
    }
    return { path: null, from: "nothing" };
}

/** A Mendix app root carries a `.mpr` and a `widgets/` folder. */
function looksLikeMendixApp(dir) {
    if (!existsSync(dir)) return "the path does not exist";
    let entries;
    try {
        entries = readdirSync(dir);
    } catch (error) {
        return `the path could not be read (${error.code})`;
    }
    if (!entries.some(e => e.endsWith(".mpr"))) return "no .mpr file there, so it is not a Mendix app root";
    if (!entries.includes("widgets")) return "no widgets/ folder there";
    return null;
}

if (process.env.MX_NO_PROJECT === "1") {
    console.log("check:target skipped (MX_NO_PROJECT=1) — the .mpk goes to dist/ only.");
    if (mode === "--check") process.exit(0);
    const bare = spawnSync("pluggable-widgets-tools", ["build:web"], { stdio: "inherit", shell: true });
    process.exit(bare.status ?? 1);
}

const { path: target, from } = resolveTarget();

if (!target) {
    fail(["No Mendix test app is configured.", "", ...HOW_TO_FIX]);
}

const problem = looksLikeMendixApp(target);
if (problem) {
    fail([
        `Target came from ${from}:`,
        `  ${target}`,
        `but ${problem}.`,
        "",
        "Left alone, the build would SUCCEED and copy nothing — which then presents as",
        "Studio Pro ignoring your change, and sends you hunting the widget XML cache.",
        "",
        ...HOW_TO_FIX
    ]);
}

const destination = join(target, "widgets", MPK);
const before = existsSync(destination) ? statSync(destination).mtimeMs : 0;

console.log(`check:target — ${MPK} will be copied to:`);
console.log(`  ${destination}`);
console.log(`  (target from ${from})\n`);

if (mode === "--check") {
    process.exit(0);
}

// Hand the resolved path to PWT, so the path checked and the path used cannot differ.
const build = spawnSync("pluggable-widgets-tools", ["build:web"], {
    stdio: "inherit",
    shell: true,
    env: { ...process.env, MX_PROJECT_PATH: target }
});

if (build.status !== 0) {
    process.exit(build.status ?? 1);
}

if (!existsSync(destination)) {
    fail([
        "The build reported success but the .mpk is NOT in the app:",
        `  ${destination}`,
        "",
        `The target came from ${from}. Check it is the app you meant.`
    ]);
}

const after = statSync(destination).mtimeMs;
if (after <= before) {
    fail([
        "The build reported success but did NOT overwrite the .mpk in the app:",
        `  ${destination}`,
        "",
        `It still has its previous timestamp (${new Date(after).toISOString()}).`,
        "",
        "PWT was handed MX_PROJECT_PATH explicitly, so this most likely means its copy step",
        "changed in an upgrade. Check the build output above for a copy error."
    ]);
}

console.log(`\ncheck:target passed — ${MPK} copied (${statSync(destination).size.toLocaleString()} bytes) to:`);
console.log(`  ${destination}`);
console.log("\nStudio Pro caches a widget's parsed XML and design-time JS for the life of the open");
console.log("project: close and reopen the project, or this build is not the one in force.");
