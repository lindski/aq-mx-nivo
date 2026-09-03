# Build notes

Platform facts learned building this widget, graded. **Verified in source** — read out of the
tooling's own code. **Verified by observation** — reproduced here, in this repo, on this machine.
**Single observation** — happened once, cause reasoned but not isolated.

Environment these were established on: Windows 11, **Node 22.18.0**, npm 10.9.3,
`@mendix/pluggable-widgets-tools` **11.12.0**, React 19.0.0, Nivo 0.99.0, target Mendix **11.12.4**.

---

## The effective Node floor is higher than anything declares it

**Verified by observation, 2026-09-03.** `@mendix/pluggable-widgets-tools@11.12.0` declares
`engines.node: ">=20"`. On Node 22.18.0 the build fails anyway, in the packaging step:

```
Error: Cannot find module '@napi-rs/lzma-win32-x64-msvc'
  [cause] Error: Cannot find module './lzma.win32-x64-msvc.node'
```

The chain is `pluggable-widgets-tools@11.12.0 → zip-a-folder@^6.1.1 → @napi-rs/lzma@^1.5.1`, and
**`@napi-rs/lzma@1.5.1` declares `engines.node: "^22.20 || ^24.12 || >=25"`**. npm reports that as a
non-fatal `EBADENGINE` warning, skips the platform-specific optional binary, and the build then dies
requiring it — several minutes and one command later, with a stack trace that names a native module
and nothing else.

So the real constraint is **transitive, floating, and two levels below anything you control**:
`^6.1.1` floated `zip-a-folder` to 6.2.0, which is where the native lzma arrived. Reading PWT's own
`engines` tells you nothing about it.

**Two fixes, and we took the second:**

| | |
|---|---|
| Move to Node ≥ 22.20 | Correct, and satisfies PWT 11.12.0, PWT 11.13.0 (`^22.18.0`) and lzma at once. Rejected here only because switching an nvm-for-Windows version repoints the global `node_modules` that this developer's MCP servers are installed into |
| Pin `zip-a-folder` to **6.1.1** via `overrides` | **Inside PWT's own declared `^6.1.1` range** — the floor of it, not a downgrade past it. 6.1.1 uses the pure-JS `lzma@^2.3.2`, so no native binary is involved at all |

**Revisit the pin whenever Node moves.** It is a workaround for one machine's Node version, not a
property of the widget, and it should come out once the floor is ≥ 22.20.

## `packagePath` does not name the directory inside the `.mpk` — the widget id does

**Verified by observation, both versions.** The emitted directory is the **widget id minus the widget
name**, dots to slashes:

| Version | Widget id | Emitted to | `.mpk` filename (`packagePath`) |
|---|---|---|---|
| 1.0.0 | `auraq.aqnivo.AqNivo` | `auraq/aqnivo/` | `auraq.AqNivo.mpk` |
| 2.0.0 | `com.auraq.aqnivo.AqNivo` | `com/auraq/aqnivo/` | `com.auraq.AqNivo.mpk` |

`src/package.xml` is copied into the `.mpk` **verbatim**, so nothing in the build compares its
`<file path>` against either. A mismatch **packages cleanly** — the archive is valid, the widget
installs, and the client module simply points at a directory that is not in it.

`scripts/check-layers.mjs` rule 6 exists for precisely this, and it is not hypothetical: a sibling
AuraQ widget is shipping today with `id="com.auraq.aggrid.AgGrid"` against
`<file path="auraq/aggrid" />`.

## The 10.x → 11.x upgrade traps, as actually met

**Verified by observation.** Of the four documented traps, two fired here and two did not:

- **Fired — `TS6133` on `createElement`.** The 11.x toolchain uses the automatic JSX runtime with
  `noUnusedLocals`, so the Mendix 10.x idiom `import { createElement } from "react"` becomes a build
  failure. It reports **one file at a time**, so expect one rebuild per `.tsx` file. Three files here.
- **Did not fire — `TS2503`, React 19 removing the global `JSX` namespace.** This source never used
  `JSX.Element`; it annotates with `ReactElement` throughout. Expect it in a codebase that does.
- **Did not fire — the "Update dependencies?" prompt.** Installing React 19 explicitly through
  `resolutions`/`overrides` *before* the first build meant PWT reported `Dependencies up-to-date.`
  and never asked. That prompt deletes the lockfile and `node_modules` and force-installs, so
  arriving at the first build with the dependency tree already correct is worth doing deliberately.
  Builds here are run with stdin closed as a second line of defence.
- **Did not fire — React Compiler lint rules.** `npm run lint` passes with two warnings and no
  errors. Nothing in 1.x holds a ref across render.

## Jest's `testMatch` cannot survive a checkout under a dot-directory on Windows

**Verified by observation, 2026-09-03.** The toolchain's Jest config globs
`<rootDir>/**/*.spec.{js,jsx,ts,tsx}`. This repository lives under `…/dev/.aq/aq-mx-nivo`, and
`<rootDir>` expands to a path with **mixed separators**, so the pattern Jest actually evaluates is:

```
C:/Users/IainLindsay/Documents/dev\.aq/aq-mx-nivo/src/**/*.spec.{js,jsx,ts,tsx}
```

In a glob a backslash is an **escape character**. `dev\.aq` therefore reads as `dev` followed by a
literal `.aq` with no separator between them, and the pattern matches nothing. Jest reports:

```
No tests found, exiting with code 1
  14 files checked.
  testMatch: …/src/**/*.spec.{js,jsx,ts,tsx} - 0 matches
  testPathIgnorePatterns: \\node_modules\\ - 14 matches
```

That reads as a problem with the spec files — it names them, counts them, and says they were
checked — rather than with the directory they sit under. Two of the three numbers are even correct.

**The fix is `testRegex`**, which has no escaping. Jest refuses both at once, so `jest.config.js`
sets `testMatch: undefined` alongside it.

**Generalises beyond Jest**: any tool that interpolates a Windows path into a glob will do this, and
an AuraQ widget checkout normally *is* under `.aq/`. Suspect it whenever a path-based match finds
nothing in a directory that demonstrably contains the files.

## Nivo 0.80 → 0.99 compiled with no type errors, and that proves less than it looks

**Verified by observation, and read carefully.** The build succeeded against Nivo 0.99.0 without a
single type change. That is **not** evidence of compatibility: `NivoChartContainerProps.data` and
`.configuration` are both `any`, and `CHART_TYPES` is `any`, so one `{...configuration}` spread
typechecks across 26 mutually incompatible Nivo prop types. **TypeScript is contributing nothing
here** (C-10), and a renamed or removed prop will surface only at runtime, inside Nivo.

The rename question is therefore still open, and it is answered by rendering the samples, not by
building. See `known-unverified.md`.

One structural change is already visible in the dependency tree: **theming has moved out of
`@nivo/core` into `@nivo/theming`**, and `@nivo/text` is new.

## Bundle baseline

**Verified by observation.** Measured on a **dev** build (`npm run build`) — *not* comparable to a
release build, which is several times smaller and is the only figure worth quoting anywhere:

| | 1.0.0 | 2.0.0 foundations | 2.0.0 property surface |
|---|---|---|---|
| `AqNivo.js` | 4,832,718 B | 4,520,926 B | 4,594,581 B |
| `.mpk` total | 2,887,006 B | 2,280,732 B | 2,346,641 B |
| `AqNivo.editorPreview.js` | 5,561 B | 5,434 B | 55,539 B |
| `AqNivo.editorConfig.js` | 868 B | 791 B | 14,156 B |

**Every figure here is from a `build`, not a `release`** — several times smaller is what a release
gives, and a release figure is the only one worth quoting anywhere.

The runtime bundle grew ~74 KB for the whole property surface, the safe parsing, the error boundary
and the injected styles. **B-01 is untouched**: every `@nivo` package is still statically imported by
`src/charts/registry.tsx`, so all 26 are still in the bundle. What changed is that only the *selected*
chart is now constructed — 1.x built all 26 React elements on every render and discarded 25 (C-06).
The registry indirection exists so that code splitting is later a change to that one file.

**The design-time bundles are the number to watch, and they are healthy.** `editorPreview.js` grew
from 5 KB to 55 KB by gaining a real preview — thirteen hand-drawn SVG chart stand-ins — and
`editorConfig.js` from 0.8 KB to 14 KB by gaining `check()`. Both remain Nivo-free, confirmed by
grepping the built bundle: the only `nivo` matches are CSS class names and enum key strings, with no
`@nivo/core`, `useTheme`, `d3Scale` or `react-spring`. For scale, the same mistake made on a
comparable widget produced an `editorPreview.js` of 5,384,494 B. **Grep the bundle rather than
trusting the layering rule** — the rule is textual and a determined import can route around it.

## `projectPath` falls through harmlessly when it points at nothing

**Verified in source and by observation.** `config.projectPath` still reads `./tests/testProject`,
which no longer exists. The build succeeds and simply skips the copy step — a candidate only counts
if the directory exists. Set **`MX_PROJECT_PATH`** to the test app instead; it wins over
`config.projectPath` and needs no committed change.

Re-check the resolution order on any PWT upgrade — it is internal to the tooling and has changed
across versions.

## `npm audit`: report the two populations separately

**Verified by observation.** `npm audit` reports **6 high severity** advisories; `npm audit --omit=dev`
reports **0**. The `.mpk` ships runtime dependencies and none of the dev toolchain, so the combined
figure mixes two populations with very different consequences and gets ignored wholesale.
**`--omit=dev` is the number that matters**, and here it is clean.
