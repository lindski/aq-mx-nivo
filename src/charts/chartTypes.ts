/**
 * The chart type vocabulary, declared here rather than imported from the generated typings.
 *
 * Everything under `charts/`, `components/`, `data/`, `config/` and `ui/` must be Mendix-free — that
 * is what lets the page-editor preview and the runtime share one implementation, and what keeps Nivo
 * out of the design-time bundle. Importing `ChartTypeEnum` from `typings/` would break that for the
 * sake of one string union.
 *
 * The duplication is guarded rather than trusted: `scripts/check-layers.mjs` asserts that these keys
 * are exactly the `<enumerationValue key="...">` keys in `AqNivo.xml`, in the same set. Add a chart
 * type to one and the build fails until it is added to the other.
 */
export const CHART_TYPES = [
    "ResponsiveAreaBump",
    "ResponsiveBar",
    "ResponsiveBullet",
    "ResponsiveBump",
    "ResponsiveCalendar",
    "ResponsiveChord",
    "ResponsiveChoropleth",
    "ResponsiveCirclePacking",
    "ResponsiveFunnel",
    "ResponsiveGeoMap",
    "ResponsiveHeatMap",
    "ResponsiveLine",
    "ResponsiveMarimekko",
    "ResponsiveNetwork",
    "ResponsivePie",
    "ResponsiveRadar",
    "ResponsiveRadialBar",
    "ResponsiveSankey",
    "ResponsiveScatterPlot",
    "ResponsiveStream",
    "ResponsiveSunburst",
    "ResponsiveSwarmPlot",
    "ResponsiveTimeRange",
    "ResponsiveTreeMap",
    "ResponsiveVoronoi",
    "ResponsiveWaffle"
] as const;

export type ChartType = (typeof CHART_TYPES)[number];

/** Human-readable name, for captions and error messages. */
export const CHART_LABELS: Record<ChartType, string> = {
    ResponsiveAreaBump: "Area Bump",
    ResponsiveBar: "Bar",
    ResponsiveBullet: "Bullet",
    ResponsiveBump: "Bump",
    ResponsiveCalendar: "Calendar",
    ResponsiveChord: "Chord",
    ResponsiveChoropleth: "Choropleth",
    ResponsiveCirclePacking: "Circle Packing",
    ResponsiveFunnel: "Funnel",
    ResponsiveGeoMap: "Geo Map",
    ResponsiveHeatMap: "Heat Map",
    ResponsiveLine: "Line",
    ResponsiveMarimekko: "Marimekko",
    ResponsiveNetwork: "Network",
    ResponsivePie: "Pie",
    ResponsiveRadar: "Radar",
    ResponsiveRadialBar: "Radial Bar",
    ResponsiveSankey: "Sankey",
    ResponsiveScatterPlot: "Scatter Plot",
    ResponsiveStream: "Stream",
    ResponsiveSunburst: "Sunburst",
    ResponsiveSwarmPlot: "Swarm Plot",
    ResponsiveTimeRange: "Time Range",
    ResponsiveTreeMap: "Tree Map",
    ResponsiveVoronoi: "Voronoi",
    ResponsiveWaffle: "Waffle"
};

/**
 * The shape each chart type expects at the top level of its `data` prop.
 *
 * Nivo is not consistent about this, and the failure when you get it wrong is unhelpful: a chart
 * given an object where it wants an array throws inside a `.map`, several frames below anything
 * named after this widget. Knowing the expected shape lets the error name the real problem instead.
 *
 * **Read out of the installed `@nivo/*` type declarations at 0.99.0, not from memory** — the first
 * draft of this table guessed Chord as an object because "chord diagram" sounds hierarchical. It is
 * `data: number[][]`, a matrix. Re-derive rather than assume on a Nivo upgrade.
 *
 * `"features"` is the odd one out and is a real limitation, not a shape: `ResponsiveGeoMap` has no
 * meaningful `data` prop at all — its geography arrives through `features`, which this widget can
 * only supply through the configuration JSON. Choropleth needs `features` too, *in addition* to its
 * `data` array. See docs/known-unverified.md.
 */
export const CHART_DATA_SHAPE: Record<ChartType, "array" | "object" | "features"> = {
    ResponsiveAreaBump: "array",
    ResponsiveBar: "array",
    ResponsiveBullet: "array",
    ResponsiveBump: "array",
    ResponsiveCalendar: "array",
    ResponsiveChord: "array",
    ResponsiveChoropleth: "array",
    ResponsiveCirclePacking: "object",
    ResponsiveFunnel: "array",
    ResponsiveGeoMap: "features",
    ResponsiveHeatMap: "array",
    ResponsiveLine: "array",
    ResponsiveMarimekko: "array",
    ResponsiveNetwork: "object",
    ResponsivePie: "array",
    ResponsiveRadar: "array",
    ResponsiveRadialBar: "array",
    ResponsiveSankey: "object",
    ResponsiveScatterPlot: "array",
    ResponsiveStream: "array",
    ResponsiveSunburst: "object",
    ResponsiveSwarmPlot: "array",
    ResponsiveTimeRange: "array",
    ResponsiveTreeMap: "object",
    ResponsiveVoronoi: "array",
    ResponsiveWaffle: "array"
};

export function isChartType(value: string): value is ChartType {
    return (CHART_TYPES as readonly string[]).includes(value);
}
