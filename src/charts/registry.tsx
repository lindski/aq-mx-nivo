import { ReactElement } from "react";
import { ResponsiveAreaBump, ResponsiveBump } from "@nivo/bump";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsiveBullet } from "@nivo/bullet";
import { ResponsiveCalendar, ResponsiveTimeRange } from "@nivo/calendar";
import { ResponsiveChord } from "@nivo/chord";
import { ResponsiveCirclePacking } from "@nivo/circle-packing";
import { ResponsiveChoropleth, ResponsiveGeoMap } from "@nivo/geo";
import { ResponsiveFunnel } from "@nivo/funnel";
import { ResponsiveHeatMap } from "@nivo/heatmap";
import { ResponsiveLine } from "@nivo/line";
import { ResponsiveMarimekko } from "@nivo/marimekko";
import { ResponsiveNetwork } from "@nivo/network";
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveRadar } from "@nivo/radar";
import { ResponsiveRadialBar } from "@nivo/radial-bar";
import { ResponsiveSankey } from "@nivo/sankey";
import { ResponsiveScatterPlot } from "@nivo/scatterplot";
import { ResponsiveStream } from "@nivo/stream";
import { ResponsiveSunburst } from "@nivo/sunburst";
import { ResponsiveSwarmPlot } from "@nivo/swarmplot";
import { ResponsiveTreeMap } from "@nivo/treemap";
import { ResponsiveVoronoi } from "@nivo/voronoi";
import { ResponsiveWaffle } from "@nivo/waffle";

import { ChartType } from "./chartTypes";

/**
 * Chart type -> renderer.
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
 * `any` is unavoidable at this boundary and is confined to it. The 26 Nivo components have mutually
 * incompatible prop types, and the whole premise of this widget is one configuration payload spread
 * across whichever is selected. Everything outside this file is typed.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
type Renderer = (data: any, configuration: Record<string, unknown>) => ReactElement;

const RENDERERS: Record<ChartType, Renderer> = {
    ResponsiveAreaBump: (data, c) => <ResponsiveAreaBump data={data} {...(c as any)} />,
    ResponsiveBar: (data, c) => <ResponsiveBar data={data} {...(c as any)} />,
    ResponsiveBullet: (data, c) => <ResponsiveBullet data={data} {...(c as any)} />,
    ResponsiveBump: (data, c) => <ResponsiveBump data={data} {...(c as any)} />,
    ResponsiveCalendar: (data, c) => <ResponsiveCalendar data={data} {...(c as any)} />,
    ResponsiveChord: (data, c) => <ResponsiveChord data={data} {...(c as any)} />,
    ResponsiveChoropleth: (data, c) => <ResponsiveChoropleth data={data} {...(c as any)} />,
    ResponsiveCirclePacking: (data, c) => <ResponsiveCirclePacking data={data} {...(c as any)} />,
    ResponsiveFunnel: (data, c) => <ResponsiveFunnel data={data} {...(c as any)} />,
    ResponsiveGeoMap: (_data, c) => <ResponsiveGeoMap {...(c as any)} />,
    ResponsiveHeatMap: (data, c) => <ResponsiveHeatMap data={data} {...(c as any)} />,
    ResponsiveLine: (data, c) => <ResponsiveLine data={data} {...(c as any)} />,
    ResponsiveMarimekko: (data, c) => <ResponsiveMarimekko data={data} {...(c as any)} />,
    ResponsiveNetwork: (data, c) => <ResponsiveNetwork data={data} {...(c as any)} />,
    ResponsivePie: (data, c) => <ResponsivePie data={data} {...(c as any)} />,
    ResponsiveRadar: (data, c) => <ResponsiveRadar data={data} {...(c as any)} />,
    ResponsiveRadialBar: (data, c) => <ResponsiveRadialBar data={data} {...(c as any)} />,
    ResponsiveSankey: (data, c) => <ResponsiveSankey data={data} {...(c as any)} />,
    ResponsiveScatterPlot: (data, c) => <ResponsiveScatterPlot data={data} {...(c as any)} />,
    ResponsiveStream: (data, c) => <ResponsiveStream data={data} {...(c as any)} />,
    ResponsiveSunburst: (data, c) => <ResponsiveSunburst data={data} {...(c as any)} />,
    ResponsiveSwarmPlot: (data, c) => <ResponsiveSwarmPlot data={data} {...(c as any)} />,
    ResponsiveTimeRange: (data, c) => <ResponsiveTimeRange data={data} {...(c as any)} />,
    ResponsiveTreeMap: (data, c) => <ResponsiveTreeMap data={data} {...(c as any)} />,
    ResponsiveVoronoi: (data, c) => <ResponsiveVoronoi data={data} {...(c as any)} />,
    ResponsiveWaffle: (data, c) => <ResponsiveWaffle data={data} {...(c as any)} />
};
/* eslint-enable @typescript-eslint/no-explicit-any */

export function renderChart(chartType: ChartType, data: unknown, configuration: Record<string, unknown>): ReactElement {
    return RENDERERS[chartType](data, configuration);
}
