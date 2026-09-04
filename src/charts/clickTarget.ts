import { ROW_KEY, rowFromToken } from "../data/projectRows";

/**
 * Finding the clicked row inside a Nivo click payload.
 *
 * **Nivo has no single click contract.** Each chart family hands its `onClick` a different object,
 * and the shapes genuinely differ rather than merely being named differently: a Bar gets a datum
 * wrapper whose `data` is the original object, a Line point gets `{ serieId, index, data }`, a Funnel
 * part gets the datum's own fields spread onto the payload, and a Stream layer gets a *layer* — which
 * corresponds to a whole series, not to any one row.
 *
 * Enumerating 18 per-type extractors would be the obvious response and the wrong one. It would mean
 * a table that has to be kept in step with Nivo's internals across every future release, where a
 * change is silent — a type whose payload shape moved would simply stop resolving, and a click that
 * does nothing looks exactly like a click on empty space. Instead this probes a short ordered list of
 * places the handle can be, which is stable under Nivo reshuffling its wrappers because it does not
 * care what the wrapper is called.
 *
 * The handle itself is put there by `projectRows` — see {@link ROW_KEY} for why it has to be carried
 * inside the datum rather than by object identity.
 *
 * **Not every chart type can resolve a row, and that is a real ceiling rather than a bug.** Where
 * Nivo's click is *about* a series or a layer — Stream, Bump, Area Bump — there is no single row to
 * report, because the thing clicked corresponds to many. Those return `undefined`, and the caller
 * declines to fire rather than firing with nothing.
 */

/** The places the row handle can sit, in the order they are tried. */
const PROBES: ReadonlyArray<(payload: Record<string, unknown>) => unknown> = [
    // Bar, Pie, Line point, ScatterPlot node, SwarmPlot node, Marimekko bar, Waffle cell, HeatMap
    // cell — the datum is wrapped and the original object is on `data`.
    payload => asRecord(payload.data)?.[ROW_KEY],
    // Funnel part, TimeRange day, Calendar day — the datum's own fields are spread onto the payload.
    payload => payload[ROW_KEY],
    // Doubly wrapped, seen where a node carries a datum that itself carries the original.
    payload => asRecord(asRecord(payload.data)?.data)?.[ROW_KEY]
];

/**
 * The row index a click landed on, or `undefined` when the payload does not identify a single row.
 *
 * Strict about what counts: only the opaque `"r<index>"` token `projectRows` writes is accepted. A
 * bare number is deliberately NOT accepted, even though it would look like a reasonable handle —
 * mapped columns are full of numbers, and treating one as a row index would drill into the wrong
 * Mendix object rather than fail to drill at all. Wrong is worse than nothing here.
 */
export function resolveRowKey(payload: unknown): number | undefined {
    const record = asRecord(payload);
    if (!record) {
        return undefined;
    }

    for (const probe of PROBES) {
        const index = rowFromToken(probe(record));
        if (index !== undefined) {
            return index;
        }
    }

    return undefined;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
    return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : undefined;
}
