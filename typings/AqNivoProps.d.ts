/**
 * This file was generated from AqNivo.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { DynamicValue, EditableValue, ListAttributeValue, ListValue } from "mendix";
import { Big } from "big.js";
import { CSSProperties } from "react";

export type DataModeEnum = "json" | "datasource";

export interface DataColumnsType {
    columnAttribute?: ListAttributeValue<string | boolean | Date | Big>;
    outputKey: string;
}

export type ChartTypeEnum =
    | "AreaBump"
    | "Bar"
    | "Bullet"
    | "Bump"
    | "Calendar"
    | "Chord"
    | "Choropleth"
    | "CirclePacking"
    | "Funnel"
    | "GeoMap"
    | "HeatMap"
    | "Line"
    | "Marimekko"
    | "Network"
    | "Pie"
    | "Radar"
    | "RadialBar"
    | "Sankey"
    | "ScatterPlot"
    | "Stream"
    | "Sunburst"
    | "SwarmPlot"
    | "TimeRange"
    | "TreeMap"
    | "Voronoi"
    | "Waffle";

export type RendererEnum = "Svg" | "Canvas" | "Html";

export interface FunctionPropertiesType {
    propertyName: string;
    functionArguments: string;
    functionBody: string;
}

export type HeightModeEnum = "pixels" | "aspectRatio" | "fillParent";

export interface DataColumnsPreviewType {
    columnAttribute: string;
    outputKey: string;
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
    dataMode: DataModeEnum;
    chartDataJson?: EditableValue<string>;
    chartDataSource?: ListValue;
    dataColumns: DataColumnsType[];
    seriesAttribute?: ListAttributeValue<string | boolean | Date | Big>;
    chartType: ChartTypeEnum;
    chartTypeExpression?: DynamicValue<string>;
    renderer: RendererEnum;
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
    dataMode: DataModeEnum;
    chartDataJson: string;
    chartDataSource: {} | { caption: string } | { type: string } | null;
    dataColumns: DataColumnsPreviewType[];
    seriesAttribute: string;
    chartType: ChartTypeEnum;
    chartTypeExpression: string;
    renderer: RendererEnum;
    staticConfiguration: string;
    dynamicConfiguration: string;
    functionProperties: FunctionPropertiesPreviewType[];
    heightMode: HeightModeEnum;
    containerHeight: number | null;
    aspectRatio: number | null;
    emptyMessage: string;
    ariaLabel: string;
}
