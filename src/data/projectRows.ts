import { CHART_DATASOURCE_SHAPE, CHART_LABELS, ChartType } from "../charts/chartTypes";
import { ParseResult } from "./parseJson";

/**
 * Turning a flat list of Mendix rows into chart data.
 *
 * The widget's original and still-default input is a JSON string, which puts the shaping burden on
 * the app. Datasource mode lets a chart bind straight to a Mendix list instead, which is the
 * ordinary way a Mendix page gets data and removes a whole class of "build the JSON in a microflow"
 * work.
 *
 * **This module is deliberately Mendix-free.** It takes plain rows — `Record<string, unknown>[]` —
 * so the adapter owns the `ListValue` and everything here is testable with no Mendix runtime. That
 * is the same boundary the rest of `data/`, `charts/` and `config/` keep.
 *
 * ## What it will not do, and why that is not a gap
 *
 * **It never aggregates.** A Mendix datasource has no group-by, so a widget that summed would be
 * summing whatever rows it happened to hold — and if the datasource pages, that is a subtotal
 * presented as a total. Plausible and wrong, which is the worst failure available. Aggregate in a
 * microflow; give this rows already at chart granularity.
 *
 * **Partitioning is not aggregating.** A `"series"` chart takes `Serie[]`, each with a nested `data`
 * array, and that is built by splitting rows on a series field. No row is combined with another, so
 * the ceiling above does not apply.
 *
 * **Eight chart types cannot be built from rows at all** — trees, graphs, a numeric matrix and
 * GeoJSON. A flat table does not contain a tree, and no mapping property would change that. Those
 * stay JSON-only. See `CHART_DATASOURCE_SHAPE`.
 */

/**
 * The key a row's position is carried under, inside the chart datum.
 *
 * A click handler is given a Nivo *datum*, not the Mendix row it came from, so something has to
 * bridge the two. Object identity cannot: the projection is serialised to JSON and re-parsed (that
 * round-trip is what makes the downstream memoisation work — see `AqNivo.tsx`), so the objects the
 * chart holds are copies, and a WeakMap keyed on the row would never match.
 *
 * So the handle travels *inside* the datum, as the row's index into the list the projection was given.
 * The adapter maps it straight back to `items[index]`, because it builds its rows one-for-one from
 * `items`.
 *
 * Double-underscored and Mendix-prefixed to stay out of the way of a modeller's own output keys, and
 * `projectRows` refuses a mapping that would write it anyway.
 */
export const ROW_KEY = "__mxRow";

/** One mapped column: which row field to read, and what to call it in the chart datum. */
export interface RowMapping {
    /** The key the value is read from on the projected row. */
    source: string;
    /** The key it becomes in the chart datum. Defaults to `source` when blank. */
    outputKey?: string;
}

export interface ProjectionInput {
    chartType: ChartType;
    rows: ReadonlyArray<Record<string, unknown>>;
    mappings: readonly RowMapping[];
    /**
     * For `"series"` charts only: the field to partition on. Each distinct value becomes one serie,
     * `{ id, data: [...] }`, with the remaining mapped fields forming each point.
     */
    seriesSource?: string;
    /**
     * Carry each row's index into its datum under {@link ROW_KEY}, so a click can be traced back to
     * the Mendix object it came from.
     *
     * Off by default, and set only when a click action is actually configured. An extra key in the
     * datum is not free — a chart that derives its series from the datum's own keys would treat it as
     * data — so it is not worth paying for on the charts that never need it.
     */
    includeRowKey?: boolean;
}

export function projectRows(input: ProjectionInput): ParseResult<unknown> {
    const { chartType, rows, mappings, seriesSource, includeRowKey } = input;
    const shape = CHART_DATASOURCE_SHAPE[chartType];
    const label = CHART_LABELS[chartType];

    if (shape === "unsupported") {
        return {
            ok: false,
            error:
                `${label} cannot be built from a data source. Its data is a tree, a graph, a matrix or a ` +
                `GeoJSON collection, and a flat list of rows does not contain one. Use Chart data with a JSON ` +
                `string for this chart type.`
        };
    }

    if (mappings.length === 0) {
        return {
            ok: false,
            error: "No columns are mapped, so every row would project to an empty object. Map at least one attribute."
        };
    }

    const keyed = mappings.map(mapping => ({
        source: mapping.source,
        outputKey: mapping.outputKey?.trim() ? mapping.outputKey.trim() : mapping.source
    }));

    const reserved = keyed.find(m => m.outputKey === ROW_KEY);
    if (reserved) {
        return {
            ok: false,
            error:
                `"${ROW_KEY}" is reserved: it is how a click is traced back to the row it fired on. ` +
                `Give that column a different output key.`
        };
    }

    const duplicate = firstDuplicate(keyed.map(m => m.outputKey));
    if (duplicate) {
        return {
            ok: false,
            error:
                `Two mapped columns both write "${duplicate}", so one would silently overwrite the other. ` +
                `Give them different output keys.`
        };
    }

    const project = (row: Record<string, unknown>, index: number): Record<string, unknown> => {
        const datum: Record<string, unknown> = {};
        for (const mapping of keyed) {
            datum[mapping.outputKey] = row[mapping.source];
        }
        if (includeRowKey) {
            datum[ROW_KEY] = index;
        }
        return datum;
    };

    if (shape === "flat") {
        return { ok: true, value: rows.map(project) };
    }

    // --- series ---------------------------------------------------------------------------------

    if (!seriesSource) {
        return {
            ok: false,
            error:
                `${label} takes one or more series, each with its own points, so it needs a Series column to ` +
                `split the rows on. Pick the attribute that names the series.`
        };
    }

    /*
     * Insertion-ordered, deliberately. A Map preserves first-seen order, so the series appear in the
     * order the datasource returned them — which is the order the modeller controls through the
     * datasource's own sort. Sorting here would silently override that.
     */
    const series = new Map<string, Array<Record<string, unknown>>>();

    rows.forEach((row, index) => {
        const rawId = row[seriesSource];
        const id = rawId === null || rawId === undefined ? "" : String(rawId);
        const points = series.get(id);
        // The index is the row's position in the ORIGINAL list, not in its serie — a point in the
        // third serie still has to find its own row.
        if (points) {
            points.push(project(row, index));
        } else {
            series.set(id, [project(row, index)]);
        }
    });

    return { ok: true, value: [...series].map(([id, data]) => ({ id, data })) };
}

function firstDuplicate(values: readonly string[]): string | undefined {
    const seen = new Set<string>();
    for (const value of values) {
        if (seen.has(value)) {
            return value;
        }
        seen.add(value);
    }
    return undefined;
}
