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

### Not yet done — tracked for the rest of 2.0

The correctness, property-surface, design-time, code-splitting, datasource, interactivity, theming
and accessibility work. `npm run check:layers` currently reports **8 violations** in the 1.x source,
and that is the intended starting point rather than a regression: seven console calls on the render
path, and one generated-typings import from a component that must become Mendix-free.

## 1.0.0 — 2023-02-20

Initial release. 26 Nivo chart types behind one property surface, with static, dynamic and function
configuration.
