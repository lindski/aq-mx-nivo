# AqNivo

Nivo data visualisation for Mendix — 26 chart types behind one property surface.
Wraps [nivo](https://github.com/plouc/nivo).

Pick a chart type, bind the data, and configure it with JSON. One widget rather than 26 keeps the
toolbox usable and makes the chart type a property rather than a re-placement.

> **2.0 is in progress and is a breaking rebuild.** The widget id changed, so **every placed instance
> of 1.0.0 must be re-placed by hand**. See [CHANGELOG.md](CHANGELOG.md). Behaviour is still 1.x
> behaviour — the foundations landed first.

## Requirements

| | |
|---|---|
| Mendix Studio Pro | 11.12 or later (developed against 11.12.4) |
| Node (development only) | **≥ 22.20** — see [docs/build-notes.md](docs/build-notes.md); the declared `>=20` is not the effective floor |
| Licence | Apache-2.0. Nivo itself is MIT — **no entitlement or gate applies** |

## Features

- **26 chart types in one widget**, selected by an enumeration property.
- **Layered configuration** — static (typed into the widget), dynamic (bound to an attribute) and
  function properties, merged in that order, so a later layer overrides an earlier one. Function
  properties exist because Nivo takes *functions* for tooltips, value formatters and colour
  accessors, and JSON cannot carry those.
- **SVG rendering.** Canvas variants are 2.0 work.

## Usage

1. Add the widget to a page and choose a chart type.
2. Bind the data attribute. **It must be Unlimited** — the Mendix 200-character default truncates
   chart JSON into malformed JSON, and the symptom is a parse warning in the browser console that
   reads as a broken generator rather than a too-short column.
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

## Architecture

| | |
|---|---|
| `src/AqNivo.tsx` | The Mendix adapter — **the only file permitted to import `mendix`** |
| `src/AqNivo.xml` | Property surface. `<description>` text is carried verbatim into the page tooling's schema, so it is documentation, not hover text |
| `src/AqNivo.editorConfig.ts` | Design time — `getProperties`, `check`, `getCustomCaption` |
| `src/AqNivo.editorPreview.tsx` | The page-editor rendering |
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

**The Mendix test app is a separate repository**, on Team Server; this one is on GitHub. Only the
built `.mpk` crosses between them, and it is committed from the app side. Point the build at the test
app with **`MX_PROJECT_PATH`** rather than editing `config.projectPath` — the environment variable
wins, and needs no committed change.

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
