import { ReactElement, useEffect, useMemo } from "react";
import { ValueStatus } from "mendix";

import { AqNivoContainerProps } from "../typings/AqNivoProps";
import { NivoChart } from "./components/NivoChart";
import { resolveChartType } from "./charts/resolveChartType";
import { ensureStyles } from "./ui/styles";

/**
 * The Mendix adapter — **the only file in this widget permitted to import `mendix`**.
 *
 * Its whole job is to turn Mendix values into plain ones and hand them to `NivoChart`, which knows
 * nothing about Mendix and can therefore be shared with the page-editor preview and unit-tested with
 * no runtime at all. `scripts/check-layers.mjs` enforces that boundary as a build failure.
 */

const DEFAULT_EMPTY_MESSAGE = "No data to display.";

export function AqNivo(props: AqNivoContainerProps): ReactElement {
    const {
        chartDataJson,
        chartType,
        chartTypeExpression,
        staticConfiguration,
        dynamicConfiguration,
        functionProperties,
        heightMode,
        containerHeight,
        aspectRatio,
        emptyMessage,
        ariaLabel,
        class: className,
        style,
        tabIndex
    } = props;

    useEffect(() => ensureStyles(typeof document === "undefined" ? undefined : document), []);

    /*
     * The value arrives AFTER first render.
     *
     * Rendering an empty chart in the meantime shows the user an empty frame that then silently
     * fills in, which reads as data loss. A skeleton says "not yet" (C-05). 1.x rendered
     * `<div className="widget-not-ready">`, for which no CSS existed — a zero-height empty element,
     * so the loading state was indistinguishable from a broken one.
     *
     * This gates on an *attribute*, which is correct: an attribute genuinely has no value yet. It
     * would be wrong for a datasource — never gate a wrapped instance on `status === "available"`
     * there, because every reload then unmounts and remounts it. That distinction matters when
     * datasource mode lands.
     */
    const loading =
        chartDataJson.status === ValueStatus.Loading ||
        (dynamicConfiguration !== undefined && dynamicConfiguration.status === ValueStatus.Loading) ||
        (chartTypeExpression !== undefined && chartTypeExpression.status === ValueStatus.Loading);

    /*
     * The chart type can come from the design-time enumeration or from a runtime expression. Resolved
     * here rather than in the chart component, because deciding whether the expression HAS a value is
     * a Mendix question — an expression that has not resolved yet is not the same as one that is empty.
     */
    const resolved = resolveChartType(chartType, textOf(chartTypeExpression));

    /*
     * `functionProperties` is a fresh array of fresh objects on every render, so it is projected to
     * plain data here and the chart memoises on the *text*. Passing it straight through would defeat
     * every memo downstream.
     */
    const functions = useMemo(
        () =>
            (functionProperties ?? []).map(f => ({
                propertyName: f.propertyName,
                functionArguments: f.functionArguments,
                functionBody: f.functionBody
            })),
        [functionProperties]
    );

    if (loading) {
        return (
            <div
                className={["aq-nivo", className].filter(Boolean).join(" ")}
                style={{ height: heightMode === "fillParent" ? "100%" : undefined, ...style }}
            >
                <div
                    className="aq-nivo__skeleton"
                    style={heightMode === "pixels" ? { height: `${containerHeight}px` } : undefined}
                    aria-busy="true"
                    aria-live="polite"
                />
            </div>
        );
    }

    return (
        <NivoChart
            chartType={resolved.ok ? resolved.chartType : chartType}
            chartTypeError={resolved.ok ? undefined : resolved.error}
            dataJson={chartDataJson.value}
            staticConfiguration={staticConfiguration}
            dynamicConfiguration={dynamicConfiguration?.value}
            functionProperties={functions}
            heightMode={heightMode}
            heightPixels={containerHeight}
            /* `decimal` properties arrive as Big, not number. */
            aspectRatio={aspectRatio ? Number(aspectRatio.toString()) : 1.6}
            emptyMessage={textOf(emptyMessage) ?? DEFAULT_EMPTY_MESSAGE}
            ariaLabel={textOf(ariaLabel)}
            /*
             * class, style and tabIndex are applied to the root element.
             *
             * 1.x declared all three and applied none of them, so every Atlas design property and
             * every class set in Studio Pro was silently discarded — which from the app side looks
             * like a CSS bug and sends you hunting through SCSS that is perfectly correct (C-03).
             */
            className={className}
            style={style}
            tabIndex={tabIndex}
        />
    );
}

/**
 * A `textTemplate` cannot declare a default in the widget XML, so its default lives in code. It also
 * arrives as a DynamicValue that may not be available yet, in which case there is nothing to show.
 */
function textOf(value: { status: ValueStatus; value?: string } | undefined): string | undefined {
    return value?.status === ValueStatus.Available ? value.value : undefined;
}
