import { CHART_RENDERER_SUPPORT, CHART_TYPES, RENDERER_MODES, isRendererMode, supportsRenderer } from "./chartTypes";

/*
 * `CHART_RENDERER_SUPPORT` is a table read out of the installed @nivo type declarations by hand. A
 * table like that drifts silently — a Nivo upgrade adds a Canvas variant, nobody notices, and the
 * widget goes on warning that a renderer does not exist when it does.
 *
 * These tests cannot detect that (only re-deriving from the typings can), so they guard the things
 * they CAN: that the table is complete, that SVG is universal, and that the counts still match what
 * was actually verified at 0.99.0. If a Nivo upgrade changes a count, the failure says so explicitly
 * rather than leaving someone to wonder whether the number was ever right.
 */
describe("renderer support", () => {
    it("covers every chart type", () => {
        for (const chartType of CHART_TYPES) {
            expect(CHART_RENDERER_SUPPORT[chartType]).toBeDefined();
            expect(CHART_RENDERER_SUPPORT[chartType].length).toBeGreaterThan(0);
        }
    });

    it("declares SVG for every chart type, because that is the fallback", () => {
        for (const chartType of CHART_TYPES) {
            expect(supportsRenderer(chartType, "Svg")).toBe(true);
        }
    });

    it("uses only declared renderer modes", () => {
        for (const chartType of CHART_TYPES) {
            for (const mode of CHART_RENDERER_SUPPORT[chartType]) {
                expect(isRendererMode(mode)).toBe(true);
            }
        }
    });

    /*
     * The counts verified against @nivo 0.99.0: 14 Canvas variants and 3 HTML ones. Pinning them is
     * what turns a silent drift into a failing test on the next Nivo upgrade.
     */
    it("matches the variant counts verified at @nivo 0.99.0", () => {
        const withCanvas = CHART_TYPES.filter(t => supportsRenderer(t, "Canvas"));
        const withHtml = CHART_TYPES.filter(t => supportsRenderer(t, "Html"));

        expect(withCanvas).toHaveLength(14);
        expect(withHtml).toEqual(["CirclePacking", "TreeMap", "Waffle"]);
    });

    it("recognises exactly the three renderer modes", () => {
        expect([...RENDERER_MODES]).toEqual(["Svg", "Canvas", "Html"]);
        expect(isRendererMode("Canvas")).toBe(true);
        expect(isRendererMode("canvas")).toBe(false);
        expect(isRendererMode("WebGL")).toBe(false);
    });
});
