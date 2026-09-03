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
 * The realistic mistakes are a display label ("Bar") or a Nivo package name ("bar"), not a random
 * string — so a case-insensitive match against the key with and without the "Responsive" prefix
 * catches most of them and turns a dead end into a one-line fix.
 */
function unrecognisedMessage(candidate: string): string {
    const suggestion = CHART_TYPES.find(
        key =>
            key.toLowerCase() === candidate.toLowerCase() ||
            key.toLowerCase() === `responsive${candidate.toLowerCase()}` ||
            CHART_LABELS[key].toLowerCase() === candidate.toLowerCase()
    );

    return suggestion
        ? `"${candidate}" is not a chart type key. Did you mean "${suggestion}"?`
        : `"${candidate}" is not a chart type key. Expected one of the values in the Chart type property, e.g. "ResponsiveBar".`;
}
