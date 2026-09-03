import { resolveChartType } from "./resolveChartType";

describe("resolveChartType", () => {
    it("uses the design-time chart type when no expression value is supplied", () => {
        expect(resolveChartType("ResponsiveBar", undefined)).toEqual({ ok: true, chartType: "ResponsiveBar" });
        expect(resolveChartType("ResponsiveBar", "")).toEqual({ ok: true, chartType: "ResponsiveBar" });
        expect(resolveChartType("ResponsiveBar", "   ")).toEqual({ ok: true, chartType: "ResponsiveBar" });
    });

    it("lets a recognised expression value override the design-time chart type", () => {
        expect(resolveChartType("ResponsiveBar", "ResponsiveSankey")).toEqual({
            ok: true,
            chartType: "ResponsiveSankey"
        });
    });

    it("tolerates surrounding whitespace, which an expression concatenation easily introduces", () => {
        expect(resolveChartType("ResponsiveBar", "  ResponsivePie  ")).toEqual({
            ok: true,
            chartType: "ResponsivePie"
        });
    });

    /*
     * The important behaviour. Falling back silently would draw a chart of the wrong type against
     * data shaped for a different one — which tends to produce something plausible-looking and wrong,
     * and hides the typo indefinitely.
     */
    it("fails rather than falling back when the value is not a chart type", () => {
        const result = resolveChartType("ResponsiveBar", "Doughnut");
        expect(result.ok).toBe(false);
        expect(result.ok === false && result.error).toContain('"Doughnut" is not a chart type key');
    });

    it("suggests the right key for the mistakes people actually make", () => {
        // A display label rather than a key.
        const label = resolveChartType("ResponsiveBar", "Scatter Plot");
        expect(label.ok === false && label.error).toContain('Did you mean "ResponsiveScatterPlot"');

        // The Nivo package name rather than the key.
        const bare = resolveChartType("ResponsiveBar", "sankey");
        expect(bare.ok === false && bare.error).toContain('Did you mean "ResponsiveSankey"');

        // Right key, wrong case.
        const casing = resolveChartType("ResponsiveBar", "responsivetreemap");
        expect(casing.ok === false && casing.error).toContain('Did you mean "ResponsiveTreeMap"');
    });

    it("names an expected key when it has nothing to suggest", () => {
        const result = resolveChartType("ResponsiveBar", "totally-unrelated");
        expect(result.ok === false && result.error).toContain('e.g. "ResponsiveBar"');
    });
});
