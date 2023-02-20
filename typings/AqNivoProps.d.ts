/**
 * This file was generated from AqNivo.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { CSSProperties } from "react";
import { EditableValue } from "mendix";

export type ChartTypeEnum = "ResponsiveAreaBump" | "ResponsiveBar" | "ResponsiveBullet" | "ResponsiveBump" | "ResponsiveCalendar" | "ResponsiveChord" | "ResponsiveChoropleth" | "ResponsiveCirclePacking" | "ResponsiveFunnel" | "ResponsiveGeoMap" | "ResponsiveHeatMap" | "ResponsiveLine" | "ResponsiveMarimekko" | "ResponsiveNetwork" | "ResponsivePie" | "ResponsiveRadar" | "ResponsiveRadialBar" | "ResponsiveSankey" | "ResponsiveScatterPlot" | "ResponsiveStream" | "ResponsiveSunburst" | "ResponsiveSwarmPlot" | "ResponsiveTimeRange" | "ResponsiveTreeMap" | "ResponsiveVoronoi" | "ResponsiveWaffle";

export interface FunctionPropertiesType {
    propertyName: string;
    functionArguments: string;
    functionBody: string;
}

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
    chartType: ChartTypeEnum;
    chartData: EditableValue<string>;
    dynamicConfiguration: EditableValue<string>;
    staticConfiguration: string;
    functionProperties: FunctionPropertiesType[];
    containerHeight: number;
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
    chartType: ChartTypeEnum;
    chartData: string;
    dynamicConfiguration: string;
    staticConfiguration: string;
    functionProperties: FunctionPropertiesPreviewType[];
    containerHeight: number | null;
}
