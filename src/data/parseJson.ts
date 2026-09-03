import { CHART_DATA_SHAPE, ChartType } from "../charts/chartTypes";

/**
 * Safe JSON parsing, returning a result rather than throwing.
 *
 * 1.x called `JSON.parse` three times directly inside render. A throw there does not fail the widget,
 * it fails the React render pass — which in the Mendix client takes down the whole page, not just the
 * chart (C-01). And the throw is not hypothetical: a String attribute left at the Mendix 200-character
 * default truncates chart JSON mid-token, so the most likely first experience of a new user is a
 * blank page (P-05).
 *
 * Nothing in this module throws.
 */

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

export function parseJson(raw: string | undefined, label: string): ParseResult<unknown> {
    if (raw === undefined || raw.trim() === "") {
        return { ok: true, value: undefined };
    }

    try {
        return { ok: true, value: JSON.parse(raw) };
    } catch (e) {
        return { ok: false, error: `${label} is not valid JSON: ${messageOf(e)}${truncationHint(raw)}` };
    }
}

/**
 * Parse a configuration payload, which must be a JSON object if it is anything.
 *
 * An array here is the common mistake and it fails silently rather than loudly: spreading an array
 * into a props object yields numeric keys, which Nivo ignores, so the chart renders with none of the
 * configuration and no indication why.
 */
export function parseConfiguration(raw: string | undefined, label: string): ParseResult<Record<string, unknown>> {
    const parsed = parseJson(raw, label);
    if (!parsed.ok) {
        return parsed;
    }
    if (parsed.value === undefined) {
        return { ok: true, value: {} };
    }
    if (typeof parsed.value !== "object" || parsed.value === null || Array.isArray(parsed.value)) {
        return { ok: false, error: `${label} must be a JSON object, not ${describe(parsed.value)}.` };
    }
    return { ok: true, value: parsed.value as Record<string, unknown> };
}

/**
 * Parse a chart's data payload and check it against the shape that chart type actually takes.
 *
 * The shape check is worth its lines because Nivo's own failure is so far from the cause — a chart
 * handed an object where it wants an array throws inside a `.map` several frames down.
 */
export function parseChartData(raw: string | undefined, chartType: ChartType): ParseResult<unknown> {
    const parsed = parseJson(raw, "Chart data");
    if (!parsed.ok) {
        return parsed;
    }
    if (parsed.value === undefined) {
        return { ok: true, value: undefined };
    }

    const expected = CHART_DATA_SHAPE[chartType];
    const isArray = Array.isArray(parsed.value);
    const isObject = typeof parsed.value === "object" && parsed.value !== null && !isArray;

    if (expected === "array" && !isArray) {
        return {
            ok: false,
            error: `Chart data for this chart type must be a JSON array, not ${describe(parsed.value)}.`
        };
    }
    if (expected === "object" && !isObject) {
        return {
            ok: false,
            error: `Chart data for this chart type must be a JSON object, not ${describe(parsed.value)}.`
        };
    }

    return { ok: true, value: parsed.value };
}

/** True when a successfully parsed payload holds nothing to draw. */
export function isEmptyData(value: unknown): boolean {
    if (value === undefined || value === null) {
        return true;
    }
    if (Array.isArray(value)) {
        return value.length === 0;
    }
    if (typeof value === "object") {
        return Object.keys(value as object).length === 0;
    }
    return false;
}

function describe(value: unknown): string {
    if (value === null) {
        return "null";
    }
    if (Array.isArray(value)) {
        return "an array";
    }
    return `a ${typeof value}`;
}

function messageOf(e: unknown): string {
    return e instanceof Error ? e.message : String(e);
}

/**
 * The 200-character default is the single most likely cause of a parse failure here, and it is
 * invisible from the page — so say it, rather than leaving a bare syntax error to be misread as a
 * broken data source.
 */
function truncationHint(raw: string): string {
    return raw.length === 200
        ? " — the value is exactly 200 characters, which is the Mendix default String length. The attribute is almost certainly truncated: set it to Unlimited in the domain model."
        : "";
}
