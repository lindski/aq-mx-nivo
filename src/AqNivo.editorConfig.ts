import { AqNivoPreviewProps } from "../typings/AqNivoProps";
import { CHART_DATA_SHAPE, CHART_LABELS, ChartType } from "./charts/chartTypes";
import { parseConfiguration } from "./data/parseJson";
import { functionPropertyError } from "./config/functionProps";

/**
 * Design time.
 *
 * The property sheet is the only place that knows a choice was *intended*. Everything downstream is
 * correct in the presence of an empty or malformed value — "not configured" is a legitimate runtime
 * state — so nothing at runtime can distinguish a deliberate blank from a mistake. That is why these
 * checks are worth more per line than anything else in the widget.
 *
 * Note what is deliberately NOT here: `getProperties()` hides nothing. Two properties are
 * mode-specific — `containerHeight` and `aspectRatio` — and hiding them on `heightMode` would derive
 * visibility from a property the modeller edits in the same sheet. That reshapes the sheet while it
 * is in use, and has been observed showing the wrong value against the right caption, with no error
 * anywhere. Hidden properties also cannot be written by page tooling: they silently revert to the
 * XML default, with a success report and a clean consistency check. A `check()` warning carries the
 * same information and costs neither.
 */

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
    return `Nivo ${CHART_LABELS[values.chartType as ChartType] ?? values.chartType}`;
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
