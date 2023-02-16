import { ReactElement, createElement } from "react";
import { AqNivoContainerProps, ChartTypeEnum } from "../typings/AqNivoProps";
import { ResponsiveRadialBar } from "@nivo/radial-bar";
import { ResponsiveAreaBump } from "@nivo/bump";
import { ResponsiveChord } from "@nivo/chord";
import { ResponsiveRadar } from "@nivo/radar";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsiveLine } from "@nivo/line";

import "./ui/AqNivo.css";

export function AqNivo({
    chartData,
    dynamicConfiguration,
    staticConfiguration,
    chartType,
    containerHeight
}: AqNivoContainerProps): ReactElement {
    const getData = (): any => {
        if (chartData.status === "available" && chartData.value && chartData.value !== "") {
            const data = JSON.parse(chartData.value);
            console.debug("chartData", data);
            return data;
        }

        console.debug("chartData", []);
        return [];
    };

    const getDynamicConfiguration = (): any => {
        if (
            dynamicConfiguration &&
            dynamicConfiguration.status === "available" &&
            dynamicConfiguration.value &&
            dynamicConfiguration.value !== ""
        ) {
            const configuration = JSON.parse(dynamicConfiguration.value);

            console.debug("chartConfiguration", configuration);
            return configuration;
        }

        return {};
    };

    const getStaticConfiguration = (): any => {
        if (staticConfiguration && staticConfiguration !== "") {
            const configuration = JSON.parse(staticConfiguration);

            console.debug("staticConfiguration", configuration);
            return configuration;
        }

        return {};
    };

    const loadComponent = (chartType: ChartTypeEnum) => {
        switch (chartType) {
            case "ResponsiveRadialBar":
                return (
                    <ResponsiveRadialBar
                        data={getData()}
                        {...getDynamicConfiguration()}
                        {...getStaticConfiguration()}
                    />
                );
            case "ResponsiveAreaBump":
                return (
                    <ResponsiveAreaBump data={getData()} {...getDynamicConfiguration()} {...getStaticConfiguration()} />
                );
            case "ResponsiveChord":
                return (
                    <ResponsiveChord data={getData()} {...getDynamicConfiguration()} {...getStaticConfiguration()} />
                );
            case "ResponsiveLine":
                return <ResponsiveLine data={getData()} {...getDynamicConfiguration()} {...getStaticConfiguration()} />;
            case "ResponsiveBar":
                return <ResponsiveBar data={getData()} {...getDynamicConfiguration()} {...getStaticConfiguration()} />;
            case "ResponsiveRadar":
                return (
                    <ResponsiveRadar data={getData()} {...getDynamicConfiguration()} {...getStaticConfiguration()} />
                );
            default:
                return <div></div>;
        }
    };

    return (
        <div className="chart-container" style={{ height: containerHeight }}>
            {loadComponent(chartType)}
        </div>
    );
}
