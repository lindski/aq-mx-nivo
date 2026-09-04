import { AqNivoPreviewProps } from "../typings/AqNivoProps";
import {
    CHART_DATA_SHAPE,
    CHART_DATASOURCE_SHAPE,
    CHART_LABELS,
    CHART_RENDERER_SUPPORT,
    ChartType,
    RendererMode,
    isChartType,
    supportsRenderer
} from "./charts/chartTypes";
import { parseConfiguration } from "./data/parseJson";
import { functionPropertyError } from "./config/functionProps";
import { collectFunctionMarkers, resolveMarker } from "./config/functionRegistry";

/**
 * Design time.
 *
 * The property sheet is the only place that knows a choice was *intended*. Everything downstream is
 * correct in the presence of an empty or malformed value — "not configured" is a legitimate runtime
 * state — so nothing at runtime can distinguish a deliberate blank from a mistake. That is why these
 * checks are worth more per line than anything else in the widget.
 *
 * Note what is deliberately NOT here: `getProperties()` hides nothing. Several properties are
 * mode-specific — `containerHeight` and `aspectRatio` on `heightMode`, and now the whole datasource
 * half of the Data group on `dataMode` — and hiding them on the deciding property would derive
 * visibility from a property the modeller edits in the same sheet. That reshapes the sheet while it
 * is in use, and has been observed showing the wrong value against the right caption, with no error
 * anywhere. Hidden properties also cannot be written by page tooling: they silently revert to the
 * XML default, with a success report and a clean consistency check. A `check()` warning carries the
 * same information and costs neither.
 *
 * `dataMode` makes that second point concrete rather than theoretical: the gallery pages in the test
 * app are written by page tooling, so hiding `chartDataJson` whenever `dataMode` is Data source would
 * mean a page that switches to JSON mode gets the XML default written back over its payload, reported
 * as a success. The mode checks below say the same thing and cannot do that.
 */

/**
 * Chart types whose `onClick` reports a series or a layer rather than a single datum.
 *
 * Kept here rather than in `chartTypes.ts` because it is a fact about Nivo's *event* surface, not
 * about the chart's data shape, and the two do not line up: Stream and Bump both take ordinary row
 * data and project perfectly well — it is only the click that cannot narrow to one row.
 */
const SERIES_LEVEL_CLICK: readonly ChartType[] = ["Stream", "Bump", "AreaBump"];

type Properties = PropertyGroup[];

type PropertyGroup = {
    caption: string;
    propertyGroups?: PropertyGroup[];
    properties?: Property[];
};

type Property = {
    key: string;
    caption: string;
    description?: string;
    objectHeaders?: string[];
    objects?: ObjectProperties[];
    properties?: Properties[];
};

type Problem = {
    property?: string;
    severity?: "error" | "warning" | "deprecation";
    message: string;
    studioMessage?: string;
    url?: string;
    studioUrl?: string;
};

type ObjectProperties = {
    properties: PropertyGroup[];
    captions?: string[];
};

export function getProperties(_values: AqNivoPreviewProps, defaultProperties: Properties): Properties {
    return defaultProperties;
}

/**
 * Without this every instance reads "Aq Nivo" in the page tree. On a dashboard with eight charts
 * that makes the tree useless for finding the one you want.
 */
export function getCustomCaption(values: AqNivoPreviewProps): string {
    const label = CHART_LABELS[values.chartType as ChartType] ?? values.chartType;
    // Say so when the type is decided at runtime, or the tree confidently names a chart type the
    // page may never render.
    return values.chartTypeExpression?.trim() ? `Nivo ${label} (dynamic)` : `Nivo ${label}`;
}

export function check(values: AqNivoPreviewProps): Problem[] {
    const problems: Problem[] = [];

    // --- configuration that will not parse -----------------------------------------------------
    //
    // Malformed configuration JSON is dropped at runtime and the chart renders with none of it.
    // Nothing throws, so nothing is reported: the chart is simply unstyled, which reads as the
    // configuration being ignored rather than broken. An explicitly typed value that does not parse
    // is an error, not a warning — the choice to type it was deliberate.

    const staticResult = parseConfiguration(values.staticConfiguration, "Static configuration");
    if (!staticResult.ok) {
        problems.push({ property: "staticConfiguration", severity: "error", message: staticResult.error });
    }

    // --- data mode ------------------------------------------------------------------------------
    //
    // Rule 1 of the design-time-check pattern: a property left at its default is "not set up yet"
    // and warrants a warning, but explicitly CHOOSING a mode and then leaving that mode's input
    // empty is an error, because the choice was deliberate. Both branches below are the second case.

    if (values.dataMode === "json") {
        if (!values.chartDataJson) {
            problems.push({
                property: "chartDataJson",
                severity: "error",
                message:
                    "Data from is JSON string, so Chart data must be bound to a String attribute holding the payload."
            });
        }
    } else if (values.dataMode === "datasource") {
        const shape = isChartType(values.chartType) ? CHART_DATASOURCE_SHAPE[values.chartType as ChartType] : undefined;

        if (shape === "unsupported") {
            problems.push({
                property: "dataMode",
                severity: "error",
                message:
                    `${CHART_LABELS[values.chartType as ChartType]} cannot be built from a data source — its data is ` +
                    `a tree, a graph, a matrix or a GeoJSON collection, and a flat list of rows does not contain one. ` +
                    `Set Data from to JSON string for this chart type.`
            });
        }

        if (!values.chartDataSource) {
            problems.push({
                property: "chartDataSource",
                severity: "error",
                message: "Data from is Data source, so Chart rows must be set."
            });
        }

        if ((values.dataColumns ?? []).length === 0) {
            problems.push({
                property: "dataColumns",
                severity: "error",
                message:
                    "No columns are mapped, so every row would project to an empty object. Map at least one attribute."
            });
        }

        // Reported against the Series property rather than the chart type: the series column is the
        // thing that is missing, and a problem raised against the empty field is the one that gets read.
        if (shape === "series" && !values.seriesAttribute) {
            problems.push({
                property: "seriesAttribute",
                severity: "error",
                message:
                    `${CHART_LABELS[values.chartType as ChartType]} draws several series, each with its own points, ` +
                    `so it needs a Series attribute to split the rows on.`
            });
        }

        if (shape === "flat" && values.seriesAttribute) {
            problems.push({
                property: "seriesAttribute",
                severity: "warning",
                message:
                    `${CHART_LABELS[values.chartType as ChartType]} is a single-series chart, so Series is ignored ` +
                    `here. It applies to Line, Scatter Plot, Heat Map, Radial Bar, Bump and Area Bump.`
            });
        }
    }

    // --- click action ---------------------------------------------------------------------------
    //
    // Every rule here is about a silent failure. A click action is invisible in the property sheet
    // once set — nothing shows whether it can actually reach a row — so design time is the only place
    // these can be caught at all.

    if (values.onClickAction) {
        if (values.dataMode !== "datasource") {
            problems.push({
                property: "onClickAction",
                severity: "error",
                message:
                    "On click needs Data from to be Data source. In JSON string mode there is no Mendix row " +
                    "behind a datum, so the microflow would be called with nothing — and it would look like it " +
                    "was working."
            });
        }

        if (isChartType(values.chartType) && SERIES_LEVEL_CLICK.includes(values.chartType as ChartType)) {
            problems.push({
                property: "onClickAction",
                severity: "warning",
                message:
                    `${CHART_LABELS[values.chartType as ChartType]} reports clicks against a whole series rather ` +
                    `than one point, so there is no single row to pass and On click will never fire. Use a chart ` +
                    `whose click identifies one datum, or drive the drill-down from a control beside the chart.`
            });
        }

        /*
         * Line's click surface is the voronoi mesh, not its points.
         *
         * Verified against @nivo/line 0.99: `useMesh` defaults to FALSE, the Points layer renders
         * `DotsItem`s carrying only onFocus/onBlur, and the mesh layer is rendered only when
         * `isInteractive && useMesh && enableSlices === false`. So a Line with a click action and no
         * mesh is silently non-interactive — the chart draws, the property is set, and clicking a
         * point does nothing whatsoever. That is precisely the failure this widget's design-time
         * checks exist for, and nothing at runtime could report it: "no click arrived" and "no click
         * handler was ever attached" are indistinguishable from inside the widget.
         *
         * Warning rather than error because the dynamic configuration can set `useMesh` at runtime,
         * where check() cannot see it.
         */
        if (values.chartType === "Line" && staticResult.ok) {
            const configuration = staticResult.value;
            const slices = configuration.enableSlices;

            if (slices !== undefined && slices !== false) {
                problems.push({
                    property: "onClickAction",
                    severity: "warning",
                    message:
                        "enableSlices is set, so Line reports clicks against a slice — several points at once — " +
                        "and there is no single row to pass, so On click will not fire. Remove enableSlices and " +
                        'set "useMesh": true to get per-point clicks.'
                });
            } else if (configuration.useMesh !== true) {
                problems.push({
                    property: "onClickAction",
                    severity: "warning",
                    message:
                        "Line only reports clicks through its mesh, and useMesh defaults to false, so On click " +
                        'will never fire. Add "useMesh": true to Static configuration. The chart will look ' +
                        "completely normal either way — the points simply have no click handler."
                });
            } else {
                problems.push({
                    property: "onClickAction",
                    severity: "warning",
                    message:
                        "useMesh is on, so the whole plot area is clickable: a click on apparently empty space " +
                        "drills into whichever point is nearest, because a voronoi cell always has an owner. " +
                        "Confirmed in the running app. That is usually wanted on a sparse line chart and " +
                        "surprising on a dense one."
                });
            }
        }

        // Not a hard error: a chart type chosen at runtime may well be a clickable one. But silence
        // here would mean the pairing is only discovered by clicking and getting nothing.
        if (values.chartTypeExpression) {
            problems.push({
                property: "onClickAction",
                severity: "warning",
                message:
                    "Chart type is set by an expression, so whether a click can identify a row depends on which " +
                    "type it produces. Stream, Bump and Area Bump report clicks per series and will not fire."
            });
        }
    }

    // --- named function markers -----------------------------------------------------------------
    //
    // Only the STATIC configuration can be checked here: the dynamic one is an attribute whose value
    // does not exist until the app runs. That asymmetry is worth stating rather than leaving someone
    // to wonder why their marker was not flagged — a typo in the dynamic configuration is a runtime
    // error, and can only ever be.

    if (staticResult.ok) {
        for (const marker of collectFunctionMarkers(staticResult.value)) {
            const resolved = resolveMarker(marker);
            if (typeof resolved !== "function") {
                problems.push({ property: "staticConfiguration", severity: "error", message: resolved.error });
            }
        }
    }

    // --- function properties -------------------------------------------------------------------

    (values.functionProperties ?? []).forEach((fn, index) => {
        const position = `Function property ${index + 1}`;

        if (!fn.propertyName?.trim()) {
            problems.push({
                property: "functionProperties",
                severity: "error",
                message: `${position} has no property name, so it can never be applied to anything. Name the Nivo property it should set, or remove the row.`
            });
        }

        if (!fn.functionBody?.trim()) {
            problems.push({
                property: "functionProperties",
                severity: "error",
                message: `${position} ("${
                    fn.propertyName || "unnamed"
                }") has an empty body. It compiles to a function returning undefined, which Nivo renders as an empty tooltip or a missing label rather than as an error.`
            });
            return;
        }

        const error = functionPropertyError({
            propertyName: fn.propertyName,
            functionArguments: fn.functionArguments,
            functionBody: fn.functionBody
        });

        if (error) {
            problems.push({ property: "functionProperties", severity: "error", message: error });
        } else if (!/\breturn\b/.test(fn.functionBody)) {
            // A warning, not an error: a body can legitimately end in a `throw`, or assign rather
            // than return. Blocking on this would be wrong more often than it is right.
            problems.push({
                property: "functionProperties",
                severity: "warning",
                message: `${position} ("${fn.propertyName}") has no return statement, so it returns undefined. Nivo will render nothing for this property rather than reporting a problem.`
            });
        }
    });

    // --- dynamic chart type ------------------------------------------------------------------
    //
    // The expression cannot be evaluated at design time, so this cannot validate the VALUE. What it
    // can do is stop the design-time setting being read as the one that applies.

    if (values.chartTypeExpression?.trim()) {
        problems.push({
            property: "chartType",
            severity: "warning",
            message:
                "Chart type (dynamic) is set, so this value is only a fallback for when the expression is empty. The expression cannot be checked here — an unrecognised key shows an error at runtime rather than silently drawing the wrong chart."
        });
    }

    // --- renderer -------------------------------------------------------------------------------
    //
    // Choosing a renderer this chart type does not have is not fatal: `renderChart` falls back to SVG,
    // and the same chart is drawn either way, so nothing is misrepresented. That is deliberately the
    // opposite judgement to an unrecognised chart *type*, which is an error — a wrong chart type shows
    // plausible-looking wrong data, a wrong rasterisation shows the right data drawn differently.
    //
    // But a property that silently does nothing invites someone to set it and wonder why the chart did
    // not change, so it is worth a warning. Reported against `renderer` rather than `chartType`,
    // because the renderer is the value being ignored and a problem raised against the field you just
    // filled in is the one that gets read.

    if (isChartType(values.chartType) && values.renderer !== "Svg") {
        const chartType = values.chartType as ChartType;
        const renderer = values.renderer as RendererMode;
        const label = (mode: string): string => (mode === "Html" ? "HTML" : mode === "Svg" ? "SVG" : mode);

        if (!supportsRenderer(chartType, renderer)) {
            const alternatives = CHART_RENDERER_SUPPORT[chartType].filter(mode => mode !== "Svg").map(label);

            problems.push({
                property: "renderer",
                severity: "warning",
                message:
                    `${CHART_LABELS[chartType]} has no ${label(renderer)} renderer, so this chart is drawn as SVG. ` +
                    (alternatives.length > 0
                        ? `This chart type supports SVG and ${alternatives.join(" and ")}.`
                        : "This chart type is SVG only.")
            });
        }
    }

    // --- height ---------------------------------------------------------------------------------
    //
    // Reported against the property that is ignored, not against the mode selector that decided it.
    // A problem reported against the mode is easy to skim past; one reported against the field you
    // just filled in is not.

    if (values.heightMode !== "pixels" && values.containerHeight !== null && values.containerHeight !== 400) {
        problems.push({
            property: "containerHeight",
            severity: "warning",
            message: `Height (px) applies only when Height mode is Fixed pixels. This chart uses ${
                values.heightMode === "aspectRatio" ? "Aspect ratio" : "Fill parent"
            }, so this value is ignored.`
        });
    }

    if (values.heightMode !== "aspectRatio" && values.aspectRatio !== null && values.aspectRatio !== 1.6) {
        problems.push({
            property: "aspectRatio",
            severity: "warning",
            message: `Aspect ratio applies only when Height mode is Aspect ratio. This chart uses ${
                values.heightMode === "pixels" ? "Fixed pixels" : "Fill parent"
            }, so this value is ignored.`
        });
    }

    if (values.heightMode === "pixels" && values.containerHeight !== null && values.containerHeight <= 0) {
        problems.push({
            property: "containerHeight",
            severity: "error",
            message:
                "Height must be greater than zero. A Nivo chart fills its container, so a container of zero height renders nothing at all — with no error and no empty state."
        });
    }

    if (values.heightMode === "aspectRatio" && values.aspectRatio !== null && values.aspectRatio <= 0) {
        problems.push({
            property: "aspectRatio",
            severity: "error",
            message: "Aspect ratio must be greater than zero, or the chart has no height and renders nothing."
        });
    }

    if (values.heightMode === "fillParent") {
        problems.push({
            property: "heightMode",
            severity: "warning",
            message:
                "Fill parent needs an ancestor with a real height. Mendix layouts rarely give one, and a chart in a container of zero height renders nothing at all, silently. Prefer Fixed pixels or Aspect ratio unless you know the parent is sized."
        });
    }

    // --- geo --------------------------------------------------------------------------------------
    //
    // The one chart type whose data binding does not do what the property sheet implies. Worth
    // saying, rather than leaving someone to discover an empty map.

    if (CHART_DATA_SHAPE[values.chartType as ChartType] === "features") {
        problems.push({
            property: "chartType",
            severity: "warning",
            message:
                "Geo Map takes its geography through a 'features' key in the configuration, not through Chart data — bound data is not passed to this chart type. Supply a GeoJSON feature collection as 'features' in the static or dynamic configuration."
        });
    }

    // --- accessibility ------------------------------------------------------------------------------

    if (!values.ariaLabel?.trim()) {
        problems.push({
            property: "ariaLabel",
            severity: "warning",
            message:
                "No accessible label. A chart is an image to assistive technology, so without one it is announced as nothing at all. Describe what is measured and over what — not the chart type."
        });
    }

    return problems;
}
