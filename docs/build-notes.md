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

| | 1.0.0 (`.mpk`, dev) | 2.0.0 foundations (`.mpk`, dev) |
|---|---|---|
| `AqNivo.js` | 4,832,718 B | 4,520,926 B |
| `AqNivo.mjs` | 4,723,862 B | 4,455,412 B |
| `.mpk` total | 2,887,006 B | 2,280,732 B |
| `AqNivo.editorPreview.js` | 5,561 B | 5,434 B |
| `AqNivo.editorConfig.js` | 868 B | 791 B |

The reduction is Nivo's, not ours — nothing has been code-split yet. **Every `@nivo` package is
still statically reachable**, because all 26 chart elements are constructed in an object literal
before one is selected. That is the whole of B-01 and it is untouched by these foundations.

The design-time bundles are small **only because the preview renders a `<div>` containing the enum
key**. Implementing a real preview without a static stand-in would drag Nivo into a bundle Studio Pro
loads on project open — the measured cost of that mistake on a comparable widget was an
`editorPreview.js` of 5,384,494 B.

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
