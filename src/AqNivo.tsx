import { ReactElement, useEffect, useMemo } from "react";
import { ValueStatus } from "mendix";

import { AqNivoContainerProps } from "../typings/AqNivoProps";
import { NivoChart } from "./components/NivoChart";
import { resolveChartType } from "./charts/resolveChartType";
import { toChartValue } from "./data/attributeValue";
import { projectRows, RowMapping } from "./data/projectRows";
import { resolveRowKey } from "./charts/clickTarget";
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
        dataMode,
        chartDataJson,
        chartDataSource,
        dataColumns,
        seriesAttribute,
        onClickAction,
        chartType,
        chartTypeExpression,
        renderer,
        staticConfiguration,
        dynamicConfiguration,
        functionProperties,
        atlasTheme,
        heightMode,
        containerHeight,
        aspectRatio,
        emptyMessage,
        ariaLabel,
        renderDataTable,
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
        (dataMode === "json" && chartDataJson?.status === ValueStatus.Loading) ||
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

    /*
     * Datasource mode: project the rows to the shape the chart expects, then serialise.
     *
     * Serialising back to a string is deliberate, not lazy. Every memo downstream keys on the raw
     * data TEXT rather than on object identity, because Mendix hands out new instances freely and an
     * identity-keyed memo re-parses on every render — which makes Nivo re-run its transitions
     * continuously (C-02). Producing a string here means datasource mode inherits that whole design
     * unchanged, and gets `parseChartData`'s shape validation for free rather than duplicating it.
     *
     * Note what is deliberately NOT here: any gate on the datasource's status. Gating the chart on
     * `status === "available"` would unmount and remount it on every reload, and with a refresh
     * interval that is every few seconds. The last good data simply stays on screen while new rows
     * are in flight.
     */
    // Extracted so the memo dependency is a plain value the linter can check, rather than a
    // conditional expression it has to give up on.
    const effectiveChartType = resolved.ok ? resolved.chartType : chartType;

    const interactive = dataMode === "datasource" && !!onClickAction;

    const projected = useMemo(() => {
        if (dataMode !== "datasource") {
            return undefined;
        }

        const items = chartDataSource?.items;
        if (!items) {
            // Mid-reload, or not yet loaded. Hold what is on screen rather than blanking the chart.
            return undefined;
        }

        const mappings: RowMapping[] = (dataColumns ?? []).map((column, index) => ({
            source: String(index),
            outputKey: column.outputKey
        }));

        const rows = items.map(item => {
            const row: Record<string, unknown> = {};
            (dataColumns ?? []).forEach((column, index) => {
                const attribute = column.columnAttribute;
                const cell = attribute?.get(item);
                row[String(index)] = toChartValue({
                    type: attribute?.type,
                    value: cell?.value,
                    displayValue: cell?.displayValue
                });
            });
            if (seriesAttribute) {
                const seriesCell = seriesAttribute.get(item);
                row.__series = toChartValue({
                    type: seriesAttribute.type,
                    value: seriesCell?.value,
                    displayValue: seriesCell?.displayValue
                });
            }
            return row;
        });

        const result = projectRows({
            chartType: effectiveChartType,
            rows,
            mappings,
            seriesSource: seriesAttribute ? "__series" : undefined,
            includeRowKey: interactive
        });

        return result.ok ? { json: JSON.stringify(result.value) } : { error: result.error };
    }, [dataMode, chartDataSource?.items, dataColumns, seriesAttribute, effectiveChartType, interactive]);

    /*
     * Click -> row -> microflow.
     *
     * `onClickAction` is a ListActionValue because the XML declares its `dataSource`, which is what
     * makes Mendix bind the clicked row to the microflow's parameter. Without that declaration the
     * property still compiles, the action still fires, and the microflow silently receives nothing —
     * no error at build, design or run time. It is the single easiest thing to get wrong here.
     *
     * Undefined rather than a no-op when there is nothing to do: NivoChart only puts `onClick` into
     * the configuration when this is set, so a non-interactive chart does not advertise itself as
     * clickable.
     */
    const onDatumClick = useMemo(() => {
        const items = chartDataSource?.items;
        if (!interactive || !onClickAction || !items) {
            return undefined;
        }

        return (payload: unknown): void => {
            const index = resolveRowKey(payload);
            if (index === undefined) {
                // A series- or layer-level click (Stream, Bump, Area Bump), or a chart whose payload
                // shape we do not recognise. Firing with no row would be worse than not firing.
                return;
            }

            const item = items[index];
            if (!item) {
                // The rows moved under us between render and click — a refresh landing mid-gesture.
                return;
            }

            const action = onClickAction.get(item);
            if (action?.canExecute && !action.isExecuting) {
                action.execute();
            }
        };
    }, [interactive, onClickAction, chartDataSource?.items]);

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
            renderer={renderer}
            chartTypeError={resolved.ok ? undefined : resolved.error}
            dataJson={dataMode === "datasource" ? projected?.json : chartDataJson?.value}
            dataError={dataMode === "datasource" ? projected?.error : undefined}
            onDatumClick={onDatumClick}
            staticConfiguration={staticConfiguration}
            dynamicConfiguration={dynamicConfiguration?.value}
            functionProperties={functions}
            atlasTheme={atlasTheme}
            heightMode={heightMode}
            heightPixels={containerHeight}
            /* `decimal` properties arrive as Big, not number. */
            aspectRatio={aspectRatio ? Number(aspectRatio.toString()) : 1.6}
            emptyMessage={textOf(emptyMessage) ?? DEFAULT_EMPTY_MESSAGE}
            ariaLabel={textOf(ariaLabel)}
            renderDataTable={renderDataTable}
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
