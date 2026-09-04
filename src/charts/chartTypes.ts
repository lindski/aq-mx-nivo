/**
 * The chart type vocabulary, declared here rather than imported from the generated typings.
 *
 * Everything under `charts/`, `components/`, `data/`, `config/` and `ui/` must be Mendix-free — that
 * is what lets the page-editor preview and the runtime share one implementation, and what keeps Nivo
 * out of the design-time bundle. Importing `ChartTypeEnum` from `typings/` would break that for the
 * sake of one string union.
 *
 * The duplication is guarded rather than trusted: `scripts/check-layers.mjs` asserts that these keys
 * are exactly the `<enumerationValue key="...">` keys of the `chartType` property in `AqNivo.xml`,
 * in the same set. Add a chart type to one and the build fails until it is added to the other.
 *
 * ## Why these are base names and not Nivo component names
 *
 * Until 2.0 these keys *were* the Nivo component names — `ResponsiveBar`, `ResponsivePie`. That
 * looked economical and did not survive contact with Nivo's Canvas and HTML variants: folding those
 * into one flat enum would have meant 43 values, with the modeller expected to know which of the
 * three suffixes exists for which chart. Fourteen chart types have a Canvas variant and three have
 * an HTML one; the other combinations do not exist.
 *
 * So the type and the rendering technology are separate properties, and `CHART_RENDERER_SUPPORT`
 * below is the map of which pairs are real. The Nivo component name is an implementation detail
 * assembled in `registry.tsx`, which is the only place that should know the word "Responsive".
 *
 * This also makes `chartTypeExpression` usable: an expression switching the chart at runtime returns
 * `getKey($currentObject/ChartType)` rather than having to prepend a prefix.
 */
export const CHART_TYPES = [
    "AreaBump",
    "Bar",
    "Bullet",
    "Bump",
    "Calendar",
    "Chord",
    "Choropleth",
    "CirclePacking",
    "Funnel",
    "GeoMap",
    "HeatMap",
    "Line",
    "Marimekko",
    "Network",
    "Pie",
    "Radar",
    "RadialBar",
    "Sankey",
    "ScatterPlot",
    "Stream",
    "Sunburst",
    "SwarmPlot",
    "TimeRange",
    "TreeMap",
    "Voronoi",
    "Waffle"
] as const;

export type ChartType = (typeof CHART_TYPES)[number];

/**
 * The rendering technology.
 *
 * SVG is Nivo's default and the only one every chart type supports. Canvas exists for the chart
 * types where the element count gets large enough that SVG stops being viable. HTML exists for three
 * hierarchical charts.
 *
 * This is a design-time choice — it is a performance decision about a known dataset, not something
 * that should follow the data — so unlike `chartType` it has no expression counterpart.
 */
export const RENDERER_MODES = ["Svg", "Canvas", "Html"] as const;

export type RendererMode = (typeof RENDERER_MODES)[number];

/**
 * Which rendering technologies each chart type actually has.
 *
 * **Read out of the installed `@nivo/*` type declarations at 0.99.0, not from memory** — the same
 * discipline as `CHART_DATA_SHAPE` below, and for the same reason. Fourteen Canvas variants, three
 * HTML ones, and SVG everywhere. Re-derive on a Nivo upgrade rather than assuming.
 *
 * An unsupported pair is not an error at runtime: it falls back to SVG, because the alternative
 * would be refusing to draw a chart over a rasterisation detail. The same chart is rendered either
 * way, so nothing is misrepresented — which is exactly the argument that does NOT apply to an
 * unrecognised chart type, where falling back would draw the wrong chart. `check()` warns about the
 * pair at design time so it is visible before anyone has to notice the fallback.
 */
export const CHART_RENDERER_SUPPORT: Record<ChartType, readonly RendererMode[]> = {
    AreaBump: ["Svg"],
    Bar: ["Svg", "Canvas"],
    Bullet: ["Svg"],
    Bump: ["Svg"],
    Calendar: ["Svg", "Canvas"],
    Chord: ["Svg", "Canvas"],
    Choropleth: ["Svg", "Canvas"],
    CirclePacking: ["Svg", "Canvas", "Html"],
    Funnel: ["Svg"],
    GeoMap: ["Svg", "Canvas"],
    HeatMap: ["Svg", "Canvas"],
    Line: ["Svg", "Canvas"],
    Marimekko: ["Svg"],
    Network: ["Svg", "Canvas"],
    Pie: ["Svg", "Canvas"],
    Radar: ["Svg"],
    RadialBar: ["Svg"],
    Sankey: ["Svg"],
    ScatterPlot: ["Svg", "Canvas"],
    Stream: ["Svg"],
    Sunburst: ["Svg"],
    SwarmPlot: ["Svg", "Canvas"],
    TimeRange: ["Svg"],
    TreeMap: ["Svg", "Canvas", "Html"],
    Voronoi: ["Svg"],
    Waffle: ["Svg", "Canvas", "Html"]
};

/** Human-readable name, for captions and error messages. */
export const CHART_LABELS: Record<ChartType, string> = {
    AreaBump: "Area Bump",
    Bar: "Bar",
    Bullet: "Bullet",
    Bump: "Bump",
    Calendar: "Calendar",
    Chord: "Chord",
    Choropleth: "Choropleth",
    CirclePacking: "Circle Packing",
    Funnel: "Funnel",
    GeoMap: "Geo Map",
    HeatMap: "Heat Map",
    Line: "Line",
    Marimekko: "Marimekko",
    Network: "Network",
    Pie: "Pie",
    Radar: "Radar",
    RadialBar: "Radial Bar",
    Sankey: "Sankey",
    ScatterPlot: "Scatter Plot",
    Stream: "Stream",
    Sunburst: "Sunburst",
    SwarmPlot: "Swarm Plot",
    TimeRange: "Time Range",
    TreeMap: "Tree Map",
    Voronoi: "Voronoi",
    Waffle: "Waffle"
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
 * `"features"` is the odd one out and is a real limitation, not a shape: `GeoMap` has no meaningful
 * `data` prop at all — its geography arrives through `features`, which this widget can only supply
 * through the configuration JSON. Choropleth needs `features` too, *in addition* to its `data`
 * array. See docs/known-unverified.md.
 */
export const CHART_DATA_SHAPE: Record<ChartType, "array" | "object" | "features"> = {
    AreaBump: "array",
    Bar: "array",
    Bullet: "array",
    Bump: "array",
    Calendar: "array",
    Chord: "array",
    Choropleth: "array",
    CirclePacking: "object",
    Funnel: "array",
    GeoMap: "features",
    HeatMap: "array",
    Line: "array",
    Marimekko: "array",
    Network: "object",
    Pie: "array",
    Radar: "array",
    RadialBar: "array",
    Sankey: "object",
    ScatterPlot: "array",
    Stream: "array",
    Sunburst: "object",
    SwarmPlot: "array",
    TimeRange: "array",
    TreeMap: "object",
    Voronoi: "array",
    Waffle: "array"
};

/**
 * Whether a chart type can be built from a flat list of Mendix rows, and how.
 *
 * This is the ceiling on datasource mode, and it is a property of Nivo's data shapes rather than of
 * this widget. **Read out of the installed 0.99 type declarations**, like the tables above.
 *
 * - `"flat"` — the chart takes an array of plain objects, so one row maps to one datum.
 * - `"series"` — the chart takes `Serie[]`, each carrying a nested `data` array. Buildable from flat
 *   rows by **partitioning** them on a series field. Partitioning is not aggregating: no row is
 *   combined with another, so it does not run into the no-group-by ceiling below.
 * - `"unsupported"` — the shape cannot be produced from a flat row list at all. Hierarchies
 *   (`CirclePacking`, `Sunburst`, `TreeMap`), graphs (`Sankey`, `Network`), a numeric matrix
 *   (`Chord`), GeoJSON (`GeoMap`), and `Bullet`, whose datum carries three nested arrays. These stay
 *   JSON-only, which is not a gap to close — a flat table genuinely does not contain a tree.
 *
 * ## The two ceilings that shaped this, from `widget-datasource-contracts`
 *
 * **There is no group-by.** A Mendix datasource cannot be asked for aggregated rows, so the widget
 * must never aggregate: a chart that sums in the browser is summing whatever it holds. Aggregation
 * belongs in a microflow, and the datasource supplies rows already at chart granularity.
 *
 * **Which is why datasource mode must hold every row.** Charting one page and presenting it as the
 * whole is not slow, it is wrong, and it looks entirely plausible — a bar chart of twenty rows
 * labelled as the total for two thousand. So the widget takes the full list and never sets a limit.
 */
export const CHART_DATASOURCE_SHAPE: Record<ChartType, "flat" | "series" | "unsupported"> = {
    AreaBump: "series",
    Bar: "flat",
    Bullet: "unsupported",
    Bump: "series",
    Calendar: "flat",
    Chord: "unsupported",
    Choropleth: "flat",
    CirclePacking: "unsupported",
    Funnel: "flat",
    GeoMap: "unsupported",
    HeatMap: "series",
    Line: "series",
    Marimekko: "flat",
    Network: "unsupported",
    Pie: "flat",
    Radar: "flat",
    RadialBar: "series",
    Sankey: "unsupported",
    ScatterPlot: "series",
    Stream: "flat",
    Sunburst: "unsupported",
    SwarmPlot: "flat",
    TimeRange: "flat",
    TreeMap: "unsupported",
    Voronoi: "flat",
    Waffle: "flat"
};

export function isChartType(value: string): value is ChartType {
    return (CHART_TYPES as readonly string[]).includes(value);
}

export function isRendererMode(value: string): value is RendererMode {
    return (RENDERER_MODES as readonly string[]).includes(value);
}

/** Whether this chart type can actually be drawn with this rendering technology. */
export function supportsRenderer(chartType: ChartType, renderer: RendererMode): boolean {
    return CHART_RENDERER_SUPPORT[chartType].includes(renderer);
}
