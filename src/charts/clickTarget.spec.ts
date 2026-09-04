import { ROW_KEY, rowToken } from "../data/projectRows";
import { resolveRowKey } from "./clickTarget";

/*
 * The payload shapes below are the ones Nivo actually hands `onClick`, which differ per chart family
 * — that variety is the whole reason this module exists rather than a single property read.
 */

describe("where the row handle can sit", () => {
    it("finds it on the wrapped datum — Bar, Pie, ScatterPlot, SwarmPlot", () => {
        const payload = {
            id: "claims",
            value: 412,
            index: 0,
            data: { period: "Q1", claims: 412, [ROW_KEY]: rowToken(3) }
        };
        expect(resolveRowKey(payload)).toBe(3);
    });

    it("finds it on a Line point, where the point's own datum carries it", () => {
        const payload = { serieId: "Motor", index: 1, data: { x: "Q2", y: 11.8, [ROW_KEY]: rowToken(1) } };
        expect(resolveRowKey(payload)).toBe(1);
    });

    it("finds it spread onto the payload — Funnel, TimeRange, Calendar", () => {
        expect(resolveRowKey({ day: "2026-01-04", value: 12, [ROW_KEY]: rowToken(7) })).toBe(7);
    });

    it("finds it through a double wrapper", () => {
        expect(resolveRowKey({ data: { data: { [ROW_KEY]: rowToken(2) } } })).toBe(2);
    });
});

describe("what it refuses to resolve, and why that matters", () => {
    /*
     * These are not edge cases for their own sake. Each one, resolved wrongly, would fire a
     * drill-down microflow against the wrong Mendix object — which is worse than not firing, because
     * the app would confidently show the user someone else's record.
     */
    it("returns undefined for a series-level click, so nothing fires", () => {
        // Stream hands back a layer: many rows, no single one.
        expect(resolveRowKey({ id: "Motor", label: "Motor", color: "#e8c1a0" })).toBeUndefined();
    });

    it("does not treat a mapped output value as a row handle", () => {
        // A datum whose own data happens to contain numbers must not resolve.
        expect(resolveRowKey({ data: { period: "Q1", claims: 412 } })).toBeUndefined();
    });

    it("rejects anything that is not the opaque token", () => {
        // A bare number is refused deliberately. Mapped columns are full of numbers, and treating one
        // as a row index would drill into the WRONG Mendix object rather than simply fail — a
        // confidently wrong drill-down is worse than a dead click.
        expect(resolveRowKey({ [ROW_KEY]: 2 })).toBeUndefined();
        expect(resolveRowKey({ [ROW_KEY]: "2" })).toBeUndefined();
        expect(resolveRowKey({ [ROW_KEY]: "rX" })).toBeUndefined();
        expect(resolveRowKey({ [ROW_KEY]: "r-1" })).toBeUndefined();
        expect(resolveRowKey({ [ROW_KEY]: "" })).toBeUndefined();
    });

    it("resolves the FIRST row, which a falsy value silently loses", () => {
        /*
         * The regression this pins is not in our code — it is in Nivo's. A stacked Bar rebuilds each
         * datum as `Object.keys(e).reduce((t,a) => (e[a] && (t[a] = e[a]), t), {})` before handing it
         * to a click callback, so every FALSY value is dropped. A numeric handle of 0 vanished from
         * the first row and only the first row: three bars drilled through, the leftmost did nothing,
         * and nothing anywhere reported it. The token is a string precisely so it survives.
         */
        expect(rowToken(0)).toBe("r0");
        expect(Boolean(rowToken(0))).toBe(true);
        expect(resolveRowKey({ [ROW_KEY]: rowToken(0) })).toBe(0);
        expect(resolveRowKey({ data: { [ROW_KEY]: rowToken(0) } })).toBe(0);
    });

    it("survives the payloads that are not objects at all", () => {
        expect(resolveRowKey(undefined)).toBeUndefined();
        expect(resolveRowKey(null)).toBeUndefined();
        expect(resolveRowKey("Motor")).toBeUndefined();
        expect(resolveRowKey(42)).toBeUndefined();
    });
});
