import { ReactElement, createElement, Fragment } from "react";
import { AqNivoContainerProps } from "../typings/AqNivoProps";
import { NivoChartContainer } from "./components/NivoChartContainer";

import "./ui/AqNivo.css";

export function AqNivo({
    chartData,
    dynamicConfiguration,
    staticConfiguration,
    chartType,
    containerHeight,
    functionProperties
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

            console.debug("Dynamic Configuration", configuration);
            return configuration;
        }

        return {};
    };

    const getStaticConfiguration = (): any => {
        if (staticConfiguration && staticConfiguration !== "") {
            const configuration = JSON.parse(staticConfiguration);

            console.debug("Static Configuration", configuration);
            return configuration;
        }

        return {};
    };

    const getFunctionPropertyConfiguration = (): any => {
        if (functionProperties && functionProperties != null) {
            const functionPropertyConfiguration: any = {};
            functionProperties.forEach(prop => {
                try {
                    // eslint-disable-next-line no-new-func
                    functionPropertyConfiguration[prop.propertyName] = new Function(
                        prop.functionArguments,
                        prop.functionBody
                    );
                } catch (e) {
                    console.error(`Failed to parse function for property ${prop.propertyName}`);
                }
            });

            console.debug("Function Property Configuration", functionPropertyConfiguration);
            return functionPropertyConfiguration;
        }

        return {};
    };

    const getConfiguration = (): any => {
        const configuration = {
            ...getStaticConfiguration(),
            ...getDynamicConfiguration(),
            ...getFunctionPropertyConfiguration()
        };
        console.debug("Combined Configuration", configuration);
        return configuration;
    };

    const isReady = dynamicConfiguration.status === "available" && chartData.status === "available";

    return (
        <Fragment>
            {isReady ? (
                <NivoChartContainer
                    chartType={chartType}
                    data={getData()}
                    configuration={getConfiguration()}
                    containerHeight={containerHeight}
                />
            ) : (
                <div className="widget-not-ready"></div>
            )}
        </Fragment>
    );
}
