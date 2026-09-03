import { ReactElement } from "react";
import { ChartType } from "../charts/chartTypes";

/**
 * A faithful static stand-in for each chart type, drawn as inline SVG.
 *
 * "Render a real preview" and "keep Nivo out of the design-time bundle" collide head-on for a
 * wrapped chart library: the design-time bundle is **not** tree-shaken, so a single value import of
 * `@nivo/bar` here would drag several megabytes into a bundle Studio Pro loads when the project is
 * opened. The resolution is to draw the *shape* the chart type produces, without the library.
 *
 * That is worth doing rather than shipping a grey box, because a grey box makes the page impossible
 * to lay out and any sizing property impossible to judge — which is exactly what you are in the page
 * editor to do. 1.x rendered `<div>{chartType}</div>`: the literal enum key, as plain text.
 *
 * `PREVIEWS` is a `Record<ChartType, …>` deliberately, so adding a chart type to the enumeration is
 * a **compile error** here rather than a silent fallback to a default drawing.
 */

const INK = "#4b5563";
const MUTED = "#9ca3af";
const FILL = "#c7d2e4";
const ACCENT = "#7f9cc4";

type Family =
    | "bars"
    | "horizontalBars"
    | "line"
    | "area"
    | "pie"
    | "arc"
    | "radial"
    | "hierarchy"
    | "grid"
    | "flow"
    | "scatter"
    | "geo"
    | "funnel";

const FAMILY: Record<ChartType, Family> = {
    ResponsiveAreaBump: "area",
    ResponsiveBar: "bars",
    ResponsiveBullet: "horizontalBars",
    ResponsiveBump: "line",
    ResponsiveCalendar: "grid",
    ResponsiveChord: "arc",
    ResponsiveChoropleth: "geo",
    ResponsiveCirclePacking: "hierarchy",
    ResponsiveFunnel: "funnel",
    ResponsiveGeoMap: "geo",
    ResponsiveHeatMap: "grid",
    ResponsiveLine: "line",
    ResponsiveMarimekko: "bars",
    ResponsiveNetwork: "scatter",
    ResponsivePie: "pie",
    ResponsiveRadar: "radial",
    ResponsiveRadialBar: "radial",
    ResponsiveSankey: "flow",
    ResponsiveScatterPlot: "scatter",
    ResponsiveStream: "area",
    ResponsiveSunburst: "arc",
    ResponsiveSwarmPlot: "scatter",
    ResponsiveTimeRange: "grid",
    ResponsiveTreeMap: "hierarchy",
    ResponsiveVoronoi: "scatter",
    ResponsiveWaffle: "grid"
};

const axes = (): ReactElement => (
    <g stroke={MUTED} strokeWidth="1">
        <line x1="28" y1="12" x2="28" y2="104" />
        <line x1="28" y1="104" x2="188" y2="104" />
    </g>
);

const DRAWINGS: Record<Family, () => ReactElement> = {
    bars: () => (
        <g>
            {axes()}
            {[26, 54, 38, 72, 46, 62].map((h, i) => (
                <rect key={i} x={38 + i * 25} y={104 - h} width="16" height={h} fill={i % 2 ? ACCENT : FILL} />
            ))}
        </g>
    ),
    horizontalBars: () => (
        <g>
            {[0, 1, 2].map(i => (
                <g key={i}>
                    <rect x="28" y={26 + i * 28} width="150" height="12" fill="#eef1f6" />
                    <rect x="28" y={26 + i * 28} width={[110, 74, 132][i]} height="12" fill={FILL} />
                    <rect x={[118, 92, 140][i]} y={22 + i * 28} width="3" height="20" fill={INK} />
                </g>
            ))}
        </g>
    ),
    line: () => (
        <g>
            {axes()}
            <polyline
                points="38,88 62,64 86,72 110,40 134,52 158,26 182,34"
                fill="none"
                stroke={ACCENT}
                strokeWidth="2.5"
            />
            <polyline
                points="38,96 62,86 86,90 110,74 134,80 158,66 182,70"
                fill="none"
                stroke={MUTED}
                strokeWidth="2"
                strokeDasharray="4 3"
            />
        </g>
    ),
    area: () => (
        <g>
            {axes()}
            <path d="M38,104 L38,74 62,60 86,66 110,44 134,54 158,34 182,42 182,104 Z" fill={FILL} />
            <path d="M38,104 L38,92 62,84 86,88 110,78 134,84 158,72 182,78 182,104 Z" fill={ACCENT} opacity="0.8" />
        </g>
    ),
    pie: () => (
        <g transform="translate(108,58)">
            <circle r="42" fill={FILL} />
            <path d="M0,0 L0,-42 A42,42 0 0,1 36,21 Z" fill={ACCENT} />
            <path d="M0,0 L36,21 A42,42 0 0,1 -20,37 Z" fill="#e3e8f0" />
        </g>
    ),
    arc: () => (
        <g transform="translate(108,58)">
            <circle r="42" fill="none" stroke={FILL} strokeWidth="10" />
            <path d="M0,-42 A42,42 0 0,1 36,21" fill="none" stroke={ACCENT} strokeWidth="10" />
            <path d="M-30,-30 Q0,10 30,-30" fill="none" stroke={MUTED} strokeWidth="1.5" />
            <path d="M-38,14 Q0,-6 34,26" fill="none" stroke={MUTED} strokeWidth="1.5" />
        </g>
    ),
    radial: () => (
        <g transform="translate(108,58)">
            <circle r="42" fill="none" stroke="#eef1f6" strokeWidth="1" />
            <circle r="28" fill="none" stroke="#eef1f6" strokeWidth="1" />
            <circle r="14" fill="none" stroke="#eef1f6" strokeWidth="1" />
            <polygon points="0,-38 32,-12 22,30 -22,30 -32,-12" fill={FILL} stroke={ACCENT} strokeWidth="2" />
        </g>
    ),
    hierarchy: () => (
        <g>
            <rect x="30" y="16" width="86" height="52" fill={FILL} />
            <rect x="118" y="16" width="60" height="30" fill={ACCENT} />
            <rect x="118" y="48" width="60" height="20" fill="#e3e8f0" />
            <rect x="30" y="70" width="52" height="34" fill="#e3e8f0" />
            <rect x="84" y="70" width="94" height="34" fill={FILL} />
        </g>
    ),
    grid: () => (
        <g>
            {Array.from({ length: 4 }).map((_, r) =>
                Array.from({ length: 8 }).map((__, c) => (
                    <rect
                        key={`${r}-${c}`}
                        x={30 + c * 19}
                        y={22 + r * 19}
                        width="15"
                        height="15"
                        fill={(r * 8 + c) % 3 === 0 ? ACCENT : (r + c) % 2 ? FILL : "#eef1f6"}
                    />
                ))
            )}
        </g>
    ),
    flow: () => (
        <g>
            <rect x="30" y="24" width="12" height="34" fill={ACCENT} />
            <rect x="30" y="66" width="12" height="26" fill={FILL} />
            <rect x="166" y="18" width="12" height="30" fill={ACCENT} />
            <rect x="166" y="56" width="12" height="42" fill={FILL} />
            <path d="M42,30 C100,30 110,24 166,24 L166,42 C110,42 100,52 42,52 Z" fill={FILL} opacity="0.75" />
            <path d="M42,70 C100,70 110,66 166,66 L166,92 C110,92 100,86 42,86 Z" fill={ACCENT} opacity="0.55" />
        </g>
    ),
    scatter: () => (
        <g>
            {axes()}
            {[
                [50, 84, 5],
                [72, 62, 7],
                [92, 74, 4],
                [110, 46, 8],
                [128, 66, 5],
                [148, 38, 6],
                [168, 56, 4],
                [62, 92, 4],
                [138, 88, 5]
            ].map(([cx, cy, r], i) => (
                <circle key={i} cx={cx} cy={cy} r={r} fill={i % 2 ? ACCENT : FILL} opacity="0.85" />
            ))}
        </g>
    ),
    geo: () => (
        <g>
            <path
                d="M34,40 L64,24 96,32 118,20 152,30 178,24 182,64 156,84 120,76 92,92 56,84 32,68 Z"
                fill={FILL}
                stroke={MUTED}
                strokeWidth="1"
            />
            <path d="M96,32 L118,20 152,30 156,84 120,76 92,92 Z" fill={ACCENT} stroke={MUTED} strokeWidth="1" />
        </g>
    ),
    funnel: () => (
        <g>
            <path d="M34,18 L182,18 164,40 52,40 Z" fill={ACCENT} />
            <path d="M54,44 L162,44 148,66 68,66 Z" fill={FILL} />
            <path d="M70,70 L146,70 134,92 82,92 Z" fill="#e3e8f0" />
        </g>
    )
};

export function StaticChart({ chartType }: { chartType: ChartType }): ReactElement {
    const draw = DRAWINGS[FAMILY[chartType]];
    return (
        <svg viewBox="0 0 212 116" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" role="img">
            <rect x="0" y="0" width="212" height="116" fill="none" />
            {draw()}
        </svg>
    );
}
