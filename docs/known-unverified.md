# Known unverified

What this repository **cannot** prove, and what to check first in a running app. Everything here can
be built, linted and packaged outside Mendix; almost none of it can be *verified* there.

Keep this file honest. A claim that moves from here into `build-notes.md` should move because
something was observed, not because it seemed likely.

Status as of **2026-09-03**, after the 2.0 foundations work (Phase 0). The widget's behaviour is
still 1.x behaviour — only the toolchain, identity and release discipline have changed.

---

## Check these first, in this order

### 1. Does the renamed widget load at all?

The id, `packagePath` and internal files path all changed together. Nothing in the build compares
them, and a mismatch packages cleanly.

- Delete `widgets/auraq.AqNivo.mpk`, install `com.auraq.AqNivo.mpk`, run **Clean Deployment
  Directory**, then F4.
- A widget that fails to load reports **"Could not find widget"** on every page using it — which
  names no cause.
- Read `deployment/log/app_bundle_log.txt` rather than the dialog. Studio Pro's second bundler
  reports failures with **an empty error string** in the dialog itself.

### 2. Do the 26 sample configurations still render under Nivo 0.99?

**This is the open question the build cannot answer.** The upgrade from 0.80 compiled with zero type
errors, but every payload path is typed `any`, so a renamed or removed Nivo prop surfaces only at
runtime, inside Nivo.

The old samples are live in the test app as the `NivoTestDataOld` module. Render each one and record
what breaks. Where a sample and the Nivo 0.99 documentation disagree, **the documentation wins** —
nothing depends on the 0.80 shapes surviving, because there is no existing consumer to migrate.

Known structural change to look at first: **theming moved out of `@nivo/core` into `@nivo/theming`**.

### 3. Is the `zip-a-folder` pin still needed?

`overrides` pins it to 6.1.1 to avoid a native `@napi-rs/lzma` binary that will not install on Node
22.18.0. That is a property of one machine's Node version, not of this widget. On Node ≥ 22.20,
remove the override and confirm the build still packages.

---

## Unverified by nature — these need a running app, always

- **`new Function` and Content-Security-Policy.** Function properties compile with `new Function`,
  which requires `unsafe-eval`. If Mendix Cloud's default policy omits it, the feature is **inert in
  production while working perfectly locally**. Untested. This is the worst-shaped failure in the
  widget: it cannot be found in development.
- **Malformed JSON takes down the page, not just the widget.** Three unguarded `JSON.parse` calls run
  inside render. Reasoned from React's error semantics in the Mendix client; not reproduced here.
- **The 200-character truncation path.** A String attribute left at the Mendix default truncates chart
  JSON into malformed JSON, landing on the above. Documented as the most likely first experience of a
  new user; not measured.
- **Any design-time change.** Studio Pro loads a widget's design-time JS **when the project is
  opened** and caches it for the life of that project. After any `editorConfig.ts` change: confirm the
  `.mpk` timestamp actually moved, then close and reopen the project. A rebuilt `check()` otherwise
  silently does nothing, and the symptom — two unrelated design-time features broken together —
  points at a bad import rather than a stale host.
- **Release bundle size.** Every figure in `build-notes.md` is from a **dev** build. `build` and
  `release` write the same path, and a stale dev artefact is indistinguishable by name, location or
  apparent validity — it installs and runs correctly. Delete `dist/<version>/` first, run
  `npm run release`, and confirm the artefact carries `dependencies.txt`/`.json`.
- **Whether `type="selection"` is usable for a chart datum.** It is the sanctioned route from a
  widget's selection to a microflow, and it publishes a page variable that a microflow parameter
  binds to — but it was verified on a grid, where a "row" is obviously an object. Whether a chart
  datum reads naturally the same way is untested.

---

## Not yet true, and known not to be

Listed so nobody mistakes an unfinished thing for a broken one. All of this is 2.0 Phase 2 work:

- `check:layers` reports **8 violations** in the 1.x source. That is the starting point, not a
  regression — seven console calls on the render path, and one generated-typings import from a
  component that must become Mendix-free.
- `npm test` runs **zero** tests and passes via `--passWithNoTests`. There is no Mendix-free layer to
  test yet; the flag comes out in the same commit as the first test.
- `editorConfig.ts` is still the generated stub — `getProperties` returns `defaultProperties`
  unchanged, `check` returns `[]`, and there is no `getCustomCaption`.
- The page-editor preview still renders `<div>{chartType}</div>` — the literal enum key.
- Nothing is code-split. Every `@nivo` package is statically reachable, because all 26 chart elements
  are constructed before one is selected.
- There are no system properties, no action properties, no theming hook and no accessibility surface.
