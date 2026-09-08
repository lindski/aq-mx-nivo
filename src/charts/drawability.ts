import { CHART_LABELS, ChartType } from "./chartTypes";

/**
 * Can this chart be drawn from what it has been given — before Nivo is asked to try?
 *
 * ## Why this exists
 *
 * Nivo dereferences several props without defaulting them, so a chart handed the wrong data or an
 * incomplete configuration does not render badly — it **throws**, several frames below anything named
 * after this widget. `ChartErrorBoundary` catches it, and that is not enough: **React logs every error
 * a boundary catches, from inside React, and a wrapper cannot suppress it.** The React root is
 * Mendix's, so `onCaughtError` is not ours to set either. The only way to keep a consumer's console
 * clean is to not throw.
 *
 * ## The scenario this is really for
 *
 * A page that lets the user pick the chart type. The type changes in one commit and the data and
 * configuration arrive in the next, so for one render the NEW chart type is handed the OLD chart's
 * payload. Every rule below fires in that window, and nothing is actually wrong — which is why the
 * caller reports the **empty** state and not the error one.
 *
 * ## How the rules were derived, which matters more than the rules
 *
 * Measured, not guessed, in the gallery playground on 2026-09-08. For each chart type that threw, two
 * controlled probes: **correct configuration with foreign data**, and **correct data with an empty
 * configuration**. That split says which half is missing, and it is the only reason this table is not
 * a pile of guesses:
 *
 * | | throws on foreign data | throws on empty configuration |
 * |---|---|---|
 * | Area Bump, Bullet, Bump, Line, Radial Bar, Time Range | yes | no |
 * | Chord, Stream | no | yes |
 * | Marimekko, Radar | yes | yes |
 *
 * So eight of the ten are a **data** mismatch and four need a **configuration** key — and a chart type
 * only appears in `REQUIRED_CONFIG` below because rendering it with `{}` was observed to throw. That
 * observation is what stops a required-ness rule being invented.
 *
 * ## The failure mode to design against
 *
 * A check that is too strict blanks a chart that would have drawn perfectly — strictly worse than the
 * console noise it set out to remove. So every rule here is **structural and minimal**: it asks whether
 * the shape is present, never whether the values are sensible. The 26 gallery samples are the
 * regression bed; if one of them ever shows the empty state, a rule here is wrong.
 */

/** The element shape a chart type needs, where "an array" or "an object" is not specific enough. */
type ElementShape = "any" | "series" | "matrix" | "dayValue" | "rangesMeasures";

const CHART_DATA_ELEMENT: Record<ChartType, ElementShape> = {
    AreaBump: "series",
    Bar: "any",
    Bullet: "rangesMeasures",
    Bump: "series",
    Calendar: "dayValue",
    Chord: "matrix",
    Choropleth: "any",
    CirclePacking: "any",
    Funnel: "any",
    GeoMap: "any",
    HeatMap: "series",
    Line: "series",
    Marimekko: "any",
    Network: "any",
    Pie: "any",
    Radar: "any",
    RadialBar: "series",
    Sankey: "any",
    ScatterPlot: "series",
    Stream: "any",
    Sunburst: "any",
    SwarmPlot: "any",
    TimeRange: "dayValue",
    TreeMap: "any",
    Voronoi: "any",
    Waffle: "any"
};

/**
 * Configuration keys a chart type cannot render without.
 *
 * Every entry was confirmed by rendering that chart type with its own correct data and a `{}`
 * configuration, and watching Nivo throw. A key is NOT listed because the documentation calls it
 * required — only because its absence was observed to be fatal.
 */
const REQUIRED_CONFIG: Partial<Record<ChartType, readonly string[]>> = {
    Chord: ["keys"],
    Marimekko: ["id", "value", "dimensions"],
    Radar: ["keys"],
    Stream: ["keys"]
};

/** Chart types that read their geography from `features` in the configuration and never from data. */
const NEEDS_FEATURES: readonly ChartType[] = ["Choropleth", "GeoMap"];

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyArray = (value: unknown): value is unknown[] => Array.isArray(value) && value.length > 0;

/**
 * Why this chart cannot be drawn, or `undefined` if it can.
 *
 * The string is shown to the modeller under the empty message, so it names the missing thing rather
 * than describing the symptom.
 */
export function whyCannotDraw(
    chartType: ChartType,
    data: unknown,
    configuration: Record<string, unknown>
): string | undefined {
    const label = CHART_LABELS[chartType] ?? chartType;

    /*
     * Geography first, because for Geo Map it is the only input that exists — it takes no bound data
     * at all, so every other rule below would have nothing to look at.
     */
    if (NEEDS_FEATURES.includes(chartType) && !isNonEmptyArray(configuration.features)) {
        return `${label} draws its geography from a "features" collection in the configuration, which is not set.`;
    }

    for (const key of REQUIRED_CONFIG[chartType] ?? []) {
        if (configuration[key] === undefined) {
            return `${label} needs "${key}" in its configuration, which is not set.`;
        }
    }

    /*
     * Only the FIRST element is inspected, deliberately. The case this exists for — one chart type's
     * payload handed to another — is uniform, so the first element settles it; walking a large dataset
     * on every render to find a heterogeneity nobody has ever produced would cost more than it saves.
     */
    if (!isNonEmptyArray(data)) {
        return undefined;
    }
    const first = data[0];

    switch (CHART_DATA_ELEMENT[chartType]) {
        case "series":
            if (!isRecord(first) || !Array.isArray(first.data)) {
                return `${label} draws one or more series, so each entry needs its own "data" array. This looks like a flat list of points.`;
            }
            break;
        case "matrix":
            if (!Array.isArray(first)) {
                return `${label} takes a square matrix — an array of arrays of numbers — not a list of records.`;
            }
            break;
        case "dayValue":
            if (!isRecord(first) || first.day === undefined) {
                return `${label} needs a "day" on every entry, as a date string.`;
            }
            break;
        case "rangesMeasures":
            if (!isRecord(first) || !Array.isArray(first.ranges) || !Array.isArray(first.measures)) {
                return `${label} needs "ranges" and "measures" arrays on every entry.`;
            }
            break;
        case "any":
        default:
            break;
    }

    /*
     * The cross-check: configuration naming fields the data does not carry.
     *
     * This is the half a shape check cannot reach. Radar and Stream read `keys` off every datum, and
     * Marimekko reads each dimension's `value` field — so a configuration that is valid on its own and
     * data that is valid on its own still throw when the two disagree, which is exactly what a
     * half-completed chart-type switch produces.
     */
    if (chartType === "Chord") {
        const keys = configuration.keys;
        if (Array.isArray(keys) && Array.isArray(first) && keys.length !== data.length) {
            return `${label} is configured with ${keys.length} keys but the matrix has ${data.length} rows; they must match.`;
        }
        return undefined;
    }

    const namedFields = fieldsNamedBy(chartType, configuration);
    if (namedFields.length > 0 && isRecord(first)) {
        const missing = namedFields.filter(field => first[field] === undefined);
        if (missing.length === namedFields.length) {
            return `${label} is configured to read ${missing
                .map(f => `"${f}"`)
                .join(", ")}, which the data does not carry.`;
        }
    }

    return undefined;
}

/**
 * The datum fields this configuration says the chart will read.
 *
 * Returns `[]` for everything else, so the cross-check above is inert unless there is something
 * concrete to compare.
 */
function fieldsNamedBy(chartType: ChartType, configuration: Record<string, unknown>): string[] {
    if (chartType === "Radar" || chartType === "Stream") {
        const keys = configuration.keys;
        return Array.isArray(keys) ? keys.filter((k): k is string => typeof k === "string") : [];
    }

    if (chartType === "Marimekko") {
        const dimensions = configuration.dimensions;
        if (!Array.isArray(dimensions)) {
            return [];
        }
        return dimensions
            .map(dimension => (isRecord(dimension) ? dimension.value : undefined))
            .filter((value): value is string => typeof value === "string");
    }

    return [];
}
