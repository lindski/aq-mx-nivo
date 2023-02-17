import { ReactElement, createElement } from "react";
import { ChartTypeEnum } from "../../typings/AqNivoProps";
import { ResponsiveRadialBar } from "@nivo/radial-bar";
import { ResponsiveAreaBump } from "@nivo/bump";
import { ResponsiveChord } from "@nivo/chord";
import { ResponsiveRadar } from "@nivo/radar";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsiveLine } from "@nivo/line";
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveCirclePacking } from "@nivo/circle-packing";
import { ResponsiveStream } from "@nivo/stream";
import { ResponsiveCalendar } from "@nivo/calendar";

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
        ResponsiveChord: <ResponsiveChord data={data} {...configuration} />,
        ResponsiveLine: <ResponsiveLine data={data} {...configuration} />,
        ResponsiveCirclePacking: <ResponsiveCirclePacking data={data} {...configuration} />,
        ResponsiveAreaBump: <ResponsiveAreaBump data={data} {...configuration} />,
        ResponsiveBar: <ResponsiveBar data={data} {...configuration} />,
        ResponsiveStream: <ResponsiveStream data={data} {...configuration} />,
        ResponsivePie: <ResponsivePie data={data} {...configuration} />,
        ResponsiveCalendar: <ResponsiveCalendar data={data} {...configuration} />,
        ResponsiveRadar: <ResponsiveRadar data={data} {...configuration} />,
        ResponsiveRadialBar: <ResponsiveRadialBar data={data} {...configuration} />
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
