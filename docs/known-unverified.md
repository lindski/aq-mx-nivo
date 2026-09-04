# Known unverified

What this repository **cannot** prove, and what to check first in a running app. Everything here can
be built, linted, unit-tested and packaged outside Mendix; almost none of it can be *verified* there.

Keep this file honest. A claim moves out of here when something was observed, not when it seems
likely.

Status as of **2026-09-04**, after the renderer split, the two check() defect fixes, and the first runtime smoke test of the gallery.

---

## Added 2026-09-04 (later) — what the first runtime smoke test settled, and what it did not

**23 of 26 charts render correctly** in the running app, with real axes, legends, series and applied
configuration. That is the first evidence that the 26 payloads derived from the 0.99 typings are
sound. Two defects were found and fixed; both need re-checking in the app.

### CONFIRMED 2026-09-04 — Geo Map now renders instead of showing the empty state

`NivoChart` gated on empty BOUND data before rendering, so Geo Map — which has no meaningful `data`
prop and takes its geography through `features` in the configuration — was unrenderable **even when
fully configured**. The gate now skips any chart type whose `CHART_DATA_SHAPE` is `"features"`.

**Confirmed in the running app:** the chart host is present and the empty state is gone. The Geo Map page renders an SVG shell rather than "No sample data for this chart type."
It will still look blank, because no GeoJSON is supplied — that part is unchanged and correct, and
the design-time warning says so. **Supplying a small feature collection is the only way to prove Geo
Map and Choropleth actually draw**; the world-countries file is ~250 KB and is deliberately not
shipped. A three-country GeoJSON in the sample would close this properly.

### CONFIRMED 2026-09-04 — Network draws, via function properties

Network produced 53 NaN coordinates and ~138 console errors. **The data was never wrong** — every
node carried `size`, every link carried `distance`. The configuration used the **string accessor**
form (`"nodeSize": "size"`), which @nivo 0.99 no longer supports:

```ts
export type DerivedProp<Target, Output> = Output | ((target: Target) => Output);
linkDistance: DerivedProp<Link, number>;   // number | (link => number)
nodeSize:     DerivedProp<Node, number>;   // number | (node => number)
```

**This is the first empirically confirmed 0.80 to 0.99 breaking prop change (R-03).** It was
invisible to every gate: the payload was derived from the typings, and the typings still admit a
`string` — as the OUTPUT type, not as an accessor. Assume other string-accessor props elsewhere in
Nivo went the same way, and treat any configuration value that names a field as suspect.

The sample now supplies both as **function properties** on the widget instance (`node.size`,
`link.distance`) rather than in the JSON, which also makes it the only sample demonstrating that
feature.

**Confirmed in the running app:** 7 circles, 8 lines, **0 NaN**, and **0 console errors** across the
whole gallery walk — down from 138. Function properties therefore work end to end at runtime, which
nothing had previously exercised.

### Still unrendered

- **Canvas and HTML are now CONFIRMED** by `NivoGallery.ChartSample_Renderers`, which draws one Tree
  Map three ways. They are structurally distinct in the DOM, and the difference matters:

  | Renderer | `<svg>` | `<canvas>` | `<div>` | Label text in the DOM |
  |---|---|---|---|---|
  | SVG | 1 | 0 | 2 | yes |
  | Canvas | 0 | **1** | 2 | **none** |
  | HTML | 0 | 0 | **30** | yes |

  **Canvas puts no label text in the DOM at all** — the chart is one bitmap, so a screen reader and
  a browser text search get nothing but the Accessible label. That is a real accessibility
  trade-off, it is not obvious from the property sheet, and it is now stated in the renderer
  property description.
- ~~Voronoi draws only 4 paths~~ — **retracted, this was a measurement error, not a defect.**
  Nivo renders one `<path>` per LAYER (`links`, `cells`, `points`, `bounds`), not one per datum, and
  the count was taken from a `d` attribute truncated to 60 characters. The full paths carry 12 link
  segments, 18 cell segments and **10 point circles (20 arcs)** — exactly the ten data points.
  Voronoi renders correctly.

  **Worth keeping as a method note:** counting SVG elements is not a proxy for counting data in a
  library that batches a layer into one path. Count path commands, or count what the chart is
  supposed to encode — not nodes.

---

## Added 2026-09-04 — the renderer split and two check() fixes

### 0. The 27 placed instances must be migrated before anything else works

`chartType`’s enumeration **values changed**: `ResponsiveBar` became `Bar`, and the drawing
technology moved to a new `renderer` property. Every placed instance in the test app — 26 gallery
detail pages and the playground — holds a value that no longer exists in the enumeration.

**Expected:** Studio Pro reports a consistency error naming the invalid value on each page. **This is
an expectation, not an observation.** The published guidance covers removing a *property* (which
corrupts instances and surfaces as a modeler crash) and renaming a property *key* (which loses the
binding); it says nothing about changing an enumeration’s *values*, and nobody has watched this
happen. Confirm what Studio Pro actually does before assuming the migration is safe to script.

Order matters: **close and reopen the project first** so the new property definitions load, and only
then repoint the pages. Repointing them against the cached old definition would write values the
currently-loaded widget rejects.

### 0b. Does the Canvas / HTML renderer actually draw?

`CHART_RENDERER_SUPPORT` was read out of the installed `@nivo` 0.99.0 declarations and is unit-tested
for shape and counts, but **no Canvas or HTML chart has been rendered in a browser**. The registry
maps 14 Canvas and 3 HTML variants; a wrong import would have failed the build, a wrong *runtime*
prop contract would not.

- Draw one Canvas chart (Bar or ScatterPlot) and one HTML chart (TreeMap) and confirm they render.
- Confirm the SVG fallback: set Renderer to Canvas on a Funnel and check a chart still appears.

### 0c. Does dropping `required="true"` remove the duplicate errors?

`propertyName` and `functionBody` were `required="true"`, so an empty one produced Mendix’s generic
*“Property ‘Body’ is required.”* **as well as** the widget’s own explanatory `check()` message — two
errors for one mistake, observed on the harness page. Both are now `required="false"`.

**Confirm on `NivoGallery.AqNivo_CheckHarness`: the harness should report 6 errors, not 8.** If it
still reports 8, the `.mpk` did not reload. Enforcement is unchanged either way — a `check()` error
is a consistency error and still blocks F5.

### 0d. The compile-failure message in Studio Pro specifically

`did not compile: null` is fixed, and against Node the message now reads *“did not compile — check
the body for a syntax error: Unexpected token ‘;’”*. **Node is not where the defect appeared.** The
null came from Studio Pro’s design-time host, so the only place the fix can be confirmed is there.
Expect the trailing detail to be absent in Studio Pro and the sentence to still be useful without it.

---

## Check these first, in this order

### 1. Does the renamed widget load, and does the new property sheet appear?

The id, `packagePath` and internal files path changed together, and the property surface was then
rewritten wholesale. Nothing in the build compares the identity triple beyond
`scripts/check-layers.mjs` rule 6, and a widget XML that builds, lints and packages **has not been
validated** — Studio Pro is the only thing that validates it.

- Delete `widgets/auraq.AqNivo.mpk` **only when `NivoTestDataOld` goes** — until then both widgets
  coexist deliberately, with different ids and different `.mpk` names.
- Install `com.auraq.AqNivo.mpk`, run **Clean Deployment Directory**, then F4.
- A widget Studio Pro refuses reports **"Could not find widget"** on every page using it, naming no
  cause. The real message is in `deployment/log/app_bundle_log.txt`, not in the dialog — Studio Pro's
  second bundler frequently reports failures with an empty error string.

### 2. Does `check()` actually run?

Every rule has been exercised against the **built** `AqNivo.editorConfig.js`, which is the exact file
Studio Pro loads — nine scenarios, all producing the expected severity and message. That proves the
code is right. It does **not** prove Studio Pro is running it.

- Studio Pro loads a widget's design-time JS **when the project is opened** and caches it for that
  project's lifetime. **Close and reopen the project** after installing, and confirm the `.mpk`
  timestamp actually moved first.
- Place an instance with a deliberately malformed static configuration and confirm the error appears.
- `ped_check_errors` returns `check()` output verbatim with the widget's JSON path, so this is
  automatable — but **treat zero results as "the widget has not been reloaded", never as "the rules
  regressed"**. A stale bundle still reports the old rules; silence means the design-time JS is not
  executing at all.

### 3. Does the page-editor preview render, and at the right size?

Thirteen static SVG stand-ins, one per chart family, sized by `heightMode`. Verified only as a bundle
that builds and stays Nivo-free. Whether each drawing reads as the chart it stands for — and whether
`fillParent` behaves sanely inside the page editor — needs eyes on the modeler.

### 4. Do the 26 sample configurations still render under Nivo 0.99?

**Still the open question, and the build cannot answer it.** The upgrade compiled with zero type
errors because the payload boundary in `src/charts/registry.tsx` is `any` — deliberately, since 26
Nivo components have mutually incompatible prop types — so a renamed or removed prop surfaces only at
runtime.

**The plan to render the old samples side by side is DEAD, confirmed 2026-09-04.** The 1.x widget
does not run on Mendix 11 at all: every `NivoTestDataOld.ChartTest_*` page fails to open with
*“ReferenceError: require is not defined”*, because `auraq.AqNivo` is a Dojo-era AMD widget and
`require` does not exist in the React client. Confirmed across Bar, Pie, Sankey and Calendar. Those
pages have been dead since the 11.12.4 upgrade, so the comparison was never available — three plan
revisions rescheduled it without anyone testing whether it could be done.

**It has been answered empirically instead, and better.** Rendering the 26 NEW samples in the running
app found the one prop change that mattered: Nivo 0.99 removed the string-accessor form for
`nodeSize` / `linkDistance` (see the CONFIRMED section above). A concrete failure with a concrete
fix, which reading old payloads by eye would not have produced.

**What remains genuinely unchecked** is the rest of the 0.80 to 0.99 surface — nineteen minor lines
of prop churn across 26 chart types, of which we have sampled 26 payloads and found one break. Treat
any configuration value that names a FIELD as the prime suspect, since that is the form 0.99
removed. Known structural change still to look at: **theming moved out of `@nivo/core` into
`@nivo/theming`**.

### 5. Is the `zip-a-folder` pin still needed?

`overrides` pins it to 6.1.1 to avoid a native `@napi-rs/lzma` binary that will not install on Node
22.18.0. That is a property of one machine's Node version, not of this widget. On Node ≥ 22.20,
remove the override and confirm the build still packages.

---

## Unverified by nature — these need a running app, always

- **`new Function` and Content-Security-Policy.** Function properties compile with `new Function`,
  which requires `unsafe-eval`. If Mendix Cloud's default policy omits it, the constructor throws and
  the widget reports it honestly — but **in production, against a widget that worked in development**.
  Untested, and the worst-shaped failure here because it cannot be found locally.
- **Whether `role="img"` plus `aria-label` is the right announcement** for a chart in the Mendix
  client, and how it interacts with the surrounding page structure. Needs a screen reader, not a
  reading of the spec. There is no tabular alternative yet — `renderDataTable` is not built.
- **The empty and error states in a real layout.** They are styled now, where 1.x emitted class names
  no stylesheet defined, so the failure states were zero-height and invisible. Whether they *read*
  correctly inside an Atlas card is a different question.
- **`heightMode: fillParent`.** `check()` warns that it needs an ancestor with a real height, because
  Mendix layouts rarely give one and the failure is a chart of zero height that renders nothing,
  silently. Whether the warning is too noisy in practice is a judgement to make after using it.
- **The error boundary actually catching a Nivo throw.** Its reset key and fallback are exercised by
  reasoning, not by a test that makes Nivo throw. Worth constructing deliberately — a Sankey whose
  link names a node that does not exist is the usual way in.
- **Release bundle size.** Every figure in `build-notes.md` is from a **dev** build. `build` and
  `release` write the same path, and a stale dev artefact is indistinguishable by name, location or
  apparent validity. Delete `dist/<version>/` first, run `npm run release`, and confirm the artefact
  carries `dependencies.txt`/`.json`.

---

## Known limitations, deliberately shipped

Listed so nobody reports them as defects.

- **Geo Map does not use the bound Chart data at all.** `ResponsiveGeoMap` has no meaningful `data`
  prop — its geography arrives through `features`, which this widget can only supply through the
  configuration JSON. Choropleth needs `features` too, in addition to its `data` array. `check()`
  warns on Geo Map; there is no warning for Choropleth because its data binding is genuinely used.
  Bundling world-countries GeoJSON as a lazy chunk is the intended fix, once code splitting lands.
- **Configuration merging is shallow.** A nested object in the dynamic configuration replaces the
  static one rather than blending with it. Deliberate: a deep merge makes it impossible to *remove* a
  nested default, and a half-overridden axis configuration is far worse to debug than a replaced one.
- **The chart-type vocabulary is declared twice** — in `AqNivo.xml` and in `src/charts/chartTypes.ts`
  — because the Mendix-free layer must not import the generated typings. `check:layers` rule 8
  asserts the two sets are identical, so drift fails the build.

---

## Not yet built, and known not to be

All of this is the remainder of 2.0:

- **Nothing is code-split.** Every `@nivo` package is statically imported by
  `src/charts/registry.tsx`, so a page using one chart still pays for all 26 (B-01). The registry
  indirection exists to make that a change to one file.
- **No datasource mode.** JSON is the only way data reaches the widget. When it lands, note that
  `ListValue` has **no group-by**: the datasource must supply rows at the granularity the chart plots,
  or a client-side aggregate over a paged datasource presents a subtotal as a total.
- **No interactivity** — no click handler, no drill-down, no selection.
- **No theming hook.** Nivo's `theme` is not wired to Atlas, so charts look like Nivo rather than like
  the app unless every placement hand-writes a theme block.
- **No Canvas variants**, so large datasets render as SVG.
- **No tabular alternative** for screen readers.
