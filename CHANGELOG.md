# Changelog

All notable changes to AqNivo are recorded here. This project follows [semantic versioning](https://semver.org/).

## 2.0.0 — unreleased

**Breaking.** 2.0 changes the widget's identity and will change its property surface. Every placed
instance of 1.0.0 must be re-placed by hand; there is no migration and Studio Pro will not offer one.

### Fixed — charts no longer throw when the chart type changes before its payload does

A page that lets the user pick the chart type renders the NEW type against the OLD data and
configuration for one commit. Nivo dereferences several props without defaulting them, so that commit
did not render badly — it **threw**, and `ChartErrorBoundary` caught it. Catching is not enough:
**React logs every error a boundary catches, from inside React, and a wrapper cannot suppress it.** The
React root is Mendix's, so `onCaughtError` is not ours to set either. The only fix is to not throw.

`charts/drawability.ts` decides whether a chart can be drawn *before* Nivo is asked to try, and reports
the **empty** state with a detail line naming what is missing. Empty rather than error is deliberate:
during that one commit nothing is actually wrong, and a red error would be a lie.

Three kinds of rule, each derived by measurement rather than from the documentation:

- **Element shape** — a series chart handed a flat list, Chord handed records instead of a matrix,
  Calendar or Time Range handed data with no `day`, Bullet with no `ranges`/`measures`.
- **Required configuration** — `keys` for Chord, Radar and Stream; `id`, `value` and `dimensions` for
  Marimekko. A key is listed **only** because rendering that chart with `{}` was observed to throw.
- **Configuration naming fields the data does not carry** — the half a shape check cannot reach, where
  configuration and data are each valid alone but disagree. A *partial* match passes: a stacked chart
  legitimately has datums missing some keys.

**How the rules were derived.** For every chart type that threw, two controlled probes: correct
configuration with foreign data, and correct data with an empty configuration. Eight of the ten were a
data mismatch, four needed a configuration key, two were both.

**Measurement note, and it is the reason the first attempt at this looked complete when it was not.**
A lazily-loaded component **hides its own mount-time races on first render** — on a cold chunk the chart
suspends while the code downloads and the payload catches up. A cold sweep of all 26 chart types
reported zero problems; a warm sweep of the same 26 in the same document reported ten. **Any sweep over
lazily-split code must run twice and report the warm pass.**

Verified in the running app: warm sweep **0 of 26** offenders, down from 10, with all 26 still painting.
Regression bed clean across **43 chart instances** — the 26 gallery pages, both Claims dashboards
(8 and 4), the data-source page and the renderer comparison — none of which fell to the empty state.
An over-strict rule blanking a working chart would have been strictly worse than the noise it removed.

### Breaking

- **Widget id changed from `auraq.aqnivo.AqNivo` to `com.auraq.aqnivo.AqNivo`**, and `packagePath`
  from `auraq` to `com.auraq`, bringing the widget onto the AuraQ house convention. Mendix treats the
  new id as an unrelated widget, so **every placed instance must be re-placed**. `src/package.xml`'s
  `files` path moved to `com/auraq/aqnivo` in the same commit — the build emits to a directory
  derived from the *id*, and a mismatch there packages cleanly while the client module points at a
  directory that is not in the archive.
- **Install note:** the `.mpk` filename changed from `auraq.AqNivo.mpk` to `com.auraq.AqNivo.mpk`, so
  a new package does **not** overwrite the old one. Delete the old `.mpk` and run
  **Clean Deployment Directory**, or the app carries two packages and a stale unpacked tree.

### Changed — toolchain

- `@mendix/pluggable-widgets-tools` 9.0.0 → **11.12.0**, pinned exactly rather than `^11.12.0`.
  The caret floats to 11.13.0, which declares `engines.node: ^22.18.0` — an *upper* bound, and one
  that contradicts this package's own `>=20`.
- React 17 → **19.0.0**, pinned through `resolutions` and `overrides`.
- `engines.node` `>=12` → **`>=20`**. See `docs/build-notes.md` for the effective floor, which is
  higher than that and is not declared anywhere.
- Nivo 0.80.0 → **0.99.0** across all packages.
- `zip-a-folder` pinned to **6.1.1** via `overrides`. See `docs/build-notes.md` — this is inside the
  toolchain's own declared range, not a downgrade past it.
- Dropped `@nivo/parallel-coordinates`, `classnames` and `@types/big.js` — declared and never
  imported.
- Removed the now-unused `import { createElement }` from every `.tsx` file. The 11.x toolchain uses
  the automatic JSX runtime with `noUnusedLocals`, which turns the 10.x-era idiom into a build
  failure, one file at a time.

### Added — release discipline

- `scripts/check-layers.mjs` and `npm run check:layers`, enforcing six invariants as build failures:
  Mendix imports confined to the adapter; no Nivo reachable from the design-time bundles; widget-XML
  enumeration keys that are identifiers; no property types Studio Pro rejects; `package.json` and
  `src/package.xml` agreeing on the version; and the widget id, `packagePath` and `files` path
  agreeing with each other.
- `npm test` (Jest) and a `prerelease` gate of `lint && check:layers && test`.
- `CHANGELOG.md`, `docs/build-notes.md`, `docs/known-unverified.md`, `docs/page-authoring.md`.

### Removed

- **`tests/testProject` — the entire nested Mendix app.** 778 tracked files and 84 MB, including a
  6.3 MB `Charts.mpk` and 25 other Marketplace packages. A Mendix model is binary and rewritten on
  every Studio Pro save, so git cannot delta it and each save permanently appended a full copy. The
  test app is now a separate Team Server repository, and its sample data has been carried across as
  a reference module. `.prettierignore` widened from `tests/testProject/` to `tests/` accordingly —
  the toolchain's prettier glob is hardcoded to `tests/`.

### Breaking — property surface

Brought forward ahead of the test app's chart gallery, so the gallery pages are built once against
final property keys. Renaming a property key preserves the placement but loses the binding, so this
had to land before any instance was placed.

| 1.0.0 | 2.0.0 |
|---|---|
| `chartData` | **`chartDataJson`** — renamed |
| `dynamicConfiguration` (required) | **optional**, as the README always claimed it was |
| `containerHeight` | unchanged, but now one of three height modes |
| — | **`heightMode`** — fixed pixels, aspect ratio, or fill parent |
| — | **`aspectRatio`** |
| — | **`emptyMessage`** — shown instead of an empty chart frame |
| — | **`ariaLabel`** |
| — | **System properties: Name, TabIndex, Visibility** |

`functionArguments` is now optional, for a function that takes none. Every property carries a
failure-mode-explaining description, because that text is carried verbatim into the page tooling's
schema and is what an agent authoring a page against this widget reads.

**Not `Label`** — declaring it removes `class`/`style` from the container props, and this widget needs
them. **Not `Editability`** — meaningless for a chart.

Deliberately *not* declared yet: the datasource properties, click actions, `renderMode` and the Atlas
theming flag. Adding a property later is safe; declaring one the widget reads nowhere is not, because
it advertises configuration that does nothing.

### Added — dynamic chart type

- **`chartTypeExpression`** — an expression property returning a chart type key, so the chart type can
  follow the data instead of being fixed when the page is built. `chartType` is an `enumeration`
  property, which in Mendix means **design time only**: it arrives as a plain value, not an
  `EditableValue`, so nothing could change it at runtime. That made a chart-type switcher — a
  dashboard where the user picks a visualisation, or the gallery playground — impossible to build.
- **An unrecognised value is an error, not a fallback.** Falling back silently would draw a chart of
  the wrong type against data shaped for a different one, which tends to look plausible and be wrong,
  and would hide the typo indefinitely. The message names the value received and suggests the nearest
  key, because the realistic mistakes are a display label ("Scatter Plot") or a package name
  ("sankey") rather than a random string.
- `getCustomCaption()` appends "(dynamic)" when the expression is set, and `check()` warns that the
  design-time `chartType` has become a fallback — the expression itself cannot be evaluated at design
  time, so what it can do is stop the static setting being read as the one that applies.

### Fixed

- **A malformed payload can no longer take down the page (C-01).** All parsing is now safe and
  returns a result; nothing throws. The chart shows a contained error state instead. Where a value is
  exactly 200 characters the message names the Mendix default String length as the likely cause,
  because a truncated attribute is invisible from the page and reads as a broken data source (P-05).
- **Nothing is rebuilt per render (C-02).** Parsing and the configuration merge are memoised on the
  raw JSON *text*, not on prop identity, and compiled function properties are cached by source. Mendix
  hands out new prop instances freely, so identity-keyed memoisation re-parsed on every render — and
  Nivo, seeing what it took to be new props, re-ran its transitions continuously.
- **`class`, `style` and `tabIndex` are applied (C-03).** 1.x declared all three and applied none, so
  every Atlas design property and every class set in Studio Pro was silently discarded — which from
  the app side looks like a CSS bug in perfectly correct SCSS.
- **`ValueStatus` is compared to the enum, and loading renders a skeleton (C-04, C-05).** 1.x rendered
  a div whose class had no CSS: a zero-height element, so loading and broken looked identical.
- **An empty payload renders the empty message, not an empty axis frame (C-11).**
- **An error boundary contains a Nivo throw (C-12)**, resetting when its inputs change.
- **One chart element is constructed per render, not 26 (C-06).** Does not yet fix the bundle — see
  below.
- **No console logging on the render path (C-08).** 1.x wrote whole datasets to the console on every
  render, in production. `check:layers` now fails the build on it.
- **`any` is confined to one boundary (C-10)** — the registry, where 26 mutually incompatible Nivo
  prop types genuinely meet one configuration payload. Everything else is typed.

### Added — design time

- **`check()`**, replacing the generated stub: configuration that will not parse, function bodies that
  will not compile or never return, height values that would render nothing, the Geo Map data-binding
  limitation, and a missing accessible label. Errors where the choice was deliberate, warnings where
  it was a default. Every rule verified by requiring the **built** `editorConfig.js` — the exact file
  Studio Pro loads.
- **A faithful static preview**, replacing `<div>{chartType}</div>` — thirteen hand-drawn SVG chart
  stand-ins, sized by the height properties, with no Nivo import. A grey box makes a page impossible
  to lay out and sizing properties impossible to judge.
- **`getCustomCaption()`** — the page tree now reads "Nivo Bar" rather than "Aq Nivo" eight times.
- **`getProperties()` deliberately hides nothing.** `containerHeight` and `aspectRatio` are
  mode-specific, but hiding them on `heightMode` would derive visibility from a property being edited
  in the same sheet — which reshapes the sheet in use and has been observed showing the wrong value
  against the right caption. Hidden properties are also unwritable by page tooling. `check()` warnings
  carry the same information at neither cost.

### Changed

- **Styles are injected from JS, and `src/ui/AqNivo.css` is gone.** One definition serves the runtime
  and `getPreviewCss()`. The old file styled none of the class names the code emitted.
- **`src/components/NivoChartContainer.tsx` is replaced** by a Mendix-free `NivoChart` plus a chart
  registry, so the preview and the runtime can share an implementation and the logic is unit-testable
  with no Mendix runtime.
- **`jest.config.js` uses `testRegex`, not the inherited `testMatch`** — see `docs/build-notes.md`.
  A checkout under a dot-directory on Windows makes the inherited glob match nothing while reporting
  it as a problem with the spec files.
- `@types/big.js` restored: `decimal` properties arrive as `Big`, so it is used now.

### Added — code splitting (B-01)

Backfilled: these three sections record work already in `main`, which the changelog had not caught
up with. Written from the commits rather than from memory.

- **Each Nivo package is loaded on demand.** `charts/registry.tsx` reaches every chart through a
  dynamic `import()`, and `rollup.config.mjs` swaps `output.file` for `output.dir` so Rollup can
  emit chunks. A page draws one chart and until now paid for all twenty-six: the dev entry bundle
  went **4,592,154 → 159,459 bytes**, with one chunk per package. The element suspends while its
  chunk arrives, and the fallback is the loading state rather than the empty one — the data is fine,
  the code has not landed.

### Added — data source mode and click-through (P-03)

- **New property `Data from` (`dataMode`)**, `JSON string` or `Data source`. Data source binds an
  ordinary Mendix list and maps attributes onto chart keys through the new `Columns` and `Series`
  properties, so no JSON is written anywhere. Eight chart types stay JSON-only — a flat row list
  does not contain a tree, a graph, a matrix or GeoJSON — and `check()` says which.
- **The widget never aggregates and never pages.** A Mendix data source cannot be asked for grouped
  rows, so the rows must arrive at chart granularity; charting one page and presenting it as the
  whole is not slow, it is wrong, and it looks entirely plausible.
- **New property `On click` (`onClickAction`)**, which carries the Mendix row a datum was drawn from
  into a microflow — the chart becomes a way into the data rather than a picture of it. It declares
  its `dataSource`, without which the action still fires and the microflow silently receives
  nothing. Series-level charts (Stream, Bump, Area Bump) cannot identify one row and are warned
  about at design time, as is a Line without `useMesh`, whose points have no click handler at all.
- **Fixed: Nivo Bar strips every falsy value from the datum it hands your callbacks** on its
  *stacked* path, so a row handle of `0` vanished and the first bar — only the first — was silently
  un-clickable. The handle is now the opaque string `"r<index>"`, which is truthy and survives.
  The grouped path passes the datum raw, so the two group modes genuinely differ.

### Added — Atlas theming (P-11)

- **New property `Match app theme` (`atlasTheme`), default `Full`.** A chart takes its look from the
  app's own Atlas theme, so a placement no longer has to carry a hand-written theme block to stop
  looking like a stock Nivo demo. `Full` applies the chrome and a brand-derived series palette,
  `Chrome only` applies the chrome and leaves series colour to Nivo, `Off` applies nothing.
- **The theme is read from the app's CSS custom properties while the chart is on screen**, not
  copied at design time. An Atlas app switches theme by putting a class on the root element, so the
  tokens are re-read on a root attribute change and on a `prefers-color-scheme` change: a chart
  follows a light-to-dark switch without a reload, and a theme scoped to one panel themes only the
  charts inside it. State is written only when a token *value* differs, so unrelated DOM activity
  cannot restart Nivo's transitions.
- **Colour tokens are resolved to `rgb()` before they reach Nivo.** Atlas builds its shades with
  `color-mix()`, and an unregistered custom property's computed value is the token stream, not a
  colour — so `getComputedStyle` hands back `color-mix(in srgb, ...)` verbatim. Nivo derives label
  and border colours with d3-color, whose parser returns `null` for that and for the `color(srgb …)`
  form a browser produces when it does evaluate one. See `src/theme/atlasTokens.ts`.
- **`atlasTheme` is the bottom configuration layer.** Anything in the static or dynamic
  configuration overrides it. `theme` alone is deep-merged rather than replaced — Nivo itself
  deep-merges a `PartialTheme`, so adjusting one font size must not discard the rest of the app's
  look. Everything else, `colors` included, still replaces wholesale.
- **The palette applies to the 18 chart types that take an ordinal `colors`.** The other eight are
  listed in `CHART_PALETTE_SUPPORT` with the reason each is excluded; `Calendar` and `TimeRange` are
  the ones worth knowing, because their `colors: string[]` would accept the palette and produce a
  value ramp made of four unrelated hues. `check()` reports the pairing at design time.
- **Nothing about setting colours yourself changed.** All five forms of Nivo's
  `OrdinalColorScaleConfig` still work from the static or dynamic configuration and still win over
  the Atlas palette: a scheme (`{"scheme": "category10"}`), an explicit array, a single static
  colour, a datum accessor (`{"datum": "data.color"}`), or a function via a named marker
  (`"@fn:prop:data.color"`). Setting `colors` alongside `Full` raises a design-time *warning*, not an
  error — it names the state where a chart keeps its own palette while its text and axes follow the
  app, which is reasonable to want and confusing to meet by accident. `Chrome only` says the
  override was deliberate.
- **Worth knowing, and unchanged by this release:** a `color` field sitting in the payload is **not**
  read on its own. Verified in the installed 0.99 packages — Pie, Bar and Line all default `colors`
  to `{scheme: "nivo"}`, a scheme rather than a datum accessor — so per-datum colour needs
  `{"datum": "data.color"}` or the marker form to be configured before Nivo looks for it.

### Still not done — the rest of 2.0

Accessibility (P-12) — a tabular alternative for screen readers — and interactivity beyond Bar and
Line, scoped by click-payload family rather than by chart type. `npm run prerelease` passes;
`docs/known-unverified.md` lists what only a running app can confirm, and theming is on it.

## 1.0.0 — 2023-02-20

Initial release. 26 Nivo chart types behind one property surface, with static, dynamic and function
configuration.
