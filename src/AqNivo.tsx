import { ReactElement, createElement, Fragment } from "react";
import { AqNivoContainerProps } from "../typings/AqNivoProps";
import { NivoChartContainer } from "./components/NivoChartContainer";

import "./ui/AqNivo.css";

export function AqNivo({
    chartData,
    dynamicConfiguration,
    staticConfiguration,
    chartType,
    containerHeight
}: AqNivoContainerProps): ReactElement {
    const getData = (): any => {
        if (chartData.value && chartData.value !== "") {
            const data = JSON.parse(chartData.value);
            console.debug("chartData", data);
            return data;
        }

        console.debug("chartData", []);
        return [];
    };

    const getDynamicConfiguration = (): any => {
        if (dynamicConfiguration.value && dynamicConfiguration.value !== "") {
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

    const isReady = dynamicConfiguration.status === "available" && chartData.status === "available";

    return (
        <Fragment>
            {isReady ? (
                <NivoChartContainer
                    chartType={chartType}
                    data={getData()}
                    configuration={{ ...getStaticConfiguration(), ...getDynamicConfiguration() }}
                    containerHeight={containerHeight}
                />
            ) : (
                <div className="widget-not-ready"></div>
            )}
        </Fragment>
    );
}
