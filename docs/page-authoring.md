# Page authoring — pointer, not a copy

**The page-authoring reference for this widget lives in `@auraq/guidance`, not here.**

```
list_widgets()                                      <- is it registered, and is it gated?
get_widget_reference("com.auraq.aqnivo.AqNivo")     <- the reference itself
```

This file is deliberately a pointer. Two copies of one reference drift apart, and the drift is
silent — the copy that is wrong is the one someone reads.

## Why the auto-schema is not the answer either

Installing this widget makes Mendix generate `/pagegen/customWidgetsVFS/com.auraq.aqnivo.AqNivo.schema.json`.
That schema is **structurally complete and semantically empty**: every property, every type, every
enumeration value and every `<description>` is there — and none of the following is, because none of
it can be:

- **Required-ness.** `required="true"` in the widget XML is nowhere in the schema.
- **Every conditional-visibility rule** from `getProperties()`, and **every cross-property rule** from
  `check()` — those live in code.
- **Every model prerequisite** — which attributes must be Unlimited, what shape a datasource must
  already be aggregated to, what carries a click payload.

For this widget the third of those is most of the document. A chart bound to a paged datasource that
the app has not pre-aggregated produces a subtotal presented as a total: not slow, **wrong**, and
entirely plausible-looking. No schema can express that, so the reference must.

## Status

**Not yet published.** The reference is written at the end of the 2.0 rebuild, as
`.aq/guidance-handover.md` in this repo, and handed to a guidance session. It has three parts:

| Part | Contents | Becomes |
|---|---|---|
| **A** | Directory entry — `widgetId`, slug, aliases, summary, `useWhen`, `useInstead`, `verification` | a record in `widgets.json`, served by `list_widgets` |
| **B** | The reference — page-JSON skeleton **read back** from a working page with `pg_read_page`, valid property combinations, model prerequisites | the published reference |
| **C** | The captured VFS auto-schema and how it differed from the XML | a cross-check for the maintainer; not published |

**Part A is the half that decides whether anyone finds the widget** — a reference that is published
but not in the directory is unreachable in practice.

No `gate` applies. Nivo is MIT.

## The reference now carries more weight than it did

**As of the description-shortening pass, `AqNivo.xml`'s `<description>` text is one or two sentences
per property.** It is hover text in a property sheet, where a paragraph is unreadable, and the detail
moved to [README.md](../README.md#property-reference).

That is a deliberate trade with a cost attached, and this file is where the cost lands. Mendix copies
each description **verbatim** into the auto-schema, so shortening them moved detail *out* of the one
path a page-authoring agent reads automatically. Nothing else fills that gap.

So when Part B is written:

- **Carry the silent-failure facts in full.** The Unlimited-length requirement on both String
  attributes, the pre-aggregation requirement on the data source, that a click needs Data source
  mode, and that a container of zero height renders nothing with no error. Each of these fails
  *silently* and none is expressible in the schema.
- **Carry the two lists of eight, and the fact that they differ.** The chart types with no data-source
  shape and the chart types with no palette overlap in only three places, and an agent that conflates
  them will confidently recommend an impossible binding.
- The README is the source to lift from; keep the two in step or say plainly which one wins.

## Part B must carry the two geographic chart facts

Added 2026-09-08. These are page-authoring facts specifically — they change what someone *designs*,
not just what they debug, which is why they belong in the published reference rather than only in
[known-unverified.md](known-unverified.md).

**A Geo Map cannot be styled with `fill` match rules, however much Nivo implies it can.**
`GeoMapDefaultProps` declares `fill: []` and `defs: []` and Nivo's own documentation lists both, but
the GeoMap component reads neither — `bindDefs` is called only from `Choropleth.js`. A page author
who designs a rule-styled base map from the documentation will produce a configuration that is
accepted, ignored, and reports nothing.

The route that works is `fillColor` as an **accessor**, which both the SVG and Canvas renderers
honour: put the colour on each feature and read it back with the function-marker registry —

```json
{ "fillColor": "@fn:prop:properties.fill", "features": [ { "type": "Feature", "id": "GBR", "properties": { "fill": "#2f6fb5" }, "geometry": { } } ] }
```

Do **not** reach for the shortcut of a top-level `fill` on each feature. `GeoMapFeature` renders
`fill={feature?.fill ?? fillColor}`, so it styles the SVG with no configuration change at all — and
is silently ignored by Canvas, which reads `getFillColor(feature)` and never looks at the feature.
The accessor form is what makes the two renderers agree.

**And say which chart is which.** Geo Map is a base map with no value scale: it answers *where*, and
is styled by rule. Whenever there is a value per country, Choropleth is the right chart. Both need a
`features` collection in the configuration; neither takes one any other way, and a GeoJSON world
collection is ~250 KB, which is far too large for a microflow literal — read it from `resources/` at
seed or load time.

The widget absorbs two Nivo defects around this so a page author never meets them: a missing
`features` now renders the empty state instead of throwing, and `layers` is supplied for
`GeoMapCanvas`, which is the only Nivo component that fails to default it. **Both are workarounds
with an expiry** — see `charts/nivoDefects.ts`. If Part B ever claims a Nivo version where they are
fixed, re-check.
