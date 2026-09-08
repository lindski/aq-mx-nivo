import { CHART_TYPES, ChartType } from "./chartTypes";
import { whyCannotDraw } from "./drawability";

/*
 * The drawability guard.
 *
 * These pin a decision no unit test could have discovered: which chart types throw inside Nivo when
 * handed the wrong data or an incomplete configuration. That was measured in a browser; what is
 * testable here is the predicate the guard reads, and — more valuable — the NEGATIVE cases, because an
 * over-strict rule blanks a chart that would have drawn perfectly. That is strictly worse than the
 * console noise the guard exists to remove.
 */

/** A realistic payload per element shape, of the kind each chart type actually receives. */
const SERIES = [{ id: "Motor", data: [{ x: "Jan", y: 4 }] }];
const FLAT = [{ id: "a", value: 1 }];
const MATRIX = [
    [0, 5],
    [5, 0]
];

describe("whyCannotDraw — the chart types that need geography", () => {
    it("stops Geo Map and Choropleth without a features collection", () => {
        for (const chartType of ["GeoMap", "Choropleth"] as const) {
            expect(whyCannotDraw(chartType, [], {})).toMatch(/features/);
            expect(whyCannotDraw(chartType, [], { features: [] })).toMatch(/features/);
            expect(whyCannotDraw(chartType, [], { features: null })).toMatch(/features/);
            // The chart-type-switch case: the previous chart's configuration.
            expect(whyCannotDraw(chartType, FLAT, { keys: ["value"] })).toMatch(/features/);
        }
    });

    it("passes a real feature collection through", () => {
        const configuration = { features: [{ type: "Feature", id: "GBR" }] };

        expect(whyCannotDraw("GeoMap", [], configuration)).toBeUndefined();
        expect(whyCannotDraw("Choropleth", FLAT, configuration)).toBeUndefined();
    });
});

describe("whyCannotDraw — required configuration", () => {
    /*
     * Each of these was confirmed by rendering that chart type with correct data and a `{}`
     * configuration and watching Nivo throw. None is here because documentation called it required.
     */
    it("names the missing key for the four chart types that cannot render without one", () => {
        expect(whyCannotDraw("Chord", MATRIX, {})).toMatch(/"keys"/);
        expect(whyCannotDraw("Radar", FLAT, {})).toMatch(/"keys"/);
        expect(whyCannotDraw("Stream", FLAT, {})).toMatch(/"keys"/);
        expect(whyCannotDraw("Marimekko", FLAT, {})).toMatch(/"id"/);
    });

    it("asks for nothing from the chart types that default their own configuration", () => {
        const exempt = CHART_TYPES.filter(
            t => !["Chord", "Radar", "Stream", "Marimekko", "GeoMap", "Choropleth"].includes(t)
        );

        for (const chartType of exempt) {
            expect(whyCannotDraw(chartType, undefined, {})).toBeUndefined();
        }
    });
});

describe("whyCannotDraw — element shape", () => {
    it("catches a flat list handed to a series chart", () => {
        for (const chartType of ["AreaBump", "Bump", "HeatMap", "Line", "RadialBar", "ScatterPlot"] as const) {
            expect(whyCannotDraw(chartType, FLAT, {})).toMatch(/series/);
            expect(whyCannotDraw(chartType, SERIES, {})).toBeUndefined();
        }
    });

    it("catches a record list handed to Chord, which takes a matrix", () => {
        expect(whyCannotDraw("Chord", FLAT, { keys: ["a", "b"] })).toMatch(/matrix/);
        expect(whyCannotDraw("Chord", MATRIX, { keys: ["a", "b"] })).toBeUndefined();
    });

    it("catches data with no day on the calendar charts", () => {
        for (const chartType of ["Calendar", "TimeRange"] as const) {
            expect(whyCannotDraw(chartType, FLAT, {})).toMatch(/"day"/);
            expect(whyCannotDraw(chartType, [{ day: "2026-01-01", value: 3 }], {})).toBeUndefined();
        }
    });

    it("catches data with no ranges or measures on Bullet", () => {
        expect(whyCannotDraw("Bullet", FLAT, {})).toMatch(/ranges/);
        expect(whyCannotDraw("Bullet", [{ id: "a", ranges: [1], measures: [1] }], {})).toBeUndefined();
    });
});

describe("whyCannotDraw — configuration naming fields the data does not carry", () => {
    /*
     * The half a shape check cannot reach: a configuration valid on its own and data valid on its own
     * that still throw when the two disagree — exactly what a half-completed chart-type switch makes.
     */
    it("catches keys that are absent from the datum", () => {
        expect(whyCannotDraw("Radar", [{ taste: "fruity" }], { keys: ["chardonay", "carmenere"] })).toMatch(
            /does not carry/
        );
        expect(whyCannotDraw("Stream", [{ a: 1 }], { keys: ["x", "y"] })).toMatch(/does not carry/);
    });

    it("accepts keys the datum does carry", () => {
        const datum = [{ taste: "fruity", chardonay: 60, carmenere: 40 }];

        expect(whyCannotDraw("Radar", datum, { keys: ["chardonay", "carmenere"], indexBy: "taste" })).toBeUndefined();
    });

    /*
     * A PARTIAL match must pass. A stacked chart legitimately has datums missing some keys — a series
     * that starts late, a category with no value this month — and blanking that chart would be wrong.
     * Only a datum carrying none of the configured keys is evidence of the wrong payload.
     */
    it("accepts a datum carrying only some of the configured keys", () => {
        expect(whyCannotDraw("Stream", [{ x: 1 }], { keys: ["x", "y"] })).toBeUndefined();
    });

    it("checks Marimekko against its dimension value fields", () => {
        const dimensions = [
            { id: "Open", value: "open" },
            { id: "Closed", value: "closed" }
        ];

        expect(whyCannotDraw("Marimekko", [{ id: "a", value: 1 }], { id: "id", value: "value", dimensions })).toMatch(
            /does not carry/
        );
        expect(
            whyCannotDraw("Marimekko", [{ id: "a", value: 1, open: 2, closed: 3 }], {
                id: "id",
                value: "value",
                dimensions
            })
        ).toBeUndefined();
    });

    it("checks Chord's key count against its matrix size", () => {
        expect(whyCannotDraw("Chord", MATRIX, { keys: ["a", "b", "c"] })).toMatch(/3 keys/);
        expect(whyCannotDraw("Chord", MATRIX, { keys: ["a", "b"] })).toBeUndefined();
    });
});

describe("whyCannotDraw — it must not fire on nothing", () => {
    /*
     * The empty-data gate runs BEFORE this in NivoChart, so absent or empty data reaching here means
     * a chart type that takes none. Returning a reason would blank a chart that is merely still
     * loading.
     *
     * The six exclusions are the chart types with a rule that does not depend on data at all — the two
     * geographic ones and the four with required configuration. Those SHOULD still report, because a
     * Chord with no "keys" cannot be drawn whatever the data is. This test is about the shape rules
     * not firing on nothing, and the exclusions are what keep it about that.
     */
    it("says nothing about absent or empty data, for every rule that depends on data", () => {
        const dataDependent = CHART_TYPES.filter(
            t => !["GeoMap", "Choropleth", "Chord", "Radar", "Stream", "Marimekko"].includes(t)
        );

        for (const chartType of dataDependent) {
            expect(whyCannotDraw(chartType as ChartType, undefined, {})).toBeUndefined();
            expect(whyCannotDraw(chartType as ChartType, [], {})).toBeUndefined();
        }
    });

    it("says nothing about a non-array payload, which parseChartData has already rejected", () => {
        expect(whyCannotDraw("Sankey", { nodes: [], links: [] }, {})).toBeUndefined();
        expect(whyCannotDraw("TreeMap", { name: "root", children: [] }, {})).toBeUndefined();
    });
});
