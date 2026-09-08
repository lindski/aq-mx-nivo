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

**Written 2026-09-08 and ready to hand over. Not yet published** — that step is the guidance session's.
The handover is `.aq/guidance-handover.md` in this repo, produced against **Studio Pro 11.12.4**,
**AqNivo 2.0.0**, `@nivo/*` **0.99.0**. It has four parts:

| Part | Contents | Becomes | State |
|---|---|---|---|
| **A** | Directory entry — `widgetId`, slug, aliases, summary, `useWhen`, `useInstead`, `verification` | a record in `widgets.json`, served by `list_widgets` | written; `verification: "verified"` |
| **B** | The reference — page-JSON skeleton **read back** with `pg_read_page`, valid property combinations, model prerequisites | the published reference | written from two working pages plus the check harness |
| **C** | The captured VFS auto-schema and how it differed from the XML | a cross-check for the maintainer; **not published** | captured and verified — parses, and its 19 property keys match the XML exactly |
| **D** | The rendered DOM class tree | the record's `design.snapshot` | captured from the running app, `fidelity: "captured"` |

**Part A is the half that decides whether anyone finds the widget** — a reference that is published but
not in the directory is unreachable in practice.

**Six things are named as unverified**, field by field, in the handover's own Rule 3 table rather than
hedged in prose: `heightMode: "fillParent"` serialisation, `conditionalVisibilitySettings` on this
widget, `appearance.class` on this widget specifically, a valid `chartTypeExpression` driven at runtime,
`functionProperties` under a CSP without `unsafe-eval`, and datasource mode above ~2,000 rows. Each
carries what it would cost to close.

No `gate` applies. Nivo is MIT, all 25 packages ship inside the `.mpk`, and there is no trial mode.

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

## The geographic chart facts are in the handover, at §4.5

Added 2026-09-08 and written straight into `.aq/guidance-handover.md` rather than duplicated here.
They are page-authoring facts specifically — they change what someone *designs*, not just what they
debug — which is why they belong in the published reference and not only in
[known-unverified.md](known-unverified.md).

In short: **a Geo Map cannot be styled with `fill` match rules, however much Nivo implies it can.**
`GeoMapDefaultProps` declares `fill` and `defs`, Nivo's own documentation lists both, and the GeoMap
component reads neither — `bindDefs` is called only from `Choropleth`. The route that works is
`fillColor` as an accessor. And **Geo Map answers *where*, Choropleth answers *how much*** — whenever
there is a value per country, Choropleth is the right chart.

Two adjacent Nivo defects are **absorbed in widget code** so a page author never meets them: a missing
`features` renders the empty state instead of throwing, and `layers` is supplied for `GeoMapCanvas`,
the only Nivo component that fails to default it. **Both are workarounds with an expiry** — see
`charts/nivoDefects.ts`, and re-check them on any Nivo upgrade.
