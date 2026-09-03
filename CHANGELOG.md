# Changelog

All notable changes to AqNivo are recorded here. This project follows [semantic versioning](https://semver.org/).

## 2.0.0 — unreleased

**Breaking.** 2.0 changes the widget's identity and will change its property surface. Every placed
instance of 1.0.0 must be re-placed by hand; there is no migration and Studio Pro will not offer one.

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

### Still not done — the rest of 2.0

Code splitting (B-01 — a page using one chart still pays for all 26), datasource mode, click-through
and selection, the Atlas theming hook, Canvas variants, and a tabular alternative for screen readers.
`npm run check:layers` and `npm test` both pass; `docs/known-unverified.md` lists what only a running
app can confirm.

## 1.0.0 — 2023-02-20

Initial release. 26 Nivo chart types behind one property surface, with static, dynamic and function
configuration.
