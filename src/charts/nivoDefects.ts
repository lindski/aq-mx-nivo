import { ChartType, RendererMode } from "./chartTypes";

/**
 * Supply what Nivo forgot to default.
 *
 * This is the one place the widget puts a value into the configuration that the modeller did not
 * write, and it earns the exception by being a *restoration* rather than an opinion: every entry
 * here is a prop the equivalent Nivo component already defaults, absent from one sibling by
 * oversight. Nothing here invents behaviour, and anything the configuration sets wins.
 *
 * **`GeoMapCanvas.layers`.** `GeoMap.js` defaults `layers` to `["graticule", "features"]`;
 * `GeoMapCanvas.js` destructures it bare and then calls `layers.forEach`, so a Geo Map drawn on
 * Canvas throws `Cannot read properties of undefined (reading 'forEach')` unless the configuration
 * happens to carry `layers`. Verified 2026-09-08 by reading both original sources out of
 * `@nivo/geo`'s sourcemap and by watching the Canvas tab crash and then draw. Every consumer would
 * hit it, and nothing would tell them why.
 *
 * Keep this list short and keep the evidence attached. On a Nivo upgrade, re-check each entry and
 * delete the ones upstream has fixed — a defect worked around after it is repaired is just a value
 * the modeller can no longer control.
 */
export function withNivoDefects(
    chartType: ChartType,
    renderer: RendererMode,
    configuration: Record<string, unknown>
): Record<string, unknown> {
    if (chartType === "GeoMap" && renderer === "Canvas" && configuration.layers === undefined) {
        return { ...configuration, layers: ["graticule", "features"] };
    }

    return configuration;
}
