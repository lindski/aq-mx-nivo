import { CSSProperties, Fragment, ReactElement, Suspense, useMemo } from "react";

import { renderChart } from "../charts/registry";
import { CHART_DATA_SHAPE, ChartType, RendererMode } from "../charts/chartTypes";
import { isEmptyData, parseChartData } from "../data/parseJson";
import { mergeCacheKey, mergeConfiguration } from "../config/merge";
import { FunctionPropertyDefinition } from "../config/functionProps";
import { ChartErrorBoundary } from "./ChartErrorBoundary";

/**
 * The chart, with no knowledge of Mendix.
 *
 * Everything here takes plain values, which is what lets the page-editor preview and the runtime
 * share one implementation, and what keeps `mendix` out of a bundle it has no business being in.
 * The Mendix glue — value status, editability, attribute reads — lives in `AqNivo.tsx` only.
 */

export type HeightMode = "pixels" | "aspectRatio" | "fillParent";

export interface NivoChartProps {
    chartType: ChartType;
    /**
     * How the chart is drawn. Unlike the chart type this has no runtime counterpart: it is a
     * performance decision about a known dataset, not something that should follow the data.
     *
     * A renderer the chart type does not have falls back to SVG inside `renderChart` — see
     * `registry.tsx` for why that fallback is right here and wrong for the chart type.
     */
    renderer: RendererMode;
    /**
     * Set when the dynamic chart type expression produced a value this widget does not recognise.
     * Passed in rather than resolved here, because resolution needs the Mendix value status and this
     * component is deliberately Mendix-free.
     */
    chartTypeError?: string;
    /** Raw JSON text, not a parsed object. Parsing here is what makes the memoisation work. */
    dataJson?: string;
    /**
     * Set when datasource mode could not project the rows — an unsupported chart type, no mapped
     * columns, or two columns writing the same key. Passed in rather than detected here, because
     * projection needs the Mendix ListValue and this component is deliberately Mendix-free.
     */
    dataError?: string;
    staticConfiguration?: string;
    dynamicConfiguration?: string;
    functionProperties?: readonly FunctionPropertyDefinition[];
    heightMode: HeightMode;
    heightPixels: number;
    aspectRatio: number;
    emptyMessage: string;
    ariaLabel?: string;
    className?: string;
    style?: CSSProperties;
    tabIndex?: number;
}

export function NivoChart(props: NivoChartProps): ReactElement {
    const {
        chartType,
        renderer,
        chartTypeError,
        dataJson,
        dataError,
        staticConfiguration,
        dynamicConfiguration,
        functionProperties,
        emptyMessage,
        ariaLabel,
        className,
        style,
        tabIndex
    } = props;

    /*
     * Memoised on the raw JSON string, not on the prop object.
     *
     * Mendix hands out new prop instances freely, so an identity-based dependency re-parses on every
     * render even when the text is byte-identical — and Nivo, seeing what it takes to be new props,
     * re-runs its transitions continuously. That was C-02, and it is why the cache key is a string.
     */
    const data = useMemo(() => parseChartData(dataJson, chartType), [dataJson, chartType]);

    const configurationKey = mergeCacheKey({ staticConfiguration, dynamicConfiguration, functionProperties });
    const merged = useMemo(
        () => mergeConfiguration({ staticConfiguration, dynamicConfiguration, functionProperties }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [configurationKey]
    );

    // Depends on the primitives, not on `props` — the prop object is a new identity every render,
    // which would make the memo do nothing while looking like it did something.
    const containerStyle = useMemo(
        () => ({ ...sizing(props.heightMode, props.heightPixels, props.aspectRatio), ...style }),
        [props.heightMode, props.heightPixels, props.aspectRatio, style]
    );

    const problems = [
        ...(chartTypeError ? [chartTypeError] : []),
        ...(dataError ? [dataError] : []),
        ...(data.ok ? [] : [data.error]),
        ...merged.errors
    ];

    const body = (): ReactElement => {
        if (problems.length > 0) {
            return state("error", "This chart could not be drawn.", problems.join(" "));
        }
        /*
         * The empty state is about BOUND data, so it must not apply to a chart type that does not
         * take any.
         *
         * Geo Map has no meaningful `data` prop at all — its geography arrives through `features` in
         * the configuration. Gating on empty bound data therefore made Geo Map unrenderable *even
         * when `features` was supplied*, which is a strictly worse failure than the one the empty
         * state exists to prevent: the chart was fully configured and the widget refused to draw it,
         * reporting "no sample data" about a property the chart never reads.
         *
         * Found by rendering the gallery, not by any check — the page looked exactly like a
         * correctly-empty chart. See docs/known-unverified.md.
         */
        if (CHART_DATA_SHAPE[chartType] !== "features" && isEmptyData(data.ok ? data.value : undefined)) {
            return state("empty", emptyMessage);
        }
        return (
            <ChartErrorBoundary
                resetKey={`${chartType}|${renderer}|${dataJson ?? ""}|${configurationKey}`}
                fallback={message => state("error", "This chart could not be drawn.", message)}
            >
                <div className="aq-nivo__chart">
                    {/*
                     * The chart's Nivo package is loaded on demand (B-01), so the element suspends
                     * until its chunk arrives. The fallback is the loading state rather than the
                     * empty one: an empty message here would tell the user there is no data, when
                     * the truth is that the data is fine and the code has not arrived yet.
                     */}
                    <Suspense fallback={state("loading", "Loading chart…")}>
                        {renderChart(chartType, renderer, data.ok ? data.value : undefined, merged.configuration)}
                    </Suspense>
                </div>
            </ChartErrorBoundary>
        );
    };

    return (
        <div
            className={["aq-nivo", className].filter(Boolean).join(" ")}
            style={containerStyle}
            tabIndex={tabIndex}
            role={ariaLabel ? "img" : undefined}
            aria-label={ariaLabel || undefined}
        >
            {body()}
            {/*
             * The warnings are non-fatal — a function property that did not compile costs its own
             * property, not the chart — so they are announced rather than drawn over the chart.
             */}
            {merged.warnings.length > 0 && (
                <span className="aq-nivo__sr-only" role="status">
                    {merged.warnings.join(" ")}
                </span>
            )}
        </div>
    );
}

function state(kind: "empty" | "error" | "loading", message: string, detail?: string): ReactElement {
    return (
        <div className={`aq-nivo__state aq-nivo__state--${kind}`}>
            <Fragment>
                <span>{message}</span>
                {detail && <span className="aq-nivo__state-detail">{detail}</span>}
            </Fragment>
        </div>
    );
}

/**
 * Nivo charts fill their container, so the container must get a height from somewhere. A chart in a
 * container of zero height renders nothing at all, with no error and no warning — which is the most
 * common way a working configuration appears broken.
 */
function sizing(heightMode: HeightMode, heightPixels: number, aspectRatio: number): CSSProperties {
    switch (heightMode) {
        case "aspectRatio":
            return { aspectRatio: `${aspectRatio}`, height: "auto" };
        case "fillParent":
            return { height: "100%" };
        case "pixels":
        default:
            return { height: `${heightPixels}px` };
    }
}
