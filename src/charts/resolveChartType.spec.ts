import { resolveChartType } from "./resolveChartType";

describe("resolveChartType", () => {
    it("uses the design-time chart type when no expression value is supplied", () => {
        expect(resolveChartType("Bar", undefined)).toEqual({ ok: true, chartType: "Bar" });
        expect(resolveChartType("Bar", "")).toEqual({ ok: true, chartType: "Bar" });
        expect(resolveChartType("Bar", "   ")).toEqual({ ok: true, chartType: "Bar" });
    });

    it("lets a recognised expression value override the design-time chart type", () => {
        expect(resolveChartType("Bar", "Sankey")).toEqual({ ok: true, chartType: "Sankey" });
    });

    it("tolerates surrounding whitespace, which an expression concatenation easily introduces", () => {
        expect(resolveChartType("Bar", "  Pie  ")).toEqual({ ok: true, chartType: "Pie" });
    });

    /*
     * The important behaviour. Falling back silently would draw a chart of the wrong type against
     * data shaped for a different one — which tends to produce something plausible-looking and wrong,
     * and hides the typo indefinitely.
     *
     * Note this is deliberately the opposite of what an unsupported *renderer* does, which falls back
     * to SVG: a wrong chart type misrepresents the data, a wrong rasterisation does not.
     */
    it("fails rather than falling back when the value is not a chart type", () => {
        const result = resolveChartType("Bar", "Doughnut");
        expect(result.ok).toBe(false);
        expect(result.ok === false && result.error).toContain('"Doughnut" is not a chart type key');
    });

    /*
     * The migration case, and the one that will actually happen: 2.0 dropped the "Responsive" prefix
     * when the renderer became its own property, so every expression written against 1.x carries the
     * old key. That deserves a message naming the change rather than a generic "did you mean".
     */
    it("explains the 2.0 rename when handed a pre-2.0 Responsive key", () => {
        const result = resolveChartType("Bar", "ResponsiveTreeMap");
        expect(result.ok).toBe(false);
        expect(result.ok === false && result.error).toContain("pre-2.0 chart type key");
        expect(result.ok === false && result.error).toContain('now "TreeMap"');
    });

    it("suggests the right key for the mistakes people actually make", () => {
        // A display label rather than a key.
        const label = resolveChartType("Bar", "Scatter Plot");
        expect(label.ok === false && label.error).toContain('Did you mean "ScatterPlot"');

        // The Nivo package name rather than the key.
        const bare = resolveChartType("Bar", "sankey");
        expect(bare.ok === false && bare.error).toContain('Did you mean "Sankey"');

        // Right key, wrong case.
        const casing = resolveChartType("Bar", "treemap");
        expect(casing.ok === false && casing.error).toContain('Did you mean "TreeMap"');
    });

    it("names an expected key when it has nothing to suggest", () => {
        const result = resolveChartType("Bar", "totally-unrelated");
        expect(result.ok === false && result.error).toContain('e.g. "Bar"');
    });
});
