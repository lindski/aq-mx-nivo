import { ROW_KEY } from "../data/projectRows";
import { resolveRowKey } from "./clickTarget";

/*
 * The payload shapes below are the ones Nivo actually hands `onClick`, which differ per chart family
 * — that variety is the whole reason this module exists rather than a single property read.
 */

describe("where the row handle can sit", () => {
    it("finds it on the wrapped datum — Bar, Pie, ScatterPlot, SwarmPlot", () => {
        const payload = { id: "claims", value: 412, index: 0, data: { period: "Q1", claims: 412, [ROW_KEY]: 3 } };
        expect(resolveRowKey(payload)).toBe(3);
    });

    it("finds it on a Line point, where the point's own datum carries it", () => {
        const payload = { serieId: "Motor", index: 1, data: { x: "Q2", y: 11.8, [ROW_KEY]: 1 } };
        expect(resolveRowKey(payload)).toBe(1);
    });

    it("finds it spread onto the payload — Funnel, TimeRange, Calendar", () => {
        expect(resolveRowKey({ day: "2026-01-04", value: 12, [ROW_KEY]: 7 })).toBe(7);
    });

    it("finds it through a double wrapper", () => {
        expect(resolveRowKey({ data: { data: { [ROW_KEY]: 2 } } })).toBe(2);
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

    it("rejects a non-integer, a negative, and a numeric string", () => {
        expect(resolveRowKey({ [ROW_KEY]: 1.5 })).toBeUndefined();
        expect(resolveRowKey({ [ROW_KEY]: -1 })).toBeUndefined();
        expect(resolveRowKey({ [ROW_KEY]: "2" })).toBeUndefined();
    });

    it("resolves index 0, which the obvious falsy check would drop", () => {
        // The first row is the one most likely to be clicked first, so this would not stay hidden
        // long — but it would look like "the first bar is broken" rather than a truthiness bug.
        expect(resolveRowKey({ [ROW_KEY]: 0 })).toBe(0);
        expect(resolveRowKey({ data: { [ROW_KEY]: 0 } })).toBe(0);
    });

    it("survives the payloads that are not objects at all", () => {
        expect(resolveRowKey(undefined)).toBeUndefined();
        expect(resolveRowKey(null)).toBeUndefined();
        expect(resolveRowKey("Motor")).toBeUndefined();
        expect(resolveRowKey(42)).toBeUndefined();
    });
});
