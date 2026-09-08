# AqNivo — guidance handover

**For a guidance session. Self-contained: nothing here needs this repository or a Mendix app.**

> **Filed as AuraQ/guidance#35 on 2026-09-08** — handed over, awaiting publication as
> `knowledge/developer/widgets/aqnivo.md` plus a `widgets.json` entry.
>
> **This file stays.** It is the source the published reference is regenerated FROM, not a copy of it —
> see `docs/build-notes.md` step 7. **Regenerate it and re-file whenever a property key, a description or
> a `check()` rule changes**, because a renamed key is a breaking change for page authoring and the
> published reference goes stale silently.

Produced 2026-09-08 against **Studio Pro 11.12.4**, **AqNivo 2.0.0**, `@nivo/*` **0.99.0**, React 19.
Every skeleton below was **read back** from a working page with `pg_read_page`, and every page named
was loaded in a browser. Where something was not verified it is named in
[Rule 3 — what is not verified](#rule-3--what-is-not-verified), not hedged in prose.

> **The prompt to act on this file**
>
> Extend the AuraQ guidance knowledge base with a new widget. Add **Part A** to
> `knowledge/developer/widgets.json`, publish **Part B** as `knowledge/developer/widgets/aqnivo.md`,
> use **Part C** only to sanity-check Part B's property table, fold **Part D** into the record's
> `design.snapshot`, and bump the package version. **Do not paste the raw schema into the knowledge
> base.**

---

# Part A — the directory entry

```jsonc
{
  "widgetId": "com.auraq.aqnivo.AqNivo",
  "name": "aqnivo",
  "aliases": [
    "AqNivo", "Aq Nivo", "Nivo", "nivo chart", "chart", "graph",
    "data visualisation", "data visualization", "treemap", "sunburst",
    "sankey", "chord", "choropleth", "heat map", "calendar chart", "radar chart"
  ],
  "owner": "auraq",
  "summary": "Nivo data visualisation — 26 chart types behind one property surface, configured with JSON.",
  "useWhen": "A page needs a chart the Mendix Charts module does not cover: hierarchies (tree map, sunburst, circle packing), flows and relationships (Sankey, chord, network), geography (choropleth, geo map), or the calendar, bullet, radar, marimekko, waffle, swarm and bump families. Also when one chart must switch type at runtime, which it does through an expression.",
  "useInstead": "The Mendix Charts module (Bar, Line, Pie, Area, Column, Bubble, Heat Map, Time Series) for an ordinary business chart already covered there — it needs no JSON, no widget install and no configuration knowledge.",
  "verification": "verified",
  "source": {
    "kind": "in-house",
    "module": "com.auraq.AqNivo.mpk"
  },
  "verifiedAgainst": {
    "mendixVersion": "11.12.4",
    "widgetVersion": "2.0.0",
    "verifiedOn": "2026-09"
  }
}
```

**No `gate` block, deliberately.** Nivo is MIT and all 25 `@nivo/*` packages ship inside the `.mpk`.
There is no entitlement, no trial mode and no console watermark — so no `gate`, and `useInstead` above
is an ordinary "that is overkill for this job" pointer rather than a fallback for a blocked widget.

---

# Part B — the reference

*(Publish as `knowledge/developer/widgets/aqnivo.md`.)*

## 1. The widgetId

```
com.auraq.aqnivo.AqNivo
```

Client module `AqNivo`, files under `com/auraq/aqnivo`. One `.mpk`, and **no companion Mendix module** —
everything the widget needs is in the page.

## 2. A verified page-JSON skeleton

Read back with `pg_read_page` from `NivoGallery.ChartSample_Bar` and `NivoGallery.ChartSample_Datasource`
in the AqNivo test app, both of which render correctly in a browser.

### 2a. JSON mode — the common case

```jsonc
{
  "$Type": "CustomWidgets$CustomWidget",
  "widgetId": "com.auraq.aqnivo.AqNivo",
  "name": "aqNivoChart",              // unique on the page, camelCase
  "tabIndex": 0,
  "editable": "Always",
  "appearance": { "$Type": "Pages$Appearance", "class": "", "style": "",
                  "dynamicClasses": "", "designProperties": {} },
  "object": {                          // NOTE: no $Type on this node
    "dataMode": "json",
    "chartDataJson": { "$Type": "DomainModels$AttributeRef",
                       "attribute": "MyModule.MyEntity.DataJson" },
    "dataColumns": [],
    "chartType": "Bar",
    "renderer": "Svg",
    "atlasTheme": "full",
    "dynamicConfiguration": { "$Type": "DomainModels$AttributeRef",
                              "attribute": "MyModule.MyEntity.ConfigJson" },
    "functionProperties": [],
    "heightMode": "pixels",
    "containerHeight": 480,
    "aspectRatio": 1.6,
    "ct:emptyMessage": {
      "$Type": "Pages$ClientTemplate",
      "t:template": { "$Type": "Texts$Text", "translations": [
        { "$Type": "Texts$Translation", "languageCode": "en_US",
          "text": "No data for this chart." } ] },
      "parameters": [],
      "t:fallback": { "$Type": "Texts$Text", "translations": [
        { "$Type": "Texts$Translation", "languageCode": "en_US" } ] }
    },
    "ct:ariaLabel": {
      "$Type": "Pages$ClientTemplate",
      "t:template": { "$Type": "Texts$Text", "translations": [
        { "$Type": "Texts$Translation", "languageCode": "en_US",
          "text": "Claims volume by month, split by peril" } ] },
      "parameters": [],
      "t:fallback": { "$Type": "Texts$Text", "translations": [
        { "$Type": "Texts$Translation", "languageCode": "en_US" } ] }
    },
    "renderDataTable": true
  }
}
```

`chartDataSource`, `seriesAttribute`, `onClickAction`, `chartTypeExpression` and `staticConfiguration`
are **absent** above. That is the omission rule below, not an oversight.

### 2b. Data source mode — the only mode in which a click can carry a row

Everything in 2a applies; these are the differences.

```jsonc
"object": {
  "dataMode": "datasource",
  "chartDataSource": {
    "$Type": "CustomWidgets$CustomWidgetXPathSource",
    "entityRef": { "$Type": "DomainModels$DirectEntityRef", "entity": "MyModule.ChartRow" },
    "sortBar": { "$Type": "Pages$GridSortBar", "sortItems": [
      { "$Type": "Pages$GridSortItem",
        "attributeRef": { "$Type": "DomainModels$AttributeRef",
                          "attribute": "MyModule.ChartRow.SortOrder" },
        "sortDirection": "Ascending" } ] },
    "forceFullObjects": false,
    "xPathConstraint": "[Team = 'Motor']"
  },
  "dataColumns": [
    { "$Type": "CustomWidgets$WidgetObject",
      "columnAttribute": { "$Type": "DomainModels$AttributeRef",
                           "attribute": "MyModule.ChartRow.Period" },
      "outputKey": "period" },
    { "$Type": "CustomWidgets$WidgetObject",
      "columnAttribute": { "$Type": "DomainModels$AttributeRef",
                           "attribute": "MyModule.ChartRow.ClaimCount" },
      "outputKey": "claims" }
  ],
  "seriesAttribute": { "$Type": "DomainModels$AttributeRef",
                       "attribute": "MyModule.ChartRow.Team" },   // series charts only
  "onClickAction": {
    "$Type": "Pages$MicroflowClientAction",
    "microflowSettings": {
      "$Type": "Pages$MicroflowSettings",
      "parameterMappings": [],
      "t:progressMessage": { "$Type": "Texts$Text", "translations": [
        { "$Type": "Texts$Translation", "languageCode": "en_US" } ] },
      "outputMappings": [],
      "microflow": "MyModule.ACT_ChartRow_ShowDetail",
      "progressBar": "None",
      "asynchronous": false,
      "formValidations": "All"
    },
    "disabledDuringExecution": true
  },
  "staticConfiguration": "{\"indexBy\":\"period\",\"keys\":[\"claims\"],\"margin\":{\"top\":24,\"right\":24,\"bottom\":56,\"left\":64}}",
  "chartType": "Bar"
  // chartDataJson and dynamicConfiguration are absent in this mode
}
```

The microflow named by `onClickAction` takes **one parameter of the data source's entity** — the row the
clicked datum was drawn from. No parameter mapping is written; Mendix binds it positionally.

### 2c. A `functionProperties` entry

```jsonc
"functionProperties": [
  { "$Type": "CustomWidgets$WidgetObject",
    "propertyName": "valueFormat",
    "functionArguments": "d",
    "functionBody": "return d + '%';" }
]
```

Read back from the check harness, where an entry with an empty `propertyName` came back **without the
key at all** — so nested object-list entries follow the same omission rule as the top level.

### The presence / omission rule

Confirmed against every read-back above. This is **Studio Pro's serialisation behaviour, not this
widget's**, so it matches the rule already published for AgGrid rather than restating it from scratch.

| Property shape | How it serialises |
|---|---|
| Has a `defaultValue` in the widget XML | **always written**, even at its default — `dataMode`, `chartType`, `renderer`, `atlasTheme`, `heightMode`, `renderDataTable` |
| `required="true"` with a default | **always written** — `containerHeight` (400), `aspectRatio` (1.6) |
| List property, unset | **written as `[]`**, never omitted — `dataColumns`, `functionProperties` |
| `textTemplate` | **always written**, `ct:`-prefixed, as a `Pages$ClientTemplate` — `ct:emptyMessage`, `ct:ariaLabel` |
| Every other unset optional | **omitted entirely** — `chartDataJson`, `chartDataSource`, `seriesAttribute`, `onClickAction`, `chartTypeExpression`, `staticConfiguration`, `dynamicConfiguration` |

**Two consequences worth stating, because both cost time otherwise.**

**Key order inside `object` is not stable, and does not matter.** `atlasTheme` appears before
`dynamicConfiguration` on one page and after `ct:ariaLabel` on another; both render identically. Never
diff a read-back by key order.

**An instance placed before a property existed reads back without it, and still works.** The check
harness predates `dataMode`, `atlasTheme` and `renderDataTable` and carries none of the three; the
runtime falls back to the XML default. So a missing key means "never set here", not "set to something
odd" — and adding a property to the widget does not rewrite existing pages.

## 3. The valid combinations

### 3.1 Every property is tool-writable, in every mode

**`getProperties()` hides nothing, on purpose, and that is a fact a page-authoring agent needs.**
Several properties are mode-specific — `containerHeight` and `aspectRatio` on `heightMode`, the whole
data-source half of the Data group on `dataMode` — and the obvious design would hide them. This widget
does not, for two reasons, the second of which is about page tooling directly:

- hiding a property on a value the modeller is editing in the same sheet reshapes the sheet while it is
  in use, and has been observed showing the wrong value against the right caption with no error;
- **a hidden property cannot be written by page tooling.** `pg_patch_page` reports success,
  `ped_check_errors` is clean, and the value silently reverts to the XML `defaultValue`. A page switched
  to JSON mode would have had its payload overwritten and been told it worked.

`check()` warnings carry the same information and cannot do that. **So the usual "mark anything hidden
in this mode as tool-unwritable" table is empty for AqNivo: write any property in any mode.**

### 3.2 The property table

| Property | Type | Default | Notes |
|---|---|---|---|
| `dataMode` | enum `json` \| `datasource` | `json` | decides which half of the Data group applies |
| `chartDataJson` | attribute (String) | — | JSON mode. **Must be Unlimited length** |
| `chartDataSource` | datasource (list) | — | Data source mode |
| `dataColumns` | object list | `[]` | Data source mode; `columnAttribute` + `outputKey` |
| `seriesAttribute` | attribute | — | Data source mode, series charts only |
| `onClickAction` | action | — | Data source mode only |
| `chartType` | enum, 26 values | `Bar` | see §3.4 |
| `chartTypeExpression` | expression → String | — | returns a `chartType` key; overrides `chartType` |
| `renderer` | enum `Svg` \| `Canvas` \| `Html` | `Svg` | unsupported pair falls back to SVG |
| `atlasTheme` | enum `full` \| `chrome` \| `off` | `full` | bottom configuration layer |
| `staticConfiguration` | string, multiline | — | a JSON **object**; checked at design time |
| `dynamicConfiguration` | attribute (String) | — | **Must be Unlimited length** |
| `functionProperties` | object list | `[]` | `propertyName`, `functionArguments`, `functionBody` |
| `heightMode` | enum `pixels` \| `aspectRatio` \| `fillParent` | `pixels` | |
| `containerHeight` | integer, required | `400` | `pixels` only; **must be > 0** |
| `aspectRatio` | decimal, required | `1.6` | `aspectRatio` only; **must be > 0** |
| `emptyMessage` | textTemplate | — | serialises as `ct:emptyMessage` |
| `ariaLabel` | textTemplate | — | serialises as `ct:ariaLabel` |
| `renderDataTable` | boolean | `false` | tabular shapes only |

### 3.3 The cross-property rules, as the widget itself enforces them

Every row below is a real `check()` rule. They are listed because **each one is a silent failure at
runtime** — the chart draws, nothing throws, and the property sheet says the opposite of what happens.

| If | Then | Severity |
|---|---|---|
| `dataMode: "json"` | `chartDataJson` **must** be bound | error |
| `dataMode: "datasource"` | `chartDataSource` **must** be set, and `dataColumns` must have at least one entry | error |
| `dataMode: "datasource"` and the chart type has no data-source shape | not buildable — use JSON mode (§3.4) | error |
| `dataMode: "datasource"` and a **series** chart type | `seriesAttribute` **must** be set | error |
| `dataMode: "datasource"` and a **flat** chart type | `seriesAttribute` is ignored | warning |
| `onClickAction` set and `dataMode` is not `datasource` | the microflow is called with nothing, and looks like it works | error |
| `onClickAction` set on Stream, Bump or Area Bump | clicks identify a series, not a row — **it never fires** | warning |
| `onClickAction` set on **Line** without `"useMesh": true` | `useMesh` defaults to false, so no point has a click handler — **it never fires** | warning |
| `onClickAction` set on Line with `enableSlices` | a slice is several points, so there is no single row — **it never fires** | warning |
| `onClickAction` set on Line with `useMesh: true` | works, and the *whole plot area* becomes clickable — a click on empty space drills into the nearest point | warning |
| `staticConfiguration` is not valid JSON | dropped wholesale at runtime; the chart draws unstyled | error |
| a `@fn:` marker names something unregistered | the chart does not draw | error |
| a `functionBody` has no `return` | Nivo gets `undefined` and renders nothing for that property | error |
| `chartTypeExpression` set | `chartType` becomes a fallback only, and the expression cannot be checked at design time | warning |
| `renderer` is one this chart type lacks | falls back to SVG | warning |
| `heightMode: "pixels"` and `containerHeight <= 0` | **renders nothing at all**, with no error and no empty state | error |
| `heightMode: "aspectRatio"` and `aspectRatio <= 0` | same | error |
| `heightMode: "fillParent"` | needs an ancestor with a real height; Mendix layouts rarely give one | warning |
| `chartType: "GeoMap"` | bound data is **not passed at all** — geography comes from `features` in the configuration | warning |
| `atlasTheme: "full"` on a chart type with no categorical palette | behaves as `chrome` (§3.5) | warning |
| `atlasTheme: "full"` and the configuration also sets `colors` | the configuration wins; the chart keeps its palette while its text and axes follow the app | warning |
| no `ariaLabel` | a chart is an image to assistive technology — it is announced as nothing at all | warning |
| `renderDataTable` on a non-tabular shape | no table is rendered and the setting does nothing | warning |
| `renderer: "Canvas"` without `renderDataTable`, on a tabular shape | Canvas puts **no text in the DOM**; the label becomes the entire accessible content | warning |

### 3.4 The two lists of eight, and they are not the same list

**These overlap in only three places, and conflating them produces a confident recommendation for an
impossible binding.** Both were read out of the installed `@nivo` type declarations at 0.99.0.

**No data-source shape — JSON mode only** (a flat row list does not contain a tree, a graph, a matrix
or a GeoJSON collection):
`Bullet`, `Chord`, `CirclePacking`, `GeoMap`, `Network`, `Sankey`, `Sunburst`, `TreeMap`

**No categorical palette — `atlasTheme: "full"` behaves as `chrome`:**
`Bullet`, `Calendar`, `Choropleth`, `GeoMap`, `HeatMap`, `Network`, `TimeRange`, `Voronoi`

The three in both: `Bullet`, `GeoMap`, `Network`.

**Series charts** — need `seriesAttribute` in data source mode:
`AreaBump`, `Bump`, `HeatMap`, `Line`, `RadialBar`, `ScatterPlot`

**Renderers.** SVG for all 26. Canvas for 14: `Bar`, `Calendar`, `Chord`, `Choropleth`,
`CirclePacking`, `GeoMap`, `HeatMap`, `Line`, `Network`, `Pie`, `ScatterPlot`, `SwarmPlot`, `TreeMap`,
`Waffle`. HTML for 3: `CirclePacking`, `TreeMap`, `Waffle`.

### 3.5 The configuration layers

Four layers, later wins:

1. **Atlas theme** (`atlasTheme`) — derived from the app's live CSS variables, so a chart follows a
   theme the user switches without a reload. It is the *bottom* layer, so anything typed beats it.
2. **`staticConfiguration`** — JSON typed at design time.
3. **`dynamicConfiguration`** — a String attribute read at runtime.
4. **`functionProperties`** — the escape hatch, and it wins outright.

The merge is **shallow and deliberately so**: a deep merge would make it impossible to remove a nested
default from a lower layer. The one exception is `theme`, which is deep-merged into the Atlas theme;
`colors` replaces wholesale.

**`@fn:` markers, before you reach for a function.** Nivo 0.99 removed the "string names a field" form
for accessors such as `nodeSize`, and the removal is silent — the string is used as a value and the
chart renders NaN coordinates while reporting nothing. The widget restores it declaratively:

| Marker | Does |
|---|---|
| `"@fn:prop:size"` | reads `datum.size`; dotted paths work — `"@fn:prop:properties.fill"` |
| `"@fn:truncate:20"` | shortens a label to 20 characters |

Markers work at **runtime**, need no `unsafe-eval`, and are the right answer for anything a datum
accessor can express. Formatting does not need them at all: `valueFormat` and axis `format` take a
**d3-format string** directly, and colour takes `{"scheme":"..."}`, an explicit palette, or
`{"datum":"..."}`.

**`functionProperties` is the last resort, and it has a production failure mode.** Bodies are compiled
with `new Function`, which needs `unsafe-eval` in the page's Content-Security-Policy. Where that is
absent the constructor throws at runtime — against a widget that worked in development.

## 4. The model prerequisites the widget cannot express

None of these can live in a widget schema, and every one of them fails **silently**.

### 4.1 Both String attributes must be Unlimited length

`chartDataJson` and `dynamicConfiguration` bind String attributes carrying JSON. **Mendix truncates the
200-character default without saying so**, which turns valid chart JSON into malformed JSON, which the
widget then drops — so the chart draws with no data or no configuration and nothing reports why. Set
both attributes to Unlimited when you create them.

### 4.2 The data source must already be at chart granularity

**The widget never aggregates and never pages.** A Mendix data source cannot be asked for grouped rows,
so a widget that summed in the browser would be summing whatever it happened to hold — and charting one
page of rows while presenting it as the whole is not slow, it is wrong, and it looks entirely plausible.
So the widget takes the full list and sets no limit.

**Aggregate before the widget sees the data.** Any of:

- a **microflow data source** returning a non-persistable row entity, one object per data point;
- **`AqCommon.ExecuteOQLQuery`**, where the grouping is parameterised at runtime — the route that gets
  around the ceiling below;
- an **OQL view entity**, where the grouping is fixed at design time and the database does the work
  with no microflow behind it at all.

> **A view entity cannot group across an association, and `ped_check_errors` does not catch it.** The
> OQL parses, `syncViewEntity` derives the attributes, the page binds, every document is clean — and it
> throws at runtime with `Group by expression with association not supported`, naming a query nobody
> wrote (the outer select against the view entity, not your OQL). Denormalise the grouping key onto the
> fact table, or use `ExecuteOQLQuery`. Load a page bound to a view entity in a browser before believing
> it.

### 4.3 A click needs a row, which needs data source mode

`onClickAction` receives **one parameter of the data source's entity**. In JSON mode there is no Mendix
object behind a datum, so the microflow would be called with nothing — and would look like it was
working. The widget reports that as an error at design time.

### 4.4 The container must have a height

Nivo charts fill their container. **A chart in a container of zero height renders nothing at all, with
no error and no warning** — the most common way a correct configuration looks broken. `heightMode:
"pixels"` is the safe default; `"fillParent"` needs an ancestor with a real height, which Mendix layouts
rarely provide.

### 4.5 Geographic charts need a GeoJSON collection in the configuration

Both `GeoMap` and `Choropleth` read `features` from the **configuration**, never from bound data, and a
world feature collection is ~250 KB — far too large for a microflow literal. Read it from `resources/`
with a file-reading Java action at seed or load time and store it in the configuration attribute (which
is why 4.1 matters).

**Two `@nivo/geo` 0.99 traps, one of which no documentation will warn you about.**

**A Geo Map cannot be styled with `fill` match rules.** `GeoMapDefaultProps` declares `fill: []` and
`defs: []` and Nivo's own docs list both, but the GeoMap component reads neither — `bindDefs` is called
only from `Choropleth`. A configuration written from the documentation is accepted, ignored, and reports
nothing. The route that works is `fillColor` as an **accessor**, which both renderers honour:

```jsonc
{ "fillColor": "@fn:prop:properties.fill",
  "features": [ { "type": "Feature", "id": "GBR",
                  "properties": { "fill": "#2f6fb5" }, "geometry": { } } ] }
```

Do **not** use the shortcut of a top-level `fill` on each feature: `GeoMapFeature` renders
`fill={feature?.fill ?? fillColor}`, so it styles the SVG with no configuration change at all and is
silently ignored by Canvas. The accessor form is what makes the two renderers agree.

**`GeoMapCanvas` leaves `layers` undefaulted** where the SVG component defaults it, so it throws
`layers.forEach`. **AqNivo 2.0.0 supplies that default itself**, so page authors do not meet this — it
is recorded here only so a future Nivo upgrade knows what the workaround was for.

**Choose the right one of the two.** Geo Map is a base map with no value scale: it answers *where*, and
is styled by rule. Whenever there is a value per country, **Choropleth** is the right chart.

### 4.6 The widget will not draw a chart it knows Nivo would throw on

**This is a guarantee worth relying on, and it changes what a page author has to think about.** Nivo
dereferences several props without defaulting them, so a chart handed the wrong data or an incomplete
configuration **throws** rather than rendering badly. AqNivo checks first and reports the **empty**
state with a detail line naming what is missing.

It matters most on a page that lets the **user choose the chart type**: the type changes in one commit
and the data and configuration arrive in the next, so for one render the new type holds the old
payload. Without the guard that render throws, and while `ChartErrorBoundary` catches it, **React logs
every error a boundary catches and no wrapper can suppress that** — so the console fills up on a page
that looks and behaves correctly.

What the guard checks, all of it derived by measurement rather than from Nivo's documentation:

| Kind | Applies to | Detail line names |
|---|---|---|
| **Geography** | Geo Map, Choropleth | a missing `features` collection |
| **Element shape** | the six series charts, Chord, Calendar, Time Range, Bullet | a flat list where series are needed, records where a matrix is needed, a missing `day`, missing `ranges`/`measures` |
| **Required configuration** | Chord, Radar, Stream (`keys`); Marimekko (`id`, `value`, `dimensions`) | the missing key |
| **Configuration vs data** | Radar, Stream, Marimekko, Chord | configured keys or dimensions the data does not carry; a Chord key count that does not match the matrix |

**A partial match passes deliberately.** A stacked chart legitimately has datums missing some keys — a
series that starts late, a category with no value this month — so only a datum carrying *none* of the
configured keys is treated as the wrong payload.

**Only the first element of an array is inspected.** A heterogeneous array whose first entry is
well-formed and whose tenth is not still reaches Nivo. This is a guard against the wrong payload, not a
validator of a correct one.

### 4.7 Nothing else

No companion Mendix module, no constants, no Java actions of the widget's own, no entity the widget
requires. The enclosing data view can be over anything; the widget only needs whatever object carries
its bound attributes.

## 5. Envelope quirks

**Both quirks published for earlier AuraQ widgets were re-tested on 11.12.4 and neither now applies.**
Following them costs manual steps that no longer exist, so the corrections matter more than the rules.

| Previously published | On 11.12.4 |
|---|---|
| *"`pg_patch_page` silently discards a custom widget's own `appearance.class`"* | **False here.** Re-tested 2026-09-07 with a discriminating probe — a class on a custom widget *and* on a native widget nested inside it, in one call. Both persisted, and the deployed page rendered them. Write `appearance.class` with `pg_patch_page` |
| *"`t:progressMessage` must always be written as `""` on every `Pages$MicroflowSettings`"* | **Retired.** Re-tested 2026-09-07 against a widget built with the property omitted entirely: the app started, the button worked, and a real F4 / Version Control → Update exported cleanly. Studio Pro also writes the key itself — the read-back in §2b has it |

Two quirks that **do** apply:

- **`pg_patch_page` silently discards a page `url`.** Set it with `ped_update_document` and read it back.
  Unrelated to this widget, but it catches anyone building the example pages.
- **`ped_check_errors` is not a build.** It only checks the documents you name — name every document you
  touched, not just the page. A page button calling a microflow makes that *microflow* require allowed
  roles, and the error is reported there.

## Rule 3 — what is not verified

Named field by field, so the next Studio Pro session can close these in minutes rather than
rediscovering what is missing.

| Not verified | Why it is open | Cost to close |
|---|---|---|
| `heightMode: "fillParent"` serialisation | no page in the test app uses it; `pixels` and `aspectRatio` were both read back and the enum serialises as its key, so this is inference, not evidence | one property change and a read-back |
| `conditionalVisibilitySettings` on this widget | never set on any instance, so absent from every read-back. The schema carries the node and it is a generic `Pages$Widget` concern, not a widget-specific one | one property change and a read-back |
| `appearance.class` **on AqNivo specifically** | the 11.12.4 retirement above was proven on a Data Grid 2 and a nested DynamicText, not on this widget | one patch and a read-back |
| `chartTypeExpression` end-to-end at runtime | the serialisation was read back from the check harness (`"'ResponsiveBar'"`, deliberately invalid, to trigger the check). A *valid* expression switching the chart in a running app has not been driven | one page and one browser load |
| `functionProperties` under a CSP without `unsafe-eval` | Mendix Cloud's default policy has not been tested. If it omits `unsafe-eval`, function bodies are inert in production while working locally | one cloud deploy |
| Datasource mode above ~2,000 rows | the widget deliberately takes the whole list with no limit; the practical ceiling has not been measured | one large dataset |

---

# Part C — the VFS auto-schema, captured

**Do not paste this into the knowledge base.** It is machine-generated, already present in any project
that installs the widget, and would drift the moment the XML changed. It is here so the guidance
maintainer — who is not in such a project — can check Part B's property table against reality.

Captured 2026-09-08 from the AqNivo test app:

```
glob("/pagegen/customWidgetsVFS/**/*.json")
read_file("/pagegen/customWidgetsVFS/com.auraq.aqnivo.AqNivo.schema.json")
```

## What checking it found

**It is accurate, and it is semantically empty.** Every property is present with the right type and the
right enum values, `ct:emptyMessage` and `ct:ariaLabel` are correctly `ct:`-prefixed, and every
`<description>` is carried through **verbatim** — which is a second reason to write those properly.
Nothing is advertised that the widget does not read.

Four findings, in order of how much they cost a page author:

1. **Required-ness is gone.** The `object` node has no `required` array at all, so nothing in the
   schema says `chartDataJson` is mandatory in JSON mode, or that `dataColumns` needs an entry in data
   source mode. Every rule in §3.3 is invisible to it. `critical: true` does appear on
   `chartDataJson`, `onClickAction`, `staticConfiguration` and `functionBody`, which is a hint at
   importance but not at conditionality.
2. **Three properties are collapsed to a note.** `dataColumns.columnAttribute`, `seriesAttribute` and
   `dynamicConfiguration` all read
   `{"note": "Recursive type — already described above. Use its schema to create instances."}`, because
   they share `DomainModels$AttributeRef` with `chartDataJson`, which was serialised first. **Their
   allowed shape is invisible in the schema** — §2a and §2b are the only place a page author can see it.
3. **No cross-property rules, structurally.** Everything in §3.3 and §3.4 lives in `check()`, which is
   code. The schema cannot know that eight chart types have no data-source shape, or that `onClickAction`
   never fires on Stream.
4. **No model prerequisites.** Nothing about Unlimited attribute lengths, pre-aggregation or container
   height has anywhere to go in a widget schema. §4 is the whole of it.

## The captured schema, verbatim

```json
{"elementType":"CustomWidgets$CustomWidget","schema":{"description":"Nivo data visualisation — 26 chart types behind one property surface. Pick a chart type, bind the data, and configure the chart with JSON. Full property reference, data shapes and theming notes: https://github.com/lindski/aq-mx-nivo#property-reference","type":"$constructor","properties":{"widgetId":{"type":"string","description":"The id of the custom widget, which has to be used within the pagegen skill to include custom widgets on a page.","default":"com.auraq.aqnivo.AqNivo"},"name":{"type":"string"},"appearance":{"type":"$element","elementType":"Pages$Appearance","properties":{"class":{"type":"string"},"style":{"type":"string"},"designProperties":{"type":"array","items":{"type":"$constructor","elementType":"Pages$DesignPropertyValue","properties":{"key":{"type":"string"},"value":{"type":"$abstractElement","allowedTypes":{"Pages$CompoundDesignPropertyValue":""}}}}},"dynamicClasses":{"type":"string"}},"required":[]},"tabIndex":{"type":"integer"},"conditionalVisibilitySettings":{"type":"$element","elementType":"Pages$ConditionalVisibilitySettings","properties":{"attribute":{"type":"$reference","referredType":"DomainModels$Attribute","referenceType":"by-name"},"conditions":{"type":"array","items":{"type":"$element","elementType":"Enumerations$Condition","properties":{"attributeValue":{"type":"string"},"editableVisible":{"type":"boolean","default":true}},"required":[],"description":"Defines a condition that can be used to control visibility."}},"expression":{"type":"string"},"sourceVariable":{"type":"$element","elementType":"Pages$PageVariable","properties":{"widget":{"type":"$reference","referredType":"Pages$Widget","referenceType":"local-by-name"},"pageParameter":{"type":"$reference","referredType":"Pages$PageParameter","referenceType":"local-by-name"},"snippetParameter":{"type":"$reference","referredType":"Pages$SnippetParameter","referenceType":"local-by-name"},"localVariable":{"type":"$reference","referredType":"Pages$LocalVariable","referenceType":"local-by-name"},"useAllPages":{"type":"boolean","default":false},"subKey":{"type":"string"}},"required":[]},"moduleRoles":{"type":"array","items":{"type":"$reference","referredType":"Security$ModuleRole","referenceType":"by-name"}},"ignoreSecurity":{"type":"boolean"}},"required":[]},"object":{"type":"$object","properties":{"dataMode":{"type":"anyOfValues","values":["json","datasource"],"description":"Where the chart's data comes from. JSON string supports every chart type; Data source binds an ordinary Mendix list and is the only mode in which a click can carry its row to a microflow. Eight chart types are JSON only — the property sheet says which when you pick one."},"chartDataJson":{"type":"$element","elementType":"DomainModels$AttributeRef","properties":{"entityRef":{"type":"$element","elementType":"DomainModels$IndirectEntityRef","properties":{"steps":{"type":"array","description":"Ordered list of association traversal steps to reach the target entity.","items":{"type":"$element","elementType":"DomainModels$EntityRefStep","properties":{"association":{"type":"$reference","referredType":"DomainModels$AssociationBase","referenceType":"by-name","description":"Reference to the association to traverse."},"destinationEntity":{"type":"$reference","referredType":"DomainModels$Entity","referenceType":"by-name","description":"Reference to the destination entity of this step."}},"required":["association","destinationEntity"],"description":"Represents a single step in traversing associations to reach a target entity (used for indirect entity references)."}}},"required":[],"description":"Indirect reference to an entity through a chain of associations."},"attribute":{"type":"$reference","referredType":"DomainModels$Attribute","referenceType":"by-name","description":"Reference to an attribute by its qualified name."}},"required":["attribute"],"description":"Used when Data from is JSON string. String attribute holding this chart's data as JSON, in the shape the chart type expects. The attribute must be Unlimited length: Mendix truncates the 200-character default silently, which turns valid chart JSON into malformed JSON.\nRepresents a reference to an entity attribute, optionally reached through association traversal..","critical":true},"chartDataSource":{"type":"$abstractElement","description":"Used when Data from is Data source. The list to draw, one row per data point, already at chart granularity. The widget never aggregates and never pages — aggregate in a microflow first, or a page of rows is drawn as though it were the whole.","allowedTypes":{"Pages$ListenTargetSource":"","Pages$AssociationSource":"","Pages$DataViewSource":"","Pages$ImageViewerSource":"","Pages$GridXPathSource":"","Pages$ReferenceSetSource":"","Pages$ListViewXPathSource":"","CustomWidgets$CustomWidgetXPathSource":"","Pages$NanoflowSource":"","Pages$MicroflowSource":""}},"dataColumns":{"type":"array","description":"Used when Data from is Data source. Maps each attribute onto the key the chart expects, so no JSON is written anywhere. Attributes that are not mapped are left out of the datum.","items":{"type":"$object","properties":{"columnAttribute":{"type":"$element","elementType":"DomainModels$AttributeRef","note":"Recursive type — already described above. Use its schema to create instances."},"outputKey":{"type":"string","description":"The key this attribute becomes in the chart datum — id, value, x, y, or a series name. Leave empty to use the attribute's own name. Two columns writing the same key is reported rather than allowed."},"elementType":{"type":"anyOfValues","values":["CustomWidgets$WidgetObject"]}}}},"seriesAttribute":{"type":"$element","elementType":"DomainModels$AttributeRef","note":"Recursive type — already described above. Use its schema to create instances."},"onClickAction":{"type":"$abstractElement","description":"Runs when a datum is clicked, receiving the Mendix row it was drawn from. Requires Data from to be Data source. Nothing fires on Stream, Bump or Area Bump, whose clicks identify a series rather than a row. Leaving this empty also removes the chart's pointer cursor and hover affordances.","critical":true,"allowedTypes":{"Pages$CancelChangesClientAction":"","Pages$CancelSynchronizationClientAction":"","Pages$ClosePageClientAction":"","Pages$NoClientAction":"","Pages$DeleteClientAction":"","Pages$CallNanoflowClientAction":"","Pages$MicroflowClientAction":"","Pages$CreateObjectClientAction":"","Pages$PageClientAction":"","Pages$SaveChangesClientAction":"","Pages$SignOutClientAction":"","Pages$OpenLinkClientAction":"","Pages$SyncClientAction":"","Pages$CallWorkflowClientAction":"","Pages$OpenUserTaskClientAction":"","Pages$OpenWorkflowClientAction":"","Pages$SetTaskOutcomeClientAction":""}},"chartType":{"type":"anyOfValues","values":["AreaBump","Bar","Bullet","Bump","Calendar","Chord","Choropleth","CirclePacking","Funnel","GeoMap","HeatMap","Line","Marimekko","Network","Pie","Radar","RadialBar","Sankey","ScatterPlot","Stream","Sunburst","SwarmPlot","TimeRange","TreeMap","Voronoi","Waffle"],"description":"Which Nivo chart to render. Each chart type expects its own data shape and its own configuration properties, so changing this usually means changing the bound data too. This names the chart's form only; how it is drawn is the Renderer property below."},"chartTypeExpression":{"type":"string","description":"Optional. An expression returning one of the chart type keys above, so the chart type can follow the data rather than being fixed when the page is built. Overrides Chart type when it returns a recognised key. An unrecognised value is reported, not ignored."},"renderer":{"type":"anyOfValues","values":["Svg","Canvas","Html"],"description":"How the chart is drawn. SVG suits every chart type; Canvas is for high element counts; HTML exists for three hierarchical charts. An unsupported pair falls back to SVG with a design-time warning. Canvas puts no label text in the DOM, so screen readers and browser text search get only the Accessible label."},"atlasTheme":{"type":"anyOfValues","values":["full","chrome","off"],"description":"Whether the chart takes its look from the app's Atlas theme. Read live from the app's CSS variables, so the chart follows a theme the user switches without a reload. This is the BOTTOM layer: any key in the static or dynamic configuration overrides it. Eight chart types take no categorical palette and ignore Full."},"staticConfiguration":{"type":"string","description":"Chart configuration as a JSON object, fixed at design time. Merged first, so any key set here is overridden by the same key in the dynamic configuration or a function property. Must be a valid JSON object; it is checked at design time.","critical":true},"dynamicConfiguration":{"type":"$element","elementType":"DomainModels$AttributeRef","note":"Recursive type — already described above. Use its schema to create instances."},"functionProperties":{"type":"array","description":"Last resort, for the few Nivo properties needing a function no other route can supply. Try a d3-format string or an @fn: marker first — both work at runtime. Function bodies are design-time only, are not type-checked, and need 'unsafe-eval' in the page's Content-Security-Policy. Merged last, so they win.","items":{"type":"$object","properties":{"propertyName":{"type":"string","description":"The Nivo configuration property this function is assigned to, e.g. tooltip, valueFormat, colors. Spelling is not validated — a name Nivo does not recognise is silently ignored."},"functionArguments":{"type":"string","description":"Comma-separated argument names for the function, matching what Nivo passes for this property — often a single argument such as datum or value. Leave empty for a function that takes none."},"functionBody":{"type":"string","description":"The function body, without the surrounding declaration or braces. It must return a value: a body that falls off the end returns undefined, which Nivo renders as an empty tooltip or a missing label. Syntax is checked at design time.","critical":true},"elementType":{"type":"anyOfValues","values":["CustomWidgets$WidgetObject"]}}}},"heightMode":{"type":"anyOfValues","values":["pixels","aspectRatio","fillParent"],"description":"How the chart's height is decided. Nivo charts fill their container, so a chart in a container of zero height renders nothing at all, with no error."},"containerHeight":{"type":"integer","description":"Chart height in pixels. Used only when Height mode is Fixed pixels; ignored otherwise."},"aspectRatio":{"type":"double","description":"Width divided by height — 1.6 is roughly 16:10, 1 is square. Used only when Height mode is Aspect ratio; ignored otherwise."},"ct:emptyMessage":{"type":"string","description":"Shown instead of the chart when the bound data is an empty array. Without it several chart types render an empty axis frame that reads as a broken chart. Leave empty to use the default text."},"ct:ariaLabel":{"type":"string","description":"Describes what the chart shows, for screen readers — without it the chart is announced as nothing at all. Say what is measured and over what, e.g. \"Claims volume by month, split by peril\", not \"bar chart\"."},"renderDataTable":{"type":"boolean","description":"Also render the chart's data as a visually-hidden table, so a screen reader gets the numbers rather than only the label. Strongly recommended with the Canvas renderer, which puts no text in the DOM at all. Only tabular shapes can be rendered — hierarchies, graphs, Chord's matrix and Geo Map's geography produce nothing."},"elementType":{"type":"anyOfValues","values":["CustomWidgets$WidgetObject"]}}}}}}
```

---

# Part D — the rendered DOM

*(Folds into the Part A record's `design.snapshot`.)*

Captured 2026-09-08 from `NivoGallery.ChartSample_Bar` in the running app — a Bar chart with real data,
`renderer: "Svg"`, `renderDataTable: true`, so both branches of the tree are present. Read back with:

```js
document.querySelector('.mx-name-aqNivoChart')
```

```jsonc
{
  "fidelity": "captured",
  "note": "aq-nivo* classes are ours and are stable API. Nivo itself emits NO classes at all — see the negatives.",
  "tree": [
    "div.aq-nivo.mx-name-<widgetName>",
    "  div.aq-nivo__chart[role=img][aria-label]",     // role is HERE, not on the root
    "    div                                    ",     // Nivo ResponsiveWrapper, unclassed
    "      div                                  ",     // Nivo container, unclassed
    "        svg[role=img]                      ",     // or <canvas> when renderer is Canvas
    "          rect, g, g, ...                  ",     // all unclassed
    "  div.aq-nivo__sr-only",                          // only when renderDataTable is on
    "    table > caption, thead, tbody"
  ]
}
```

**States replace the chart branch entirely**, and share one block:

```
div.aq-nivo > div.aq-nivo__state.aq-nivo__state--empty      // also --error, --loading
                > span                                      // the message
                > span.aq-nivo__state-detail                // optional second line
```

A non-fatal warning is announced rather than drawn, as a `span.aq-nivo__sr-only[role=status]` sibling.

## The negatives — this is what stops the next author guessing

- **No Nivo classes anywhere.** Not `.nivo-*`, not on the `<svg>`, not on any `<g>`. Nivo styles
  everything with attributes and inline values, so there is no vendor class tree to target and no
  vendor class tree to mimic. This is the "wraps is not emits" trap: the widget wraps Nivo and emits
  none of it.
- **No `<table>` unless `renderDataTable` is on**, and when it is, the table is visually hidden and is
  **not** the chart — it is the accessible alternative.
- **No text in the DOM at all under `renderer: "Canvas"`.** The chart is one `<canvas>` bitmap: no tick
  labels, no legend, nothing for a browser text search. Only `aria-label` and the optional table carry
  meaning.
- **Two unclassed wrapper `div`s** sit between `.aq-nivo__chart` and the drawing. They are Nivo's
  responsive wrapper; do not style through them.

**Ours vs the vendor's.** `aq-nivo`, `aq-nivo__chart`, `aq-nivo__sr-only`, `aq-nivo__state`,
`aq-nivo__state--empty|error|loading`, `aq-nivo__state-detail` are this widget's own BEM hooks and are
stable API. Everything below the `<svg>` belongs to Nivo and moves on a dependency bump.
