import { ReactElement } from "react";
import { AqNivoPreviewProps } from "../typings/AqNivoProps";
import { CHART_LABELS, ChartType } from "./charts/chartTypes";
import { StaticChart } from "./preview/StaticChart";
import { AQ_NIVO_CSS } from "./ui/styles";

/**
 * The page-editor rendering.
 *
 * **Nothing here may import Nivo, or the runtime component that imports Nivo.** The design-time
 * bundle is not tree-shaken and Studio Pro loads it when the project is opened, so a single value
 * import would put several megabytes into the modeler's start-up path.
 * `scripts/check-layers.mjs` fails the build on it rather than trusting this comment.
 *
 * What is drawn is a faithful static stand-in — the shape the selected chart type produces, at the
 * height the sizing properties give it. That is what makes the page layable-out and the sizing
 * properties judgeable, which a grey box does not. 1.x rendered `<div>{chartType}</div>`.
 */
export function preview(props: AqNivoPreviewProps): ReactElement {
    const { chartType, heightMode, containerHeight, aspectRatio, class: className, styleObject } = props;

    const sizing =
        heightMode === "aspectRatio"
            ? { aspectRatio: `${aspectRatio ?? 1.6}` }
            : heightMode === "fillParent"
            ? { height: "100%", minHeight: "120px" }
            : { height: `${containerHeight ?? 400}px` };

    return (
        <div
            className={["aq-nivo", className].filter(Boolean).join(" ")}
            style={{
                ...sizing,
                ...styleObject,
                display: "flex",
                flexDirection: "column",
                boxSizing: "border-box",
                padding: "8px",
                border: "1px solid #d7dce5",
                borderRadius: "4px",
                background: "#fff",
                overflow: "hidden"
            }}
        >
            <div
                style={{
                    fontSize: "11px",
                    lineHeight: "14px",
                    color: "#6b7280",
                    marginBottom: "4px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                }}
            >
                {CHART_LABELS[chartType as ChartType] ?? chartType}
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
                <StaticChart chartType={chartType as ChartType} />
            </div>
        </div>
    );
}

/**
 * Returned as a string rather than read from a `.css` file, so the preview and the runtime share one
 * definition of these styles instead of a stylesheet and a copy that drift apart.
 */
export function getPreviewCss(): string {
    return AQ_NIVO_CSS;
}
