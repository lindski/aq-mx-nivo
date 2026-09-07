# AqNivo

Nivo data visualisation for Mendix — 26 chart types behind one property surface.
Wraps [nivo](https://github.com/plouc/nivo).

Pick a chart type, bind the data, and configure it with JSON. One widget rather than 26 keeps the
toolbox usable and makes the chart type a property rather than a re-placement.

> **2.0 is in progress and is a breaking rebuild.** The widget id changed, so **every placed instance
> of 1.0.0 must be re-placed by hand**. See [CHANGELOG.md](CHANGELOG.md).

## Requirements

| | |
|---|---|
| Mendix Studio Pro | 11.12 or later (developed against 11.12.4) |
| Node (development only) | **≥ 22.20** — see [docs/build-notes.md](docs/build-notes.md); the declared `>=20` is not the effective floor |
| Licence | Apache-2.0. Nivo itself is MIT — **no entitlement or gate applies** |

## Features

- **26 chart types in one widget**, selected by an enumeration property, or by an expression so the
  chart type can follow the data.
- **Three renderers** — SVG for every chart type, Canvas for fourteen, HTML for three.
- **Two data modes** — a JSON string for every chart type, or an ordinary Mendix data source for
  eighteen of them, with attributes mapped onto chart keys.
- **Click through to a microflow**, receiving the Mendix row the datum was drawn from.
- **Matches the app's Atlas theme** by default, live — including a theme the user switches.
- **Accessible** — a labelled chart plus an optional visually-hidden data table, which is the only
  route to the values on a Canvas chart.
- **Layered configuration** — static (typed into the widget), dynamic (bound to an attribute) and
  function properties, merged in that order, so a later layer overrides an earlier one.

## Usage

1. Add the widget to a page and choose a chart type.
2. Bind the data. **A String attribute holding JSON must be Unlimited** — the Mendix 200-character
   default truncates chart JSON into malformed JSON, and the symptom is a parse warning in the
   browser console that reads as a broken generator rather than a too-short column.
3. Configure it: static JSON, and/or an attribute holding JSON, and/or function properties.
4. Shape both payloads according to the chart type — the table below links each to its Nivo page.

For authoring a page *containing* this widget with tooling, see
[docs/page-authoring.md](docs/page-authoring.md).

## Supported charts

| Chart | Reference | Chart | Reference |
|---|---|---|---|
| Area Bump | <https://nivo.rocks/area-bump/> | Pie | <https://nivo.rocks/pie/> |
| Bar | <https://nivo.rocks/bar/> | Radar | <https://nivo.rocks/radar/> |
| Bullet | <https://nivo.rocks/bullet/> | Radial Bar | <https://nivo.rocks/radial-bar/> |
| Bump | <https://nivo.rocks/bump/> | Sankey | <https://nivo.rocks/sankey/> |
| Calendar | <https://nivo.rocks/calendar/> | Scatter Plot | <https://nivo.rocks/scatterplot/> |
| Chord | <https://nivo.rocks/chord/> | Stream | <https://nivo.rocks/stream/> |
| Choropleth | <https://nivo.rocks/choropleth/> | Sunburst | <https://nivo.rocks/sunburst/> |
| Circle Packing | <https://nivo.rocks/circle-packing/> | Swarm Plot | <https://nivo.rocks/swarmplot/> |
| Funnel | <https://nivo.rocks/funnel/> | Time Range | <https://nivo.rocks/time-range/> |
| Geo Map | <https://nivo.rocks/geomap/> | Tree Map | <https://nivo.rocks/treemap/> |
| Heat Map | <https://nivo.rocks/heatmap/> | Voronoi | <https://nivo.rocks/voronoi/> |
| Line | <https://nivo.rocks/line/> | Waffle | <https://nivo.rocks/waffle/> |
| Marimekko | <https://nivo.rocks/marimekko/> | | |
| Network | <https://nivo.rocks/network/> | | |

---

# Property reference

The `<description>` on each property in `src/AqNivo.xml` is deliberately **one or two sentences** —
it is hover text in a property sheet, where a paragraph is unreadable. This section is where the
detail lives. Anything that causes a **silent** failure is kept in both places, because a warning
nobody sees is worth nothing.

> **The XML descriptions are not only hover text.** Mendix copies each one verbatim into
> `/pagegen/customWidgetsVFS/com.auraq.aqnivo.AqNivo.schema.json`, which is what an agent authoring a
> page against this widget reads. Keeping them short therefore moves detail *out* of that path, and
> the deliberate mitigation is [docs/page-authoring.md](docs/page-authoring.md) → the published
> `get_widget_reference` entry, which carries the model prerequisites and cross-property rules a
> schema could never express anyway. **If you shorten a description further, make sure the fact you
> removed lands in that reference.**

## Data

### Data from (`dataMode`)

| | |
|---|---|
| **JSON string** | The app builds the payload in the shape Nivo expects and binds it to a String attribute. Supports **all 26** chart types. |
| **Data source** | Binds an ordinary Mendix list and maps attributes onto chart keys. Supports **18**. The only mode in which a click can carry its row to a microflow. |

Data source cannot express a tree, a graph, a numeric matrix or GeoJSON, so **eight chart types are
JSON only**:

> Bullet · Chord · Circle Packing · Geo Map · Network · Sankey · Sunburst · Tree Map

The property sheet says so when you pick one. Note this is **not** the same eight as the chart types
that ignore the theme palette (below) — the two lists overlap but differ, and conflating them is easy.

Of the eighteen that are supported, twelve take a **flat** row list (one row, one datum) and six take
**series** — Area Bump, Bump, Heat Map, Line, Radial Bar and Scatter Plot — built by partitioning
rows on the *Series* attribute.

### Chart data (`chartDataJson`)

Used when *Data from* is **JSON string**. See nivo.rocks for the shape each chart type expects.

**The attribute must be set to Unlimited length in the domain model.** Mendix defaults a String
attribute to 200 characters and truncates it **silently**, which turns valid chart JSON into
malformed JSON. The chart then shows a parse error for a reason that is invisible from the page, and
reads as a broken data source rather than a too-short column. This is the single most common way to
lose an afternoon with this widget.

### Chart rows (`chartDataSource`)

Used when *Data from* is **Data source**. One row per data point.

**Give it rows that are already at chart granularity.** A Mendix data source cannot be asked for
grouped or aggregated rows, so aggregate in a microflow and return the result. The widget never
aggregates and never pages: it draws every row it is given, because charting one page and presenting
it as the whole is not slow, it is **wrong**, and it looks entirely plausible.

A chart is aggregated by nature, so tens or low hundreds of rows is the expected size. Binding a raw
transaction table will be slow and the chart will be unreadable.

### Columns (`dataColumns`)

Maps each attribute onto the key the chart expects, so no JSON is written anywhere. A Pie needs `id`
and `value`; a Bar needs the index key plus one key per series; a point chart needs `x` and `y`. See
nivo.rocks for the keys a given chart type reads. Attributes that are not mapped are simply left out
of the datum.

**Chart key** — leave it empty to use the attribute's own name, which is convenient when the domain
model already matches. Two columns writing the same key is **reported rather than allowed**: one
would silently overwrite the other and the chart would draw with a column missing.

### Series (`seriesAttribute`)

Used only by the chart types that draw several series — **Line, Scatter Plot, Heat Map, Radial Bar,
Bump and Area Bump**. The rows are split on this attribute, and each distinct value becomes one
series carrying its own points, in the order the data source returned them.

Splitting is not aggregating: no row is combined with another, which is why it is allowed where
summing is not. Leave it empty for every other chart type.

## Events

### On click (`onClickAction`)

Runs when a datum is clicked, receiving the row it was drawn from — so a chart becomes a way *into*
the data rather than a picture of it.

- **Requires *Data from* to be Data source.** In JSON string mode there is no row to pass, and a
  click that arrives with nothing is worse than no click at all.
- **The microflow gets the Mendix object behind the datum, not the datum.** A click on a stacked bar
  segment or a line point identifies one row, and that row is what arrives.
- **Series-level charts fire nothing.** Stream, Bump and Area Bump have clicks that are about a whole
  series rather than one row, so they cannot identify a single row.
- **Leaving it empty is meaningful, not merely unset.** The chart is then rendered with no click
  handler at all, so it does not take on the pointer cursor and hover affordances that would tell a
  user it can be clicked.

## Chart

### Chart type (`chartType`) and Chart type dynamic (`chartTypeExpression`)

Each chart type expects its own data shape and accepts its own configuration properties, so changing
it usually means changing the bound data as well. The property names the chart's **form** only; how
it is drawn is *Renderer*.

The expression form lets the chart type follow the data instead of being fixed when the page is
built — a dashboard where the user picks a visualisation, or a chart whose form depends on the
record. Where the key comes from a Mendix enumeration, `getKey($currentObject/YourAttribute)` returns
it directly. When set and returning a recognised key it overrides *Chart type*; when empty, *Chart
type* is used.

An unrecognised value is **not** silently ignored: the widget shows an error naming the value it was
given, because a chart that quietly renders the wrong type is worse than one that says it cannot.

> **Upgrading from 1.x:** before 2.0 these keys carried a `Responsive` prefix and folded in the
> drawing technology. An expression written against 1.x needs updating.

### Renderer (`renderer`)

| | |
|---|---|
| **SVG** | Default. Every chart type supports it. |
| **Canvas** | Draws to a bitmap. Worth choosing where the element count is high enough that SVG becomes slow — large scatter plots, dense heat maps, long calendars. **Fourteen** chart types have it. |
| **HTML** | Lets labels use ordinary text layout. **Three** hierarchical charts have it. |

Choosing a renderer a chart type does not have is **not an error** — the chart is drawn as SVG
instead, since the same chart is shown either way — but it is reported as a warning at design time so
the choice is not silently doing nothing.

**Know the accessibility trade-off before choosing Canvas.** SVG and HTML put every label in the DOM,
where a screen reader and a browser text search can reach them. **Canvas puts none of them there** — a
Canvas chart is a single bitmap whose only accessible content is the *Accessible label* property.
Prefer SVG unless the element count actually demands otherwise.

Note also that Nivo's Canvas variants are not always feature-identical to their SVG counterparts:
`TreeMapCanvas`, for one, has no parent-label layer, so a Canvas tree map shows no parent tiles or
labels. That is Nivo, not this widget.

## Configuration

The three configuration layers are merged in a fixed order, and a later layer wins on any key set in
more than one:

```
Match app theme  →  Configuration (static)  →  Configuration (dynamic)  →  Configuration (functions)
```

### Configuration (static) (`staticConfiguration`)

A JSON object typed into the widget and fixed at design time. Use it for everything that does not
change at runtime — axes, legends, margins, colour schemes. Must be a valid JSON object; it is
checked at design time.

### Configuration (dynamic) (`dynamicConfiguration`)

A String attribute holding a JSON object, so configuration can be built or changed at runtime — a
colour scheme the user picks, a legend that depends on the data. Leave it unbound if all
configuration is static. **Must be Unlimited length**, for the same reason the chart data must be.

**More is expressible here than it first appears**, which matters because everything expressible here
works at runtime and needs no `unsafe-eval`:

| Need | Write |
|---|---|
| Number or date formatting | a **d3-format string** — `".1%"`, `"~s"`, `"%b %Y"` — directly as `valueFormat` or an axis `format` |
| A colour scheme | `{"scheme":"nivo"}`, an explicit array, or `{"datum":"data.color"}` |
| A value read off each datum | a **function marker** — `"@fn:prop:size"`, or `"@fn:prop:data.color"` to walk a path |
| Shortening a long label | `"@fn:truncate:20"` |

Markers resolve by name against a fixed set the widget ships (`prop` and `truncate`), so a
configuration that names something unregistered cannot become arbitrary code — the worst it can do is
name something that does not exist, which is reported.

> **The one thing to be wary of: a configuration value that names a field BARE.** Nivo 0.99 removed
> that form, so `"nodeSize": "size"` is now read as a *value* rather than an accessor — the chart
> renders NaN coordinates and reports nothing. `"@fn:prop:size"` is what it should now say. This was
> the first empirically confirmed 0.80 → 0.99 breaking prop change, and it was invisible to every
> gate available: the typings still admit a `string`, just as the output type rather than as an
> accessor.

### Configuration (functions) (`functionProperties`)

**The last resort.** Try the other two routes first — both work at runtime and carry none of the
costs below.

Only when neither fits — a tooltip whose content is computed, say — write a body here. Merged last,
so a function property wins over both a marker and a JSON value on the same key.

The costs, and they are why this is last:

- the bodies are **not type-checked**, and run with whatever Nivo passes them;
- they **cannot be set at runtime at all**, because this is a design-time list;
- compiling them needs **`unsafe-eval`** in the page's Content-Security-Policy.

**Property name** — spelling is not validated; a name Nivo does not recognise is silently ignored by
the chart. **Body** — must return a value: a body that falls off the end returns `undefined`, which
Nivo usually renders as an empty tooltip or a missing label rather than an error.

## Display and Accessibility

### Height mode (`heightMode`)

Nivo charts fill their container, so **the container must have a height from somewhere** — a chart in
a container of zero height renders nothing at all, with no error. *Fixed pixels* uses
`containerHeight`; *Aspect ratio* takes the width from the page and derives height from `aspectRatio`
(1.6 ≈ 16:10, 1 = square); *Fill parent* leaves it to the surrounding layout.

### Empty message (`emptyMessage`)

Shown instead of the chart when the bound data is an empty array. Without it several chart types
render an empty axis frame that looks like a broken chart rather than an absence of data, and a few
throw.

### Accessible label (`ariaLabel`)

**A chart is an image to assistive technology: without this it is announced as nothing at all.** Say
what is being measured and over what — "Claims volume by month, split by peril", not "bar chart".

The label goes on the chart element itself as `role="img"`, deliberately **not** on the widget's root.
That role makes an element's whole subtree presentational, so anything inside it is not exposed —
which on the root would silently swallow the loading state's `aria-live`, the configuration warnings'
`role="status"`, and the data table below.

### Include data table (`renderDataTable`)

**The label says what the chart is about; this is what carries the numbers.** Without it a
screen-reader user gets the topic and not one value. The table is rendered after the chart, hidden
with the clip-rect technique rather than `display: none` — which would remove it from the
accessibility tree as well as from view, leaving it doing nothing while looking correct.

**It matters most with Canvas**, which puts no text in the DOM at all: no tick labels, no legend, no
value labels. The accessible label is then the *entire* accessible content, and a browser text search
finds nothing either. `check()` warns when Canvas is selected without it.

**Only tabular shapes can be rendered as tables**, and the widget decides from the data rather than
from the chart type — a Bar bound to something unexpected is no more tabular than a Tree Map:

| Shape | Result |
|---|---|
| A flat array of objects | One row per element, columns from the union of keys |
| A series array (`[{ id, data: [...] }]`) | Flattened to one row per point, series id as the first column |
| Hierarchy, graph, Chord's matrix, Geo Map's geography | **Nothing.** `check()` warns at design time |

Declining is deliberate. A hierarchy flattened into rows by an invented convention reads as
authoritative and is not, and for those chart types the accessible label is the alternative form —
so make it carry the point the chart is making rather than describing its shape.

Long datasets are capped at 500 rows and the table **says how many it omitted**. A table that simply
stops looks like data that simply stops, and the reader has no way to tell the difference.

---

# Colour and theming

## Match app theme (`atlasTheme`)

Whether the chart takes its look from the app's own Atlas theme, so it matches the pages around it
without a theme block being written into every placement.

The theme is **read from the app's CSS custom properties while the chart is on screen**, not copied
at design time. So a chart follows a theme the user switches — light to dark — **without a reload**,
and follows a theme scoped to part of a page.

| | |
|---|---|
| **Full** (default) | Both halves: the **chrome** (font, text colour, axes, grid, legends, tooltip) and a **series palette** built from the brand colours. |
| **Chrome only** | The chrome; series colour is left to Nivo. **The better choice for a chart with many series** — a palette built from four brand hues starts repeating at the ninth series, where Nivo's own schemes do not. |
| **Off** | Nothing. |

It is an enumeration rather than a boolean because Nivo's `PartialTheme` **carries no colours at
all**: the chrome and the series palette are two different props and therefore two different
decisions.

**Whatever is set here is the BOTTOM layer.** Any key in the static or dynamic configuration
overrides it — and a `theme` block set there is *merged into* this one rather than replacing it, so
adjusting one font size does not discard the rest of the app's look.

## The palette reaches 18 chart types, not 26

Eight chart types have no categorical colour property and **ignore the palette**. The property sheet
says so when you pick one.

| Why | Chart types |
|---|---|
| Colour by **value**, not category — they have their own ramp | Heat Map · Calendar · Time Range |
| Colour by **other properties** entirely | Bullet · Choropleth · Geo Map · Network · Voronoi |

`check()` words its design-time message differently for the two groups, because the fix differs: a
value-ramp chart is configured through `colors`, and the others through whichever prop they colour by.

This is **not** the same eight as the chart types that cannot use a data source. Only **Bullet, Geo
Map and Network** are in both lists. Chord, Circle Packing, Sankey, Sunburst and Tree Map take the
palette but not a data source; Calendar, Choropleth, Heat Map, Time Range and Voronoi take a data
source but not the palette.

## Limitations and workarounds

### A value ramp does not follow a light/dark switch — and should not

Set *Match app theme* to **Full**, switch the app to dark, and the eight types above keep their light
value ramps and greys against a dark page. **That is correct.** Those colours are the chart's *data
encoding*, not chrome — a light-to-dark-blue ramp means something, and a widget that guessed a new
ramp for dark would be inventing meaning.

The chrome around them — axes, gridlines, ticks, legend text, tooltip — *does* follow.

**Workaround, if you want the ramp to adapt:** set it yourself in the dynamic configuration, keyed off
whatever the app already knows about its theme. Calendar's `emptyColor` and Heat Map's or
Choropleth's `colors` are the usual keys.

### A colour in the static or dynamic configuration beats the theme — including one you did not mean

This is the layering working as designed, but it produces the most confusing failure this widget has,
because the chart looks *almost* right:

- **`colors`** in the configuration wins over the theme palette. `check()` warns when *Match app
  theme* is `Full` and a `colors` key is present, because that combination is nearly always a mistake.
- **A legend's `itemTextColor`** wins over the theme's legend colour, and **`check()` does not warn
  about it.** Nivo's precedence is `itemTextColor ?? … ?? theme.legends.text.fill ?? "black"`, so a
  supplied value outranks the theme — and since the themed value is what you get when the key is
  *absent*, any `itemTextColor` present is one somebody typed.

  This bites hardest when a configuration is copied from a Nivo docs example, most of which carry
  `"itemTextColor": "#444444"` and a `#000000` hover effect. In a dark theme that legend is dark grey
  on a dark ground — effectively invisible, while the chart itself themes perfectly.

  **Workaround: delete the key.** Omitting `itemTextColor` is what makes the legend follow the theme.
  Note that the legend's font family and size are themed regardless, which is exactly why this reads
  as a theme bug rather than a configuration one.

### Labels derived from a datum's own colour do not follow the theme — also correct

Heat Map's in-cell value labels use `labelTextColor: { from: "color" }`, so their colour is derived
from the **cell** they sit in. When the cell colour comes from a static value ramp, the label colour
is static too. **Do not "fix" this**: a label inside a coloured cell must contrast with the cell, not
with the page.

### Colouring a chart type that takes no palette

Those eight are not stuck with Nivo's defaults — they simply take colour through their own props
rather than through `colors`. Network is the clearest case, and its default is unhelpful: Nivo reads
`nodeColor` from `node.color`, so a node list with no `color` field renders **black**.

Give each datum a colour and read it with a marker, which works at runtime:

```json
{ "nodeColor": "@fn:prop:color",
  "nodeBorderColor": { "from": "color", "modifiers": [["darker", 0.8]] },
  "linkColor": "#8c93a3" }
```

Since these colours cannot follow the theme, **pick mid-tones that read against a light or a dark
ground** rather than the near-black or near-white a single-theme eye will choose.

### Canvas is themed, including the font

Worth stating because it is the kind of thing that fails silently: the Canvas renderer gets the same
palette and the same typography as SVG. Nivo's Canvas renderers build a font string as
`` `${fontSize}px ${fontFamily}` ``, so a font size that kept its CSS unit would yield `14pxpx` and
the canvas would fall back to a 10px default face **while every colour stayed perfect**. It does not:
the emitted string is `14px "Poppins", sans-serif`, or whatever the app's `--font-family-base` is.

## For maintainers — the token trap

An unregistered CSS custom property's computed value is the **token stream**, not a colour. Atlas
builds every shade with `color-mix()`, so:

```js
getComputedStyle(el).getPropertyValue("--brand-primary-600")
// "color-mix(in srgb, #264ae5, #000 20%)"
```

Nivo derives label and border colours with **d3-color**, whose parser returns `null` for that string —
and a null there does not throw, it produces an **invisible label**. Every colour token is therefore
resolved twice: through a probe element's `color`, so the CSS engine evaluates it, and then through
one pixel of a 1×1 canvas, so the result is `rgb()` rather than the `color(srgb …)` Chrome serialises,
which d3-color also cannot parse. See `src/theme/atlasTokens.ts`.

---

## Architecture

| | |
|---|---|
| `src/AqNivo.tsx` | The Mendix adapter — **the only file permitted to import `mendix`** |
| `src/AqNivo.xml` | Property surface. Descriptions are short by policy; the detail is in this README, under [Property reference](#property-reference) |
| `src/AqNivo.editorConfig.ts` | Design time — `getProperties`, `check`, `getCustomCaption` |
| `src/AqNivo.editorPreview.tsx` | The page-editor rendering |
| `src/theme/` | Atlas tokens in, a Nivo theme and a series palette out |
| `src/config/` | The configuration layers, the merge, and the function-marker registry |
| `src/components/` | Mendix-free. Plain props, so the preview and the runtime can share one implementation and the logic is testable with no Mendix runtime |
| `scripts/check-layers.mjs` | Enforces the above as a build failure rather than a convention |

The layering is not stylistic. **The design-time bundle does not tree-shake**, so any path from
`editorConfig` or `editorPreview` into the runtime drags all of Nivo — several megabytes — into a
bundle Studio Pro loads when the project is opened.

## Development

```bash
npm ci             # must pass on a clean clone; a lock file that fails npm ci is broken
npm run dev        # watch build
npm run build      # dev build, copies the .mpk into the test app if one is configured
npm run lint
npm run check:layers
npm test
npm run prerelease # lint && check:layers && test
npm run release    # dist/<version>/com.auraq.AqNivo.mpk — does NOT copy into the test app
```

### Pointing the build at the Mendix test app

**The Mendix test app is a separate repository**, on Team Server; this one is on GitHub. It lives
*beside* this repo rather than inside it, and only the built `.mpk` crosses between them — committed
from the app side.

Because the app is outside this repo, `config.projectPath` **cannot** name it, and it is deliberately
absent from `package.json`. Tell the build where the app is, once per machine:

```bash
echo "../../.mx/AqNivo-main" > .mxproject     # relative to this repo root, or absolute
```

`.mxproject` is gitignored, so each machine sets its own. `MX_PROJECT_PATH` still wins if set, for a
one-off build against a different app.

`npm run build` resolves that path, hands it to the build tool, and then **verifies the `.mpk`
actually landed**. `npm run check:target` does the resolve-and-validate half without building.
`npm run release` needs no app — it writes to `dist/` only.

> **Why this is a hard failure rather than a convention.** The generator's default
> `config.projectPath` was `./tests/testProject`, a directory that does not exist here. PWT resolved
> the copy target to nothing, skipped the copy **silently**, and exited 0 — leaving a correct `.mpk`
> in `dist/` and the previous build in the app.
>
> That does not present as a build problem. It presents as **Studio Pro ignoring your change** — and
> because Studio Pro really does cache a widget's parsed XML for the life of the open project, the
> reasonable next move is to restart the project, which cannot help and costs minutes. It went
> exactly that way on 2026-09-07.
>
> If the guard ever fires, fix the pointer rather than building without a target. And before blaming
> the cache for anything, check what is actually in the archive:
>
> ```bash
> ls -l <app>/widgets/com.auraq.AqNivo.mpk
> unzip -p <app>/widgets/com.auraq.AqNivo.mpk "*AqNivo.xml" | grep "<some new text>"
> ```

A `cp: no such file or directory: dist/tmp/widgets/*` line in the build log is harmless: it is a
separate PWT step copying *unpacked* files for hot reload, and the `.mpk` is zipped rather than
copied by it.

**Studio Pro caches a widget's parsed XML and its design-time JS for the life of the open project.**
After any rebuild that changes a property, a description or `check()`, close and reopen the project,
or the old one is still in force — silently, and with a clean consistency check.

Never track a Mendix model in this repository. It is binary and rewritten on every Studio Pro save,
so git cannot delta it; each save permanently appends a full copy.

## Docs

| | |
|---|---|
| [CHANGELOG.md](CHANGELOG.md) | What changed, and what breaks |
| [docs/build-notes.md](docs/build-notes.md) | Graded platform facts learned building this widget |
| [docs/known-unverified.md](docs/known-unverified.md) | What only a running app can confirm, and what to check first |
| [docs/page-authoring.md](docs/page-authoring.md) | Pointer to the published page-authoring reference |

## Upgrading

**1.0.0 → 2.0.0 is breaking and there is no migration.** The widget id changed from
`auraq.aqnivo.AqNivo` to `com.auraq.aqnivo.AqNivo`, so Mendix treats 2.0 as an unrelated widget and
every placed instance must be re-placed by hand.

The `.mpk` filename changed too (`auraq.AqNivo.mpk` → `com.auraq.AqNivo.mpk`), so installing 2.0 does
**not** overwrite 1.0.0. Delete the old `.mpk` and run **Clean Deployment Directory**, or the app
carries two packages and a stale unpacked tree.

## Issues, suggestions and feature requests

<https://github.com/lindski/aq-mx-nivo/issues>
