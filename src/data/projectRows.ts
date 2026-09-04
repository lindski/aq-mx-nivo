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
}

export function projectRows(input: ProjectionInput): ParseResult<unknown> {
    const { chartType, rows, mappings, seriesSource } = input;
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

    const duplicate = firstDuplicate(keyed.map(m => m.outputKey));
    if (duplicate) {
        return {
            ok: false,
            error:
                `Two mapped columns both write "${duplicate}", so one would silently overwrite the other. ` +
                `Give them different output keys.`
        };
    }

    const project = (row: Record<string, unknown>): Record<string, unknown> => {
        const datum: Record<string, unknown> = {};
        for (const mapping of keyed) {
            datum[mapping.outputKey] = row[mapping.source];
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

    for (const row of rows) {
        const rawId = row[seriesSource];
        const id = rawId === null || rawId === undefined ? "" : String(rawId);
        const points = series.get(id);
        if (points) {
            points.push(project(row));
        } else {
            series.set(id, [project(row)]);
        }
    }

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
