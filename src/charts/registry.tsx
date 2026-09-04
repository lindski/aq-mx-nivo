import { ComponentType, LazyExoticComponent, ReactElement, createElement, lazy } from "react";

import { CHART_DATA_SHAPE, ChartType, RendererMode, supportsRenderer } from "./chartTypes";

/**
 * (Chart type, rendering technology) -> a loader for the Nivo component that draws it.
 *
 * ## Why these are loaders and not imports (B-01)
 *
 * A page draws ONE chart. Until 2.0 this file imported all 24 `@nivo` packages statically, so every
 * page carrying any chart paid for all of them — a 4.7 MB bundle to render a bar chart. The loaders
 * below are dynamic imports, so Rollup emits one chunk per package and the browser fetches only the
 * one the page actually needs.
 *
 * This is the case the code-splitting pattern is for, and the test it sets: split what most pages do
 * not need, never what the widget always loads. Twenty-five of the twenty-six are never needed on any
 * given page.
 *
 * **This file is still the only place that should know the word "Responsive".** Everywhere else a
 * chart is a base type plus a rendering technology; the Nivo component name is assembled here and
 * nowhere else.
 *
 * `any` is unavoidable at this boundary and is confined to it. The Nivo components have mutually
 * incompatible prop types, and the whole premise of this widget is one configuration payload spread
 * across whichever is selected. Everything outside this file is typed.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
type ChartComponent = ComponentType<any>;
type Loader = () => Promise<ChartComponent>;

const LOADERS: Record<ChartType, Partial<Record<RendererMode, Loader>>> = {
    AreaBump: { Svg: () => import("@nivo/bump").then(m => m.ResponsiveAreaBump) },
    Bar: {
        Svg: () => import("@nivo/bar").then(m => m.ResponsiveBar),
        Canvas: () => import("@nivo/bar").then(m => m.ResponsiveBarCanvas)
    },
    Bullet: { Svg: () => import("@nivo/bullet").then(m => m.ResponsiveBullet) },
    Bump: { Svg: () => import("@nivo/bump").then(m => m.ResponsiveBump) },
    Calendar: {
        Svg: () => import("@nivo/calendar").then(m => m.ResponsiveCalendar),
        Canvas: () => import("@nivo/calendar").then(m => m.ResponsiveCalendarCanvas)
    },
    Chord: {
        Svg: () => import("@nivo/chord").then(m => m.ResponsiveChord),
        Canvas: () => import("@nivo/chord").then(m => m.ResponsiveChordCanvas)
    },
    Choropleth: {
        Svg: () => import("@nivo/geo").then(m => m.ResponsiveChoropleth),
        Canvas: () => import("@nivo/geo").then(m => m.ResponsiveChoroplethCanvas)
    },
    CirclePacking: {
        Svg: () => import("@nivo/circle-packing").then(m => m.ResponsiveCirclePacking),
        Canvas: () => import("@nivo/circle-packing").then(m => m.ResponsiveCirclePackingCanvas),
        Html: () => import("@nivo/circle-packing").then(m => m.ResponsiveCirclePackingHtml)
    },
    Funnel: { Svg: () => import("@nivo/funnel").then(m => m.ResponsiveFunnel) },
    GeoMap: {
        Svg: () => import("@nivo/geo").then(m => m.ResponsiveGeoMap),
        Canvas: () => import("@nivo/geo").then(m => m.ResponsiveGeoMapCanvas)
    },
    HeatMap: {
        Svg: () => import("@nivo/heatmap").then(m => m.ResponsiveHeatMap),
        Canvas: () => import("@nivo/heatmap").then(m => m.ResponsiveHeatMapCanvas)
    },
    Line: {
        Svg: () => import("@nivo/line").then(m => m.ResponsiveLine),
        Canvas: () => import("@nivo/line").then(m => m.ResponsiveLineCanvas)
    },
    Marimekko: { Svg: () => import("@nivo/marimekko").then(m => m.ResponsiveMarimekko) },
    Network: {
        Svg: () => import("@nivo/network").then(m => m.ResponsiveNetwork),
        Canvas: () => import("@nivo/network").then(m => m.ResponsiveNetworkCanvas)
    },
    Pie: {
        Svg: () => import("@nivo/pie").then(m => m.ResponsivePie),
        Canvas: () => import("@nivo/pie").then(m => m.ResponsivePieCanvas)
    },
    Radar: { Svg: () => import("@nivo/radar").then(m => m.ResponsiveRadar) },
    RadialBar: { Svg: () => import("@nivo/radial-bar").then(m => m.ResponsiveRadialBar) },
    Sankey: { Svg: () => import("@nivo/sankey").then(m => m.ResponsiveSankey) },
    ScatterPlot: {
        Svg: () => import("@nivo/scatterplot").then(m => m.ResponsiveScatterPlot),
        Canvas: () => import("@nivo/scatterplot").then(m => m.ResponsiveScatterPlotCanvas)
    },
    Stream: { Svg: () => import("@nivo/stream").then(m => m.ResponsiveStream) },
    Sunburst: { Svg: () => import("@nivo/sunburst").then(m => m.ResponsiveSunburst) },
    SwarmPlot: {
        Svg: () => import("@nivo/swarmplot").then(m => m.ResponsiveSwarmPlot),
        Canvas: () => import("@nivo/swarmplot").then(m => m.ResponsiveSwarmPlotCanvas)
    },
    TimeRange: { Svg: () => import("@nivo/calendar").then(m => m.ResponsiveTimeRange) },
    TreeMap: {
        Svg: () => import("@nivo/treemap").then(m => m.ResponsiveTreeMap),
        Canvas: () => import("@nivo/treemap").then(m => m.ResponsiveTreeMapCanvas),
        Html: () => import("@nivo/treemap").then(m => m.ResponsiveTreeMapHtml)
    },
    Voronoi: { Svg: () => import("@nivo/voronoi").then(m => m.ResponsiveVoronoi) },
    Waffle: {
        Svg: () => import("@nivo/waffle").then(m => m.ResponsiveWaffle),
        Canvas: () => import("@nivo/waffle").then(m => m.ResponsiveWaffleCanvas),
        Html: () => import("@nivo/waffle").then(m => m.ResponsiveWaffleHtml)
    }
};

/**
 * Lazy components, cached by (chart type, renderer).
 *
 * **The cache is load-bearing, not an optimisation.** `lazy()` returns a new component type on every
 * call, and React remounts when the component TYPE changes — so building one per render would tear
 * the chart down and rebuild it on every render, losing every transition and re-fetching the chunk.
 * Keyed and cached, the type is stable for the life of the page.
 */
const COMPONENTS = new Map<string, LazyExoticComponent<ChartComponent>>();

function componentFor(chartType: ChartType, renderer: RendererMode): LazyExoticComponent<ChartComponent> {
    const key = `${chartType}:${renderer}`;
    const cached = COMPONENTS.get(key);
    if (cached) {
        return cached;
    }

    const loader = LOADERS[chartType][renderer] ?? (LOADERS[chartType].Svg as Loader);
    const component = lazy(() => loader().then(resolved => ({ default: resolved })));
    COMPONENTS.set(key, component);

    return component;
}

/**
 * Draw the chart, falling back to SVG when the requested technology does not exist for this type.
 *
 * The fallback is deliberate and is NOT the same judgement as the one made for an unrecognised chart
 * type, which is an error. Rendering a Funnel as SVG when Canvas was asked for shows the viewer the
 * chart they asked for, drawn a different way — nothing is misrepresented. Rendering a Pie when a
 * Sankey was asked for shows them something plausible and wrong. Only the second is worth refusing
 * to draw over.
 *
 * **The returned element suspends** while its chunk loads, so the caller must render it inside a
 * `<Suspense>` boundary.
 */
export function renderChart(
    chartType: ChartType,
    renderer: RendererMode,
    data: unknown,
    configuration: Record<string, unknown>
): ReactElement {
    const effective = supportsRenderer(chartType, renderer) ? renderer : "Svg";
    const Chart = componentFor(chartType, effective);

    /*
     * Geo Map has no meaningful `data` prop — its geography arrives through `features` in the
     * configuration. `CHART_DATA_SHAPE` already records which types those are, so the decision is
     * read from there rather than special-cased here; one fewer place to update when Nivo adds
     * another features-only chart.
     */
    const takesBoundData = CHART_DATA_SHAPE[chartType] !== "features";

    return takesBoundData
        ? createElement(Chart, { data, ...configuration })
        : createElement(Chart, { ...configuration });
}
/* eslint-enable @typescript-eslint/no-explicit-any */
