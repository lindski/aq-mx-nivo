import { withNivoDefects } from "./nivoDefects";

/*
 * The Nivo defect workarounds.
 *
 * Each of these pins a decision that would otherwise be invisible: a prop the widget supplies which
 * the modeller did not write. The tests are as much about the NEGATIVE cases — every combination
 * where nothing must be added — because an over-eager workaround silently takes a property away
 * from the person configuring the chart.
 */
describe("withNivoDefects — GeoMapCanvas.layers", () => {
    /*
     * `GeoMap.js` defaults `layers`; `GeoMapCanvas.js` destructures it bare and calls
     * `layers.forEach`. Without this the Canvas renderer throws for every consumer.
     */
    it("supplies the layers GeoMapCanvas fails to default", () => {
        expect(withNivoDefects("GeoMap", "Canvas", { features: [] })).toEqual({
            features: [],
            layers: ["graticule", "features"]
        });
    });

    it("never overrides a layers the configuration set", () => {
        const configuration = { features: [], layers: ["features"] };

        expect(withNivoDefects("GeoMap", "Canvas", configuration)).toBe(configuration);
    });

    /*
     * An explicit empty array is a real choice — "draw the projection and nothing on it" — and must
     * survive. Only `undefined` means "not set".
     */
    it("respects an explicitly empty layers", () => {
        const configuration = { layers: [] };

        expect(withNivoDefects("GeoMap", "Canvas", configuration)).toBe(configuration);
    });

    it("leaves the SVG renderer alone, which defaults layers itself", () => {
        const configuration = { features: [] };

        expect(withNivoDefects("GeoMap", "Svg", configuration)).toBe(configuration);
    });

    /*
     * Choropleth shares the `@nivo/geo` package and its own Canvas variant DOES default `layers`.
     * Adding one there would be inventing behaviour rather than restoring it.
     */
    it("leaves every other chart type alone, Choropleth Canvas included", () => {
        const configuration = { features: [] };

        expect(withNivoDefects("Choropleth", "Canvas", configuration)).toBe(configuration);
        expect(withNivoDefects("Bar", "Canvas", configuration)).toBe(configuration);
        expect(withNivoDefects("TreeMap", "Html", configuration)).toBe(configuration);
    });

    it("does not mutate the configuration it is given", () => {
        const configuration: Record<string, unknown> = { features: [] };
        withNivoDefects("GeoMap", "Canvas", configuration);

        expect(configuration).toEqual({ features: [] });
    });
});
