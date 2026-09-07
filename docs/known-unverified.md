# Known unverified

What this repository **cannot** prove, and what to check first in a running app. Everything here can
be built, linted, unit-tested and packaged outside Mendix; almost none of it can be *verified* there.

Keep this file honest. A claim moves out of here when something was observed, not when it seems
likely.

Status as of **2026-09-06**, after Atlas theming (P-11). Before that: the renderer split, the two
check() defect fixes, the first runtime smoke test of the gallery, code splitting, datasource mode
and interactivity.

---

## Added 2026-09-06 — Atlas theming (P-11), VERIFIED 2026-09-07

**All five checks are answered.** Checks 3 (live theme switch) and 4 (tooltip in dark) were run by
the developer by hand on 2026-09-07; checks 1, 2 and 5 were measured the same day by driving the
26-page gallery with Playwright and reading the DOM, the resolved custom properties and the canvas
backing store. The harness is committed in the test app at `.aq/nivo/chart-probe.js` and is
re-runnable — repeatable evidence, not one look.

**What that closes.** The token read, the two-step `color-mix()` resolution, the palette, the
palette *exclusions*, the Canvas font string, the live theme switch and the dark tooltip all work
end to end in a browser. **P-11 is complete.** The caution below about silent failure was right to
be there and has now been discharged by measurement rather than by a general smoke test.

**What the repository proves separately.** The pure half — Atlas tokens in, Nivo theme and palette
out, plus the theme deep-merge — has unit tests in `src/theme/atlasTheme.spec.ts`. The
palette-support table was read out of the installed `@nivo/*` 0.99 type declarations, one package
at a time, the same way `CHART_DATA_SHAPE` was. `npm run prerelease` passes, the release entry
bundle is 26,559 bytes against 17,433 before, and the chunk count is unchanged at 100 — so theming
did not undo the code splitting.

**Why none of this could be tested in jsdom, which is why it took a browser.** Reading the tokens
needs a real CSS engine and a real canvas. jsdom's `getComputedStyle` does not evaluate
`color-mix()`, and jsdom has no canvas — so a jsdom test of `readAtlasTokens` would pass against a
resolver that returned the raw `color-mix(...)` string unchanged, which is precisely the bug the
resolver exists to prevent. A test that cannot fail is worse than no test, because it gets quoted
as evidence.

### The five checks, and what each returned

Numbering kept from the original five so a reference to "check 3" does not move.

**1. ANSWERED — the tokens resolve, and the two-step resolution IS load-bearing.**

```
getComputedStyle(host).getPropertyValue("--brand-primary-600")
  ->  "color-mix(in srgb, #264ae5, #000 20%)"
```

The browser hands back the **token stream**, not a colour — so the comment in `atlasTokens.ts` is
right as written and should NOT be softened. d3-color returns `null` for that string, and a null
there does not throw, it produces an invisible label. The probe-element-plus-1x1-canvas resolution
is doing real work on every token, every render.

The palette it resolves to, for the record — stock Atlas 3 on this app:

| | token | resolved |
|---|---|---|
| P0 | `--brand-primary-600` | `rgb(30, 59, 183)` |
| P1 | `--brand-warning-500` | `rgb(205, 133, 1)` |
| P2 | `--brand-success-600` | `rgb(18, 136, 18)` |
| P3 | `--brand-danger-500` | `rgb(234, 51, 55)` |
| P4 | `--brand-primary-300` | `rgb(125, 146, 239)` |
| P5–P7 | `--brand-{warning,success,danger}-300` | `rgb(225, 182, 103)`, `rgb(115, 204, 115)`, `rgb(242, 133, 135)` |

**2. ANSWERED — the Canvas font string is well formed, and Canvas gets the palette too.**

The failure this check existed for is a `14pxpx` font string that the canvas silently replaces with
a 10px default face while every colour stays perfect. **A screenshot cannot answer it**, so the
`font` setter on `CanvasRenderingContext2D.prototype` was patched and the chart forced to redraw.
Across the whole re-render Nivo assigned exactly one font string:

```
14px "Poppins", sans-serif
```

Correctly formed, the app's own family, the app's own size — and `document.fonts.check("14px Poppins")`
is `true`, so the face is really available to the canvas. Sampling the backing store on the Renderer
comparison page then returned top colours `rgb(205, 133, 1)`, `rgb(18, 136, 18)`, `rgb(234, 51, 55)`,
`rgb(125, 146, 239)` — **pixel-identical to P1–P4 above**. The backing store is 685×540 for a
457×360 CSS box at `devicePixelRatio` 1.5, so it is correctly scaled and not blurred.

> **Not a defect, but note it before someone reports one.** Side by side on the Renderer comparison
> page the Canvas Tree Map looks visibly different from the SVG and HTML ones: no parent tiles, no
> parent labels (`Fund`, `Financials`, …), and leaf colours at full strength rather than lightened.
> That is `TreeMapCanvas` in Nivo — it has no parent-label layer — not a theming failure. The
> colours are the same palette; the SVG variant lightens children over their parent.

**3. ANSWERED — it follows a live theme switch.** Confirmed by hand by the developer, then
**measured across all 26 charts plus Canvas** — see the dark-mode sweep below.

**4. ANSWERED by the developer, 2026-09-07 — the tooltip reads correctly in dark.** Confirmed by
hand. This was the pairing most likely to come out dark-on-dark (`--bg-color-secondary` against
`--font-color-default`) and it does not.

**5. ANSWERED — the palette reaches exactly the eighteen types that take one, and none of the eight
that must not.** Measured across all 26 gallery pages by matching every mark's computed fill against
the resolved token table above — the only way to tell a brand blue from Nivo's default blue.

- **18 of 18 got it:** Area Bump, Bar, Bump, Chord, Circle Packing, Funnel, Line, Marimekko, Pie,
  Radar, Radial Bar, Sankey, Scatter Plot, Stream, Sunburst, Swarm Plot, Tree Map, Waffle.
- **8 of 8 were withheld:** Bullet (keeps Nivo's own scheme), Calendar, Choropleth, Heat Map and
  Time Range (all keep their own value ramp), Geo Map and Voronoi (greys), Network.
- **Calendar specifically** — the case this check was written around — keeps its blue value ramp and
  does not turn into four unrelated hues. `CHART_PALETTE_SUPPORT` is wired, not merely written.

### Dark-mode sweep, 2026-09-07 — all 26 charts, measured

Check 3 was originally answered by hand on one chart. It has since been run across **all 26 gallery
pages plus the Canvas renderer**, probing each chart light, flipping `theme-dark` on **the same
visit**, probing again, and flipping back — so the two readings are comparable per chart rather than
per session. `window.__aqDual` and `window.__aqTextSweep` in `chart-probe.js` do this.

**This app's dark theme redefines the brand tokens**, which is what makes the sweep meaningful:

| token | light | dark |
|---|---|---|
| `--brand-primary-600` | `rgb(30, 59, 183)` | `rgb(80, 101, 194)` |
| `--font-color-default` | `rgb(74, 74, 76)` | `rgb(227, 227, 229)` |
| `--bg-color-secondary` (tooltip) | `rgb(255, 255, 255)` | `rgb(31, 37, 60)` |
| `--border-color-default` (gridlines) | `rgb(229, 231, 242)` | `rgb(108, 117, 125)` |

**Result: 26 of 26 follow the switch. 0 console errors, 0 NaN, 0 remounts.**

- **Series colours re-derive.** Every palette-supporting chart's marks match the *dark* palette
  after the switch, and the shades Nivo derives from them move with it (Chord's arc borders go
  `rgb(26, 51, 159)` -> `rgb(69, 88, 168)`, Pie's `rgb(21, 41, 128)` -> `rgb(56, 71, 136)`).
- **Chrome re-derives.** Gridlines and axis text follow on every chart that has them.
- **Nothing remounts.** The `<svg>` (or `<canvas>`) node held across the switch is still connected
  afterwards on all 26, and every mark count is identical either side. **This is the check that
  matters and the one nothing visible would catch** — a chart that re-animated from scratch settles
  into the identical picture. It means `useAtlasTheme`'s token comparison is doing its job and an
  unrelated class change on `<html>` will not rebuild the chart.
- **Canvas follows too.** On the Renderer comparison page the backing store's colours all shift to
  the dark palette with **pixel counts unchanged** (2150 / 1800 / 1327 / 957 — same tiles, new
  colours), the canvas element is not replaced, and the font string stays `14px "Poppins", sans-serif`
  right through the switch.
- **The eight excluded types keep their own ramps in dark**, which is correct and worth stating
  because it looks like a bug: Calendar, Choropleth, Heat Map and Time Range keep their light blue
  value ramps, and Geo Map and Voronoi their greys, against a dark page. Those colours are the
  chart's data encoding, not chrome. An app that wants them to adapt sets `emptyColor` / the ramp in
  its own configuration — the widget must not guess a value ramp.

### DEFECT found by the sweep — Choropleth's legend is unreadable in dark

**All 9 of Choropleth's `<text>` nodes are legend labels hardcoded to `rgb(68, 68, 68)`, and they do
not move.** Every other chart's text follows (0 stuck across the other 25, with one correct
exception below). In dark mode that is dark grey on `rgb(31, 37, 60)` — effectively invisible;
there is a screenshot of it in the session.

**It is the sample's static configuration, not the widget, and Nivo's precedence proves it.** From
the installed `@nivo/legends` 0.99 bundle:

```
itemTextColor ?? ... ?? theme.legends.text.fill ?? "black"
```

`atlasTheme` **does** set `legends.text.fill` — it is simply outranked by a supplied
`itemTextColor`. And the themed value is exactly what you get when the key is absent, so `#444`
cannot be a Nivo default; it is set explicitly. It is the value straight out of Nivo's own
choropleth docs example, which is how it got there.

**Fix:** delete `itemTextColor` from the Choropleth sample's legend configuration in the gallery
seed. Nothing to change in the widget. Note that the legend's *font family and size* are already
themed (`Poppins`, `14px`) — only the colour is overridden, which is why this reads as a theme
failure at a glance.

> **This is the documented "static configuration wins" rule landing for real.** `check()` already
> warns when `Match app theme: Full` sits alongside a `colors` key. `itemTextColor` is the same
> shape and is **not** covered by that warning. Worth considering whether the rule should widen to
> the theme-overriding legend and label colour props, or whether that is too broad to be useful —
> it is a judgement call, not an obvious gap.

### Correct-but-surprising: Heat Map's in-cell labels do not follow either

20 of Heat Map's 41 text nodes keep their colour across the switch. **That is right.** Those are the
in-cell value labels, coloured by `labelTextColor: { from: "color" }` — derived from the cell's own
fill so they stay legible against it. The Heat Map ramp is a static value ramp that does not change
with the theme, so neither do labels derived from it. The other 21 (axis ticks and legend) follow
normally.

Do not "fix" this. A label inside a coloured cell must contrast with the **cell**, not with the page.

### Measurement trap found while running check 5 — read this before reporting a red

A naive fill census reports **pure red** (`rgb(255, 0, 0)`) on Bump, Line, Radar and Scatter Plot.
It is not a theming bug and it is not visible: those are Nivo's **interaction hit-areas**, drawn as
`fill="#F00"` with `fill-opacity="0"`. `getComputedStyle().fill` reports the red and says nothing
about the opacity. Their presence is in fact evidence that tooltips are wired.

`chart-probe.js` now excludes anything with a computed `fill-opacity` of 0. This is the same class
of error as the retracted "Voronoi only draws 4 paths" finding — the measurement was wrong, not the
chart. Solve the number back to the data before calling it a defect.

### Still open after the sweep — Network draws in black (test-app data, not the widget)

Network is geometrically **correct**: 7 nodes at per-node radii 12/9/8/6/6/5/5 — so the `nodeSize`
function property works and the R-03 breakage is genuinely fixed — 8 links with real coordinates,
**0 NaN attributes**, 0 console errors. But every node and link renders `#000000`.

That is the seed data, not the theme. `CHART_PALETTE_SUPPORT.Network` is `false` and correctly so:
Network takes `nodeColor`/`linkColor`, not a `colors` array, and `PartialTheme` carries no colours.
Nivo's default `nodeColor` reads `node.color`, the sample supplies none, and the fallback is black.
The fix belongs in the gallery seed — a `color` per node, or a `nodeColor` function property, which
would make Network a second demonstration of function properties alongside `nodeSize`. Logged in the
test app's plan; nothing to change in the widget.

### Known unknowns, stated rather than assumed

- **Which colour syntax the browser returns for an evaluated `color-mix()`** is assumed to be
  something d3-color cannot parse, based on Chrome serialising it as `color(srgb ...)`. The canvas
  normalisation makes the answer not matter — but the *claim* in the source comment is reasoned, not
  observed.
- **`MutationObserver` on `<html>` and `<body>` is CONFIRMED for this app** (check 3, 2026-09-07:
  the charts follow a live dark-mode switch), which is where `_theme-dark.scss` puts the class
  (`:root.theme-dark`). It remains an assumption about Atlas apps in general: one that themes by
  swapping a stylesheet, or by a class on some mid-page container, would still not be seen.
- **Nothing has confirmed that Nivo ignores a `colors` array on a chart type that does not declare
  the prop.** The reasoning is that a React component destructures what it wants; the palette is
  withheld from those eight anyway, so this is a second line of defence rather than the first.
- **The page-editor preview is not themed.** `StaticChart` is a static stand-in and does not read
  the tokens. Studio Pro's page editor is not an Atlas app, so there is little to read — but it does
  mean the preview will not show the palette the runtime uses.

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

### RE-CHECK — do the lazy chunks survive Studio Pro’s second bundler?

`registry.tsx` now loads each Nivo package with a dynamic `import()` (B-01), and a
`rollup.config.mjs` override swaps `output.file` for `output.dir` on the web bundles so Rollup can
emit chunks.

**Measured, same build type so the comparison is valid:** the dev entry bundle went
**4,592,154 → 159,459 bytes**. The release `.mpk` is 571,501 bytes with a 17,433-byte entry and 100
chunks, and carries `dependencies.txt`, so it is a genuine release rather than a dev build sitting
in the release path. **No release-to-release figure is quoted, because no pre-split release build
was ever made** — quoting the dev-to-release delta as this change’s effect would be measuring two
different things.

**What the repo cannot prove: Studio Pro re-bundles the whole client after unpacking the `.mpk`.**
The chunks must still be distinct afterwards, and the ES bundle is the one actually consumed.

- After deploying, check `deployment/web/dist/chunks/` still holds separate `nivo-*` chunks.
- Open a chart page and confirm the network tab fetches ONE chart chunk, not twenty-four.
- Expect a brief flash of the new “Loading chart…” state — it is the Suspense fallback.
- If the client bundler fails, its dialog is frequently empty; the real message is in
  `deployment/log/app_bundle_log.txt`.

---

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

- **No interactivity** — no click handler, no drill-down, no selection. This is the reason datasource
  mode exists: a click can only carry the row it fired on when there *is* a row, so JSON mode can
  never do drill-down properly and datasource mode is the prerequisite, not a parallel feature.
- **No theming hook.** Nivo's `theme` is not wired to Atlas, so charts look like Nivo rather than like
  the app unless every placement hand-writes a theme block. Complicated at 0.99 by theming having
  moved to `@nivo/theming`.
- **No tabular alternative** for screen readers.

---

## Datasource mode — VERIFIED in a running app, 2026-09-04

Measured against `NivoGallery.ChartSample_Datasource` over `NivoGallery.ChartRow`, MxAdmin,
`localhost:8080`. **Zero console errors.** Both charts were measured from SVG geometry rather than
eyeballed, because the failure this was built to catch renders as a perfectly plausible chart.

**Flat path — Bar, Long values, 4 rows.** Bar heights came out 224.727, 212.182, 248.182, 273.273 px
against a 300 px plot and a 0–550 axis. Solving back: 412, 389, 455, 501 — the seeded values, exactly.
The axis ticks are numeric (0, 50 … 550), which is the tell that matters: a **linear** scale was built,
not the ordinal one a stringified `Big` would have produced.

**Series path — Line, Decimal values, 8 rows split on Team.** Two `<path>`s, four points each, x at
0 / 401.333 / 802.667 / 1204 — `SortOrder` preserved through the partition. Solving the y values back
against the 0–24 axis gives 12.4, 11.8, 13.2, 14.6 (Motor) and 19.5, 21.1, 18.3, 22.7 (Property):
**all eight decimals exact.** The two lines are cleanly separated, and the legend carries both series.

So the whole datasource chain is confirmed end to end: `ListAttributeValue.get(item)`, `toPlainValue`'s
`Big` coercion, `projectRows` for both shapes, the JSON round-trip, and `parseChartData`.

**Method note — Nivo positions points by `transform` on a parent `<g>`, so a point's own `cx`/`cy` are
`0`.** Reading them yields eight identical zeros, which looks like every point collapsing to one place.
The line's `d` attribute is the real geometry. This is the same family of mistake as counting `<path>`
elements to count Voronoi cells: **an SVG attribute is only evidence if you know Nivo actually writes
the data into it.**

### Still unverified in datasource mode

- **`chartDataSource?.items` as a memo dependency is an identity check, not a value check.** It holds
  the last good rows through a reload by design (C-04 / Rule 6, no gate on `status`), but whether
  Mendix hands back a *new* array on every render — which would re-project and re-serialise every
  time, defeating the text-keyed memo downstream — has not been measured. Nothing observed suggests it
  does; nothing rules it out either.
- **DateTime has not been exercised.** A `DateTime` attribute serialises to ISO 8601 through `Date`'s
  own `toJSON` (confirmed in isolation), but whether the time scales (Calendar, TimeRange, a
  time-scaled Line) accept that form is untested — Calendar in particular wants `YYYY-MM-DD`, and an
  ISO timestamp may need trimming. `ChartRow.Period` is deliberately a String, so this page does not
  answer it.
- **The `check()` mode rules have not been seen in Studio Pro.** The `AqNivo_CheckHarness` page does
  not yet cover the five data-mode rules.
- **Only 2 of the 18 supported chart types have been driven from a data source** — one flat, one
  series. The projection is shape-driven rather than type-driven, so the other 16 follow from the two
  paths, but that is an argument, not an observation.
---

## Interactivity — VERIFIED in a running app, 2026-09-04

Measured against `NivoGallery.ChartSample_Datasource`, both charts calling
`ACT_ChartRow_ShowDetail`. **Zero console errors.**

**All twelve datums were clicked, not sampled** — four bars and eight line points across both
series. Every one reported the right row, with the right values:

| Chart | Clicked | Reported |
|---|---|---|
| Bar | Q1, Q2, Q3, Q4 | Motor Q1/412, Q2/389, Q3/455, Q4/501 — all correct |
| Line, Property | Q1, Q2, Q3, Q4 | Property 218/19.5, 244/21.1, 197/18.3, 263/22.7 — all correct |
| Line, Motor | Q1, Q2, Q3, Q4 | Motor 412/12.4, 389/11.8, 455/13.2, 501/14.6 — all correct |
| Bar | plot area above the bars | nothing, silently |

Exhaustive rather than sampled on purpose: the first pass clicked **one** bar of four, called
interactivity verified, and shipped a defect in which the leftmost bar silently did nothing. Clicking
all four costs seconds and is the only reason it was found.

**The Line result is the one that mattered.** Property is the *second* serie, so it is exactly where
per-serie rather than per-list numbering would go wrong — and it would go wrong plausibly: the answer
would have been *Motor Q1*, a real row with believable numbers. It resolved to the right row, so
`ROW_KEY` carries a position in the original list as intended.

**How a click finds its row.** Nivo hands `onClick` a *datum*, not the Mendix row. Object identity
cannot bridge them here: the projection is serialised to JSON and re-parsed — the round-trip that makes
the downstream memoisation work — so the chart holds copies. The handle therefore travels inside the
datum under `ROW_KEY` (`__mxRow`), as the row's index into the list the projection was given, carried
only when a click action is configured. `resolveRowKey` probes a short ordered list of places it can
sit rather than switching on chart type, because Nivo has no single click contract.

### Nivo Bar strips every FALSY value from the datum it hands your callbacks

Found in the running app when the first bar would not drill through and the other three would.
`@nivo/bar` 0.99, stacked path:

```js
B = function (e) { return Object.keys(e).reduce(function (t, a) {
    return e[a] && (t[a] = e[a]), t }, {}) }
```

`e[a] &&` — so **`0`, `""`, `false`, `null` and `NaN` are all dropped** from the per-bar `data` before
it reaches a click, tooltip or label callback. The bars themselves draw correctly; the `data` array
passed to `ResponsiveBar` is untouched. Only the callback view is filtered.

**This is not just our row handle.** Any mapped column whose value is 0, false or an empty string is
missing from the datum a stacked Bar hands a custom tooltip — so a tooltip reading `datum.data.claims`
shows nothing for a genuine zero, which reads as a broken tooltip rather than a real value of none.
Worth knowing before writing any tooltip function against a Bar.

For the row handle the fix is that `ROW_KEY` carries an opaque `"r<index>"` **string** rather than the
number: `"r0"` is truthy where `0` is not. `resolveRowKey` accepts only that token and deliberately
refuses a bare number, because mapped columns are full of numbers and resolving one as a row index
would drill into the **wrong** Mendix object — confidently wrong being worse than a dead click.

**How it presented, which is the part worth remembering.** Three of four bars worked. Nothing errored,
nothing logged, and every unit test passed — the projection genuinely produced `__mxRow: 0`, and the
data handed to Nivo genuinely contained it. Only the datum Nivo handed *back* had lost it. A test that
asserted "index 0 resolves" passed the whole time, because the loss happened outside the code under
test.

### Line's click surface is the mesh, not its points — and the default is off

Found while testing, then confirmed against `@nivo/line` 0.99 source rather than inferred:

- **`useMesh` defaults to `false`**, and the Points layer renders `DotsItem`s carrying only
  `onFocus`/`onBlur` — **no `onClick`**. The mesh layer is rendered only when
  `isInteractive && useMesh && enableSlices === false`. So **a Line with a click action and no mesh is
  silently non-interactive**: the chart draws, the property is set, clicking a point does nothing, and
  nothing at runtime could report it — "no click arrived" and "no handler was ever attached" are
  indistinguishable from inside the widget.
- **With `useMesh` on there is no empty space.** A click anywhere in the plot drills into the nearest
  point, because a voronoi cell always has an owner. Verified: a click in the far bottom-right corner
  reported *Motor Q4*. Usually wanted on a sparse chart, surprising on a dense one.
- **`enableSlices` gives slice-level clicks** — several points at once, so no single row, so nothing
  fires.

All three are now `check()` warnings against `onClickAction`. Warnings rather than errors because the
dynamic configuration can set `useMesh` at runtime, where design time cannot see it.

### Still unverified

- **Only Bar and Line have been clicked** — exhaustively, but only those two. The other sixteen
  datasource-supported types use payload shapes taken from Nivo's type declarations, not observed. A
  shape that differs fails *silently*. The falsy-strip bug also says something about the others:
  `B()` is Bar's stacked path specifically, so **each chart family may mangle the datum its own way**,
  and reading the type declarations would not have predicted it.
- **The series-level ceiling is asserted, not measured.** Stream, Bump and Area Bump are warned about
  as reporting clicks per series; no click has been attempted on any of the three.
- **`ROW_KEY` in the datum is untested on charts that derive series from datum keys** — Radar,
  Marimekko and Waffle. Bar takes `keys` explicitly and Line reads only `x`/`y`, so neither is at risk.
- **`canExecute` / `isExecuting` gating is untested under a slow microflow.** The intent is that a
  second click during execution is dropped rather than queued; `ACT_ChartRow_ShowDetail` returns too
  fast to exercise it.
- **The datasource `items` memo identity question** (see the datasource section above) is unchanged.
