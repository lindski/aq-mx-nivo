import { ReactElement, createElement } from "react";
import { ChartTypeEnum } from "../../typings/AqNivoProps";
import { ResponsiveRadialBar } from "@nivo/radial-bar";
import { ResponsiveAreaBump, ResponsiveBump } from "@nivo/bump";
import { ResponsiveChord } from "@nivo/chord";
import { ResponsiveRadar } from "@nivo/radar";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsiveLine } from "@nivo/line";
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveCirclePacking } from "@nivo/circle-packing";
import { ResponsiveStream } from "@nivo/stream";
import { ResponsiveCalendar, ResponsiveTimeRange } from "@nivo/calendar";
import { ResponsiveScatterPlot } from "@nivo/scatterplot";
import { ResponsiveWaffle } from "@nivo/waffle";
import { ResponsiveTreeMap } from "@nivo/treemap";
import { ResponsiveBullet } from "@nivo/bullet";
import { ResponsiveGeoMap, ResponsiveChoropleth } from "@nivo/geo";
import { ResponsiveHeatMap } from "@nivo/heatmap";
import { ResponsiveMarimekko } from "@nivo/marimekko";
import { ResponsiveNetwork } from "@nivo/network";
import { ResponsiveSwarmPlot } from "@nivo/swarmplot";
import { ResponsiveSunburst } from "@nivo/sunburst";
import { ResponsiveVoronoi } from "@nivo/voronoi";
import { ResponsiveSankey } from "@nivo/sankey";
import { ResponsiveFunnel } from "@nivo/funnel";

interface NivoChartContainerProps {
    data: any;
    configuration: any;
    chartType: ChartTypeEnum;
    containerHeight: number;
}
export function NivoChartContainer({
    data,
    configuration,
    chartType,
    containerHeight
}: NivoChartContainerProps): ReactElement {
    const CHART_TYPES: any = {
        ResponsiveAreaBump: <ResponsiveAreaBump data={data} {...configuration} />,
        ResponsiveBar: <ResponsiveBar data={data} {...configuration} />,
        ResponsiveBullet: <ResponsiveBullet data={data} {...configuration} />,
        ResponsiveBump: <ResponsiveBump data={data} {...configuration} />,
        ResponsiveCalendar: <ResponsiveCalendar data={data} {...configuration} />,
        ResponsiveChord: <ResponsiveChord data={data} {...configuration} />,
        ResponsiveChoropleth: <ResponsiveChoropleth data={data} {...configuration} />,
        ResponsiveCirclePacking: <ResponsiveCirclePacking data={data} {...configuration} />,
        ResponsiveFunnel: <ResponsiveFunnel data={data} {...configuration} />,
        ResponsiveGeoMap: <ResponsiveGeoMap data={data} {...configuration} />,
        ResponsiveHeatMap: <ResponsiveHeatMap data={data} {...configuration} />,
        ResponsiveLine: <ResponsiveLine data={data} {...configuration} />,
        ResponsiveMarimekko: <ResponsiveMarimekko data={data} {...configuration} />,
        ResponsiveNetwork: <ResponsiveNetwork data={data} {...configuration} />,
        ResponsivePie: <ResponsivePie data={data} {...configuration} />,
        ResponsiveRadar: <ResponsiveRadar data={data} {...configuration} />,
        ResponsiveRadialBar: <ResponsiveRadialBar data={data} {...configuration} />,
        ResponsiveSankey: <ResponsiveSankey data={data} {...configuration} />,
        ResponsiveScatterPlot: <ResponsiveScatterPlot data={data} {...configuration} />,
        ResponsiveStream: <ResponsiveStream data={data} {...configuration} />,
        ResponsiveSunburst: <ResponsiveSunburst data={data} {...configuration} />,
        ResponsiveSwarmPlot: <ResponsiveSwarmPlot data={data} {...configuration} />,
        ResponsiveTimeRange: <ResponsiveTimeRange data={data} {...configuration} />,
        ResponsiveTreeMap: <ResponsiveTreeMap data={data} {...configuration} />,
        ResponsiveVoronoi: <ResponsiveVoronoi data={data} {...configuration} />,
        ResponsiveWaffle: <ResponsiveWaffle data={data} {...configuration} />
    };

    const getChart = () => {
        const chart = CHART_TYPES[chartType];
        if (chart) {
            return chart;
        }

        return <div className="chart-not-found"></div>;
    };

    return (
        <div className="chart-container" style={{ height: containerHeight }}>
            {getChart()}
        </div>
    );
}
