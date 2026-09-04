import { ReactElement } from "react";
import { ResponsiveAreaBump, ResponsiveBump } from "@nivo/bump";
import { ResponsiveBar, ResponsiveBarCanvas } from "@nivo/bar";
import { ResponsiveBullet } from "@nivo/bullet";
import { ResponsiveCalendar, ResponsiveCalendarCanvas, ResponsiveTimeRange } from "@nivo/calendar";
import { ResponsiveChord, ResponsiveChordCanvas } from "@nivo/chord";
import {
    ResponsiveCirclePacking,
    ResponsiveCirclePackingCanvas,
    ResponsiveCirclePackingHtml
} from "@nivo/circle-packing";
import { ResponsiveChoropleth, ResponsiveChoroplethCanvas, ResponsiveGeoMap, ResponsiveGeoMapCanvas } from "@nivo/geo";
import { ResponsiveFunnel } from "@nivo/funnel";
import { ResponsiveHeatMap, ResponsiveHeatMapCanvas } from "@nivo/heatmap";
import { ResponsiveLine, ResponsiveLineCanvas } from "@nivo/line";
import { ResponsiveMarimekko } from "@nivo/marimekko";
import { ResponsiveNetwork, ResponsiveNetworkCanvas } from "@nivo/network";
import { ResponsivePie, ResponsivePieCanvas } from "@nivo/pie";
import { ResponsiveRadar } from "@nivo/radar";
import { ResponsiveRadialBar } from "@nivo/radial-bar";
import { ResponsiveSankey } from "@nivo/sankey";
import { ResponsiveScatterPlot, ResponsiveScatterPlotCanvas } from "@nivo/scatterplot";
import { ResponsiveStream } from "@nivo/stream";
import { ResponsiveSunburst } from "@nivo/sunburst";
import { ResponsiveSwarmPlot, ResponsiveSwarmPlotCanvas } from "@nivo/swarmplot";
import { ResponsiveTreeMap, ResponsiveTreeMapCanvas, ResponsiveTreeMapHtml } from "@nivo/treemap";
import { ResponsiveVoronoi } from "@nivo/voronoi";
import { ResponsiveWaffle, ResponsiveWaffleCanvas, ResponsiveWaffleHtml } from "@nivo/waffle";

import { ChartType, RendererMode, supportsRenderer } from "./chartTypes";

/**
 * (Chart type, rendering technology) -> the function that draws it.
 *
 * The important detail is that these are **functions**, not elements. 1.x built an object literal
 * containing all 26 chart elements and then selected one from it, so every render constructed 26
 * React elements to throw 25 away (C-06). Here only the selected chart is ever constructed.
 *
 * This does NOT yet fix B-01. Every `@nivo` package is still statically imported above, so all of
 * them are still in the bundle. Making these lazy — `() => import("@nivo/bar")` behind a registry of
 * promises — is the code-splitting work, and it is a change to this file alone: the rest of the
 * widget already goes through `renderChart`. That is why the indirection is here now.
 *
 * **This file is the only place that should know the word "Responsive".** Everywhere else a chart is
 * a base type plus a rendering technology; the Nivo component name is assembled here and nowhere
 * else. That is what made the 2.0 split cheap, and keeping it that way is what makes the next Nivo
 * naming change cheap.
 *
 * `any` is unavoidable at this boundary and is confined to it. The Nivo components have mutually
 * incompatible prop types, and the whole premise of this widget is one configuration payload spread
 * across whichever is selected. Everything outside this file is typed.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
type RenderFn = (data: any, configuration: Record<string, unknown>) => ReactElement;

/**
 * Keyed by chart type, then by rendering technology. Every chart type has `Svg`; the Canvas and Html
 * entries exist only where Nivo actually ships one, and `CHART_RENDERER_SUPPORT` in `chartTypes.ts`
 * is the declaration of that same fact for the layers that must stay Nivo-free.
 *
 * The two tables are kept in step by `renderChart` asking `supportsRenderer` rather than probing
 * this object, so a disagreement surfaces as a fallback to SVG rather than as a crash.
 */
const CHART_RENDERERS: Record<ChartType, Partial<Record<RendererMode, RenderFn>>> = {
    AreaBump: { Svg: (data, c) => <ResponsiveAreaBump data={data} {...(c as any)} /> },
    Bar: {
        Svg: (data, c) => <ResponsiveBar data={data} {...(c as any)} />,
        Canvas: (data, c) => <ResponsiveBarCanvas data={data} {...(c as any)} />
    },
    Bullet: { Svg: (data, c) => <ResponsiveBullet data={data} {...(c as any)} /> },
    Bump: { Svg: (data, c) => <ResponsiveBump data={data} {...(c as any)} /> },
    Calendar: {
        Svg: (data, c) => <ResponsiveCalendar data={data} {...(c as any)} />,
        Canvas: (data, c) => <ResponsiveCalendarCanvas data={data} {...(c as any)} />
    },
    Chord: {
        Svg: (data, c) => <ResponsiveChord data={data} {...(c as any)} />,
        Canvas: (data, c) => <ResponsiveChordCanvas data={data} {...(c as any)} />
    },
    Choropleth: {
        Svg: (data, c) => <ResponsiveChoropleth data={data} {...(c as any)} />,
        Canvas: (data, c) => <ResponsiveChoroplethCanvas data={data} {...(c as any)} />
    },
    CirclePacking: {
        Svg: (data, c) => <ResponsiveCirclePacking data={data} {...(c as any)} />,
        Canvas: (data, c) => <ResponsiveCirclePackingCanvas data={data} {...(c as any)} />,
        Html: (data, c) => <ResponsiveCirclePackingHtml data={data} {...(c as any)} />
    },
    Funnel: { Svg: (data, c) => <ResponsiveFunnel data={data} {...(c as any)} /> },
    GeoMap: {
        Svg: (_data, c) => <ResponsiveGeoMap {...(c as any)} />,
        Canvas: (_data, c) => <ResponsiveGeoMapCanvas {...(c as any)} />
    },
    HeatMap: {
        Svg: (data, c) => <ResponsiveHeatMap data={data} {...(c as any)} />,
        Canvas: (data, c) => <ResponsiveHeatMapCanvas data={data} {...(c as any)} />
    },
    Line: {
        Svg: (data, c) => <ResponsiveLine data={data} {...(c as any)} />,
        Canvas: (data, c) => <ResponsiveLineCanvas data={data} {...(c as any)} />
    },
    Marimekko: { Svg: (data, c) => <ResponsiveMarimekko data={data} {...(c as any)} /> },
    Network: {
        Svg: (data, c) => <ResponsiveNetwork data={data} {...(c as any)} />,
        Canvas: (data, c) => <ResponsiveNetworkCanvas data={data} {...(c as any)} />
    },
    Pie: {
        Svg: (data, c) => <ResponsivePie data={data} {...(c as any)} />,
        Canvas: (data, c) => <ResponsivePieCanvas data={data} {...(c as any)} />
    },
    Radar: { Svg: (data, c) => <ResponsiveRadar data={data} {...(c as any)} /> },
    RadialBar: { Svg: (data, c) => <ResponsiveRadialBar data={data} {...(c as any)} /> },
    Sankey: { Svg: (data, c) => <ResponsiveSankey data={data} {...(c as any)} /> },
    ScatterPlot: {
        Svg: (data, c) => <ResponsiveScatterPlot data={data} {...(c as any)} />,
        Canvas: (data, c) => <ResponsiveScatterPlotCanvas data={data} {...(c as any)} />
    },
    Stream: { Svg: (data, c) => <ResponsiveStream data={data} {...(c as any)} /> },
    Sunburst: { Svg: (data, c) => <ResponsiveSunburst data={data} {...(c as any)} /> },
    SwarmPlot: {
        Svg: (data, c) => <ResponsiveSwarmPlot data={data} {...(c as any)} />,
        Canvas: (data, c) => <ResponsiveSwarmPlotCanvas data={data} {...(c as any)} />
    },
    TimeRange: { Svg: (data, c) => <ResponsiveTimeRange data={data} {...(c as any)} /> },
    TreeMap: {
        Svg: (data, c) => <ResponsiveTreeMap data={data} {...(c as any)} />,
        Canvas: (data, c) => <ResponsiveTreeMapCanvas data={data} {...(c as any)} />,
        Html: (data, c) => <ResponsiveTreeMapHtml data={data} {...(c as any)} />
    },
    Voronoi: { Svg: (data, c) => <ResponsiveVoronoi data={data} {...(c as any)} /> },
    Waffle: {
        Svg: (data, c) => <ResponsiveWaffle data={data} {...(c as any)} />,
        Canvas: (data, c) => <ResponsiveWaffleCanvas data={data} {...(c as any)} />,
        Html: (data, c) => <ResponsiveWaffleHtml data={data} {...(c as any)} />
    }
};
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Draw the chart, falling back to SVG when the requested technology does not exist for this type.
 *
 * The fallback is deliberate and is NOT the same judgement as the one made for an unrecognised chart
 * type, which is an error. Rendering a Funnel as SVG when Canvas was asked for shows the viewer the
 * chart they asked for, drawn a different way — nothing is misrepresented. Rendering a Pie when a
 * Sankey was asked for shows them something plausible and wrong. Only the second is worth refusing
 * to draw over.
 */
export function renderChart(
    chartType: ChartType,
    renderer: RendererMode,
    data: unknown,
    configuration: Record<string, unknown>
): ReactElement {
    const effective = supportsRenderer(chartType, renderer) ? renderer : "Svg";
    const render = CHART_RENDERERS[chartType][effective] ?? CHART_RENDERERS[chartType].Svg!;

    return render(data, configuration);
}
