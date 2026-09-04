import { CHART_DATASOURCE_SHAPE, CHART_TYPES } from "../charts/chartTypes";
import { projectRows, RowMapping } from "./projectRows";

const ok = (result: ReturnType<typeof projectRows>): unknown => {
    if (!result.ok) {
        throw new Error(`Expected success, got: ${result.error}`);
    }
    return result.value;
};

const mapped = (...sources: string[]): RowMapping[] => sources.map(source => ({ source }));

describe("flat charts", () => {
    it("maps one row to one datum", () => {
        const value = ok(
            projectRows({
                chartType: "Pie",
                rows: [
                    { Status: "Settled", Count: 412, Ignored: "x" },
                    { Status: "Notified", Count: 94, Ignored: "y" }
                ],
                mappings: mapped("Status", "Count")
            })
        );

        // Unmapped fields are dropped: the mapping is the contract, not the row.
        expect(value).toEqual([
            { Status: "Settled", Count: 412 },
            { Status: "Notified", Count: 94 }
        ]);
    });

    it("renames through outputKey, which is how a Mendix attribute name becomes a Nivo one", () => {
        const value = ok(
            projectRows({
                chartType: "Pie",
                rows: [{ ClaimStatus: "Settled", ClaimCount: 412 }],
                mappings: [
                    { source: "ClaimStatus", outputKey: "id" },
                    { source: "ClaimCount", outputKey: "value" }
                ]
            })
        );
        expect(value).toEqual([{ id: "Settled", value: 412 }]);
    });

    it("treats a blank outputKey as absent rather than as an empty key", () => {
        const value = ok(
            projectRows({
                chartType: "Pie",
                rows: [{ Status: "Settled" }],
                mappings: [{ source: "Status", outputKey: "   " }]
            })
        );
        expect(value).toEqual([{ Status: "Settled" }]);
    });

    it("produces an empty array for no rows rather than failing", () => {
        expect(ok(projectRows({ chartType: "Pie", rows: [], mappings: mapped("Status") }))).toEqual([]);
    });
});

describe("series charts", () => {
    /*
     * Partitioning, not aggregating. No row is combined with another — which is why this does not
     * run into the no-group-by ceiling that forbids the widget summing anything.
     */
    it("partitions rows into series, preserving first-seen order", () => {
        const value = ok(
            projectRows({
                chartType: "Line",
                rows: [
                    { Team: "Motor", Month: "Jan", Days: 12 },
                    { Team: "Property", Month: "Jan", Days: 19 },
                    { Team: "Motor", Month: "Feb", Days: 14 }
                ],
                mappings: [
                    { source: "Month", outputKey: "x" },
                    { source: "Days", outputKey: "y" }
                ],
                seriesSource: "Team"
            })
        );

        expect(value).toEqual([
            {
                id: "Motor",
                data: [
                    { x: "Jan", y: 12 },
                    { x: "Feb", y: 14 }
                ]
            },
            { id: "Property", data: [{ x: "Jan", y: 19 }] }
        ]);
    });

    it("coerces a non-string series value to a string id", () => {
        const value = ok(
            projectRows({
                chartType: "Line",
                rows: [{ Year: 2025, X: 1, Y: 2 }],
                mappings: [
                    { source: "X", outputKey: "x" },
                    { source: "Y", outputKey: "y" }
                ],
                seriesSource: "Year"
            })
        ) as Array<{ id: string }>;
        expect(value[0].id).toBe("2025");
    });

    it("asks for a series column rather than silently producing one unnamed series", () => {
        const result = projectRows({
            chartType: "Line",
            rows: [{ X: 1, Y: 2 }],
            mappings: mapped("X", "Y")
        });
        expect(result.ok).toBe(false);
        expect(result.ok === false && result.error).toContain("needs a Series column");
    });
});

describe("what it refuses, and how clearly", () => {
    it("refuses the eight shapes a flat table cannot express", () => {
        const unsupported = CHART_TYPES.filter(t => CHART_DATASOURCE_SHAPE[t] === "unsupported");
        expect(unsupported).toEqual([
            "Bullet",
            "Chord",
            "CirclePacking",
            "GeoMap",
            "Network",
            "Sankey",
            "Sunburst",
            "TreeMap"
        ]);

        for (const chartType of unsupported) {
            const result = projectRows({ chartType, rows: [{ a: 1 }], mappings: mapped("a") });
            expect(result.ok).toBe(false);
            expect(result.ok === false && result.error).toContain("cannot be built from a data source");
        }
    });

    it("refuses an empty mapping, which would project every row to {}", () => {
        const result = projectRows({ chartType: "Pie", rows: [{ a: 1 }], mappings: [] });
        expect(result.ok).toBe(false);
        expect(result.ok === false && result.error).toContain("No columns are mapped");
    });

    /*
     * Two columns writing the same key is the silent-overwrite case: the chart draws, one column is
     * simply absent, and nothing anywhere says so.
     */
    it("refuses two columns that would write the same key", () => {
        const result = projectRows({
            chartType: "Pie",
            rows: [{ A: 1, B: 2 }],
            mappings: [
                { source: "A", outputKey: "value" },
                { source: "B", outputKey: "value" }
            ]
        });
        expect(result.ok).toBe(false);
        expect(result.ok === false && result.error).toContain('both write "value"');
    });

    it("covers every chart type in the shape table", () => {
        for (const chartType of CHART_TYPES) {
            expect(CHART_DATASOURCE_SHAPE[chartType]).toBeDefined();
        }
        expect(CHART_TYPES.filter(t => CHART_DATASOURCE_SHAPE[t] === "flat")).toHaveLength(12);
        expect(CHART_TYPES.filter(t => CHART_DATASOURCE_SHAPE[t] === "series")).toHaveLength(6);
    });
});
