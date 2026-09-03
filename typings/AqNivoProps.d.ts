/**
 * This file was generated from AqNivo.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { DynamicValue, EditableValue } from "mendix";
import { Big } from "big.js";
import { CSSProperties } from "react";

export type ChartTypeEnum =
    | "ResponsiveAreaBump"
    | "ResponsiveBar"
    | "ResponsiveBullet"
    | "ResponsiveBump"
    | "ResponsiveCalendar"
    | "ResponsiveChord"
    | "ResponsiveChoropleth"
    | "ResponsiveCirclePacking"
    | "ResponsiveFunnel"
    | "ResponsiveGeoMap"
    | "ResponsiveHeatMap"
    | "ResponsiveLine"
    | "ResponsiveMarimekko"
    | "ResponsiveNetwork"
    | "ResponsivePie"
    | "ResponsiveRadar"
    | "ResponsiveRadialBar"
    | "ResponsiveSankey"
    | "ResponsiveScatterPlot"
    | "ResponsiveStream"
    | "ResponsiveSunburst"
    | "ResponsiveSwarmPlot"
    | "ResponsiveTimeRange"
    | "ResponsiveTreeMap"
    | "ResponsiveVoronoi"
    | "ResponsiveWaffle";

export interface FunctionPropertiesType {
    propertyName: string;
    functionArguments: string;
    functionBody: string;
}

export type HeightModeEnum = "pixels" | "aspectRatio" | "fillParent";

export interface FunctionPropertiesPreviewType {
    propertyName: string;
    functionArguments: string;
    functionBody: string;
}

export interface AqNivoContainerProps {
    name: string;
    class: string;
    style?: CSSProperties;
    tabIndex?: number;
    chartDataJson: EditableValue<string>;
    chartType: ChartTypeEnum;
    staticConfiguration: string;
    dynamicConfiguration?: EditableValue<string>;
    functionProperties: FunctionPropertiesType[];
    heightMode: HeightModeEnum;
    containerHeight: number;
    aspectRatio: Big;
    emptyMessage?: DynamicValue<string>;
    ariaLabel?: DynamicValue<string>;
}

export interface AqNivoPreviewProps {
    /**
     * @deprecated Deprecated since version 9.18.0. Please use class property instead.
     */
    className: string;
    class: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    renderMode: "design" | "xray" | "structure";
    translate: (text: string) => string;
    chartDataJson: string;
    chartType: ChartTypeEnum;
    staticConfiguration: string;
    dynamicConfiguration: string;
    functionProperties: FunctionPropertiesPreviewType[];
    heightMode: HeightModeEnum;
    containerHeight: number | null;
    aspectRatio: number | null;
    emptyMessage: string;
    ariaLabel: string;
}
