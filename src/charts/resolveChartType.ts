import { CHART_LABELS, CHART_TYPES, ChartType, isChartType } from "./chartTypes";

/**
 * Deciding which chart to draw when the chart type can come from two places.
 *
 * `chartType` is an enumeration property, which in Mendix means **design time only** — it arrives as a
 * plain value, not an `EditableValue`, so nothing can change it while the page is running. That is
 * fine for a dashboard tile whose form is decided when the page is built, and useless for a chart
 * whose form is chosen by the person looking at it.
 *
 * `chartTypeExpression` is the runtime half: an expression returning a chart type key. When it
 * produces a recognised key it wins; when it is empty the design-time value is used.
 *
 * **An unrecognised value is an error, not a fallback.** Falling back silently would render a chart
 * of the wrong type against data shaped for a different one — which usually produces something that
 * looks plausible and is wrong, the worst outcome available here. It also hides a typo in the
 * expression indefinitely.
 *
 * Note that the rendering technology takes the opposite decision and falls back — see `registry.tsx`.
 * The two are not inconsistent: a wrong chart type misrepresents the data, a wrong rasterisation does
 * not.
 */

export type ChartTypeResolution = { ok: true; chartType: ChartType } | { ok: false; error: string };

export function resolveChartType(fallback: ChartType, dynamic: string | undefined): ChartTypeResolution {
    const candidate = dynamic?.trim();

    if (!candidate) {
        return { ok: true, chartType: fallback };
    }

    if (isChartType(candidate)) {
        return { ok: true, chartType: candidate };
    }

    return { ok: false, error: unrecognisedMessage(candidate) };
}

/**
 * Name the value that was actually received, and suggest the nearest key.
 *
 * The realistic mistakes, in the order they will actually happen:
 *
 * 1. **A pre-2.0 `Responsive*` key.** Until 2.0 the keys were the Nivo component names, so every
 *    expression written against 1.x — and every page migrated from it — carries `"ResponsiveBar"`.
 *    This is the one worth naming explicitly rather than leaving to a fuzzy match, because it is a
 *    version migration rather than a typo and the fix is mechanical.
 * 2. A Nivo package name (`"bar"`) or a display label (`"Bar Chart"`).
 *
 * A case-insensitive match against the key, the key with the old prefix, and the label catches all of
 * them and turns a dead end into a one-line fix.
 */
function unrecognisedMessage(candidate: string): string {
    const lower = candidate.toLowerCase();

    const suggestion = CHART_TYPES.find(
        key =>
            key.toLowerCase() === lower ||
            `responsive${key.toLowerCase()}` === lower ||
            CHART_LABELS[key].toLowerCase() === lower ||
            CHART_LABELS[key].toLowerCase().replace(/\s+/g, "") === lower
    );

    if (suggestion && lower.startsWith("responsive")) {
        return (
            `"${candidate}" is a pre-2.0 chart type key. From 2.0 the chart type is the base name and ` +
            `the rendering technology is a separate property, so this is now "${suggestion}". ` +
            `If the expression reads an enumeration, getKey($currentObject/YourAttribute) returns the key directly.`
        );
    }

    return suggestion
        ? `"${candidate}" is not a chart type key. Did you mean "${suggestion}"?`
        : `"${candidate}" is not a chart type key. Expected one of the values in the Chart type property, e.g. "Bar".`;
}
