/**
 * The chart's data as a table, for the tabular alternative (P-12).
 *
 * ## Why a label is not enough
 *
 * `aria-label` on the chart says *what the chart is about*. It does not carry a single number, so a
 * screen-reader user gets "Claims volume by month, split by peril" and nothing else — the topic
 * without the content. WCAG's remedy for a chart is an equivalent in another form, and for
 * quantitative data that is a table.
 *
 * **It matters most on Canvas.** SVG and HTML at least put tick labels, legends and value labels in
 * the DOM, so a determined reader can pick something out. A Canvas chart is a single bitmap: there is
 * no text at all, and without this the accessible label is the *entire* accessible content.
 *
 * ## Why this derives the shape rather than consulting a table
 *
 * `chartTypes.ts` carries hand-maintained tables for renderer support, palette support and datasource
 * shape, each read out of the Nivo typings. A fourth for "is this tabular" would be the same work
 * again and would drift, because the answer does not actually depend on the chart type — it depends
 * on what the bound data turned out to be. A Bar given a flat array tabulates; a Bar given something
 * else does not, and the chart type is the same in both cases.
 *
 * So this inspects the parsed value. `check()` still warns at design time for the chart types whose
 * declared shape can never tabulate, because that is knowable before the data exists.
 *
 * ## What tabulates, and what does not
 *
 * - **A flat array of objects** — `[{ month: "Jan", flood: 12 }, …]` — one row per element, columns
 *   from the union of keys. This is Bar, Pie, Calendar, Waffle and most others.
 * - **A series array** — `[{ id: "Motor", data: [{ x: "Jan", y: 12 }, …] }, …]` — flattened to one
 *   row per point, with the series id as the first column. This is Line, Scatter Plot, Heat Map,
 *   Bump, Area Bump and Radial Bar.
 * - **Nothing else.** Hierarchies and graphs (`{ children: [...] }`, `{ nodes, links }`), Chord's
 *   numeric matrix and Geo Map's feature collection are not tables and would need a presentation
 *   invented for them. Inventing one is worse than declining: a made-up flattening of a tree reads
 *   as authoritative and is not.
 */

/** A rectangular view of the chart's data. Values are already strings, ready to render. */
export interface DataTable {
    columns: string[];
    rows: string[][];
    /** Rows omitted by the cap, so the caller can say so rather than silently truncating. */
    omitted: number;
}

/**
 * Rows beyond this are dropped.
 *
 * A Calendar carries a year of days and a Swarm Plot can carry thousands of points. Rendering all of
 * them doubles the DOM for every chart on the page, and a table that long is not usable by the
 * screen-reader user it exists for either — they cannot hold 3,000 rows any more than a sighted user
 * can. Announcing the omission is the honest compromise; a silent truncation is the thing to avoid,
 * because a table that stops at an arbitrary point looks like the data ends there.
 */
export const MAX_TABLE_ROWS = 500;

/** Keys the widget adds for its own purposes, which are not the user's data. */
const INTERNAL_KEYS = new Set(["__mxRow"]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * A series is an object carrying a nested `data` array — Nivo's `Serie` shape.
 *
 * Checked structurally rather than by chart type, for the reason in the header: the chart type does
 * not determine what the modeller actually bound.
 */
function isSeries(value: unknown): value is { id?: unknown; data: unknown[] } {
    return isPlainObject(value) && Array.isArray(value.data);
}

/** One cell. Everything becomes a string here so the renderer stays presentational. */
function cell(value: unknown): string {
    if (value === null || value === undefined) {
        return "";
    }
    if (typeof value === "string") {
        return value;
    }
    if (typeof value === "number" || typeof value === "boolean") {
        return String(value);
    }
    if (value instanceof Date) {
        return value.toISOString();
    }
    /*
     * An object in a cell is unusual but not impossible — Nivo accepts `{ x, y }` points whose y is
     * itself structured. JSON is a poor cell value, but it is honest, and losing the value entirely
     * would be worse in the one place whose whole purpose is not losing values.
     */
    try {
        return JSON.stringify(value) ?? "";
    } catch {
        return "";
    }
}

/** Column order is first-appearance across the rows, so it matches how the data was authored. */
function columnsOf(records: Array<Record<string, unknown>>): string[] {
    const seen: string[] = [];
    for (const record of records) {
        for (const key of Object.keys(record)) {
            if (!INTERNAL_KEYS.has(key) && !seen.includes(key)) {
                seen.push(key);
            }
        }
    }
    return seen;
}

function build(records: Array<Record<string, unknown>>, lead?: { column: string; values: string[] }): DataTable {
    const columns = columnsOf(records);
    const capped = records.slice(0, MAX_TABLE_ROWS);
    const rows = capped.map((record, index) => {
        const values = columns.map(column => cell(record[column]));
        return lead ? [lead.values[index], ...values] : values;
    });
    return {
        columns: lead ? [lead.column, ...columns] : columns,
        rows,
        omitted: Math.max(0, records.length - capped.length)
    };
}

/**
 * The chart's data as a table, or `undefined` where the shape is not tabular.
 *
 * `undefined` is a real answer, not a failure: it is what the caller renders nothing for, and what
 * `check()` warns about at design time.
 */
export function tabulate(value: unknown): DataTable | undefined {
    if (!Array.isArray(value) || value.length === 0) {
        return undefined;
    }

    // Series first — a series is also a plain object, so testing flat first would match it wrongly
    // and produce a one-row-per-series table whose only column was a stringified data array.
    if (value.every(isSeries)) {
        const points: Array<Record<string, unknown>> = [];
        const seriesNames: string[] = [];
        for (const serie of value) {
            const name = cell(serie.id);
            for (const point of serie.data) {
                if (!isPlainObject(point)) {
                    continue;
                }
                points.push(point);
                seriesNames.push(name);
            }
        }
        if (points.length === 0) {
            return undefined;
        }
        return build(points, { column: "Series", values: seriesNames });
    }

    if (value.every(isPlainObject)) {
        return build(value as Array<Record<string, unknown>>);
    }

    return undefined;
}
