import { CSSProperties, Fragment, ReactElement, Suspense, useMemo, useRef } from "react";

import { renderChart } from "../charts/registry";
import { CHART_DATA_SHAPE, CHART_PALETTE_SUPPORT, ChartType, RendererMode } from "../charts/chartTypes";
import { whyCannotDraw } from "../charts/drawability";
import { DataTable, tabulate } from "../data/dataTable";
import { isEmptyData, parseChartData } from "../data/parseJson";
import { mergeCacheKey, mergeConfiguration } from "../config/merge";
import { FunctionPropertyDefinition } from "../config/functionProps";
import { AtlasThemeMode, isPlainObject, mergeTheme } from "../theme/atlasTheme";
import { useAtlasTheme } from "../theme/useAtlasTheme";
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
    /**
     * Called with the raw Nivo click payload when a datum is clicked.
     *
     * Raw and untyped on purpose: this component is Mendix-free, so it has no business knowing what a
     * click *does*. It forwards; the adapter resolves the payload to a row and fires the action.
     * Leaving it unset is what makes the chart non-interactive — `onClick` is then never put into the
     * configuration at all, rather than being set to a no-op, so Nivo's own hover and cursor
     * affordances stay off and the chart does not look clickable when it is not.
     */
    onDatumClick?: (payload: unknown) => void;
    staticConfiguration?: string;
    dynamicConfiguration?: string;
    functionProperties?: readonly FunctionPropertyDefinition[];
    /**
     * How much of the app's own theme the chart adopts (P-11).
     *
     * Read from the DOM rather than passed in as values, because that is what lets a chart follow a
     * theme the user switches while it is on screen. See `theme/atlasTokens.ts`.
     */
    atlasTheme: AtlasThemeMode;
    heightMode: HeightMode;
    heightPixels: number;
    aspectRatio: number;
    emptyMessage: string;
    ariaLabel?: string;
    /**
     * Render the chart's data as a visually-hidden table as well (P-12).
     *
     * `aria-label` says what the chart is about; this is what carries the numbers. It matters most on
     * Canvas, which puts no text in the DOM at all, so without it the label is the entire accessible
     * content. Not every data shape is a table — see `data/dataTable.ts`.
     */
    renderDataTable?: boolean;
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
        onDatumClick,
        staticConfiguration,
        dynamicConfiguration,
        functionProperties,
        atlasTheme,
        emptyMessage,
        ariaLabel,
        renderDataTable,
        className,
        style,
        tabIndex
    } = props;

    /*
     * The root element is the reference point for theming, not `document.documentElement`.
     *
     * Custom properties inherit, so reading from here picks up the app's `:root` theme when nothing
     * overrides it — and picks up a scoped override when something does, which is how a chart inside
     * a dark panel on a light page comes out dark without being told.
     */
    const rootRef = useRef<HTMLDivElement>(null);
    const atlas = useAtlasTheme(rootRef, atlasTheme !== "off");

    /*
     * Memoised on the raw JSON string, not on the prop object.
     *
     * Mendix hands out new prop instances freely, so an identity-based dependency re-parses on every
     * render even when the text is byte-identical — and Nivo, seeing what it takes to be new props,
     * re-runs its transitions continuously. That was C-02, and it is why the cache key is a string.
     */
    const data = useMemo(() => parseChartData(dataJson, chartType), [dataJson, chartType]);

    /*
     * Built only when asked for. The table is a second pass over the whole dataset and a second copy
     * of it in the DOM, which is exactly the cost that makes it a property rather than the default.
     */
    const table = useMemo(
        () => (renderDataTable && data.ok ? tabulate(data.value) : undefined),
        [renderDataTable, data]
    );

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

    /*
     * Injected AFTER the merge, deliberately, so it cannot be overwritten by a configuration key.
     *
     * The alternative — merging it in with everything else — would let a static configuration
     * containing its own "onClick" silently win, and since that value would be a JSON string rather
     * than a function, the chart would either ignore it or throw somewhere inside Nivo. A click
     * handler that is configured and does nothing is exactly the class of silent failure this widget
     * keeps running into, so it is placed where nothing can reach it.
     */
    /*
     * The Atlas theme is the BOTTOM layer, underneath the static and dynamic configuration.
     *
     * Which is the opposite of where the click handler goes, and for the opposite reason. A theme
     * derived from the app is a *default* — it exists so nobody has to write one — so anything the
     * modeller typed must win over it. A click handler is a binding to a microflow, so nothing
     * typed as JSON should be able to displace it.
     *
     * `theme` alone is deep-merged; see `mergeTheme`. Everything else, `colors` included, replaces
     * wholesale — a modeller who sets `colors` wants their palette, not theirs blended with Atlas's.
     */
    const themed = useMemo(() => {
        if (!atlas) {
            return merged.configuration;
        }

        const base: Record<string, unknown> = {};
        if (atlas.theme) {
            base.theme = atlas.theme;
        }
        if (atlasTheme === "full" && atlas.palette && CHART_PALETTE_SUPPORT[chartType]) {
            base.colors = atlas.palette;
        }

        const result: Record<string, unknown> = { ...base, ...merged.configuration };

        // A `theme` supplied as a function property is not an object to merge into — the escape
        // hatch wins outright, as it does everywhere else.
        if (atlas.theme && isPlainObject(merged.configuration.theme)) {
            result.theme = mergeTheme(atlas.theme, merged.configuration.theme);
        }

        return result;
    }, [atlas, atlasTheme, chartType, merged.configuration]);

    const configuration = useMemo(
        () => (onDatumClick ? { ...themed, onClick: onDatumClick } : themed),
        [themed, onDatumClick]
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
        /*
         * The other half of the same question, and a much bigger half than it first looked.
         *
         * Nivo dereferences several props without defaulting them, so a chart handed the wrong data or
         * an incomplete configuration throws rather than rendering badly. The boundary below catches
         * it and that is not enough — React logs every error a boundary catches, from inside React,
         * and a wrapper cannot suppress it. Not throwing is the only way to keep a console clean.
         *
         * Reported as the EMPTY state, not the error one. The case this exists for is a page whose
         * user picks the chart type: for one commit the new type holds the old payload, nothing is
         * actually wrong, and a red error would be a lie. For a genuinely misconfigured chart the
         * detail line names the missing thing, which is more than the throw ever did.
         *
         * See `charts/drawability.ts` for how each rule was measured rather than assumed.
         */
        const undrawable = whyCannotDraw(chartType, data.ok ? data.value : undefined, configuration);
        if (undrawable) {
            return state("empty", emptyMessage, undrawable);
        }
        return (
            <ChartErrorBoundary
                resetKey={`${chartType}|${renderer}|${dataJson ?? ""}|${configurationKey}`}
                fallback={message => state("error", "This chart could not be drawn.", message)}
            >
                {/*
                 * `role="img"` belongs HERE, on the drawing, and not on the root.
                 *
                 * The role makes an element's whole subtree presentational, so anything inside it is
                 * not exposed to assistive technology. On the root that silently swallowed three
                 * things that exist to be announced: the loading state's `aria-live`, the warnings'
                 * `role="status"`, and — the reason it was noticed — the data table below.
                 *
                 * Scoping it to the chart keeps the label attached to the thing it describes and
                 * leaves every sibling readable.
                 */}
                <div
                    className="aq-nivo__chart"
                    role={ariaLabel ? "img" : undefined}
                    aria-label={ariaLabel || undefined}
                >
                    {/*
                     * The chart's Nivo package is loaded on demand (B-01), so the element suspends
                     * until its chunk arrives. The fallback is the loading state rather than the
                     * empty one: an empty message here would tell the user there is no data, when
                     * the truth is that the data is fine and the code has not arrived yet.
                     */}
                    <Suspense fallback={state("loading", "Loading chart…")}>
                        {renderChart(chartType, renderer, data.ok ? data.value : undefined, configuration)}
                    </Suspense>
                </div>
            </ChartErrorBoundary>
        );
    };

    return (
        <div
            ref={rootRef}
            className={["aq-nivo", className].filter(Boolean).join(" ")}
            style={containerStyle}
            tabIndex={tabIndex}
        >
            {body()}
            {/*
             * The tabular alternative (P-12), a sibling of the chart rather than a child of it —
             * inside `role="img"` it would not be exposed at all. See the comment on that role.
             */}
            {renderDataTable && <DataTableAlternative table={table} label={ariaLabel} />}
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

/**
 * The chart's data as a visually-hidden table.
 *
 * Hidden with the clip-rect technique rather than `display: none` or `visibility: hidden`, both of
 * which remove an element from the accessibility tree as well as from view — which would leave this
 * doing nothing at all, silently and while looking correct.
 *
 * Renders nothing when the shape is not tabular. That is deliberate rather than a fallback: a
 * hierarchy or a graph flattened into rows reads as authoritative and is not, and `check()` warns at
 * design time for the chart types where it can never produce anything.
 */
function DataTableAlternative({ table, label }: { table?: DataTable; label?: string }): ReactElement | null {
    if (!table) {
        return null;
    }
    return (
        <div className="aq-nivo__sr-only">
            <table>
                <caption>{label ? `${label} — data table` : "Chart data"}</caption>
                <thead>
                    <tr>
                        {table.columns.map(column => (
                            <th key={column} scope="col">
                                {column}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {table.rows.map((row, index) => (
                        <tr key={index}>
                            {row.map((value, column) => (
                                <td key={column}>{value}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            {/*
             * Said out loud rather than left implicit. A table that simply stops looks like data that
             * simply stops, and the reader has no way to tell the difference.
             */}
            {table.omitted > 0 && <p>{`${table.omitted} further rows are not listed.`}</p>}
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
