import type { PartialTheme } from "@nivo/theming";

import { AtlasTokenName, AtlasTokens } from "./atlasTokens";

/**
 * Atlas tokens -> a Nivo theme and a series palette (P-11).
 *
 * The goal is that a chart looks like the app without every placement hand-writing a theme block.
 * The alternative — a theme supplied as configuration — already worked through
 * `staticConfiguration` and would not have been worth shipping as a feature: it is a copy of the
 * app's design decisions that goes stale, and it cannot follow a theme switched while the chart is
 * on screen.
 *
 * ## Two halves, and they are not the same decision
 *
 * **Chrome** — typography, axes, grid, legends, tooltip — travels in Nivo's `theme` prop and is
 * almost always wanted. **Series colour** does not travel in `theme` at all: `PartialTheme` carries
 * no palette, and a chart's colours come from its own `colors` prop. That separation is not a
 * detail, it is why `atlasTheme` is an enumeration rather than a boolean. A palette derived from
 * four brand hues is a good match for a three-series bar chart and a poor one for a ten-series
 * chart, where Nivo's own schemes are better. `chrome` is the setting that says so.
 *
 * ## Everything is derived or absent
 *
 * A token the host does not declare produces no theme key, rather than a guessed default. Nivo
 * already has defaults and they are reasonable; a half-derived theme that mixes the app's font with
 * an invented grey is worse than either. The same rule governs the palette wholesale — below four
 * resolved brand colours there is no palette, because a two-colour cycle across eight series is a
 * chart that misreports its own categories.
 */

/**
 * How much of the app's theme a chart takes.
 *
 * Declared here rather than imported from the generated typings, for the same reason `CHART_TYPES`
 * is: everything under `theme/` must stay Mendix-free. `scripts/check-layers.mjs` asserts that these
 * are exactly the `atlasTheme` enumeration keys in `AqNivo.xml`, so the two cannot drift.
 */
export const ATLAS_THEME_MODES = ["full", "chrome", "off"] as const;

export type AtlasThemeMode = (typeof ATLAS_THEME_MODES)[number];

export interface AtlasChartTheme {
    /** Nivo's `theme` prop. Undefined when the host declares none of the tokens it is built from. */
    theme?: PartialTheme;
    /** Nivo's `colors` prop, for the chart types that take an ordinal palette. */
    palette?: string[];
}

/**
 * The palette, in draw order, each entry with its fallbacks.
 *
 * Ordered so that adjacent series contrast: the four brand hues at full strength first, then the
 * same four lightened. Nivo cycles the array, so a ninth series repeats the first colour — which is
 * true of every categorical scheme and is the honest limit of colouring by brand.
 *
 * The `-300` shades have no fallback on purpose. If an app declares `--brand-primary` but not the
 * generated shades it is not an Atlas 3 theme, and four distinct colours is a better palette than
 * eight where half are duplicates.
 */
const PALETTE: ReadonlyArray<readonly AtlasTokenName[]> = [
    ["--brand-primary-600", "--brand-primary"],
    ["--brand-warning-500", "--brand-warning"],
    ["--brand-success-600", "--brand-success"],
    ["--brand-danger-500", "--brand-danger"],
    ["--brand-primary-300"],
    ["--brand-warning-300"],
    ["--brand-success-300"],
    ["--brand-danger-300"]
];

/** Below this many resolved colours, no palette is applied at all. */
const MINIMUM_PALETTE = 4;

export function buildAtlasChartTheme(tokens: AtlasTokens): AtlasChartTheme {
    return { theme: buildAtlasTheme(tokens), palette: buildAtlasPalette(tokens) };
}

export function buildAtlasTheme(tokens: AtlasTokens): PartialTheme | undefined {
    const text = tokens["--font-color-default"];
    const muted = tokens["--gray-700"] ?? text;
    const border = tokens["--border-color-default"];
    const surface = tokens["--bg-color-secondary"];
    const fontFamily = tokens["--font-family-base"];
    const fontSize = pixels(tokens["--font-size-default"]);
    const borderRadius = tokens["--border-radius-default"];

    const theme = prune({
        /*
         * `background` is deliberately not set.
         *
         * The obvious mapping is `--bg-color`, and it is wrong: it paints the chart's own rectangle,
         * which fights the card, panel or dark strip the chart usually sits inside. Nivo's default is
         * transparent, so the chart takes the colour of whatever is behind it — which is what
         * "matches the app" actually means here. An app that wants an opaque plot area sets it in
         * the configuration.
         */
        text: { fontFamily, fontSize, fill: text },
        axis: {
            domain: { line: { stroke: border } },
            ticks: { line: { stroke: border }, text: { fill: muted } },
            legend: { text: { fill: text } }
        },
        grid: { line: { stroke: border } },
        crosshair: { line: { stroke: muted } },
        legends: {
            text: { fill: text },
            title: { text: { fill: text } },
            ticks: { line: { stroke: border }, text: { fill: muted } }
        },
        labels: { text: { fill: text } },
        markers: { lineColor: muted, text: { fill: text } },
        dots: { text: { fill: text } },
        annotations: {
            text: { fill: text },
            link: { stroke: muted },
            outline: { stroke: muted },
            symbol: { fill: muted }
        },
        tooltip: {
            container: {
                background: surface,
                color: text,
                fontFamily,
                fontSize,
                borderRadius,
                border: border ? `1px solid ${border}` : undefined
            }
        }
    });

    return theme as PartialTheme | undefined;
}

export function buildAtlasPalette(tokens: AtlasTokens): string[] | undefined {
    const colors = PALETTE.map(candidates => candidates.map(name => tokens[name]).find(Boolean)).filter(
        (color): color is string => typeof color === "string"
    );

    return colors.length >= MINIMUM_PALETTE ? colors : undefined;
}

/**
 * Merge a modeller's own `theme` block over the Atlas one, deeply.
 *
 * This is the one place the widget deep-merges, and it is deliberate rather than inconsistent. Every
 * other configuration key is merged shallowly, because a shallow merge is the only one that lets a
 * later layer *remove* an earlier value, and "my axis config is being half-overridden" is a worse
 * thing to debug than "my axis config replaced theirs".
 *
 * `theme` is the exception because Nivo itself deep-merges: `extendDefaultTheme` folds whatever
 * `PartialTheme` it is given into the full default theme, so a caller who writes
 * `{ "theme": { "text": { "fontSize": 16 } }}` already expects everything else to survive. Under a
 * shallow merge that one line would silently discard the app's font, colours and tooltip styling —
 * a chart that stops matching the app the moment anyone adjusts one thing about it.
 *
 * Arrays replace rather than concatenate. Nothing in a Nivo theme is a list where appending would be
 * the sane reading.
 */
export function mergeTheme(base: unknown, override: unknown): unknown {
    if (!isPlainObject(base) || !isPlainObject(override)) {
        return override;
    }

    const result: Record<string, unknown> = { ...base };
    for (const [key, value] of Object.entries(override)) {
        result[key] = key in base ? mergeTheme(base[key], value) : value;
    }
    return result;
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** `"14px"` -> `14`. */
function pixels(value: string | undefined): number | undefined {
    if (!value) {
        return undefined;
    }
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * Drop every undefined value, and every object left empty by doing so.
 *
 * Without this an unresolved token becomes `{ fill: undefined }`, and the difference between that
 * and `{}` is not academic: it depends on whether the consumer merges with something that skips
 * undefined sources. Nivo's does today. Relying on that would make this widget's output correct by
 * someone else's implementation detail.
 */
function prune(value: unknown): unknown {
    if (!isPlainObject(value)) {
        return value;
    }

    const result: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
        const pruned = prune(child);
        if (pruned !== undefined && !(isPlainObject(pruned) && Object.keys(pruned).length === 0)) {
            result[key] = pruned;
        }
    }

    return Object.keys(result).length > 0 ? result : undefined;
}
